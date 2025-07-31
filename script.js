import { GoogleGenAI, Type } from "@google/genai";

// --- CONFIGURATION & SETUP ---
// Hardcoded API key for local testing ONLY
function getApiKey() {
    const key = "AIzaSyAVPgy-ym2qkHn62HfHAHPhmomBlL2fuEk"; // Your Gemini API key
    sessionStorage.setItem('gemini_api_key', key);
    return key;
}

const API_KEY = getApiKey();
let ai;

if (API_KEY) {
    ai = new GoogleGenAI({ apiKey: API_KEY });
} else {
    console.warn("API Key not provided. The application will not function.");
}

// --- SCHEMA DEFINITIONS ---
const recipeSchema = {
    type: Type.OBJECT,
    properties: {
        recipeName: { type: Type.STRING, description: "The name of the recipe." },
        description: { type: Type.STRING, description: "A short, enticing description of the recipe." },
        ingredients: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "A list of ingredients with quantities."
        },
        instructions: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Step-by-step cooking instructions."
        },
    },
    required: ["recipeName", "description", "ingredients", "instructions"],
};

const analysisSchema = {
    type: Type.OBJECT,
    properties: {
        estimatedNutrition: {
            type: Type.OBJECT,
            properties: {
                calories: { type: Type.NUMBER },
                protein: { type: Type.NUMBER },
                carbs: { type: Type.NUMBER },
                fat: { type: Type.NUMBER },
            },
            required: ["calories", "protein", "carbs", "fat"],
        },
        healthAnalysis: { type: Type.STRING },
        suggestedRecipes: {
            type: Type.ARRAY,
            items: recipeSchema,
        },
    },
    required: ["estimatedNutrition", "healthAnalysis", "suggestedRecipes"],
};

// --- DOM REFERENCES ---
const analysisForm = document.getElementById('analysis-form');
const mealInput = document.getElementById('meal-input');
const submitButton = document.getElementById('submit-button');
const resultsContainer = document.getElementById('results-container');

// --- API CALL FUNCTION ---
async function analyzeMealAndSuggestRecipes(mealInputValue) {
    if (!ai) throw new Error("Gemini AI client is not initialized.");

    const prompt = `
        Analyze the nutritional content for the following meal or list of ingredients: "${mealInputValue}".
        Provide estimated nutritional information (calories, protein, carbs, fat).
        Also give a brief health analysis.
        Then suggest 2–3 healthy recipes based on this input.
        Return the result as a valid JSON object, following this schema exactly: no text before or after the JSON.
    `;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: analysisSchema,
            temperature: 0.7,
        },
    });

    const jsonText = response.text.trim();
    return JSON.parse(jsonText);
}

// --- HTML TEMPLATES ---
const createLoadingSpinnerHTML = () => `
    <div class="flex flex-col items-center justify-center p-12 bg-base-100 rounded-2xl shadow-lg text-center">
      <div class="w-16 h-16 border-4 border-t-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      <p class="mt-4 text-lg font-semibold">Analyzing your meal...</p>
      <p class="text-sm mt-2">This may take a moment.</p>
    </div>
`;

const createErrorHTML = (message) => `
    <div class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg shadow-md" role="alert">
      <div class="flex">
        <div class="py-1">
          <svg class="fill-current h-6 w-6 text-red-500 mr-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
            <path d="M10 0a10 10 0 1 0 10 10A10.011 10.011 0 0 0 10 0zm0 18a8 8 0 1 1 8-8 8.009 8.009 0 0 1-8 8zm-1-5a1 1 0 0 1 2 0v2a1 1 0 0 1-2 0v-2zm0-6a1 1 0 1 1 2 0 1 1 0 0 1-2 0z"/>
          </svg>
        </div>
        <div>
          <p class="font-bold">An Error Occurred</p>
          <p class="text-sm">${message}</p>
        </div>
      </div>
    </div>
`;

const escapeHTML = (str) => {
    if (typeof str !== 'string') return '';
    return str.replace(/[&<>"']/g, (match) =>
        ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[match])
    );
};

const createRecipeCardHTML = (recipe) => `
    <div class="bg-base-100 rounded-2xl shadow-lg overflow-hidden hover:scale-[1.02] transition">
      <div class="p-6">
        <h4 class="text-xl font-bold text-primary mb-2">${escapeHTML(recipe.recipeName)}</h4>
        <p class="mb-4">${escapeHTML(recipe.description)}</p>
        <div class="space-y-4">
          <div>
            <h5 class="font-semibold mb-2">Ingredients</h5>
            <ul class="list-disc list-inside space-y-1">
              ${recipe.ingredients.map(item => `<li>${escapeHTML(item)}</li>`).join('')}
            </ul>
          </div>
          <div>
            <h5 class="font-semibold mb-2">Instructions</h5>
            <ol class="list-decimal list-inside space-y-1">
              ${recipe.instructions.map(step => `<li>${escapeHTML(step)}</li>`).join('')}
            </ol>
          </div>
        </div>
      </div>
    </div>
`;

const createNutritionChartHTML = (nutrition) => {
    const { protein = 0, carbs = 0, fat = 0 } = nutrition;
    const total = protein + carbs + fat;
    if (total === 0) return '<p class="text-center">Not enough data to create a chart.</p>';

    const proteinPercent = (protein / total) * 100;
    const carbsPercent = (carbs / total) * 100;
    const fatPercent = (fat / total) * 100;

    return `
        <div class="bar-chart-container">
            <div class="bar-chart-row">
                <div class="bar-chart-label">Protein</div>
                <div class="bar-chart-bar" style="width: ${proteinPercent.toFixed(2)}%; background-color: #3B82F6;">
                    ${protein.toFixed(1)}g
                </div>
            </div>
            <div class="bar-chart-row">
                <div class="bar-chart-label">Carbs</div>
                <div class="bar-chart-bar" style="width: ${carbsPercent.toFixed(2)}%; background-color: #F59E0B;">
                    ${carbs.toFixed(1)}g
                </div>
            </div>
            <div class="bar-chart-row">
                <div class="bar-chart-label">Fat</div>
                <div class="bar-chart-bar" style="width: ${fatPercent.toFixed(2)}%; background-color: #EF4444;">
                    ${fat.toFixed(1)}g
                </div>
            </div>
        </div>
    `;
};

const createResultsHTML = (data) => `
    <div class="space-y-8 animate-fade-in">
      <div class="bg-base-100 rounded-2xl shadow-lg p-6 md:p-8">
        <h3 class="text-2xl font-bold mb-4">Nutritional Analysis</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="bg-base-200 p-6 rounded-lg">
            <h4 class="text-lg font-semibold mb-3">Health Summary</h4>
            <p>${escapeHTML(data.healthAnalysis)}</p>
          </div>
          <div class="bg-base-200 p-6 rounded-lg">
            <h4 class="text-lg font-semibold mb-3">Macronutrient Breakdown</h4>
            ${createNutritionChartHTML(data.estimatedNutrition)}
            <p class="text-center text-sm mt-3">Total Estimated Calories: <span class="font-bold">${data.estimatedNutrition.calories.toFixed(0)}</span></p>
          </div>
        </div>
      </div>

      <div>
        <h3 class="text-2xl font-bold mb-4">Suggested Recipes</h3>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          ${data.suggestedRecipes.map(createRecipeCardHTML).join('')}
        </div>
      </div>
    </div>
`;

// --- UI CONTROLS ---
function setUILoading(loading) {
    mealInput.disabled = loading;
    submitButton.disabled = loading;

    if (loading) {
        submitButton.innerHTML = `
            <svg class="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Analyzing...</span>
        `;
        resultsContainer.innerHTML = createLoadingSpinnerHTML();
    } else {
        submitButton.innerHTML = 'Analyze Meal';
    }
}

// --- EVENT HANDLER ---
analysisForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const mealInputValue = mealInput.value.trim();

    if (!mealInputValue) {
        resultsContainer.innerHTML = createErrorHTML("Please enter a meal or ingredients to analyze.");
        return;
    }

    if (!ai) {
        resultsContainer.innerHTML = createErrorHTML("API Key is not configured. Please reload and try again.");
        return;
    }

    setUILoading(true);

    try {
        const result = await analyzeMealAndSuggestRecipes(mealInputValue);
        if (result && result.estimatedNutrition && result.suggestedRecipes) {
            resultsContainer.innerHTML = createResultsHTML(result);
        } else {
            throw new Error("AI returned incomplete data.");
        }
    } catch (err) {
        console.error("Error analyzing meal:", err);
        let errorMessage = "Something went wrong. Try a simpler input or check your connection.";
        if (err.message.includes("API key not valid")) {
            errorMessage = "Invalid API Key. Please regenerate your key.";
        } else if (err.message.includes("400")) {
            errorMessage = "Bad input. Please simplify your meal description.";
        }
        resultsContainer.innerHTML = createErrorHTML(errorMessage);
    } finally {
        setUILoading(false);
    }
});
# Nnutrition

## Overview

**Nnutrition** is a smart meal planner web app that helps users understand the nutritional value of their meals and suggests healthier alternatives. By analyzing user input (meals or ingredients), it provides a detailed breakdown of calories, protein, carbs, and fats—along with 2–3 recipe suggestions. This tool is ideal for anyone looking to make healthier food choices using AI.

 **Demo Video:** [https://www.youtube.com/watch?v=pEwQ4a-CLcc](https://www.youtube.com/watch?v=pEwQ4a-CLcc)  

---

## Features

- **Nutritional Analysis:** Provides detailed breakdowns of calories, fat, protein, and carbs.
- **AI-Powered Insights:** Gemini-powered health insights for smarter meal planning.
- **Recipe Suggestions:** Suggests healthier recipes based on user input.
- **Error Handling:** Displays feedback for API failures or invalid inputs.
- **Responsive Design:** Mobile-friendly and optimized for all screen sizes.
- **Dockerized Deployment:** Easy to deploy and scale using Docker.

---

## Technologies Used

- **HTML, CSS, JavaScript:** Frontend structure, styling, and logic.
- **Gemini API:** For meal analysis and recipe suggestions.
- **Docker:** Containerized deployment for consistency across environments.
- **HAProxy:** Load balancing across multiple servers.

---

## Deployment Steps

## Image details

- **Docker Hub Repository URL:** [kgakwaya/nnutrition](https://hub.docker.com/r/kgakwaya/nnutrition)
- **Image Name:** kgakwaya/nnutrition
- **Tag:** v1

### 1. Build and Push the Docker Image

Build the Docker image from the project root to containerize the application:

```sh
 
docker build -t kgakwaya/nnutrition:v1 .
docker login
docker push kgakwaya/nnutrition:v1

### 2. Configure Docker Compose

Navigate to the deployment directory and review the docker-compose.yml file, which defines the services:

- **web-01**: Nginx server at 172.20.0.11, ports 2211:22 (SSH), 8080:80 (HTTP).
- **web-02**: Nginx server at 172.20.0.12, ports 2212:22 (SSH), 8081:80 (HTTP).
- **lb-01**: HAProxy load balancer at 172.20.0.10, ports 2210:22 (SSH), 8082:80 (HTTP).
Start all services:

### 3. SSH into the Load Balancer and Configure HAProxy

SSH into the load balancer:

Install HAProxy:

Edit /etc/haproxy/haproxy.cfg to define load balancing rules. Example configuration:

Restart HAProxy:

## Testing the Deployment

### 1. Access the Application via Load Balancer

From your host machine, access the app through the load balancer:

You should see the HTML content of your app.

### 2. Verify Load Balancing

Run the following multiple times:

Check the X-Served-By header; it should alternate between web01 and web02, confirming load balancing.

## Notes & Troubleshooting

If you encounter a port allocation error (e.g., Bind for 0.0.0.0:8080 failed), ensure no other process is using the port or stop previous containers.
Ensure your Docker image is pushed to Docker Hub and accessible.
To SSH into the web servers for debugging:

## Summary

- **Docker**: Containerizes and serves the app with Nginx.
- **Docker Compose**: Orchestrates the multi-container setup.
- **HAProxy**: Load balances requests between two web servers.
- **Testing**: Confirms both servers serve traffic via the load balancer.



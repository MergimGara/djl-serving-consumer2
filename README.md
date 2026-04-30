# DJL Serving Consumer

![Build](https://github.com/MergimGara/djl-serving-consumer2/actions/workflows/deploy.yml/badge.svg)
![Java](https://img.shields.io/badge/Java-21-orange?logo=openjdk)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.4.4-brightgreen?logo=springboot)
![Docker](https://img.shields.io/badge/Docker-multi--stage-blue?logo=docker)
![Azure](https://img.shields.io/badge/Azure-App%20Service-0078D4?logo=microsoftazure)

A Spring Boot consumer application that forwards image uploads to a [DJL Serving](https://djl.ai) model-service running ResNet18 image classification — deployable locally via Docker Compose or on **Azure Web Apps** as a multi-container stack.

---

## Architecture

```
Browser / Postman
      │
      ▼
┌─────────────────────┐        ┌──────────────────────────┐
│   web-service        │  HTTP  │      model-service        │
│  (this app)          │ ──────▶│  DJL Serving + ResNet18   │
│  Spring Boot :8082   │        │  deepjavalibrary :8080    │
└─────────────────────┘        └──────────────────────────┘
```

Both services are orchestrated via **Docker Compose** — locally and on Azure.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Language | Java 21 |
| Framework | Spring Boot 3.4.4 |
| HTTP Client | Spring WebFlux (WebClient) |
| Build | Maven (multi-stage Docker build) |
| Model Serving | DJL Serving 0.36.0 + ResNet18 |
| Containerization | Docker (multi-stage) + Docker Compose |
| CI/CD | GitHub Actions |
| Cloud | Azure App Service (multi-container) |

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/ping` | Health check |
| `POST` | `/analyze` | Upload an image → returns ResNet18 classification JSON |

### Example — `/analyze`

```bash
curl -X POST https://mdm-serving-garamer1.azurewebsites.net/analyze \
  -F "image=@cat.jpg"
```

**Response:**
```json
[
  {"className": "tabby, tabby cat", "probability": 0.412},
  {"className": "tiger cat", "probability": 0.281},
  {"className": "Egyptian cat", "probability": 0.198}
]
```

---

## Run Locally

### Prerequisites
- Java 21
- Maven
- Docker Desktop

### Without Docker

```bash
./mvnw spring-boot:run
```

App runs at `http://localhost:8082`  
> The consumer expects DJL Serving at `localhost:8080` when not dockerized.

### With Docker Compose

```bash
docker compose up
```

This starts both services:
- `web-service` → `http://localhost:80`
- `model-service` → internal only

---

## Docker

### Build Image

```bash
docker build -t mergimgara/djl-serving-consumer2:latest .
```

The Dockerfile uses a **multi-stage build**:
1. **Build stage** — JDK 21 + Maven compiles the JAR
2. **Runtime stage** — JRE 21 only (smaller image, no build tools)

### Push to Docker Hub

```bash
docker push mergimgara/djl-serving-consumer2:latest
```

---

## Azure Deployment

Deployed as a **multi-container Web App** on Azure App Service using Docker Compose.

**Live URL:** `https://mdm-serving-garamer1.azurewebsites.net`

```bash
az group create --name mdm-serving --location switzerlandnorth

az appservice plan create \
  --name mdm-serving \
  --resource-group mdm-serving \
  --sku B1 --is-linux

az webapp create \
  --resource-group mdm-serving \
  --plan mdm-serving \
  --name mdm-serving-garamer1 \
  --multicontainer-config-type compose \
  --multicontainer-config-file docker-compose-azure.yml
```

The `docker-compose-azure.yml` includes memory-optimized settings for Azure:

```yaml
environment:
  - SERVING_RESERVED_MEMORY_MB=64
  - SERVING_MIN_WORKERS=1
  - SERVING_MAX_WORKERS=1
  - JAVA_OPTS=-Xms64m -Xmx256m -XX:MaxMetaspaceSize=96m
```

---

## CI/CD

Every push to `main` triggers the GitHub Actions workflow:

1. **Build** — compiles and packages the Spring Boot app
2. **Push** — builds a linux/amd64 Docker image and pushes to Docker Hub

```
git push origin main
       │
       ▼
  GitHub Actions
       │
  docker build (amd64)
       │
  docker push → mergimgara/djl-serving-consumer2:latest
```

Workflow file: [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)

---

## Project Structure

```
djl-serving-consumer2/
├── src/
│   └── main/
│       ├── java/ch/zhaw/djl/consumer/
│       │   ├── ConsumerApplication.java
│       │   └── ConsumerController.java
│       └── resources/
│           ├── static/               # Web UI (HTML, CSS, JS)
│           └── application.properties
├── .github/workflows/
│   └── deploy.yml                    # CI/CD pipeline
├── Dockerfile                        # Multi-stage build
├── docker-compose.yml                # Local development
├── docker-compose-azure.yml          # Azure deployment
└── pom.xml
```

---

## MDM FS2026 — ZHAW

This project is part of the **Model Deployment & Maintenance** module at ZHAW.  
Author: `garamer1`

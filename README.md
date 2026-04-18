# 🎓 Scholarship Distribution System

A comprehensive, microservice-based platform designed to streamline the scholarship application process.  
This system bridges the gap between students and organizations by offering:

- Role-based portals  
- Integrated coding assessments  
- Real-time messaging  
- Automated lifecycle management for scholarship programs  

---

## 🚀 Local Setup & Installation

The application uses a **multi-container Docker architecture**, separating:

- Core API  
- Real-time communication service  
- Code evaluation service  

---

### 📌 Prerequisites

- Docker & Docker Compose  
- Git  

---

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/veervanshaj/scholarship-distribution-system.git
cd scholarship-distribution-system
```

---

### 2️⃣ Configure Environment Variables

Create a `.env` file in the backend root:

```env
# Database configuration
DATABASE_URL="postgresql://user:password@host:port/dbname?schema=public"

# Authentication
JWT_SECRET="your_super_secret_jwt_key_here"
```

> ⚠️ Redis URLs and internal routing are automatically handled by `docker-compose.yml`.

---

### 3️⃣ Build and Run Containers

```bash
docker-compose up --build -d
```

---

### 4️⃣ Access Services

| Service                     | URL                          |
|---------------------------|------------------------------|
| Frontend UI               | http://localhost:80          |
| Backend API               | http://localhost:5000        |
| WebSocket Server          | ws://localhost:4001          |
| Coding Test Microservice  | http://localhost:3000        |

---

### 🐳 Useful Docker Commands

```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f coding_service

# Stop everything
docker-compose down
```

---

## 🏗 System Architecture

```mermaid
graph TD
    Client([Web Client]) -->|HTTP :80| Frontend[Frontend: React + Vite + Nginx]
    Client -->|REST API :5000| Backend[Main Backend API]
    Client -->|WebSocket :4001| WS[WebSocket Server]
    
    Backend -->|Read/Write| DB[(PostgreSQL via Prisma)]
    Backend -.->|Job Queue / Cache| Redis[(Redis)]
    WS -.->|Pub/Sub| Redis
    
    Backend -->|Dispatch Code| Coding[Coding Test Microservice :3000]
    Coding -.->|Evaluation Results| Redis
```

---

## 🔄 Data Flow & Component Interaction

### 🌐 Client Request Routing
- Requests go through **Nginx reverse proxy**
- API → Backend (Port 5000)  
- WebSocket → Real-time server (Port 4001)  

---

### ⚙️ Core Operations
- Backend handles:
  - Authentication  
  - Profile management  
  - Scholarship CRUD  
- Uses **Prisma ORM** with PostgreSQL  

---

### 🔁 Real-Time Communication
- WebSocket server enables live chat  
- Uses Redis Pub/Sub for scaling  

---

### ⏳ Asynchronous Execution
- Coding tests → queued via **BullMQ (Redis)**  
- Processed by isolated microservice  
- Results auto-updated in database  

---

## 🛠 Tech Stack & Features

---

### 1️⃣ Frontend: React + Vite

**Stack:** React.js, Vite, Nginx  

**Features:**
- Responsive UI  
- Dashboards for:
  - Applicants  
  - Organizations  
  - Admins  

---

### 2️⃣ Backend API: Node.js + Express

**Stack:** Node.js, Express, PostgreSQL, Prisma  

**Features:**

- 🔐 Role-Based Access Control (RBAC)
  - USER (Applicant)  
  - ORGANIZATION  
  - ADMIN  

- 👤 Dynamic Applicant Profiles  
  - CGPA, college, degree, demographics  

- 🎯 Scholarship Lifecycle Management  
  - UPCOMING → ACTIVE → CLOSED  
  - Eligibility + CGPA filtering  

- 🔔 Notifications  
  - INFO / ALERT / SUCCESS updates  

---

### 3️⃣ Real-Time Server

**Stack:** Node.js, WebSockets, Redis  

**Features:**
- Live chat between applicants & organizations  
- Real-time interaction inside platform  

---

### 4️⃣ Coding Test Microservice

**Stack:** Node.js, BullMQ, ioredis  

**Features:**

- 💻 Integrated coding tests  
- 📥 Queue-based processing  
- 🔒 Safe code execution  
- 🧪 Hidden test case evaluation  
- 📊 Automated scoring system  

---

## 👨‍💻 Author

**Veer Vanshaj Wadehra**

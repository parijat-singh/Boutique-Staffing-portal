# Boutique Staffing Portal

A specialized web portal for boutique staffing solutions, connecting top-tier candidates with premium employers.

## Features

- **Role-Based Access Control**: Separate dashboards and features for Candidates, Clients (Employers), and Administrators.
- **Candidate Profiles**: Comprehensive profile management including work experience, permit details, and resume uploads.
- **Client Management**: Employer profiles with company details and job posting capabilities.
- **Job Board**: Browsing and searching for job opportunities.
- **Application Tracking**: Real-time status updates for applications.
- **Responsive Design**: Modern, mobile-friendly UI built with React and Vite.

## ⚙️ Configuration

### 1. AI Screening Setup
The portal uses AI to analyze resumes against job descriptions.

**OpenAI (Primary)**:
- Obtain an API key from [OpenAI Platform](https://platform.openai.com/).
- Set `OPENAI_API_KEY` in your `.env` file.
- Default model: `gpt-4o-mini` (configurable via `OPENAI_MODEL`).

**Google Gemini (Fallback)**:
- Used automatically if OpenAI hits rate limits or context errors.
- Obtain an API key from [Google AI Studio](https://aistudio.google.com/app/apikey).
- Set `GEMINI_API_KEY` in your `.env` file.
- Default model: `gemini-1.5-pro` (configurable via `GEMINI_MODEL`).

### 2. Email Notifications (SMTP)
Configure SMTP to enable email features (signup welcome, application status updates).

Add the following to your `.env` file (example for Gmail):
```ini
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
SMTP_FROM_EMAIL=your_email@gmail.com
```
*Note: For Gmail, use an [App Password](https://support.google.com/accounts/answer/185833), not your login password.*

## Prerequisites

- **Docker Desktop** (Recommended for easiest setup)
- **Node.js** (v18+) & **npm** (for local frontend development)
- **Python** (v3.10+) (for local backend development)
- **PostgreSQL** (v13+) (for local database)

---

## 🚀 Quick Start (Docker)

The easiest way to run the application is using Docker Compose. This effectively manages the Frontend, Backend, and Database services.

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/parijat-singh/Boutique-Staffing-portal.git
    cd Boutique-Staffing-portal
    ```

2.  **Environment Setup**:
    - The project comes with default environment variables in `docker-compose.yml` for development.
    - You can create a `.env` file in the `backend/` directory based on `.env.example` if you need to override secrets (e.g., OPENAI_API_KEY, SMTP settings).

3.  **Run with Docker Compose**:
    ```bash
    docker-compose up --build
    ```

4.  **Access the Application**:
    - **Frontend**: [http://localhost:3000](http://localhost:3000)
    - **Backend API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
    - **PGAdmin** (if configured) or Database: Port `5432`

5.  **Stopping the Application**:
    ```bash
    docker-compose down
    ```

---

## 🛠️ Local Development Setup

If you prefer to run services locally without Docker:

### 1. Database Setup
Ensure PostgreSQL is running locally. You can use the provided script to create the database (or create it manually):

```bash
# Update credentials in the script if necessary
python init_db_script.py
```

### 2. Backend Setup

Navigate to the `backend` directory:
```bash
cd backend
```

Create and activate a virtual environment:
```bash
# Windows
python -m venv venv
.\venv\Scripts\activate

# macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

Install dependencies:
```bash
pip install -r requirements.txt
```

Run Migrations (Initialize Database Schema):
```bash
alembic upgrade head
```

Start the Backend Server:
```bash
uvicorn app.main:app --reload --port 8000
```
The API will be available at [http://localhost:8000](http://localhost:8000).

### 3. Frontend Setup

Open a new terminal and navigate to the `frontend` directory:
```bash
cd frontend
```

Install dependencies:
```bash
npm install
```

Start the Development Server:
```bash
npm run dev
```
The application will be available at [http://localhost:5173](http://localhost:5173) (default Vite port) or [http://localhost:3000](http://localhost:3000) if configured.

---

## 🧪 Running Tests

To run the backend test suite:

1.  Ensure your virtual environment is activated.
2.  Run pytest:
    ```bash
    pytest
    ```

## Project Structure

- **backend/**: FastAPI application (Python)
    - **app/**: Main application logic (models, schemas, api endpoints)
    - **alembic/**: Database migration revisions
    - **tests/**: Pytest test suite
- **frontend/**: React application (TypeScript + Vite)
    - **src/pages/**: Application pages
    - **src/components/**: Reusable UI components
    - **src/context/**: React context (Auth, etc.)

## License

Copyright © 2026 Parijat Singh. All rights reserved.
This software is proprietary and may only be used by users authorized by Parijat Singh.

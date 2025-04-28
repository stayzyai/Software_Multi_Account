
# FastAPI Project

A modern web API project built with FastAPI.

## Features

- FastAPI web framework
- SQLAlchemy ORM
- User authentication with JWT
- API documentation with Swagger UI
- Environment variable configuration
- Dependency injection
- Database migrations with Alembic (setup ready)

## Backend Setup

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd <repository-name>
```

2. Make sure you have Python 3.10.12 installed:
```bash
python --version
```
If you don't have Python 3.10.12, download it from [python.org](https://www.python.org/downloads/) or use your system's package manager.

3. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

4. Install dependencies:
```bash
pip install -r requirements.txt
```

5. Setup environment variables:
The project comes with default environment variables in the `.env` file. You may want to modify these for production use.

### Running the Backend Application

Start the development server:

```bash
uvicorn app.main:app --reload
```

The API will be available at http://localhost:8000

### API Documentation

Once the application is running, you can access:

- Interactive API documentation: http://localhost:8000/docs
- Alternative API documentation: http://localhost:8000/redoc

### Backend Project Structure

```
app/
├── core/           # Configuration and core components
├── database/       # Database connections and utilities
├── models/         # SQLAlchemy models
├── routers/        # API endpoints
├── schemas/        # Pydantic models/schemas
└── main.py         # Application entry point
```

*************************************************************************************************************************

## With  Docker

## Option 1: Docker (Recommended)

This is the recommended way to run the application in both development and production environments.

### Prerequisites

- Docker
- Docker Compose

### Setup Instructions

1. Navigate to the backend directory
2. Build and run the containers:

```bash
docker-compose up --build
```

The application will be available at http://localhost:8000

## Option 2: Local Development

This option is available for development purposes but Docker is recommended for consistency.

### Prerequisites

- Python version: 3.10.12
- PIP version: 24.3.1

### Setup Instructions

1. Install Virtual Environment

```bash
python3 -m venv env
```

2. Activate Virtual Environment

```bash
source env/bin/activate
```

3. Install Dependencies

```bash
pip install -r requirements.txt
```

4. Run the Application

```bash
uvicorn app.main:app --reload
```

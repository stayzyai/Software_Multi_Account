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


# Frontend Setup and Usage Guide

## Overview
This document provides instructions for setting up and running the frontend portion of the property management web application. The frontend is built with React, Vite, and Tailwind CSS.

## Prerequisites
- Node.js (v18 or higher recommended)
- PNPM (v9.12.0 or higher)
- Backend API server running (typically on port 8000)

## Setup Instructions

### 1. Clone the Repository
If you haven't already, clone the repository and navigate to the frontend directory:
```bash
git clone <repository-url>
cd Web_App_v1/front-end
```

### 2. Install Dependencies
This project uses PNPM as the package manager. Install dependencies with:
```bash
pnpm install
```

If you don't have PNPM installed, you can install it using:
```bash
npm install -g pnpm
```

### 3. Environment Configuration
The application uses environment variables for configuration. A sample `.env` file is included:

```
VITE_API_HOST=http://127.0.0.1:8000
VITE_SOCKET_HOST=http://127.0.0.1:8000
VITE_ENCRYPT_KEY="*************************"
```

Modify these values if your backend is running on a different URL or if you need a different encryption key.

### 4. Running the Development Server
Start the development server with:
```bash
pnpm dev
```

This will start the Vite development server, typically on port 5173. You can access the application at `http://localhost:5173`.

### 5. Building for Production
To build the application for production:
```bash
pnpm build
```

This creates optimized production files in the `dist` directory.

To preview the production build locally:
```bash
pnpm preview
```

## Development Notes

### Key Files and Directories

- `src/` - Main source directory
  - `api/` - API communication layer
  - `components/` - UI components
  - `hooks/` - Custom React hooks
  - `store/` - Redux state management
  - `helpers/` - Utility functions
  - `pages/` - Page components

# Running the Application

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

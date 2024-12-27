Running the Application
Prerequisites:
    Python version: 3.10.12
    PIP version: 24.3.1

Setup Instructions:
    Install Virtual Environment
        Navigate to the root directory of your project.
        Run the following command to create a virtual environment:
        python3 -m venv env

Activate Virtual Environment
    Activate the virtual environment by running:
    source env/bin/activate

Install Dependencies
    pip install -r requirements.txt

Run the Application
    uvicorn app.main:app --reload

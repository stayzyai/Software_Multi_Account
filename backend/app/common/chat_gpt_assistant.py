import os
from dotenv import load_dotenv
import logging
from openai import OpenAI
import time
load_dotenv()

CHAT_DATA_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "chat_interaction.jsonl")

client = OpenAI(api_key=os.getenv("CHAT_GPT_API_KEY"))

def get_latest_model_id():
    try:
        models = client.models.list()
        stayzy_models = [model for model in models.data if model.owned_by == "stayzy"]
        if stayzy_models:
            latest_model = max(stayzy_models, key=lambda model: model.created)
            print(latest_model)
            return latest_model.id
    except Exception as e:
        print(f"Error retrieving models: {e}")

def train_chat_gpt():
    try:
        EXISTING_MODEL_ID = get_latest_model_id()
        if not os.path.exists(CHAT_DATA_FILE):
            logging.error(f"File not found: {CHAT_DATA_FILE}")
            return

        with open(CHAT_DATA_FILE, "r") as file:
            lines = file.readlines()
            if not lines:
                logging.error("The training file is empty.")
                return

            print('Uploading file...')
            try:
                response = client.files.create(file=open(CHAT_DATA_FILE, "rb"), purpose='fine-tune')
                logging.info(f"File uploaded: {response}")
            except Exception as e:
                logging.error(f"Error uploading file: {e}")
                return
            try:
                file_id = response.id
                job = client.fine_tuning.jobs.create(
                    training_file=file_id,
                    model=EXISTING_MODEL_ID
                )
                print('Fine-tuning job created...', job)
                job_id = job.id
            except Exception as e:
                logging.error(f"Error creating fine-tuning job: {e}")
                return

            print('Fine-tuning in-progress...')
            while True:
                try:
                    job_status = client.fine_tuning.jobs.retrieve(job_id)
                    logging.info(f"Fine-tuning job status: {job_status.status}")
                except Exception as e:
                    logging.error(f"Error retrieving job status: {e}")
                    break

                if job_status.status in ["succeeded", "failed"]:
                    break
                time.sleep(30)

            if job_status.status == "succeeded":
                logging.info(f"Training completed...! {job_status}")
            else:
                logging.error(f"Fine-tuning failed: {job_status}")
    except Exception as e:
        logging.error(f"An unexpected error occurred: {e}")
    finally:
        if 'job_status' in locals() and job_status.status == "succeeded":
            os.environ['CHAT_GPT_MODEL_ID'] = job_status.fine_tuned_model
            print(f"Fine-tuning Done: {job_status}")
            delete_old_files_and_models()

def delete_old_files_and_models():
    try:
        latest_model_id = get_latest_model_id()
        files = client.files.list()
        for file in files.data:
            file_id = file.id
            try:
                if file.filename == 'chat_interaction.jsonl':
                    client.files.delete(file_id)
                    logging.info(f"Deleted file: {file_id}")
            except Exception as e:
                logging.error(f"Error deleting file {file_id}: {e}")
    except Exception as e:
        logging.error(f"Error retrieving file list: {e}")
    try:
        models =  client.models.list()
        for model in models.data:
            model_id = model.id
            if model_id != latest_model_id:
                try:
                    client.models.delete(model_id)
                    logging.info(f"Deleted model: {model_id}")
                except Exception as e:
                    logging.error(f"Error deleting model {model_id}: {e}")
    except Exception as e:
        logging.error(f"Error retrieving model list: {e}")

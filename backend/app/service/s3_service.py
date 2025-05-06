from fastapi import UploadFile
import boto3
from botocore.exceptions import NoCredentialsError
import os
from io import BytesIO

# AWS S3 Configuration
AWS_BUCKET_NAME = os.getenv("AWS_BUCKET_NAME")
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
AWS_REGION = os.getenv("AWS_REGION")

# Initialize S3 client
s3_client = boto3.client("s3",
    aws_access_key_id=AWS_ACCESS_KEY_ID,
    aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
    region_name=AWS_REGION
)

def upload_or_replace_image(file: UploadFile, user_id: str):
    try:
        file_extension = file.filename.split('.')[-1]
        s3_key = f"{user_id}/profile.{file_extension}"

        file_content = BytesIO(file.file.read())

        s3_client.upload_fileobj(
            file_content,
            AWS_BUCKET_NAME,
            s3_key,
            ExtraArgs={"ContentType": file.content_type}
        )

        file_url = f"https://{AWS_BUCKET_NAME}.s3.{AWS_REGION}.amazonaws.com/{s3_key}"
        return file_url

    except NoCredentialsError:
        raise Exception("AWS credentials missing")

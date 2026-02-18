#!/bin/bash

# Configuration - UPDATE THESE
PROJECT_ID="your-project-id"
REGION="us-central1"
DB_INSTANCE_NAME="boutique-db"
DB_PASSWORD="your-secure-password"

echo "Starting GCP Resource Setup for Boutique Staffing Portal..."

# 1. Set Project
gcloud config set project $PROJECT_ID

# 2. Enable APIs
echo "Enabling necessary APIs..."
gcloud services enable \
    run.googleapis.com \
    sqladmin.googleapis.com \
    cloudbuild.googleapis.com \
    secretmanager.googleapis.com \
    artifactregistry.googleapis.com

# 3. Create Cloud SQL Instance
echo "Creating Cloud SQL PostgreSQL instance (this may take 5-10 minutes)..."
gcloud sql instances create $DB_INSTANCE_NAME \
    --database-version=POSTGRES_15 \
    --tier=db-f1-micro \
    --region=$REGION \
    --root-password=$DB_PASSWORD

# 4. Create Database
gcloud sql databases create staffing_db --instance=$DB_INSTANCE_NAME

# 5. Setup Secrets
echo "Creating secrets for API keys..."
echo -n "your-openai-key" | gcloud secrets create OPENAI_API_KEY --data-file=-
echo -n "your-gemini-key" | gcloud secrets create GEMINI_API_KEY --data-file=-
echo -n "some-random-secret-key" | gcloud secrets create SECRET_KEY --data-file=-

echo "Setup Complete! You can now run Cloud Build to deploy your application."
echo "Command: gcloud builds submit --config cloudbuild.yaml --substitutions=_INSTANCE_CONNECTION_NAME=\$(gcloud sql instances describe $DB_INSTANCE_NAME --format='value(connectionName)'),_DATABASE_URL='postgresql+asyncpg://postgres:$DB_PASSWORD@/staffing_db?host=/cloudsql/\$(gcloud sql instances describe $DB_INSTANCE_NAME --format='value(connectionName)')',_SECRET_KEY='your-secret-key',_BACKEND_URL='https://boutique-backend-xxxx-uc.a.run.app'"
echo "TIP: You can find your backend URL in the Cloud Run console after your first deployment."

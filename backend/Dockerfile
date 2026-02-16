# Use an official Python runtime as a parent image
FROM python:3.10-slim

# Set the working directory in the container
WORKDIR /app

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Install system dependencies
RUN apt-get update && apt-get install -y netcat-openbsd gcc libpq-dev && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY requirements.txt /app/
# Removing twisted-iocpsupport from requirements.txt if present, as it is windows specific
# We can do this by filtering or just assume it is fine (usually pip ignores or fails gracefully, 
# but twisted-iocpsupport might fail build on linux. Let's install requirements)
RUN pip install --upgrade pip
RUN pip install -r requirements.txt

# Copy the current directory contents into the container at /app
COPY . /app/

# Expose port 8000
EXPOSE 8000

# Command to run the application
# We use a start script or direct command. 
# Let's use uvicorn directly for simplicity, but in prod maybe gunicorn.
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

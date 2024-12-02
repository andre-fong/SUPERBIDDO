#!/bin/bash

# production server (SSH public key authnetication)
SERVER=35.208.53.6
FRONTEND_ENV_PATH=frontend/.env.production
BACKEND_ENV_PATH=backend/.env.production
REMOTE_DEST_PATH=/var/lib/superbiddo/.env

echo "Building and deploying the application to $SERVER..."

echo "Building the frontend..."
docker build -t frontend -f frontend.dockerfile .
if [ $? -ne 0 ]; then
  echo "Frontend build failed. Exiting..."
  exit 1
fi
echo "Frontend build successful!"

echo "Building the backend..."
docker build -t backend -f backend.dockerfile .
if [ $? -ne 0 ]; then
  echo "Backend build failed. Exiting..."
  exit 1
fi
echo "Backend build successful!"

echo "Removing dangling images locally..."
docker rmi $(docker images --filter "dangling=true" -q --no-trunc)

echo "Uploading the frontend image to $SERVER..."
docker save frontend | bzip2 | pv | ssh $SERVER docker load
if [ $? -ne 0 ]; then
  echo "Frontend upload failed. Exiting..."
  exit 1
fi
echo "Frontend upload successful!"

echo "Uploading the backend image to $SERVER..."
docker save backend | bzip2 | pv | ssh $SERVER docker load
if [ $? -ne 0 ]; then
  echo "Backend upload failed. Exiting..."
  exit 1
fi
echo "Backend upload successful!"

echo "Stopping all containers on $SERVER..."
ssh $SERVER "cd /var/lib/superbiddo && docker compose down --remove-orphans"

echo "Removing dangling images on $SERVER..."
ssh $SERVER docker rmi $(docker images --filter "dangling=true" -q --no-trunc)

echo "Copying docker-compose.yaml to $SERVER..."
scp docker-compose.yaml $SERVER:/var/lib/superbiddo/docker-compose.yaml
if [ $? -ne 0 ]; then
  echo "docker-compose.yaml copy failed. Exiting..."
  exit 1
fi
echo "docker-compose.yaml copy successful!"

echo "Copying combined environment file to $SERVER..."
{
  cat "$FRONTEND_ENV_PATH"
  echo "" # add a newline between files to separate them
  cat "$BACKEND_ENV_PATH"
} | ssh "$SERVER" "cat > $REMOTE_DEST_PATH"
if [ $? -ne 0 ]; then
  echo "Environment file copy failed. Exiting..."
  exit 1
fi
echo "Environment file copy successful!"

echo "Copying gcs-storage-credentials.json to $SERVER..."
scp gcs-storage-credentials.json $SERVER:/var/lib/superbiddo/gcs-storage-credentials.json
if [ $? -ne 0 ]; then
  echo "gcs-storage-credentials.json copy failed. Exiting..."
  exit 1
fi

echo "Starting the application on $SERVER..."
ssh $SERVER "cd /var/lib/superbiddo && docker compose up -d"
if [ $? -ne 0 ]; then
  echo "Application start failed. Exiting..."
  exit 1
fi
echo "Application start successful!"
echo "Application deployed successfully! (done)"

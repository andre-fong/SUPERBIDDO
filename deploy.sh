#!/bin/bash

# production server (SSH public key authnetication)
SERVER=35.208.53.6

# building the frontend image
docker build -t frontend -f frontend.dockerfile .
# uploading the image on production server
docker save frontend | bzip2 | pv | ssh $SERVER docker load

# same with the backend 
docker build -t backend -f backend.dockerfile .
docker save backend | bzip2 | pv | ssh $SERVER docker load

# stop all container on the production server
ssh $SERVER docker compose down --remove-orphans

# remove dangling images
ssh $SERVER docker rmi $(docker images --filter "dangling=true" -q --no-trunc)

# copy docker-compose, .env
scp docker-compose.yaml $SERVER:.
scp .env.production $SERVER:.env

# restart all containers
ssh $SERVER docker compose up -d
#!/bin/bash

APP=alogorithm2
VERSION=$(cat package.json | jq -r .version)
DOCKERHUB_IMAGE=${DOCKERHUB_IMAGE:-"ideamans/$APP"}

docker build -t $APP .

for TAG in $VERSION latest; do
  docker tag $LOCAL_IMAGE $DOCKERHUB_IMAGE:$TAG
  docker push $DOCKERHUB_IMAGE:$TAG
done

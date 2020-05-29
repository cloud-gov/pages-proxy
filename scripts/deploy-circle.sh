#!/bin/bash

set -e

CF_API="https://api.fr.cloud.gov"
CF_ORGANIZATION="gsa-18f-federalist"

if [ "$CIRCLE_BRANCH" == "master" ]; then
  CF_USERNAME=$CF_USERNAME_PRODUCTION
  CF_PASSWORD=$CF_PASSWORD_PRODUCTION
  CF_SPACE="production"
  CF_APP="federalist-proxy"
  CF_VARS_FILE="./envs/production.yml"
elif [ "$CIRCLE_BRANCH" == "staging" ]; then
  CF_USERNAME=$CF_USERNAME_STAGING
  CF_PASSWORD=$CF_PASSWORD_STAGING
  CF_SPACE="staging"
  CF_APP="federalist-proxy-staging"
  CF_VARS_FILE="./envs/staging.yml"
else
  echo "Not on master or staging branch. Skipping deployment."
  exit
fi

# install cf cli
curl -L -o cf7.deb 'https://packages.cloudfoundry.org/stable?release=debian64&version=v7&source=github'
sudo dpkg -i cf7.deb
rm cf7.deb

cf7 api $CF_API

echo "Logging in to $CF_ORGANIZATION org, $CF_SPACE space."
cf7 login -u $CF_USERNAME -p $CF_PASSWORD -o $CF_ORGANIZATION -s $CF_SPACE

echo "Deploying to $CF_SPACE space."
cf7 push $CF_APP --strategy rolling --vars-file $CF_VARS_FILE

cf7 logout
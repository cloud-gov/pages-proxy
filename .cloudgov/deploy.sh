#! /bin/bash
set -o pipefail

onerr() {
  echo "Deployment to $CF_SPACE space failed, cancelling."
  cf cancel-deployment $CF_APP
  cf logout
  exit 1
}
trap 'onerr $DEPLOY_STARTED' ERR

echo "Deploying to $CF_SPACE space."
cf push $CF_APP --strategy rolling --vars-file $CF_VARS_FILE -f $CF_MANIFEST

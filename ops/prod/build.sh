#!/bin/bash
#
# Builds the source code and uploads to s3.
# Arguments:
# - Commit hash
# - The environment the build is for
# Examples:
# - ./build.sh 1ae6ca288961263eb2e8a0f8ad31dfdda46de349 staging
# - ./build.sh 1ae6ca288961263eb2e8a0f8ad31dfdda46de349 production

COMMIT_SHA=$(echo $1 | cut -c1-7)
ENV=$2
WORK_DIR=/home/ec2-user
BUILD_ID="${COMMIT_SHA}-${ENV}"
BUILD_DIR="${WORK_DIR}/${BUILD_ID}"

# checkout the code
git clone --no-checkout git@github.com:santialbo/parallel.git ${BUILD_DIR}
cd ${BUILD_DIR}
git checkout ${COMMIT_SHA}
rm -rf .git
yarn install --prefer-offline --frozen-lockfile

# build client
cd ${BUILD_DIR}/client
yarn build-${ENV}

# upload next.js static assets to s3 and invalidate the distribution corresponding to the environment
aws s3 sync ${BUILD_DIR}/client/out s3://parallel-static-${ENV} --profile parallel-deploy
ORIGIN_ID="S3-parallel-static-${ENV}"
DISTRIBUTION_LIST=$(aws cloudfront list-distributions --profile parallel-deploy)
DISTRIBUTION_ID=$(echo $DISTRIBUTION_LIST | jq -r ".DistributionList.Items[] | select(.Origins.Items[0].Id == \"${ORIGIN_ID}\") | .Id")
aws cloudfront create-invalidation --distribution-id ${DISTRIBUTION_ID} --paths "/*" --profile parallel-deploy

# build server
cd ${BUILD_DIR}/server
yarn build

# remove dev dependencies
cd ${BUILD_DIR}
yarn install --production --ignore-scripts --prefer-offline --frozen-lockfile

# get configuration for the environment
cd ${WORK_DIR}
git clone --depth 1 git@github.com:santialbo/secrets.git secrets
cp -a secrets/${ENV}/. ${BUILD_DIR}/server/
rm -rf secrets

# tar and upload to s3
tar -zcf ${BUILD_ID}.tar.gz ${BUILD_ID}
rm -rf ${BUILD_DIR}
aws s3 mv ${BUILD_ID}.tar.gz s3://parallel-builds/${BUILD_ID}.tar.gz --profile parallel-deploy

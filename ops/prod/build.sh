#!/bin/bash
COMMIT_SHA=$1
WORK_DIR=/home/ec2-user
BUILD_DIR="${WORK_DIR}/${COMMIT_SHA}"

cd ${WORK_DIR}
git clone --no-checkout git@github.com:santialbo/parallel.git ${WORK_DIR}/${COMMIT_SHA}
cd ${BUILD_DIR}
git checkout ${COMMIT_SHA}
rm -rf .git
yarn install --frozen-lockfile

cd ${BUILD_DIR}/client
yarn build-staging
rm -rf build components docs graphql lang node_modules pages types utils .babelrc codegen.yml next-env.d.ts tsconfig.json

cd ${BUILD_DIR}/server
yarn build
rm -rf bin migrations node_modules seeds src test parallel-schema.graphql knexfile.ts jest.config.js emails.tsx .test.env tsconfig.json tsconfig.prod.json

cd ${BUILD_DIR}
rm -rf bin docs node_modules README.md tsconfig.json
yarn install --frozen-lockfile --production

cd ${WORK_DIR}
tar -zcf ${COMMIT_SHA}.tar.gz ${COMMIT_SHA}
rm -rf ${COMMIT_SHA}

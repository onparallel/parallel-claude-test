COMMIT=$1
ENV=$2
BUILD_ID="parallel-${ENV}-${COMMIT}"
ARTIFACT_NAME="${BUILD_ID}.tar.gz"
BUCKET_NAME="parallel-builds-${ENV}"
ARTIFACT_PATH="${BUCKET_NAME}/${ARTIFACT_NAME}"

WORK_DIR="/home/ec2-user"
BUILD_DIR="${WORK_DIR}/${BUILD_ID}"

# mount yarn cache
# sudo mkfs -t ext4 /dev/xvdy # format newly created volume
sudo mkdir -p /mnt/yarn-cache
sudo mount /dev/xvdy /mnt/yarn-cache
sudo chown ec2-user:ec2-user /mnt/yarn-cache
yarn config set cache-folder /mnt/yarn-cache

pushd $WORK_DIR
git clone --no-checkout git@github.com:onparallel/parallel.git $BUILD_DIR
pushd $BUILD_DIR
git -c advice.detachedHead=false checkout $COMMIT
rm -rf .git
yarn install --prefer-offline --frozen-lockfile --ignore-optional

CLIENT_SERVER_TOKEN=$(LC_ALL=C tr -dc 'A-Za-z0-9' </dev/urandom | head -c 32; echo)
SECURITY_SERVICE_JWT_SECRET=$(LC_ALL=C tr -dc 'A-Za-z0-9' </dev/urandom | head -c 32; echo)
echo "CLIENT_SERVER_TOKEN=${CLIENT_SERVER_TOKEN}" >> client/.env.local
echo "CLIENT_SERVER_TOKEN=${CLIENT_SERVER_TOKEN}" >> "server/.env.${ENV}"
echo "SECURITY_SERVICE_JWT_SECRET=${SECURITY_SERVICE_JWT_SECRET}" >> "server/.env.${ENV}"

pushd client
cp ".env.${ENV}_" .env.production.local
rm .env.production_ .env.staging_
export SENTRY_AUTH_TOKEN=$(aws secretsmanager get-secret-value --secret-id arn:aws:secretsmanager:eu-central-1:749273139513:secret:ops/sentry-auth-token-609sGa | jq --raw-output .SecretString)
export ENV
export BUILD_ID
yarn build
# remove useless big files to make artifact smaller
rm -rf .next/cache/webpack
aws s3 sync .next/static "s3://parallel-static-${ENV}/_next/static" --cache-control max-age=31536000 --quiet
aws s3 sync public/static "s3://parallel-static-${ENV}/static" --cache-control max-age=2592000 --quiet
popd

pushd server
yarn build
popd

# prune dev dependencies to make artifact smaller
yarn install --production --ignore-scripts --prefer-offline --frozen-lockfile --ignore-optional
yarn patch-package
popd

tar -zcf $ARTIFACT_NAME $BUILD_ID
aws s3 mv $ARTIFACT_NAME "s3://${ARTIFACT_PATH}"

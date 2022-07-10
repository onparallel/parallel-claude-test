COMMIT_SHA=$(echo $1 | cut -c1-7)
ENV=$2
BUILD_ID="parallel-${ENV}-${COMMIT_SHA}"
WORK_DIR=/home/ec2-user

cd ${WORK_DIR}
aws s3 cp s3://parallel-builds/${BUILD_ID}.tar.gz ${BUILD_ID}.tar.gz
tar -zxpf ${BUILD_ID}.tar.gz
ln -s ${BUILD_ID} main

bash main/ops/prod/install.sh

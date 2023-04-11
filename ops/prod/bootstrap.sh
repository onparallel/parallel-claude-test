WORK_DIR=/home/ec2-user

TOKEN=`curl --silent -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 21600"`
INSTANCE_NAME=`curl --silent -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/tags/instance/Name`
RELEASE=`curl --silent -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/tags/instance/Release`
ENV=`curl --silent -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/tags/instance/Environment`
INSTANCE_NUMBER=`curl --silent -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/tags/instance/InstanceNumber`
BUILD_ID="parallel-${ENV}-${RELEASE}"

cd ${WORK_DIR}
aws s3 cp s3://parallel-builds-${ENV}/${BUILD_ID}.tar.gz ${BUILD_ID}.tar.gz
tar -zxpf ${BUILD_ID}.tar.gz
ln -s ${BUILD_ID} main

bash main/ops/prod/install.sh $INSTANCE_NAME $ENV $RELEASE $INSTANCE_NUMBER

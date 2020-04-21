#!/bin/bash
#
# Launches an ec2 instance with the source code on it
# Arguments:
# - Commit hash
# - The environment the build is for
# Examples:
# - ./launch.sh 1ae6ca288961263eb2e8a0f8ad31dfdda46de349 staging
# - ./launch.sh 1ae6ca288961263eb2e8a0f8ad31dfdda46de349 production

COMMIT_SHA=$(echo $1 | cut -c1-7)
ENV=$2

declare -A INSTANCE_TYPES=(["production"]="t2.medium" ["staging"]="t2.small")

KEYNAME=ops
INSTANCE_TYPE="${INSTANCE_TYPES[${ENV}]}"
IMAGE_ID=ami-0e66d197dc8662d25
SECURITY_GROUP=sg-0486098a6131eb458
VPC_ID=vpc-5356ab39
SUBNET_ID=subnet-d3cc68b9
REGION=eu-central-1
AVAILABILITY_ZONE="${REGION}a"
ENHANCED_MONITORING=true
OPS_DIR=/home/ec2-user/parallel/ops/prod

RESULT=$(aws ec2 run-instances --image-id ${IMAGE_ID} --key-name ${KEYNAME} --security-group-ids ${SECURITY_GROUP} --instance-type ${INSTANCE_TYPE} --placement AvailabilityZone=${AVAILABILITY_ZONE},Tenancy=default --subnet-id ${SUBNET_ID} --count 1 --monitoring Enabled=${ENHANCED_MONITORING} --profile parallel-deploy)
INSTANCE_ID=$(echo $RESULT | jq -r '.Instances[0].InstanceId')
IP_ADDRESS=$(echo $RESULT | jq -r '.Instances[0].PrivateIpAddress')

echo "Instance ${INSTANCE_ID} launched. IP: ${IP_ADDRESS}"
aws ec2 create-tags --resources ${INSTANCE_ID} --tags "Key=Name,Value=server-${ENV}-${COMMIT_SHA}" "Key=Release,Value=${COMMIT_SHA}" "Key=Environment,Value=${ENV}" --profile parallel-deploy
echo "Waiting for ready status"
aws ec2 wait instance-running --instance-ids ${INSTANCE_ID} --profile parallel-deploy

# Add to target group if it exists or create it if not
echo "Adding to target group"
TG_NAME="${COMMIT_SHA}-${ENV}"
RESULT=$(aws elbv2 describe-target-groups --names ${TG_NAME} --profile parallel-deploy)
if [ $? -ne 0 ]; then
  RESULT=$(aws elbv2 create-target-group --name ${TG_NAME} --protocol HTTP --port 80 --vpc-id ${VPC_ID} --health-check-path /status --profile parallel-deploy)
fi
TG_ARGN=$(echo $RESULT | jq -r '.TargetGroups[0].TargetGroupArn')
aws elbv2 register-targets --target-group-arn ${TG_ARGN} --targets Id=${INSTANCE_ID} --profile parallel-deploy

until ssh -o ConnectTimeout=1 -o StrictHostKeyChecking=no ec2-user@${IP_ADDRESS} true >/dev/null 2>&1; do
  echo "Waiting for ssh ready"
  sleep 5
done

# Upload install.sh to the new instance and execute it
scp -o StrictHostKeyChecking=no ${OPS_DIR}/install.sh ${IP_ADDRESS}:/home/ec2-user/install.sh
ssh ${IP_ADDRESS} /home/ec2-user/install.sh ${COMMIT_SHA} ${ENV}

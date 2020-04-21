#!/bin/bash
#
# Sets the load balancer to point to the new target group
# Arguments:
# - Commit hash
# - The environment the build is for
# Examples:
# - ./set-lb.sh 1ae6ca288961263eb2e8a0f8ad31dfdda46de349 staging
# - ./set-lb.sh 1ae6ca288961263eb2e8a0f8ad31dfdda46de349 production

COMMIT_SHA=$(echo $1 | cut -c1-7)
ENV=$2

TG_NAME="${COMMIT_SHA}-${ENV}"
TG_ARN=$(aws elbv2 describe-target-groups --names ${TG_NAME} --profile parallel-deploy | jq -r ".TargetGroups[0].TargetGroupArn")
LB_ARN=$(aws elbv2 describe-load-balancers --profile parallel-deploy | jq -r ".LoadBalancers[] | select(.LoadBalancerName == \"${ENV}\") | .LoadBalancerArn")
LISTENER_ARN=$(aws elbv2 describe-listeners --load-balancer-arn ${LB_ARN} --profile parallel-deploy | jq -r ".Listeners[] | select(.Protocol == \"HTTPS\") | .ListenerArn")
aws elbv2 modify-listener --listener-arn ${LISTENER_ARN} --default-actions Type=forward,TargetGroupArn=${TG_ARN} --profile parallel-deploy

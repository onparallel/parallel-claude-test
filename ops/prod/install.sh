COMMIT_SHA=$(echo $1 | cut -c1-7)
ENV=$2
BUILD_ID="${COMMIT_SHA}-${ENV}"
WORK_DIR=/home/ec2-user

cd ${WORK_DIR}
aws s3 cp s3://parallel-builds/${BUILD_ID}.tar.gz ${BUILD_ID}.tar.gz --profile parallel-deploy
tar -zxpf ${BUILD_ID}.tar.gz
ln -s ${BUILD_ID} main

# password for staging
sudo echo 'parallel:$apr1$wY1qv83a$ErfofKvlFLeIZ4r4ijEDw/' >>.htpasswd
sudo mv .htpasswd /etc/nginx/.htpasswd

sed -i "s/#ENV#/${ENV}/g" main/ops/prod/systemd/parallel-client.service
sed -i "s/#COMMIT_SHA#/${COMMIT_SHA}/g" main/ops/prod/nginx.conf
sudo cp main/ops/prod/systemd/* /lib/systemd/system
sudo cp main/ops/prod/nginx.conf /etc/nginx/nginx.conf

sudo systemctl daemon-reload
sudo systemctl enable parallel-server.service
sudo systemctl enable parallel-client.service
sudo systemctl enable parallel-completed-email-queue.service
sudo systemctl enable parallel-email-events-queue.service
sudo systemctl enable parallel-email-sender-queue.service
sudo systemctl enable parallel-reminder-email-queue.service
sudo systemctl enable parallel-reminder-trigger-cron.service
sudo systemctl enable parallel-scheduled-trigger-cron.service
sudo systemctl enable parallel-sendout-email-queue.service

sudo systemctl start parallel-server
sudo systemctl start parallel-client
sudo systemctl restart nginx

COMMIT_SHA=$(echo $1 | cut -c1-7)
ENV=$2
BUILD_ID="${COMMIT_SHA}-${ENV}"
WORK_DIR=/home/ec2-user

cd ${WORK_DIR}
aws s3 cp s3://parallel-builds/${BUILD_ID}.tar.gz ${BUILD_ID}.tar.gz
tar -zxpf ${BUILD_ID}.tar.gz
ln -s ${BUILD_ID} main

sed -i "s/^ENV=$/ENV=\"${ENV}\"/g" workers.sh
sed -i "s/#ENV#/${ENV}/g" main/ops/prod/systemd/parallel-client.service
sudo sed -i "s/#COMMIT_SHA#/${COMMIT_SHA}/g" /etc/nginx/nginx.conf
sudo cp main/ops/prod/systemd/* /lib/systemd/system

sudo systemctl daemon-reload
sudo systemctl enable parallel-server.service
sudo systemctl enable parallel-client.service
sudo systemctl enable parallel-email-events-queue.service
sudo systemctl enable parallel-email-sender-queue.service
sudo systemctl enable parallel-signature-worker-queue.service
sudo systemctl enable parallel-reminder-trigger-cron.service
sudo systemctl enable parallel-scheduled-trigger-cron.service
if [[ "$ENV" == "production" ]]; then
  sudo systemctl enable parallel-reporting-cron.service
fi

sudo systemctl start parallel-server
sudo systemctl start parallel-client
sudo systemctl restart nginx

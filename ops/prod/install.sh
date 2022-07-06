COMMIT_SHA=$(echo $1 | cut -c1-7)
ENV=$2
BUILD_ID="parallel-${ENV}-${COMMIT_SHA}"
WORK_DIR=/home/ec2-user

cd ${WORK_DIR}
aws s3 cp s3://parallel-builds/${BUILD_ID}.tar.gz ${BUILD_ID}.tar.gz
tar -zxpf ${BUILD_ID}.tar.gz
ln -s ${BUILD_ID} main

# mount shared folder
sudo mkdir -p /nfs/parallel
sudo mount -t efs -o tls fs-05b0e1c4df3ecd227:/ /nfs/parallel

sed -i "s/#ENV#/${ENV}/g" workers.sh main/ops/prod/systemd/parallel-client.service main/ops/prod/systemd/parallel-server.service
sudo sed -i "s/#COMMIT_SHA#/${COMMIT_SHA}/g" main/ops/prod/nginx/helpers/common.conf
sudo cp main/ops/prod/systemd/* /lib/systemd/system
sudo cp -r main/ops/prod/nginx/* /etc/nginx/

echo 'parallel:$apr1$wY1qv83a$ErfofKvlFLeIZ4r4ijEDw/' >>.htpasswd
sudo mv .htpasswd /etc/nginx/.htpasswd

# setup nginx user
sudo adduser --system --no-create-home --user-group --shell /sbin/nologin nginx
sudo mkdir -p /var/lib/nginx/tmp
sudo mkdir -p /var/cache/nginx
sudo chown nginx /var/lib/nginx/tmp
sudo chgrp nginx /var/lib/nginx/tmp
sudo chown nginx /var/cache/nginx
sudo chgrp nginx /var/cache/nginx

sudo systemctl daemon-reload
sudo systemctl enable nginx.service 
sudo systemctl enable parallel-server.service
sudo systemctl enable parallel-client.service
sudo systemctl enable parallel-email-events-queue.service
sudo systemctl enable parallel-email-sender-queue.service
sudo systemctl enable parallel-event-processor-queue.service
sudo systemctl enable parallel-signature-worker-queue.service
sudo systemctl enable parallel-task-worker-queue.service
sudo systemctl enable parallel-reminder-trigger-cron.service
sudo systemctl enable parallel-scheduled-trigger-cron.service
sudo systemctl enable parallel-petition-notifications-cron.service
sudo systemctl enable parallel-organization-limits-cron.service
sudo systemctl enable parallel-anonymizer-cron.service

sudo systemctl start parallel-server
sudo systemctl start parallel-client
sudo systemctl start nginx

COMMIT_SHA=$1
ENV=$2

sudo hostnamectl set-hostname "parallel-${ENV}-${COMMIT_SHA}"

# mount shared folder
sudo mkdir -p /nfs/parallel
sudo mount -t efs -o tls fs-05b0e1c4df3ecd227:/ /nfs/parallel

sed -i "s/#ENV#/${ENV}/g" main/ops/prod/systemd/parallel-client.service main/ops/prod/systemd/parallel-server.service main/ops/prod/awslogs.conf
sudo sed -i "s/#COMMIT_SHA#/${COMMIT_SHA}/g" main/ops/prod/nginx/helpers/common.conf
sudo cp main/ops/prod/systemd/* /lib/systemd/system
sudo cp -r main/ops/prod/nginx/* /etc/nginx/
sudo cp main/ops/prod/awslogs.conf /etc/awslogs/awslogs.conf

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

# setup awslogs
sudo sed -i "s/region =.*/region = eu-central-1/g" /etc/awslogs/awscli.conf

sudo systemctl daemon-reload
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
sudo systemctl enable nginx.service 
sudo systemctl enable awslogsd.service

sudo systemctl start parallel-server
sudo systemctl start parallel-client
sudo systemctl start nginx
sudo systemctl start awslogsd.service

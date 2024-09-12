INSTANCE_NAME=$1
ENV=$2
RELEASE=$3
INSTANCE_NUMBER=$4
BUILD_ID="parallel-${ENV}-${RELEASE}"

sudo hostnamectl set-hostname "$INSTANCE_NAME"

# mount shared folder
sudo mkdir -p /nfs/parallel
sudo mount -t efs -o tls -O _netdev fs-05b0e1c4df3ecd227:/ /nfs/parallel
echo "fs-05b0e1c4df3ecd227.efs.eu-central-1.amazonaws.com:/ /nfs/parallel nfs4 nfsvers=4.1,rsize=1048576,wsize=1048576,hard,timeo=600,retrans=2,noresvport,_netdev 0 0" | sudo tee -a /etc/fstab > /dev/null

cd /home/ec2-user
sed -i -e "s/#INSTANCE_NAME#/$INSTANCE_NAME/g;s/#ENV#/$ENV/g;s/#RELEASE#/$RELEASE/g;s/#INSTANCE_NUMBER#/$INSTANCE_NUMBER/g;s/#BUILD_ID#/$BUILD_ID/g" \
  main/ops/prod/nginx/helpers/common.conf \
  main/ops/prod/workers.sh \
  main/ops/prod/systemd/*.service \
  main/ops/prod/amazon-cloudwatch-agent/config.json
sudo cp main/ops/prod/systemd/* /lib/systemd/system
sudo cp -r main/ops/prod/nginx/fail2ban/* /etc/fail2ban/
sudo rm -r main/ops/prod/nginx/fail2ban
sudo cp -r main/ops/prod/nginx/* /etc/nginx/
sudo rm /etc/nginx/modsec/modsecurity-crs/rules/REQUEST-903.*
sudo cp main/ops/prod/amazon-cloudwatch-agent/config.json /opt/aws/amazon-cloudwatch-agent/bin/config.json

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

sudo systemctl enable parallel-server.service
sudo systemctl enable parallel-client.service
sudo systemctl enable fail2ban
sudo systemctl enable nginx.service 

sudo systemctl enable parallel-email-events-queue.service
sudo systemctl enable parallel-email-sender-queue.service
sudo systemctl enable parallel-event-processor-queue.service
sudo systemctl enable parallel-signature-worker-queue.service
if [[ "$ENV" == "production" ]]; then
  sudo systemctl enable parallel-task-worker-queue\@{1..3}.service
else
  sudo systemctl enable parallel-task-worker-queue\@{1..2}.service
fi
sudo systemctl enable parallel-delay-queue.service
sudo systemctl enable parallel-reminder-trigger-cron.service
sudo systemctl enable parallel-scheduled-trigger-cron.service
sudo systemctl enable parallel-petition-notifications-cron.service
sudo systemctl enable parallel-organization-limits-cron.service
sudo systemctl enable parallel-anonymizer-cron.service
sudo systemctl enable parallel-old-notifications-cron.service
sudo systemctl enable parallel-expiring-properties-cron.service
sudo systemctl enable parallel-background-check-monitor-cron.service

sudo amazon-cloudwatch-agent-ctl -a fetch-config -s -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/bin/config.json

#! /bin/bash

yente_version="5.0.2" # https://github.com/opensanctions/yente/releases

# make sure to copy all files in image/yente

sudo hostnamectl set-hostname yente

sudo yum install nodejs nginx docker httpd-tools -y

sudo rm /etc/nginx/nginx.conf
sudo mv nginx.conf /etc/nginx/

secret=$(aws secretsmanager get-secret-value --secret-id arn:aws:secretsmanager:eu-central-1:749273139513:secret:ops/yente-IEPjfM | jq --raw-output .SecretString)
username=$(echo $secret | jq -r .username)
password=$(echo $secret | jq -r .password)
sudo htpasswd -bBc /etc/nginx/.htpasswd "$username" "$password"
secret=$(aws secretsmanager get-secret-value --secret-id arn:aws:secretsmanager:eu-central-1:749273139513:secret:development/third-party-4RdbmB | jq --raw-output .SecretString)
username=$(echo $secret | jq -r .YENTE.USER)
password=$(echo $secret | jq -r .YENTE.PASSWORD)
sudo htpasswd -bB /etc/nginx/.htpasswd "$username" "$password"

sudo curl -L https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m) -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

sudo yum install -y cronie
sudo systemctl enable crond.service
sudo systemctl start crond.service
sudo python3 -m venv /opt/certbot/
sudo /opt/certbot/bin/pip install --upgrade pip
sudo /opt/certbot/bin/pip install certbot certbot
sudo ln -s /opt/certbot/bin/certbot /usr/bin/certbot

# Create a hook to reload nginx when certificates are renewed
HOOK_PATH="/etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh"
sudo tee "$HOOK_PATH" > /dev/null <<'EOF'
HOOK_PATH="/etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh"

#!/bin/bash
echo "Reloading nginx to apply new certificates..."
systemctl reload nginx
EOF
sudo chmod +x "$HOOK_PATH"

echo "0 0,12 * * * root /opt/certbot/bin/python -c 'import random; import time; time.sleep(random.random() * 3600)' && sudo certbot renew --quiet --deploy-hook $HOOK_PATH" | sudo tee -a /etc/crontab > /dev/null

curl --silent --location --output release.tar.gz https://github.com/opensanctions/yente/archive/refs/tags/v${yente_version}.tar.gz
mkdir release
tar -xf release.tar.gz --directory release --strip-components 1
rm release.tar.gz

mkdir -p yente
mv .env yente/
cp release/docker-compose.yml yente/

sudo cp yente.service /etc/systemd/system/

sudo systemctl enable docker
sudo systemctl enable yente
sudo systemctl enable nginx

sudo systemctl start docker
sudo systemctl start yente
sudo systemctl start nginx


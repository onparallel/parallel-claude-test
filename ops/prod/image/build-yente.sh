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

sudo python3 -m venv /opt/certbot/
sudo /opt/certbot/bin/pip install --upgrade pip
sudo /opt/certbot/bin/pip install certbot certbot
sudo ln -s /opt/certbot/bin/certbot /usr/bin/certbot

echo "0 0,12 * * * root /opt/certbot/bin/python -c 'import random; import time; time.sleep(random.random() * 3600)' && sudo certbot renew --quiet" | sudo tee -a /etc/crontab > /dev/null

mkdir -p yente
mv .env yente/
pushd yente
wget https://raw.githubusercontent.com/opensanctions/yente/main/docker-compose.yml
popd

sudo cp yente.service /etc/systemd/system/

sudo systemctl enable docker
sudo systemctl enable yente
sudo systemctl enable nginx

sudo systemctl start start
sudo systemctl start yente
sudo systemctl start nginx

# certbot certonly --webroot -w /usr/share/nginx/html -m santi@onparallel.com --agree-tos -d yente.parallel.so

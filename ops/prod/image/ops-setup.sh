#!/usr/bin/env bash

# Exit on any error
set -e

ENVIRONMENT="$1"

if [[ -z "$ENVIRONMENT" ]]; then
  echo "Usage: $0 <production|staging>"
  exit 1
fi

if [[ "$ENVIRONMENT" == "staging" ]]; then
  HOSTNAME="ops-staging"
  EFS_ID="fs-04bd0d42c9572a6c1"
elif [[ "$ENVIRONMENT" == "production" ]]; then
  HOSTNAME="ops"
  EFS_ID="fs-05b0e1c4df3ecd227"
else
  echo "ERROR: Unknown environment '$ENVIRONMENT'. Use 'production' or 'staging'."
  exit 1
fi

sudo hostnamectl set-hostname "$HOSTNAME"

echo "cd ~/parallel/bin" >> ~/.bash_profile
echo "export ENV=${ENVIRONMENT}" >> ~/.bash_profile

# Add public keys
cat authorized_keys >> .ssh/authorized_keys
rm authorized_keys

sudo yum update -y

# install binary dependencies
sudo yum install -y \
  git \
  amazon-efs-utils \
  python3 \
  augeas

# mount shared folder
sudo mkdir -p /nfs/parallel
sudo mount -t efs -o tls -O _netdev "${EFS_ID}:/" /nfs/parallel
echo "${EFS_ID}.efs.eu-central-1.amazonaws.com:/ /nfs/parallel nfs4 nfsvers=4.1,rsize=1048576,wsize=1048576,hard,timeo=600,retrans=2,noresvport,_netdev 0 0" | sudo tee -a /etc/fstab > /dev/null

# Installing node.js
sudo curl -fsSL https://rpm.nodesource.com/setup_22.x | sudo bash -
sudo yum install nodejs -y
sudo npm install -g npm@latest

# Installing yarn
curl -sL https://dl.yarnpkg.com/rpm/yarn.repo | sudo tee /etc/yum.repos.d/yarn.repo
sudo yum -y install yarn

mkdir .aws
echo "[default]" >> ~/.aws/config
echo "region=eu-central-1" >> ~/.aws/config
# configure aws for running with sudo (for certbot manual hooks)
sudo mkdir /root/.aws
sudo sh -c 'echo "[default]" >> /root/.aws/config'
sudo sh -c 'echo "region=eu-central-1" >> /root/.aws/config'

# Installing certbot
sudo yum install -y cronie
sudo systemctl enable crond.service
sudo systemctl start crond.service
sudo python3 -m venv /opt/certbot/
sudo /opt/certbot/bin/pip install --upgrade pip
sudo /opt/certbot/bin/pip install certbot certbot
sudo ln -s /opt/certbot/bin/certbot /usr/bin/certbot

echo "0 0,12 * * * root /opt/certbot/bin/python -c 'import random; import time; time.sleep(random.random() * 3600)' && sudo certbot renew --config-dir /nfs/parallel/certs/ --quiet" | sudo tee -a /etc/crontab > /dev/null

# Create a key and add it to github user parallel-ops
ssh-keygen -t ed25519 -f /home/ec2-user/.ssh/id_ed25519 -N "" -C "ops"
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519
echo "Host github.com" >> ~/.ssh/config
echo "  AddKeysToAgent yes" >> ~/.ssh/config
echo "  IdentityFile ~/.ssh/id_ed25519" >> ~/.ssh/config
echo ">>>> Copy the next line into the parallel-ops github user settings <<<<"
cat .ssh/id_ed25519.pub
chmod 700 ~/.ssh
chmod 600 ~/.ssh/*

# after adding key
ssh-keyscan -t rsa github.com >> ~/.ssh/known_hosts
git clone git@github.com:onparallel/parallel.git

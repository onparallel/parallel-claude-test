sudo hostnamectl set-hostname ops

# mount shared folder
sudo mkdir -p /nfs/parallel
sudo mount -t efs -o tls -O _netdev fs-05b0e1c4df3ecd227:/ /nfs/parallel

# Add public keys
cat authorized_keys >> .ssh/authorized_keys
rm authorized_keys

sudo yum update -y

# install binary dependencies
sudo yum install -y \
  git \
  nodejs \
  amazon-efs-utils \
  python3 \
  augeas

echo "Installing yarn"
curl -sL https://dl.yarnpkg.com/rpm/yarn.repo | sudo tee /etc/yum.repos.d/yarn.repo
sudo yum -y install yarn

echo "Installing certbot"
sudo python3 -m venv /opt/certbot/
sudo /opt/certbot/bin/pip install --upgrade pip
sudo ln -s /opt/certbot/bin/certbot /usr/bin/certbot

echo "[default]" >> ~/.aws/config
echo "region=eu-central-1" >> ~/.aws/config
# configure aws for running with sudo (for certbot manual hooks)
sudo echo "[default]" >> /root/.aws/config
sudo echo "region=eu-central-1" >> /root/.aws/config

echo "0 0,12 * * * root /opt/certbot/bin/python -c 'import random; import time; time.sleep(random.random() * 3600)' && sudo certbot renew --config-dir /nfs/parallel/certs/ --quiet" | sudo tee -a /etc/crontab > /dev/null

# Create a key and add it to github user parallel-ops
# > ssh-keygen -t ed25519
# > less .ssh/id_ed25519.pub
# > eval "$(ssh-agent -s)"
# > ssh-add ~/.ssh/id_ed25519# > vim .ssh/config
# > echo "Host github.com" >> ~/.ssh/config
# > echo "  AddKeysToAgent yes" >> ~/.ssh/config
# > echo "  IdentityFile ~/.ssh/id_ed25519" >> ~/.ssh/config
# > git clone git@github.com:onparallel/parallel.git
# > echo "cd ~/parallel/bin" >> ~/.bash_profile

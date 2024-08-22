NAME=$1
sudo hostnamectl set-hostname $NAME

# versions
nodejs_version="22" # https://nodejs.org/en

# Add public keys
cat authorized_keys >> .ssh/authorized_keys
rm authorized_keys

sudo yum update -y
sudo yum install -y \
  git

echo "Installing node.js"
sudo curl -fsSL https://rpm.nodesource.com/setup_${nodejs_version}.x | sudo bash -
sudo yum install nodejs -y
sudo npm install -g npm@latest

echo "Installing yarn"
curl -sL https://dl.yarnpkg.com/rpm/yarn.repo | sudo tee /etc/yum.repos.d/yarn.repo
sudo yum -y install yarn

mkdir .aws
echo "[default]" >> ~/.aws/config
echo "region=eu-central-1" >> ~/.aws/config

# Create a key and add it to github user parallel-ops
ssh-keygen -t ed25519 -f /home/ec2-user/.ssh/id_ed25519 -N "" -C "${NAME}"
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519
echo "Host github.com" >> ~/.ssh/config
echo "  AddKeysToAgent yes" >> ~/.ssh/config
echo "  IdentityFile ~/.ssh/id_ed25519" >> ~/.ssh/config
cat .ssh/id_ed25519.pub
chmod 700 ~/.ssh
chmod 600 ~/.ssh/*

ssh-keyscan -t rsa github.com >> ~/.ssh/known_hosts

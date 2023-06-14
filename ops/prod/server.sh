COMMAND=$1

sudo systemctl ${COMMAND} parallel-server
sudo systemctl ${COMMAND} parallel-client
sudo systemctl ${COMMAND} nginx
sudo systemctl ${COMMAND} fail2ban

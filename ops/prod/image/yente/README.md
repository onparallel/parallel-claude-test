# Updating yente

- Launch instance, point yente-blue/green.parallel.so to it.

```
cd ops/prod/image
scp yente/.env yente/nginx.conf yente/yente.service build-yente.sh yente-green:~
ssh yente-green
chmod +x build-yente.sh
sed -i -e "s/#GREENBLUE#/green/g" .env nginx.conf build-yente.sh
./build-yente.sh
```

- Edit /etc/nginx/nginx.conf and uncomment commented lines in 443 server

```
sudo systemctl reload nginx
```

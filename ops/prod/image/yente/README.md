# Updating yente

- Launch instance, point yente-blue/green.parallel.so to it.

```
cd ops/prod/image
scp yente/.env yente/nginx.conf yente/yente.service build-yente* yente-blue:~
ssh yente-blue
chmod +x build-yente*
./build-yente.sh
```

**starts yente downtime**

- Point yente.parallel.so to new yente-blue/blue.parallel.so

```
ssh yente-blue
./build-yente-postinstall.sh
```

- Edit /etc/nginx/nginx.conf and uncomment commented lines in 443 server

```
sudo systemctl reload nginx
```

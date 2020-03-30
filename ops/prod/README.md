A single nginx instance manages both production and staging. The `nginx.conf` file manages the traffic according to the hostname of the requests.

# Nginx instance

Bare Amazon Linux with:

- `nginx`: installed from source so I could use `nginx_accept_language_module`
  Followed this guide: https://www.augustkleimo.com/build-and-install-nginx-from-source-on-amazon-ec2-linux - https://www.nginx.com/resources/wiki/modules/accept_language/

```
./configure --prefix=/usr/share/nginx --sbin-path=/usr/sbin/nginx --modules-path=/usr/lib64/nginx/modules --conf-path=/etc/nginx/nginx.conf --error-log-path=/var/log/nginx/error.log --http-log-path=/var/log/nginx/access.log --http-client-body-temp-path=/var/lib/nginx/tmp/client_body --http-proxy-temp-path=/var/lib/nginx/tmp/proxy --http-fastcgi-temp-path=/var/lib/nginx/tmp/fastcgi --http-uwsgi-temp-path=/var/lib/nginx/tmp/uwsgi --http-scgi-temp-path=/var/lib/nginx/tmp/scgi --pid-path=/var/run/nginx.pid --lock-path=/var/lock/subsys/nginx --user=nginx --group=nginx --with-file-aio --with-http_ssl_module --with-http_v2_module --with-http_realip_module --with-stream_ssl_preread_module --with-http_addition_module --with-http_sub_module --with-http_dav_module --with-http_flv_module --with-http_mp4_module --with-http_gunzip_module --with-http_gzip_static_module --with-http_random_index_module --with-http_secure_link_module --with-http_degradation_module --with-http_slice_module --with-http_stub_status_module --with-http_perl_module=dynamic --with-http_auth_request_module --with-mail=dynamic --with-mail_ssl_module --with-pcre --with-pcre-jit --with-stream=dynamic --with-stream_ssl_module --with-debug --with-cc-opt='-O2 -g -pipe -Wall -Wp,-D_FORTIFY_SOURCE=2 -fexceptions -fstack-protector --param=ssp-buffer-size=4 -m64 -mtune=generic' --with-ld-opt=' -Wl,-E' --add-module=../nginx_accept_language_module
make
sudo make install

sudo vim /etc/init.d/nginx # see file on ops/prod/nginx/init.d
sudo chmod +x /etc/init.d/nginx
sudo /sbin/chkconfig nginx on
```

- `s3fs-fuse` to mount the s3 buckets as volumes
  Followed this guide: https://github.com/s3fs-fuse/s3fs-fuse/wiki/Installation-Notes
  Unix users `ec2-user` and `nginx` belong to `s3fs` group which is allowed access to the mounted volumes.
  The instance also has the `nginx-s3` role which is allowed access to the buckets on their policies.

```
sudo s3fs -o iam_role="nginx-s3" -o url="https://s3-eu-central-1.amazonaws.com" -o endpoint=eu-central-1 -o dbglevel=info -o curldbg -o allow_other -o use_cache=/tmp -ogid=501 parallel-static-landing-prod /mnt/parallel-static-landing-prod
```

#! /bin/bash

nodejs_version="15"
nginx_version="nginx-1.18.0"

echo "Adding public keys"
cat authorized_keys >> .ssh/authorized_keys
rm authorized_keys

yum install -y \
    git \
    gcc \
    gcc-c++ \
    make \
    curl \
    pcre-devel \
    zlib-devel \
    openssl-devel \
    perl-ExtUtils-Embed \

echo "Installing node.js"
curl -sL https://rpm.nodesource.com/setup_${nodejs_version}.x | bash -
echo "Installing yarn"
curl -sL https://dl.yarnpkg.com/rpm/yarn.repo | tee /etc/yum.repos.d/yarn.repo
yum -y install yarn

echo "Installing nginx"
git clone https://github.com/giom/nginx_accept_language_module
curl -O https://nginx.org/download/${nginx_version}.tar.gz
tar -xvf ${nginx_version}.tar.gz 
pushd ${nginx_version}
./configure \
    --prefix=/usr/share/nginx \
    --sbin-path=/usr/sbin/nginx \
    --modules-path=/usr/lib64/nginx/modules \
    --conf-path=/etc/nginx/nginx.conf \
    --error-log-path=/var/log/nginx/error.log \
    --http-log-path=/var/log/nginx/access.log \
    --http-client-body-temp-path=/var/lib/nginx/tmp/client_body \
    --http-proxy-temp-path=/var/lib/nginx/tmp/proxy \
    --http-fastcgi-temp-path=/var/lib/nginx/tmp/fastcgi \
    --http-uwsgi-temp-path=/var/lib/nginx/tmp/uwsgi \
    --http-scgi-temp-path=/var/lib/nginx/tmp/scgi \
    --pid-path=/var/run/nginx.pid \
    --lock-path=/var/lock/subsys/nginx \
    --user=nginx \
    --group=nginx \
    --with-file-aio \
    --with-http_ssl_module \
    --with-http_v2_module \
    --with-http_realip_module \
    --with-stream_ssl_preread_module \
    --with-http_addition_module \
    --with-http_sub_module \
    --with-http_dav_module \
    --with-http_flv_module \
    --with-http_mp4_module \
    --with-http_gunzip_module \
    --with-http_gzip_static_module \
    --with-http_random_index_module \
    --with-http_secure_link_module \
    --with-http_degradation_module \
    --with-http_slice_module \
    --with-http_stub_status_module \
    --with-http_perl_module=dynamic \
    --with-http_auth_request_module \
    --with-mail=dynamic \
    --with-mail_ssl_module \
    --with-pcre \
    --with-pcre-jit \
    --with-stream=dynamic \
    --with-stream_ssl_module \
    --with-debug \
    --with-cc-opt='-O2 -g -pipe -Wall -Wp,-D_FORTIFY_SOURCE=2 -fexceptions -fstack-protector --param=ssp-buffer-size=4 -m64 -mtune=generic' \
    --with-ld-opt=' -Wl,-E' \
    --add-module=../nginx_accept_language_module
make
make install
popd > /dev/null
mv nginx.service /lib/systemd/system/nginx.service
adduser --system --no-create-home --user-group --shell /sbin/nologin nginx
mkdir -p /var/lib/nginx/tmp
chown nginx /var/lib/nginx/tmp
chgrp nginx /var/lib/nginx/tmp
echo 'parallel:$apr1$wY1qv83a$ErfofKvlFLeIZ4r4ijEDw/' >>.htpasswd
mv nginx.conf /etc/nginx/nginx.conf
systemctl daemon-reload
systemctl enable nginx.service 
systemctl start nginx.service

bash install-google-chrome.sh

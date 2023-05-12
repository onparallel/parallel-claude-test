#! /bin/bash


# versions
nodejs_version="18" # https://nodejs.org/en
nginx_version="1.24.0" # http://nginx.org/en/download.html
modsecurity_version="3.0.9" # https://github.com/SpiderLabs/ModSecurity/releases
modsecurity_nginx_version="1.0.3" # https://github.com/SpiderLabs/ModSecurity-nginx/releases
coreruleset_version="3.3.4" # https://github.com/coreruleset/coreruleset/releases
ngx_devel_kit_version="0.3.2" # https://github.com/vision5/ngx_devel_kit/releases
set_misc_nginx_module_version="0.33" # https://github.com/openresty/set-misc-nginx-module/tags
headers_more_nginx_module_version="0.34" # https://github.com/openresty/headers-more-nginx-module/tags
image_exiftool_version="12.62" # https://exiftool.org/

echo "Adding public keys"
cat authorized_keys >> .ssh/authorized_keys
rm authorized_keys

sudo yum update -y

# install binary dependencies
sudo yum install -y \
  git \
  amazon-cloudwatch-agent \
  ghostscript \
  ImageMagick \
  qpdf \
  amazon-efs-utils \
  collectd

function download_and_untar() {
  curl --silent --location --output $1.tar.gz $2
  mkdir $1
  tar -xf $1.tar.gz --directory $1 --strip-components 1
  rm $1.tar.gz
}

echo "Installing node.js"
curl -sL https://rpm.nodesource.com/setup_${nodejs_version}.x | sudo bash -
sudo yum install -y nodejs

echo "Installing yarn"
curl -sL https://dl.yarnpkg.com/rpm/yarn.repo | sudo tee /etc/yum.repos.d/yarn.repo
sudo yum -y install yarn

echo "Installing nginx"
download_and_untar nginx https://nginx.org/download/nginx-${nginx_version}.tar.gz
download_and_untar modsecurity https://github.com/SpiderLabs/ModSecurity/releases/download/v${modsecurity_version}/modsecurity-v${modsecurity_version}.tar.gz
download_and_untar modsecurity-nginx https://github.com/SpiderLabs/ModSecurity-nginx/releases/download/v${modsecurity_nginx_version}/modsecurity-nginx-v${modsecurity_nginx_version}.tar.gz
download_and_untar modsecurity-crs https://github.com/coreruleset/coreruleset/archive/refs/tags/v${coreruleset_version}.tar.gz
download_and_untar nginx-accept-language-module https://github.com/giom/nginx_accept_language_module/tarball/master
download_and_untar ngx-devel-kit https://github.com/vision5/ngx_devel_kit/archive/refs/tags/v${ngx_devel_kit_version}.tar.gz
download_and_untar set-misc-nginx-module https://github.com/openresty/set-misc-nginx-module/archive/refs/tags/v${set_misc_nginx_module_version}.tar.gz
download_and_untar headers-more-nginx-module https://github.com/openresty/headers-more-nginx-module/archive/refs/tags/v${headers_more_nginx_module_version}.tar.gz

pushd modsecurity
sudo yum install -y \
  pcre-devel \
  gcc-c++ \
  libtool \
  automake \
  yajl-devel \
  libmaxminddb-devel
./build.sh
./configure
make
sudo make install
sudo mkdir -p /etc/nginx/modsec
sudo cp unicode.mapping /etc/nginx/modsec/
popd

pushd nginx
sudo yum install -y \
  gcc \
  pcre-devel \
  openssl-devel \
  perl-ExtUtils-Embed \
  zlib-devel

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
    --add-module=../modsecurity-nginx \
    --add-module=../nginx-accept-language-module \
    --add-module=../ngx-devel-kit \
    --add-module=../set-misc-nginx-module \
    --add-module=../headers-more-nginx-module
make
sudo make install
popd

sudo mv modsecurity-crs /etc/nginx/modsec/

echo "Installing exiftool"
download_and_untar image-exiftool https://exiftool.org/Image-ExifTool-${image_exiftool_version}.tar.gz
pushd image-exiftool
perl Makefile.PL
make test
sudo make install
popd

if /usr/sbin/nginx -v 2>&1 | grep -q "nginx version: nginx/${nginx_version}"; then
  echo "Nginx.........ok"
else
  echo "Nginx.........failed"
  exit 1 
fi
if exiftool -ver | grep -q "${exiftool_version}"; then
  echo "Exiftool......ok"
else
  echo "Exiftool......failed"
  exit 1 
fi
exit 0

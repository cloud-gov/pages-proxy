FROM nginx
COPY . /usr/share/nginx/html
COPY tmp/nginx.conf /etc/nginx/nginx.conf
COPY mime.types /etc/nginx/mime.types
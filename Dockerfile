FROM nginx:1.13.0

# Install ruby and bundler
RUN apt-get update
RUN apt-get install -y build-essential ruby2.3-dev
RUN gem install bundler

# Add site files
COPY . /src

# Setup App Root
RUN mkdir /app \
    && mkdir -p /app/nginx/logs/ \
    && mkdir -p /app/public \
    && cp -r /src/* /app/public/

# Set defaults for environment in nginx.conf
ENV APP_ROOT /app
ENV FEDERALIST_PROXY_SERVER_NAME localhost
ENV PORT 80

CMD erb /src/nginx.conf > /etc/nginx/nginx.conf && nginx

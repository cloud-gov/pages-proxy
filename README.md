# federalist-proxy

[![CircleCI](https://circleci.com/gh/18F/federalist-proxy.svg?style=svg)](https://circleci.com/gh/18F/federalist-proxy)

Proxies traffic from the Federalist S3 bucket to a CDN broker. Ensures HTTPS and adds the proper headers.

## Usage

To deploy the app:

    $ cf push -f manifest.yml

## Proxying a Site

When a site is added to Federalist, it will be available through this proxy at `https://federalist-proxy.app.cloud.gov/site/<owner>/<repo>`. When the site is ready to go live, a CloudFront distribution with the proxy URL as its origin can be provisioned.

```shell
cf create-service cdn-route cdn-route YOUR.URL.gov-route -c '
  {
    "domain": "YOUR.URL.gov",
    "origin": "federalist-proxy.app.cloud.gov",
    "path": "/site/org/repo-name"
  }
'
```

## Headers

This proxy adds the following headers to the response from the S3 bucket:

- Strict-Transport-Security: max-age=31536000; preload
- X-Frame-Options: SAMEORIGIN

## Running tests locally using Docker
``
docker-compose run --no-deps app npm install
docker-compose run --no-deps app node ./bin/parse-conf.js
docker-compose run app npm test
``
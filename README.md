# federalist-proxy

[![CircleCI](https://circleci.com/gh/18F/federalist-proxy.svg?style=svg)](https://circleci.com/gh/18F/federalist-proxy)

Proxies traffic from the Federalist S3 bucket to a CDN broker. Ensures HTTPS and adds the proper headers.

## Usage

To deploy the app:

    $ cf7 push <app-name> --strategy rolling --vars-file </path/to/vars-file> -f </path/to/manifest>

If the rolling deployment fails for any reason, make sure to clean up by running:
    $ cf7 cancel-deployment <app-name>

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
- X-Server: Federalist

## Unique Site Headers

To support sites with expanded HSTS headers, the proxy uses the
{{ INCLUDE_SUBDOMAINS }} environment variable to identify these requests to provide
the expanded header `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`.
If these Federalist site domains change for any reason, the {{ INCLUDE_SUBDOMAINS }}
variable will need to be updated in the `manifest.yml`.

## Running tests locally using Docker
``
docker-compose run --no-deps --rm app npm install
docker-compose run --no-deps --rm app node ./bin/parse-conf.js
docker-compose run --rm app npm test
``

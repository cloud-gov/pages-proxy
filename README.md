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

- Strict-Transport-Security: max-age=31536000
- X-Frame-Options: SAMEORIGIN

## Running locally using CF Local

The proxy can be run locally using [CF Local](https://github.com/cloudfoundry-incubator/cflocal/). To start the site using CF Local, run the following after install CF Local plugin:

```
cf local pull federalist-proxy-staging
cf local run federalist-proxy-staging -f federalist-proxy-staging -w -d ./federalist-proxy-staging.droplet
```
In the terminal, take note of the port on which the proxy is running.
```
Running federalist-proxy-staging on port 12345...
```
The proxy should be available at `https://localhost:12345/`.

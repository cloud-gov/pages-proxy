# pages-proxy

Proxies traffic from the Cloud.gov Pages (formerly Federalist) S3 bucket to a CDN broker. Ensures HTTPS and adds the proper headers.

## Usage

To deploy the app:

    $ cf push <app-name> --strategy rolling --vars-file </path/to/vars-file> -f </path/to/manifest>

If the rolling deployment fails for any reason, make sure to clean up by running:
    $ cf cancel-deployment <app-name>

## Proxying a Site

When a site is added to Pages, it will be available through this proxy at `https://<site-bucket>.sites.pages.cloud.gov/site/<owner>/<repo>`. When the site is ready to go live, a CloudFront distribution with the proxy URL as its origin can be provisioned. This is done via the Admin UI panel in the '/domains' tab by creating a domain, ensuring [correct CNAME configuration](https://federalist.18f.gov/documentation/custom-domains/), and clicking "Provision".

## Headers

This proxy adds the following headers to the response from the S3 bucket:

- Strict-Transport-Security: max-age=31536000; preload
- X-Frame-Options: SAMEORIGIN
- X-Server: Cloud.gov Pages

## Unique Site Headers

To support sites with expanded HSTS headers, the proxy uses the
{{ INCLUDE_SUBDOMAINS }} environment variable to identify these requests to provide
the expanded header `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`.
If these site domains change for any reason, the {{ INCLUDE_SUBDOMAINS }}
variable will need to be updated in the `manifest.yml`.

## Short-term Site Redirects

To support short-term site redirects, the proxy uses an included redirects config which is built during deployment via a credhub json credential named `proxy-<env>-site-redirects` and set as an environment variable as `SITE_REDIRECTS`. The site redirects value is an array of objects with the following structure:

|Key|Required?|Default|Description|
--- | --- | --- | --- |
|`subdomain`|:white_check_mark:|__N/A__|The site's Pages subdomain|
|`target`|:white_check_mark:|__N/A__|The target domain for the redirect|
|`path`|:x:|`''`|An optional path appended to the redirect target|
|`usePreviewPath`|:x:|`false`|An optional boolean to append the site's preview path to redirect target|

## Local setup
### Install Depedencies
```
  docker-compose run --no-deps --rm app npm install
```

### Running tests against the mock server
```
  docker-compose run --no-deps --rm app npm run parse
  docker-compose run --rm app npm test
```

### Running tests against s3 buckets
```
  docker-compose run --no-deps --rm app npm run parse:integration
  docker-compose run --rm app npm run test:integration
```

## Continuous Integration
The proxy uses Concourse CI to run tests and deploy to different environments in the cloud.gov Pages organization. The pipeline is defined in the [`ci/pipeline.yml`](./ci/pipeline.yml) file and supporting CI scripts are found in the [`ci`](./ci) directory. This pipeline is using Concourse's [`instanced pipeline`](https://concourse-ci.org/instanced-pipelines.html) feature to minimize boilerplate configuration when declaring tasks and resources for each deployment environment.

__*&#8595; NOTICE &#8595;*__

> __Proxy Dev__ deploys the proxy app when a PR is created into the `staging` branch. This uses a unique pipeline file: [./ci/pipeline-dev.yml](./ci/pipeline-dev.yml)

### Pipeline instance variables
Two instances of the pipeline are set for the `staging` and `production` environments. Instance variables are used to fill in Concourse pipeline parameter variables bearing the same name as the instance variable. See more on [Concourse vars](https://concourse-ci.org/vars.html).  Each instance of the pipeline has two instance variables associated to it: `deploy-env` & `git-branch`.

|Instance Variable|Dev Environment|Staging Environment|Production Environment|
--- | --- | --- | --- |
|**`deploy-env`**|`dev`|`staging`|`production`|
|**`git-branch`**|`staging`|`staging`|`main`|

### Pipeline credentials
Concourse CI integrates directly with [Credhub](https://docs.cloudfoundry.org/credhub/) to provide access to credentials/secrets at job runtime. When a job is started, Concourse will resolve the parameters within the pipeline with the latest credentials using the double parentheses notation (ie. `((<credential-name>))`). See more about the [credentials lookup rules](https://concourse-ci.org/credhub-credential-manager.html#credential-lookup-rules).

Some credentials in this pipeline are "compound" credentials that use the pipeline's instance variable in conjuction with its parameterized variables to pull the correct Credhub credentials based on the pipeline instance. The following parameters are used in the proxy pipeline:

|Parameter|Description|Is Compound|
--- | --- | --- |
|**`((((deploy-env))-cf-username))`**|The deployment environments CloudFoundry deployer username based on the instanced pipeline|:white_check_mark:|
|**`((((deploy-env))-cf-username))`**|The deployment environments CloudFoundry deployer password based on the instanced pipeline|:white_check_mark:|
|**`((dedicated-aws-access-key-id))`**|AWS access key for testing|:x:|
|**`((dedicated-aws-secret-access-key))`**| AWS secret key for testing|:x:|
|**`((slack-channel))`**| Slack channel | :x:|
|**`((slack-username))`**| Slack username | :x:|
|**`((slack-icon-url))`**| Slack icon url | :x:|
|**`((slack-webhook-url))`**| Slack webhook url | :x:|
|**`((git-base-url))`**|The base url to the git server's HTTP endpoint|:x:|
|**`((proxy-repository-path))`**|The url path to the repository|:x:|
|**`((gh-access-token))`**| The Github access token|:x:|
|**`((pages-proxy-((deploy-env))-site-redirects))`**|JSON array of redirect objects|:white_check_mark:|

### Setting up the pipeline
The pipeline and each of it's instances will only need to be set once per instance to create the initial pipeline. After the pipelines are set, updates to the respective `git-branch` source will automatically set the pipeline with any updates. See the [`set_pipeline` step](https://concourse-ci.org/set-pipeline-step.html) for more information. Run the following command with the fly CLI to set a pipeline instance:

```bash
$ fly -t <Concourse CI Target Name> set-pipeline -p proxy \
  -c ci/pipeline.yml \
  -i git-branch=main \
  -i deploy-env=production
```

### Getting or deleting a pipeline instance from the CLI
To get a pipeline instance's config or destroy a pipeline instance, Run the following command with the fly CLI to set a pipeline:

```bash
## Get a pipeline instance config
$ fly -t <Concourse CI Target Name> get-pipeline \
  -p proxy/deploy-env:production,git-branch:main

## Destroy a pipeline
$ fly -t <Concourse CI Target Name> destroy-pipeline \
  -p proxy/deploy-env:production,git-branch:main
```

## Notes
### When making changes
In order for changes to the `nginx.conf` file or mock server to be reflected when running the tests, the dockers services must be restarted. This can be done by running `docker-compose down` before the above commands to parse the nginx.conf and run the tests.

### Integration tests
Integration tests use the following S3 buckets provisioned in the `sandbox` space in the `gsa-18f-federalist` cloud.gov organization:
- `proxy-integration-test-dedicated`

Before running the tests, make a copy of the `.env.sample` file named `.env` and populate with the credentials from corresponding service keys `proxy-integration-test-dedicated-key` in the `sandbox` space. Ex. `cf t -s sandbox && cf service-key proxy-integration-test-dedicated proxy-integration-test-dedicated-key`.

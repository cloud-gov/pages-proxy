const { expect } = require('chai');
const supertest = require('supertest');
const { createMakeRequest, createMakeCloudfrontRequest } = require('./helpers');

const { parseConf } = require('../bin/parse-conf');

const {
  PREVIEW_PATH_PREFIX,
  DEFAULT_PATH_PREFIX,
  PROXY_URL,
  DOMAIN,
  INCLUDE_SUBDOMAINS,
} = process.env;

supertest.Test.prototype.expectStandardHeaders = function () {
  this.expect('X-Frame-Options', 'SAMEORIGIN');
  this.expect('X-Server', 'Cloud.gov Pages');
  this.expect('X-Robots-Tag', 'none');
  this.expect('Strict-Transport-Security', /max-age=31536000; preload/);

  return this;
};

supertest.Test.prototype.expectCloudfrontHeaders = function () {
  this.expect('X-Frame-Options', 'SAMEORIGIN');
  this.expect('X-Server', 'Cloud.gov Pages');
  this.expect('X-Robots-Tag', 'all');
  this.expect('Strict-Transport-Security', /max-age=31536000; preload/);

  return this;
};

const request = supertest(PROXY_URL);
const makeRequest = createMakeRequest(request);
const makeCloudfrontRequest = createMakeCloudfrontRequest(request);
const previewPrefixPath = (path) => `/${PREVIEW_PATH_PREFIX}${path}`;
const defaultPrefixPath = (path) => `/${DEFAULT_PATH_PREFIX}${path}`;
previewPrefixPath.toString = () => 'preview path';
defaultPrefixPath.toString = () => 'default path';

const prefixPathFns = [previewPrefixPath, defaultPrefixPath];

describe('parse-conf', () => {
  it('removes `daemon` configuration', () => {
    const template = `
      foo;
      daemon off;
      bar;
    `;
    const funcs = {};

    const result = parseConf(template, funcs);
    const trimmed = result.replace(/\s/g, '');

    expect(trimmed).to.equal('foo;bar;');
  });

  it('replaces interpolated functions with no arguments', () => {
    const template = `
      foo;
      listen {{port}};
      bar;
    `;
    const funcs = {
      port() {
        return 9000;
      },
    };

    const result = parseConf(template, funcs);

    expect(result).to.equal(`
      foo;
      listen 9000;
      bar;
    `);
  });

  it('replaces interpolated functions with arguments', () => {
    const value = 'BUCKET_URL';

    const template = `
      foo;
      set $bucket_url {{env "${value}"}};
      bar;
    `;
    const funcs = {
      env(arg) {
        return `http://${arg}`;
      },
    };

    const result = parseConf(template, funcs);

    expect(result).to.equal(`
      foo;
      set $bucket_url http://${value};
      bar;
    `);
  });
});

describe('robots.txt', () => {
  it('is not present', () => {
    return request.get('/robots.txt').expectStandardHeaders().expect(404);
  });
});

describe('Health check', () => {
  it('returns 200', () => {
    return request.get('/health').expectStandardHeaders().expect(200);
  });
});

describe('Unallowed HTTP Methods', () => {
  const host = 'foobar.app.cloud.gov';

  it('with the DELETE method', () => {
    return request
      .delete(defaultPrefixPath('/bucket.html'))
      .set('Host', host)
      .expectStandardHeaders()
      .expect(405);
  });

  it('with the OPTIONS method', () => {
    return request
      .options(defaultPrefixPath('/bucket.html'))
      .set('Host', host)
      .expectStandardHeaders()
      .expect(405);
  });

  it('with the PATCH method', () => {
    return request
      .patch(defaultPrefixPath('/bucket.html'))
      .set('Host', host)
      .expectStandardHeaders()
      .expect(405);
  });

  it('with the POST method', () => {
    return request
      .post(defaultPrefixPath('/bucket.html'))
      .set('Host', host)
      .expectStandardHeaders()
      .expect(405);
  });

  it('with the PUT method', () => {
    return request
      .put(defaultPrefixPath('/bucket.html'))
      .set('Host', host)
      .expectStandardHeaders()
      .expect(405);
  });

  it('with the TRACE method', () => {
    return request
      .trace(defaultPrefixPath('/bucket.html'))
      .set('Host', host)
      .expectStandardHeaders()
      .expect(405);
  });
});

describe('For non-`pages-proxy-staging` hosts', () => {
  const host = 'foobar.app.cloud.gov';

  for (const prefixPathFn of prefixPathFns) {
    describe(`with the ${prefixPathFn}`, () => {
      it('returns results from the DEDICATED bucket', () => {
        return makeRequest(prefixPathFn('/bucket.html'), host, [
          [200],
          [/dedicated/i],
        ]);
      });

      describe('Paths', pathSpecs(host, prefixPathFn));
    });
  }
});

describe('Get ~assets/...', () => {
  it('redirects to /~assets/test.txt', async () => {
    const path = defaultPrefixPath('/~assets/test.txt');

    const req = await request.get(path).expectStandardHeaders().expect(200);
  });

  it('redirects to /~assets/a/child/path/test.txt', async () => {
    const path = defaultPrefixPath('/~assets/a/child/path/test.txt');

    const req = await request.get(path).expectStandardHeaders().expect(200);
  });

  it('return to 404 when trailing slash', async () => {
    const path = defaultPrefixPath('/~assets/data/');

    const req = await request.get(path).expectStandardHeaders().expect(404);
  });

  it('return to 404 when no file extension is added', async () => {
    const path = defaultPrefixPath('/~assets/data');

    const req = await request.get(path).expectStandardHeaders().expect(404);
  });
});

describe('For `includeSubdomains` specific hosts', () => {
  const subs = INCLUDE_SUBDOMAINS.split('|');
  for (const sub of subs) {
    const host = `${sub}.app.cloud.gov`;

    for (const prefixPathFn of prefixPathFns) {
      describe(`with the ${prefixPathFn}`, () => {
        it('returns results from the DEDICATED bucket', () => {
          return makeRequest(prefixPathFn('/bucket.html'), host, [
            [200],
            [/dedicated/i],
          ]);
        });

        describe('Headers', () => {
          it('includes expected headers', () => {
            return makeRequest(prefixPathFn('/file/'), host, [
              [200],
              ['Content-Type', /charset=utf-8/],
              [
                'Strict-Transport-Security',
                'max-age=31536000; preload; includeSubDomains',
              ],
            ]);
          });

          describe('Paths', pathSpecs(host, prefixPathFn));
        });
      });
    }
  }
});

function pathSpecs(host, prefixPathFn) {
  return () => {
    describe('/<some-path>', () => {
      describe('when the file is a redirect object', () => {
        it('redirects to /<some-path>/', () => {
          const path = prefixPathFn('/redirect-object');
          return makeRequest(path, host, [
            [301],
            ['Content-Type', 'text/html'],
            ['Location', `${path}/`],
          ]);
        });

        describe('with query parameters', () => {
          it('redirects to /<some-path>/?<query-params>', () => {
            const path = prefixPathFn('/redirect-object');
            const query = '?foo.bar=baz';
            return makeRequest(`${path}${query}`, host, [
              [301],
              ['Content-Type', 'text/html'],
              ['Location', `${path}/${query}`],
            ]);
          });
        });
      });

      describe('when the file exists with a content type', () => {
        it('redirects to /<some-path>/', () => {
          const path = prefixPathFn('/file');
          return makeRequest(path, host, [
            [301],
            ['Content-Type', 'text/html'],
            ['Location', `${path}/`],
          ]);
        });
      });

      describe('when the file exists without a content type', () => {
        it('redirects to /<some-path>/', () => {
          const path = prefixPathFn('/no-content-type');
          return makeRequest(path, host, [
            [301],
            ['Content-Type', 'text/html'],
            ['Location', `${path}/`],
          ]);
        });
      });

      describe('when the file does not exist', () => {
        it('redirects to /<some-path>/', () => {
          const path = prefixPathFn('/unicorn');
          return makeRequest(path, host, [
            [301],
            ['Content-Type', 'text/html'],
            ['Location', `${path}/`],
          ]);
        });
      });

      if (prefixPathFn.toString() === 'preview path') {
        it('redirects to /<some-path>/ with the prefix', () => {
          const path = prefixPathFn('/unicorn');
          const location = prefixPathFn('/unicorn/');

          return makeRequest(path, host, [
            [301],
            ['Content-Type', 'text/html'],
            ['Location', location],
          ]);
        });

        describe('for potential open redirects', () => {
          it('returns a 404', () => {
            const path = prefixPathFn(encodeURI('/\\example.com/%2e%2e%2f')); // /%5C%5Cexample.com/%252e%252e%252f

            return makeRequest(path, host, [[404]]);
          });

          it('returns a 404 when using double encoded forward slashes', () => {
            const path = prefixPathFn('/%252F%252Fexample.com/%2e%2e%2f');
            return makeRequest(path, host, [[404]]);
          });
        });
      } else {
        it('redirects to /<some-path>/ without the prefix', () => {
          const path = prefixPathFn('/unicorn');
          const location = '/unicorn/';

          return makeCloudfrontRequest(path, host, [
            [301],
            ['Content-Type', 'text/html'],
            ['Location', location],
          ]);
        });

        describe('for potential open redirects', () => {
          it('returns a 404 when using backslashes', () => {
            const path = prefixPathFn(encodeURI('/\\example.com/%2e%2e%2f')); // /%5C%5Cexample.com/%252e%252e%252f

            return makeCloudfrontRequest(path, host, [[404]]);
          });

          it('returns a 404 when using single encoded backslashes', () => {
            const path = prefixPathFn('/%5C%5Cexample.com/%2e%2e%2f');

            return makeCloudfrontRequest(path, host, [[404]]);
          });

          it('returns a 404 when using double encoded backslashes', () => {
            const path = prefixPathFn('/%255C%255Cexample.com/%2e%2e%2f');
            return makeCloudfrontRequest(path, host, [[404]]);
          });

          it('returns a 404 when using double encoded forward slashes', () => {
            const path = prefixPathFn('/%252F%252Fexample.com/%2e%2e%2f');
            return makeCloudfrontRequest(path, host, [[404]]);
          });
          // TODO: add back confirming test
          // it('returns a 301 when using characters from encoded backslashes', () => {
          //   const path = prefixPathFn('/foo/bar/2023-data');
          //   return makeCloudfrontRequest(path, host, [
          //     [301],
          //   ]);
          // });
        });
      }
    });

    describe('/<some-path-with-period>', () => {
      describe('when the file is a redirect object', () => {
        it('redirects to /<some-path-with-period>/', () => {
          const path = prefixPathFn('/foo/path.with.period/bar');
          return makeRequest(path, host, [
            [301],
            ['Content-Type', 'text/html'],
            ['Location', `${path}/`],
          ]);
        });
      });
    });

    describe('/<some-path>/', () => {
      describe('when /<some-path>/index.html exists', () => {
        it('serves /<some-path>/index.html', () => {
          return makeRequest(prefixPathFn('/file/'), host, [[200], [/file2/i]]);
        });
      });

      describe('when /<some-path>/index.html does not exist', () => {
        it('serves the default 404.html', () => {
          return makeRequest(prefixPathFn('/unicorn/'), host, [
            [404],
            // Should ALWAYS return the *bucket* 404
            [/default - 4044444444/i],
          ]);
        });
      });
    });

    describe('/<some-path>/index.html', () => {
      describe('when /<some-path>/index.html exists', () => {
        it('serves /<some-path>/index.html', () => {
          return makeRequest(prefixPathFn('/file/index.html'), host, [
            [200],
            [/file2/i],
          ]);
        });

        describe('with query parameters', () => {
          it('serves /<some-path>/index.html', () => {
            return makeRequest(
              prefixPathFn('/file/index.html?foo=bar&baz.bar=foo'),
              host,
              [[200], [/file2/i]]
            );
          });
        });
      });
    });
  };
}

function matchBody(regex) {
  return (response) => expect(response.body.toString()).to.match(regex);
}

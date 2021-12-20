const request = require('supertest');
const { expect } = require('chai');

const { parseConf } = require('../bin/parse-conf');

const { PROXY_URL: app, DOMAIN: DOMAIN } = process.env;

describe('parse-conf', () => {
  it('removes `daemon` configuration', () => {
    const template = `
      foo;
      daemon off;
      bar;
    `;
    const funcs = {};

    const result = parseConf(template, funcs);

    expect(result).to.equal(`
      foo;
      
      bar;
    `);
  });

  it('replaces interpolated functions with no arguments', () => {
    const template = `
      foo;
      listen {{port}};
      bar;
    `;
    const funcs = { port() { return 9000; } };

    const result = parseConf(template, funcs);

    expect(result).to.equal(`
      foo;
      listen 9000;
      bar;
    `);
  });

  it('replaces interpolated functions with arguments', () => {
    const value = 'BUCKET_URL'

    const template = `
      foo;
      set $bucket_url {{env "${value}"}};
      bar;
    `;
    const funcs = { env(arg) { return `http://${arg}`; } };

    const result = parseConf(template, funcs);

    expect(result).to.equal(`
      foo;
      set $bucket_url http://${value};
      bar;
    `);
  });
});

describe('robots.txt', () => {
  it('is available', () => {
    return request(app)
      .get('/robots.txt')
      .expect(200)
      .expect('Content-Type', /text\/plain/)
      .then(matchText(/Disallow/));
  });
});

describe('Health check', () => {
  it('returns 200', () => {
    return request(app)
      .get('/health')
      .expect(200);
  });
});

describe('For `federalist-proxy-staging` hosts', () => {
  const host = 'federalist-proxy-staging.app.cloud.gov';

  it('returns results from the SHARED bucket', () => {
    return request(app)
      .get('/bucket.html')
      .set('Host', host)
      .expect(200)
      .then(matchText(/shared/i));
  });

  describe('Headers', headerSpecs(host));
  describe('Paths', pathSpecs(host));
});

describe('For non-`federalist-proxy-staging` hosts', () => {
  const host = 'foobar.app.cloud.gov';

  it('returns results from the DEDICATED bucket', () => {
    return request(app)
      .get('/bucket.html')
      .set('Host', host)
      .expect(200)
      .then(matchText(/dedicated/i));
  });

  describe('Headers', headerSpecs(host));
  describe('Paths', pathSpecs(host));
});

describe('For `includeSubdomains` specific hosts', () => {
  const subs = process.env.INCLUDE_SUBDOMAINS.split('|');
  for(const sub of subs) {
    const host = `${sub}.app.cloud.gov`;

    it('returns results from the DEDICATED bucket', () => {
      return request(app)
        .get('/bucket.html')
        .set('Host', host)
        .expect(200)
        .then(matchText(/dedicated/i));
    });

    describe('Headers', () => {
      it('includes expected headers', () => {
        return request(app)
          .get('/file')
          .set('Host', host)
          .expect(200)
          .expect('Content-Type', /charset=utf-8/)
          .expect('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
          .expect('X-Frame-Options', 'SAMEORIGIN')
          .expect('X-Server', 'Federalist');
      });

      describe('For .cfm files', () => {
        it('includes text/html content type header', () => {
          return request(app)
            .get('/test/helloworld.cfm')
            .set('Host', host)
            .expect(200)
            .expect('Content-Type', /text\/html/);
        });
      });
    });
    describe('Paths', pathSpecs(host));
  }
});

function pathSpecs(host) {
  return () => {

    describe('/<some-path>', () => {
      describe('when the file is a redirect object', () => {
        it('serves the content at the redirect location', () => {
          const path = '/redirect-object';
          
          return request(app)
            .get(path)
            .set('Host', host)
            .expect(200)
            .expect('Content-Type', 'text/html; charset=utf-8')
            .then(matchText(/redirect-object-target/i));
        });
      });

      describe('when the file exists with a content type', () => {
        it('serves the file', () => {
          const path = '/file';

          return request(app)
            .get(path)
            .set('Host', host)
            .expect(200)
            .expect('Content-Type', 'text/html; charset=utf-8')
            .then(matchText(/file/i));
        });
      });

      describe('when the file exists without a content type', () => {
        it('serves the file', () => {
          const path = '/no-content-type';

          return request(app)
            .get(path)
            .set('Host', host)
            .expect(200)
            .expect('Content-Type', 'application/octet-stream')
            .then(matchBody(/no-content-type/i));
        });
      });

      describe('when the file does not exist', () => {
        it('serves the default 404.html', () => {
          const path = '/unicorn';

          return request(app)
            .get(path)
            .set('Host', host)
            .expect(404)
            .then(matchText(/4044444444/i));
        });
      })
    });

    describe('/<some-path>/', () => {
      describe('when /<some-path>/index.html exists', () => {
        it('serves /<some-path>/index.html', () => {
          const path = '/file/';
          return request(app)
            .get(path)
            .set('Host', host)
            .expect(200)
            .then(matchText(/file2/i));
        });
      });

      describe('when /<some-path>/index.html does not exist', () => {
        it('serves the default 404.html', () => {
          const path = '/unicorn/';
          return request(app)
            .get(path)
            .set('Host', host)
            .expect(404)
            .then(matchText(/4044444444/i));
        });
      });
    });

    describe('/<some-path>/index.html', () => {
      describe('when /<some-path>/index.html exists', () => {
        it('serves /<some-path>/index.html', () => {
          const path = '/file/index.html';
          return request(app)
            .get(path)
            .set('Host', host)
            .expect(200)
            .then(matchText(/file2/i));
        });
      });
    });
  };
}

function headerSpecs(host) {
  return () => {
    it('includes expected headers', () => {
      return request(app)
        .get('/file')
        .set('Host', host)
        .expect(200)
        .expect('Content-Type', /charset=utf-8/)
        .expect('Strict-Transport-Security', 'max-age=31536000; preload')
        .expect('X-Frame-Options', 'SAMEORIGIN')
        .expect('X-Server', 'Federalist');
    });

    describe('For .cfm files', () => {
      it('includes text/html content type header', () => {
        return request(app)
          .get('/test/helloworld.cfm')
          .set('Host', host)
          .expect(200)
          .expect('Content-Type', /text\/html/);
      });
    });
  };
}

function matchBody(regex) {
  return response => expect(response.body.toString()).to.match(regex);
}

function matchText(regex) {
  return response => expect(response.text).to.match(regex);
}

const request = require('supertest');
const app = process.env.PROXY_URL;
const { expect } = require('chai');
const { parseConf } = require('../bin/parse-conf');

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
    const template = `
      foo;
      set $bucket_url {{env "DOMAIN"}};
      bar;
    `;
    const funcs = { env(arg) { return `http://${arg}`; } };

    const result = parseConf(template, funcs);

    expect(result).to.equal(`
      foo;
      set $bucket_url http://DOMAIN;
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
      .get('/')
      .set('Host', host)
      .expect(200)
      .then(matchText(/You have reached the shared bucket/i));
  });

  describe('Headers', headerSpecs(host));
});

describe('For non-`federalist-proxy-staging` hosts', () => {
  const host = 'foobar.app.cloud.gov';

  it('returns results from the DEDICATED bucket', () => {
    return request(app)
      .get('/')
      .set('Host', host)
      .expect(200)
      .then(matchText(/You have reached the dedicated bucket/i));
  });

  describe('Headers', headerSpecs(host));
});

describe('For `includeSubdomains` specific hosts', () => {
  const subs = process.env.INCLUDE_SUBDOMAINS.split('|');
  for(const sub of subs) {
    const host = `${sub}.app.cloud.gov`;

    it('returns results from the DEDICATED bucket', () => {
      return request(app)
        .get('/')
        .set('Host', host)
        .expect(200)
        .then(matchText(/You have reached the dedicated bucket/i));
    });

    describe('Headers', () => {
      it('includes charset utf-8 content type header', () => {
        return request(app)
          .get('/')
          .set('Host', host)
          .expect(200)
          .expect('Content-Type', /charset=utf-8/);
      });

      it('includes HSTS header with includeSubdomain and preload', () => {
        return request(app)
          .get('/')
          .set('Host', host)
          .expect(200)
          .expect('Strict-Transport-Security', /^max-age=31536000; includeSubDomains; preload$/);
      });

      it('includes same-origin X-Frame_Options header', () => {
        return request(app)
          .get('/')
          .set('Host', host)
          .expect(200)
          .expect('X-Frame-Options', /^SAMEORIGIN$/);
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
  }
});

function headerSpecs(host) {
  return () => {
    it('includes charset utf-8 content type header', () => {
      return request(app)
        .get('/')
        .set('Host', host)
        .expect(200)
        .expect('Content-Type', /charset=utf-8/);
    });

    it('includes HSTS header with preload', () => {
      return request(app)
        .get('/')
        .set('Host', host)
        .expect(200)
        .expect('Strict-Transport-Security', /^max-age=31536000; preload$/);
    });

    it('includes same-origin X-Frame_Options header', () => {
      return request(app)
        .get('/')
        .set('Host', host)
        .expect(200)
        .expect('X-Frame-Options', /^SAMEORIGIN$/);
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

function matchText(regex) {
  return response => expect(response.text).to.match(regex);
}

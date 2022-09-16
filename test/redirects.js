const { expect } = require('chai');
const supertest = require('supertest');
const { createMakeRequest } = require('./helpers');
const {
  cleanPath,
  createRedirect,
  parseEnv,
} = require('../bin/utils');

const {
  PROXY_URL,
} = process.env;

const request = supertest(PROXY_URL)
const makeRequest = createMakeRequest(request)

describe.skip('Redirects', () => {
  it('should redirect to a new url', () => {
    const host = 'yolo.app.cloud.gov';
    return makeRequest('', host, [[301]])
  });
});

describe('Create Redirects Utils', () => {
  describe('cleanPath', () => {
    it('should return a properly path string', () => {
      ['foo', '/foo', '/foo/']
        .map((path) => expect(cleanPath(path)).to.equal('/foo'));
    });

    it('should preserve "/" in path', () => {
      ['foo/bar/baz', '/foo/bar/baz', '/foo/bar/baz/']
        .map((path) => expect(cleanPath(path)).to.equal('/foo/bar/baz'));
    });

    it('should return an empty string if null or undefined', () => {
      [null, undefined, ''].map((path) => expect(cleanPath(path)).to.equal(''));
    });
  });

  describe('createRedirect', () => {
    it('should return a ngnix redirect string with subdomain, path, and target', () => {
      const subdomain = 'foobar';
      const path = 'baz';
      const target = 'foo.bar';

      const redirect = {
        subdomain,
        path,
        target,
      };

      const result = createRedirect(redirect);
      expect(result).to.include(`$name = "${subdomain}"`);
      expect(result).to.include(`return 301 "https://${target}/${path}$request_uri"`);
    });

    it('should return a ngnix redirect string with subdomain and target', () => {
      const subdomain = 'foobar';
      const target = 'foo.bar';

      const redirect = {
        subdomain,
        target,
      };

      const result = createRedirect(redirect);
      expect(result).to.include(`$name = "${subdomain}"`);
      expect(result).to.include(`return 301 "https://${target}$request_uri"`);
    });

    it('should throw an error without subdomain', () => {
      const target = 'foo.bar';

      const redirect = {
        target,
      };

      expect(() => createRedirect(redirect)).to.throw('Subdomain must be defined for redirect.');
    });

    it('should throw an error without target', () => {
      const subdomain = 'foobar';

      const redirect = {
        subdomain,
      };

      expect(() => createRedirect(redirect)).to.throw('Target must be defined for redirect.');
    });
  });
  describe('parseEnv', () => {
    describe('With proper JSON', () => {
      const envValue = [{
        subdomain: 'foo',
        path: 'bar',
        target: 'baz',
      }];

      before(() => {
        process.env.SITE_REDIRECTS = JSON.stringify(envValue);
      });

      after(() => process.env.SITE_REDIRECTS = '');

      it('should properly parse the env variable into JSON', () => {
        const result = parseEnv(process.env.SITE_REDIRECTS);
        expect(result).to.be.instanceOf(Array);
        expect(result).to.be.length(1);
        expect(result).to.have.deep.members(envValue);
      });
    });

    describe('Is not an array', () => {
      before(() => process.env.SITE_REDIRECTS = JSON.stringify({ test: 1 }));
      after(() => process.env.SITE_REDIRECTS = '');

      it('should throw an error', () => {
        expect(() => parseEnv(process.env.SITE_REDIRECTS)).to.throw();
      });
    });

    describe('Without a value', () => {
      before(() => process.env.SITE_REDIRECTS = '');
      after(() => process.env.SITE_REDIRECTS = '');

      it('should throw an error', () => {
        expect(() => parseEnv(process.env.SITE_REDIRECTS)).to.throw();
      });
    });

    describe('With a string', () => {
      before(() => process.env.SITE_REDIRECTS = 'tests');
      after(() => process.env.SITE_REDIRECTS = '');

      it('should throw an error', () => {
        expect(() => parseEnv(process.env.SITE_REDIRECTS)).to.throw();
      });
    });
  });
});

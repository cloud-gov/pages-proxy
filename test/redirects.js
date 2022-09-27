const { rm, readFile } = require('fs/promises');
const { expect } = require('chai');
const supertest = require('supertest');
const { redirects } = require('./fixtures');
const {
  cleanPath,
  createRedirect,
  parseEnv,
  run,
} = require('../bin/utils');

const {
  PROXY_URL,
} = process.env;

const request = supertest(PROXY_URL)
const [ redirect1, redirect2, redirect3 ] = redirects

describe('Redirects', () => {
  it('should redirect to a new location url', async () => {
    const host = `${redirect1.subdomain}.app.cloud.gov`;
    const response = await request
      .get('')
      .set('Host', host);

    expect(response.statusCode).to.eq(301);
    expect(response.headers.location).to.eq(`https://${redirect1.target}`);
  });

  it('should redirect to a new location url and preserve the request uri', async () => {
    const host = `${redirect1.subdomain}.app.cloud.gov`;
    const previewPath = '/site/org/repo';
    const reqPath = '/foo/bar';
    const response = await request
      .get(`${previewPath}${reqPath}`)
      .set('Host', host);

    expect(response.statusCode).to.eq(301);
    expect(response.headers.location).to.eq(`https://${redirect1.target}${reqPath}`);
  });

  it('should redirect to a new location url with a path', async() => {
    const host = `${redirect2.subdomain}.app.cloud.gov`;
    const response = await request
      .get('')
      .set('Host', host);

    expect(response.statusCode).to.eq(301);
    expect(response.headers.location).to.eq(`https://${redirect2.target}/${redirect2.path}`);
  });

  it('should redirect to a new location url with a path and preserve the request uri', async() => {
    const host = `${redirect2.subdomain}.app.cloud.gov`;
    const previewPath = '/site/org/repo';
    const reqPath = '/foo/bar';
    const response = await request
      .get(`${previewPath}${reqPath}`)
      .set('Host', host);

    expect(response.statusCode).to.eq(301);
    expect(response.headers.location).to.eq(`https://${redirect2.target}/${redirect2.path}${reqPath}`);
  });

  it('should redirect to a new location url with the site preview path when usePreviewPath is true', async() => {
    const host = `${redirect3.subdomain}.app.cloud.gov`;
    const previewPath = '/site/org/repo';
    const reqPath = '/foo/bar';
    const fullPath = `${previewPath}${reqPath}`
    const response = await request
      .get(fullPath)
      .set('Host', host);

    expect(response.statusCode).to.eq(301);
    expect(response.headers.location).to.eq(`https://${redirect3.target}${fullPath}`);
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
      expect(result).to.include(`return 301 "https://${target}/${path}$remaining_path"`);
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
      expect(result).to.include(`return 301 "https://${target}$remaining_path"`);
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
  describe('run', () => {
    const testFile = './test.conf';

    beforeEach(async () => await rm(testFile, { force: true }));
    afterEach(async () => await rm(testFile,  { force: true }));

    it('should create a redirects conf file', async () => {
      const subdomain = 'baz';
      const target = 'foo.bar';
      const redirects = JSON.stringify([{ subdomain, target }]);
      await run(redirects, testFile);
      const result = await readFile(testFile, { encoding: 'utf-8' });

      expect(result).to.include(`$name = "${subdomain}"`);
      expect(result).to.include(`return 301 "https://${target}$remaining_path"`);
    });

    it('should create a redirects conf file with $request_uri with usePreviewPath', async () => {
      const subdomain = 'baz';
      const target = 'foo.bar';
      const usePreviewPath = true;
      const redirects = JSON.stringify([{ subdomain, target, usePreviewPath }]);
      await run(redirects, testFile);
      const result = await readFile(testFile, { encoding: 'utf-8' });

      expect(result).to.include(`$name = "${subdomain}"`);
      expect(result).to.include(`return 301 "https://${target}$request_uri"`);
    });

    it('should create an empty conf file from an empty array of redirects', async () => {
      const redirects = JSON.stringify([]);
      await run(redirects, testFile);
      const result = await readFile(testFile, { encoding: 'utf-8' });

      expect(result).to.eq('');
    });

    it('should create an empty conf file from undefined redirects', async () => {
      let redirects;
      await run(redirects, testFile);
      const result = await readFile(testFile, { encoding: 'utf-8' });

      expect(result).to.eq('');
    });
  });
});

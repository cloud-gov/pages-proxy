const request = require('supertest');
const app = process.env.PROXY_URL;
const { expect } = require('chai');

describe('Main Site', () => {
  it('should thro 404 b/c no index.html found', () => {
    request(app)
      .get('/')
      .expect(404)
      .then((response) => {
        expect(response.text.indexOf('Page not found')).to.be.above(-1);
      });
  });

  it('404.html found', () => {
    request(app)
      .get('/404.html')
      .expect(200)
      .then((response) => {
        expect(response.text.indexOf('Page not found')).to.be.above(-1);
      });
  });

  it('robots.txt found', () => {
    request(app)
      .get('/robots.txt')
      .expect(200)
      .then((response) => {
        expect(response.text.indexOf('Disallow')).to.be.above(-1);
        expect(response.headers['content-type'].indexOf('text/plain')).to.be.above(-1);
      });
  });

  it('cfm found', () => {
    request(app)
      .get('/test/helloworld.cfm')
      .expect(200)
      .then((response) => {
        // console.log(`\n\nRespone: ${JSON.stringify(response)}`);
        expect(response.text.indexOf('Hello World!')).to.be.above(-1);
        // expect(response.headers['x-frame-options']).to.equal('SAMEORIGIN');
        expect(response.headers['strict-transport-security']).to.equal('max-age=31536000');
        expect(response.headers['content-type']).to.equal('text/html');
      });
  });
});

describe('Federalist Docs Site', () => {
  it('Home', () => {
    request(app)
      .get('/site/18f/federalist-docs/')
      .expect(200)
      .then((response) => {
        expect(response.text.indexOf('About Federalist')).to.be.above(-1);
        expect(response.headers['x-frame-options']).to.equal('SAMEORIGIN');
        expect(response.headers['strict-transport-security']).to.equal('max-age=31536000');
      });
  });

  it('non-existent page - 404', () => {
    request(app)
      .get('/site/18f/federalist-docs/adlajdlajkjsal')
      .expect(404)
      .then((response) => {
        expect(response.text.indexOf('Page not found')).to.be.above(-1);
      });
  });
});

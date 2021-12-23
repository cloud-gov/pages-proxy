const http = require('http');
const Fixtures = require('../test/fixtures');

const { PORT = 8001, BUCKET_TYPE } = process.env;

const routes = Fixtures[BUCKET_TYPE];

function mapHeaders(extras = {}) {
  const headers = Object.keys(extras).reduce((headers, name) => {
    const headerName = name === 'ContentType' ? 'Content-Type' : name;
    const headerValue = extras[name];
    headers[headerName] = headerValue;
    return headers;
  }, {});
  
  // simulate S3 by providing default content type
  headers['Content-Type'] = headers['Content-Type'] ?? 'application/octet-stream'; 

  return headers;
}

const server = http.createServer((req, res) => {
  console.log(`Requested - ${req.method} | ${req.url}`);

  let status = 403;
  let statusText = 'Forbidden';
  let headers = {};
  let text = `Unknown path ${req.url}`;
  
  const route = routes[req.url.slice(1)];

  if (route) {
    status = 200;
    statusText = 'Ok';
    headers = mapHeaders(route.extras);
    text = route.content;
  }

  res.writeHead(status, statusText, headers);
  res.end(text);

  console.log(`Responded - ${res.statusCode} ${res.statusMessage}`);
});

server.listen(PORT, () => {
  console.log('mock server running on ', server.address());
});

server.on('error', (error) => {
  console.error('mock server error: ', error);
});
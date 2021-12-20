const http = require('http');

const { PORT = 8001, BUCKET_TYPE } = process.env;

const server = http.createServer((req, res) => {
  console.log(`Requested - ${req.method} | ${req.url}`);
  
  if (req.url === '/file') {
    res.writeHead(200, 'Ok', { 'Content-Type': 'text/html' });
    res.end('file');
    return;
  }

  if (req.url === '/file/index.html') {
    res.writeHead(200, 'Ok', { 'Content-Type': 'text/html' });
    res.end('file2');
    return;
  }

  if (req.url === '/404.html') {
    res.writeHead(200, 'Ok', { 'Content-Type': 'text/html' });
    res.end('<h1>4044444444</h1>');
    return;
  }
  
  if (req.url === '/bucket.html') {
    res.writeHead(200, 'Ok', { 'Content-Type': 'text/html' });
    res.end(BUCKET_TYPE);
    return;
  }

  if (req.url === '/test/helloworld.cfm') {
    res.writeHead(200, 'Ok');
    res.end();
    return;
  }

  if (req.url === '/no-content-type') {
    res.writeHead(200, 'Ok', { 'Content-Type': 'application/octet-stream' });
    res.end('no-content-type');
    return;
  }

  if (req.url === '/redirect-object') {
    const location = '/redirect-object/index.html';
    res.writeHead(200, 'Ok', { 'x-amz-website-redirect-location': location });
    res.end(location);
    return;
  }

  if (req.url === '/redirect-object/index.html') {
    res.writeHead(200, 'Ok', { 'Content-Type': 'text/html' });
    res.end('redirect-object-target');
    return;
  }

  res.writeHead(403, 'Forbidden');
  res.end(`Unknown path ${req.url}`);

  console.log(`Responded - ${res.statusCode} ${res.statusMessage}`);
});

server.listen(PORT, () => {
  console.log('mock server running on ', server.address());
});

server.on('error', (error) => {
  console.error('mock server error: ', error);
});
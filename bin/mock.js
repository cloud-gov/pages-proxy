const http = require('http');

const { PORT = 8001, BUCKET_TYPE } = process.env;

const server = http.createServer((req, res) => {
  res.setHeader('X-Bucket-Type', BUCKET_TYPE);

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

  if (req.url === '/unicorn') {
    res.writeHead(403, 'Not Found');
    res.end();
    return;
  }

  if (req.url === '/unicorn/index.html') {
    res.writeHead(403, 'Not Found');
    res.end();
    return;
  }

  if (req.url === '/404.html') {
    res.writeHead(200, 'Ok', { 'Content-Type': 'text/html' });
    res.end('<h1>4044444444</h1>');
    return;
  }

  res.writeHead(200, 'Ok', { 'Content-Type': 'text/html' });
  res.end(req.url);
});

server.listen(PORT, () => {
  console.log('mock server running on ', server.address());
});

server.on('error', (error) => {
  console.error('mock server error: ', error);
});
const http = require('http');

const { PORT = 8001 } = process.env;

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' })
  res.end(`You have reached the ${req.url.slice(1)} bucket.`);
});

server.listen(PORT, () => {
  console.log('mock server running on ', server.address());
});

server.on('error', (error) => {
  console.error('mock server error: ', error);
});
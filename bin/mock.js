const http = require('http');

const {
  HOST: host = 'localhost',
  PORT: port = 8001
} = process.env;

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' })
  res.end(`You have reached the ${req.url.slice(1)} bucket.`);
});

server.listen({host, port}, () => {
  console.log('mock server running on ', server.address());
});

server.on('error', (error) => {
  console.error('mock server error: ', error);
});
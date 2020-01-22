const http = require('http');

const PORT = process.env.PORT || 8001;

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' })
  res.end(`You have reached the ${req.url.slice(1)} bucket.`);
});

server.listen(PORT);

server.on('listening', () => {
  console.log(`mock server running on port ${PORT}`);
});

server.on('error', (error) => {
  console.error('mock server error: ', error);
});
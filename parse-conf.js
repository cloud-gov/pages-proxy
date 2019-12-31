const fs = require('fs');

const RE = /\{\{(?<name>\w+)(?:\s["](?<arg>[\w]+)["])?\}\}/g;

const ENV = {
  FEDERALIST_PROXY_SERVER_NAME: 'federalist-proxy-staging',
  FEDERALIST_S3_BUCKET_URL: 'http://cg-f28e32aa-d42e-4906-a813-7d726f69183c.s3-website-us-gov-west-1.amazonaws.com',
  HOME: '$host',
  PORT: '8000'
};

const funcs = {
  port() {
    return ENV.PORT;
  },
  
  env(arg) {
    return ENV[arg] || '';
  }
};

const rawConf = fs.readFileSync('./nginx.conf').toString();
const matches = rawConf.matchAll(RE);
const [parts, values] = extractParts(rawConf, matches, funcs);
const tmpConf = joinParts(parts, values);
fs.writeFileSync('./tmp-nginx.conf', tmpConf);

function extractParts(str, matches, funcs) {
  const parts = [];
  const values = [];
  let start = 0;
  for (const match of matches) {
    parts.push(str.slice(start, match.index));
    start = match.index + match[0].length;
    values.push(funcs[match.groups.name](match.groups.arg));
  }
  parts.push(str.slice(start));
  
  return [parts, values];
}

function joinParts(parts, values) {
  let str = '';
  for(let i = 0; i < parts.length; i++) {
    str += parts[i];
    if (i < values.length)
      str += values[i]
  }
  return str;
}
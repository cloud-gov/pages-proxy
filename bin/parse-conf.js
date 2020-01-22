const fs = require('fs');

const RE = /\{\{(?<name>\w+)(?:\s["](?<arg>[\w]+)["])?\}\}/g;

const TMP_DIR = './tmp';

const ENV = parseEnv(process.env)

const funcs = {
  port() {
    return ENV.PROXY_PORT;
  },
  
  env(arg) {
    return ENV[arg] || '';
  }
};

const rawConf = fs.readFileSync('./nginx.conf').toString();
const matches = rawConf.matchAll(RE);
const [parts, values] = extractParts(rawConf, matches, funcs);
const tmpConf = joinParts(parts, values).replace('daemon off;', '');

if (!fs.existsSync(TMP_DIR)){
  fs.mkdirSync(TMP_DIR);
}
fs.writeFileSync(`${TMP_DIR}/nginx.conf`, tmpConf);

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

function parseEnv({
  DEDICATED_S3_BUCKET_URL,
  FEDERALIST_PROXY_SERVER_NAME,
  FEDERALIST_S3_BUCKET_URL,
  PROXY_WWW: HOME,
  PROXY_PORT
}) {
  return {
    DEDICATED_S3_BUCKET_URL,
    FEDERALIST_PROXY_SERVER_NAME,
    FEDERALIST_S3_BUCKET_URL,
    HOME,
    PROXY_PORT
  }
}
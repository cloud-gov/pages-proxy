#! /usr/bin/node

const { rm, writeFile } = require('fs/promises');

function parseEnv(redirects) {
  const list = JSON.parse(redirects);

  if (!Array.isArray(list)) {
    throw 'Redirects environment variable must be an array of redirect objects.';
  }

  return list;
}

function cleanPath(path) {
  if (!path) return '';

  if (typeof path !== 'string') {
    throw new Error('Redirect path is not a string.');
  }

  const length = path.length;
  const trimmed = path[length - 1] === '/' ? path.substring(0, length - 1) : path;

  if (trimmed[0] === '/') {
    return trimmed;
  } else {
    return `/${trimmed}`;
  }
}

function createRedirect(redirect) {
  const { subdomain, path, target } = redirect;

  if (!subdomain) throw 'Subdomain must be defined for redirect.'
  if (!target) throw 'Target must be defined for redirect.'

  const toPath = cleanPath(path);

  return `if ($name = "${subdomain}") {
  return 301 "https://${target}${toPath}$request_uri";
}\n
`;
}

function writeRedirect(file, statement) {
  return writeFile(file, statement, { flag: 'a' });
}

function run(siteRedirects, redirectFile) {
  return rm(redirectFile, { force: true })
    .then(() => {
      if (!siteRedirects) return writeRedirect(redirectFile, '');

      const redirects = parseEnv(siteRedirects);

      if (redirects.length === 0) return writeRedirect(redirectFile, '');

      const templated = redirects.map(redirect => {
        const template = createRedirect(redirect);
        return writeRedirect(redirectFile, template);
      });

      return Promise.all(templated);
    })
}

module.exports = {
  cleanPath,
  createRedirect,
  parseEnv,
  writeRedirect,
  run,
};

#! /usr/bin/node

const { rm } = require('fs/promises');
const { SITE_REDIRECTS } = process.env;
const redirectFile = `${process.cwd()}/redirects.conf`;

const {
  createRedirect,
  parseEnv,
  writeRedirect
} = require('./utils')

function run() {
  return rm(redirectFile, { force: true })
    .then(() => {
      if (!SITE_REDIRECTS) return writeRedirect(redirectFile, '');

      const redirects = parseEnv(SITE_REDIRECTS);
      const templated = redirects.map(redirect => {
        const template = createRedirect(redirect);
        return writeRedirect(redirectFile, template);
      });

      return Promise.all(templated);
    })
}

run()
  .then(() => {
    console.log('Successfully wrote redirects.conf');
    process.exit();
  })
  .catch((error) => {
    console.error('Error creating redirects.conf file.');
    console.error(error);
    process.exit(1);
  });

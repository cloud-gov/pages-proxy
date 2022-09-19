#! /usr/bin/node

const osPath = require('path');
const { run } = require('./utils')

const { SITE_REDIRECTS } = process.env;
const redirectFile = osPath.join(process.cwd(), 'redirects.conf');

run(SITE_REDIRECTS, redirectFile)
  .then(() => {
    console.log('Successfully wrote redirects.conf');
    process.exit();
  })
  .catch((error) => {
    console.error('Error creating redirects.conf file.');
    console.error(error);
    process.exit(1);
  });

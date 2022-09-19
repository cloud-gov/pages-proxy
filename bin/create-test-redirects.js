#! /usr/bin/node

const osPath = require('path');
const { run } = require('./utils')
const { redirects } = require('../test/fixtures');

const redirectFile = osPath.join(process.cwd(), './tmp/', 'redirects.conf');

run(JSON.stringify(redirects), redirectFile)
  .then(() => {
    console.log('Successfully wrote test redirects to /tmp/redirects.conf');
    process.exit();
  })
  .catch((error) => {
    console.error('Error creating test redirects.conf file.');
    console.error(error);
    process.exit(1);
  });

const { PREVIEW_PATH_PREFIX, DEFAULT_PATH_PREFIX } = process.env;

const previewPrefixPath = (path) => `${PREVIEW_PATH_PREFIX}/${path}`;
const defaultPrefixPath = (path) => `${DEFAULT_PATH_PREFIX}/${path}`;

function prefixPaths(path, fixture) {
  return {
    [previewPrefixPath(path)]: fixture,
    [defaultPrefixPath(path)]: fixture,
  }
}
function getFixtures(bucketType) {
  return {
    ...prefixPaths('file', {
      content: 'file',
      extras: { ContentType: 'text/html' },
    }),
    ...prefixPaths('file/index.html', {
      content: 'file2',
      extras: { ContentType: 'text/html' },
    }),
    ...prefixPaths('test/helloworld.cfm', {
      content: '',
      extras: { ContentType: 'foobar' },
    }),
    ...prefixPaths('bucket.html', {
      content: bucketType,
      extras: { ContentType: 'text/html' },
    }),
    ...prefixPaths('no-content-type', {
      content: 'no-content-type',
      extras: {},
    }),
    ...prefixPaths('redirect-object', {
      content: '/redirect-object/index.html',
      extras: { WebsiteRedirectLocation: '/redirect-object/index.html' },
    }),
    ...prefixPaths('redirect-object/index.html', {
      content: 'redirect-object-target',
      extras: { ContentType: 'text/html' },
    }),
    [previewPrefixPath('404.html')]: {
      content: '<h1>preview - 4044444444</h1>',
      extras: { ContentType: 'text/html' },
    },
    [defaultPrefixPath('404.html')]: {
      content: '<h1>default - 4044444444</h1>',
      extras: { ContentType: 'text/html' },
    },
  };
};

module.exports = {
  dedicated: getFixtures('dedicated'),
  shared: getFixtures('shared')
}
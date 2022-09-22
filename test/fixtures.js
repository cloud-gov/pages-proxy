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
    ...prefixPaths('foo/path.with.period/bar', {
      content: '/foo/path.with.period/bar/index.html',
      extras: { WebsiteRedirectLocation: '/foo/path.with.period/bar/index.html' },
    }),
    ...prefixPaths('foo/path.with.period/bar/index.html', {
      content: 'path-with-period-target',
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

function createRedirect(subdomain, target, { path, usePreviewPath = false} = {}) {
  return {
    subdomain,
    target,
    ...(path && { path }),
    ...(usePreviewPath && { usePreviewPath })
  };
}

const redirects = [
  createRedirect('subdomain1', 'target.one'),
  createRedirect('subdomain2', 'target.two', { path: 'targettwopath' }),
  createRedirect('subdomain3', 'target.three', {
    usePreviewPath: true,
  }),
];

module.exports = {
  dedicated: getFixtures('dedicated'),
  shared: getFixtures('shared'),
  redirects,
}

const { PATH_PREFIX } = process.env;

const prefixPath = (path) => `${PATH_PREFIX}/${path}`;

function getFixtures(bucketType) {
  return {
    [prefixPath('file')]: {
      content: 'file',
      extras: { ContentType: 'text/html' },
    }, 
    [prefixPath('file/index.html')]: {
      content: 'file2',
      extras: { ContentType: 'text/html' },
    },
    [prefixPath('404.html')]: {
      content: '<h1>4044444444</h1>',
      extras: { ContentType: 'text/html' },
    },
    [prefixPath('test/helloworld.cfm')]: {
      content: '',
      extras: { ContentType: 'foobar' },
    },
    [prefixPath('bucket.html')]: {
      content: bucketType,
      extras: { ContentType: 'text/html' },
    },
    [prefixPath('no-content-type')]: {
      content: 'no-content-type',
      extras: {},
    },
    [prefixPath('redirect-object')]: {
      content: '/redirect-object/index.html',
      extras: { 'x-amz-website-redirect-location': '/redirect-object/index.html' },
    },
    [prefixPath('redirect-object/index.html')]: {
      content: 'redirect-object-target',
      extras: { ContentType: 'text/html' },
    },
  };
};

module.exports = {
  dedicated: getFixtures('dedicated'),
  shared: getFixtures('shared')
}
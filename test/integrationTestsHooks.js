const AWS = require('aws-sdk');
const Fixtures = require('./fixtures.js');

const {
  DEDICATED_AWS_ACCESS_KEY_ID,
  DEDICATED_AWS_SECRET_ACCESS_KEY,
  DEDICATED_S3_BUCKET,
  SHARED_AWS_ACCESS_KEY_ID,
  SHARED_AWS_SECRET_ACCESS_KEY,
  SHARED_S3_BUCKET,
  WEBSITE_CONFIG
} = process.env;

const buckets = {
  dedicated: {
    bucket: DEDICATED_S3_BUCKET,
    creds: {
      accessKeyId: DEDICATED_AWS_ACCESS_KEY_ID,
      secretAccessKey: DEDICATED_AWS_SECRET_ACCESS_KEY,
      apiVersion: '2006-03-01',
    },
    fixtures: Fixtures.dedicated,
  },
  shared: {
    bucket: SHARED_S3_BUCKET,
    creds: {
      accessKeyId: SHARED_AWS_ACCESS_KEY_ID,
      secretAccessKey: SHARED_AWS_SECRET_ACCESS_KEY,
      apiVersion: '2006-03-01',
    },
    fixtures: Fixtures.shared,
  }
};

exports.mochaGlobalSetup = async function() {
  console.log('Creating fixtures in S3 buckets');

  const requests = Object.keys(buckets).flatMap(bucketType => {
    const { bucket, creds, fixtures } = buckets[bucketType];
    const s3 = new AWS.S3(creds);

    return Object.keys(fixtures).flatMap(key => {
      const { content, extras } = fixtures[key];

      const params = {
        Bucket: bucket,
        Key: key,
        ServerSideEncryption: 'AES256',
        Body: content,
        ...extras,
      };

      const _requests = [s3.putObject(params).promise()];
      
      if (WEBSITE_CONFIG && key.startsWith('site') && key.endsWith('404.html')) {
        console.log('Creating bucket website configuration');

        _requests.push(
          s3.putBucketWebsite({
            Bucket: bucket,
            WebsiteConfiguration: {
              ErrorDocument: {
                Key: key,
              },
              IndexDocument: {
                Suffix: 'index.html',
              },
            },
          }).promise()
        );
      }

      return _requests;
    });
  });
  
  await Promise.all(requests);

  console.log('Fixtures created');
};

exports.mochaGlobalTeardown = async function() {
  console.log('Removing fixtures from S3 buckets');

  const requests = Object.keys(buckets).flatMap(bucketType => {
    const { bucket, creds, fixtures } = buckets[bucketType];
    const s3 = new AWS.S3(creds);

    const params = {
      Bucket: bucket,
      Delete: {
        Objects: Object.keys(fixtures).map(key => ({ Key: key }))
      },
    };
    
    const _requests = [s3.deleteObjects(params).promise()];
    
    if (WEBSITE_CONFIG) {
      console.log('Removing bucket website configuration');

      _requests.push(
        s3.deleteBucketWebsite({ Bucket: bucket }).promise()
      )
    }

    return _requests;
  });


  await Promise.all(requests);

  console.log('Fixtures removed');
};
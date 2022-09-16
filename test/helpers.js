function createMakeRequest(request) {
  return (path, host, expectations = []) => {
    const initial = request
      .get(path)
      .set('Host', host)
      .expectStandardHeaders();

    return expectations.reduce((r, expectation) => r.expect(...expectation), initial);
  }
}

function createMakeCloudfrontRequest(request) {
  return (path, host, expectations = []) => {
    const initial = request
      .get(path)
      .set('Host', host)
      .set('User-Agent', 'Amazon Cloudfront')
      .expectCloudfrontHeaders();

    return expectations.reduce((r, expectation) => r.expect(...expectation), initial);
  }
}

module.exports = {
  createMakeRequest,
  createMakeCloudfrontRequest
}

const fs = require('fs');

// Match all strings of the form: {{name "arg"}} where "arg" is optional.
// Each match will include a group containing: { name: name, arg: 'arg' }.
const RE = /\{\{(?<name>\w+)(?:\s["](?<arg>[\w]+)["])?\}\}/g;

const TMP_DIR = './tmp';

const ENV = parseEnv(process.env)

// Define supported interpolation functions.
const funcs = {
  // {{port}}
  port() {
    return ENV.PROXY_PORT;
  },
  
  // {{env "ARGUMENT"}}
  env(arg) {
    return ENV[arg] || '';
  }
};

/**
 * Interpolate a templated nginx configuration
 * 
 * @param {string} template - A templated nginx configuration
 * @returns {string} The interpolated nginx configuration
 */
function parseConf(template, funcs) {
  const matches = template.matchAll(RE);
  return interpolate(template, matches, funcs).replace('daemon off;', '');
}

/**
 * Takes a template string, an array of regex match results, and an object with
 * functions, and return a new string where the matches are replaces with the
 * interpolated values.
 *
 * This is similar to how tagged template literals work in javascript.
 * 
 * Ex.
 * const template = 'Hello {{env "LANGUAGE"}} world!';
 * const funcs = { env(arg) { return 'javascript; } };
 * const matches = template.matcnAll(RE);
 * //-> [{ index: 6, name: 'env', arg: 'LANGUAGE', length: 19 }]
 * 
 * const [parts, values] = interpolate(template, matches, funcs);
 * // -> 'Hello javascript world!']
 * 
 * @param {string} template - Any string, but here it will contain the nginx configuration
 * @param {Object[]} matches - An array of results returned from `String.prototype.matchAll()`
 * @param {object} funcs - An object with functions that can be invoked in the template
 * @returns {string} interpolated string
 */
function interpolate(template, matches, funcs) {
  const results = []
  let start = 0;

  for (const match of matches) {
    // Append the chunk of template between the current and previous matches to `parts`
    results.push(template.slice(start, match.index));

    // Determine the next starting index
    start = match.index + match[0].length;

    // Find the function named in the match in `funcs` and call it with the
    // argument from the match. Append the result to `values`.
    results.push(funcs[match.groups.name](match.groups.arg));
  }
  
  // Append the last template chunk, there will always be one more than the values.
  results.push(template.slice(start));
  
  return results.join('');
}

/**
 * Whitelist environment variables.
 * 
 * @param {object} env - Whitelist of environment variables
 * @returns {object} - whitelisted environment variables.
 */
function parseEnv({
  DEDICATED_S3_BUCKET_URL,
  FEDERALIST_PROXY_SERVER_NAME,
  FEDERALIST_S3_BUCKET_URL,
  PROXY_WWW: HOME,
  PROXY_PORT,
  DNS_RESOLVER
}) {
  return {
    DEDICATED_S3_BUCKET_URL,
    FEDERALIST_PROXY_SERVER_NAME,
    FEDERALIST_S3_BUCKET_URL,
    HOME,
    PROXY_PORT,
    DNS_RESOLVER
  }
}

const rawConf = fs.readFileSync('./nginx.conf').toString();
const tmpConf = parseConf(rawConf, funcs);
if (!fs.existsSync(TMP_DIR)){
  fs.mkdirSync(TMP_DIR);
}
fs.writeFileSync(`${TMP_DIR}/nginx.conf`, tmpConf);

module.exports = {
  parseConf
}
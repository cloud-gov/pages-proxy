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

/*
  This is where the magic actually happens.
*/
const rawConf = fs.readFileSync('./nginx.conf').toString();
const matches = rawConf.matchAll(RE);
const [parts, values] = extractParts(rawConf, matches, funcs);
const tmpConf = joinParts(parts, values).replace('daemon off;', '');

if (!fs.existsSync(TMP_DIR)){
  fs.mkdirSync(TMP_DIR);
}
fs.writeFileSync(`${TMP_DIR}/nginx.conf`, tmpConf);

/**
 * Takes a template string, an array of regex match results, and an object with
 * functions and returns two arrays containing the template string broken
 * into pieces and the replacement values to be inserted between each piece.
 * This is similar to how tagged template literals work in javascript.
 * 
 * Ex.
 * const template = 'Hello {{env "LANGUAGE"}} world!';
 * const funcs = { env(arg) { return 'javascript; } };
 * const matches = template.matcnAll(RE);
 * //-> [{ index: 6, name: 'env', arg: 'LANGUAGE', length: 19 }]
 * 
 * const [parts, values] = extractParts(template, matches, funcs);
 * // parts -> ['Hello ', ' world!']
 * // values -> ['javascript']
 * 
 * @param {string} template - Any string, but here it will contain the nginx configuration
 * @param {Object[]} matches - An array of results returned from `String.prototype.matchAll()`
 * @param {object} funcs - An object with functions that can be invoked in the template
 * @returns {Array[]} [parts, values] -
 *   Parts: chunks of the template split at the match locations
 *   Values: results of calling `funcs` for each match
 */
function extractParts(template, matches, funcs) {
  const parts = [];
  const values = [];
  let start = 0;

  for (const match of matches) {
    // Append the chunk of template between the current and previous matches to `parts`
    parts.push(template.slice(start, match.index));

    // Determine the next starting index
    start = match.index + match[0].length;

    // Find the function named in the match in `funcs` and call it with the
    // argument from the match. Append the result to `values`.
    values.push(funcs[match.groups.name](match.groups.arg));
  }
  
  // Append the last template chunk, there will always be one more than the values.
  parts.push(template.slice(start));
  
  return [parts, values];
}

/**
 * Reassembles the string by alternating between the template chunks and values.
 * 
 * Ex.
 * const parts = ['Hello ', ' world!'];
 * const values = 'javascript';
 * 
 * const template = joinParts(parts, values);
 * // -> 'Hello javascript world';
 * 
 * @param {string[]} parts - Chunks of the template split at the match locations
 * @param {string[]} values - Replacement values for the interpolated functions
 */
function joinParts(parts, values) {
  let str = '';
  for(let i = 0; i < parts.length; i++) {
    str += parts[i];
    if (i < values.length)
      str += values[i]
  }
  return str;
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
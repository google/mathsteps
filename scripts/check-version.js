/*global process*/
'use strict';
const engines = require('../package').engines;
const semver = require('semver');

const version = engines.node;
if (!semver.satisfies(process.version, version)) {
  // eslint-disable-next-line
  console.log(`Required node version ${version} not satisfied with current ` + 
    `version ${process.version}.`);
  process.exit(1);
}
else {
  // eslint-disable-next-line
  console.log(`Current node version ${process.version} satisfies version ` + 
   `requirement ${version}`);
}

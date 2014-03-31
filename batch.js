#!/usr/bin/env node

var commander = require('commander');
var version = require(__dirname + '/package').version;
var utils = require(__dirname + '/lib/utils');
var logger = require(__dirname + '/lib/logger');
var main = require(__dirname + '/index');

commander
  .version(version)
  .option('-v, --verbose', 'verbose mode')
  .option('-f, --conf <path>', 'configuration file')
  .parse(process.argv);

var conf;
try {
  conf = require(utils.securePath(commander.conf));
} catch (err) {
  logger.error('Error loading configuration at ' + commander.conf + ' !');
  process.exit(1);
}

main.run(conf, commander.verbose);

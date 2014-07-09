#!/usr/bin/env node

var commander = require('commander');
var version = require('./package').version;
var logger = require('./lib/logger');
var main = require('./index');

commander
  .version(version)
  .option('-v, --verbose', 'verbose mode')
  .option('-f, --conf <path>', 'configuration file')
  .parse(process.argv);

var conf;
try {
  conf = require(process.cwd() + '/' + commander.conf);
} catch (err) {
  logger.error('Error loading configuration at ' + commander.conf + ' !', err);
  process.exit(1);
}

main.run(conf, commander.verbose);

var util = require('util');
var moment = require('moment');

exports.verbose = false;

exports.section = function () {
  process.stdout.write('\n[' + moment().format('HH:mm:ss') + '] ' + util.format.apply(this, arguments) + '\n');
};

exports.error = function () {
  process.stdout.write('error: ' + util.format.apply(this, arguments) + '\n');
};

exports.info = function () {
  process.stdout.write('info: ' + util.format.apply(this, arguments) + '\n');
};

exports.debug = function () {
  if (exports.verbose) {
    process.stdout.write('debug : ' + util.format.apply(this, arguments) + '\n');
  }
};

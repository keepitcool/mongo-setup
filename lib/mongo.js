var mongo = require('mongodb');
var logger = require('./logger');

exports.DEFAULT_PORT = mongo.Connection.DEFAULT_PORT;

var effectiveClient = null;

exports.connect = function (url, cb) {
  logger.section('Conneting to database...');
  mongo.MongoClient.connect(url, {mongos: {'auto_reconnect': true}} , function (err, client) {
    if (err) {
      logger.error('Error connecting to the database !', err);
      process.exit(1);
    }
    logger.info('Connected to database : '+ url);
    effectiveClient = client;
    cb && cb(effectiveClient);
  });
};

exports.disconnect = function (done) {
  logger.section('Disconneting from database...');
  effectiveClient.close(function (err) {
    if (err) {
      logger.error('Error disconnecting from database !', err);
      process.exit(1);
    }
  });
  logger.info('Disconnected from database !');
  done && done();
};

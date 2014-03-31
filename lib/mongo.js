var mongo = require('mongodb');
var logger = require('./logger');

const DEFAULT_PORT = exports.DEFAULT_PORT = mongo.Connection.DEFAULT_PORT;

var effectiveClient = null;

exports.connect = function (host, port, cb) {
  logger.section('Conneting to database...');
  var server = new mongo.Server(host, port);
  var client = new mongo.MongoClient(server);
  client.open(function (err, client) {
    if (err) {
      logger.error('Error connecting to the database !', err);
      process.exit(1);
    }
    logger.info('Connected to database !');
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
  logger.info('Disconnected from database !')
  done && done();
};

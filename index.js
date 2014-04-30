var async = require('async');
var _ = require('lodash');
var tv4 = require('tv4');

var indexer = require('./lib/indexer');
var sharder = require('./lib/sharder');
var logger = require('./lib/logger');
var mongo = require('./lib/mongo');
var schemas = require('./lib/schemas');

exports.run = function (conf, verbose) {

  console.log('Mongo setup !');

  /* Configuration */

  logger.section('Configuration...');

  logger.info('Loading configuration...');
  logger.verbose = verbose || false;
  conf = _.assign({
    host: 'localhost',
    port: mongo.DEFAULT_PORT
  }, conf);
  logger.info('Configuration loaded !');
  logger.debug('Using configuration', JSON.stringify(conf, null, 2));

  logger.info('Validating provided configuration...');
  if (!tv4.validate(conf, schemas.conf)) {
    logger.error('Configuration is invalid !', tv4.error);
    process.exit(1);
  }
  logger.info('Configuration is valid !');

  /* Processing */

  mongo.connect(conf.host, conf.port, function (client) {
    indexer.configure(client, conf.dbname);
    sharder.configure(client, conf.dbname);

    var queue = [];
    var skipSharding = false;

    queue.push(function (done) {
      sharder.setupDatabase(function (err) {
        if (err) {
          logger.error('Error during database shard setup; collections shard setup will be skipped !');
          skipSharding = true;
        }
        done && done();
      });
    });

    _.forEach(conf.collections, function (item) {
      var collection = item.name;
      var indexes = item.indexes;
      var shardingKey = item.sharding_key;
      if (_.find(indexes, shardingKey) === undefined) indexes.push(shardingKey);

      queue.push(function (done) {
        indexer.setupCollection(collection, indexes, done);
      });

      queue.push(function (done) {
        if (skipSharding) return done && done();
        sharder.setupCollection(collection, shardingKey, done);
      });
    });

    queue.push(mongo.disconnect);
    async.series(queue);
  });
};

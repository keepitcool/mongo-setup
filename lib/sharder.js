var async = require('async');
var _ = require('lodash');
var logger = require('./logger');

var dbname = null;
var db = null;
var adminDb = null;
var configDb = null;

exports.configure = function (client, _dbname) {
  dbname = _dbname;
  db = client.db(dbname);
  adminDb = client.db('admin');
  configDb = client.db('config');
};

exports.setupDatabase = function (cb) {
  logger.section('Checking database "' + dbname + '" sharding state...');

  collectShards(function (err) {
    if (err) return cb && cb(err);
    getDbShardState(function (err, shard) {
      if (err) return cb && cb(err);
      if (shard) return cb && cb();

      shardDb(function () {
        if (err) return cb && cb(err);

        getDbShardState(function (err, shard) {
          if (err) return cb && cb(err);
          if (shard) return cb && cb();
          logger.error('Failed to shard database !');
          cb && cb(err);
        });
      });
    });
  });
};

exports.setupCollection = function (collection, key, done) {
  logger.section('Checking collection "' + collection + '" sharding state...');
  logger.info('Expecting sharding key', key);
  getCollectionShardState(collection, function (err, shardKey) {
    if (err) return done && done();
    if (shardKey) {
      if (_.isEqual(shardKey, key)) {
        logger.info('Collection shard ok !');
      } else {
        logger.error('Collection shard exists and dont match the expected one !');
      }
      done && done();
    } else {
      shardCollection(collection, key, function () {
        getCollectionShardState(collection, function () {
          done && done();
        });
      });
    }
  });
};

function collectShards(cb) {
  logger.info('Collecting shards...');
  configDb.collection('shards').find().toArray(function (err, res) {
    var shards = null;
    if (err) {
      logger.error('Unable to collect shards !', err);
    } else {
      shards = [];
      _.forEach(res, function (shard) {
        logger.info('Shard "' + shard._id + '" detected at ' + shard.host +  ' !');
        shards.push(shard._id);
      });
      if (shards.length === 0) {
        logger.info('No shards detected !');
        err = 'NOSHARDS';
      }
    }
    cb && cb(err, shards);
  });
}

function getDbShardState(cb) {
  logger.info('Checking database sharding state...');
  configDb.collection('databases').findOne({_id: dbname}, function (err, res) {
    var dbShard = null;
    if (err) {
      logger.error('Unable to check if database is shared !', err);
    } else {
      if (res && res.partitioned) {
        dbShard = res.primary;
        logger.info('Database sharded (shard "' + dbShard + '") !');
      } else {
        logger.info('Database not sharded !');
      }
    }
    cb && cb(err, dbShard);
  });
}

function shardDb(cb) {
  logger.info('Enabling database sharding...');
  adminDb.command({enableSharding: dbname}, function (err) {
    if (err) {
      logger.error('Error while sharding database !', err);
    }
    cb && cb(err);
  });
}

function getCollectionShardState(collection, cb) {
  logger.info('Checking collection sharding state...');
  configDb.collection('collections').findOne({_id: (dbname + '.' + collection)}, function (err, res) {
    var shardKey = null;
    if (err) {
      logger.error('Unable to check if collection is shared !', err);
    } else {
      if (res && res.key) {
        shardKey = res.key;
        logger.info('Collection sharded (key :', shardKey, ') !');
      } else {
        logger.info('Collection not sharded !');
      }
    }
    cb && cb(err, shardKey);
  });
}

function shardCollection(collection, key, cb) {
  logger.info('Enabling collection sharding...');
  adminDb.command({shardCollection: (dbname + '.' + collection), key: key}, function (err) {
    if (err) {
      logger.error('Error while sharding collection !', err);
    }
    cb && cb(err);
  });
}

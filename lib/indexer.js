var async = require('async');
var _ = require('lodash');
var logger = require('./logger');

var db = null;

exports.configure = function (client, dbname) {
  db = client.db(dbname);
};

exports.setupCollection = function (collection, indexes, done) {
  logger.section('Indexing ' + collection + '...');
  if (!db) return logger.error('Unable to index : db is not defined');

  _.forEach(indexes, function (index) {
    logger.info('Expecting index ', index);
  });

  collection = db.collection(collection);
  retreiveIndexes(collection, function (err, currentIndexes) {
    indexes = sortIndexes(indexes, currentIndexes);
    dropIndexes(collection, indexes.toDrop, function () {
      ensureIndexes(collection, indexes.toCreate, done);
    });
  });
};

function retreiveIndexes(collection, cb) {
  var indexes = [];
  collection.indexInformation(function (err, rawIndexes) {
    if (err) {
      logger.error('Error retreiving indexes !', err);
      return cb && cb(err, indexes);
    }
    _.forEach(rawIndexes, function (rawIndex) {
      var index = {};
      _.forEach(rawIndex, function (part) {
        index[part[0]] = part[1];
      });
      indexes.push(index);
    });
    cb && cb(null, indexes);
  });
}

function ensureIndexes(collection, indexes, done) {
  var queue = [];

  _.forEach(indexes, function ensureIndexes(index) {
    queue.push(function (done) {
      logger.info('Ensuring index', index);
      collection.ensureIndex(index, function (err) {
        if (err) {
          logger.error('Error ensuring index !', err);
        }
        done && done();
      });
    });
  });

  async.series(queue, done);
}

function dropIndexes(collection, indexes, done) {
  var queue = [];

  _.forEach(indexes, function (index) {
    queue.push(function (done) {
      logger.info('Droping index', index);
      collection.dropIndex(index, function (err, ok) {
        if (err || !ok) {
          logger.error('Error dropping index !', index, err);
        }
        done && done();
      });
    });
  });

  async.series(queue, done);
}

function sortIndexes(wantedIndexes, existingIndexes) {
  var result = {};

  // wanted & existing
  result.notToTouch = _.filter(wantedIndexes, function (wantedIndex) {
    var existing = !!_.find(existingIndexes, function (existingIndex) {
      return _.isEqual(existingIndex, wantedIndex);
    });
    if (existing) {
      logger.info('Index', wantedIndex, 'will remain');
    }
    return existing;
  });

  // existing & not wanted
  result.toDrop = _.filter(existingIndexes, function (existingIndex) {
    if (_.isEqual(existingIndex, {_id: 1})) return false;

    var wanted = !!_.find(wantedIndexes, function (wantedIndex) {
      return _.isEqual(wantedIndex, existingIndex);
    });
    if (!wanted) {
      logger.info('Index', existingIndex, 'will be dropped');
    }
    return !wanted;
  });

  // wanted & not existing
  result.toCreate = _.filter(wantedIndexes, function (wantedIndex) {
    var existing = !!_.find(existingIndexes, function (existingIndex) {
      return _.isEqual(existingIndex, wantedIndex);
    });
    if (!existing) {
      logger.info('Index', wantedIndex, 'will be created');
    }
    return !existing;
  });

  return result;
}

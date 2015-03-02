/**
 * ScoreController
 *
 * @description :: Server-side logic for managing scores
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

var MongoClient = require('mongodb').MongoClient;
var DbUtils = require('lscp-processor').DbUtils;

function productivity(req, res) {
  var logError = function (err) {
    console.error(err);
  };
  var sendErrorResponse = function(err) {
    if (err) {
      logError(err);
      res.status(500);
      res.json(err);
    }
  };
  var sendResponse = function(scorerProductivity) {
    return res.json(scorerProductivity);
  };
  var connected = function (err, db) {
    if (err) sendErrorResponse(err);
    var scores = db.collection('scores');
    if (req.query && req.query.scorer) {
      DbUtils.queries.scorerCallsProcessed(scores, req.query.scorer, sendResponse);
    } else {
      DbUtils.queries.callsProcessed(scores, sendResponse);
    }
  };
  MongoClient.connect('mongodb://localhost:27017/Leadscore', connected);
}

function stats(req, res) {
  var logError = function (err) {
    console.error(err);
  };
  var sendErrorResponse = function(err) {
    if (err) {
      logError(err);
      res.status(500);
      res.json(err);
    }
  };
  var sendResponse = function(data) {
    res.json(data);
  };
  var dataAggregated = function(err, aggregatedData) {
    if (err) logError(err);
    sendResponse(aggregatedData);
  };
  var connected = function (err, db) {
    if (err) sendErrorResponse (err);
    var scores = db.collection('scores');
    var aggregateGroup = {
      _id: null,
      scorers: { $addToSet: '$scorer' },
      dates: { $addToSet: '$fileDate' },
      branches: { $addToSet: '$branch' },
      industries: { $addToSet: '$branch' },
      totalCallDuration: { $sum: '$callDuration' },
      totalProcessingTime: { $sum: '$processingTime' },
      averageCallDuration: { $avg: '$callDuration' },
      averageProcessingTime: { $avg: '$processingTime' },
      callCount: { $sum: 1 }
    };
    var aggregateOpts = [{
      $group: aggregateGroup
    }]
    scores.aggregate(aggregateOpts, dataAggregated);
  };
  MongoClient.connect('mongodb://localhost:27017/Leadscore', connected);
}

module.exports = {
  productivity: productivity,
  stats: stats
};


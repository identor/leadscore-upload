/**
 * ScoreController
 *
 * @description :: Server-side logic for managing scores
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

var MongoClient = require('mongodb').MongoClient;

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
    res.json(scorerProductivity);
  };
  var connected = function (err, db) {
    if (err) sendErrorResponse (err);
    var scores = db.collection('score');
    var processAggregatedScores = function (err, data) {
      if (err) sendErrorResponse (err);
      var scorerDataSet = [];
      for (var i = 0; i < data.length; i++) {
        var scorer = data[i]._id.scorer;
        var date = data[i]._id.date;
        var industry = data[i]._id.date;
        var scorerProductivity = {
          scorer: data[i]._id.scorer,
          date: data[i]._id.date,
          industry: data[i]._id.industry,
          branch: data[i].branch[0], // we dont want an array
          totalCallDuration: data[i].totalCallDuration,
          totalProcessingTime: data[i].totalProcessingTime,
          averageCallDuration: data[i].averageCallDuration,
          averageProcessingTime: data[i].averageProcessingTime,
          callCount: data[i].callCount
        };
        scorerDataSet.push(scorerProductivity);
      }
      sendResponse(scorerDataSet);
    };
    var aggregateGroup = {
      _id: {
        scorer: '$scorer',
        date: '$fileDate',
        industry: '$industry'
      },
      branch: { $addToSet: '$branch' },
      totalCallDuration: { $sum: '$callDuration' },
      totalProcessingTime: { $sum: '$processingTime' },
      averageCallDuration: { $avg: '$callDuration' },
      averageProcessingTime: { $avg: '$processingTime' },
      callCount: { $sum: 1 }
    };
    var aggregateOpts = [{
      $group: aggregateGroup
    }]
    scores.aggregate(aggregateOpts, processAggregatedScores);
  };
  MongoClient.connect('mongodb://localhost:27017/Leadscore', connected);
}

module.exports = {
  productivity: productivity
};


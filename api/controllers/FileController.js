/**
 * FileController
 *
 * @description :: Server-side logic for managing files
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

var csv = require('fast-csv');
var MongoClient = require('mongodb').MongoClient;
var checksum = require('checksum');

function upload(req, res) {
  req.file('csv').upload({
    dirname: '../../assets/csv',
    maxBytes: 1000000000
  }, function (err, uploadedCsv) {
    if (err) throw err;
    if (uploadedCsv.length === 0) {
      return res.badRequest('No file was uploaded. <a href="/">back?</a>');
    }
    MongoClient.connect('mongodb://localhost:27017/Leadscore', function (err, db) {
      if (err) throw err;
      csv.fromPath(uploadedCsv[0].fd, {headers: true})
        .on('data', function (data) {
          var scorer = data['Scorer'];
          var branch = '';
          if (scorer.indexOf('ARPI5') != -1) {
              branch = 'Dagupan';
          } else if (scorer.indexOf('ARS') != -1){
              branch = 'Others';
          } else {
              branch = 'Baguio';
          }
          var filename = uploadedCsv[0].filename;
          var yearString = filename.slice(23, 27);
          var monthString = filename.slice(27, 29);
          var dayString = filename.slice(29, 31);
          var fileDate = new Date(yearString + '-' + monthString + '-' + dayString);
          var score = {
            fileDate: fileDate,
            callStartTime: data['Call Start Time'],
            processingStart: data['Processing Start'],
            processingEnd: data['Processing End'],
            processingTime: data['Processing Time(Sec)'],
            industry: data['Industry'],
            branch: branch,
            scorer: scorer,
            accountName: data['Account Name'],
            customerName: data['Customer Name'],
            callId: data['Call ID'],
            callType: data['Call Type'],
            callStatus: data['Call Status'],
            callDuration: data['Call Duration'],
            url: data['Audio URL']
          };
          db.collection('score').insert(score, function (err, scores) {
            if (err) throw err;
          })
        })
        .on('end', function () {
          return res.json({
            message: 'File successfully uploaded...'
          });
        });
    });
  })
}

function retrieve(req, res) {
  MongoClient.connect('mongodb://localhost:27017/Leadscore', function(err, db) {
      if (err) throw err;
      if (!err) {
        console.log('Connected to the database successfully');
      }
      var collection = db.collection('score');
      var scorer = [];
      var processed = 0;
      var compileScores = function(scorer, date, queueSize) {
        console.log(scorer, date);
        collection.find({scorer: scorer, fileDate: date}).toArray(function (err, data) {
          // check if scorer name is valid (minimal)
          // add regex if possible
          if (!scorer) {
            ++processed;
            console.error('Data, null user name. ');
            return;
          }
          var totalProcessingTime = 0;
          var totalCallDuration = 0;
          var averageProcessingTime = 0;
          var averageCallDuration = 0;
          for (var j = 0; j < data.length; j++) {
            totalProcessingTime += +data[j].processingTime;
            totalCallDuration += +data[j].callDuration;
          }
          averageProcessingTime = totalCallDuration / data.length;
          averageCallDuration = totalProcessingTime / data.length;
          var leadscore = {
            scorer: scorer,
            totalProcessingTime: totalProcessingTime,
            totalCallDuration: totalCallDuration,
            averageCallDuration: averageCallDuration,
            averageProcessingTime: averageProcessingTime,
            branch: data[0].branch,
            industry: data[0].industry,
            callCount: data.length,
            date: data[0].fileDate,
          };
          db.collection('leadscore').insert(leadscore, function (err, leadscore) {
            ++processed;
            if (err) throw err;
            if (processed === queueSize) {
              console.log('finished');
              return res.json({
                message: 'Successful processing... added ' + processed + ' records.'
              });
            }
          });
        });
      };
      var insertPerDistinctDatesOf = function(scorer, scorersCount) {
        collection.distinct('fileDate', {scorer: scorer}, function(err, dates) {
          if (err) throw err;
          for (var j = 0; j < dates.length; j++) {
            compileScores(scorer, dates[j], scorersCount*dates.length);
          }
        });
      };
      collection.distinct('scorer', function(err, scorers) {
        if (err) throw err;
        for (var i = 0; i < scorers.length; i++) {
          var scorer = scorers[i];
          insertPerDistinctDatesOf(scorer, scorers.length);
        }
      });
  });
}

module.exports = {
  upload: upload,
  retrieve: retrieve
};


/**
 * FileController
 *
 * @description :: Server-side logic for managing files
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

var csv = require('fast-csv');
var MongoClient = require('mongodb').MongoClient;
/*
function upload(req, res) {
  req.file('csv').upload({
    dirname: '../../assets/csv',
    maxBytes: 100000000
  }, function (err, uploadedCsv) {
    if (err) {
      return res.serverError(err);
    }

    csv.fromPath(uploadedCsv[0].fd, {headers: true})
      .on('data', function(data) {
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
        var processingTime2 = parseInt(data['Processing Time(Sec)']);
        if (processingTime2 === 'undefined') {
          processingTime2 = 0;
          console.log('Processing time was called undefined');
        }
        Score.create({
          fileDate: fileDate,
          callStartTime: data['Call Start Time'],
          processingStart: data['Processing Start'],
          processingEnd: data['Processing End'],
          processingTime: processingTime2,
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
        }, function (err, score) {
          console.log(score.processingTime);
          console.log(score.callId);
          if (err) {
            console.log('here');
            return res.serverError(err);
          }
          return res.json(score);
        });
        res.json({
          message: uploadedCsv.length + ' file uploaded sucessfully.',
          csv: uploadedCsv
        });
      });
  });
}
*/
function upload(req, res) {
  req.file('csv').upload({
    dirname: '../../assets/csv',
    maxBytes: 100000000
  }, function (err, uploadedCsv) {
    if (err) throw err;
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
            console.log('Score inserted as ' + scores[0].callId);
            return res.json({
              message:'Successfully inserted.'
            });
          });
        });
    });
  });
}

function retrieve(req, res) {
  MongoClient.connect('mongodb://localhost:27017/Leadscore', function(err, db) {
      if (err) throw err;
      if (!err) {
          console.log('Connected to the database successfully');
      }
      var collection = db.collection('score');
      var scorer = [];
      var compileScores = function(index, docs) {
        collection.find({scorer: docs[index]}).toArray(function (err, data) {
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
          Leadscore.create({
            scorer: docs[index],
            totalProcessingTime: totalProcessingTime,
            totalCallDuration: totalCallDuration,
            averageCallDuration: averageCallDuration,
            averageProcessingTime: averageProcessingTime,
            branch: data[0].branch,
            industry: data[0].industry,
            callCount: data.length,
            date: data[0].fileDate,
          }, function (err, leadscore) {
              res.json(leadscore);
          });
        });
      };
      collection.distinct('scorer', function(err, docs) {
        for (var i = 0; i < docs.length; i++) {
            compileScores(i, docs);
        }
      });
  });
}

module.exports = {
  upload: upload,
  retrieve: retrieve
};


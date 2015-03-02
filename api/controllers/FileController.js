/**
 * FileController
 *
 * @description :: Server-side logic for managing files
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

var csv = require('fast-csv');
var MongoClient = require('mongodb').MongoClient;
var checksum = require('checksum');
var DbUtils = require('lscp-processor').DbUtils;

function upload(req, res) {
  var formatting = [
    { name: 'processingStart', type: 'Date', zone: '+0000' },
    { name: 'processingEnd', type: 'Date', zone: '+0000' },
    { name: 'callStartTime', type: 'Date', zone: '+0000' },
    { name: 'elsProcessingStart', type: 'Date', zone: '+0000' },
    { name: 'elsProcessingEnd', type: 'Date', zone: '+0000' },
    { name: 'elsProcessingEnd', type: 'Date', zone: '+0000' },
    { name: 'processingTimeSec', type: 'Number' },
    { name: 'elsProcessingTimeSec', type: 'Number' },
    { name: 'accountId', type: 'Number' },
    { name: 'index', type: 'Number' },
    { name: 'callDuration', type: 'Number' },
    { name: '_id', type: 'Number' },
  ];
  var filename, fileDate;
  var extractDate = function (filename) {
    var len = filename.length;
    var yearString = filename.substring(len-8, len-12);
    var monthString = filename.substring(len-6, len-8);
    var dayString = filename.substring(len-4, len-6);
    console.log(dayString, monthString, yearString);
    return new Date(yearString + '-' + monthString + '-' + dayString);
  };
  var createFileRecord = function (db, fileDetails) {
    db.collection('fileprocessed').insert(fileDetails, function (err, data) {
      if (err) {
        return res.badRequest('File was already uploaded. <a href="/">back?</a>');
      }
      console.log("Created fileprocessed record for: " + fileDetails._id);
    })
  };
  var createLeadscoreRecords = function (err, db, uploadedCsv, fileDetails) {
    var index = 0;
    var fileUploaded = function () {
      return res.json({
        message: 'File uploaded successfully!',
        fileDetails: fileDetails,
        uploadedCsv: uploadedCsv
      });
    };
    var scores = db.collection('scores');
    DbUtils.saveToDb(uploadedCsv[index].fd, scores, formatting, fileUploaded);
  };
  var processCsv = function (err, uploadedCsv) {
    if (err) throw err;
    if (uploadedCsv.length === 0) {
      return res.badRequest('No file was uploaded. <a href="/">back?</a>');
    }
    filename = uploadedCsv[0].filename;
    fileDate = extractDate(filename);
    checksum.file(uploadedCsv[0].fd, function (err, fileChecksum) {
      var fileDetails = {
        _id: fileChecksum,
        filename: filename,
        date: fileDate
      };
      MongoClient.connect('mongodb://localhost:27017/Leadscore', function (err, db) {
        createLeadscoreRecords(err, db, uploadedCsv, fileDetails);
        createFileRecord(db, fileDetails);
      });
    });
  };
  var uploadOpts = {
    dirname: '../../assets/csv',
    maxBytes: 1000000000
  };
  req.file('csv').upload(uploadOpts, processCsv);
}

function retrieve(req, res) {
  MongoClient.connect('mongodb://localhost:27017/Leadscore', function(err, db) {
    if (err) throw err;
    if (!err) {
      console.log('Connected to the database successfully');
    }
    var processed = 0;
    var collection = db.collection('scores');
    var scorer = [];
    var compileScores = function(scorer, date, queueSize) {
      collection.find({scorer: scorer, fileDate: date}).toArray(function (err, data) {
        // check if scorer name is valid (minimal)
        // add regex if possible
        if (!scorer) {
          console.error('Data, null user name. ');
          return;
        }
        if (!data) {
          console.error('Null data encountered. ', scorer);
          return;
        };
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
          if (err) {
            console.log(err);
            res.badRequest(err);
            return;
          }
          console.log('Inserted a data set: ', processed);
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
        console.log('Dates found...', dates.length);
        if (err) throw err;
        for (var j = 0; j < dates.length; j++) {
          compileScores(scorer, dates[j], scorersCount*dates.length);
        }
      });
    };
    collection.distinct('scorer', function(err, scorers) {
      console.log('Scorers found...', scorers.length);
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


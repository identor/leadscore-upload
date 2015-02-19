/**
 * LeadscoreController
 *
 * @description :: Server-side logic for managing leadscores
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

var MongoClient = require('mongodb').MongoClient;

function branches(req, res) {
  MongoClient.connect('mongodb://localhost:27017/Leadscore', function (err, db) {
    if (err) throw err;
    var leadscore = db.collection('leadscore');
    leadscore.distinct('branch', function (err, data) {
      if (err) throw err;
      res.json(data);
    })
  });
}

function industries(req, res) {
  MongoClient.connect('mongodb://localhost:27017/Leadscore', function (err, db) {
    if (err) throw err;
    var leadscore = db.collection('leadscore');
    leadscore.distinct('industry', function (err, data) {
      if (err) throw err;
      res.json(data);
    })
  });
}

function clear(req, res) {
  MongoClient.connect('mongodb://localhost:27017/Leadscore', function (err, db) {
    db.collection('leadscore').drop(function (err) {
      if (err) {
        console.log(err);
        return;
      }
      var message = {
        message: 'Successfully dropped the `leadscore` database.'
      };
      console.log(message);
      res.json(message);
      db.close();
    });
  });
}

module.exports = {
  branches: branches,
  industries: industries,
  clear: clear
};


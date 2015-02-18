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

module.exports = {
  branches: branches
};


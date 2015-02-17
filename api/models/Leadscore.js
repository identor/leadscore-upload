/**
* Leadscore.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {
  autoCreatedAt: false,
  autoUpdatedAt: false,
  attributes: {
    date: {
      type: 'date'
    },
    scorer: {
      type: 'string'
    },
    totalProcessingTime: {
      type: 'integer'
    },
    totalCallDuration: {
      type: 'integer'
    },
    averageProcessingTime: {
      type: 'float'
    },
    averageCallDuration: {
      type: 'float'
    },
    branch: {
      type: 'string'
    },
    industry: {
      type: 'string'
    },
    callCount: {
      type: 'integer'
    }
  }
};


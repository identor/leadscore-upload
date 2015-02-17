/**
* Score.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {
  autoCreatedAt: false,
  autoUpdatedAt: false,
  attributes: {
    fileDate: {
      type: 'date'
    },
    callStartTime: {
      type: 'date'
    },
    processingStart: {
      type: 'date'
    },
    processingEnd: {
      type: 'date'
    },
    processingTime: {
      type: 'integer'
    },
    industry: {
      type: 'string'
    },
    branch: {
      type: 'string'
    },
    scorer: {
      type: 'string'
    },
    accountName: {
      type: 'string'
    },
    customerName: {
      type: 'string'
    },
    callId : {
      type: 'string'
    },
    callType: {
      type: 'string'
    },
    callStatus: {
      type: 'string'
    },
    callDuration: {
      type: 'integer'
    },
    url: {
      type: 'string'
    }
  }
};


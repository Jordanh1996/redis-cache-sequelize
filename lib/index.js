'use strict';


var Promise = require('bluebird');
var async = require('async');
var _ = require('lodash');
var redis = null;
var options = null;



module.exports = _init;

/**
 * Initializer
 * 
 * @param  {Object}       [options.cachePrefix] This will prefix every redis key with the string provided
 * @param  {Object}       [options.expiry] This will be used as expiry for the cache keys.
 */
function _init(_redis, options) {
  options = options || {};
  redis = _redis;
  return CacheStore;
}


/**
 * Constructor for cacher
 */
function CacheStore(model, options) {
  var options = options || {}
  if(!(this instanceof CacheStore)) {
    return new CacheStore(model);
  }
  this.modelName = model;
  this.cachePrefix = options.cachePrefix || 'DARTH::';
  this.options = options;
  this.expired = false;
}

CacheStore.prototype = {
  // Connect
  connect: function connect() {},
  // Set expiry 
  ttl: function ttl(seconds) {
    this.ttl = seconds;
    return this;
  },
  generateKey: function(type, _data) {
    
  },
  // Set cache prefix
  setCachePrefix: function(prefix) {
    this.cachePrefix = prefix;
    return this;
  },
  /**
   * @params - Takes 2 valid options - [ id, action ]
   */
  searchOne: function searchOne(options) {
    options = options || {};
    if(!options.id) {
     throw new Error("Please provide id"); 
    }
    var action = options.action || 'default';  
    var key = this.cachePrefix + '::' + this.modelName.name.toString() + '::' + options.id  + '.' + action;
    return new Promise(function promisify(resolve, reject) {
      return redis.get(key, function(err, result) {
        if(err) {
          return reject(err);
        }
        if(!result) {
          return resolve();
        }
        try {
          return resolve(JSON.parse(result));
        } catch(e) {
          return reject(e);
        }
      });
    })
  },
  
  searchAll: function searchAll(options) {
    
  },
  
  setCache: function(key, _data) {
    return new Promise(function promisify(resolve, reject) {
      var res;
      try {
        res = JSON.stringify(_data)
      } catch(e) {
        return reject(e);
      }
      return redis.setex(key  )
    })
    
  }
  
}


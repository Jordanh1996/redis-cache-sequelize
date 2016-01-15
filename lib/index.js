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
  clearCacheKey: function() {
    this.key = null;
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
    this.key = this.cachePrefix + '::' + this.modelName.name.toString() + '::' + options.id  + '.' + action;
    var key = this.key;
    return new Promise(function promisify(resolve, reject) {
      return redis.getAsync(key)
        .then(function(result) {
          return resolve(result);
        })
        .catch(function(err) {
          return reject(err);
        });
    })
  },
  
  searchScoped: function searchAll(options) {
    options = options || {};
    if(!options.action) {
      throw new Error("Please provide action");
    }
    var action = options.action;
    this.key = this.cachePrefix + '::' + this.modelName.name.toString() + '::' + action;
    var key = this.key;
    return new Promise(function promisify(resolve, reject) {
      return redis.getAsync(key)
        .then(function(result) {
          return resolve(result);
        })
        .catch(function(err) {
          return reject(err);
        });
    });
    
  },
  
  searchPattern: function searchPattern(pattern) {
     if(!pattern) {
       throw new Error("Please provide a pattern to search keys with");
     }
     this.key = this.cachePrefix + '::' + this.modelName.name.toString() + '::' + pattern;
     var key = this.key;
     return new Promise(function promisify(resolve, reject) {
       return redis.keysAsync(key)
           .then(function(_keys) {
             var _get_promises = _.map(_keys, function(_key) {
               try {
                 //TODO: Make this async !!
                return redis.getAsync(_key); 
               } catch(e) {
                 return reject(e);
               }
            });
            return resolve(Promise.all(_get_promises));
           })
           .catch(function(err) {
             return reject(err);
           })      
       
     }) 
  },
  
  expireOne: function(_key) {
    return new Promise(function promisify(resolve, reject) {
      return redis.delAsync(_key)
        .then(function(_result) {
          return resolve(_result);
        })
        .catch(function(err) {
          return reject(err);
        })
    })
  },
  
  setCache: function(_data) {
    var key = this.key;
    var ttl = this.ttl;
    var self = this;
    return new Promise(function promisify(resolve, reject) {
      var data;
      try {
        // TODO: Make this async man 
        data = JSON.stringify(_data)
      } catch(e) {
        return reject(e);
      }
      
      return redis.setexAsync(key, ttl, data)
        .then(function(res) {
          self.clearCacheKey();
          return resolve(res);
        })
        .catch(function(err) {
          return reject(err);
        });
    })
    
  }
  
}


'use strict'

var MongoClient = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;

var connUrl = 'mongodb://localhost:27017/shutBox';
var collections = {
    games : 'games',
    users : 'users'
}
var db;

exports.connect = function(callback) {
    MongoClient.connect(connUrl, function(err, database) {
        if( err ) return callback(err);
        db = database;

        collections.games = db.collection(collections.games);
        collections.users = db.collection(collections.users);

        callback(null, db);
    });
}

exports.query = function(collection, query, callback) {
    if( !collections[collection] ) return callback({error: true, message: 'invalid collection'});
    collections[collection].find(query).toArray(callback);
}

exports.queryLimit = function(collection, query, limit, callback) {
    if( !collections[collection] ) return callback({error: true, message: 'invalid collection'});
    collections[collection].find(query).limit(limit).toArray(callback);
}

exports.insert = function(collection, item, callback) {
    if( !collections[collection] ) return callback({error: true, message: 'invalid collection'});
    collections[collection].insert(item,{w: 1},callback);
}


exports.update = function(collection, item, callback) {
    if( !collections[collection] ) return callback({error: true, message: 'invalid collection'});

    var query;
    if( typeof item._id == 'object' ) query = {_id: item._id};
    else query = {_id: ObjectID(item._id)}
        
    collections[collection].update(query, item, {w: 1}, callback);
}

exports.get = function(collectionName) {
    return collections[collectionName];
}

exports.upsert = function(collection, item, callback) {
    if( !collections[collection] ) return callback({error: true, message: 'invalid collection'});

    var query;
    if( typeof item._id == 'object' ) query = {_id: item._id};
    else query = {_id: ObjectID(item._id)}
        
    delete item._id;
    
    collections[collection].update(query, item, {upsert: true, w: 1}, function(err, resp){
        if( err ) console.log(err);
        if( resp ) console.log(resp);

        callback(err, resp);
    });
}
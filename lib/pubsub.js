'use strict'

// games and subscribed sockets
var games = {};
// sockets and subscribed games
var userSockets = {};
// event listeners
var listeners = {};

var sockets;

var debug = false;

exports.init = function(socketsLib) {
    debugger;
    sockets = socketsLib;
}

// register event handlers
exports.on = function(event, fn) {
    if( !listeners[event] ) listeners[event] = [fn];
    else listeners[event].push(fn);
}

// subscibe a socket connection
exports.subscribe = function(socketId, gameId) {
    if( !games[gameId] ) {
        games[gameId] = [socketId];
    } else if( games[gameId].indexOf(socketId) == -1 ) {
        games[gameId].push(socketId);
    }

    // add lookup for users connections
    if( !userSockets[socketId] ) {
        userSockets[socketId] = [gameId];
    } else if( userSockets[socketId].indexOf(gameId) == -1 ) {
        userSockets[socketId].push(gameId);
    }

    // tell others user has showed up
    var users = [];
    var joined = '';
    for( var i = 0; i < games[gameId].length; i++ ) {
        var socket = sockets.get(games[gameId][i]);
        if( socket && users.indexOf(socket.request.user.username) == -1 ) {
            users.push(socket.request.user.username);
        }
        if( socket && socket.id == socketId ) {
            joined = socket.request.user.username;
        }
    }

    send(socketId, gameId, 'subscribed', {
        game : gameId,
        users: users,
        joined : joined
    }, true);

    log('subscribe event '+gameId+':'+games[gameId].length+'.  total games: '+Object.keys(games).length);
}

// broadcast a message to all users
function send(socketId, gameId, event, data, includeSender ) {
    if( !games[gameId] ) return;

    log('Sending broadcast: '+gameId+' '+event);
    
    for( var i = 0; i < games[gameId].length; i++ ) {
        var socket = sockets.get(games[gameId][i]);
        if( socket && (includeSender || socket.id != socketId) ) socket.emit(event, data);
    }
}
exports.send = send;

// if a user is added to a game, send them an message that they may want to subscribe
exports.alertUnsubscribed = function(gameId, users) {
    if( !games[gameId] || !users ) return;
    if( users.length == 0 ) return;

    var allUsers = [];
    for( var i = 0; i < users.length; i++ ) {
        allUsers.push(users[i]);
    }

    for( var i = 0; i < games[gameId].length; i++ ) {
        var socket = sockets.get(games[gameId][i]);
        if( socket ) {
            var index = users.indexOf(socket.request.user.username);
            if( index > -1 ) users.splice(index, 1);
        }
    }

    // any users left are not subscribed to the game
    for( var i = 0; i < users.length; i++ ) {
        var userSockets = sockets.getByUsername(users[i]);
        if( !socket ) continue;

        for( var j = userSockets.length - 1; j >= 0; j--) {
            userSockets[i].emit('join-request', {
                game: gameId,
                users: allUsers
            });
        };
    }
}

// unsubscibe a socket connection
function unsubscribe(gameId, socketId) {
    if( !games[gameId] ) return;

    var index = games[gameId].indexOf(socketId);
    if( index == -1 ) return;
    var removedSocketId = games[gameId].splice(index, 1);

    if( games[gameId].length == 0 ) {
        delete games[gameId];
    } else {
        // tell others user has left
        var users = [];
        var left = '';
        for( var i = 0; i < games[gameId].length; i++ ) {
            var socket = sockets.get(games[gameId][i]);
            if( socket && users.indexOf(socket.request.user.username) == -1 ) {
                users.push(socket.request.user.username);
            }
            if( socket && socket.id == socketId ) {
                left = socket.request.user.username;
            }
        }

        var socket = sockets.get(removedSocketId);

        send(socketId, gameId, 'unsubscribed', {
            game : gameId,
            users: users,
            left : socket ? socket.request.user.username : 'unknown'
        });
    }

    log('unsubscribe event '+gameId+':' + 
        (games[gameId] ? games[gameId].length : 0)+' .  total games: '+Object.keys(games).length);
}
exports.unsubscribe = unsubscribe;

exports.disconnect = function(socketId) {
    log('disconnect '+socketId);
    if( !userSockets[socketId] ) return;

    for( var i = 0; i < userSockets[socketId].length; i++ ) {
        unsubscribe(userSockets[socketId][i], socketId);
    }
    delete userSockets[socketId];
}

function fire(event, data) {
    if( !listeners[event] ) return;

    for( var i = 0; i < listeners[event].length; i++ ) {
        listeners[event][i](data);
    }
}

function log(msg) {
    if( !debug ) return;
    console.log('PUBSUB:: '+msg);
}
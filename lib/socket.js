var pubsub = require('./pubsub.js');

var sockets = {};
var users = {};

exports.init = function(io) {
    io.on('connection', initSocket);
}

exports.getPubSub = function() {
    return pubsub;
}

exports.get = function(socketId) {
    return sockets[socketId];
}

exports.getByUsername = function(username) {
    return users[username];
}

function initSocket(socket) {
    sockets[socket.id] = socket;
    addUserSocket(socket);

    // let the socket know it's server id
    socket.emit('connected', { 
        status : true, 
        id : socket.id 
    });

    socket.on('subscribe', function(data) {
        if( !data.game ) return;
        pubsub.subscribe(socket.id, data.game);
    });

    socket.on('button-state-update', function(data){
        broadcast(socket.id, 'button-state-update', data);
    });
    socket.on('roll', function(data){
        broadcast(socket.id, 'roll', data);
    });

    socket.on('disconnect', function() {
        removeUserSocket(socket);
        pubsub.disconnect(socket.id);
        if( sockets[socket.id] ) delete sockets[socket.id];
    });
}

// data will always need to have game id
function broadcast(socketId, event, data) {
    if( !data.game ) return;
    pubsub.send(socketId, data.game, event, data);
}

function addUserSocket(socket) {
    var username = socket.request.user.username;
    if( !users[username] ) users[username] = [socket];
    else users[username].push(socket);
}

function removeUserSocket(socket) {
    var username = socket.request.user.username;
    if( !users[username] ) return;

    var index = users[username].indexOf(socket);
    if( index > -1 ) users[username].splice(index, 1);

    if( users[username].length == 0 ) delete users[username];

    console.log('Disconnect '+username+': '+Object.keys(users).length);
}

pubsub.init(this);

// tell users a person has joined
/*pubsub.on('subscribe', function(data){
    for( var i = 0; i < data.sockets.length; i++ ) {
        // TODO: should unsubscribe if this is the case
        if( !sockets[data.sockets[i]] ) continue;
    }
});*/
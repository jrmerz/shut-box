'use strict'

var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

var auth = require('./lib/auth.js');
var games = require('./lib/games.js');
var socket = require('./lib/socket.js');
var mongo = require('./lib/mongo.js');


var isProd = false;
var isLocal = false;
process.argv.forEach(function (val, index, array) {
 if( val == '--prod' ) isProd = true;
 if( val == '--local' ) isLocal = true;
});

mongo.connect(function(err) {
    if( err ) return console.log(err);
    onConnection();
});


function onConnection() {

    auth.init(app, io, mongo, isLocal);
    socket.init(io);
    games.init(app, mongo, socket);

    app.use(express.static(__dirname +  (isProd ? '/dist' : '/app') ));


    app.get('/rest/players', function(req, resp){
        var name = req.query.name;
        if( !name ) return resp.send({error: true, message: 'You must provide a name'});

        name = new RegExp(name, 'i');

        var query = { 
            $or: [
                {name : name},
                {username : name},
            ],
            username : { $ne : req.user.username }
        }

        mongo.queryLimit('users', query, 10,
            function(err, result) {
                if( err ) return resp.send({error: true, message: err});

                var arr = [];
                for( var i = 0; i < result.length; i++ ) {
                    arr.push(formatSearchResponse(result[i]));
                }

                resp.send(arr);
            }
        );
    });

    function formatSearchResponse(player) {
        var resp = {
            name : player.name,
            username : player.username,
            photo : null,
        }

        if( player.google && player.google.picture ) {
            resp.photo = player.google.picture;
        }

        return resp;
    }

    server.listen(3000);
}
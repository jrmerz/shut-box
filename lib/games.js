'use strict'

exports.init = function(app, mongo, socket) {
    var pubsub = socket.getPubSub();

    app.get('/rest/games', function(req, resp){
        var finished = false;
        if( req.query.active === 'false' ) finished = true;

        mongo.get('games').find(
            {
                'players.username' : req.user.username,
                finished : finished,
            },
            {_id:0}
            ).toArray(function(err, result) {
                if( err ) return sendDbError(resp, err);
                resp.send(result);
            }
        )
    });

    app.get('/rest/deleteGame', function(req, resp){
        var id = req.query.id;

        mongo.get('games').findOne({id: id}, function(err, result){
            if( err ) return sendDbError(resp, err);

            // get sockets for people who care and check access
            var found = false;
            var userSockets = []
            for( var i = 0; i < result.players.length; i++ ) {
                if( result.players[i].username == req.user.username ) {
                    found = true;
                }

                var userSocket = socket.getByUsername(result.players[i].username);
                if( userSocket ) userSockets.push(userSocket);
            }

            // quit if no access
            if( !found ) return resp.send({error: true, message: 'Access Denied'});

            // remove game
            mongo.get('games').remove(
                {id: id}, {w:1},
                function(err, result){
                    if( err ) return sendDbError(resp, err);

                    // alert successful deletion
                    for( var i = 0; i < userSockets.length; i++ ) {
                        for( var j = 0; j < userSockets[i].length; j++ ) {
                            userSockets[i][j].emit('game-deleted', {game: id, user: req.user.username});
                        }   
                    }

                    resp.send({success: true});
                }
            );
        });
        
    });

    app.post('/rest/saveGame', function(req, resp){
        var socket = req.query.socket;
        if( !socket ) return resp.send({error: true, message: 'you must provide a socket id'});

        var data = JSON.parse(req.body.game);

        // TODO: check this is a legal update, should proly look at user submitting
        // and the current state of the saved game.

        mongo.get('games').update(
            {id : data.id}, 
            data, 
            {upsert: true, w: 1}, 
            function(err, result){
                if( err ) return sendDbError(resp, err);
                console.log(result);

                try {
                    // tell users who are connected but not subscribed to the game
                    var users = [];
                    for( var i = 0; i < data.players.length; i++ ) {
                        users.push(data.players[i].username);
                    }
                    pubsub.alertUnsubscribed(data.id, users);

                    // tell users who are subscribed
                    data.game = data.id;
                    pubsub.send(socket, data.id, 'game-update', data);
                } catch(e) {
                    console.log(e);
                    debugger;
                }
                

                resp.send({success: true});
            }
        );

    });

    app.get('/rest/game', function(req, resp){
        var id = req.query.id;
        mongo.get('games').find(
            {
                'players.username' : req.user.username,
                id : id,
            },
            {_id: 0}
        ).toArray(
            function(err, result) {
                if( err ) return sendDbError(resp, err);
                if( result.length == 0 ) return sendError(resp, 'Game not found');
                resp.send(result[0]);
            }
        );
    });
}

function sendError(resp, msg) {
    resp.send({error: true, message: msg});
}

function sendDbError(resp, err){
    console.log(err);
    sendError(resp, 'MongoDB Error');
} 
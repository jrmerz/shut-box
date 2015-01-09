/* players is an array of players */
SB.game = function(username, options) {

    // set the game options
    if( !options ) options = {};

    var defaultOptions = {
        maxScore : 50
    };

    for( var key in defaultOptions ) {
        if( !options[key] ) options[key] = defaultOptions[key];
    }


    var data = {
        id : guid(),
        created : new Date(),
        maxScore : 100,
        winner : null,
        out : [],
        round : 0,
        players : [{
            username : username,
            joined : true
        }],
        turn : {
            dice1 : -1,
            dice2 : -1,
            player : null,
            roll : 0,
            index : 0
        },
        // really only for display purposes
        last : {
            dice1 : -1,
            dice2 : -1
        },
        active : [],
        inactive : [1,2,3,4,5,6,7,8,9],
        scores : [],
        finished : false,
        started : false,
        options : options
    };

    var listeners = {};

    function addPlayer(player) {
        if( data.started ) return;

        if( hasPlayer(player) ) return;

        player = $.extend(true, {}, player);
        player.joined = false;
        data.players.push(player);

        fire('data-update', data);
    }

    function hasPlayer(player) {
        for( var i = 0; i < data.players.length; i++ ) {
            if( data.players[i].username == player.username ) return true;
        }
        return false;
    }

    function join(player) {
        for( var i = 0; i < data.players.length; i++ ) {
            if( data.players[i].username == player.username ) {
                data.players[i].joined = true;
            }
        }
        fire('data-update', data);
    }

    function removePlayer(username) {
        if( data.started ) return;

        for( var i = 0; i < data.players.length; i++ ) {
            if( data.players[i].username == username ) {
                data.players.splice(i, 1);
                return;
            }
        }

        fire('data-update', data);
    }

    function setOption(key, value) {
        if( data.started ) return;

        data.options[key] = value;
        fire('data-update', data);
    }

    function start() {
        data.turn.player = data.players[0];

        data.turn.dice1 = SB.dice.roll();
        data.turn.dice2 = SB.dice.roll();

        data.started = true;

        fire('data-update', data);
    }

    function roll() {
        fire('roll', {});

        data.last.dice1 = data.turn.dice1;
        data.last.dice2 = data.turn.dice2;

        data.turn.dice1 = SB.dice.roll();
        data.turn.dice2 = SB.dice.roll();
        data.turn.roll++;

        if( data.inactive.length == 0 ) {
            _nextTurn();
        }

        if( !_hasValidMove() ) {
            _nextTurn();
        }
    }

    function _nextTurn() {
        var score = 0;
        for( var i = 0; i < data.inactive.length; i++ ) {
            score += data.inactive[i];
        }
        if( data.scores.length <= data.turn.index ) data.scores.push([]);
        data.scores[data.turn.index].push(score);

        _checkOut();
        if( _checkWinner() ) return;

        data.turn.index++;
        if( data.turn.index >= data.players.length ) {
            data.turn.index = 0;
            data.round++;
        }
        data.turn.player = data.players[data.turn.index];
        data.turn.roll = 0;

        data.last.dice1 = data.turn.dice1;
        data.last.dice2 = data.turn.dice2;

        data.turn.dice1 = SB.dice.roll();
        data.turn.dice2 = SB.dice.roll();

        data.active = [];
        data.inactive = [1,2,3,4,5,6,7,8,9];

        fire('data-update', data);
    }

    function _checkOut() {
        var total = 0; arr = data.scores[data.turn.index];
        for( var i = 0; i < arr.length; i++ ) {
            total += arr[i];
        }
        if( total > data.maxScore ) _setOut(data.players[data.turn.index]);
    }

    function _checkWinner() {
        if( data.out.length - 2 != data.players.length ) return false;

        for( var i = 0; i < data.players.length; i++ ) {
            if( data.out.indexOf(data.players[i].username) == -1 ) {
                data.winner = data.players[i];
            }
        }
        data.finished = true;

        fire('data-update', data.winner);
        return true;
    }

    function _hasValidMove() {
        var total = data.turn.dice1 + data.turn.dice2;
        if( data.inactive.indexOf(total) > -1 ) return true;

        for( var i = 0; i < data.inactive.length; i++ ) {
            for( var j = i+1; j < data.inactive.length; j++ ) {
                if( total == data.inactive[i] + data.inactive[j] ) {
                    return true;
                }
            }
        }

        return false;
    }

    function setMove(val1, val2) {
        // TODO: should we alert errors
        if( !_checkValidMove(val1, val2) ) return false;

        _setActive(val1);
        _setActive(val2);
        roll();

        fire('data-update', data);
        return true;
    };

    function _setActive(val) {
        if( val === undefined ) return;

        data.active.push(val);
        data.inactive.splice(data.inactive.indexOf(val), 1);

        fire('button-state-update',{
            active : data.active,
            inactive : data.inactive
        });
    };

    function _checkValidMove(val1, val2) {
        if( val1 == (data.turn.dice1 + data.turn.dice2) ) {
            if( data.inactive.indexOf(val1) != -1 ) return true;
        }
        if( val1 + val2 == (data.turn.dice1 + data.turn.dice2) ) {
            if( data.inactive.indexOf(val1) != -1 && 
                data.inactive.indexOf(val2) != -1 ) {
                return true;
            }
        }
        return false;
    }

    function _setOut(player) {
        if( data.out.indexOf(player.username) == -1 ) {
            data.out.push(player.username);
        }

        fire('data-update', data);
    }

    function getData() {
        return data;
    }

    // does replace or 'soft' copy
    function setData(newData, hard) {
        if( hard ) {
            data = newData;
            return;
        }

        // do a soft copy
        for( var key in newData ) {
            data[key] = newData[key];
        }

        for( var key in data ) {
            if( newData[key] === undefined ) {
                delete data[key]
            }
        }
    }

    function fire(event, data) {
        if( !listeners[event] ) return;
        for( var i = 0; i < listeners[event].length; i++ ) {
            listeners[event][i](data);
        }
    }

    function on(event, handler) {
        if( !listeners[event] ) listeners[event] = [handler];
        else listeners[event].push(handler);
    }

    function guid() {
        return _s4() + _s4() + '-' + _s4() + '-' + _s4() + '-' +
               _s4() + '-' + _s4() + _s4() + _s4();
    }

    function _s4() {
          return Math.floor((1 + Math.random()) * 0x10000)
                       .toString(16)
                       .substring(1);
    }

    return {
        join : join,
        hasPlayer : hasPlayer,
        addPlayer : addPlayer,
        removePlayer : removePlayer,
        getData : getData,
        setData : setData,
        setMove : setMove,
        start : start,
        on : on
    }
}
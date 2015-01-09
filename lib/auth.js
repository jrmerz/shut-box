var GoogleStrategy   = require('passport-google-oauth').OAuth2Strategy;
var passport         = require('passport');
var morgan           = require('morgan');
var cookieParser     = require('cookie-parser');
var bodyParser       = require('body-parser');
var session          = require('express-session');
var passportSocketIo = require("passport.socketio");
var redis            = require("redis");
var RedisStore       = require('connect-redis')(session);
var ObjectID         = require('mongodb').ObjectID;

var redisClient = redis.createClient();
var sessionStore = new RedisStore();
var mongo;

// TODO: protect code?
var authEndpoints = ['/', '/createAccount.html'];
var authApi = ['/rest/games','/rest/user','/rest/players'];
var sessions = {};

passport.serializeUser(function(user, done) {
    redisClient.set(user._id, JSON.stringify(user));
    done(null, user._id);
});

passport.deserializeUser(function(id, done) {
    redisClient.get(id, function(err, reply) {
        if( err || !reply ) done({error:true, message:'not logged in'});
        else done(null, JSON.parse(reply));
    });
});

exports.init = function(app, io, mongoDb, isLocal) {
    mongo = mongoDb

    // TODO: switch this to js file, add cookie and oauth info
    //var authFile = require(baseLocation+'auth.json');
    //var db = require(baseLocation+'db.json');

    // set up our express application
    //app.use(morgan('dev')); // log every request to the console

    app.use(cookieParser()); // read cookies (needed for auth)
    app.use(bodyParser.json()); // get information from html forms
    app.use(bodyParser.urlencoded({ extended: true }));
    // required for passport
    app.use(session({
        key: 'app.sess',
        store: sessionStore,
        secret: 'ilovemygames',
        resave: false,
        cookie: { domain: isLocal ? 'shut-box.com' : 'shut-box.eossoftware.net'},
        saveUninitialized: true}
    )); // session secret
    app.use(passport.initialize());
    app.use(passport.session()); // persistent login sessions

    // For socket.io
    io.use(passportSocketIo.authorize({
      cookieParser:  cookieParser,
      key:         'app.sess',       // the name of the cookie where express/connect stores its session_id
      secret:      'ilovemygames',    // the session_secret to parse the cookie
      store:       sessionStore,        // we NEED to use a sessionstore. no memorystore please
      success:     onAuthorizeSuccess,  // *optional* callback on success - read more below
      fail:        onAuthorizeFail,     // *optional* callback on fail/error - read more below
    }));

    initGoogleAuth(app, isLocal);

    app.use(function(req, res, next) {
        var isAuth = authEndpoints.indexOf(req.originalUrl);

        if( isAuth > -1 && !req.user ) {
            res.redirect('login.html');
            return;
        } else if( isAuth > -1 && !req.user.username && req.originalUrl.indexOf('createAccount.html') == -1 ) {
            res.redirect('createAccount.html');
            return;
        }

        isAuth = authApi.indexOf(req.originalUrl);
        if( isAuth > -1 && !req.user ) {
            res.send({error: true, message: 'You are not logged in'})
            return;
        }

        next();
    });

    app.get('/rest/user', function(req, resp){
        resp.send(req.user);
    });

    app.get('/rest/setUsername', setUsername);
}


function onAuthorizeSuccess(data, accept){
  console.log('successful connection to socket.io');

  // The accept-callback still allows us to decide whether to
  // accept the connection or not.
  accept(null, true);

  // OR

  // If you use socket.io@1.X the callback looks different
  //accept();
}

function onAuthorizeFail(data, message, error, accept){
  if( error ) throw new Error(message);
  console.log('failed connection to socket.io:', message);

  // We use this callback to log all of our failed connections.
  accept(null, false);

  // OR

  // If you use socket.io@1.X the callback looks different
  // If you don't want to accept the connection
  //if(error)
  //  accept(new Error(message));
  // this error will be sent to the user as a special error-package
  // see: http://socket.io/docs/client-api/#socket > error-object
}

function setUsername(req, resp) {
    if( !req.user ) return resp.send({error:true, message:'You are not logged in'});
    var username = req.query.username;
    if( username.length < 3 ) return resp.send({error:true, message:'Invalid username length'});   

    mongo.query('users', {username: username}, function(err, result){
        if( err ) return resp.send({error: true, message:err});
        if( result.length > 0 ) return resp.send({error: true, message: 'Username is already taken'});
    
        mongo.query('users', {_id: ObjectID(req.user._id)}, function(err, result){
            if( err ) return resp.send({error:true, message:err});
            if( resp.length == 0 ) return resp.send({error:true, message: 'user not found'});

            var user = result[0];
            user.username = username;
     
            // save to redis
            redisClient.set(user._id.toHexString(), JSON.stringify(user));

            mongo.update('users', user,
                function(err, result) {
                    if( err ) return resp.send({error:true, message:err});
                    resp.send({success: true});
                }
            );
        });
    });
}

function initGoogleAuth(app, isLocal) {
    passport.use(new GoogleStrategy({
        clientID: '270231466611-kb2bfguljljn0mggvas9cf947lfslbfs.apps.googleusercontent.com',
        clientSecret: '4XhiPUYKeuRTAnYmFOZJRHFi',
        callbackURL: (isLocal ? 'http://shut-box.com:3000' : 'http://shut-box.eossoftware.net') + '/auth/google/return'
      },
      function(accessToken, refreshToken, profile, done) {
        mongo.query('users',{email: profile._json.email}, function(err, resp){
            if( err ) {
                console.log(err);
                return done(err);
            }

            if( resp.length == 0 ) {
                mongo.insert('users',
                    {
                        email : profile._json.email,
                        name : profile._json.name,
                        google : profile._json
                    },
                    function(err, resp) {
                        if( err ) {
                            console.log(err);
                            return done(err);
                        }
                        done(null, resp[0]);
                    }
                );
            } else {
                redisClient.set(resp[0]._id.toHexString(), resp[0]);
                done(null, resp[0]);
            }
        });
      }
    ));

    app.get('/auth/google', passport.authenticate('google', { scope: ['email'] }));
    app.get('/auth/google/return', 
        passport.authenticate('google', 
            { successRedirect: '/',
              failureRedirect: '/login.html#fail' 
            }));
}

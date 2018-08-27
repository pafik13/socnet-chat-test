// Setup basic express server
var express = require('express');
var app = express();
var path = require('path');
var server = require('http').createServer(app);
var io = require('../..')(server);
var port = process.env.PORT || 3000;

// Session deps
const session = require('express-session');
const RedisStore = require('connect-redis')(session);
const redis = require("redis");
const client = redis.createClient();


var crc = require('crc').crc32;

const mysql = require("mysql");
const squel = require("squel");
const squelMysql = squel.useFlavour('mysql');
const squelOpts = { autoQuoteTableNames: true, autoQuoteFieldNames: true };
const sqlQueries = {
  addMessage: squelMysql.insert(squelOpts).into('messages'),
  getMessages: squelMysql.select(squelOpts).from('messages'),
  getUser: squelMysql.select(squelOpts).from('users'),
  getContactsWLM: squelMysql.select(squelOpts).from('vw_contacts_with_last_message'),
};
var async = require("async");

// Always use MySQL pooling.
// Helpful for multiple connections.

var pool = mysql.createPool({
  connectionLimit: 100,
  host: 'localhost',
  user: process.env.C9_USER,
  password: '',
  database: 'c9',
  debug: false
});

function handle_database(req, type, callback) {
  async.waterfall([
      function(callback) {
        pool.getConnection(function(err, connection) {
          if (err) {
            // if there is error, stop right away.
            // This will stop the async code execution and goes to last function.
            callback(true);
          }
          else {
            callback(null, connection);
          }
        });
      },
      function(connection, callback) {
        var SQLquery;
        switch (type) {
          case "users":
            SQLquery = "SELECT * from users";
            break;
          case "inviteUser":
            SQLquery = ["INSERT INTO rooms(`key`, `user_id`, `partner_id`)",
              "VALUES",
              "(" + req.body.room_key + "," + req.body.user_id + "," + req.body.partner_id + "),",
              "(" + req.body.room_key + "," + req.body.partner_id + "," + req.body.user_id + ");",
            ].join('\n');
            break;
          case "addMessage":
            // req.body.message = ;
            // console.log(connection.escape(req.body.message));
            SQLquery = sqlQueries.addMessage.clone()
              .set('room_key', req.body.room_key, { dontQuote: true })
              .set('message', connection.escape(req.body.message), { dontQuote: true })
              .set('created_by', req.body.user_id, { dontQuote: true })
              .toString();
            // SQLquery = ["INSERT INTO messages(`room_key`, `message`, `created_by`)",
            //             "VALUES",
            //             "(" + req.body.room_key + ", " + connection.escape(req.body.message) + "," + req.body.user_id + ")",
            //           ].join('\n');
            break;
          case "getMessages":
            SQLquery = sqlQueries.getMessages.clone()
              .field("id")
              .field("room_key")
              .field("message")
              .field("created_by")
              .field("created_at")
              .where("room_key = ?", req.room_key)
              .toString();
            break;
          case "getContactsWLM":
            SQLquery = sqlQueries.getContactsWLM.clone()
              .field("id")
              .field("nick")
              .field("name")
              .field("icon")
              .field("room_id")
              .field("room_key")
              .field("room_last_message")
              .field("created_by")
              .field("created_at")
              .where("user_id = ?", req.session.user.id)
              .toString();
            break;
          case "login":
            SQLquery = sqlQueries.getUser.clone()
              .field("id")
              .field("nick")
              .field("name")
              .field("pwd")
              .where("nick = ?", req.body.nickname)
              .where("pwd = ?", req.body.password)
              .toString();
            // SQLquery = "SELECT * from user_login WHERE user_email='" + req.body.user_email + "' AND `user_password`='" + req.body.user_password + "'";
            break;
          case "checkEmail":
            SQLquery = "SELECT * from user_login WHERE user_email='" + req.body.user_email + "'";
            break;
          case "register":
            SQLquery = "INSERT into users(nick, pwd, name) VALUES ('" + req.body.nick + "','" + req.body.pwd + "','" + req.body.name + "')";
            break;
          case "addStatus":
            SQLquery = "INSERT into user_status(user_id,user_status) VALUES (" + req.session.key["user_id"] + ",'" + req.body.status + "')";
            break;
          case "getStatus":
            SQLquery = "SELECT * FROM user_status WHERE user_id=" + req.session.key["user_id"];
            break;
          default:
            break;
        }
        callback(null, connection, SQLquery);
      },
      function(connection, SQLquery, callback) {
        console.info(SQLquery);
        connection.query(SQLquery, function(err, rows) {
          connection.release();
          if (!err) {
            if (type === "getMessages") {
              callback(rows.length === 0 ? false : rows);
            } else if (type === "users") {
              callback(rows.length === 0 ? false : rows);
            }
            else if (type === "login") {
              callback(rows.length === 0 ? false : rows[0]);
            }
            else if (type === "getStatus") {
              callback(rows.length === 0 ? false : rows);
            }
            else if (type === "getContactsWLM") {
              callback(rows.length === 0 ? false : rows);
            }
            else if (type === "checkEmail") {
              callback(rows.length === 0 ? false : true);
            }
            else {
              callback(false);
            }
          }
          else {
            // if there is error, stop right away.
            // This will stop the async code execution and goes to last function.
            console.error(err);
            callback(true);
          }
        });
      }
    ],
    function(result) {
      // This function gets call after every async task finished.
      if (typeof(result) === "boolean" && result === true) {
        callback(null);
      }
      else {
        callback(result);
      }
    });
}


server.listen(port, () => {
  console.log('Server listening at  0.0.0.0:%d', port);
});

app.set("view engine", "ejs");

// Parsers
// https://stackoverflow.com/questions/5710358/how-to-retrieve-post-query-parameters
const bodyParser = require('body-parser');
app.use(bodyParser.json()); // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({ // to support URL-encoded bodies
  extended: true
}));

// Routing
app.use('/public', express.static(path.join(__dirname, 'public')));

// Session
// https://stackoverflow.com/questions/40381401/when-use-saveuninitialized-and-resave-in-express-session
var sessionMiddleware = session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: false,
  store: new RedisStore({
    host: 'localhost',
    port: 6379,
    client: client,
    ttl: 260,
  }),
});

app.use(sessionMiddleware);

app.get('/',function(req,res){
  if (req.session) {
    // console.log(Object.keys(req));
    console.log(req.sessionID); 
    // console.log(req.sessionStore.get('sess:' + req.sessionID)); 
    console.log(req.session);    
  }
  if(req.session.user) {
    // var id = 15;
    req.room_key = 3346011300;
    handle_database(req, 'getMessages', (messages) => {
      handle_database(req, 'getContactsWLM', (contacts) => {
        req.session.contacts = contacts;
        res.render('chat', {
          user: req.session.user,
          messages: messages,
          contacts: contacts,
        });
      });
    });
  } else {
      res.redirect("/login");
  }
});

app.get('/messages', (req, res, next) => {
  req.query = req.query || {};
  req.room_key = req.query.room_key || 3346011300;
  handle_database(req, 'getMessages', (messages) => {
    res.render('messages', {
      user: req.session.user,
      messages: messages,
    });
  });
});


app.get('/users', (req, res, next) => {
  handle_database(req, 'users', (rows) => {
    res.json(rows);
  });
});

app.get('/login', (req, res, next) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

app.post('/login', (req, res, next) => {
  handle_database(req, "login", function(response) {
    if (response === null) {
      res.json({error: true, message: 'Database error occured'});
    }
    else {
      if (!response) {
        res.json({error: true, message: 'Login failed ! Please register'});
      }
      else {
        req.session.user = response;
        console.info(response);
        res.json({error: false, message: 'Login success.'});
      }
    }
  });
});

app.get('/logout', (req, res, next) => {
  if(req.session.user) {
    req.session.destroy(function(){
      res.redirect('/login');
    });
  } else {
      res.redirect('/login');
  }
});

app.get('/mysql', (req, res, next) => {
  res.sendFile(path.join(__dirname, 'mysql.html'));
});

app.post('/register', (req, res, next) => {
  handle_database(req, 'register', (result) => {
    if (result === null) {
      res.json({ "error": true, "message": "Error while adding user." });
    }
    else {
      res.json({ "error": false, "message": "Registered successfully." });
    }
  });
});

app.post('/invite-user', (req, res, next) => {
  var participants = [
    req.body.user_id,
    req.body.partner_id
  ];

  req.body.room_key = crc.unsigned(participants.sort().join('::'));

  handle_database(req, 'inviteUser', (result) => {
    if (result === null) {
      res.json({ "error": true, "message": "Error while inviting user." });
    }
    else {
      res.json({ "error": false, "message": "Invited successfully." });
    }
  });
});

app.post('/add-message', (req, res, next) => {
  handle_database(req, 'addMessage', (result) => {
    if (result === null) {
      res.json({ "error": true, "message": "Error while adding message." });
    }
    else {
      res.json({ "error": false, "message": "Added successfully." });
    }
  });
});

app.get('/chat', (req, res, next) => {
  var id = 15;
  req.room_key = 3346011300;
  handle_database(req, 'getMessages', (result) => {
    if (result === null) {
      res.render('chat', {
        id: id,
        messages: [
            {name:'', msg: 'aSdaD', created_by: 5},
            {name:'', msg: 'AFSfsaf', created_by: 15},
            {name:'', msg: 'afsafsa', created_by: 5},
            {name:'', msg: 'ASfsfafs', created_by: 15},
        ]
      });      
    } else {
      res.render('chat', {
        user: req.session.user,
        messages: result
      });
    }

  });

});

// Chatroom
var numUsers = 0;
io.use(function(socket, next) {
    sessionMiddleware(socket.request, socket.request.res, next);
});
io.on('connection', (socket) => {
  var addedUser = false;
  
  // console.info(socket.handshake);
  console.info('session', socket.request.session);
  console.log('rooms', socket.rooms);
  
  // when the client emits 'new message', this listens and executes
  socket.on('new message', (data) => {
    if (data.room_key) {
      // we tell the client to execute 'new message'
      socket.to(data.room_key).emit('new message', {
        username: socket.username,
        message: data
      });
    }
  });

  // when the client emits 'add user', this listens and executes
  socket.on('add user', (username) => {
    if (addedUser) return;

    // we store the username in the socket session for this client
    socket.username = username;
    ++numUsers;
    addedUser = true;
    socket.emit('login', {
      numUsers: numUsers
    });
    // echo globally (all clients) that a person has connected
    socket.broadcast.emit('user joined', {
      username: socket.username,
      numUsers: numUsers
    });
  });

  // when the client emits 'typing', we broadcast it to others
  socket.on('typing', () => {
    socket.broadcast.emit('typing', {
      username: socket.username
    });
  });

  // when the client emits 'stop typing', we broadcast it to others
  socket.on('stop typing', () => {
    socket.broadcast.emit('stop typing', {
      username: socket.username
    });
  });

  // when the user disconnects.. perform this
  socket.on('disconnect', () => {
    if (addedUser) {
      --numUsers;

      // echo globally that this client has left
      socket.broadcast.emit('user left', {
        username: socket.username,
        numUsers: numUsers
      });
    }
  });
  
  if (socket.request.session) {
    if (Array.isArray(socket.request.session.contacts)) {
      var contacts = socket.request.session.contacts;
      for(var i=0, n=contacts.length; i<n; i++) {
        socket.join(contacts[i].room_key, ()=>{
          console.log(socket.rooms);
        });
      }
    }
  }
});

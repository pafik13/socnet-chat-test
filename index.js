// Setup basic express server
const express = require('express');
const app = express();
const path = require('path');
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const port = process.env.NODEJS_PORT || 3000;
const bodyParser = require('body-parser');
const crc = require('crc').crc32;
const mysql = require("mysql");
const squel = require("squel");
const async = require("async");

// Session deps
const session = require('express-session');
const RedisStore = require('connect-redis')(session);
const redis = require("redis");
const client = redis.createClient();

// Constants
const DUMMY_ICON = 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0a/Gnome-stock_person.svg/600px-Gnome-stock_person.svg.png';
const squelMysql = squel.useFlavour('mysql');
const squelOpts = { autoQuoteTableNames: true, autoQuoteFieldNames: true };
const sqlQueries = {
  addMessage: squelMysql.insert(squelOpts).into('tbl_messages'),
  getMessages: squelMysql.select(squelOpts).from('tbl_messages', 'M').join('tbl_users', 'U', 'M.`created_by` = U.`id`'),
  getUser: squelMysql.select(squelOpts).from('tbl_users'),
  addUser: squelMysql.insert(squelOpts).into('tbl_users'),
  getContactsWLM: squelMysql.select(squelOpts).from('vw_contacts_with_last_message'),
  getContacts: squelMysql.select(squelOpts).from('tbl_rooms'),
  getUnusedContacts: squelMysql.select(squelOpts).from('tbl_users'),
};

// Always use MySQL pooling.
// Helpful for multiple connections.
const pool = mysql.createPool({
  connectionLimit: 100,
  host: 'localhost',
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASS,
  database: process.env.MYSQL_DB,
  debug: false
});

function handle_database(req, type, callback) {
  async.waterfall([
      function(callback) {
        pool.getConnection(function(err, connection) {
          if (err) {
            // if there is error, stop right away.
            // This will stop the async code execution and goes to last function.
            callback(err);
          } else {
            callback(null, connection);
          }
        });
      },
      function(connection, callback) {
        var SQLquery;
        switch (type) {
          case "users":
            SQLquery = "SELECT * from tbl_users";
            break;
          case "getUser":
            SQLquery = sqlQueries.getUser.clone()
              .field('id')
              .field('nick')
              .field('name')
              .field('icon')
              .where('id = ?', req.body.user_id)
              .toString();
            break;
          case "inviteUser":
            SQLquery = ["INSERT INTO tbl_rooms(`key`, `user_id`, `partner_id`)",
              "VALUES",
              "(" + req.body.room_key + "," + req.body.user_id + "," + req.body.partner_id + "),",
              "(" + req.body.room_key + "," + req.body.partner_id + "," + req.body.user_id + ");",
            ].join('\n');
            break;
          case "addMessage":
            SQLquery = sqlQueries.addMessage.clone()
              .set('room_key', req.body.room_key, { dontQuote: true })
              .set('message', connection.escape(req.body.message), { dontQuote: true })
              .set('created_by', req.body.user_id, { dontQuote: true })
              .toString();
            break;
          case "getMessages":
            SQLquery = sqlQueries.getMessages.clone()
              .field("M.id")
              .field("room_key")
              .field("message")
              .field("created_by")
              .field("created_at")
              .field("U.icon", 'user_icon')
              .where("room_key = ?", req.room_key)
              .order('created_at', false)
              .limit(15)
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
              .field('icon')
              .where("nick = ?", req.body.nickname)
              .where("pwd = ?", req.body.password)
              .toString();
            break;
          case "register":
            SQLquery = sqlQueries.addUser.clone()
              .set('nick', connection.escape(req.body.nickname), { dontQuote: true })
              .set('pwd', connection.escape(req.body.password), { dontQuote: true })
              .set('name', connection.escape(req.body.fullname), { dontQuote: true })
              .set('icon', connection.escape(DUMMY_ICON), { dontQuote: true })
              .toString();
            break;
          case 'getUnusedContacts':
            const subQuery = sqlQueries.getContacts.clone()
              .field('partner_id')
              .where('user_id = ?', req.session.user.id);
            
            SQLquery = sqlQueries.getUnusedContacts.clone()
              .field("id")
              .field("nick")
              .field("name")
              .field('icon')
              .where('id NOT IN ?', subQuery)
              .where("nick LIKE ?", '%' + req.nick_part + '%')
              .toString();
          default:
            break;
        }
        callback(null, connection, SQLquery);
      },
      function(connection, SQLquery, callback) {
        console.info(SQLquery);
        connection.query(SQLquery, function(err, rows) {
          connection.release();
          
          if (err) {
            // if there is error, stop right away.
            // This will stop the async code execution and goes to last function.
            callback(err);
          } else {
            if (type === "getMessages") {
              callback(null, rows.length === 0 ? false : rows);
            } else if (type === "getUnusedContacts") {
              callback(null, rows.length === 0 ? false : rows);
            } else if (type === "users") {
              callback(null, rows.length === 0 ? false : rows);
            } else if (type === "getUser") {
              callback(null, rows.length === 0 ? false : rows[0]);
            }
            else if (type === "login") {
              callback(null, rows.length === 0 ? false : rows[0]);
            }
            else if (type === "getStatus") {
              callback(null, rows.length === 0 ? false : rows);
            }
            else if (type === "getContactsWLM") {
              callback(null, rows);
            }
            else if (type === "checkEmail") {
              callback(null, rows.length === 0 ? false : true);
            }
            else {
              callback(null, false);
            }
          }
        });
      }
    ],
    function(err, result) {
      if (err) {
        callback(err);
      } else {
        callback(null, result);
      }
    });
}


server.listen(port, () => {
  console.log('Server listening at  0.0.0.0:%d', port);
});

app.set("view engine", "ejs");

// Parsers
// https://stackoverflow.com/questions/5710358/how-to-retrieve-post-query-parameters
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
    handle_database(req, 'getContactsWLM', (err, contacts) => {
      if (err) {
        console.error(err);
        res.status(500).send(err.message);
      } else {
        req.session.contacts = contacts;
        if (!contacts.length) {
          res.render('chat', {
            user: req.session.user,
            contacts: contacts,
          });
        } else {
          const keys = contacts.map((user) => `user:${user.id}`);
          client.mget(keys, (err, replies) => {
            if (err) {
              console.error(err);
              res.status(500).send(err.message);
            } else {
              const len = contacts.length;
              for(var i = 0; i<len; i++) {
                if (replies[i] == null) {
                  contacts[i]["status"] = 'offline';
                } else if (replies[i] == 'false') {
                  contacts[i]["status"] = 'offline';
                } else if (replies[i] == 'true') {
                  contacts[i]["status"] = 'online';
                }
              }
              res.render('chat', {
                user: req.session.user,
                contacts: contacts,
              });
            }
          });
        }
      }
    });
  } else {
      res.redirect("/login");
  }
});

app.get('/messages', (req, res, next) => {
  req.query = req.query || {};
  req.room_key = req.query.room_key || 3346011300;
  handle_database(req, 'getMessages', (err, messages) => {
    if (err) {
      console.error(err);
    } else {
      res.render('messages', {
        user: req.session.user,
        messages: messages,
      });
    }
  });
});

app.get('/unused-contacts', (req, res, next) => {
  req.query = req.query || {};
  req.nick_part = req.query.nick_part || 'abc';
  handle_database(req, 'getUnusedContacts', (err, contacts) => {
    if (err) {
      console.error(err);
    } else {
      const keys = contacts.map((user) => `user:${user.id}`);
      client.mget(keys, (err, replies) => {
        if (err) {
          console.error(err);
          res.status(500).send(err.message);
        } else {
          const len = contacts.length;
          for(var i = 0; i<len; i++) {
            if (replies[i] == null) {
              contacts[i]["status"] = 'offline';
            } else if (replies[i] == 'false') {
              contacts[i]["status"] = 'offline';
            } else if (replies[i] == 'true') {
              contacts[i]["status"] = 'online';
            }
          }
          res.render('unusedContacts', {
            user: req.session.user,
            users: contacts,
          });
        }
      });
    }
  });
});

app.get('/users', (req, res, next) => {
  handle_database(req, 'users', (err, rows) => {
    if (err) {
      console.error(err);
    } else {
      res.json(rows);
    }
  });
});

app.get('/login', (req, res, next) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

app.post('/login', (req, res, next) => {
  handle_database(req, 'login', function(err, user) {
    if (err) {
      res.json({error: true, message: 'Database error occured: ' + err.message});
    } else {
      if (!user) {
        res.json({error: true, message: 'Login failed ! Please register'});
      } else {
        req.session.user = user;
        console.info(user);
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
  res.sendFile(path.join(__dirname, 'public/_mysql.html'));
});

app.post('/register', (req, res, next) => {
  handle_database(req, 'register', (err) => {
    if (err) {
      console.error(err);
      res.json({ "error": true, "message": "Error while adding user." });
    } else {
      handle_database(req, 'login', function(err, user) {
        if (err) {
          res.json({error: true, message: 'Database error occured: ' + err.message});
        } else {
          if (!user) {
            res.json({error: true, message: 'Login failed ! Please register'});
          } else {
            req.session.user = user;
            console.info(user);
            res.json({ "error": false, "message": "Registered successfully." });
          }
        }
      });
    }
  });
});

app.post('/invite-user', (req, res, next) => {
  req.body.user_id = req.session.user.id;
  
  var participants = [
    req.body.user_id,
    req.body.partner_id
  ];

  req.body.room_key = crc.unsigned(participants.sort().join('::'));

  handle_database(req, 'inviteUser', (err, result) => {
    if (err) {
      console.error(err);
      res.json({
        error: true,
        message: 'Error while inviting user.'
      });
    } else {
      res.json({
        error: false,
        message: 'Invited successfully.',
        room_key: req.body.room_key,
        partner_id: req.body.partner_id
      });
    }
  });
});

app.post('/add-message', (req, res, next) => {
  handle_database(req, 'addMessage', (err, result) => {
    if (err) {
      console.error(err);
      res.json({ "error": true, "message": "Error while adding message." });
    } else {
      res.json({ "error": false, "message": "Added successfully." });
    }
  });
});

app.get('/chat', (req, res, next) => {
  var id = 15;
  req.room_key = 3346011300;
  handle_database(req, 'getMessages', (err, result) => {
    if (err) {
      console.error(err);
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
      const dummyReq = {
        body: {
          room_key: data.room_key,
          message: data.message,
          user_id: socket.request.session.user.id,
        }
      };
      
      handle_database(dummyReq, 'addMessage', (err, result)=>{
        if (err) {
          console.error(err);
        } else {
          console.info(result);
          // we tell the client to execute 'new message'
          data.username = socket.username;
          data.user_id  = socket.request.session.user.id;
          socket.to(data.room_key).emit('new message', data);
        }
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
  
  // when the client emits 'user invited', we broadcast it to partner
  socket.on('user invited', (data) => {
    console.info('user invited', data);
    const partnerId = data.partner_id;
    const roomKey = data.room_key;
    const dummyReq = {
      body: {
        user_id: socket.request.session.user.id,
      }
    };
    handle_database(dummyReq, 'getUser', (err, result)=>{
      if (err) {
        console.error(err);
      } else {
        console.info(result);
        // we tell the client to execute 'new message'
        socket.to(`user:${partnerId}`).emit('invited', {
          username: socket.username,
          room_key: roomKey,
          user_id: dummyReq.body.user_id,
          user: result
        });
      }
    });

  });

  // when the client emits 'user invited', we broadcast it to partner
  socket.on('user invite', (data, cb) => {
    console.info('user invite', data);
    const dummyReq = {
      body: {
        user_id: socket.request.session.user.id,
        partner_id: data.partner_id,
      }
    };
    
    var participants = [
      dummyReq.body.user_id,
      dummyReq.body.partner_id
    ];
  
    dummyReq.body.room_key = crc.unsigned(participants.sort().join('::'));
  
    handle_database(dummyReq, 'inviteUser', (err, result) => {
      if (err) {
        console.error(err);
        cb(err.message, 'Error while inviting user.');
      } else {
        socket.join(dummyReq.body.room_key, () => {
          socket.request.session.contacts.push(data.user);
          cb(null, {
            room_key: dummyReq.body.room_key,
            partner_id: dummyReq.body.partner_id,
          });
        });
        
        handle_database(dummyReq, 'getUser', (err, result)=>{
          if (err) {
            console.error(err);
          } else {
            console.info(result);
            result.status = 'online';
            const userIdStr = `user:${dummyReq.body.partner_id}`;
            socket.to(userIdStr).emit('invited', {
              username: socket.username,
              room_key: dummyReq.body.room_key,
              user_id: dummyReq.body.user_id,
              user: result
            });
          }
        });
        
      }
    });
  });
  
  socket.on('join to', (data, cb) => {
    console.log('join to', data.room_key);
    if (data.room_key) {
      socket.join(data.room_key, () => {
        data.user.room_key = data.room_key;
        socket.request.session.contacts.push(data.user);
        cb(`joined to room:${data.room_key}`);
      });
    }
  });
  
  socket.on('get user status', (data, cb) => {
    console.log('get user status', data);
    if (data.partner_id) {
      const key = `user:${data.partner_id}`;
      client.get(key, (err, reply) => {
        if (err) {
          console.error(err);
          cb(err);
        } else {
          var status;
          if (reply == null) {
            status = 'offline';
          } else if (reply == 'false') {
            status = 'offline';
          } else if (reply == 'true') {
            status = 'online';
          }
          
          cb(null, status);
        }
      });
      socket.join(data.room_key, () => {
        cb(`joined to room:${data.room_key}`);
      });
    }
  });

  // when the client emits 'typing', we broadcast it to others
  socket.on('typing', (data) => {
    console.info('typing', data);
    socket.to(data.room_key).emit('typing', {
      username: socket.username,
      room_key: data.room_key
    });
  });

  // when the client emits 'stop typing', we broadcast it to others
  socket.on('stop typing', (data) => {
    console.info('stop typing', data);
    socket.to(data.room_key).emit('stop typing', {
      username: socket.username,
      room_key: data.room_key
    });
  });

  socket.on('logout', () => {
    // leave to all rooms
    if (socket.request.session) {
      const userIdStr = `user:${socket.request.session.user.id}`;
      // leave from notification room
      socket.join(userIdStr);
      // save status
      client.set(userIdStr, false, redis.print);
      
      if (Array.isArray(socket.request.session.contacts)) {
        var contacts = socket.request.session.contacts;
        for(var i=0, n=contacts.length; i<n; i++) {
          socket.leave(contacts[i].room_key, ((roomKey)=> {
            return () => {
              console.log('leave', roomKey);
              socket.to(roomKey).emit('user left', {
                room_key: roomKey,
              });
            };
          })(contacts[i].room_key));
        }
      }
    }
  });

  // when the user disconnects.. perform this
  socket.on('disconnect', () => {
    if (addedUser) {
      --numUsers;

      // // echo globally that this client has left
      // socket.broadcast.emit('user left', {
      //   username: socket.username,
      //   numUsers: numUsers
      // });
      
      // leave to all rooms
      if (socket.request.session) {
        const userIdStr = `user:${socket.request.session.user.id}`;
        // leave from notification room
        socket.join(userIdStr);
        // save status
        client.set(userIdStr, false, redis.print);
        
        if (Array.isArray(socket.request.session.contacts)) {
          var contacts = socket.request.session.contacts;
          for(var i=0, n=contacts.length; i<n; i++) {
            socket.leave(contacts[i].room_key, ((roomKey)=> {
              return () => {
                console.log('leave', roomKey);
                socket.to(roomKey).emit('user left', {
                  room_key: roomKey,
                });
              };
            })(contacts[i].room_key));
          }
        }
      }
    }
  });
  
  // join to all rooms
  if (socket.request.session) {
    // console.log(socket.request.session);
    const userIdStr = `user:${socket.request.session.user.id}`;
    // join to notification room
    socket.join(userIdStr);
    // save status
    client.set(userIdStr, true, redis.print);
    
    if (Array.isArray(socket.request.session.contacts)) {
      var contacts = socket.request.session.contacts;
        for(var i=0, n=contacts.length; i<n; i++) {
          socket.join(contacts[i].room_key, ((roomKey)=> {
            return () => {
              console.log('join', roomKey);
              socket.to(roomKey).emit('user joined', {
                room_key: roomKey,
              });
            };
          })(contacts[i].room_key));
        }
    }
  }
});

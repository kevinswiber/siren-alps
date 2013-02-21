var express = require('express');

var dbUrl = process.env.DATABASE_URL || 'http://localhost:5984'
var nano = require('nano')(dbUrl);
var alps = nano.use('alps');

var posts = require('./posts');

var helpers = require('./helpers');
var buildUri = helpers.buildUri;

var app = express();

app.get('/', function(req, res) {
  var home = {
    entities: [
      { href: buildUri('/messages'), rel: ['messages-all'] },
      { href: buildUri('/users'), rel: ['users-all'] }
    ],
    actions: [
      {
        name: 'message-post',
        href: buildUri('/messages'),
        method: 'POST',
        fields: [ { name: 'message', type: 'text' } ]
      },
      {
        name: 'user-add',
        href: buildUri('/users'),
        method: 'POST',
        fields: [
          { name: 'user', type: 'text' },
          { name: 'email', type: 'text' },
          { name: 'password', type: 'password' }
        ]
      }
    ],
    links: [
      { rel: ['self', 'index'], href: buildUri('/') }
    ]
  };
  
  body = JSON.stringify(home);
  res.status(200);
  res.header('Access-Control-Allow-Origin', '*');
  res.type('application/vnd.siren+json');
  //res.writeHead(200, { 'Content-Type': 'application/vnd.siren+json', 'Content-Length':  body.length });
  res.send(body);
});

app.get('/messages', function(req, res) {
  posts.all(function(err, docs) {
    if (err) {
      res.send(500);
      console.log(err);
      return;
    }

    var body = JSON.stringify(docs);
    res.type('application/vnd.siren+json');
    res.header('Access-Control-Allow-Origin', '*');
    res.send(body);
  });

});

app.get('/messages/:messageId', function(req, res) {
  posts.one(req.params.messageId, function(err, docs) {
    if (err) {
      res.send(500);
      console.log(err);
      return;
    }

    var body = JSON.stringify(docs);

    res.type('application/vnd.siren+json');
    res.header('Access-Control-Allow-Origin', '*');
    res.send(body);
  });
});

app.post('/messages', function(req, res) {
  var text = req.body.message;
  var post = {
    type: 'post',
    text: text,
    user: '[anonymous]',
    dateCreated: helpers.getTimestamp(new Date())
  };

  alps.insert(post, function(err, body) {
    if (err) {
      res.send(500);
      console.log(err);
      return;
    }

    var location = buildUri('/messages/' + body.id);
    var response = {
      links: [ { rel: ['index'], href: buildUri('/') } ]
    };

    var body = JSON.stringify(response);
    res.type('application/vnd.siren+json');
    res.header('Access-Control-Allow-Origin', '*');
    res.send(body);
  });
});

app.get('/users', function(req, res) {
  var users = {
    class: ['all', 'users'],
    entities: [],
    actions: [
      {
        name: 'user-add',
        href: buildUri('/users'),
        method: 'POST',
        fields: [
          { name: 'user', type: 'text' },
          { name: 'email', type: 'text' },
          { name: 'password', type: 'password' }
        ]
      }
    ],
    links: [
      { rel: ['self', 'users-all'], href: buildUri('/users') },
      { rel: ['index'], href: buildUri('/') }
    ]
  };

  alps.view('microblog', 'users_search', function(err, body) {
    if (err) {
      res.json(users);
      return;
    }

    users.entities = body.rows.map(function(doc) {
      var u = doc.value;
      var user = {
        class: ['user'],
        properties: {
          'user-text': u.name
        },
        entities: [
          {
            href: buildUri('/users/' + encodeURIComponent(u._id)),
            rel: ['user']
          },
          {
            href: buildUri('/user-messages/' + encodeURIComponent(u._id)),
            rel: ['messages']
          }
        ]
      };

      return user;
    });

    var body = JSON.stringify(users);
    res.type('application/vnd.siren+json');
    res.header('Access-Control-Allow-Origin', '*');
    res.send(body);
  });
});

app.get('/users/:userId', function(req, res) {
  var userId = req.params.userId;
  var user = {
    class: ['user'],
    properties: {},
    entities: [],
    links: [
      { rel: ['self', 'user'], href: buildUri('/users/' + encodeURIComponent(userId)) },
      { rel: ['index'], href: buildUri('/') }
    ]
  };

  alps.view('microblog', 'users_by_id', { keys: [userId] }, function(err, body) {
    if (err) {
      res.json(users);
      return;
    }

    user.properties = {
      'user-text': userId
    };

    user.entities = [
      {
        rel: ['user'],
        href: buildUri('/users/' + encodeURIComponent(userId))
      },
      {
        href: buildUri('/user-messages/' + encodeURIComponent(userId)),
        rel: ['messages']
      }
    ];

    var body = JSON.stringify(user);
    res.type('application/vnd.siren+json');
    res.header('Access-Control-Allow-Origin', '*');
    res.send(body);
  });
});

app.get('/user-messages/:userId', function(req, res) {
  var userId = req.params.userId;

  posts.byUser(userId, function(err, docs) {
    if (err) {
      res.send(500);
      console.log(err);
      return;
    }

    var body = JSON.stringify(docs);
    res.type('application/vnd.siren+json');
    res.header('Access-Control-Allow-Origin', '*');
    res.send(body);
  });
});

app.use(express.bodyParser());
app.use(app.router);

app.listen(process.env.PORT || 3000);

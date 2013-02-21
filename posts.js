var nano = require('nano')(process.env.DATABASE_URL || 'http://localhost:5984');
var alps = nano.use('alps');
var helpers = require('./helpers');
var buildUri = helpers.buildUri;

exports.all = function(cb) {
  var messages = {
    class: ['all', 'messages'],
    entities: [],
    actions: [
      {
        name: 'message-post',
        href: buildUri('/messages'),
        method: 'POST',
        fields: [ { name: 'message', type: 'text' } ]
      }
    ],
    links: [
      { rel: ['self', 'messages-all'], href: buildUri('/messages') },
      { rel: ['index'], href: buildUri('/') }
    ]
  };

  alps.view('microblog', 'posts_all', function(err, body) {
    if (err) {
      cb(err);
      return;
    }

    messages.entities = convertDocsToPosts(body.rows);

    cb(null, messages);
  });
};

exports.one = function(id, cb) {
  var message = {
    class: ['message'],
    properties: {},
    entities: [],
    links: [
      { rel: ['self', 'message'], href: buildUri('/messages/' + id) },
      { rel: ['index'], href: buildUri('/') }
    ]
  };

  alps.get(id, function(err, body) {
    if (err) {
      cb(err);
      return;
    }

    message.properties = {
      'user-text': body.user,
      'message-text': body.text,
      'date-time': body.dateCreated
    };

    message.entities = [
      {
        href: buildUri('/users/' + encodeURIComponent(body.user)),
        rel: ['user']
      },
    ];

    cb(null, message);
  });
};

exports.byUser = function(id, cb) {
  var messages = {
    class: ['search', 'messages'],
    entities: [],
    links: [
      { rel: ['self'], href: buildUri('/user-messages/' + id) },
      { rel: ['index'], href: buildUri('/') }
    ]
  };

  alps.view('microblog', 'posts_by_user', { keys: [id] }, function(err, body) {
    if (err) {
      cb(err);
      return;
    }

    messages.entities = convertDocsToPosts(body.rows);

    cb(null, messages);
  });
};

function convertDocsToPosts(docs) {
  return docs.map(function(doc) {
    var m = doc.value;
    var message = {
      class: ['message'],
      properties: {
        'user-text': m.user,
        'message-text': m.text,
        'date-time': m.dateCreated
      },
      entities: [
        {
          href: buildUri('/users/' + encodeURIComponent(m.user)),
          rel: ['user']
        },
        {
          href: buildUri('/messages/' + m._id),
          rel: ['message']
        }
      ]
    };

    return message;
  });
}

var User = require('../models/userModel');
var bcrypt = require('bcrypt');
var jwt = require('jsonwebtoken');
var _ = require('lodash');

var createToken = function(user) {
  return jwt.sign(_.omit(user, 'password'), 'config.secret', { expiresIn: 60 * 60 * 5 });
};

// Error messages to log and return as responses
var errNoUsername = 'Username does not exist';
var errIncorrectPassword = 'Incorrect password';
var errUsernameTaken = 'Username already taken';

exports.login = function(req, res) {
  console.log('POST /api/users/login. username:', req.body.username);
  User.findOne({username: req.body.username})
    .then(function(user) {
      if (!user) {
        console.log(errNoUsername);
        res.status(401).send();
      } else {
        bcrypt.compare(req.body.password, user.password, function(err, match) {
          if (match) {
            res.status(201).send({
              'id_token': createToken(user)
            });
          } else {
            console.log(errIncorrectPassword);
            res.status(401).send();
          }
        })
      }

    });
};

exports.signup = function(req, res) {
  console.log('POST /api/users/signup. username:', req.body.username);
  const username = req.body.username;
  const password = req.body.password;
  User.findOne({username: req.body.username})
    .then(function(user) {
      if (!user) {
        bcrypt.hash(password, 10, function(err, hash) {
          if (err) {
            console.log(err);
            res.end();
          }
          User.create({
            username: username,
            password: hash
          }).then(function(user) {
            res.status(201).send({
              'id_token': createToken(user)
            });
          });

        })

      } else {
        console.log(errUsernameTaken);
        res.status(401).send();
      }
    });
};
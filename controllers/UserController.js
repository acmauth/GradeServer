const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const tokenList = {};

const UserModel = require('../models/UserModel');

module.exports = {
  addFavoriteCourse: (req, res) => {
    res.json({});
  },

  addFavoriteTeacher: (req, res) => {
    res.json({});
  },

  getData: (req, res) => {
    res.json({});
  },

  login: (req, res) => {
    UserModel.findOne({ email: req.body.email })
      .exec()
      .then(user => {
        if (!user) {
          return res.status(401).json({
            message: 'Authentication failed'
          });
        }
        bcrypt.compare(req.body.password, user.password, (err, success) => {
          if (err) {
            return res.status(401).json({
              message: 'Authentication failed'
            });
          }
          if (success) {
            const token = jwt.sign(
              {
                email: user.email,
                userId: user._id
              },
              process.env.tokenSecretKey,
              {
                expiresIn: "1h"
              }
            );

            const refreshToken = jwt.sign(
              {
                email: user.email,
                userId: user._id
              },
              process.env.refreshTokenSecret,
              {
                expiresIn: "24h"
              }
            );

            const response = {
              message: 'Authentication successful',
              token: token,
              refreshToken: refreshToken
            };
            tokenList[refreshToken] = response;
            return res.status(200).json(response);
          }
        });
      })
      .catch(err => {
        console.log(err);
        res.status(500).json({
          error: err
        });
      });
  },

  profile: (req, res) => {
    res.json({});
  },

  removeFavoriteCourse: (req, res) => {
    res.json({});
  },

  removeFavoriteTeacher: (req, res) => {
    res.json({});
  },

  refreshToken: (req, res) => {
    var refreshToken = req.body.refreshToken;
    if (refreshToken && refreshToken in tokenList) {
      const token = jwt.sign(
        {
          email: req.body.email,
          userId: req.body._id
        },
        process.env.refreshTokenSecret,
        {
          expiresIn: "1h"
        }
      );

      const response = {
        token: token
      };

      tokenList[req.body.refreshToken].token = token;
      res.status(200).json(response);
    } else {
      res.status(404).send('Invalid request');
    }
  },

  signup: (req, res) => {
    UserModel.find({ email: req.body.email })
      .exec()
      .then(user => {
        if (user.length > 0) {
          return res.status(409).json({
            message: 'Mail exists'
          });
        } else {
          bcrypt.hash(req.body.password, 10, (err, hash) => {
            if (err) {
              return res.status(500).json({
                error: err
              });
            } else {
              const user = new UserModel({
                _id: new mongoose.Types.ObjectId(),
                email: req.body.email,
                password: hash
              });
              user
                .save()
                .then(result => {
                  res.status(201).json({
                    message: 'User created!'
                  });
                })
                .catch(err => {
                  console.log(err);
                  res.status(500).json({
                    error: err
                  });
                });
            }
          });
        }
      });
  },

  updateGrades: (req, res) => {
    res.json({});
  }
};

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

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
              process.env.JWT_KEY,
              {
                expiresIn: '1h'
              }
            );
            return res.status(200).json({
              message: 'Authentication successful',
              token: token
            });
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

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const tokenList = {};

const BioSchema = require('../models/schemas/BioSchema');
const PostRegistrationSchema = require('../models/schemas/PostRegistrationSchema');
const UserModel = require('../models/UserModel');
const CourseModel = require('../models/CourseModel');
const TeacherModel = require('../models/TeacherModel');

const Favorites = {
  COURSES: {
    model: CourseModel,
    collection: 'courses',
    set: 'favorite_subjects'
  },
  TEACHERS: {
    model: TeacherModel,
    collection: 'teachers',
    set: 'favorite_teachers'
  }
};

function addFavorite(req, res, favorite) {
  var list = [];
  var promises = [];
  if (!req.body[favorite.collection]) {
    res.status(400).send();
    return;
  }
  req.body[favorite.collection].forEach(async item => {
    const query = {};
    query['_id'] = item;
    promises.push(
      favorite.model
        .countDocuments(query)
        .exec()
        .then(count => {
          if (count > 0) {
            list.push(item);
          }
        })
        .catch()
    );
  });

  Promise.all(promises).then(() => {
    if (list.length != 0) {
      const query = {};
      query[favorite.set] = list;
      UserModel.updateOne({ _id: req.userData.userId }, { $addToSet: query })
        .exec()
        .then(res.status(204).send())
        .catch();
    } else {
      res.status(400).json({
        message: 'Invalid id'
      });
    }
  });
}

function removeFavorite(req, res, favorite) {
  var list = [];
  var promises = [];
  if (!req.body[favorite.collection]) {
    res.status(400).send();
    return;
  }
  req.body[favorite.collection].forEach(async item => {
    const query = {};
    query[favorite.path] = item;
    promises.push(
      favorite.model
        .countDocuments(query)
        .exec()
        .then(count => {
          if (count > 0) {
            list.push(item);
          }
        })
        .catch()
    );
  });

  Promise.all(promises).then(() => {
    if (list.length != 0) {
      const query = {};
      query[favorite.set] = { $in: list };
      UserModel.updateOne({ _id: req.userData.userId }, { $pull: query })
        .exec()
        .then(res.status(204).send())
        .catch();
    } else {
      res.status(400).json(() => {
        message: 'Invalid id';
      });
    }
  });
}

module.exports = {
  addFavoriteCourse: (req, res) => {
    addFavorite(req, res, Favorites.COURSES);
  },

  addFavoriteTeacher: (req, res) => {
    addFavorite(req, res, Favorites.TEACHERS);
  },

  getData: (req, res) => {
    res.json({});
  },

  getProfile: (req, res) => {
    UserModel.findOne({ _id: req.userData.userId })
      .exec()
      .then(user => {
        user._id = undefined;
        user.password = undefined;
        user.__v = undefined;
        res.json(user);
      })
      .catch();
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
            // Error occurred when comparing passwords.
            // Reject request with internal error.
            return res.status(500).send();
          }
          if (success) {
            const token = jwt.sign(
              {
                email: user.email,
                userId: user._id
              },
              process.env.tokenSecretKey,
              {
                expiresIn: process.env.tokenLife
              }
            );

            const refreshToken = jwt.sign(
              {
                email: user.email,
                userId: user._id
              },
              process.env.refreshTokenSecret,
              {
                expiresIn: process.env.refreshTokenLife
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
          return res.status(401).json({
            message: 'Authentication failed'
          });
        });
      })
      .catch(err => {
        console.log(err);
        res.status(500).json({
          error: err
        });
      });
  },

  postRegistration: (req, res) => {
    const id = req.userData.userId;
    const fields = {};

    PostRegistrationSchema.eachPath(path => {
      if (req.body[path]) {
        fields[`postRegistrationInfo.${path}`] = req.body[path];
      }
    });

    UserModel.updateOne(
      { _id: id },
      {
        $set: fields
      }
    )
      .exec()
      .then(status => {
        if (status.nModified == 1) {
          res.status(200).send(status);
        } else {
          res.status(400).send(status);
        }
      })
      .catch(err => res.status(400).send(err));
  },

  removeFavoriteCourse: (req, res) => {
    removeFavorite(req, res, Favorites.COURSES);
  },

  removeFavoriteTeacher: (req, res) => {
    removeFavorite(req, res, Favorites.TEACHERS);
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
          expiresIn: process.env.tokenLife
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

  updateBio: (req, res) => {
    const id = req.userData.userId;
    const fields = {};

    BioSchema.eachPath(path => {
      if (req.body[path]) {
        fields[`bio.${path}`] = req.body[path];
      }
    });

    // TODO Validation
    UserModel.updateOne(
      { _id: id },
      {
        $set: fields
      }
    )
      .exec()
      .then(status => {
        if (status.nModified == 1) {
          // UserModel.findById(id)
          //   .exec()
          //   .then(user => {
          //     user._id = undefined;
          //     user.password = undefined;
          //     user.__v = undefined;
          //     res.json(user);
          //   });
          res.status(200).send(status);
        } else {
          res.status(400).send(status);
        }
      })
      .catch(err => res.status(400).send(err));
  },

  updateGrades: (req, res) => {
    res.json({});
  }
};

const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const fileUpload = require("express-fileupload");
const { exec } = require("child_process");
const fs = require("fs");

const tokenList = {};

const BioSchema = require("../models/schemas/BioSchema");
const UserModel = require("../models/UserModel");
const CourseModel = require("../models/CourseModel");
const TeacherModel = require("../models/TeacherModel");

const Favorites = {
  COURSES: {
    model: CourseModel,
    collection: "courses",
    set: "favorite_subjects"
  },
  TEACHERS: {
    model: TeacherModel,
    collection: "teachers",
    set: "favorite_teachers"
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
    query["_id"] = item;
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
        message: "Invalid id"
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
        message: "Invalid id";
      });
    }
  });
}

function generateToken(user) {
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
    token: token,
    refreshToken: refreshToken
  };
  tokenList[refreshToken] = response;
  return response;
}

function updateGrades(user, course) {
  // TODO id exists, grade/year/semester limits

  var passedCourse = user.grades.find(element => element.id === course.id);
  if (!passedCourse) {
    passedCourse = {
      _id: course.id,
      grade: course.grade,
      year_passed: course.year,
      semester: course.semester
    };
    user.grades.push(passedCourse);
  } else {
    passedCourse.grade = course.grade;
    passedCourse.year_passed = course.year;
    passedCourse.semester = course.semester;
  }
}

module.exports = {
  addFavoriteCourse: (req, res) => {
    addFavorite(req, res, Favorites.COURSES);
  },

  addFavoriteTeacher: (req, res) => {
    addFavorite(req, res, Favorites.TEACHERS);
  },

  changePassword: (req, res) => {
    const previousPassword = req.body.previousPassword;
    const newPassword = req.body.newPassword;

    UserModel.findOne({ _id: req.userData.userId })
      .exec()
      .then(user => {
        if (!user) {
          return res.status(400).send();
        }
        bcrypt.compare(previousPassword, user.password, (err, success) => {
          if (err) {
            return res.status(500).send();
          }
          if (success) {
            bcrypt.hash(newPassword, 10, (err, hash) => {
              if (err) {
                return res.status(400).send();
              } else {
                user.password = hash;
                user.save().then(() => {
                  res.json(generateToken(user));
                });
              }
            });
          } else {
            res.status(401).json({
              error: "Invalid password"
            });
          }
        });
      })
      .catch(err => {
        console.log(err);
        res.status(500).json({
          error: "Invalid credentials"
        });
      });
  },

  getData: (req, res) => {
    res.json({});
  },

  getProfile: (req, res) => {
    UserModel.findOne({ _id: req.userData.userId })
      .exec()
      .then(user => {
        user = user.toJSON();
        user._id = undefined;
        user.password = undefined;
        user.__v = undefined;
        var promises = [];
        user.grades.forEach(course => {
          promises.push(
            CourseModel.findOne({ _id: course._id })
              .exec()
              .then(passedCourse => {
                if (!passedCourse) {
                  // res.status(400).send();
                  return;
                }

                course.name = passedCourse.basic_info.name;
                course.teacher = [
                  ...new Set(passedCourse.basic_info.class.teachers)
                ].join(", ");
              })
              .catch()
          );
        });

        var subjects = [];
        user.favorite_subjects.forEach(subject => {
          promises.push(
            CourseModel.findOne({ _id: subject })
              .exec()
              .then(course => {
                if (!course) {
                  // res.status(400).send();
                  return;
                }

                subjects.push(course.basic_info.name);
              })
              .catch()
          );
        });

        var teachers = [];
        user.favorite_teachers.forEach(teacher => {
          promises.push(
            TeacherModel.findOne({ _id: teacher })
              .exec()
              .then(selected => {
                if (!selected) {
                  // res.status(400).send();
                  return;
                }

                teachers.push(selected.name);
              })
              .catch()
          );
        });

        Promise.all(promises).then(() => {
          user.favorite_subjects = subjects;
          user.favorite_teachers = teachers;
          res.json(user);
        });
      })
      .catch();
  },

  login: (req, res) => {
    UserModel.findOne({ email: req.body.email })
      .exec()
      .then(user => {
        if (!user) {
          return res.status(401).json({
            error: "Invalid credentials"
          });
        }
        bcrypt.compare(req.body.password, user.password, (err, success) => {
          if (err) {
            // Error occurred when comparing passwords.
            // Reject request with internal error.
            return res.status(500).send();
          }
          if (success) {
            return res.status(200).json(generateToken(user));
          }
          return res.status(401).json({
            error: "Invalid credentials"
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
      res.status(404).send("Invalid request");
    }
  },

  signup: (req, res) => {
    UserModel.find({ email: req.body.email })
      .exec()
      .then(user => {
        if (user.length > 0) {
          return res.status(409).json({
            message: "Mail exists"
          });
        } else {
          bcrypt.hash(req.body.password, 10, (err, hash) => {
            if (err) {
              return res.status(400).json({
                error: "Invalid request"
              });
            } else {
              const user = new UserModel({
                _id: new mongoose.Types.ObjectId(),
                email: req.body.email,
                password: hash
              });
              user
                .save()
                .then(() => {
                  res.status(201).json(generateToken(user));
                })
                .catch(err => {
                  console.log(err);
                  res.status(500).json({
                    error: "Invalid credentials"
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

  updateGradesList: (req, res) => {
    UserModel.findOne({ _id: req.userData.userId })
      .exec()
      .then(user => {
        if (!user) {
          res.status(400).send();
          return;
        }
        req.body.courses.forEach(course => {
          updateGrades(user, course);
        });
        user.save();
        res.status(201).send();
      })
      .catch();
  },

  updateGradesPDF: (req, res) => {
    var name = req.files.grades.name;
    var index = name.lastIndexOf("."); // TODO no dot?
    var ext = name.substring(index + 1);
    var dt = new Date().getTime();
    var file = dt + "." + ext;
    var filePath = `./files/${file}`;
    req.files.grades.mv(filePath, err => {
      if (err) {
        res.status(500).send();
        console.log(err);
        return;
      }

      exec(
        `java -jar ./parser.jar -json './files/${file}'`,
        (error, stdout, stderr) => {
          if (error) {
            res.status(500).json({
              error: "Invalid file"
            });
            console.log(error);
            return;
          }
          var jsonPath = `./json/${dt}_results.json`;
          var gradesJSON = require(`.${jsonPath}`);
          UserModel.findOne({ _id: req.userData.userId })
            .exec()
            .then(user => {
              if (!user) {
                res.status(400).send();
                return;
              }
              var promises = [];
              gradesJSON.courses.forEach(course => {
                if (course.grade) {
                  promises.push(
                    CourseModel.findOne({ "basic_info.code": course.code })
                      .exec()
                      .then(courseData => {
                        if (courseData) {
                          var updatedCourse = {
                            id: courseData._id,
                            year: course.year,
                            semester: courseData.basic_info.period,
                            grade: course.grade
                          };

                          updateGrades(user, updatedCourse);
                        }
                      })
                      .catch()
                  );
                }
              });
              if (promises.length != 0) {
                Promise.all(promises).then(() => user.save());
              }
            })
            .catch();
          res.status(201).send();
          fs.unlink(filePath, err => {
            if (err) {
              console.log(err);
            }
          });
          fs.unlink(jsonPath, err => {
            if (err) {
              console.log(err);
            }
          });
        }
      );
    });
  }
};

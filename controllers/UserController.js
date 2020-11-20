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

function generateToken(user) {
  const token = jwt.sign(
    {
      email: user.email,
      userId: user._id,
    },
    process.env.tokenSecretKey,
    {
      expiresIn: process.env.tokenLife,
    }
  );

  const refreshToken = jwt.sign(
    {
      email: user.email,
      userId: user._id,
    },
    process.env.refreshTokenSecret,
    {
      expiresIn: process.env.refreshTokenLife,
    }
  );

  const response = {
    token: token,
    refreshToken: refreshToken,
  };
  tokenList[refreshToken] = response;
  return response;
}

function updateGrades(user, course) {
  // TODO id exists, grade/year/semester limits

  var passedCourse = user.grades.find((element) => element.id === course.id);
  if (!passedCourse) {
    passedCourse = {
      _id: course.id,
      grade: course.grade,
      year_passed: course.year,
      semester: course.semester,
    };
    user.grades.push(passedCourse);
  } else {
    passedCourse.grade = course.grade;
    passedCourse.year_passed = course.year;
    passedCourse.semester = course.semester;
  }
}

module.exports = {
  changePassword: (req, res) => {
    const previousPassword = req.body.previousPassword;
    const newPassword = req.body.newPassword;

    UserModel.findOne({ _id: req.userData.userId })
      .then((user) => {
        if (!user) {
          return res.status(400).send();
        }
        bcrypt.compare(previousPassword, user.password, (err, success) => {
          if (err) {
            console.error(`Error during password comparison:\n${err}`);
            return res.status(500).send();
          }
          if (success) {
            bcrypt.hash(newPassword, 10, (err, hash) => {
              if (err) {
                return res.status(400).send();
              } else {
                user.password = hash;
                user.save().then(() => {
                  return res.json(generateToken(user));
                });
              }
            });
          } else {
            return res.status(401).json({
              error: "Invalid password",
            });
          }
        });
      })
      .catch((err) => {
        console.error(`Error during user findOne():\n${err}`);
        return res.status(500).json({
          error: "Invalid credentials",
        });
      });
  },

  getData: (req, res) => {
    res.json({});
  },

  getProfile: (req, res) => {
    UserModel.findOne({ _id: req.userData.userId })
      .exec()
      .then((user) => {
        user = user.toJSON();
        user._id = undefined;
        user.password = undefined;
        user.__v = undefined;
        var promises = [];
        user.grades.forEach((course) => {
          promises.push(
            CourseModel.findOne({ _id: course._id })
              .exec()
              .then((passedCourse) => {
                if (!passedCourse) {
                  // res.status(400).send();
                  return;
                }

                course.name = passedCourse.basic_info.name;
                course.teacher = [
                  ...new Set(passedCourse.basic_info.class.teachers),
                ].join(", ");
              })
              .catch((err) => {
                console.error(`Error during course findOne():\n${err}`);
                return res.status(500).send();
              })
          );
        });

        var subjects = [];
        user.favorite_subjects.forEach((subject) => {
          promises.push(
            CourseModel.findOne({ _id: subject })
              .exec()
              .then((course) => {
                if (!course) {
                  // res.status(400).send();
                  return;
                }

                subjects.push(course.basic_info.name);
              })
              .catch((err) => {
                console.error(`Error during course findOne():\n${err}`);
                return res.status(500).send();
              })
          );
        });

        var teachers = [];
        user.favorite_teachers.forEach((teacher) => {
          promises.push(
            TeacherModel.findOne({ _id: teacher })
              .exec()
              .then((selected) => {
                if (!selected) {
                  // res.status(400).send();
                  return;
                }

                teachers.push(selected.name);
              })
              .catch((err) => {
                console.error(`Error during teacher findOne():\n${err}`);
                return res.status(500).send();
              })
          );
        });

        var currentCourses = [];

        user.current_courses.forEach((course) => {
          promises.push(
          CourseModel.findOne({ _id: course })
            .then((course) => {
              currentCourses.push(course.basic_info.name);
            })
            .catch((err) => {
              console.error(`Error during course findOne():\n${err}`);
              return res.status(500).send();
            })
          )
        })

        Promise.all(promises).then(() => {
          user.favorite_subjects = subjects;
          user.favorite_teachers = teachers;
          user.current_courses = currentCourses;
          return res.json(user);
        });
      })
      .catch((err) => {
        console.error(`Error during user findOne():\n${err}`);
        return res.status(500).send();
      })
  },

  login: (req, res) => {
    UserModel.findOne({ email: req.body.email })
      .exec()
      .then((user) => {
        if (!user) {
          return res.status(401).json({
            error: "Invalid credentials",
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
            error: "Invalid credentials",
          });
        });
      })
      .catch((err) => {
        console.error(`Error during user findOne():\n${err}`);
        return res.status(500).json({
          error: err,
        });
      });
  },

  postRegistration: (req, res) => {
    const id = req.userData.userId;
    const fields = {};

    PostRegistrationSchema.eachPath((path) => {
      if (req.body[path]) {
        fields[`postRegistrationInfo.${path}`] = req.body[path];
      }
    });

    UserModel.updateOne(
      { _id: id },
      {
        $set: fields,
      }
    )
      .then((status) => {
        if (status.nModified == 1) {
          res.status(200).send(status);
        } else {
          res.status(400).send(status);
        }
      })
      .catch((err) => {
        console.error(`Error during user updateOne():\n${err}`);
        return res.status(400).send();
      })
  },

  refreshToken: (req, res) => {
    var refreshToken = req.body.refreshToken;
    if (refreshToken && refreshToken in tokenList) {
      const token = jwt.sign(
        {
          email: req.body.email,
          userId: req.body._id,
        },
        process.env.refreshTokenSecret,
        {
          expiresIn: process.env.tokenLife,
        }
      );

      const response = {
        token: token,
      };

      tokenList[req.body.refreshToken].token = token;
      return res.status(200).json(response);
    } else {
      return res.status(404).send("Invalid request");
    }
  },

  signup: (req, res) => {
    UserModel.find({ email: req.body.email })
      .then((user) => {
        if (user.length > 0) {
          return res.status(409).json({
            message: "Mail exists",
          });
        } else {
          bcrypt.hash(req.body.password, 10, (err, hash) => {
            if (err) {
              return res.status(400).json({
                error: "Invalid request",
              });
            } else {
              const user = new UserModel({
                _id: new mongoose.Types.ObjectId(),
                email: req.body.email,
                password: hash,
              });
              user
                .save()
                .then(() => {
                  return res.status(201).json(generateToken(user));
                })
                .catch((err) => {
                  console.error(`Error during user save():\n${err}`);
                  return res.status(500).json({
                    error: "Invalid credentials",
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

    BioSchema.eachPath((path) => {
      if (req.body[path]) {
        fields[`bio.${path}`] = req.body[path];
      }
    });

    // TODO Validation
    UserModel.updateOne(
      { _id: id },
      {
        $set: fields,
      }
    )
      .then((status) => {
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
      .catch((err) => {
        console.error(`Error during user updateOne():\n${err}`);
        return res.status(400).send();
      })
  },

  updateCurrentCourses: (req, res) => {
    var validCourses = [];

    CourseModel.find({ _id: { $in: req.body.courses } })
      .select("_id")
      .then((courses) => {
        if (courses) {
          validCourses = courses.map((c) => c._id);
        }
      })
      .then(() => {
        UserModel.updateOne({ _id: req.userData.userId }, { $set: { current_courses: validCourses } })
        .then(() => {
          return res.status(204).send();
        })
        .catch((err) => {
          console.error(`Error during user update():\n${err}`);
          return res.status(500).send();
        });
      })
      .catch((err) => {
        console.error(`Error during teacher find():\n${err}`);
        return res.status(500).send();
      })
  },

  updateFavorites: (req, res) => {
    var validTeachers = [];
    var validCourses = [];
    var promises = [];

    if (req.body.teachers) {
      promises.push(
        TeacherModel.find({ _id: { $in: req.body.teachers } })
          .select("_id")
          .then((teachers) => {
            if (teachers) {
              validTeachers = teachers.map((t) => t._id);
            }
          })
          .catch((err) => {
            console.error(`Error during teacher find():\n${err}`);
            return res.status(500).send();
          })
      );
    }

    if (req.body.courses) {
      promises.push(
        CourseModel.find({ _id: { $in: req.body.courses } })
          .select("_id")
          .then((courses) => {
            if (courses) {
              validCourses = courses.map((c) => c._id);
            }
          })
          .catch((err) => {
            console.error(`Error during course find():\n${err}`);
            return res.status(500).send();
          })
      );
    }

    Promise.all(promises).then(() => {
      var set = {};

      if (validCourses.length) {
        set.favorite_subjects = validCourses;
      }

      if (validTeachers.length) {
        set.favorite_teachers = validTeachers;
      }

      UserModel.updateOne({ _id: req.userData.userId }, { $set: set })
        .then(() => {
          return res.status(204).send();
        })
        .catch((err) => {
          console.error(`Error during user update():\n${err}`);
          return res.status(500).send();
        });
    });
  },

  updateGradesList: (req, res) => {
    UserModel.findOne({ _id: req.userData.userId })
      .exec()
      .then((user) => {
        if (!user) {
          res.status(400).send();
          return;
        }
        req.body.courses.forEach((course) => {
          updateGrades(user, course);
        });
        user.save();
        res.status(201).send();
      })
      .catch((err) => {
        console.error(`Error during user findOne():\n${err}`);
        return res.status(500).send();
      })
  },

  updateGradesPDF: (req, res) => {
    var name = req.files.grades.name;
    var index = name.lastIndexOf("."); // TODO no dot?
    var ext = name.substring(index + 1);
    var dt = new Date().getTime();
    var file = dt + "." + ext;
    var filePath = `./files/${file}`;
    req.files.grades.mv(filePath, (err) => {
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
              error: "Invalid file",
            });
            console.log(error);
            return;
          }
          var jsonPath = `./json/${dt}_results.json`;
          var gradesJSON = require(`.${jsonPath}`);
          UserModel.findOne({ _id: req.userData.userId })
            .exec()
            .then((user) => {
              if (!user) {
                res.status(400).send();
                return;
              }
              var promises = [];
              gradesJSON.courses.forEach((course) => {
                if (course.grade) {
                  promises.push(
                    CourseModel.findOne({ "basic_info.code": course.code })
                      .exec()
                      .then((courseData) => {
                        if (courseData) {
                          var updatedCourse = {
                            id: courseData._id,
                            year: course.year,
                            semester: courseData.basic_info.period,
                            grade: course.grade,
                          };

                          updateGrades(user, updatedCourse);
                        }
                      })
                      .catch((err) => {
                        console.error(`Error during course findOne():\n${err}`);
                        return res.status(500).send();
                      })
                  );
                }
              });
              if (promises.length != 0) {
                Promise.all(promises).then(() => user.save());
              }
            })
            .catch((err) => {
              console.error(`Error during user findOne():\n${err}`);
              return res.status(500).send();
            })
          res.status(201).send();
          fs.unlink(filePath, (err) => {
            if (err) {
              console.log(err);
            }
          });
          fs.unlink(jsonPath, (err) => {
            if (err) {
              console.log(err);
            }
          });
        }
      );
    });
  },
};

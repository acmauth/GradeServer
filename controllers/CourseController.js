const CourseModel = require("../models/CourseModel");
const UserModel = require("../models/UserModel");
const request = require("request");

module.exports = {
  check_version: (req, res) => {
    request.get(process.env.flask + "check_version", (error, response) => {
      if (error) {
        return res.status(400).send();
      }
      const version = JSON.parse(response.body).toString();

      if (version !== req.params.version_id) {
        res.redirect(`/course/predict`);
      } else {
        return res.status(200).send();
      }
    });
  },

  info: (req, res) => {
    CourseModel.findOne({ _id: req.params.course_id })
      .then((course) => {
        if (!course) {
          return res.status(404).send();
        }

        course.__v = undefined;
        return res.json(course);
      })
      .catch((err) => {
        console.error(`Error during course findOne():\n${err}`);
        return res.status(500).send();
      });
  },

  list: (req, res) => {
    CourseModel.find()
      .then((courses) => {
        courses.forEach((course) => {
          course.__v = undefined;
        });

        return res.json(courses);
      })
      .catch((err) => {
        console.error(`Error during course findOne():\n${err}`);
        return res.status(500).send();
      });
  },

  predict: (req, res) => {
    var coursesToPredict = [];

    request.get(process.env.flask + "courses", (error, response) => {
      if (error) {
        return res.status(400).send();
      } else {
        const allCourses = JSON.parse(response.body);
        UserModel.findOne({ _id: req.userData.userId })
          .then((user) => {
            const grades = user.grades;
            var passedCourses = [];

            grades.forEach((grade) => {
              passedCourses.push(grade._id);
            });

            allCourses.forEach((course) => {
              if (!passedCourses.includes(course)) {
                coursesToPredict.push(course);
              }
            });
          })
          .then(() => {
            request.post(
              process.env.flask,
              {
                json: {
                  id: req.userData.userId,
                  courses: coursesToPredict,
                },
              },
              (error, response) => {
                if (error) {
                  return res.status(400).send();
                } else {
                  const predictions = response.body;
                  var info = {};
                  var version = "";

                  request.get(
                    process.env.flask + "check_version",
                    (error, response) => {
                      if (error) {
                        return res.status(400).send();
                      }

                      version = JSON.parse(response.body);
                      CourseModel.find({ _id: { $in: coursesToPredict } })
                        .exec()
                        .then((courses) => {
                          info[`version`] = version;

                          courses.forEach((course) => {
                            var distribution = 0;
                            const grade = Math.round(predictions[course._id]);
                            const histogram = course.metrics.histogram;
                            const enrolled = course.metrics.enrolled;

                            for (i = 0; i < grade - 1; i++) {
                              distribution += histogram[i];
                            }

                            distribution = (distribution / enrolled) * 100;

                            info[`${course._id}`] = {
                              name: course.basic_info.name,
                              teachers: course.basic_info.class.teachers,
                              gradePrediction: predictions[course._id],
                              difficulty: course.metrics.difficulty,
                              distribution,
                              histogram,
                              enrolled,
                            };
                          });
                          return res.json(info);
                        })
                        .catch((err) => {
                          console.error(`Error during course find():\n${err}`);
                          res.status(500).send();
                        });
                    }
                  );
                }
              }
            );
          })
          .catch((err) => {
            console.error(`Error during user find():\n${err}`);
            return res.status(500).send();
          });
      }
    });
  },

  suggest: (req, res) => {
    res.json({});
  },
};

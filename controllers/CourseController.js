const CourseModel = require("../models/CourseModel");
const UserModel = require("../models/UserModel");
const request = require("request");

module.exports = {
  check_version: (req, res) => {
    request.get(process.env.flask + "check_version", (error, response) => {
      if (error) {
        return res.status(400).send();
      }
      if (response.version !== req.params.version_id) {
        return this.predict(req, res);
      }
    });
  },

  info: (req, res) => {
    CourseModel.findOne({ _id: req.params.course_id })
      .exec()
      .then((course) => {
        if (!course) {
          res.status(404).send();
          return;
        }
        course.__v = undefined;
        res.json(course);
      })
      .catch();
  },

  list: (req, res) => {
    CourseModel.find()
      .exec()
      .then((courses) => {
        courses.forEach((course) => {
          course.__v = undefined;
        });
        res.json(courses);
      })
      .catch();
  },

  predict: (req, res) => {
    var coursesToPredict = [];

    request.get(process.env.flask + "courses", (error, response) => {
      if (error) {
        return res.status(400).send();
      } else {
        const allCourses = JSON.parse(response.body);
        UserModel.findOne({ _id: req.userData.userId })
          .exec()
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

                  CourseModel.find({ _id: { $in: coursesToPredict } })
                    .exec()
                    .then((courses) => {
                      courses.forEach((course) => {
                        var distribution = 0;
                        const grade = Math.round(predictions[course._id]);
                        const histogram = course.metrics.histogram;
                        const enrolled = course.metrics.enrolled;

                        for (i = 0; i < grade; i++) {
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

                      res.json(info);
                    })
                    .catch((err) => {
                      console.error(`Error during course find():\n${err}`);
                      res.status(500).send();
                    });
                }
              }
            );
          })
          .catch((err) => {
            console.error(`Error during user find():\n${err}`);
            res.status(500).send();
          });
      }
    });
  },

  suggest: (req, res) => {
    res.json({});
  },
};

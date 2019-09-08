const UserModel = require('../models/UserModel');

/* This will be changed to keep the grades and delete the personal 
 * info after some time of the deletion request (give the user time to
 * change his mind) 
*/

module.exports = (req, res) => {
  UserModel.deleteOne({ _id: req.userData.userId })
    .exec()
    .then(result => {
      if (result.deletedCount === 1) {
        res.status(200).json({
          message: 'User deleted'
        });
      } else {
        res.status(404).json({
          message: 'User not found'
        });
      }
    })
    .catch(err => {
      console.log(err);
      res.status(500).json({
        error: err
      });
    });
};

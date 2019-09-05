const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    firstname: String,
    lastname: String,
    email: { type: String, required: true },
    password: { type: String, required: true }
})

module.exports = mongoose.model('user', UserSchema);
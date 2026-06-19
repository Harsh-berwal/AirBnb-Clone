const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  FirstName: { type: String, required: true },
  LastName: { type: String },
  Email: { type: String, required: true, unique: true },
  Password: { type: String, required: true },
  UserType: { type: String, enum: ['guest', 'host'], default: 'guest' },
  favouriteHomes: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Home' 
  }],
 })

 module.exports = mongoose.model("User", userSchema);
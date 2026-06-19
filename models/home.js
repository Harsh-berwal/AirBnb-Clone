const mongoose = require('mongoose');

const homeSchema = new mongoose.Schema({
  homeName: { type: String, required: true },
  price: { type: Number, required: true },
  location: { type: String, required: true },
  rating: { type: Number, required: true },
  photo: { type: String },
  description: { type: String }

 })

//  homeSchema.pre('findOneAndDelete' , async function () {
//   const homeId = this.getQuery()._id;
//   try {
//     await mongoose.model('Favourite').deleteMany({ homeId: homeId });
//   } catch (error) {
//     console.error('Error deleting associated favourites:', error);
//     throw error;
//   }
//  });

 module.exports = mongoose.model("Home", homeSchema);
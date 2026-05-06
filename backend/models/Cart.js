const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema(
{
  userId: String,

  items: [
    {
      medicineId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Medicine",
      },
      quantity: Number,
    },
  ],
},
{ timestamps: true }
);

module.exports = mongoose.model("Cart", cartSchema);
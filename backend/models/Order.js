const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
{
  userId: String,
  medicines: Array,
  total: Number,

  address: String,
  orderType: {
    type: String,
    enum: ["direct", "prescription"],
    default: "direct",
  },
  prescriptionUrl: {
    type: String,
    default: "",
  },

  paymentStatus: {
    type: String,
    default: "Pending",
  },

  deliveryStatus: {
    type: String,
    default: "Processing",
  },
},
{ timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
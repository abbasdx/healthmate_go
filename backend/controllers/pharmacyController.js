const Medicine = require("../models/Medicine");
const Cart = require("../models/Cart");
const Order = require("../models/Order");

const resolveUserId = (req) => req.auth?.id || req.body.userId || req.params.userId;

const toInt = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

// Public: active medicines for pharmacy storefront
exports.getMedicines = async (req, res) => {
  try {
    const { search = "", category } = req.query;
    const query = {
      isActive: true,
      ...(category ? { category: new RegExp(`^${String(category).trim()}$`, "i") } : {}),
      ...(search
        ? {
            $or: [
              { name: { $regex: String(search).trim(), $options: "i" } },
              { brand: { $regex: String(search).trim(), $options: "i" } },
            ],
          }
        : {}),
    };

    const medicines = await Medicine.find(query).sort({ createdAt: -1 });
    return res.ok(medicines, "Medicines fetched");
  } catch (error) {
    return res.serverError("Error fetching medicines", [error.message]);
  }
};

exports.getMedicine = async (req, res) => {
  try {
    const medicine = await Medicine.findOne({ _id: req.params.id, isActive: true });
    if (!medicine) return res.notFound("Medicine not found");
    return res.ok(medicine, "Medicine fetched");
  } catch (error) {
    return res.serverError("Medicine not found", [error.message]);
  }
};

// Cart
exports.addToCart = async (req, res) => {
  try {
    const userId = resolveUserId(req);
    const { medicineId } = req.body;
    const quantity = Math.max(1, toInt(req.body.quantity, 1));

    if (!userId || !medicineId) {
      return res.badRequest("userId and medicineId are required");
    }

    const medicine = await Medicine.findById(medicineId);
    if (!medicine || !medicine.isActive) return res.notFound("Medicine not available");

    let cart = await Cart.findOne({ userId });

    if (!cart) {
      cart = await Cart.create({ userId, items: [{ medicineId, quantity }] });
    } else {
      const existing = cart.items.find((item) => item.medicineId.toString() === String(medicineId));
      if (existing) {
        existing.quantity += quantity;
      } else {
        cart.items.push({ medicineId, quantity });
      }
      await cart.save();
    }

    const hydratedCart = await Cart.findById(cart._id).populate("items.medicineId");
    return res.ok(hydratedCart, "Added to cart");
  } catch (error) {
    return res.serverError("Cart error", [error.message]);
  }
};

exports.getCart = async (req, res) => {
  try {
    const userId = resolveUserId(req);
    if (!userId) return res.badRequest("userId is required");

    const cart = await Cart.findOne({ userId }).populate("items.medicineId");
    return res.ok(cart || { userId, items: [] }, "Cart fetched");
  } catch (error) {
    return res.serverError("Cart fetch failed", [error.message]);
  }
};

exports.removeCartItem = async (req, res) => {
  try {
    const userId = resolveUserId(req);
    const { medicineId } = req.body;

    if (!userId || !medicineId) {
      return res.badRequest("userId and medicineId are required");
    }

    const cart = await Cart.findOne({ userId });
    if (!cart) return res.notFound("Cart not found");

    cart.items = cart.items.filter((item) => item.medicineId.toString() !== String(medicineId));
    await cart.save();

    return res.ok(cart, "Removed from cart");
  } catch (error) {
    return res.serverError("Remove failed", [error.message]);
  }
};

exports.updateCartItemQuantity = async (req, res) => {
  try {
    const userId = resolveUserId(req);
    const { medicineId } = req.body;
    const quantity = toInt(req.body.quantity, 0);

    if (!userId || !medicineId) {
      return res.badRequest("userId and medicineId are required");
    }

    const cart = await Cart.findOne({ userId });
    if (!cart) return res.notFound("Cart not found");

    const item = cart.items.find((entry) => entry.medicineId.toString() === String(medicineId));
    if (!item) return res.notFound("Cart item not found");

    if (quantity <= 0) {
      cart.items = cart.items.filter((entry) => entry.medicineId.toString() !== String(medicineId));
    } else {
      item.quantity = quantity;
    }

    await cart.save();
    const hydratedCart = await Cart.findById(cart._id).populate("items.medicineId");
    return res.ok(hydratedCart, "Cart updated");
  } catch (error) {
    return res.serverError("Cart update failed", [error.message]);
  }
};

// Orders
exports.createOrder = async (req, res) => {
  try {
    const userId = resolveUserId(req);
    const { medicines = [], total, address, orderType = "direct", prescriptionUrl = "" } = req.body;

    if (!userId || !Array.isArray(medicines) || medicines.length === 0 || !address) {
      return res.badRequest("userId, medicines, and address are required");
    }

    const medicineIds = medicines.map((m) => m.medicineId).filter(Boolean);
    const medicineDocs = await Medicine.find({ _id: { $in: medicineIds }, isActive: true });
    const medicineMap = new Map(medicineDocs.map((doc) => [String(doc._id), doc]));

    const normalizedItems = [];
    let computedTotal = 0;

    for (const item of medicines) {
      const medicine = medicineMap.get(String(item.medicineId));
      const quantity = Math.max(1, toInt(item.quantity, 1));

      if (!medicine) return res.badRequest("One or more medicines are unavailable");
      if (medicine.stock < quantity) {
        return res.badRequest(`Insufficient stock for ${medicine.name}`);
      }
      if (medicine.requiresPrescription && !prescriptionUrl && orderType === "prescription") {
        return res.badRequest(`Prescription required for ${medicine.name}`);
      }

      normalizedItems.push({
        medicineId: medicine._id,
        name: medicine.name,
        quantity,
        price: medicine.price,
      });
      computedTotal += medicine.price * quantity;
    }

    // Decrement stock in a controlled loop to keep compatibility with current setup
    for (const item of normalizedItems) {
      await Medicine.findByIdAndUpdate(item.medicineId, { $inc: { stock: -item.quantity } });
    }

    const order = await Order.create({
      userId,
      medicines: normalizedItems,
      total: toInt(total, computedTotal),
      address,
      orderType,
      prescriptionUrl,
    });

    await Cart.deleteOne({ userId });

    return res.created(order, "Order placed");
  } catch (error) {
    return res.serverError("Order failed", [error.message]);
  }
};

exports.getOrders = async (req, res) => {
  try {
    const userId = resolveUserId(req);
    if (!userId) return res.badRequest("userId is required");

    const orders = await Order.find({ userId }).sort({ createdAt: -1 });
    return res.ok(orders, "Orders fetched");
  } catch (error) {
    return res.serverError("Orders fetch failed", [error.message]);
  }
};

exports.uploadPrescription = async (req, res) => {
  try {
    if (!req.file) {
      return res.badRequest("No file uploaded");
    }

    const allowedMimeTypes = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];
    if (!allowedMimeTypes.includes(req.file.mimetype)) {
      return res.badRequest("Only PDF, JPEG, and PNG files are allowed");
    }

    const maxFileSize = 5 * 1024 * 1024; // 5MB
    if (req.file.size > maxFileSize) {
      return res.badRequest("File size must be less than 5MB");
    }

    const userId = resolveUserId(req);
    if (!userId) return res.badRequest("userId is required");

    // Generate unique filename
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const filename = `prescription_${userId}_${timestamp}_${randomSuffix}.${req.file.originalname.split(".").pop()}`;

    // For MVP, store file info (in production, implement cloud storage like S3)
    const fileUrl = `/uploads/prescriptions/${filename}`;

    return res.created(
      { url: fileUrl, filename: req.file.originalname, size: req.file.size },
      "Prescription uploaded successfully"
    );
  } catch (error) {
    return res.serverError("Prescription upload failed", [error.message]);
  }
};

// Admin: Medicine CRUD
exports.adminGetMedicines = async (req, res) => {
  try {
    const { search = "", includeInactive = "true" } = req.query;
    const query = {
      ...(includeInactive === "true" ? {} : { isActive: true }),
      ...(search
        ? {
            $or: [
              { name: { $regex: String(search).trim(), $options: "i" } },
              { brand: { $regex: String(search).trim(), $options: "i" } },
              { category: { $regex: String(search).trim(), $options: "i" } },
            ],
          }
        : {}),
    };

    const medicines = await Medicine.find(query).sort({ createdAt: -1 });
    return res.ok(medicines, "Admin medicines fetched");
  } catch (error) {
    return res.serverError("Failed to fetch medicines", [error.message]);
  }
};

exports.adminCreateMedicine = async (req, res) => {
  try {
    const payload = {
      name: String(req.body.name || "").trim(),
      brand: String(req.body.brand || "").trim(),
      category: String(req.body.category || "").trim(),
      price: toInt(req.body.price),
      oldPrice: toInt(req.body.oldPrice, 0),
      stock: toInt(req.body.stock, 0),
      image: String(req.body.image || "").trim(),
      requiresPrescription: Boolean(req.body.requiresPrescription),
      rating: Number.isFinite(Number(req.body.rating)) ? Number(req.body.rating) : 4.5,
      isActive: req.body.isActive !== false,
    };

    if (!payload.name || !payload.brand || !payload.category) {
      return res.badRequest("name, brand, and category are required");
    }

    const medicine = await Medicine.create(payload);
    return res.created(medicine, "Medicine created");
  } catch (error) {
    return res.serverError("Failed to create medicine", [error.message]);
  }
};

exports.adminUpdateMedicine = async (req, res) => {
  try {
    const allowedFields = [
      "name",
      "brand",
      "category",
      "price",
      "oldPrice",
      "stock",
      "image",
      "requiresPrescription",
      "rating",
      "isActive",
    ];

    const update = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) update[field] = req.body[field];
    }

    if (update.name !== undefined) update.name = String(update.name).trim();
    if (update.brand !== undefined) update.brand = String(update.brand).trim();
    if (update.category !== undefined) update.category = String(update.category).trim();
    if (update.image !== undefined) update.image = String(update.image).trim();

    ["price", "oldPrice", "stock", "rating"].forEach((key) => {
      if (update[key] !== undefined) update[key] = Number(update[key]);
    });

    const medicine = await Medicine.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    });

    if (!medicine) return res.notFound("Medicine not found");
    return res.ok(medicine, "Medicine updated");
  } catch (error) {
    return res.serverError("Failed to update medicine", [error.message]);
  }
};

exports.adminDeleteMedicine = async (req, res) => {
  try {
    const medicine = await Medicine.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!medicine) return res.notFound("Medicine not found");
    return res.ok(medicine, "Medicine archived");
  } catch (error) {
    return res.serverError("Failed to delete medicine", [error.message]);
  }
};

// Admin: Pharmacy order management
exports.adminGetOrders = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    return res.ok(orders, "Pharmacy orders fetched");
  } catch (error) {
    return res.serverError("Failed to fetch pharmacy orders", [error.message]);
  }
};

exports.adminUpdateOrderStatus = async (req, res) => {
  try {
    const { deliveryStatus, paymentStatus } = req.body;
    const update = {};

    if (deliveryStatus) update.deliveryStatus = deliveryStatus;
    if (paymentStatus) update.paymentStatus = paymentStatus;

    if (!Object.keys(update).length) {
      return res.badRequest("deliveryStatus or paymentStatus is required");
    }

    const order = await Order.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!order) return res.notFound("Order not found");

    return res.ok(order, "Order status updated");
  } catch (error) {
    return res.serverError("Failed to update order status", [error.message]);
  }
};

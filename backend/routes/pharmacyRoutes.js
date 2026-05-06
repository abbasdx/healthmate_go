const router = require("express").Router();
const pharmacyController = require("../controllers/pharmacyController");
const { authenticate, requireAdmin, requirePermission } = require("../middleware/auth");
const multer = require("multer");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// Public storefront
router.get("/medicines", pharmacyController.getMedicines);
router.get("/medicines/:id", pharmacyController.getMedicine);

// Patient cart + orders (auth required)
router.post("/cart", authenticate, pharmacyController.addToCart);
router.get("/cart", authenticate, pharmacyController.getCart);
router.put("/cart/item", authenticate, pharmacyController.updateCartItemQuantity);
router.delete("/cart/item", authenticate, pharmacyController.removeCartItem);

router.post("/orders", authenticate, pharmacyController.createOrder);
router.get("/orders", authenticate, pharmacyController.getOrders);
router.post(
  "/upload-prescription",
  authenticate,
  upload.single("file"),
  pharmacyController.uploadPrescription
);

// Admin pharmacy management
router.get(
  "/admin/medicines",
  authenticate,
  requireAdmin,
  requirePermission("pharmacyManagement"),
  pharmacyController.adminGetMedicines
);
router.post(
  "/admin/medicines",
  authenticate,
  requireAdmin,
  requirePermission("pharmacyManagement"),
  pharmacyController.adminCreateMedicine
);
router.put(
  "/admin/medicines/:id",
  authenticate,
  requireAdmin,
  requirePermission("pharmacyManagement"),
  pharmacyController.adminUpdateMedicine
);
router.delete(
  "/admin/medicines/:id",
  authenticate,
  requireAdmin,
  requirePermission("pharmacyManagement"),
  pharmacyController.adminDeleteMedicine
);

router.get(
  "/admin/orders",
  authenticate,
  requireAdmin,
  requirePermission("pharmacyManagement"),
  pharmacyController.adminGetOrders
);
router.put(
  "/admin/orders/:id/status",
  authenticate,
  requireAdmin,
  requirePermission("pharmacyManagement"),
  pharmacyController.adminUpdateOrderStatus
);

module.exports = router;
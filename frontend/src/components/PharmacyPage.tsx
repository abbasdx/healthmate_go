"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Search,
  ShoppingCart,
  Truck,
  ShieldCheck,
  Pill,
  Star,
  Clock3,
  ArrowRight,
  Upload,
  Plus,
  Minus,
  CheckCircle2,
  X,
  FileUp,
} from "lucide-react";
import {
  deleteWithAuth,
  getWithAuth,
  getWithoutAuth,
  postWithAuth,
  putWithAuth,
  uploadFileWithAuth,
} from "@/services/httpService";
import { useAuthStore } from "@/stores/authStore";
import toast from "react-hot-toast";
import { PharmacyMedicine, PharmacyOrder } from "@/lib/types";

const fallbackMedicines: PharmacyMedicine[] = [
  {
    _id: "1",
    name: "Paracetamol 500mg",
    brand: "Crocin",
    price: 49,
    oldPrice: 69,
    category: "Fever",
    rating: 4.8,
    image: "https://images.apollo247.in/pub/media/catalog/product/p/a/par0004.jpg",
    stock: 100,
    requiresPrescription: false,
    isActive: true,
  },
  {
    _id: "2",
    name: "Vitamin C Tablets",
    brand: "HealthKart",
    price: 199,
    oldPrice: 249,
    category: "Immunity",
    rating: 4.7,
    image: "https://m.media-amazon.com/images/I/61L6G4A9P-L._SL1500_.jpg",
    stock: 100,
    requiresPrescription: false,
    isActive: true,
  },
  {
    _id: "3",
    name: "Digene Antacid",
    brand: "Abbott",
    price: 110,
    oldPrice: 145,
    category: "Stomach",
    rating: 4.6,
    image: "https://www.netmeds.com/images/product-v1/600x600/12745/digene_tablet_15s_0.jpg",
    stock: 100,
    requiresPrescription: false,
    isActive: true,
  },
  {
    _id: "4",
    name: "Cough Syrup",
    brand: "Benadryl",
    price: 135,
    oldPrice: 170,
    category: "Cold",
    rating: 4.5,
    image: "https://5.imimg.com/data5/SELLER/Default/2022/8/DM/QX/EG/24591661/benadryl-cough-syrup.jpg",
    stock: 100,
    requiresPrescription: false,
    isActive: true,
  },
];

export default function PharmacyPage() {
  const { isAuthenticated, user } = useAuthStore();
  const isPatient = isAuthenticated && user?.type === "patient";

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [message, setMessage] = useState("");
  const [medicinesData, setMedicinesData] = useState<PharmacyMedicine[]>(fallbackMedicines);
  const [orders, setOrders] = useState<PharmacyOrder[]>([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [address, setAddress] = useState("");
  const [prescriptionUrl, setPrescriptionUrl] = useState("");
  const [prescriptionFile, setPrescriptionFile] = useState<File | null>(null);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [uploadingPrescription, setUploadingPrescription] = useState(false);

  const mapCartFromApi = (cartData: any): Record<string, number> => {
    const items = cartData?.items || [];
    const mapped: Record<string, number> = {};

    for (const item of items) {
      const medicineField = item?.medicineId;
      const medicineId =
        typeof medicineField === "string"
          ? medicineField
          : medicineField?._id;

      if (!medicineId) continue;
      mapped[String(medicineId)] = Number(item.quantity || 0);
    }

    return mapped;
  };

  const fetchMedicines = async () => {
    try {
      const response = await getWithoutAuth<PharmacyMedicine[]>("/pharmacy/medicines");
      if (Array.isArray(response.data) && response.data.length) {
        setMedicinesData(response.data);
      }
    } catch {
      // Keep fallback medicines for resiliency.
    }
  };

  const fetchCart = async () => {
    if (!isPatient) return;
    try {
      const response = await getWithAuth("/pharmacy/cart");
      setCart(mapCartFromApi(response.data));
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch cart");
    }
  };

  const fetchOrders = async () => {
    if (!isPatient) return;
    try {
      const response = await getWithAuth<PharmacyOrder[]>("/pharmacy/orders");
      setOrders(Array.isArray(response.data) ? response.data : []);
    } catch {
      setOrders([]);
    }
  };

  useEffect(() => {
    fetchMedicines();
  }, []);

  useEffect(() => {
    if (isPatient) {
      fetchCart();
      fetchOrders();
      return;
    }

    setCart({});
    setOrders([]);
  }, [isPatient]);

  const categories = ["All", "Fever", "Cold", "Immunity", "Stomach"];

  const filtered = useMemo(() => {
    return medicinesData.filter((item) => {
      const matchSearch =
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.brand.toLowerCase().includes(search.toLowerCase());

      const matchCategory =
        selectedCategory === "All" ||
        item.category.toLowerCase().includes(selectedCategory.toLowerCase());

      return matchSearch && matchCategory;
    });
  }, [search, selectedCategory, medicinesData]);

  const hasSearch = search.trim().length > 0;
  const filteredCount = filtered.length;

  const cartItems = useMemo(() => {
    return medicinesData
      .filter((item) => cart[item._id] > 0)
      .map((item) => ({ ...item, quantity: cart[item._id] || 0 }));
  }, [cart, medicinesData]);

  const cartCount = Object.values(cart).reduce((sum, qty) => sum + qty, 0);

  const cartTotal = cartItems.reduce((sum, item) => sum + item.quantity * item.price, 0);

  const clearSearch = () => setSearch("");

  const addToCart = async (itemId: string) => {
    if (!isPatient) {
      toast.error("Please login as a patient to use cart and checkout");
      return;
    }

    try {
      const response = await postWithAuth("/pharmacy/cart", {
        medicineId: itemId,
        quantity: 1,
      });
      setCart(mapCartFromApi(response.data));
      setMessage("Medicine added to cart");
      setTimeout(() => setMessage(""), 1500);
    } catch (error: any) {
      toast.error(error.message || "Unable to add medicine");
    }
  };

  const updateQty = async (itemId: string, nextQty: number) => {
    if (!isPatient) return;

    try {
      const response =
        nextQty <= 0
          ? await deleteWithAuth("/pharmacy/cart/item", { medicineId: itemId })
          : await putWithAuth("/pharmacy/cart/item", {
              medicineId: itemId,
              quantity: nextQty,
            });

      setCart(mapCartFromApi(response.data));
    } catch (error: any) {
      toast.error(error.message || "Unable to update cart");
    }
  };

  const increaseQty = (itemId: string) => {
    const current = cart[itemId] || 0;
    void updateQty(itemId, current + 1);
  };

  const decreaseQty = (itemId: string) => {
    const current = cart[itemId] || 0;
    void updateQty(itemId, current - 1);
  };

  const handleSearch = () => {
    // Search is already reactive; button keeps expected UI behavior.
  };

  const handleOrderNow = () => {
    document.getElementById("products-section")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleUpload = () => {
    if (!isPatient) {
      toast.error("Login as patient to place prescription orders");
      return;
    }

    setShowCheckout(true);
  };

  const handleViewAll = () => {
    setSelectedCategory("All");
    document.getElementById("products-section")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleOpenCart = () => {
    if (!isPatient) {
      toast.error("Please login as patient to open cart");
      return;
    }

    setShowCheckout(true);
  };

  const handlePrescriptionUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Only PDF, JPEG, and PNG files are allowed");
      return;
    }

    try {
      setUploadingPrescription(true);
      const response = await uploadFileWithAuth<{ url: string }>(
        "/pharmacy/upload-prescription",
        file
      );
      setPrescriptionUrl(response.data.url);
      setPrescriptionFile(file);
      setMessage("Prescription uploaded successfully");
      setTimeout(() => setMessage(""), 1500);
    } catch (error: any) {
      toast.error(error.message || "Failed to upload prescription");
    } finally {
      setUploadingPrescription(false);
    }
  };

  const placeOrder = async () => {
    if (!isPatient) {
      toast.error("Please login as patient to checkout");
      return;
    }

    if (!cartItems.length) {
      toast.error("Your cart is empty");
      return;
    }

    if (!address.trim()) {
      toast.error("Delivery address is required");
      return;
    }

    const hasPrescriptionMedicines = cartItems.some((item) => item.requiresPrescription);
    if (hasPrescriptionMedicines && !prescriptionUrl.trim()) {
      toast.error("Prescription file is required for selected medicines");
      return;
    }

    try {
      setPlacingOrder(true);

      const payload = {
        medicines: cartItems.map((item) => ({
          medicineId: item._id,
          quantity: item.quantity,
        })),
        total: cartTotal,
        address: address.trim(),
        orderType:
          hasPrescriptionMedicines || prescriptionUrl.trim()
            ? "prescription"
            : "direct",
        prescriptionUrl: prescriptionUrl.trim(),
      };

      await postWithAuth("/pharmacy/orders", payload);

      toast.success("Order placed successfully");
      setCart({});
      setAddress("");
      setPrescriptionUrl("");
      setPrescriptionFile(null);
      setShowCheckout(false);

      await Promise.all([fetchOrders(), fetchMedicines()]);
    } catch (error: any) {
      toast.error(error.message || "Unable to place order");
    } finally {
      setPlacingOrder(false);
    }
  };

  const handleHelp = () => {
    toast.success("HealthMate support will assist you shortly.");
  };

  return (
    <section className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-blue-50">
      {/* SUCCESS MESSAGE */}
      {message && (
        <div className="fixed top-5 right-5 z-50 bg-green-600 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2">
          <CheckCircle2 size={18} />
          {message}
        </div>
      )}

      {/* HERO */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-500 text-white">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="px-4 py-2 rounded-full bg-white/15 text-sm">
                Trusted Online Pharmacy
              </span>

              <h1 className="text-5xl md:text-6xl font-bold mt-6 leading-tight">
                Medicines Delivered
                <span className="block text-cyan-200">
                  Fast & Genuine
                </span>
              </h1>

              <p className="mt-6 text-lg text-white/90 max-w-xl">
                Order medicines and healthcare essentials
                with doorstep delivery.
              </p>

              {/* Search */}
              <div className="mt-8 bg-white rounded-2xl p-2 flex shadow-2xl">
                <Search className="text-slate-400 ml-3 mt-3" />

                <input
                  type="text"
                  placeholder="Search medicines..."
                  className="w-full px-4 py-3 outline-none text-slate-800"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />

                {hasSearch && (
                  <button
                    onClick={clearSearch}
                    className="text-slate-400 hover:text-slate-700 px-2"
                    aria-label="Clear search"
                  >
                    <X size={18} />
                  </button>
                )}

                <button
                  onClick={handleSearch}
                  className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-xl"
                >
                  Search
                </button>
              </div>

              {/* CTA */}
              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  onClick={handleOrderNow}
                  className="bg-white text-blue-700 px-6 py-3 rounded-xl font-semibold"
                >
                  Order Now
                </button>

                <button
                  onClick={handleUpload}
                  className="border border-white/30 px-6 py-3 rounded-xl flex items-center gap-2"
                >
                  <Upload size={18} />
                  Upload Prescription
                </button>
              </div>
            </div>

            {/* Hero Features */}
            <div className="grid grid-cols-2 gap-4">
              {[
                "30 Min Delivery",
                "100% Genuine",
                "24/7 Support",
                "Lowest Prices",
              ].map((item) => (
                <div
                  key={item}
                  className="bg-white/10 backdrop-blur-md rounded-3xl p-6 text-center"
                >
                  <p className="font-semibold">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* TRUST */}
      <div className="max-w-7xl mx-auto px-6 -mt-10 relative z-10">
        <div className="grid md:grid-cols-3 gap-5">
          <div className="bg-white rounded-3xl p-6 shadow-lg">
            <Truck className="text-blue-600 mb-3" />
            <h3 className="font-bold">Fast Delivery</h3>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-lg">
            <ShieldCheck className="text-green-600 mb-3" />
            <h3 className="font-bold">100% Genuine</h3>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-lg">
            <Pill className="text-purple-600 mb-3" />
            <h3 className="font-bold">Best Prices</h3>
          </div>
        </div>
      </div>

      {/* CATEGORIES */}
      <div className="max-w-7xl mx-auto px-6 pt-14">
        <div className="flex gap-3 overflow-x-auto pb-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-5 py-3 rounded-full whitespace-nowrap border ${
                selectedCategory === cat
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white border-slate-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* PRODUCTS */}
      <div
        id="products-section"
        className="max-w-7xl mx-auto px-6 py-14"
      >
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-8">
          <h2 className="text-3xl font-bold">
            Popular Medicines
          </h2>

          <p className="text-sm text-slate-500">
            Showing {filteredCount} {filteredCount === 1 ? 'item' : 'items'}
          </p>

          <button
            onClick={handleViewAll}
            className="text-blue-600 flex items-center gap-2"
          >
            View All
            <ArrowRight size={18} />
          </button>
        </div>

        {filtered.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 text-center shadow-md border border-slate-100">
            <Pill className="mx-auto mb-4 text-slate-300" size={40} />
            <h3 className="text-xl font-semibold text-slate-700 mb-2">No medicines match your filters</h3>
            <p className="text-slate-500 mb-6">
              Try a different search term or switch to another category.
            </p>
            <button
              onClick={() => {
                clearSearch();
                setSelectedCategory("All");
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold"
            >
              Reset search
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6">
            {filtered.map((item) => {
              const qty = cart[item._id] || 0;

              return (
                <div
                  key={item._id}
                  className="bg-white rounded-3xl p-5 shadow-md hover:shadow-xl transition"
                >
                  <div className="bg-slate-50 rounded-2xl p-5 h-52 flex items-center justify-center">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="max-h-40 object-contain"
                    />
                  </div>

                  <p className="text-xs text-blue-600 mt-4">
                    {item.category}
                  </p>

                  <h3 className="font-bold text-lg mt-1">
                    {item.name}
                  </h3>

                  <p className="text-sm text-slate-500">
                    {item.brand}
                  </p>

                  <div className="flex items-center gap-1 mt-2 text-amber-500">
                    <Star size={14} fill="currentColor" />
                    {item.rating || 4.5}
                  </div>

                  <div className="flex items-center gap-2 mt-4">
                    <span className="text-2xl font-bold">
                      Rs {item.price}
                    </span>

                    {!!item.oldPrice && <span className="line-through text-slate-400">Rs {item.oldPrice}</span>}
                  </div>

                  {item.requiresPrescription && (
                    <p className="mt-2 text-xs text-orange-600">Prescription required</p>
                  )}

                  {qty === 0 ? (
                    <button
                      onClick={() => addToCart(item._id)}
                      className="mt-5 w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-2xl"
                    >
                      Add to Cart
                    </button>
                  ) : (
                    <div className="mt-5 flex items-center justify-between bg-blue-50 rounded-2xl px-4 py-3">
                      <button
                        onClick={() => decreaseQty(item._id)}
                      >
                        <Minus size={18} />
                      </button>

                      <span className="font-semibold min-w-6 text-center">
                        {qty}
                      </span>
                      <button
                        onClick={() => increaseQty(item._id)}
                      >
                        <Plus size={18} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ORDER HISTORY */}
      <div className="max-w-7xl mx-auto px-6 pb-8">
        <h3 className="text-2xl font-bold mb-4">Your Recent Pharmacy Orders</h3>
        {!isPatient ? (
          <p className="text-slate-600">Login as a patient to view order history and place checkout orders.</p>
        ) : orders.length === 0 ? (
          <p className="text-slate-600">No orders yet. Add medicines to cart and checkout.</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {orders.slice(0, 6).map((order) => (
              <div key={order._id} className="bg-white border rounded-2xl p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">Order #{order._id.slice(-8)}</p>
                  <span className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-700">{order.deliveryStatus}</span>
                </div>
                <p className="text-sm text-slate-600 mt-1">{new Date(order.createdAt).toLocaleString()}</p>
                <p className="text-sm mt-2">Items: {order.medicines?.length || 0}</p>
                <p className="text-sm">Total: Rs {order.total}</p>
                {order.prescriptionUrl && (
                  <a className="text-sm text-blue-600 underline mt-1 inline-block" href={order.prescriptionUrl} target="_blank" rel="noreferrer">
                    View Prescription URL
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* BOTTOM CTA */}
      <div className="max-w-7xl mx-auto px-6 pb-20">
        <div className="rounded-[32px] bg-gradient-to-r from-emerald-500 to-teal-500 text-white p-10 flex flex-col md:flex-row justify-between gap-6">
          <div>
            <h3 className="text-3xl font-bold">
              Upload Prescription
            </h3>
            <p className="mt-2 text-white/90">
              We’ll help you find medicines instantly.
            </p>
          </div>

          <button
            onClick={handleUpload}
            className="bg-white text-emerald-600 px-6 py-4 rounded-2xl font-semibold"
          >
            Open Checkout
          </button>
        </div>
      </div>

      {/* FLOATING CART */}
      <button
        onClick={handleOpenCart}
        className="fixed bottom-5 right-5 sm:bottom-8 sm:right-8 bg-blue-600 text-white px-6 py-4 rounded-full shadow-2xl flex gap-3"
      >
        <ShoppingCart size={20} />
        Cart ({cartCount})
      </button>

      {/* HELP */}
      <button
        onClick={handleHelp}
        className="fixed bottom-24 right-5 sm:bottom-28 sm:right-8 bg-white border shadow-xl px-5 py-3 rounded-full flex gap-2"
      >
        <Clock3 size={18} />
        Need Help?
      </button>

      {/* CHECKOUT MODAL */}
      {showCheckout && (
        <div className="fixed inset-0 z-50 bg-black/40">
          <div className="absolute top-0 right-0 h-full w-full max-w-xl bg-white shadow-2xl p-6 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Checkout</h3>
              <button onClick={() => setShowCheckout(false)}>
                <X size={20} />
              </button>
            </div>

            {!isPatient ? (
              <p className="text-slate-600">Please login as a patient to checkout.</p>
            ) : (
              <>
                <div className="space-y-3 mb-4">
                  {cartItems.length === 0 ? (
                    <p className="text-slate-600">Your cart is empty.</p>
                  ) : (
                    cartItems.map((item) => (
                      <div key={item._id} className="border rounded-xl p-3 flex justify-between gap-3">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-slate-500">Rs {item.price} x {item.quantity}</p>
                          {item.requiresPrescription && (
                            <p className="text-xs text-orange-600 mt-1">Requires prescription</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button className="p-1 border rounded" onClick={() => decreaseQty(item._id)}>
                            <Minus size={14} />
                          </button>
                          <span>{item.quantity}</span>
                          <button className="p-1 border rounded" onClick={() => increaseQty(item._id)}>
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="space-y-3">
                  <textarea
                    className="w-full border rounded-xl p-3 min-h-20"
                    placeholder="Enter full delivery address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />

                  {cartItems.some((item) => item.requiresPrescription) && (
                    <div className="border-2 border-dashed rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <FileUp size={18} className="text-blue-600" />
                        <label className="font-medium text-sm">Upload Prescription (Required)</label>
                      </div>

                      {prescriptionFile ? (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                          <p className="text-sm font-medium text-green-800">✓ {prescriptionFile.name}</p>
                          <button
                            onClick={() => {
                              setPrescriptionFile(null);
                              setPrescriptionUrl("");
                            }}
                            className="text-xs text-red-600 mt-2 underline"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <label className="block">
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={handlePrescriptionUpload}
                            disabled={uploadingPrescription}
                            className="block w-full text-sm cursor-pointer"
                          />
                          <p className="text-xs text-slate-500 mt-2">
                            {uploadingPrescription
                              ? "Uploading..."
                              : "PDF, JPEG, or PNG up to 5MB"}
                          </p>
                        </label>
                      )}
                    </div>
                  )}

                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span>Rs {cartTotal}</span>
                  </div>

                  <button
                    onClick={placeOrder}
                    disabled={placingOrder || cartItems.length === 0}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white py-3 rounded-xl"
                  >
                    {placingOrder ? "Placing order..." : "Place Order"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

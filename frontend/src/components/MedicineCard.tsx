"use client";

export default function MedicineCard({ medicine }: any) {
  return (
    <div className="bg-white rounded-3xl shadow hover:shadow-xl transition p-5">
      <img
        src={medicine.image}
        alt={medicine.name}
        className="w-full h-52 object-contain"
      />

      <p className="text-sm text-blue-600 font-medium mt-4">
        {medicine.category}
      </p>

      <h3 className="font-bold text-lg mt-1">
        {medicine.name}
      </h3>

      <p className="text-slate-500 text-sm">
        {medicine.brand}
      </p>

      <div className="flex items-center justify-between mt-5">
        <span className="text-2xl font-bold text-slate-900">
          ₹{medicine.price}
        </span>

        <button className="bg-blue-600 text-white px-5 py-2 rounded-xl">
          Add
        </button>
      </div>
    </div>
  );
}
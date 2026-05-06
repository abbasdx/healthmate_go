"use client";

import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import {
  Activity,
  Sparkles,
  Loader2,
  AlertTriangle,
  ShieldCheck,
  Stethoscope,
  BadgeAlert,
  ArrowRight,
  Clock3,
  IndianRupee,
} from "lucide-react";
import Header from "./landing/Header";

type DoctorMatch = {
  title: string;
  reason: string;
  urgency: "High" | "Medium" | "Standard";
  feeMax?: number;
};

export default function SymptomChecker() {
  const router = useRouter();

  const [symptoms, setSymptoms] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const [doctorMatch, setDoctorMatch] = useState<DoctorMatch>({
    title: "General Physician",
    reason: "Recommended for routine symptoms and primary consultation.",
    urgency: "Standard",
    feeMax: 1000,
  });

  const suggestions = [
    "Fever & headache",
    "Dry cough",
    "Chest pain",
    "Migraine",
    "Skin rash",
    "Stomach pain",
  ];

  const detectDoctor = (text: string): DoctorMatch => {
    const lower = text.toLowerCase();

    if (
      lower.includes("chest") ||
      lower.includes("heart") ||
      lower.includes("palpitation")
    ) {
      return {
        title: "Cardiologist",
        reason: "Heart-related symptoms may require cardiac specialist review.",
        urgency: "High",
        feeMax: 1500,
      };
    }

    if (
      lower.includes("migraine") ||
      lower.includes("headache") ||
      lower.includes("dizziness")
    ) {
      return {
        title: "Neurologist",
        reason:
          "Recurring headaches or nerve-related symptoms need evaluation.",
        urgency: "Medium",
        feeMax: 1800,
      };
    }

    if (
      lower.includes("rash") ||
      lower.includes("skin") ||
      lower.includes("itching")
    ) {
      return {
        title: "Dermatologist",
        reason: "Skin irritation or rash is best reviewed by a specialist.",
        urgency: "Medium",
        feeMax: 1200,
      };
    }

    if (
      lower.includes("stomach") ||
      lower.includes("acid") ||
      lower.includes("vomit")
    ) {
      return {
        title: "Gastroenterologist",
        reason:
          "Digestive symptoms may require stomach and intestinal care.",
        urgency: "Medium",
        feeMax: 1600,
      };
    }

    if (
      lower.includes("fever") ||
      lower.includes("cough") ||
      lower.includes("cold") ||
      lower.includes("throat")
    ) {
      return {
        title: "General Physician",
        reason: "Cold, fever and infections are ideal for primary care.",
        urgency: "Standard",
        feeMax: 900,
      };
    }

    return {
      title: "General Physician",
      reason: "Recommended for broad symptom screening.",
      urgency: "Standard",
      feeMax: 1000,
    };
  };

  const checkSymptoms = async () => {
    if (!symptoms.trim()) return;

    setLoading(true);
    setResult("");

    try {
      const res = await axios.post(
        "http://localhost:8000/api/ai/symptom-check",
        { symptoms }
      );

      const aiText = res.data.result || "No result found.";
      setResult(aiText);

      const match = detectDoctor(`${symptoms} ${aiText}`);
      setDoctorMatch(match);
    } catch (error) {
      setResult("Unable to analyze symptoms right now.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ NO FILTERS IN QUERY
  const handleBookConsultation = () => {
    router.push("/doctors-list");
  };

  const urgencyColor =
    doctorMatch.urgency === "High"
      ? "bg-red-100 text-red-700"
      : doctorMatch.urgency === "Medium"
      ? "bg-amber-100 text-amber-700"
      : "bg-emerald-100 text-emerald-700";

  return (
    <>
      <Header showDashboardNav={false} />

      <section className="py-20 px-4 bg-gradient-to-b from-slate-50 via-white to-blue-50 min-h-screen">
        <div className="max-w-5xl mx-auto">
          <div className="rounded-[32px] overflow-hidden border border-white bg-white shadow-[0_25px_80px_rgba(15,23,42,0.08)]">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 px-8 py-7 text-white">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
                  <Activity className="w-7 h-7" />
                </div>

                <div>
                  <h2 className="text-2xl font-bold">AI Symptom Checker</h2>
                  <p className="text-sm text-white/90">
                    Find the right doctor instantly
                  </p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="p-8 md:p-10 space-y-8">
              {/* Input */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Describe your symptoms
                </label>

                <textarea
                  rows={5}
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  placeholder="Example: chest pain, fever, migraine, sore throat..."
                  className="w-full rounded-3xl bg-slate-100 px-5 py-4 resize-none outline-none text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-400 transition"
                />
              </div>

              {/* Suggestions */}
              <div className="flex flex-wrap gap-3">
                {suggestions.map((item) => (
                  <button
                    key={item}
                    onClick={() => setSymptoms(item)}
                    className="px-4 py-2 rounded-full border border-slate-200 bg-white text-sm font-medium text-slate-600 hover:border-emerald-400 hover:text-emerald-600 transition"
                  >
                    {item}
                  </button>
                ))}
              </div>

              {/* Analyze */}
              <button
                onClick={checkSymptoms}
                disabled={loading}
                className="w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 text-white py-4 text-lg font-semibold shadow-xl hover:scale-[1.01] transition-all disabled:opacity-60 flex items-center justify-center gap-3"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Analyzing Symptoms...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Analyze Symptoms
                  </>
                )}
              </button>

              {/* Results */}
              {result && (
                <div className="grid md:grid-cols-2 gap-5">
                  {/* AI Analysis */}
                  <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                      <ShieldCheck className="w-5 h-5 text-emerald-600" />
                      <h3 className="font-semibold text-slate-900">
                        AI Analysis
                      </h3>
                    </div>

                    <p className="text-sm text-slate-600 whitespace-pre-line leading-7">
                      {result}
                    </p>
                  </div>

                  {/* Doctor Card */}
                  <div className="rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                      <Stethoscope className="w-5 h-5 text-blue-600" />
                      <h3 className="font-semibold text-slate-900">
                        Recommended Doctor
                      </h3>
                    </div>

                    <div className="text-3xl font-bold text-slate-900 mb-3">
                      {doctorMatch.title}
                    </div>

                    <div
                      className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold mb-4 ${urgencyColor}`}
                    >
                      {doctorMatch.urgency} Priority
                    </div>

                    <p className="text-sm text-slate-600 leading-7 mb-4">
                      {doctorMatch.reason}
                    </p>

                    <div className="space-y-2 mb-5 text-sm text-slate-500">
                      <div className="flex items-center gap-2">
                        <Clock3 className="w-4 h-4" />
                        Avg consult wait: 5–15 mins
                      </div>

                      <div className="flex items-center gap-2">
                        <IndianRupee className="w-4 h-4" />
                        Avg Fee up to ₹{doctorMatch.feeMax}
                      </div>
                    </div>

                    {/* ✅ Goes to doctors list only */}
                    <button
                      onClick={handleBookConsultation}
                      className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-white font-medium hover:bg-blue-700 transition"
                    >
                      Book Consultation
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Warning */}
                  <div className="md:col-span-2 rounded-3xl border border-amber-100 bg-amber-50 p-5 flex gap-3">
                    <BadgeAlert className="w-5 h-5 text-amber-600 mt-0.5" />

                    <div>
                      <h4 className="font-semibold text-amber-800 mb-1">
                        Severity Guidance
                      </h4>

                      <p className="text-sm text-amber-700">
                        If symptoms are severe, worsening, sudden, or unusual,
                        seek urgent medical attention immediately.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="pt-4 border-t border-slate-100 flex gap-2 text-xs text-slate-500 leading-6">
                <AlertTriangle className="w-4 h-4 mt-1 shrink-0" />

                <p>
                  This tool provides informational guidance only and is not a
                  medical diagnosis. Always consult a licensed healthcare
                  professional.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
"use client";

import LandingHero from "../../components/landing/LandingHero";
import SymptomChecker from "../../components/SymptomChecker";

export default function HomePage() {
  return (
    <main className="overflow-hidden">
      {/* HERO SECTION
      <LandingHero /> */}

      {/* PREMIUM SYMPTOM CHECKER */}
      <section className="py-16 md:py-20 px-4 bg-gradient-to-b from-white via-slate-50 to-blue-50">
        <div className="max-w-7xl mx-auto">
          <SymptomChecker />
        </div>
      </section>
    </main>
  );
}
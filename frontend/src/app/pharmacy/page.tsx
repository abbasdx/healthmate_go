"use client";

import PharmacyPage from "@/components/PharmacyPage";
import Header from "@/components/landing/Header";

export default function Page() {
  return (
    <div>
      <Header showDashboardNav={false} />
      <PharmacyPage />
    </div>
  );
}
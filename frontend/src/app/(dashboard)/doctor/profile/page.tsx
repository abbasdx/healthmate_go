import React from "react";
import { Metadata } from "next";
import ProfilePage from "@/components/ProfilePage/Profile";

export const metadata: Metadata = {
  title: "Doctor Profile | HealthMate",
  description: "View and manage your doctor profile in HealthMate platform.",
};
export default function Page() {
  return <ProfilePage userType="doctor" />;
}

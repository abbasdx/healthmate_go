import React from "react";
import { Metadata } from "next";
import ProfilePage from "@/components/ProfilePage/Profile";

export const metadata: Metadata = {
  title: "Patient Profile | HealthMate",
  description: "View and manage your patient profile in HealthMate platform.",
};


// Default export with `userType` passed as prop
export default function Page() {
  return <ProfilePage userType="patient" />;
}

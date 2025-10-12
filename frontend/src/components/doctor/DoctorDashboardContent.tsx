// src/app/(dashboard)/doctor/dashboard/page.tsx
"use client";
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Calendar,
  Clock,
  Users,
  Video,
  Phone,
  Activity,
  DollarSign,
  ChevronRight,
  TrendingUp,
  MapPin,
  Star,
  Plus,
} from "lucide-react";
import Link from "next/link";
import Header from "@/components/landing/Header";
import { useAuthStore } from "@/stores/authStore";
import { useDoctorStore } from "@/stores/doctorStore";
import { getStatusColor } from "@/lib/constant";
import { useSearchParams } from "next/navigation";
import { useAppointmentStore } from "@/stores/appointmentStore";
import PrescriptionModal from "@/components/doctor/PrescriptionModal";

const DoctorDashboardContent = () => {
  const searchParams = useSearchParams();
  const { user } = useAuthStore();
  const {
    dashboard: dashboardData,
    fetchDashboard,
    loading,
  } = useDoctorStore();
  //  Modal state
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [completingAppointmentId, setCompletingAppointmentId] = useState<
    string | null
  >(null);
  const [modalLoading, setModalLoading] = useState(false);
  const { endConsultation, fetchAppointmentById, currentAppointment } =
    useAppointmentStore();

  useEffect(() => {
    if (user?.type) {
      fetchDashboard(user.type);
    }
  }, [user, fetchDashboard]);

  // Check for completed call parameter
  useEffect(() => {
    const completedCallId = searchParams.get("completedCall");
    if (completedCallId) {
      // Fetch appointment details and show modal
      setCompletingAppointmentId(completedCallId);
      fetchAppointmentById(completedCallId);
      setShowPrescriptionModal(true);
    }
  }, [searchParams, fetchAppointmentById]);

  // Handle prescription save
  const handleSavePrescription = async (
    prescription: string,
    notes: string
  ) => {
    if (!completingAppointmentId) return;

    setModalLoading(true);
    try {
      await endConsultation(completingAppointmentId, prescription, notes);
      setShowPrescriptionModal(false);
      setCompletingAppointmentId(null);

      // Refresh dashboard data
      if (user?.type) {
        fetchDashboard(user.type);
      }

      const url = new URL(window.location.href);
      url.searchParams.delete("completedCall");
      window.history.replaceState({}, "", url.pathname);
    } catch (error) {
      console.error("Failed to complete consultation:", error);
      // Show error message (optional)
      // toast.error('Failed to complete consultation');
    } finally {
      setModalLoading(false);
    }
  };

  // ✅ Handle modal close
  const handleCloseModal = () => {
    setShowPrescriptionModal(false);
    setCompletingAppointmentId(null);

    // Clean up URL parameter
    const url = new URL(window.location.href);
    url.searchParams.delete("completedCall");
    window.history.replaceState({}, "", url.pathname);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  console.log(dashboardData);

  const canJoinCall = (appointment: any) => {
    const appointmentTime = new Date(appointment.slotStartIso);
    const now = new Date();
    const diffMinutes =
      (appointmentTime.getTime() - now.getTime()) / (1000 * 60);

    return (
      diffMinutes <= 15 && // not earlier than 15 min before start
      diffMinutes >= -120 && // not later than 2 hours after start
      (appointment.status === "Scheduled" ||
        appointment.status === "In Progress")
    );
  };

  if (loading || !dashboardData) {
    return (
      <>
        <Header showDashboardNav={true} />
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 pt-16">
          <div className="container mx-auto px-4 py-8">
            <div className="animate-pulse space-y-8">
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 bg-gray-300 rounded-full"></div>
                <div className="space-y-2">
                  <div className="h-8 bg-gray-300 rounded w-64"></div>
                  <div className="h-4 bg-gray-300 rounded w-48"></div>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-32 bg-gray-300 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Get patient name for modal
  const patientName = currentAppointment?.patientId?.name || "Patient";

  // Safe access with optional chaining and fallbacks
  const statsCards = [
    {
      title: "Total Patients",
      value: dashboardData?.stats?.totalPatients?.toString() || "0",
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      change: "+12%",
      changeColor: "text-green-600",
    },
    {
      title: "Today's Appointments",
      value: dashboardData?.stats?.todayAppointments?.toString() || "0",
      icon: Calendar,
      color: "text-green-600",
      bgColor: "bg-green-50",
      change: "+8%",
      changeColor: "text-green-600",
    },
    {
      title: "Total Revenue",
      value: `₹${dashboardData?.stats?.totalRevenue?.toLocaleString() || "0"}`,
      icon: DollarSign,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      change: "+25%",
      changeColor: "text-green-600",
    },
    {
      title: "Completed",
      value: dashboardData?.stats?.completedAppointments?.toString() || "0",
      icon: Activity,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      change: "+18%",
      changeColor: "text-green-600",
    },
  ];

  return (
    <>
      <Header showDashboardNav={true} />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 pt-16">
        <div className="container mx-auto px-4 py-8">
          {/* Welcome Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Avatar className="w-20 h-20 ring-4 ring-blue-100">
                  <AvatarImage
                    src={dashboardData?.user?.profileImage}
                    alt={dashboardData?.user?.name}
                  />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white text-2xl font-bold">
                    {dashboardData?.user?.name?.charAt(0)?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-md md:text-3xl font-bold text-gray-900">
                    Good evening, {dashboardData?.user?.name}!
                  </h1>
                  <p className="text-gray-600 text-xs md:text-lg">
                    {dashboardData?.user?.specialization || "Specialist"}
                  </p>
                  <div className="flex items-center space-x-4 mt-2">
                    <div className="flex items-center space-x-1 text-sm text-gray-500">
                      <MapPin className="w-4 h-4" />
                      <span>
                        {dashboardData?.user?.hospitalInfo?.name || "Hospital"},{" "}
                        {dashboardData?.user?.hospitalInfo?.city || "City"}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-semibold text-gray-700">
                        {dashboardData?.stats?.averageRating || "4.8"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="hidden md:flex  items-center space-x-3">
                <Link href="/doctor/profile">
                  <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800">
                    <Plus className="w-4 h-4 mr-2" />
                    Update Availability
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {statsCards.map((stat, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">
                        {stat.title}
                      </p>
                      <p className="text-3xl font-bold text-gray-900">
                        {stat.value}
                      </p>
                      <div className="flex items-center mt-2">
                        <TrendingUp className="w-3 h-3 text-green-600 mr-1" />
                        <span
                          className={`text-sm font-medium ${stat.changeColor}`}
                        >
                          {stat.change} from last week
                        </span>
                      </div>
                    </div>
                    <div
                      className={`w-14 h-14 ${stat.bgColor} rounded-xl flex items-center justify-center`}
                    >
                      <stat.icon className={`w-7 h-7 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Today's Schedule */}
            <Card className="lg:col-span-2 hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <span>Today's Schedule</span>
                  <Badge variant="secondary" className="ml-2">
                    {dashboardData?.todayAppointments?.length || 0} appointments
                  </Badge>
                </CardTitle>
                <Link href="/doctor/appointments">
                  <Button variant="ghost" size="sm">
                    View All <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="space-y-4">
                {dashboardData?.todayAppointments?.length > 0 ? (
                  dashboardData.todayAppointments.map((appointment: any) => (
                    <div
                      key={appointment._id}
                      className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg">
                        <Clock className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-gray-900">
                            {appointment.patientId?.name || "Patient"}
                          </h4>
                          <div className="text-sm font-medium text-blue-600">
                            {formatDate(appointment.slotStartIso)}
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-1">
                          Age: {appointment.patientId?.age || "N/A"}
                        </p>
                        <p className="text-xs text-gray-500">
                          {appointment.symptoms?.substring(0, 80)}...
                        </p>
                        <div className="flex items-center space-x-4 mt-2">
                          <Badge
                            className={getStatusColor(appointment.status)}
                            variant="secondary"
                          >
                            {appointment.status}
                          </Badge>
                          <div className="flex items-center space-x-1">
                            {appointment.consultationType ===
                            "Video Consultation" ? (
                              <Video className="w-4 h-4 text-blue-600" />
                            ) : (
                              <Phone className="w-4 h-4 text-green-600" />
                            )}
                            <span className="text-sm text-gray-500">
                              ₹{appointment.doctorId.fees}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        {canJoinCall(appointment) && (
                          <Link href={`/call/${appointment._id}`}>
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Video className="w-4 h-4 mr-2" />
                              Start
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      No appointments today
                    </h3>
                    <p className="text-gray-600">Enjoy your free day!</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Upcoming Appointments & Performance */}
            <div className="space-y-6">
              {/* Upcoming Appointments */}
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <Clock className="w-5 h-5 text-green-600" />
                    <span>Upcoming</span>
                  </CardTitle>
                  <Link href="/doctor/appointments">
                    <Button variant="ghost" size="sm">
                      View All <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                </CardHeader>
                <CardContent className="space-y-4">
                  {dashboardData?.upcomingAppointments?.length > 0 ? (
                    dashboardData.upcomingAppointments.map(
                      (appointment: any) => (
                        <div
                          key={appointment._id}
                          className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <Avatar className="w-10 h-10">
                            <AvatarImage
                              src={appointment.patientId?.profileImage}
                              alt={appointment.patientId?.name}
                            />
                            <AvatarFallback className="bg-green-100 text-green-600 text-sm">
                              {appointment.patientId?.name?.charAt(0) || "P"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm text-gray-900 truncate">
                              {appointment.patientId?.name || "Patient"}
                            </h4>
                            <p className="text-xs text-gray-500">
                              {new Date(
                                appointment.slotStartIso
                              ).toLocaleDateString()}
                            </p>
                            <div className="flex items-center space-x-1 mt-1">
                              {appointment.consultationType ===
                              "Video Consultation" ? (
                                <Video className="w-3 h-3 text-blue-600" />
                              ) : (
                                <Phone className="w-3 h-3 text-green-600" />
                              )}
                              <span className="text-xs text-gray-500">
                                ₹{appointment.doctorId.fees}
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    )
                  ) : (
                    <div className="text-center py-8">
                      <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 text-sm">
                        No upcoming appointments
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Performance Card */}
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                    <span>Performance</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      Patient Satisfaction
                    </span>
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-semibold">
                        {dashboardData?.performance?.patientSatisfaction ||
                          "4.8"}
                        /5
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      Completion Rate
                    </span>
                    <span className="font-semibold text-green-600">
                      {dashboardData?.performance?.completionRate || "98"}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Response Time</span>
                    <span className="font-semibold text-blue-600">
                      {dashboardData?.performance?.responseTime || "< 2min"}
                    </span>
                  </div>
                  <div className="pt-3 border-t">
                    <Link href="/doctor/analytics">
                      <Button variant="outline" size="sm" className="w-full">
                        View Full Analytics
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <PrescriptionModal
        isOpen={showPrescriptionModal}
        onClose={handleCloseModal}
        onSave={handleSavePrescription}
        patientName={patientName}
        loading={modalLoading}
      />
    </>
  );
};

export default DoctorDashboardContent;

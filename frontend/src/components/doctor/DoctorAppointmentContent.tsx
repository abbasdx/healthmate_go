"use client";
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar,
  Clock,
  Video,
  Phone,
  FileText,
  Stethoscope,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/stores/authStore";
import { useAppointmentStore } from "@/stores/appointmentStore";
import Header from "@/components/landing/Header";
import { emptyStates, getStatusColor } from "@/lib/constant";
import PrescriptionViewModal from "@/components/doctor/PrescriptionViewModal";

const DoctorAppointmentContent = () => {
  const { user } = useAuthStore();
  const { appointments, fetchAppointments, updateAppointmentStatus, loading } =
    useAppointmentStore();
  const [activeTab, setActiveTab] = useState("upcoming");
  const [tabCounts, setTabCounts] = useState({
    upcoming: 0,
    past: 0,
  });

  // Fetch appointments when component mounts or tab changes
  useEffect(() => {
    if (user?.type === "doctor") {
      fetchAppointments("doctor", activeTab);
    }
  }, [user, activeTab, fetchAppointments]);

  // Update tab counts whenever appointments change
  useEffect(() => {
    const now = new Date();

    // Filter for upcoming appointments
    const upcomingAppointments = appointments.filter((apt) => {
      const aptDate = new Date(apt.slotStartIso);
      return (
        (aptDate >= now || apt.status === "In Progress") &&
        (apt.status === "Scheduled" || apt.status === "In Progress")
      );
    });

    // Filter for past appointments
    const pastAppointments = appointments.filter((apt) => {
      const aptDate = new Date(apt.slotStartIso);
      return (
        aptDate < now ||
        apt.status === "Completed" ||
        apt.status === "Cancelled"
      );
    });

    setTabCounts({
      upcoming: upcomingAppointments.length,
      past: pastAppointments.length,
    });
  }, [appointments]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isToday = (dateString: string) => {
    const today = new Date();
    const appointmentDate = new Date(dateString);
    return appointmentDate.toDateString() === today.toDateString();
  };

  const canJoinCall = (appointment: any) => {
    const appointmentTime = new Date(appointment.slotStartIso);
    const now = new Date();
    const diffMinutes =
      (appointmentTime.getTime() - now.getTime()) / (1000 * 60);

    // Can join 15 minutes before and up to 2 hours after
    return (
      isToday(appointment.slotStartIso) &&
      diffMinutes <= 15 && // not earlier than 15 min before start
      diffMinutes >= -120 && // not later than 2 hours after start
      (appointment.status === "Scheduled" ||
        appointment.status === "In Progress")
    );
  };

  const canMarkCancelled = (appointment: any) => {
    const appointmentTime = new Date(appointment.slotStartIso);
    const now = new Date();

    // Can mark as cancelled if it's scheduled and appointment time has passed
    return appointment.status === "Scheduled" && now > appointmentTime;
  };

  const handleMarkCancelled = async (appointmentId: string) => {
    if (
      confirm("Are you sure you want to mark this appointment as cancelled?")
    ) {
      try {
        await updateAppointmentStatus(appointmentId, "Cancelled");
        // Refresh the current tab
        if (user?.type === "doctor") {
          fetchAppointments("doctor", activeTab);
        }
      } catch (error) {
        console.error("Failed to cancel appointment:", error);
      }
    }
  };

  if (!user) return null;

  const AppointmentCard = ({ appointment }: { appointment: any }) => (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex flex-col items-center md:flex-row md:items-start md:space-x-6">
          {/* Avatar */}
          <div className="flex-shrink-0 flex justify-center md:justify-start">
            <Avatar className="w-20 h-20">
              <AvatarImage
                src={appointment.patientId?.profileImage}
                alt={appointment.patientId?.name}
              />
              <AvatarFallback className="bg-green-100 text-green-600 text-lg font-semibold">
                {appointment.patientId?.name?.charAt(0) || "P"}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Details */}
          <div className="mt-4 md:mt-0 flex-1 w-full text-center md:text-left">
            <div className="flex flex-col md:flex-row md:justify-between md:items-start">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {appointment.patientId?.name || "Unknown Patient"}
                </h3>
                <p className="text-gray-600">
                  Age: {appointment.patientId?.age || "N/A"}
                </p>
                <p className="text-sm text-gray-500">
                  {appointment.patientId?.email}
                </p>
              </div>

              <div className="mt-2 md:mt-0 text-center md:text-right">
                <Badge className={getStatusColor(appointment.status)}>
                  {appointment.status}
                </Badge>
                {isToday(appointment.slotStartIso) && (
                  <div className="text-xs text-blue-600 font-semibold mt-1">
                    TODAY
                  </div>
                )}
              </div>
            </div>

            {/* Consultation Info */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-center md:justify-start space-x-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(appointment.slotStartIso)}</span>
                </div>
                <div className="flex items-center justify-center md:justify-start space-x-2 text-sm text-gray-600">
                  {appointment.consultationType === "Video Consultation" ? (
                    <Video className="w-4 h-4" />
                  ) : (
                    <Phone className="w-4 h-4" />
                  )}
                  <span>{appointment.consultationType}</span>
                </div>
              </div>

              <div className="text-center md:text-left">
                <div className="text-sm text-gray-600">
                  <span className="font-semibold">Fee:</span> ₹
                  {appointment.doctorId.fees}
                </div>
                {appointment.symptoms && (
                  <div className="text-sm text-gray-600 mt-1">
                    <span className="font-semibold">Chief Complaint:</span>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                      {appointment.symptoms}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex flex-col md:flex-row items-center md:justify-between space-y-3 md:space-y-0">
              <div className="flex space-x-2">
                {canJoinCall(appointment) && (
                  <Link href={`/call/${appointment._id}`}>
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Video className="w-4 h-4 mr-2" />
                      Start Consultation
                    </Button>
                  </Link>
                )}
              </div>

              <div className="flex space-x-2">
                {canMarkCancelled(appointment) && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleMarkCancelled(appointment._id)}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Mark Cancelled
                  </Button>
                )}

                {appointment.status === "Completed" &&
                  appointment.prescription && (
                    <PrescriptionViewModal
                      appointment={appointment}
                      userType="doctor"
                      trigger={
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-green-700 border-green-200 hover:bg-green-50"
                        >
                          <Stethoscope className="w-4 h-4 mr-2" />
                          View Report
                        </Button>
                      }
                    />
                  )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const EmptyState = ({ tab }: { tab: string }) => {
    const state = emptyStates[tab as keyof typeof emptyStates];
    const Icon = state.icon;

    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Icon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {state.title}
          </h3>
          <p className="text-gray-600">{state.description}</p>
        </CardContent>
      </Card>
    );
  };

  return (
    <>
      <Header showDashboardNav={true} />
      <div className="min-h-screen bg-gray-50 pt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-md md:text-3xl  font-bold text-gray-900">
                My Appointments
              </h1>
              <p className="text-xs md:text-lg text-gray-600">
                Manage your patient consultations
              </p>
            </div>

            <div className="hidden md:flex items-center space-x-4">
              <Link href="/doctor/profile">
                <Button>
                  <Calendar className="w-4 h-4 mr-2" />
                  Update Availability
                </Button>
              </Link>
            </div>
          </div>

          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="space-y-6"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger
                value="upcoming"
                className="flex items-center space-x-2"
              >
                <Clock className="w-4 h-4" />
                <span>Upcoming ({tabCounts.upcoming})</span>
              </TabsTrigger>
              <TabsTrigger value="past" className="flex items-center space-x-2">
                <FileText className="w-4 h-4" />
                <span>Past ({tabCounts.past})</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming" className="space-y-4">
              {loading ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {[...Array(4)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <CardContent className="p-6">
                        <div className="flex space-x-4">
                          <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : appointments.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {appointments.map((appointment) => (
                    <AppointmentCard
                      key={appointment._id}
                      appointment={appointment}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState tab="upcoming" />
              )}
            </TabsContent>

            <TabsContent value="past" className="space-y-4">
              {loading ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {[...Array(4)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <CardContent className="p-6">
                        <div className="flex space-x-4">
                          <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : appointments.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {appointments.map((appointment) => (
                    <AppointmentCard
                      key={appointment._id}
                      appointment={appointment}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState tab="completed" />
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
};

export default DoctorAppointmentContent;

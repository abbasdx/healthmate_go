// src/app/(dashboard)/patient/booking/[doctorId]/page.tsx
"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useDoctorStore } from "@/stores/doctorStore";
import { useAppointmentStore } from "@/stores/appointmentStore";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { toLocalYMD } from "@/lib/dateUtils";
import DoctorProfile from "@/components/BookingStep/DoctorProfile";
import CalendarStep from "@/components/BookingStep/CalendarStep";
import ConsultationStep from "@/components/BookingStep/ConsultationStep";
import PaymentStep from "@/components/BookingStep/PaymentStep";
import { convertTo24Hour, minutesToTime } from "@/lib/constant";

const BookingPage = () => {
  const params = useParams();
  const router = useRouter();
  const doctorId = params.doctorId as string;

  const { currentDoctor, fetchDoctorById } = useDoctorStore();
  const { bookAppointment, loading, fetchBookedSlots, bookedSlots } =
    useAppointmentStore();

  // State
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedSlot, setSelectedSlot] = useState("");
  const [consultationType, setConsultationType] =
    useState("Video Consultation");
  const [symptoms, setSymptoms] = useState("");
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [createdAppointmentId, setCreatedAppointmentId] = useState<string | null>(null);
  const [patientName, setPatientName] = useState<string>('');

  // Fetch doctor data
  useEffect(() => {
    if (doctorId) {
      fetchDoctorById(doctorId);
    }
  }, [doctorId, fetchDoctorById]);

  useEffect(() => {
    if (selectedDate && doctorId) {
      const dateString = toLocalYMD(selectedDate);
      fetchBookedSlots(doctorId, dateString);
    }
  }, [selectedDate, doctorId, fetchBookedSlots]);

  // Generate available dates
  useEffect(() => {
    if (currentDoctor?.availabilityRange) {
      const startDate = new Date(currentDoctor.availabilityRange.startDate);
      // Convert doctor's start date string into a Date object

      const endDate = new Date(currentDoctor.availabilityRange.endDate);
      // Convert doctor's end date string into a Date object

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      // Get today's date and reset time to midnight (ignore hours/mins)

      const dates: string[] = [];
      // Empty list to hold available dates

      const iterationStart = new Date(
        Math.max(today.getTime(), startDate.getTime())
      );
      // Start from whichever is later: today OR doctor's availability start date

      for (
        let d = new Date(iterationStart);
        d <= endDate && dates.length < 90;
        d.setDate(d.getDate() + 1)
      ) {
        // Loop from start date up to end date (max 90 days)
        dates.push(toLocalYMD(d));
        // Convert date into YYYY-MM-DD format and add to list
      }

      setAvailableDates(dates);
    }
  }, [currentDoctor]);

  // Generate available slots
  useEffect(() => {
    if (selectedDate && currentDoctor?.dailyTimeRanges) {
      const slots: string[] = [];
      // Empty list to hold available slots

      const slotDuration = currentDoctor.slotDurationMinutes || 30;
      // Use doctor's slot duration, default 30 mins if not provided

      currentDoctor.dailyTimeRanges.forEach((timeRange: any) => {
        const startMinutes = timeToMinutes(timeRange.start);
        // Convert start time (e.g., "09:00") → total minutes (e.g., 540)

        const endMinutes = timeToMinutes(timeRange.end);
        // Convert end time (e.g., "12:00") → total minutes (e.g., 720)

        for (
          let minutes = startMinutes;
          minutes < endMinutes;
          minutes += slotDuration
        ) {
          // Loop through from start to end in steps of slot duration
          slots.push(minutesToTime(minutes));
          // Convert minutes back to "HH:mm" format and add to slots
        }
      });

      setAvailableSlots(slots);
    }
  }, [selectedDate, currentDoctor]);

  const timeToMinutes = (timeStr: string): number => {
    const [hours, minutes] = timeStr.split(":").map(Number);
    return hours * 60 + minutes;
  };

  const handleBooking = async () => {
    if (!selectedDate || !selectedSlot || !symptoms.trim()) {
      alert("Please complete all required fields");
      return;
    }

    setIsPaymentProcessing(true);

    try {
      const dateString = toLocalYMD(selectedDate);
      const slotStart = new Date(
        `${dateString}T${convertTo24Hour(selectedSlot)}`
      );
      const slotEnd = new Date(
        slotStart.getTime() + (currentDoctor!.slotDurationMinutes || 30) * 60000
      );

      const consultationFees = getConsultationPrice();
      const platformFees = Math.round(consultationFees * 0.1); // 10% platform fee
      const totalAmount = consultationFees + platformFees;

      // Create appointment first
      const appointment = await bookAppointment({
        doctorId: doctorId,
        slotStartIso: slotStart.toISOString(),
        slotEndIso: slotEnd.toISOString(),
        consultationType,
        symptoms,
        date: dateString,
        consultationFees,
        platformFees,
        totalAmount,
      });

      // Store appointment ID and patient name for payment modal
      if (appointment && appointment._id) {
        setCreatedAppointmentId(appointment._id);
        setPatientName(appointment.patientId?.name || 'Patient');
        // Payment modal will be triggered automatically by PaymentStep component
      } else {
        // Fallback: simulate payment processing if no appointment created
        await new Promise((resolve) => setTimeout(resolve, 3000));
        router.push("/patient/dashboard");
      }
    } catch (error: any) {
      console.error('Booking error:', error);
      alert('Failed to create appointment. Please try again.');
    } finally {
      setIsPaymentProcessing(false);
    }
  };

  const handlePaymentSuccess = (appointment: any) => {
    // Payment was successful, redirect to dashboard
    router.push("/patient/dashboard");
  };

  const getConsultationPrice = (): number => {
    const basePrice = currentDoctor?.fees || 0;
    const typePrice = consultationType === "Voice Call" ? -100 : 0;
    return Math.max(0, basePrice + typePrice);
  };

  if (!currentDoctor) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading doctor information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 ">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/doctors-list">
                <Button variant="ghost" size="sm" className="text-gray-600">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Doctors
                </Button>
              </Link>
              <div className="h-6 w-px bg-gray-300"></div>
              <div>
                <h1 className="text-sm md:text-2xl font-bold text-gray-900">
                  Book Appointment
                </h1>
                <p className="text-xs md:text-sm text-gray-600">
                  with {currentDoctor.name}
                </p>
              </div>
            </div>

            {/* Progress Indicator */}
            <div className="hidden md:flex items-center space-x-4">
              {[1, 2, 3].map((step) => (
                <React.Fragment key={step}>
                  <div
                    className={`flex items-center space-x-2 ${
                      currentStep >= step ? "text-blue-600" : "text-gray-400"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full border-2 ${
                        currentStep >= step
                          ? "bg-blue-600 border-blue-600"
                          : "border-gray-300"
                      } flex items-center justify-center`}
                    >
                      {currentStep > step ? (
                        <Check className="w-4 h-4 text-white" />
                      ) : (
                        <span className="text-sm font-semibold text-white">
                          {step}
                        </span>
                      )}
                    </div>
                    <span className="text-sm font-medium">
                      {step === 1
                        ? "Select Time"
                        : step === 2
                        ? "Details"
                        : "Payment"}
                    </span>
                  </div>
                  {step < 3 && <div className="w-12 h-px bg-gray-300"></div>}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Doctor Profile */}
          <div className="lg:col-span-1">
            <DoctorProfile doctor={currentDoctor} />
          </div>

          {/* Booking Steps */}
          <div className="lg:col-span-2">
            <Card className="shadow-lg border-0">
              <CardContent className="p-8">
                <AnimatePresence mode="wait">
                  {currentStep === 1 && (
                    <motion.div
                      key="step1"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                    >
                      <CalendarStep
                        selectedDate={selectedDate}
                        setSelectedDate={setSelectedDate}
                        selectedSlot={selectedSlot}
                        setSelectedSlot={setSelectedSlot}
                        availableDates={availableDates}
                        availableSlots={availableSlots}
                        excludedWeekdays={
                          currentDoctor?.availabilityRange?.excludedWeekdays ||
                          []
                        }
                        bookedSlots={bookedSlots}
                        onContinue={() => setCurrentStep(2)}
                      />
                    </motion.div>
                  )}

                  {currentStep === 2 && (
                    <motion.div
                      key="step2"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                    >
                      <ConsultationStep
                        consultationType={consultationType}
                        setConsultationType={setConsultationType}
                        symptoms={symptoms}
                        setSymptoms={setSymptoms}
                        doctorFees={currentDoctor.fees}
                        onBack={() => setCurrentStep(1)}
                        onContinue={() => setCurrentStep(3)}
                      />
                    </motion.div>
                  )}

                  {currentStep === 3 && (
                    <motion.div
                      key="step3"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                    >
                      <PaymentStep
                        selectedDate={selectedDate!}
                        selectedSlot={selectedSlot}
                        consultationType={consultationType}
                        doctorName={currentDoctor.name}
                        slotDuration={currentDoctor.slotDurationMinutes}
                        consultationFee={getConsultationPrice()}
                        isProcessing={isPaymentProcessing}
                        onBack={() => setCurrentStep(2)}
                        onConfirm={handleBooking}
                        onPaymentSuccess={handlePaymentSuccess}
                        loading={loading}
                        appointmentId={createdAppointmentId || undefined}
                        patientName={patientName || undefined}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingPage;

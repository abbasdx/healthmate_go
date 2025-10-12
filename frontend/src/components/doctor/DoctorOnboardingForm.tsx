"use client";
import React, { useState, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { useAuthStore } from "@/stores/authStore";
import { useRouter } from "next/navigation";
import { healthcareCategoriesList, specializations } from "@/lib/constant";
import { DoctorFormData, HospitalInfo } from "@/lib/types";



const DoctorOnboardingForm = () => {
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Initialize with proper TypeScript interface
  const [formData, setFormData] = useState<DoctorFormData>({
    specialization: "",
    categories: [], // Now properly typed as string[]
    qualification: "",
    experience: "",
    about: "",
    fees: "",
    hospitalInfo: {
      name: "",
      address: "",
      city: "",
    },
    availabilityRange: {
      startDate: "",
      endDate: "",
      excludedWeekdays: [],
    },
    dailyTimeRanges: [
      { start: "09:00", end: "12:00" },
      { start: "14:00", end: "17:00" },
    ],
    slotDurationMinutes: 30,
  });

  const { updateProfile, user, loading } = useAuthStore();
  const router = useRouter();

  // Fix the category toggle function with explicit typing
  const handleCategoryToggle = (category: string): void => {
    setFormData((prev: DoctorFormData) => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter((c: string) => c !== category)
        : [...prev.categories, category],
    }));
  };

  // Generic input change handler
  const handleInputChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ): void => {
    const { name, value } = event.target;
    setFormData((prev: DoctorFormData) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Hospital info change handler
  const handleHospitalInfoChange = (
    field: keyof HospitalInfo,
    value: string
  ): void => {
    setFormData((prev: DoctorFormData) => ({
      ...prev,
      hospitalInfo: {
        ...prev.hospitalInfo,
        [field]: value,
      },
    }));
  };

  const handleSubmit = async (): Promise<void> => {
    try {
      // Validate at least one category is selected
      if (formData.categories.length === 0) {
        alert("Please select at least one healthcare category");
        return;
      }

      await updateProfile({
        specialization: formData.specialization,
        category: formData.categories,
        qualification: formData.qualification,
        experience: parseInt(formData.experience),
        about: formData.about,
        fees: parseInt(formData.fees),
        hospitalInfo: formData.hospitalInfo,
        availabilityRange: {
          startDate: new Date(formData.availabilityRange.startDate),
          endDate: new Date(formData.availabilityRange.endDate),
          excludedWeekdays: formData.availabilityRange.excludedWeekdays,
        },
        dailyTimeRanges: formData.dailyTimeRanges,
        slotDurationMinutes: formData.slotDurationMinutes || 30,
      });
      router.push("/doctor/dashboard");
    } catch (err) {
      console.error("Profile update failed:", err);
    }
  };

  const handleNext = (): void => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = (): void => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <Card className="shadow-lg">
        <CardContent className="p-8">
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold mb-4">
                Professional Information
              </h2>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="specialization">
                    Medical Specialization *
                  </Label>
                  <Select
                    value={formData.specialization}
                    onValueChange={(value: string) =>
                      setFormData((prev) => ({
                        ...prev,
                        specialization: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select specialization" />
                    </SelectTrigger>
                    <SelectContent>
                      {specializations.map((spec: string) => (
                        <SelectItem key={spec} value={spec}>
                          {spec}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="experience">Years of Experience *</Label>
                  <Input
                    id="experience"
                    name="experience"
                    type="number"
                    value={formData.experience}
                    onChange={handleInputChange}
                    placeholder="e.g., 5"
                    required
                  />
                </div>
              </div>

              {/* Healthcare Categories Selection */}
              <div className="space-y-3">
                <Label>Healthcare Categories *</Label>
                <p className="text-sm text-gray-600">
                  Select the healthcare areas you provide services for (select
                  at least one):
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {healthcareCategoriesList.map((category: string) => (
                    <div key={category} className="flex items-center space-x-2">
                      <Checkbox
                        id={category}
                        checked={formData.categories.includes(category)}
                        onCheckedChange={() => handleCategoryToggle(category)}
                      />
                      <label
                        htmlFor={category}
                        className="text-sm font-medium cursor-pointer hover:text-blue-600"
                      >
                        {category}
                      </label>
                    </div>
                  ))}
                </div>
                {formData.categories.length === 0 && (
                  <p className="text-red-500 text-xs">
                    Please select at least one category
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="qualification">Qualification *</Label>
                <Input
                  id="qualification"
                  name="qualification"
                  value={formData.qualification}
                  onChange={handleInputChange}
                  placeholder="e.g., MBBS, MD Cardiology"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="about">About You *</Label>
                <Textarea
                  id="about"
                  name="about"
                  value={formData.about}
                  onChange={handleInputChange}
                  placeholder="Tell patients about your expertise and approach to healthcare..."
                  rows={4}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fees">Consultation Fee (₹) *</Label>
                <Input
                  id="fees"
                  name="fees"
                  type="number"
                  value={formData.fees}
                  onChange={handleInputChange}
                  placeholder="e.g., 500"
                  required
                />
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold mb-4">
                Hospital/Clinic Information
              </h2>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="hospitalName">Hospital/Clinic Name *</Label>
                  <Input
                    id="hospitalName"
                    value={formData.hospitalInfo.name}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      handleHospitalInfoChange("name", e.target.value)
                    }
                    placeholder="e.g., Apollo Hospital"
                    required
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address">Address *</Label>
                  <Textarea
                    id="address"
                    value={formData.hospitalInfo.address}
                    onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                      handleHospitalInfoChange("address", e.target.value)
                    }
                    placeholder="Full address of your practice"
                    rows={3}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={formData.hospitalInfo.city}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      handleHospitalInfoChange("city", e.target.value)
                    }
                    placeholder="e.g., Mumbai"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold mb-4">
                Availability Settings
              </h2>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Available From *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.availabilityRange.startDate}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev) => ({
                        ...prev,
                        availabilityRange: {
                          ...prev.availabilityRange,
                          startDate: e.target.value,
                        },
                      }))
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">Available Until *</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.availabilityRange.endDate}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev) => ({
                        ...prev,
                        availabilityRange: {
                          ...prev.availabilityRange,
                          endDate: e.target.value,
                        },
                      }))
                    }
                    required
                  />
                </div>
              </div>

              {/* Slot Duration Selection */}
              <div className="space-y-2">
                <Label htmlFor="slotDuration">
                  Appointment Slot Duration *
                </Label>
                <Select
                  value={formData.slotDurationMinutes?.toString() || "30"}
                  onValueChange={(value: string) =>
                    setFormData((prev) => ({
                      ...prev,
                      slotDurationMinutes: parseInt(value),
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select slot duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="20">20 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="45">45 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="90">1.5 hours</SelectItem>
                    <SelectItem value="120">2 hours</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-600">
                  Duration for each patient consultation slot
                </p>
              </div>

              {/* Working Days Selection */}
              <div className="space-y-3">
                <Label>Working Days *</Label>
                <p className="text-sm text-gray-600">
                  Select the days you are NOT available:
                </p>
                <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
                  {[
                    { day: "Sunday", value: 0 },
                    { day: "Monday", value: 1 },
                    { day: "Tuesday", value: 2 },
                    { day: "Wednesday", value: 3 },
                    { day: "Thursday", value: 4 },
                    { day: "Friday", value: 5 },
                    { day: "Saturday", value: 6 },
                  ].map(({ day, value }) => (
                    <div key={day} className="flex items-center space-x-2">
                      <Checkbox
                        id={`day-${value}`}
                        checked={formData.availabilityRange.excludedWeekdays.includes(
                          value
                        )}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFormData((prev) => ({
                              ...prev,
                              availabilityRange: {
                                ...prev.availabilityRange,
                                excludedWeekdays: [
                                  ...prev.availabilityRange.excludedWeekdays,
                                  value,
                                ],
                              },
                            }));
                          } else {
                            setFormData((prev) => ({
                              ...prev,
                              availabilityRange: {
                                ...prev.availabilityRange,
                                excludedWeekdays:
                                  prev.availabilityRange.excludedWeekdays.filter(
                                    (d) => d !== value
                                  ),
                              },
                            }));
                          }
                        }}
                      />
                      <label
                        htmlFor={`day-${value}`}
                        className="text-sm font-medium cursor-pointer"
                      >
                        {day.slice(0, 3)}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Daily Time Ranges */}
              <div className="space-y-4">
                <Label>Daily Working Hours *</Label>
                <p className="text-sm text-gray-600">
                  Set your working hours for each day:
                </p>

                {formData.dailyTimeRanges.map((range, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-4 p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <Label className="text-sm">
                        Session {index + 1} - Start Time
                      </Label>
                      <Input
                        type="time"
                        value={range.start}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => {
                          const newRanges = [...formData.dailyTimeRanges];
                          newRanges[index].start = e.target.value;
                          setFormData((prev) => ({
                            ...prev,
                            dailyTimeRanges: newRanges,
                          }));
                        }}
                        required
                      />
                    </div>

                    <div className="flex-1">
                      <Label className="text-sm">
                        Session {index + 1} - End Time
                      </Label>
                      <Input
                        type="time"
                        value={range.end}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => {
                          const newRanges = [...formData.dailyTimeRanges];
                          newRanges[index].end = e.target.value;
                          setFormData((prev) => ({
                            ...prev,
                            dailyTimeRanges: newRanges,
                          }));
                        }}
                        required
                      />
                    </div>

                    {formData.dailyTimeRanges.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newRanges = formData.dailyTimeRanges.filter(
                            (_, i) => i !== index
                          );
                          setFormData((prev) => ({
                            ...prev,
                            dailyTimeRanges: newRanges,
                          }));
                        }}
                        className="text-red-600 hover:text-red-700"
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setFormData((prev) => ({
                      ...prev,
                      dailyTimeRanges: [
                        ...prev.dailyTimeRanges,
                        { start: "18:00", end: "20:00" },
                      ],
                    }));
                  }}
                  className="w-full"
                >
                  + Add Another Time Session
                </Button>
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex justify-between pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1}
            >
              Previous
            </Button>

            {currentStep < 3 ? (
              <Button
                type="button"
                onClick={handleNext}
                disabled={currentStep === 1 && formData.categories.length === 0}
              >
                Next
              </Button>
            ) : (
              <Button type="button" onClick={handleSubmit} disabled={loading}>
                {loading ? "Setting up..." : "Complete Setup"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DoctorOnboardingForm;

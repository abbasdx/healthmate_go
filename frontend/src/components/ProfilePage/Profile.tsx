// src/app/(dashboard)/[userType]/profile/page.tsx
"use client";
import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  User,
  FileText,
  Phone,
  Stethoscope,
  MapPin,
  Clock,
  Plus,
  X,
  ChevronDown,
} from "lucide-react";
import Header from "@/components/landing/Header";
import { useAuthStore } from "@/stores/authStore";
import { healthcareCategories, specializations } from "@/lib/constant";

interface ProfileProps {
  userType: "doctor" | "patient";
}

const ProfilePage = ({ userType }: ProfileProps) => {
  const { user, fetchProfile, updateProfile, loading } = useAuthStore();
  const [activeSection, setActiveSection] = useState("about");
  const [isEditing, setIsEditing] = useState(false);
  // Fix: Initialize with default structure to prevent undefined values
  const [formData, setFormData] = useState<any>({
    name: "",
    email: "",
    phone: "",
    dob: "",
    gender: "",
    bloodGroup: "",
    about: "",
    specialization: "",
    category: [],
    qualification: "",
    experience: 0,
    fees: 0,
    hospitalInfo: {
      name: "",
      address: "",
      city: "",
    },
    medicalHistory: {
      allergies: "",
      currentMedications: "",
      chronicConditions: "",
    },
    emergencyContact: {
      name: "",
      phone: "",
      relationship: "",
    },

    availabilityRange: {
      startDate: "",
      endDate: "",
      excludedWeekdays: [],
    },
    dailyTimeRanges: [],
    slotDurationMinutes: 30,
  });

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        dob: user.dob || "",
        gender: user.gender || "",
        bloodGroup: user.bloodGroup || "",
        about: user.about || "",
        specialization: user.specialization || "",
        category: user.category || [],
        qualification: user.qualification || "",
        experience: user.experience || 0,
        fees: user.fees || 0,
        hospitalInfo: {
          name: user.hospitalInfo?.name || "",
          address: user.hospitalInfo?.address || "",
          city: user.hospitalInfo?.city || "",
        },
        medicalHistory: {
          allergies: user.medicalHistory?.allergies || "",
          currentMedications: user.medicalHistory?.currentMedications || "",
          chronicConditions: user.medicalHistory?.chronicConditions || "",
        },
        emergencyContact: {
          name: user.emergencyContact?.name || "",
          phone: user.emergencyContact?.phone || "",
          relationship: user.emergencyContact?.relationship || "",
        },
        availabilityRange: {
          startDate: user.availabilityRange?.startDate || "",
          endDate: user.availabilityRange?.endDate || "",
          excludedWeekdays: user.availabilityRange?.excludedWeekdays || [],
        },
        dailyTimeRanges: user.dailyTimeRanges || [],
        slotDurationMinutes: user.slotDurationMinutes || 30,
      });
    }
  }, [user]);

  const handleInputChange = (field: string, value: any) => {
    if (field.includes(".")) {
      const [parent, child] = field.split(".");
      setFormData((prev: any) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } else {
      setFormData((prev: any) => ({ ...prev, [field]: value }));
    }
  };

  const handleArrayChange = (
    field: string,
    index: number,
    subField: string,
    value: any
  ) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: prev[field].map((item: any, i: number) =>
        i === index ? { ...item, [subField]: value } : item
      ),
    }));
  };

  // ✅ Handle category selection from dropdown
  const handleCategorySelect = (category: any) => {
    if (!formData.category.includes(category.title)) {
      handleInputChange("category", [...formData.category, category.title]);
    }
  };

const handleCategoryDelete = (indexToDelete: number) => {
  const currentCategories = [...formData.category];
  const newCategories = currentCategories.filter((_: any, i: number) => i !== indexToDelete);
  setFormData((prev: any) => ({
    ...prev,
    category: newCategories
  }));
};


  // ✅ Filter out already selected categories
  const getAvailableCategories = () => {
    return healthcareCategories.filter(
      (cat) => !formData.category.includes(cat.title)
    );
  };

  const addTimeRange = () => {
    setFormData((prev: any) => ({
      ...prev,
      dailyTimeRanges: [
        ...prev.dailyTimeRanges,
        { start: "09:00", end: "17:00" },
      ],
    }));
  };

  const removeTimeRange = (index: number) => {
    setFormData((prev: any) => ({
      ...prev,
      dailyTimeRanges: prev.dailyTimeRanges.filter(
        (_: any, i: number) => i !== index
      ),
    }));
  };

  const handleWeekdayToggle = (weekday: number) => {
    const excludedWeekdays = [...formData.availabilityRange.excludedWeekdays];
    const index = excludedWeekdays.indexOf(weekday);

    if (index > -1) {
      excludedWeekdays.splice(index, 1);
    } else {
      excludedWeekdays.push(weekday);
    }

    handleInputChange("availabilityRange.excludedWeekdays", excludedWeekdays);
  };

  const handleSave = async () => {
    try {
      await updateProfile(formData);
      setIsEditing(false);
    } catch (error) {
      console.error("Profile update failed:", error);
    }
  };

  // ✅ Helper function to format ISO date to YYYY-MM-DD
  const formatDateForInput = (isoDate?: string): string => {
    if (!isoDate) return "";
    const date = new Date(isoDate);
    if (isNaN(date.getTime())) return "";
    return date.toISOString().split("T")[0]; // Extract YYYY-MM-DD part
  };

  const sidebarItems =
    userType === "doctor"
      ? [
          { id: "about", label: "About", icon: User },
          { id: "professional", label: "Professional Info", icon: Stethoscope },
          { id: "hospital", label: "Hospital Information", icon: MapPin },
          { id: "availability", label: "Availability", icon: Clock },
        ]
      : [
          { id: "about", label: "About", icon: User },
          { id: "contact", label: "Contact Information", icon: Phone },
          { id: "medical", label: "Medical History", icon: FileText },
          { id: "emergency", label: "Emergency Contact", icon: Phone },
        ];

  const renderAboutSection = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex flex-col gap-2">
          <Label>Legal first name</Label>
          {/* ✅ Fix: Use value || '' to prevent undefined */}
          <Input
            value={formData.name || ""}
            onChange={(e) => handleInputChange("name", e.target.value)}
            disabled={!isEditing}
            className="w-80"
          />
        </div>
      </div>

      {userType === "patient" && (
        <>
          <div className=" flex flex-col gap-2">
            <Label>Official date of birth</Label>
            <Input
              type="date"
              value={
                formData.dob
                  ? new Date(formData.dob).toISOString().split("T")[0]
                  : ""
              }
              onChange={(e) =>
                handleInputChange(
                  "dob",
                  e.target.value ? new Date(e.target.value).toISOString() : ""
                )
              }
              disabled={!isEditing}
              className="w-80"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Gender</Label>
            <RadioGroup
              value={formData.gender || ""}
              onValueChange={(value) => handleInputChange("gender", value)}
              disabled={!isEditing}
              className="flex flex-col space-y-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="male" id="male" />
                <Label htmlFor="male">Male</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="female" id="female" />
                <Label htmlFor="female">Female</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="other" id="other" />
                <Label htmlFor="other">Other</Label>
              </div>
            </RadioGroup>
          </div>

          <div className=" flex flex-col gap-2">
            <Label>Blood Group</Label>
            <Select
              value={formData.bloodGroup || ""}
              onValueChange={(value) => handleInputChange("bloodGroup", value)}
              disabled={!isEditing}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select blood group" />
              </SelectTrigger>
              <SelectContent>
                {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(
                  (group) => (
                    <SelectItem key={group} value={group}>
                      {group}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </div>
        </>
      )}

      {userType === "doctor" && (
        <div>
          <Label>About</Label>
          <Textarea
            value={formData.about || ""}
            onChange={(e) => handleInputChange("about", e.target.value)}
            disabled={!isEditing}
            rows={4}
          />
        </div>
      )}
    </div>
  );

  const renderProfessionalSection = () => (
    <div className="space-y-6">
<div className='flex flex-col gap-2'>
  <Label>Specialization</Label>
  <Select
    value={formData.specialization || ''}
    onValueChange={(value) => handleInputChange('specialization', value)}
    disabled={!isEditing}
  >
    <SelectTrigger className="w-full">
      <SelectValue placeholder="Select specialization" />
    </SelectTrigger>
    <SelectContent>
      {specializations.map((spec) => (
        <SelectItem key={spec} value={spec}>
          {spec}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
</div>

<div className="flex flex-col gap-2">
  <Label>Categories</Label>
  <div className="flex flex-wrap gap-2 mt-2">
    {formData.category?.map((cat: string, index: number) => (
     <Badge
  key={index}
  variant="secondary"
  className="flex items-center space-x-1"
>
  <span>{cat}</span>
  {isEditing && (
    <button
      type="button"
      className="ml-1 p-0 border-0 bg-transparent cursor-pointer hover:bg-gray-200 rounded-full"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        handleCategoryDelete(index);
      }}
    >
      <X className="w-3 h-3" />
    </button>
  )}
</Badge>

    ))}

    {/* ✅ Select for adding categories */}
    {isEditing && getAvailableCategories().length > 0 && (
      <Select onValueChange={(value) => {
        const selectedCategory = getAvailableCategories().find(cat => cat.id === value);
        if (selectedCategory) {
          handleCategorySelect(selectedCategory);
        }
      }}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Add Category" />
        </SelectTrigger>
        <SelectContent>
          {getAvailableCategories().map((category) => (
            <SelectItem key={category.id} value={category.id}>
              <div className="flex items-center space-x-2">
                <div
                  className={`w-3 h-3 rounded-full ${category.color}`}
                ></div>
                <span>{category.title}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )}
    
    {isEditing && getAvailableCategories().length === 0 && (
      <span className="text-sm text-gray-500">
        All categories have been selected
      </span>
    )}
  </div>
</div>

      <div className="flex flex-col gap-2">
        <Label>Qualification</Label>
        <Input
          value={formData.qualification || ""}
          onChange={(e) => handleInputChange("qualification", e.target.value)}
          disabled={!isEditing}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label>Experience (years)</Label>
        <Input
          type="number"
          value={formData.experience || ""}
          onChange={(e) =>
            handleInputChange("experience", parseInt(e.target.value) || 0)
          }
          disabled={!isEditing}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label>Consultation Fee (₹)</Label>
        <Input
          type="number"
          value={formData.fees || ""}
          onChange={(e) =>
            handleInputChange("fees", parseInt(e.target.value) || 0)
          }
          disabled={!isEditing}
        />
      </div>
    </div>
  );

  const renderHospitalSection = () => (
    <div className="space-y-6">
      <div className=" flex flex-col gap-2">
        <Label>Hospital/Clinic Name</Label>
        <Input
          value={formData.hospitalInfo?.name || ""}
          onChange={(e) =>
            handleInputChange("hospitalInfo.name", e.target.value)
          }
          disabled={!isEditing}
        />
      </div>

      <div className=" flex flex-col gap-2">
        <Label>Address</Label>
        <Textarea
          value={formData.hospitalInfo?.address || ""}
          onChange={(e) =>
            handleInputChange("hospitalInfo.address", e.target.value)
          }
          disabled={!isEditing}
          rows={3}
        />
      </div>

      <div className=" flex flex-col gap-2">
        <Label>City</Label>
        <Input
          value={formData.hospitalInfo?.city || ""}
          onChange={(e) =>
            handleInputChange("hospitalInfo.city", e.target.value)
          }
          disabled={!isEditing}
        />
      </div>
    </div>
  );

  // ✅ New: Availability section for doctors
  const renderAvailabilitySection = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label>Available From Date</Label>
          <Input
            type="date"
            value={formatDateForInput(formData.availabilityRange?.startDate)}
            onChange={(e) =>
              handleInputChange("availabilityRange.startDate", e.target.value)
            }
            disabled={!isEditing}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label>Available Until Date</Label>
          <Input
            type="date"
            value={formatDateForInput(formData.availabilityRange?.endDate)}
            onChange={(e) =>
              handleInputChange("availabilityRange.endDate", e.target.value)
            }
            disabled={!isEditing}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label>Excluded Weekdays</Label>
        <div className="flex flex-wrap gap-2">
          {[
            "Sunday",
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
          ].map((day, index) => (
            <label key={index} className="flex items-center space-x-2">
              <Checkbox
                checked={
                  formData.availabilityRange?.excludedWeekdays?.includes(
                    index
                  ) || false
                }
                onCheckedChange={() => handleWeekdayToggle(index)}
                disabled={!isEditing}
              />
              <span className="text-sm">{day}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label>Daily Time Ranges</Label>
        <div className="space-y-3">
          {formData.dailyTimeRanges?.map((timeRange: any, index: number) => (
            <div key={index} className="flex items-center space-x-2">
              <Input
                type="time"
                value={timeRange.start || ""}
                onChange={(e) =>
                  handleArrayChange(
                    "dailyTimeRanges",
                    index,
                    "start",
                    e.target.value
                  )
                }
                disabled={!isEditing}
              />
              <span>to</span>
              <Input
                type="time"
                value={timeRange.end || ""}
                onChange={(e) =>
                  handleArrayChange(
                    "dailyTimeRanges",
                    index,
                    "end",
                    e.target.value
                  )
                }
                disabled={!isEditing}
              />
              {isEditing && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeTimeRange(index)}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
          {isEditing && (
            <Button variant="outline" size="sm" onClick={addTimeRange}>
              <Plus className="w-4 h-4 mr-2" />
              Add Time Range
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label>Slot Duration (minutes)</Label>
        <Select
          value={formData.slotDurationMinutes?.toString() || "30"}
          onValueChange={(value) =>
            handleInputChange("slotDurationMinutes", parseInt(value))
          }
          disabled={!isEditing}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="15">15 minutes</SelectItem>
            <SelectItem value="30">30 minutes</SelectItem>
            <SelectItem value="45">45 minutes</SelectItem>
            <SelectItem value="60">60 minutes</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  const renderContactSection = () => (
    <div className="space-y-6">
      <div className=" flex flex-col gap-2">
        <Label>Phone Number</Label>
        <Input
          value={formData.phone || ""}
          onChange={(e) => handleInputChange("phone", e.target.value)}
          disabled={!isEditing}
        />
      </div>

      <div className=" flex flex-col gap-2">
        <Label>Email</Label>
        <Input value={formData.email || ""} disabled={true} />
      </div>
    </div>
  );

  const renderMedicalSection = () => (
    <div className="space-y-6">
      <div className=" flex flex-col gap-2">
        <Label>Allergies</Label>
        <Textarea
          value={formData.medicalHistory?.allergies || ""}
          onChange={(e) =>
            handleInputChange("medicalHistory.allergies", e.target.value)
          }
          disabled={!isEditing}
          rows={3}
        />
      </div>

      <div className=" flex flex-col gap-2">
        <Label>Current Medications</Label>
        <Textarea
          value={formData.medicalHistory?.currentMedications || ""}
          onChange={(e) =>
            handleInputChange(
              "medicalHistory.currentMedications",
              e.target.value
            )
          }
          disabled={!isEditing}
          rows={3}
        />
      </div>

      <div className=" flex flex-col gap-2">
        <Label>Chronic Conditions</Label>
        <Textarea
          value={formData.medicalHistory?.chronicConditions || ""}
          onChange={(e) =>
            handleInputChange(
              "medicalHistory.chronicConditions",
              e.target.value
            )
          }
          disabled={!isEditing}
          rows={3}
        />
      </div>
    </div>
  );

  const renderEmergencySection = () => (
    <div className="space-y-6">
      <div className=" flex flex-col gap-2">
        <Label>Emergency Contact Name</Label>
        <Input
          value={formData.emergencyContact?.name || ""}
          onChange={(e) =>
            handleInputChange("emergencyContact.name", e.target.value)
          }
          disabled={!isEditing}
        />
      </div>

      <div className=" flex flex-col gap-2">
        <Label>Emergency Contact Phone</Label>
        <Input
          value={formData.emergencyContact?.phone || ""}
          onChange={(e) =>
            handleInputChange("emergencyContact.phone", e.target.value)
          }
          disabled={!isEditing}
        />
      </div>

      <div className=" flex flex-col gap-2">
        <Label>Relationship</Label>
        <Input
          value={formData.emergencyContact?.relationship || ""}
          onChange={(e) =>
            handleInputChange("emergencyContact.relationship", e.target.value)
          }
          disabled={!isEditing}
        />
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case "about":
        return renderAboutSection();
      case "professional":
        return renderProfessionalSection();
      case "hospital":
        return renderHospitalSection();
      case "availability":
        return renderAvailabilitySection();
      case "contact":
        return renderContactSection();
      case "medical":
        return renderMedicalSection();
      case "emergency":
        return renderEmergencySection();
      default:
        return renderAboutSection();
    }
  };

  if (!user) return <div>Loading...</div>;

  return (
    <>
      <Header showDashboardNav={true} />
      <div className="min-h-screen bg-gray-50 pt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Records</h1>
          </div>

          <div className="flex items-center space-x-8 mb-8">
            <div className="flex flex-col items-center">
              <Avatar className="w-24 h-24">
                <AvatarImage src={user.profileImage} alt={user.name} />
                <AvatarFallback className="bg-blue-100 text-blue-600 text-2xl font-bold">
                  {user.name?.charAt(0)?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <p className="mt-2 text-lg font-semibold">{user.name}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="space-y-2">
                {sidebarItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      activeSection === item.id
                        ? "bg-blue-100 text-blue-600 border border-blue-200"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="lg:col-span-3">
              <Card>
                <CardContent className="p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-semibold capitalize">
                      {
                        sidebarItems.find((item) => item.id === activeSection)
                          ?.label
                      }
                    </h2>
                    <div className="flex space-x-2">
                      {isEditing ? (
                        <>
                          <Button
                            variant="outline"
                            onClick={() => setIsEditing(false)}
                          >
                            Cancel
                          </Button>
                          <Button onClick={handleSave} disabled={loading}>
                            {loading ? "Saving..." : "Save"}
                          </Button>
                        </>
                      ) : (
                        <Button onClick={() => setIsEditing(true)}>Edit</Button>
                      )}
                    </div>
                  </div>

                  {renderContent()}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfilePage;

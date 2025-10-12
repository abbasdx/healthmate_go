'use client';
import React, { useState, ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuthStore } from '@/stores/authStore';
import { useRouter } from 'next/navigation';
import { Calendar, Phone, User, Heart } from 'lucide-react';

// TypeScript Interfaces
interface EmergencyContact {
  name: string;
  phone: string;
  relationship: string;
}

interface MedicalHistory {
  allergies: string;
  currentMedications: string;
  chronicConditions: string;
}

interface PatientOnboardingData {
  phone: string;
  dob: string;
  gender: string;
  bloodGroup?: string;
  emergencyContact: EmergencyContact;
  medicalHistory: MedicalHistory;
}

const PatientOnboardingForm = () => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [formData, setFormData] = useState<PatientOnboardingData>({
    phone: '',
    dob: '',
    gender: '',
    bloodGroup: '',
    emergencyContact: {
      name: '',
      phone: '',
      relationship: ''
    },
    medicalHistory: {
      allergies: '',
      currentMedications: '',
      chronicConditions: ''
    }
  });

  const { updateProfile, user, loading } = useAuthStore();
  const router = useRouter();

  const handleInputChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
    const { name, value } = event.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string): void => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

const handleEmergencyContactChange = (field: keyof EmergencyContact, value: string): void => {
  setFormData(prev => ({
    ...prev,
    emergencyContact: {
      ...prev.emergencyContact,
      [field]: value
    }
  }));
};

const handleMedicalHistoryChange = (field: keyof MedicalHistory, value: string): void => {
  setFormData(prev => ({
    ...prev,
    medicalHistory: {
      ...prev.medicalHistory,
      [field]: value
    }
  }));
};



  const handleSubmit = async (): Promise<void> => {
    try {
      await updateProfile({
        phone: formData.phone,
        dob: formData.dob,
        gender: formData.gender,
        bloodGroup: formData.bloodGroup,
        emergencyContact: formData.emergencyContact,
        medicalHistory: formData.medicalHistory
      });
      router.push('/');
    } catch (err) {
      console.error('Profile update failed:', err);
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
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome {user?.name} to HealthMate!
        </h1>
        <p className="text-gray-600">Complete your profile to start booking appointments</p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center mb-8">
        <div className="flex items-center">
          {[1, 2, 3].map((step) => (
            <React.Fragment key={step}>
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                currentStep >= step 
                  ? 'bg-blue-600 border-blue-600 text-white' 
                  : 'border-gray-300 text-gray-400'
              }`}>
                {step}
              </div>
              {step < 3 && (
                <div className={`w-20 h-1 ${
                  currentStep > step ? 'bg-blue-600' : 'bg-gray-300'
                }`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      <Card className="shadow-lg">
        <CardContent className="p-8">
          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="flex items-center space-x-2 mb-6">
                <User className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-semibold">Basic Information</h2>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+91 9876543210"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dob">Date of Birth *</Label>
                  <Input
                    id="dob"
                    name="dob"
                    type="date"
                    value={formData.dob}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender">Gender *</Label>
                  <Select 
                    value={formData.gender} 
                    onValueChange={(value) => handleSelectChange('gender', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bloodGroup">Blood Group (Optional)</Label>
                  <Select 
                    value={formData.bloodGroup} 
                    onValueChange={(value) => handleSelectChange('bloodGroup', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select blood group" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A+">A+</SelectItem>
                      <SelectItem value="A-">A-</SelectItem>
                      <SelectItem value="B+">B+</SelectItem>
                      <SelectItem value="B-">B-</SelectItem>
                      <SelectItem value="AB+">AB+</SelectItem>
                      <SelectItem value="AB-">AB-</SelectItem>
                      <SelectItem value="O+">O+</SelectItem>
                      <SelectItem value="O-">O-</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Emergency Contact */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="flex items-center space-x-2 mb-6">
                <Phone className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-semibold">Emergency Contact</h2>
              </div>

              <Alert>
                <AlertDescription>
                  This information will be used to contact someone on your behalf in case of emergency during consultations.
                </AlertDescription>
              </Alert>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="emergencyName">Contact Name *</Label>
                  <Input
                    id="emergencyName"
                    value={formData.emergencyContact.name}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => 
                      handleEmergencyContactChange( 'name', e.target.value)
                    }
                    placeholder="Full name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emergencyPhone">Contact Phone *</Label>
                  <Input
                    id="emergencyPhone"
                    type="tel"
                    value={formData.emergencyContact.phone}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => 
                     handleEmergencyContactChange('phone', e.target.value)
                    }
                    placeholder="+91 9876543210"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="relationship">Relationship *</Label>
                  <Select 
                    value={formData.emergencyContact.relationship} 
                      onValueChange={(value) => handleEmergencyContactChange('relationship', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select relationship" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="spouse">Spouse</SelectItem>
                      <SelectItem value="parent">Parent</SelectItem>
                      <SelectItem value="child">Child</SelectItem>
                      <SelectItem value="sibling">Sibling</SelectItem>
                      <SelectItem value="friend">Friend</SelectItem>
                      <SelectItem value="relative">Relative</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Medical History */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="flex items-center space-x-2 mb-6">
                <Heart className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-semibold">Medical Information</h2>
              </div>

              <Alert>
                <AlertDescription>
                  This information helps doctors provide better care. All information is kept confidential and secure.
                </AlertDescription>
              </Alert>

              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="allergies">Known Allergies</Label>
                  <Textarea
                    id="allergies"
                    value={formData.medicalHistory.allergies}
                     onChange={(e: ChangeEvent<HTMLTextAreaElement>) => 
    handleMedicalHistoryChange('allergies', e.target.value)
  }
                    placeholder="e.g., Penicillin, Peanuts, Dust (or write 'None' if no known allergies)"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currentMedications">Current Medications</Label>
                  <Textarea
                    id="currentMedications"
                    value={formData.medicalHistory.currentMedications}
                  onChange={(e: ChangeEvent<HTMLTextAreaElement>) => 
    handleMedicalHistoryChange('currentMedications', e.target.value)
  }
                    placeholder="List any medications you're currently taking (or write 'None' if not taking any)"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="chronicConditions">Chronic Conditions</Label>
                  <Textarea
                    id="chronicConditions"
                    value={formData.medicalHistory.chronicConditions}
                    onChange={(e: ChangeEvent<HTMLTextAreaElement>) => 
    handleMedicalHistoryChange('chronicConditions', e.target.value)
  }
                    placeholder="e.g., Diabetes, Hypertension, Asthma (or write 'None' if no chronic conditions)"
                    rows={3}
                  />
                </div>
              </div>

            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-8">
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
                disabled={
                  (currentStep === 1 && (!formData.phone || !formData.dob || !formData.gender)) ||
                  (currentStep === 2 && (!formData.emergencyContact.name || !formData.emergencyContact.phone || !formData.emergencyContact.relationship))
                }
              >
                Next
              </Button>
            ) : (
              <Button 
                type="button"
                onClick={handleSubmit} 
                disabled={loading}
                className="bg-green-600 hover:bg-green-700"
              >
                {loading ? 'Completing Setup...' : 'Complete Profile'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PatientOnboardingForm;

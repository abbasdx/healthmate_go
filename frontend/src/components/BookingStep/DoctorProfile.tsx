// src/components/booking/DoctorProfile.tsx
'use client';
import React from 'react';
import { Star, Award, Heart, MapPin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Doctor } from '@/lib/types';

interface DoctorProfileInterface {
  doctor:Doctor
}


const DoctorProfile = ({ doctor }:DoctorProfileInterface) => {
  return (
    <Card className="sticky top-8 shadow-lg border-0">
      <CardContent className="p-8">
        <div className="text-center mb-6">
          <Avatar className="w-32 h-32 mx-auto mb-4 ring-4 ring-blue-100">
            <AvatarImage src={doctor.profileImage} alt={doctor.name} />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white text-2xl font-bold">
              {doctor.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{doctor.name}</h2>
          <p className="text-gray-600 mb-1">{doctor.specialization}</p>
          <p className="text-sm text-gray-500 mb-2">{doctor.qualification}</p>
          <p className="text-sm text-gray-500 mb-4">{doctor.experience} years experience</p>

          <div className="flex items-center justify-center space-x-4 mb-6">
            <div className="flex items-center space-x-1">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className="w-4 h-4 fill-orange-400 text-orange-400" />
                ))}
              </div>
              <span className="text-sm font-semibold text-gray-700">5.0</span>
            </div>
            <div className="text-sm text-gray-500">New Doctor</div>
          </div>

          <div className="flex justify-center flex-wrap gap-2 mb-6">
            {doctor.isVerified && (
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <Award className="w-3 h-3 mr-1" />
                Verified
              </Badge>
            )}
            {doctor.category?.map((cat, idx) => (
              <Badge key={idx} variant="secondary" className="bg-blue-100 text-blue-800">
                {cat}
              </Badge>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">About</h3>
            <p className="text-sm text-gray-600">{doctor.about}</p>
          </div>

          {doctor.hospitalInfo && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">Hospital/Clinic</h3>
              <div className="text-sm text-gray-600">
                <p className="font-medium">{doctor.hospitalInfo.name}</p>
                <p>{doctor.hospitalInfo.address}</p>
                <div className="flex items-center space-x-1 mt-1">
                  <MapPin className="w-3 h-3" />
                  <span>{doctor.hospitalInfo.city}</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg">
            <div>
              <p className="text-sm text-green-700 font-medium">Consultation Fee</p>
              <p className="text-2xl font-bold text-green-800">₹{doctor.fees}</p>
              <p className="text-xs text-green-600">{doctor.slotDurationMinutes} minutes session</p>
            </div>
            <div className="text-green-600">
              <Heart className="w-8 h-8" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DoctorProfile;

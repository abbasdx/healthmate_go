// src/components/booking/CalendarStep.tsx
'use client';
import React, { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Clock, Calendar as CalendarIcon } from 'lucide-react';
import { toLocalYMD, startOfDay } from '@/lib/dateUtils';
import { convertTo24Hour } from '@/lib/constant';

interface CalendarStepProps {
  selectedDate: Date | undefined;
  setSelectedDate: (date: Date | undefined) => void;
  selectedSlot: string;
  setSelectedSlot: (slot: string) => void;
  availableDates: string[];
  availableSlots: string[];
  excludedWeekdays: number[];
  onContinue: () => void;
  bookedSlots: string[];
}

const CalendarStep: React.FC<CalendarStepProps> = ({
  selectedDate,
  setSelectedDate,
  selectedSlot,
  setSelectedSlot,
  availableDates,
  availableSlots,
  excludedWeekdays,
  onContinue,
  bookedSlots,
}) => {
  const [showMoreSlots, setShowMoreSlots] = useState(false);
  const displayedSlots = showMoreSlots ? availableSlots : availableSlots.slice(0, 10);


  const isSlotBooked = (slot: string): boolean => {
    if (!selectedDate) return false;
    
    const dateString = toLocalYMD(selectedDate);
    const slotDateTime = new Date(`${dateString}T${convertTo24Hour(slot)}`);
    
    return bookedSlots.some(bookedSlot => {
      const bookedDateTime = new Date(bookedSlot);
      return bookedDateTime.getTime() === slotDateTime.getTime();
    });
  };

  // ✅ New function to check if slot is in the past
  const isSlotInPast = (slot: string): boolean => {
    if (!selectedDate) return false;

    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const selectedDay = new Date(selectedDate);
    selectedDay.setHours(0, 0, 0, 0);

    // Only apply this check for today's date
    if (selectedDay.getTime() === today.getTime()) {
      // Convert slot time to Date object for comparison
      const [time, modifier] = slot.split(' ');
      let [hours, minutes] = time.split(':');
      
      if (hours === '12') {
        hours = '00';
      }
      if (modifier === 'PM') {
        hours = String(parseInt(hours, 10) + 12);
      }

      const slotDateTime = new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate(),
        parseInt(hours, 10),
        parseInt(minutes, 10),
        0
      );

      // Add a 5-minute buffer to current time to prevent booking slots that are too close
      const bufferedCurrentTime = new Date(now.getTime() + 5 * 60 * 1000);
      
      return slotDateTime.getTime() <= bufferedCurrentTime.getTime();
    }

    return false;
  };

  const isDateDisabled = (date: Date): boolean => {
    // Don't allow past dates
    const today = startOfDay(new Date());
    const checkDate = startOfDay(date);
    
    if (checkDate < today) return true;
    
    // Check if date is in available range
    const ymd = toLocalYMD(date);
    if (!availableDates.includes(ymd)) return true;
    
    // Check weekday exclusion
    const jsWeekday = date.getDay(); // 0=Sunday, 1=Monday, etc.
    
    return excludedWeekdays.includes(jsWeekday);
  };

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-2xl font-bold text-gray-900 mb-6">Select Date & Time</h3>
        
        <div className="grid md:grid-cols-2 gap-8">
          {/* Calendar */}
          <div>
            <Label className="text-base font-semibold mb-4 block">Choose Date</Label>
            <div className="border rounded-lg p-4">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={isDateDisabled}
                className="rounded-md"
                classNames={{
                  day_selected: "bg-blue-600 text-white hover:bg-blue-600 hover:text-white focus:bg-blue-600 focus:text-white",
                  day_today: "bg-blue-100 text-blue-900 font-bold",
                  day_disabled: "text-gray-300 opacity-50 cursor-not-allowed",
                }}
              />
            </div>
          </div>

          {/* Time Slots */}
          <div>
            <Label className="text-base font-semibold mb-4 block">
              Available Time Slots
              {availableSlots.length > 0 && (
                <span className="text-sm font-normal text-gray-500 ml-2">
                  ({availableSlots.length} slots available)
                </span>
              )}
            </Label>
            
            {selectedDate ? (
              availableSlots.length > 0 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 max-h-80 overflow-y-auto">
                    {displayedSlots.map((slot) => {
                      const isSelected = selectedSlot === slot;
                      const isBooked = isSlotBooked(slot);
                      const isPast = isSlotInPast(slot);
                      const isDisabled = isBooked || isPast;
                      
                      return (
                        <Button
                          key={slot}
                          variant={isSelected ? "default" : "outline"}
                          disabled={isDisabled}
                          className={`p-3 justify-start ${
                            isDisabled
                              ? 'opacity-50 cursor-not-allowed bg-gray-100 text-gray-400 border-gray-200'
                              : isSelected 
                                ? 'bg-blue-600 text-white shadow-lg' 
                                : 'hover:border-blue-300 hover:bg-blue-50'
                          }`}
                          onClick={() => !isDisabled && setSelectedSlot(slot)}
                        >
                          <Clock className="w-4 h-4 mr-2" />
                          {slot}
                          {isPast && (
                            <span className="text-xs ml-2 opacity-75">(Past)</span>
                          )}
                          {isBooked && !isPast && (
                            <span className="text-xs ml-2 opacity-75">(Booked)</span>
                          )}
                        </Button>
                      );
                    })}
                  </div>
                  
                  {availableSlots.length > 10 && (
                    <div className="text-center">
                      <Button
                        variant="outline"
                        onClick={() => setShowMoreSlots(!showMoreSlots)}
                        className="text-blue-600 border-blue-600 hover:bg-blue-50"
                      >
                        {showMoreSlots 
                          ? 'Show Less' 
                          : `+ ${availableSlots.length - 10} more slots`
                        }
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Clock className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <h4 className="text-lg font-medium mb-2">No slots available</h4>
                  <p className="text-sm">Please select a different date</p>
                </div>
              )
            ) : (
              <div className="text-center py-12 text-gray-500">
                <CalendarIcon className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p className="text-sm">Please select a date to view available slots</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button 
          onClick={onContinue}
          disabled={!selectedDate || !selectedSlot}
          className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-lg font-semibold"
        >
          Continue
        </Button>
      </div>
    </div>
  );
};

export default CalendarStep;

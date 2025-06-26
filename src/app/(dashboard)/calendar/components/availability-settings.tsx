"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Clock } from "lucide-react";
import { useAvailability } from "../hooks/use-availability";
import { toast } from "sonner";

interface AvailabilitySettingsProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

interface TimeSlot {
  startTime: string;
  endTime: string;
  isActive: boolean;
}

interface DaySchedule {
  dayOfWeek: number;
  slots: TimeSlot[];
}

const DAYS_OF_WEEK = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const DEFAULT_SCHEDULE: DaySchedule[] = [
  {
    dayOfWeek: 0,
    slots: [{ startTime: "09:00", endTime: "17:00", isActive: false }],
  }, // Sunday
  {
    dayOfWeek: 1,
    slots: [{ startTime: "09:00", endTime: "17:00", isActive: true }],
  }, // Monday
  {
    dayOfWeek: 2,
    slots: [{ startTime: "09:00", endTime: "17:00", isActive: true }],
  }, // Tuesday
  {
    dayOfWeek: 3,
    slots: [{ startTime: "09:00", endTime: "17:00", isActive: true }],
  }, // Wednesday
  {
    dayOfWeek: 4,
    slots: [{ startTime: "09:00", endTime: "17:00", isActive: true }],
  }, // Thursday
  {
    dayOfWeek: 5,
    slots: [{ startTime: "09:00", endTime: "17:00", isActive: true }],
  }, // Friday
  {
    dayOfWeek: 6,
    slots: [{ startTime: "09:00", endTime: "17:00", isActive: false }],
  }, // Saturday
];

export function AvailabilitySettings({
  isOpen,
  onClose,
  userId,
}: AvailabilitySettingsProps) {
  const {
    data: availability,
    isLoading,
    updateAvailability,
  } = useAvailability(userId);

  // Convert API format to component format
  const convertApiToSchedule = (apiSlots: any[]): DaySchedule[] => {
    if (!apiSlots || !Array.isArray(apiSlots)) return DEFAULT_SCHEDULE;

    const scheduleMap = new Map();

    // Initialize with default schedule
    DEFAULT_SCHEDULE.forEach((day) => {
      scheduleMap.set(day.dayOfWeek, day);
    });

    // Override with API data
    apiSlots.forEach((slot) => {
      scheduleMap.set(slot.dayOfWeek, {
        dayOfWeek: slot.dayOfWeek,
        slots: [
          {
            startTime: slot.startTime,
            endTime: slot.endTime,
            isActive: slot.isActive,
          },
        ],
      });
    });

    return Array.from(
      { length: 7 },
      (_, i) => scheduleMap.get(i) || DEFAULT_SCHEDULE[i]
    );
  };

  // Convert component format to API format
  const convertScheduleToApi = (schedule: DaySchedule[]) => {
    return schedule.map((day) => ({
      dayOfWeek: day.dayOfWeek,
      startTime: day.slots[0].startTime,
      endTime: day.slots[0].endTime,
      isActive: day.slots[0].isActive,
    }));
  };

  const [schedule, setSchedule] = useState<DaySchedule[]>(() =>
    convertApiToSchedule(availability)
  );
  const [isSaving, setIsSaving] = useState(false);

  // Update schedule when availability data changes
  useEffect(() => {
    if (availability) {
      setSchedule(convertApiToSchedule(availability));
    }
  }, [availability]);

  const handleTimeChange = (
    dayIndex: number,
    field: "startTime" | "endTime",
    value: string
  ) => {
    const newSchedule = [...schedule];
    newSchedule[dayIndex].slots[0][field] = value;
    setSchedule(newSchedule);
  };

  const handleToggleDay = (dayIndex: number) => {
    const newSchedule = [...schedule];
    newSchedule[dayIndex].slots[0].isActive =
      !newSchedule[dayIndex].slots[0].isActive;
    setSchedule(newSchedule);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const apiSlots = convertScheduleToApi(schedule);
      await updateAvailability.mutateAsync(apiSlots);
      toast.success("Availability settings updated");
      onClose();
    } catch (error) {
      console.error("Error saving availability:", error);
      toast.error(
        `Failed to update availability: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      setIsSaving(false);
    }
  };

  const copyToAllWeekdays = () => {
    const mondaySlot = schedule[1].slots[0];
    const newSchedule = schedule.map((day, index) => {
      if (index === 0 || index === 6) return day; // Skip Sunday and Saturday
      return {
        ...day,
        slots: [
          {
            ...mondaySlot,
            isActive: true,
          },
        ],
      };
    });
    setSchedule(newSchedule);
    toast.success("Copied Monday's hours to all weekdays");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Availability Settings
          </DialogTitle>
          <DialogDescription>
            Set your regular working hours. These will be used to show available
            booking slots.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={copyToAllWeekdays}>
              Copy Monday to Weekdays
            </Button>
          </div>

          {DAYS_OF_WEEK.map((day, index) => {
            const daySchedule = schedule[index];
            const slot = daySchedule.slots[0];

            return (
              <div key={day} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">{day}</Label>
                  <Switch
                    checked={slot.isActive}
                    onCheckedChange={() => handleToggleDay(index)}
                  />
                </div>

                {slot.isActive && (
                  <div className="flex items-center gap-2 pl-4">
                    <Input
                      type="time"
                      value={slot.startTime}
                      onChange={(e) =>
                        handleTimeChange(index, "startTime", e.target.value)
                      }
                      className="w-32"
                    />
                    <span className="text-sm text-gray-500">to</span>
                    <Input
                      type="time"
                      value={slot.endTime}
                      onChange={(e) =>
                        handleTimeChange(index, "endTime", e.target.value)
                      }
                      className="w-32"
                    />
                  </div>
                )}
              </div>
            );
          })}

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

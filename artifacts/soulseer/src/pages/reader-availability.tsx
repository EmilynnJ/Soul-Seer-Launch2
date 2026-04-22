import { AppLayout } from "@/components/AppLayout";
import { RequireRole } from "@/components/RequireRole";
import { useGetMyAvailability, useSetMyAvailability } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Loader2, Plus, Trash2, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// Helper to format minute of day (0-1439) to HH:MM AM/PM
function formatMinuteOfDay(minute: number) {
  const h = Math.floor(minute / 60);
  const m = minute % 60;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
}

export default function ReaderAvailabilityPage() {
  return (
    <RequireRole role="reader">
      <AvailabilityContent />
    </RequireRole>
  );
}

function AvailabilityContent() {
  const { data: availability, isLoading } = useGetMyAvailability();
  const { toast } = useToast();
  
  const [slots, setSlots] = useState<{ dayOfWeek: number; startMinute: number; endMinute: number }[]>([]);

  useEffect(() => {
    if (availability) {
      setSlots(availability.map(s => ({
        dayOfWeek: s.dayOfWeek,
        startMinute: s.startMinute,
        endMinute: s.endMinute
      })));
    }
  }, [availability]);

  const setAvail = useSetMyAvailability({
    mutation: {
      onSuccess: () => {
        toast({ title: "Availability updated" });
      },
      onError: (e) => {
        toast({ title: "Failed to update", description: e.message, variant: "destructive" });
      }
    }
  });

  const handleSave = () => {
    setAvail.mutate({ data: { slots } });
  };

  const addSlot = (day: number) => {
    setSlots([...slots, { dayOfWeek: day, startMinute: 540, endMinute: 1020 }]); // Default 9AM to 5PM
  };

  const removeSlot = (index: number) => {
    const newSlots = [...slots];
    newSlots.splice(index, 1);
    setSlots(newSlots);
  };

  const updateSlot = (index: number, field: 'startMinute' | 'endMinute', value: number) => {
    const newSlots = [...slots];
    newSlots[index] = { ...newSlots[index], [field]: value };
    setSlots(newSlots);
  };

  // Generate 30-min interval options
  const timeOptions = [];
  for (let i = 0; i < 48; i++) {
    timeOptions.push({ value: i * 30, label: formatMinuteOfDay(i * 30) });
  }

  if (isLoading) return <AppLayout><div className="flex justify-center py-20"><Loader2 className="animate-spin w-8 h-8 text-primary" /></div></AppLayout>;

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="font-display text-4xl text-primary mb-2">Weekly Availability</h1>
            <p className="font-serif text-muted-foreground">Set the hours you are available for scheduled readings.</p>
          </div>
          <Button onClick={handleSave} disabled={setAvail.isPending} className="font-sans">
            {setAvail.isPending ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            Save Changes
          </Button>
        </div>

        <div className="space-y-6">
          {DAYS.map((dayName, dayIndex) => {
            const daySlots = slots.map((s, i) => ({ ...s, originalIndex: i })).filter(s => s.dayOfWeek === dayIndex);
            
            return (
              <Card key={dayIndex} className="bg-card border-border">
                <CardHeader className="pb-3 border-b border-border/50 flex flex-row items-center justify-between">
                  <CardTitle className="font-sans text-lg">{dayName}</CardTitle>
                  <Button variant="outline" size="sm" onClick={() => addSlot(dayIndex)} className="h-8">
                    <Plus className="w-3 h-3 mr-1" /> Add Hours
                  </Button>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  {daySlots.length === 0 ? (
                    <div className="text-muted-foreground font-serif text-sm italic py-2">Unavailable</div>
                  ) : (
                    <div className="space-y-4">
                      {daySlots.map((slot) => (
                        <div key={slot.originalIndex} className="flex items-center gap-4">
                          <div className="grid grid-cols-2 gap-4 flex-1">
                            <Select 
                              value={slot.startMinute.toString()} 
                              onValueChange={(v) => updateSlot(slot.originalIndex, 'startMinute', parseInt(v))}
                            >
                              <SelectTrigger className="font-sans">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="max-h-[300px]">
                                {timeOptions.map(opt => (
                                  <SelectItem key={opt.value} value={opt.value.toString()}>{opt.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            
                            <Select 
                              value={slot.endMinute.toString()} 
                              onValueChange={(v) => updateSlot(slot.originalIndex, 'endMinute', parseInt(v))}
                            >
                              <SelectTrigger className="font-sans">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="max-h-[300px]">
                                {timeOptions.map(opt => (
                                  <SelectItem key={opt.value} value={opt.value.toString()}>{opt.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => removeSlot(slot.originalIndex)} className="text-muted-foreground hover:text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}

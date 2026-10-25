import { useState, useMemo } from "react";
import { useList } from "@refinedev/core";
import { Lead, Contact, Appointment } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRealtime } from "@/hooks/use-realtime";

interface AppointmentDay {
  appointmentId: number;
  leadName: string;
  time: string;
  type: string;
  finalStatus: string;
  contactName: string;
}

interface DayAppointments {
  [day: number]: AppointmentDay[];
}

const MONTHS = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];

const WEEKDAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

const STATUS_COLORS: Record<string, string> = {
  Confirmé: "bg-green-100 text-green-700 border-green-300",
  Perdu: "bg-red-100 text-red-700 border-red-300",
  Planifié: "bg-blue-100 text-blue-700 border-blue-300",
};

export default function CalendarPage() {
  const leadsListResult = useList<Lead>({ resource: "leads", pagination: { pageSize: 1000 } });
  const appointmentsListResult = useList<Appointment>({ resource: "appointments", pagination: { pageSize: 500 } });
  const contactsListResult = useList<Contact>({ resource: "contacts", pagination: { pageSize: 1000 } });

  const { result: leadsResult } = leadsListResult;
  const { result: appointmentsResult } = appointmentsListResult;
  const { result: contactsResult } = contactsListResult;

  const [currentDate, setCurrentDate] = useState(new Date()); // Current month/year

  // Real-time subscriptions for appointments - call at top level per React's Rules of Hooks
  useRealtime({
    table: "appointments",
    onInsert: () => {
      appointmentsListResult.query?.refetch?.();
    },
    onUpdate: () => {
      appointmentsListResult.query?.refetch?.();
    },
    onDelete: () => {
      appointmentsListResult.query?.refetch?.();
    },
  });

  // Also subscribe to leads changes (for stage updates)
  useRealtime({
    table: "leads",
    onUpdate: () => {
      leadsListResult.query?.refetch?.();
    },
  });

  const leads = leadsResult?.data ?? [];
  const appointments = appointmentsResult?.data ?? [];
  const contacts = contactsResult?.data ?? [];

  // ─── Build calendar data ──────────────────────────────────────────────────

  const calendarData = useMemo(() => {
    const days: DayAppointments = {};

    appointments.forEach((apt) => {
      const lead = leads.find((l) => l.id === apt.leadId);
      const contact = apt.contactId ? contacts.find((c) => c.id === apt.contactId) : null;

      if (lead && (lead.stage === "pre-scheduled" || lead.stage === "confirmed")) {
        // Support both date-only (YYYY-MM-DD) and full ISO datetime strings
        const dateString = apt.appointmentDate?.split("T")[0];
        if (!dateString) return;

        const [year, month, day] = dateString.split("-").map(Number);
        if ([year, month, day].some((n) => Number.isNaN(n))) return;

        // Only show appointments for current month/year
        if (year === currentDate.getFullYear() && month === currentDate.getMonth() + 1) {
          if (!days[day]) days[day] = [];
          days[day].push({
            appointmentId: apt.id,
            leadName: `${lead.prenom} ${lead.nom}`,
            time: apt.appointmentTime,
            type: apt.appointmentType,
            finalStatus: apt.finalStatus || "Planifié",
            contactName: contact ? `${contact.prenom} ${contact.nom}` : `${lead.prenom} ${lead.nom}`,
          });
        }
      }
    });

    return days;
  }, [appointments, leads, contacts, currentDate]);

  // ─── Get days in month ────────────────────────────────────────────────────

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const startDay = firstDay === 0 ? 6 : firstDay - 1;

  const days = [];
  for (let i = 0; i < startDay; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  // ─── Navigation ───────────────────────────────────────────────────────────

  const goToPreviousMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Calendrier</h1>
        <p className="text-muted-foreground">Vue calendrier mensuelle et hebdomadaire des rendez-vous planifiés.</p>
      </div>

      {/* ─── Calendar Header ─── */}
      <div className="bg-white border rounded-lg shadow-sm">
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-lg font-semibold w-40">
              {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <Button variant="outline" size="sm" onClick={goToNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentDate(new Date())}
          >
            Aujourd'hui
          </Button>
        </div>

        {/* ─── Calendar Grid ─── */}
        <div className="p-4">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {WEEKDAYS.map((day) => (
              <div key={day} className="text-center text-sm font-semibold text-muted-foreground py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, idx) => {
              const isToday =
                day !== null &&
                new Date().getDate() === day &&
                new Date().getMonth() === currentDate.getMonth() &&
                new Date().getFullYear() === currentDate.getFullYear();

              return (
                <div
                  key={idx}
                  className={cn(
                    "min-h-24 p-2 border rounded",
                    day === null && "bg-gray-50",
                    day !== null && "bg-white",
                    isToday && "border-blue-500 bg-blue-50"
                  )}
                >
                  {day !== null && (
                    <>
                      <div className={cn("text-sm font-semibold mb-1", isToday ? "text-blue-600" : "text-gray-700")}>
                        {day}
                      </div>
                      <div className="space-y-1">
                        {calendarData[day]?.map((apt) => (
                          <div
                            key={apt.appointmentId}
                            className={cn(
                              "text-xs p-1 rounded border cursor-pointer hover:shadow hover:scale-105 transition-all",
                              STATUS_COLORS[apt.finalStatus]
                            )}
                            title={`${apt.leadName} - ${apt.time} - ${apt.type}`}
                          >
                            <div className="font-semibold truncate">{apt.time}</div>
                            <div className="truncate">{apt.leadName}</div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ─── Legend ─── */}
        <div className="p-4 border-t bg-muted/30 flex gap-4">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded bg-green-300 border border-green-400" />
            <span className="text-sm">Confirmé</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded bg-blue-300 border border-blue-400" />
            <span className="text-sm">Planifié</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded bg-red-300 border border-red-400" />
            <span className="text-sm">Perdu</span>
          </div>
        </div>
      </div>
    </div>
  );
}

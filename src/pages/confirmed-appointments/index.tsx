import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarCheck } from "lucide-react";

export default function ConfirmedAppointmentsPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Rendez-vous Confirmés</h1>
        <p className="text-muted-foreground">
          Leads aux stades "pré-planifié" et "confirmé" avec suivi des rendez-vous.
        </p>
      </div>
      <Card>
        <CardHeader className="flex flex-row items-center gap-3">
          <CalendarCheck className="h-8 w-8 text-muted-foreground" />
          <div>
            <CardTitle>Bientôt disponible</CardTitle>
            <CardDescription>
              Tableau des rendez-vous avec contact principal, niveau d'intérêt, scoring, date planifiée, confirmation,
              rappels et statut final (Confirmé / Perdu).
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Cette page sera disponible dans une prochaine mise à jour.</p>
        </CardContent>
      </Card>
    </div>
  );
}

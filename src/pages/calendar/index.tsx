import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays } from "lucide-react";

export default function CalendarPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Calendrier</h1>
        <p className="text-muted-foreground">Vue calendrier mensuelle et hebdomadaire des rendez-vous planifiés.</p>
      </div>
      <Card>
        <CardHeader className="flex flex-row items-center gap-3">
          <CalendarDays className="h-8 w-8 text-muted-foreground" />
          <div>
            <CardTitle>Bientôt disponible</CardTitle>
            <CardDescription>
              Calendrier mensuel/hebdomadaire avec rendez-vous colorés par statut final, clic pour ouvrir le détail du
              lead, vue par téléopérateur.
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

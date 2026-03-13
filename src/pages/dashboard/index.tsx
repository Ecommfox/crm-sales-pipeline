import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tableau de bord</h1>
        <p className="text-muted-foreground">Vue d'ensemble des performances et des KPIs de l'équipe.</p>
      </div>
      <Card>
        <CardHeader className="flex flex-row items-center gap-3">
          <BarChart3 className="h-8 w-8 text-muted-foreground" />
          <div>
            <CardTitle>Bientôt disponible</CardTitle>
            <CardDescription>
              KPI cards (Total Leads par étape, Appels du jour, Taux de qualification), funnel pipeline, performances
              par téléopérateur.
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

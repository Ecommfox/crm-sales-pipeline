import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

export default function AnalyticsPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">Graphiques et métriques de performance sur la période sélectionnée.</p>
      </div>
      <Card>
        <CardHeader className="flex flex-row items-center gap-3">
          <TrendingUp className="h-8 w-8 text-muted-foreground" />
          <div>
            <CardTitle>Bientôt disponible</CardTitle>
            <CardDescription>
              Graphiques filtrables par plage de dates : appels dans le temps, transitions de stade, distribution des
              scores, funnel de conversion rendez-vous, performances par téléopérateur.
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

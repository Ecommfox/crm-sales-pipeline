import { useState, useMemo } from "react";
import { useList, useUpdate, useInvalidate } from "@refinedev/core";
import { Lead, Contact, Appointment, FinalStatus } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { MoreHorizontal, Check, X, Calendar } from "lucide-react";
import { ScoreBadge } from "@/components/score-badge";
import { CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

// ─── Appointment Item (Lead + Appointment) ────────────────────────────────────

interface AppointmentItem {
  lead: Lead;
  appointment: Appointment;
  contact: Contact | null;
}

// ─── Final Status Action Dialog ────────────────────────────────────────────────

function FinalStatusDialog({
  item,
  open,
  onClose,
  status,
  onConfirm,
}: {
  item: AppointmentItem | null;
  open: boolean;
  onClose: () => void;
  status: "confirmed" | "lost";
  onConfirm: () => void;
}) {
  const title = status === "confirmed" ? "Confirmer le rendez-vous" : "Marquer comme perdu";
  const description =
    status === "confirmed"
      ? `Êtes-vous sûr de vouloir confirmer le rendez-vous pour ${item?.lead.prenom} ${item?.lead.nom}?`
      : `Êtes-vous sûr de vouloir marquer ce rendez-vous comme perdu?`;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">{description}</p>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Annuler</Button>
          </DialogClose>
          <Button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            variant={status === "confirmed" ? "default" : "destructive"}
          >
            {status === "confirmed" ? "Confirmer" : "Marquer comme perdu"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function ConfirmedAppointmentsPage() {
  const { result: leadsResult } = useList<Lead>({ resource: "leads", pagination: { pageSize: 1000 } });
  const { result: appointmentsResult } = useList<Appointment>({ resource: "appointments", pagination: { pageSize: 500 } });
  const { result: contactsResult } = useList<Contact>({ resource: "contacts", pagination: { pageSize: 1000 } });
  const { mutate: updateLead } = useUpdate();
  const { mutate: updateAppointment } = useUpdate();
  const invalidate = useInvalidate();

  const [filterStage, setFilterStage] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [actionDialog, setActionDialog] = useState<{
    open: boolean;
    item: AppointmentItem | null;
    status: "confirmed" | "lost";
  }>({ open: false, item: null, status: "confirmed" });

  const leads = leadsResult?.data ?? [];
  const appointments = appointmentsResult?.data ?? [];
  const contacts = contactsResult?.data ?? [];

  // ─── Combine leads with appointments ───────────────────────────────────────

  const appointmentItems: AppointmentItem[] = useMemo(() => {
    return appointments
      .map((apt: Appointment) => {
        const lead = leads.find((l: Lead) => l.id === apt.leadId);
        const contact = apt.contactId ? (contacts.find((c: Contact) => c.id === apt.contactId) ?? null) : null;
        return lead && (lead.stage === "pre-scheduled" || lead.stage === "confirmed")
          ? { lead, appointment: apt, contact }
          : null;
      })
      .filter((x): x is AppointmentItem => x !== null);
  }, [appointments, leads, contacts]);

  // ─── Filter appointments ──────────────────────────────────────────────────

  const filteredItems = useMemo(() => {
    let result = appointmentItems;

    if (filterStage !== "all") {
      result = result.filter((item) => item.lead.stage === filterStage);
    }

    if (filterStatus !== "all") {
      result = result.filter((item) => (item.appointment.finalStatus || "Planifié") === filterStatus);
    }

    return result;
  }, [appointmentItems, filterStage, filterStatus]);

  // ─── Handle Final Status Change ────────────────────────────────────────────

  const handleUpdateStatus = (item: AppointmentItem, status: FinalStatus) => {
    const newStage = status === "Confirmé" ? "confirmed" : "pre-scheduled";

    updateAppointment({
      resource: "appointments",
      id: item.appointment.id,
      values: { finalStatus: status, confirmed: status === "Confirmé" },
    });

    updateLead({
      resource: "leads",
      id: item.lead.id,
      values: { stage: newStage },
    });

    invalidate({ resource: "appointments", invalidates: ["list"] });
    invalidate({ resource: "leads", invalidates: ["list"] });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Rendez-vous Confirmés</h1>
        <p className="text-muted-foreground">
          Leads aux stades "pré-planifié" et "confirmé" avec suivi des rendez-vous.
        </p>
      </div>

      {/* ─── Filters ─── */}
      <div className="flex gap-4 items-end">
        <div className="space-y-2">
          <Label>Étape</Label>
          <Select value={filterStage} onValueChange={setFilterStage}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="pre-scheduled">Pré-planifié</SelectItem>
              <SelectItem value="confirmed">Confirmé</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Statut</Label>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="Planifié">Planifié</SelectItem>
              <SelectItem value="Confirmé">Confirmé</SelectItem>
              <SelectItem value="Perdu">Perdu</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="ml-auto text-sm text-muted-foreground">
          {filteredItems.length} rendez-vous
        </div>
      </div>

      {/* ─── Table ─── */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Contact Principal</TableHead>
              <TableHead>Société</TableHead>
              <TableHead>Intérêt</TableHead>
              <TableHead>Scoring</TableHead>
              <TableHead>Date RDV</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Confirmé</TableHead>
              <TableHead>Statut Final</TableHead>
              <TableHead className="w-10">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  Aucun rendez-vous trouvé
                </TableCell>
              </TableRow>
            ) : (
              filteredItems.map((item) => {
                const contactName = item.contact
                  ? `${item.contact.prenom} ${item.contact.nom}`
                  : `${item.lead.prenom} ${item.lead.nom}`;
                const finalStatus = (item.appointment.finalStatus || "Planifié") as FinalStatus;

                return (
                  <TableRow key={item.appointment.id}>
                    <TableCell className="font-medium">{contactName}</TableCell>
                    <TableCell>{item.lead.societe}</TableCell>
                    <TableCell>
                      {item.lead.interestLevel && (
                        <Badge
                          variant="outline"
                          className={
                            item.lead.interestLevel === "Élevé"
                              ? "bg-green-50 text-green-700"
                              : item.lead.interestLevel === "Moyen"
                                ? "bg-yellow-50 text-yellow-700"
                                : "bg-red-50 text-red-700"
                          }
                        >
                          {item.lead.interestLevel}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {item.lead.score !== null && item.lead.score !== undefined ? (
                        <ScoreBadge score={item.lead.score} />
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{item.appointment.appointmentDate}</div>
                        <div className="text-muted-foreground">{item.appointment.appointmentTime}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{item.appointment.appointmentType}</Badge>
                    </TableCell>
                    <TableCell>
                      {item.appointment.confirmed ? (
                        <Badge className="bg-green-100 text-green-700">Oui</Badge>
                      ) : (
                        <Badge variant="outline">Non</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          finalStatus === "Confirmé"
                            ? "bg-green-100 text-green-700"
                            : finalStatus === "Perdu"
                              ? "bg-red-100 text-red-700"
                              : "bg-gray-100 text-gray-700"
                        }
                      >
                        {finalStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {finalStatus !== "Confirmé" && (
                            <DropdownMenuItem
                              onClick={() =>
                                setActionDialog({ open: true, item, status: "confirmed" })
                              }
                            >
                              <Check className="h-4 w-4 mr-2" />
                              Confirmer RDV
                            </DropdownMenuItem>
                          )}
                          {finalStatus !== "Perdu" && (
                            <DropdownMenuItem
                              onClick={() =>
                                setActionDialog({ open: true, item, status: "lost" })
                              }
                              className="text-destructive"
                            >
                              <X className="h-4 w-4 mr-2" />
                              Marquer comme perdu
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <Calendar className="h-4 w-4 mr-2" />
                            Voir détails
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* ─── Final Status Dialog ─── */}
      <FinalStatusDialog
        item={actionDialog.item}
        open={actionDialog.open}
        onClose={() => setActionDialog({ ...actionDialog, open: false })}
        status={actionDialog.status}
        onConfirm={() => {
          if (actionDialog.item) {
            const status = actionDialog.status === "confirmed" ? "Confirmé" : "Perdu";
            handleUpdateStatus(actionDialog.item, status as FinalStatus);
          }
        }}
      />
    </div>
  );
}

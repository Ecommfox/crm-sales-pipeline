import { useState, useMemo } from "react";
import { useList, useDelete, useInvalidate } from "@refinedev/core";
import { Link } from "react-router";
import { Contact, Company, Lead } from "@/types";
import { ListView, ListViewHeader } from "@/components/refine-ui/views/list-view";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UserPlus, Search, X, Edit, Trash2, Building2, ExternalLink } from "lucide-react";

import { ContactFormModal } from "@/components/contact-form-modal";

// ─── Delete Confirmation ───────────────────────────────────────────────────────

function DeleteConfirmDialog({
  contact,
  open,
  onClose,
}: {
  contact: Contact | null;
  open: boolean;
  onClose: () => void;
}) {
  const { mutate: deleteContact } = useDelete();
  const invalidate = useInvalidate();

  const handleConfirm = () => {
    if (!contact) return;
    deleteContact(
      { resource: "contacts", id: contact.id },
      {
        onSuccess: () => {
          invalidate({ resource: "contacts", invalidates: ["list"] });
          onClose();
        },
      },
    );
  };

  return (
    <AlertDialog open={open} onOpenChange={(v) => !v && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Supprimer le contact</AlertDialogTitle>
          <AlertDialogDescription>
            Êtes-vous sûr de vouloir supprimer{" "}
            <strong>
              {contact?.civilite} {contact?.prenom} {contact?.nom}
            </strong>{" "}
            ? Cette action est irréversible.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Supprimer
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function ContactsPage() {
  const invalidate = useInvalidate();

  const { result: contactsResult, query: contactsQuery } = useList<Contact>({
    resource: "contacts",
    pagination: { pageSize: 1000 },
  });
  const { result: companiesResult } = useList<Company>({
    resource: "companies",
    pagination: { pageSize: 1000 },
  });
  const { result: leadsResult } = useList<Lead>({
    resource: "leads",
    pagination: { pageSize: 1000 },
  });

  const contacts: Contact[] = contactsResult?.data ?? [];
  const companies: Company[] = companiesResult?.data ?? [];
  const leads: Lead[] = leadsResult?.data ?? [];
  const isLoading = contactsQuery?.isLoading ?? false;

  // Lookup maps
  const companyMap = useMemo(() => {
    const map: Record<number, Company> = {};
    companies.forEach((c) => (map[c.id] = c));
    return map;
  }, [companies]);

  const contactLeadMap = useMemo(() => {
    const map: Record<number, Lead> = {};
    leads.forEach((lead) => {
      if (lead.mainContactId != null) {
        map[lead.mainContactId] = lead;
      }
    });
    return map;
  }, [leads]);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSociete, setFilterSociete] = useState("");
  const [filterFonction, setFilterFonction] = useState("");

  // Modals
  const [createOpen, setCreateOpen] = useState(false);
  const [editContact, setEditContact] = useState<Contact | null>(null);
  const [deleteContact, setDeleteContact] = useState<Contact | null>(null);

  const societeOptions = useMemo(
    () => companies.map((c) => ({ id: String(c.id), label: c.societe })).sort((a, b) => a.label.localeCompare(b.label)),
    [companies],
  );

  const fonctionOptions = useMemo(
    () => [...new Set(contacts.map((c) => c.fonction).filter(Boolean))].sort(),
    [contacts],
  );

  const filteredContacts = useMemo(() => {
    return contacts.filter((contact) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const inNom = contact.nom?.toLowerCase().includes(q);
        const inPrenom = contact.prenom?.toLowerCase().includes(q);
        if (!inNom && !inPrenom) return false;
      }
      if (filterSociete && String(contact.companyId) !== filterSociete) return false;
      if (filterFonction && contact.fonction !== filterFonction) return false;
      return true;
    });
  }, [contacts, searchQuery, filterSociete, filterFonction]);

  const activeFilterCount = [filterSociete, filterFonction].filter(Boolean).length;

  const clearFilters = () => {
    setSearchQuery("");
    setFilterSociete("");
    setFilterFonction("");
  };

  function handleFormSuccess() {
    invalidate({ resource: "contacts", invalidates: ["list"] });
  }

  return (
    <ListView>
      <ListViewHeader title={`Contacts (${filteredContacts.length})`} canCreate={false} />

      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par nom ou prénom..."
            className="pl-8 h-9 text-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <Select value={filterSociete} onValueChange={(v) => setFilterSociete(v === "__all__" ? "" : v)}>
          <SelectTrigger className="h-9 text-sm w-[180px]">
            <SelectValue placeholder="Toutes les sociétés" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Toutes les sociétés</SelectItem>
            {societeOptions.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterFonction} onValueChange={(v) => setFilterFonction(v === "__all__" ? "" : v)}>
          <SelectTrigger className="h-9 text-sm w-[180px]">
            <SelectValue placeholder="Toutes les fonctions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Toutes les fonctions</SelectItem>
            {fonctionOptions.map((f) => (
              <SelectItem key={f} value={f}>
                {f}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {(activeFilterCount > 0 || searchQuery) && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1.5 text-muted-foreground h-9">
            <X className="h-3.5 w-3.5" />
            Effacer
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-0.5 h-4 w-4 p-0 flex items-center justify-center text-xs">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        )}

        <div className="flex-1" />

        <Button size="sm" className="gap-1.5" onClick={() => setCreateOpen(true)}>
          <UserPlus className="h-4 w-4" />
          Ajouter un contact
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-lg border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead className="whitespace-nowrap text-xs font-semibold px-3 py-2 w-16">Civilité</TableHead>
              <TableHead className="whitespace-nowrap text-xs font-semibold px-3 py-2">Nom</TableHead>
              <TableHead className="whitespace-nowrap text-xs font-semibold px-3 py-2">Prénom</TableHead>
              <TableHead className="whitespace-nowrap text-xs font-semibold px-3 py-2">Fonction</TableHead>
              <TableHead className="whitespace-nowrap text-xs font-semibold px-3 py-2">Mail</TableHead>
              <TableHead className="whitespace-nowrap text-xs font-semibold px-3 py-2">Tél. portable</TableHead>
              <TableHead className="whitespace-nowrap text-xs font-semibold px-3 py-2">Société</TableHead>
              <TableHead className="whitespace-nowrap text-xs font-semibold px-3 py-2">Lead lié</TableHead>
              <TableHead className="whitespace-nowrap text-xs font-semibold px-3 py-2 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                  Chargement...
                </TableCell>
              </TableRow>
            ) : filteredContacts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-12">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <UserPlus className="h-8 w-8 opacity-30" />
                    <p className="text-sm">Aucun contact trouvé.</p>
                    {(searchQuery || activeFilterCount > 0) && (
                      <Button variant="ghost" size="sm" onClick={clearFilters}>
                        Effacer les filtres
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredContacts.map((contact) => {
                const company = contact.companyId ? companyMap[contact.companyId] : null;
                const linkedLead = contactLeadMap[contact.id];

                return (
                  <TableRow key={contact.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="px-3 py-2 text-sm">
                      <span className="text-muted-foreground">{contact.civilite}</span>
                    </TableCell>
                    <TableCell className="px-3 py-2 text-sm font-medium">{contact.nom}</TableCell>
                    <TableCell className="px-3 py-2 text-sm">{contact.prenom}</TableCell>
                    <TableCell className="px-3 py-2 text-sm">
                      {contact.fonction ? (
                        <Badge variant="secondary" className="font-normal text-xs">
                          {contact.fonction}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="px-3 py-2 text-sm">
                      {contact.mail ? (
                        <a
                          href={`mailto:${contact.mail}`}
                          className="text-primary hover:underline max-w-[200px] truncate block">
                          {contact.mail}
                        </a>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="px-3 py-2 text-sm">
                      {contact.telephonePortable ? (
                        <a href={`tel:${contact.telephonePortable}`} className="text-primary hover:underline">
                          {contact.telephonePortable}
                        </a>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="px-3 py-2 text-sm">
                      {company ? (
                        <Link
                          to={`/companies/${company.id}`}
                          className="flex items-center gap-1 text-primary hover:underline font-medium whitespace-nowrap">
                          <Building2 className="h-3.5 w-3.5 shrink-0" />
                          {company.societe}
                          <ExternalLink className="h-3 w-3 shrink-0 opacity-60" />
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="px-3 py-2 text-sm">
                      {linkedLead ? (
                        <Link
                          to={`/leads/${linkedLead.id}`}
                          className="flex items-center gap-1 text-primary hover:underline whitespace-nowrap">
                          {linkedLead.prenom} {linkedLead.nom}
                          <ExternalLink className="h-3 w-3 shrink-0 opacity-60" />
                        </Link>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell className="px-3 py-2 text-right">
                      <div className="flex items-center gap-1 justify-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          title="Modifier"
                          onClick={() => setEditContact(contact)}>
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                          title="Supprimer"
                          onClick={() => setDeleteContact(contact)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {!isLoading && filteredContacts.length > 0 && (
        <p className="text-xs text-muted-foreground text-right">
          {filteredContacts.length} contact{filteredContacts.length > 1 ? "s" : ""} affiché
          {filteredContacts.length > 1 ? "s" : ""}
          {contacts.length !== filteredContacts.length && ` sur ${contacts.length}`}
        </p>
      )}

      {/* Create Modal */}
      <ContactFormModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        companies={companies}
        leads={leads}
        onSuccess={handleFormSuccess}
      />

      {/* Edit Modal */}
      <ContactFormModal
        open={!!editContact}
        onOpenChange={(v) => {
          if (!v) setEditContact(null);
        }}
        initialData={editContact}
        companies={companies}
        leads={leads}
        onSuccess={handleFormSuccess}
      />

      {/* Delete Confirmation */}
      <DeleteConfirmDialog contact={deleteContact} open={!!deleteContact} onClose={() => setDeleteContact(null)} />
    </ListView>
  );
}

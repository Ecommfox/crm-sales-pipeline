import { Refine } from "@refinedev/core";
import { BrowserRouter, Routes, Route, Outlet, Navigate } from "react-router";
import {
  PhoneCall,
  LayoutDashboard,
  Star,
  CalendarCheck,
  Calendar,
  Building2,
  Users,
  Settings,
  BarChart2,
} from "lucide-react";

import { dataProvider } from "@/providers/data";
import { authProvider } from "@/providers/auth";
import { useNotificationProvider } from "@/components/refine-ui/notification/use-notification-provider";
import { Toaster } from "@/components/refine-ui/notification/toaster";
import { ThemeProvider } from "@/components/refine-ui/theme/theme-provider";
import { Layout } from "@/components/refine-ui/layout/layout";

import LeadsListPage from "@/pages/leads/list";
import LeadShowPage from "@/pages/leads/show";
import QualifiedLeadsPage from "@/pages/qualified-leads/index";
import ConfirmedAppointmentsPage from "@/pages/confirmed-appointments/index";
import DashboardPage from "@/pages/dashboard/index";
import CalendarPage from "@/pages/calendar/index";
import CompaniesPage from "@/pages/companies/index";
import CompanyShowPage from "@/pages/companies/show";
import ContactsPage from "@/pages/contacts/index";
import SettingsPage from "@/pages/settings/index";
import AnalyticsPage from "@/pages/analytics/index";
import { RefineAiErrorComponent } from "@/components/catch-all";

function App() {
  const notificationProvider = useNotificationProvider();

  return (
    <ThemeProvider defaultTheme="light" storageKey="crm-theme">
      <BrowserRouter>
        <Refine
          dataProvider={dataProvider}
          authProvider={authProvider}
          notificationProvider={notificationProvider}
          resources={[
            {
              name: "dashboard",
              list: "/dashboard",
              meta: {
                label: "Tableau de bord",
                icon: <LayoutDashboard className="h-4 w-4" />,
              },
            },
            {
              name: "leads",
              list: "/leads",
              show: "/leads/:id",
              meta: {
                label: "Leads",
                icon: <PhoneCall className="h-4 w-4" />,
              },
            },
            {
              name: "qualified-leads",
              list: "/qualified-leads",
              meta: {
                label: "Leads qualifiés",
                icon: <Star className="h-4 w-4" />,
              },
            },
            {
              name: "confirmed-appointments",
              list: "/confirmed-appointments",
              meta: {
                label: "Rendez-vous confirmés",
                icon: <CalendarCheck className="h-4 w-4" />,
              },
            },
            {
              name: "calendar",
              list: "/calendar",
              meta: {
                label: "Calendrier",
                icon: <Calendar className="h-4 w-4" />,
              },
            },
            {
              name: "companies",
              list: "/companies",
              show: "/companies/:id",
              meta: {
                label: "Sociétés",
                icon: <Building2 className="h-4 w-4" />,
              },
            },
            {
              name: "contacts",
              list: "/contacts",
              meta: {
                label: "Contacts",
                icon: <Users className="h-4 w-4" />,
              },
            },
            {
              name: "analytics",
              list: "/analytics",
              meta: {
                label: "Analytiques",
                icon: <BarChart2 className="h-4 w-4" />,
              },
            },
            {
              name: "settings",
              list: "/settings",
              meta: {
                label: "Paramètres",
                icon: <Settings className="h-4 w-4" />,
              },
            },
          ]}
          options={{
            syncWithLocation: true,
            warnWhenUnsavedChanges: false,
            title: {
              text: "CRM Téléprospection",
              icon: <PhoneCall className="h-5 w-5" />,
            },
          }}>
          <Routes>
            <Route
              element={
                <Layout>
                  <Outlet />
                </Layout>
              }>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/leads" element={<LeadsListPage />} />
              <Route path="/leads/:id" element={<LeadShowPage />} />
              <Route path="/qualified-leads" element={<QualifiedLeadsPage />} />
              <Route path="/confirmed-appointments" element={<ConfirmedAppointmentsPage />} />
              <Route path="/calendar" element={<CalendarPage />} />
              <Route path="/companies" element={<CompaniesPage />} />
              <Route path="/companies/:id" element={<CompanyShowPage />} />
              <Route path="/contacts" element={<ContactsPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<RefineAiErrorComponent />} />
            </Route>
          </Routes>
          <Toaster />
        </Refine>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;

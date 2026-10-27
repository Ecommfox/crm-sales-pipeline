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
  FileUp,
} from "lucide-react";

import { dataProvider } from "@/providers/data";
import { authProvider } from "@/providers/auth";
import { useNotificationProvider } from "@/components/refine-ui/notification/use-notification-provider";
import { Toaster } from "@/components/refine-ui/notification/toaster";
import { ThemeProvider } from "@/components/refine-ui/theme/theme-provider";
import { Layout } from "@/components/refine-ui/layout/layout";
import { ProtectedRoute } from "@/components/protected-route";

import LoginPage from "@/pages/login";
import RegisterPage from "@/pages/register";
import InvitePage from "@/pages/invite";

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
import ImportPage from "@/pages/import/index";
import ResetPasswordPage from "@/pages/reset-password";
import ProfilePage from "@/pages/profile";
import UserManagementPage from "@/pages/admin/user-management";
import AdminDashboardPage from "@/pages/admin/index";
import AuditLogsPage from "@/pages/admin/audit-logs";
import AdminSettingsPage from "@/pages/admin/settings";
import { RefineAiErrorComponent } from "@/components/catch-all";
import { SettingsAccessGuard } from "@/components/settings-access-guard";
import { supabaseClient } from "@/lib/supabaseClient";

function App() {
  const notificationProvider = useNotificationProvider();

  return (
    <ThemeProvider defaultTheme="light" storageKey="crm-theme">
      <BrowserRouter>
        <Refine
          dataProvider={dataProvider}
          authProvider={authProvider}
          accessControlProvider={{
            can: async ({ resource }) => {
              const { data: userData, error: userError } = await supabaseClient.auth.getUser();
              if (userError) throw userError;
              if (!userData.user) return { can: false };

              const { data: profile, error: profileError } = await supabaseClient
                .from("user_profiles")
                .select("role")
                .eq("id", userData.user.id)
                .maybeSingle();

              if (profileError) throw profileError;
              if (!profile) return { can: false, reason: "User role is unavailable." };

              if (resource === "settings") {
                if (profile.role === "admin") return { can: true };
                const { data: permission, error: permissionError } = await supabaseClient
                  .from("role_settings_permissions")
                  .select("can_view_settings")
                  .eq("role", profile.role)
                  .maybeSingle();

                if (permissionError) throw permissionError;
                return { can: permission?.can_view_settings ?? false };
              }

              if (resource?.startsWith("admin")) {
                return { can: profile.role === "admin" };
              }

              return { can: true };
            },
          }}
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
              name: "import",
              list: "/import",
              meta: {
                label: "Importer des Leads",
                icon: <FileUp className="h-4 w-4" />,
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
            {/* Public Auth Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/invite/:token" element={<InvitePage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            {/* Protected Routes */}
            <Route
              element={
                <ProtectedRoute>
                  <Layout>
                    <Outlet />
                  </Layout>
                </ProtectedRoute>
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
              <Route path="/import" element={<ImportPage />} />
              <Route path="/settings" element={<SettingsAccessGuard><SettingsPage /></SettingsAccessGuard>} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/admin" element={<AdminDashboardPage />} />
              <Route path="/admin/users" element={<UserManagementPage />} />
              <Route path="/admin/audit-logs" element={<AuditLogsPage />} />
              <Route path="/admin/settings" element={<AdminSettingsPage />} />
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

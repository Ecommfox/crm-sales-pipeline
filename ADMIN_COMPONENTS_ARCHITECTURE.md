# Admin Dashboard - Component Architecture

## File Structure
```
src/pages/admin/
├── index.tsx                          # Main admin dashboard page
├── layout.tsx                         # Admin layout wrapper
├── overview.tsx                       # Overview/stats tab
├── user-management.tsx                # Users list & editing
├── role-management.tsx                # Permissions matrix
├── audit-logs.tsx                     # Activity tracking
├── settings.tsx                       # System settings
└── components/
    ├── user-table.tsx                 # User list table with inline editing
    ├── user-detail-modal.tsx          # Edit user modal
    ├── invite-user-dialog.tsx         # Invite new user form
    ├── role-badge.tsx                 # Role display component
    ├── status-indicator.tsx           # Active/Inactive status
    ├── audit-log-entry.tsx            # Single audit log entry
    ├── stats-card.tsx                 # Stats cards for overview
    ├── permissions-matrix.tsx         # Role permission grid
    └── confirm-action-dialog.tsx      # Confirmation for critical actions
```

## Component Hierarchy

```
AdminDashboard (index.tsx)
├── AdminLayout
│   ├── Sidebar Navigation
│   │   ├── Overview Link
│   │   ├── User Management Link
│   │   ├── Roles & Permissions Link
│   │   ├── Audit Logs Link
│   │   ├── Settings Link
│   │   └── Back to CRM Link
│   │
│   └── Content Area (Tabs)
│       ├── OverviewTab
│       │   ├── StatsCard (4x)
│       │   │   ├── Total Users
│       │   │   ├── Active Users
│       │   │   ├── Teleoperators
│       │   │   └── Pending Invites
│       │   └── RecentActivitySection
│       │       └── AuditLogEntry (multiple)
│       │
│       ├── UserManagementTab
│       │   ├── SearchBar
│       │   ├── FilterBar
│       │   ├── InviteUserButton
│       │   ├── UserTable
│       │   │   ├── TableHeader
│       │   │   ├── TableRow (multiple)
│       │   │   │   ├── Email
│       │   │   │   ├── Name
│       │   │   │   ├── RoleBadge (with dropdown)
│       │   │   │   ├── StatusIndicator
│       │   │   │   ├── JoinDate
│       │   │   │   └── ActionButtons
│       │   │   └── TableFooter (pagination)
│       │   ├── UserDetailModal
│       │   │   ├── EmailField
│       │   │   ├── NameField
│       │   │   ├── DepartmentField
│       │   │   ├── RoleDropdown
│       │   │   ├── StatusToggle
│       │   │   ├── MFAInfo
│       │   │   ├── LastLoginInfo
│       │   │   └── ActionButtons
│       │   └── InviteUserDialog
│       │       ├── EmailInput
│       │       ├── NameInput
│       │       ├── DepartmentSelect
│       │       ├── RoleRadioGroup
│       │       ├── SendEmailCheckbox
│       │       ├── RequireMFACheckbox
│       │       └── ActionButtons
│       │
│       ├── RoleManagementTab
│       │   └── PermissionsMatrix
│       │       ├── FeatureRow (multiple)
│       │       │   ├── FeatureName
│       │       │   └── RoleCheckbox (4x)
│       │       └── LegendsAndNotes
│       │
│       ├── AuditLogsTab
│       │   ├── FilterBar
│       │   │   ├── ActionTypeFilter
│       │   │   ├── DateRangeFilter
│       │   │   └── SearchInput
│       │   ├── ExportButton
│       │   ├── AuditLogsList
│       │   │   └── AuditLogEntry (multiple)
│       │   │       ├── UserInfo
│       │   │       ├── ActionType
│       │   │       ├── Timestamp
│       │   │       └── Details
│       │   └── Pagination
│       │
│       └── SettingsTab
│           ├── GeneralSettings Section
│           │   ├── OrganizationNameInput
│           │   ├── LanguageSelect
│           │   └── TimezoneSelect
│           ├── SecuritySettings Section
│           │   ├── RequireMFAToggle
│           │   ├── LoginNotificationsToggle
│           │   ├── PasswordExpiryToggle
│           │   └── IPWhitelistToggle
│           ├── ScoringSettings Section
│           │   ├── HighInterestThreshold
│           │   ├── MediumInterestThreshold
│           │   └── LowInterestThreshold
│           ├── NotificationSettings Section
│           │   ├── RegistrationEmailToggle
│           │   ├── RoleChangeEmailToggle
│           │   ├── FailedLoginEmailToggle
│           │   └── DailySummaryToggle
│           └── ActionButtons
│               ├── ResetDefaults
│               ├── Cancel
│               └── SaveChanges
```

## Data Types

### User Profile (matching Supabase)
```typescript
interface UserProfile {
  id: string;                    // UUID
  email: string;
  fullName?: string;
  role: 'admin' | 'manager' | 'teleoperator' | 'viewer';
  department?: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}
```

### Audit Log Entry
```typescript
interface AuditLogEntry {
  id: string;
  userId: string;
  userName: string;
  action: string;                // 'role_changed', 'user_created', etc.
  resourceType: string;          // 'user', 'lead', 'setting', etc.
  resourceId?: string;
  oldValue?: any;
  newValue?: any;
  timestamp: string;
  ipAddress?: string;
}
```

### System Settings
```typescript
interface SystemSettings {
  organizationName: string;
  defaultLanguage: string;
  timezone: string;
  requireMFA: boolean;
  loginNotifications: boolean;
  passwordExpiry: boolean;
  ipWhitelist: boolean;
  highInterestThreshold: number;
  mediumInterestThreshold: number;
  lowInterestThreshold: number;
  registrationEmail: boolean;
  roleChangeEmail: boolean;
  failedLoginEmail: boolean;
  dailySummary: boolean;
}
```

## Key Features to Implement

### 1. User Management
- [ ] List all users with pagination
- [ ] Search/filter by email, name, role, status
- [ ] Inline role dropdown (update role instantly)
- [ ] Toggle user active/inactive status
- [ ] Edit user details in modal
- [ ] Invite new users via email
- [ ] Bulk actions (select multiple users)

### 2. Role Management
- [ ] Display permission matrix
- [ ] Show what each role can/cannot do
- [ ] Edit / test permission scenarios
- [ ] Export permission matrix as CSV

### 3. Audit Logging
- [ ] Log all admin actions automatically
- [ ] Display user activity timeline
- [ ] Filter by action type, date range, user
- [ ] Searchable activity log
- [ ] Export audit logs

### 4. Settings Management
- [ ] Save/update system-wide settings
- [ ] Reset to defaults
- [ ] Validate threshold values
- [ ] Show confirmation before major changes

### 5. Security
- [ ] Enforce admin-only access via useUserRole hook
- [ ] Confirm critical actions with dialog
- [ ] Log all setting changes to audit trail
- [ ] Disable buttons for non-admin users

## Dark Mode Considerations
- Admin dashboard should work seamlessly with your existing light/dark theme
- Use the same shadcn/ui components
- Consistent with rest of CRM styling

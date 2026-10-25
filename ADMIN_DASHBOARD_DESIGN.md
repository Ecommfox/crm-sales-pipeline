# Admin Dashboard UI Design

## Overview
The admin dashboard provides complete user and system management for CRM administrators.

---

## 1. MAIN ADMIN DASHBOARD (Overview Tab)

### Header
```
┌─────────────────────────────────────────────────────────────────────────┐
│  Admin Dashboard                                                   👤 Admin │
│  System & User Management                                                 │
└─────────────────────────────────────────────────────────────────────────┘
```

### Stats Cards (Top Row)
```
┌──────────────────┬──────────────────┬──────────────────┬──────────────────┐
│ Total Users      │ Active Users     │ Teleoperators    │ Pending Invites  │
│      24          │      18          │      12          │       2          │
│ ↑ +3 this month  │ ↓ -1 this week   │ Team capacity OK │ Awaiting response│
└──────────────────┴──────────────────┴──────────────────┴──────────────────┘
```

### Recent Activity Section
```
┌─── Recent User Actions ──────────────────────────────────────────────────┐
│                                                                           │
│  User                    Action              Changed         Time        │
│  ─────────────────────────────────────────────────────────────────────── │
│  📌 Sarah Martin         Role updated        manager→admin   2 hrs ago   │
│  📌 Jean Dupont          Deactivated         Active→Inactive 5 hrs ago   │
│  📌 Marie Lefevre        Registered          New account     1 day ago    │
│  📌 Pierre Rousseau      Role updated        viewer→mgr      2 days ago  │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘
```

---

## 2. USER MANAGEMENT TAB

### Filter & Search Bar
```
┌─────────────────────────────────────────────────────────────────────────┐
│ [🔍 Search users...] [Filter ▼] [Status ▼] [Role ▼] [+ Invite User]   │
└─────────────────────────────────────────────────────────────────────────┘
```

### User List Table
```
┌────────────────────────────────────────────────────────────────────────────────────────────┐
│ Email                    │ Name              │ Role          │ Status    │ Joined   │ Action│
├────────────────────────────────────────────────────────────────────────────────────────────┤
│ admin@company.fr         │ You (Admin)       │ [ADMIN ⭐]    │ ✓ Active  │ Jan 2025 │ ─────│
│                          │                   │               │           │          │      │
│ sarah.martin@company.fr  │ Sarah Martin      │ [MANAGER ▼]   │ ✓ Active  │ Feb 2025 │ ⋮    │
│                          │                   │               │           │          │ Edit │
│ marie.dupont@company.fr  │ Marie Dupont      │ [TELEOP. ▼]   │ ✓ Active  │ Mar 2025 │ ─────│
│                          │                   │               │           │          │      │
│ jean.lefevre@company.fr  │ Jean Lefevre      │ [VIEWER ▼]    │ ⏸ Inactive│ Jan 2025 │ ⋮    │
│                          │                   │               │           │          │ Edit │
│ pierre.rousseau@co.fr    │ Pierre Rousseau   │ [TELEOP. ▼]   │ ✓ Active  │ Mar 2025 │ ─────│
│                          │                   │               │           │          │      │
└────────────────────────────────────────────────────────────────────────────────────────────┘
```

### Role Dropdown Example
When clicking [MANAGER ▼]:
```
┌──────────────────────┐
│ Admin        ⭐      │
│ Manager      👔      │
│ Teleoperator 📞      │
│ Viewer       👁️      │
└──────────────────────┘
```

### User Detail Modal (on Edit)
```
┌─────────────────────────────────────────────────────────────────────────┐
│  Edit User: Sarah Martin                                           ✕    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Email: sarah.martin@company.fr                                         │
│  Full Name: Sarah Martin                                                │
│  Department: Sales & Prospecting                                        │
│                                                                          │
│  Current Role:  [MANAGER ▼]                                             │
│                 └─ Can view all data, manage team, edit settings        │
│                                                                          │
│  Account Status:                                                         │
│  ✓ Active                    ☐ Inactive                                 │
│                                                                          │
│  Multi-Factor Auth: ✓ Enabled                                           │
│  Last Login: Today at 14:32                                             │
│  Password Reset: Never (user can reset)                                 │
│                                                                          │
│  ────────────────────────────────────────────────────────────────────── │
│  [Send Password Reset Email]  [Cancel]  [Save Changes]                  │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 3. ROLE MANAGEMENT TAB

### Role Permission Matrix
```
┌────────────────────────────────────────────────────────────────────────────┐
│  Role Permissions & Capabilities                                           │
├────────────────────────────────────────────────────────────────────────────┤
│                        │ Admin │ Manager │ Teleop │ Viewer │
│  ────────────────────────────────────────────────────────────────────      │
│  View All Data         │  ✓    │   ✓     │  ✗*   │   ✓    │  *own data  │
│  Create/Edit Leads     │  ✓    │   ✓     │   ✓   │   ✗    │             │
│  Delete Records        │  ✓    │   ✗     │   ✗   │   ✗    │             │
│  Log Calls             │  ✓    │   ✓     │   ✓   │   ✗    │             │
│  Schedule Appointments │  ✓    │   ✓     │   ✓   │   ✗    │             │
│  View Analytics        │  ✓    │   ✓     │   ✗   │   ✓    │             │
│  Manage Users          │  ✓    │   ✗     │   ✗   │   ✗    │             │
│  Manage Settings       │  ✓    │   ✗     │   ✗   │   ✗    │             │
│  View Audit Logs       │  ✓    │   ✓     │   ✗   │   ✗    │             │
│                                                                             │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. AUDIT LOGS TAB

### Activity Timeline
```
┌────────────────────────────────────────────────────────────────────────────┐
│  Audit Log - System Activity                                    [Export 📥]│
├────────────────────────────────────────────────────────────────────────────┤
│  Filter: [All Actions ▼] [Last 30 Days ▼] [🔍 Search...]   [Clear Filter] │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  📌  Sarah Martin        Updated lead score        Lead #4521   Today     │
│      User Action          "Interest level upgraded to Élevé"     14:32    │
│                                                                             │
│  ────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  👥  Admin Panel         User role changed         Sarah Martin  Yesterday  │
│      Admin Action        "Promoted from manager to admin"        09:15     │
│                                                                             │
│  ────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  📊  Jean Dupont         Generated report          Call Analysis  2 days   │
│      User Action         "Exported Q1 2025 metrics"              16:45     │
│                                                                             │
│  ────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  ⚙️   Admin Panel         Settings updated         System Config  3 days   │
│      Admin Action        "Updated scoring thresholds"            11:20     │
│                                                                             │
└────────────────────────────────────────────────────────────────────────────┘
Showing 1-4 of 247 events
```

---

## 5. SETTINGS TAB

### System Configuration
```
┌────────────────────────────────────────────────────────────────────────────┐
│  System Settings                                                    [Save]  │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  📋 General Settings                                                       │
│  ──────────────────────────────────────────────────────────────────      │
│  Organization Name: [EcommFox Digital          ]                          │
│  Default Language: [Français ▼]                                            │
│  Timezone: [Europe/Paris ▼]                                                │
│                                                                             │
│  🔐 Security Settings                                                      │
│  ──────────────────────────────────────────────────────────────────      │
│  ☑ Require Multi-Factor Authentication                                     │
│  ☑ Enable Login Activity Notifications                                     │
│  ☐ Enforce Password Changes Every 90 Days                                  │
│  ☐ Restrict Login to IP Whitelist                                          │
│                                                                             │
│  ⏱️  Scoring Settings                                                       │
│  ──────────────────────────────────────────────────────────────────      │
│  High Interest Threshold: [75 ▼]                                           │
│  Medium Interest Threshold: [50 ▼]                                         │
│  Low Interest Threshold: [25 ▼]                                            │
│                                                                             │
│  📧 Notification Settings                                                  │
│  ──────────────────────────────────────────────────────────────────      │
│  Send Email on User Registration: ☑                                        │
│  Send Email on Role Change: ☑                                              │
│  Send Email on Failed Logins: ☑                                            │
│  Daily Summary Report: ☑                                                   │
│                                                                             │
├────────────────────────────────────────────────────────────────────────────┤
│  [Reset to Defaults]  [Cancel]  [Save Changes]                             │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. INVITE NEW USER DIALOG

### When clicking "+ Invite User"
```
┌─────────────────────────────────────────────────────────────────────────┐
│  Invite New User                                                   ✕    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Email Address: [john.smith@company.fr________________]                  │
│                                                                          │
│  Full Name: [John Smith____________________________]                      │
│                                                                          │
│  Department: [Sales & Prospecting_______________ ▼]                      │
│                                                                          │
│  Assign Role:                                                            │
│  ❍ Admin        (Full access, system management)                         │
│  ⦿ Manager      (Team oversight, data access)                            │
│  ❍ Teleoperator (Call logging and lead management)                       │
│  ❍ Viewer       (Read-only, analytics & reports)                         │
│                                                                          │
│  □ Send invitation email immediately                                     │
│  □ Require MFA setup on first login                                      │
│                                                                          │
│  ────────────────────────────────────────────────────────────────────── │
│  [Cancel]  [Send Invitation]                                             │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 7. SIDEBAR NAVIGATION

```
┌─────────────────────────────┐
│  🏢 Admin                   │
│  ────────────────────────── │
│  📊 Overview                │  ← Main dashboard
│  👥 User Management         │  ← User list & editing
│  🔑 Roles & Permissions     │  ← Permission matrix
│  📋 Audit Logs              │  ← Activity tracking
│  ⚙️  Settings               │  ← System config
│  ────────────────────────── │
│  📞 Back to CRM             │  ← Return to main app
│                             │
└─────────────────────────────┘
```

---

## 8. KEY FEATURES & INTERACTIONS

### User Status Indicators
- **✓ Active** - User can log in, used normally
- **⏸ Inactive** - User account frozen, cannot log in
- **⏳ Pending** - Invitation sent, awaiting acceptance
- **⚠️ Suspended** - Account flagged for suspicious activity

### Role Badges with Icons
- **⭐ Admin** - Red/primary color
- **👔 Manager** - Blue/secondary color
- **📞 Teleoperator** - Green/accent color
- **👁️ Viewer** - Gray/muted color

### Action Buttons per User
- **Edit** - Modify name, department, role, status
- **More (⋮)** - Secondary actions:
  - Force Password Reset
  - Revoke Sessions
  - View Login History
  - Approve/Deny Action
  - Delete Account

### Bulk Actions
```
☐ Select All  [3 selected]  [Change Role ▼]  [Bulk Status ▼]  [Delete ✕]
```

---

## 9. MOBILE RESPONSIVE

On mobile, the dashboard would:
- Stack cards vertically
- Convert table to card view (swipeable)
- Collapse sidebar to hamburger menu
- Full-width modals

Example mobile user card:
```
┌──────────────────────────┐
│ sarah.martin@company.fr  │
│ Sarah Martin             │
│ Role: [MANAGER ▼]        │
│ Status: ✓ Active         │
│ Joined: Feb 2025         │
│ [Edit] [More ⋮]          │
└──────────────────────────┘
```

---

## 10. COLOR SCHEME

| Element | Color | Use |
|---------|-------|-----|
| Admin | `#dc2626` (Red) | Primary danger/authority |
| Manager | `#2563eb` (Blue) | Secondary/trusted |
| Teleoperator | `#16a34a` (Green) | Active/working |
| Viewer | `#6b7280` (Gray) | Restricted/limited |
| Active Status | `#10b981` (Green) | Good state |
| Inactive Status | `#ef4444` (Red) | Disabled state |

---

## APPROVAL CHECKLIST
- [ ] Layout & sections meet your needs
- [ ] Role hierarchy makes sense
- [ ] Permissions matrix is clear
- [ ] Audit logging is detailed enough
- [ ] Mobile responsiveness is acceptable
- [ ] Color coding is intuitive
- [ ] Any sections to add/remove/modify?

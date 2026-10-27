# CRM admin & account access action plan

This repository should follow the instructions below when implementing or revising the admin, profile, role-management, and password reset flow.

## Project constraints

- Keep `.env.local` in the repo root and never commit it.
- Treat the live Supabase project as the source of truth for schema and RLS.
- Do not recreate `user_profiles` or `audit_logs` if they already exist in the database.
- Verify database state before applying any SQL migration.
- Keep all admin access logic consistent between frontend UI and database policies.

## Required implementation order

### 1) Environment and database baseline

- Ensure `.env.local` contains the required Supabase values already expected by the app (for example `VITE_SUPABASE_PROJECT_ID` and `VITE_SUPABASE_API_KEY`).
- Confirm the environment file remains in `.gitignore` and is not committed.
- Check that `user_profiles` and `audit_logs` already exist in the live Supabase instance.
- If either table is missing, add the migration carefully and only once.
- Validate that RLS is corrected and free of recursive policies.

### 2) Role and admin access

- Keep `isAdmin` resolution centralized in the auth/user-role logic.
- Use the logic pattern below for admin-only screens:

```tsx
if (!roleLoading && !isAdmin) {
  return <UserProfileComponent />;
}
```

- On `/admin`, non-admin users must only see the user profile component.
- Direct admin subroutes must remain blocked for non-admin users.
- Admin users must see the admin page route containing the following sections:
  - admin dashboard
  - user management
  - audit logs
  - admin settings
- This admin route must be linked from the user dropdown menu.

### 3) User profile component

Create a reusable `UserProfileComponent` that shows:

- Name
- Surname
- Email (read-only, cannot be changed)
- Role
- Number of calls completed today

This component should be available for both admin and non-admin users and should be the default profile view when the user is not an admin.

### 4) Settings permissions by role

- Add a `canViewSettings` flag as a role-level setting, not a per-user flag.
- In the user management page, allow the admin to choose which roles can view the settings page.
- Each role must have an explicit checkbox/toggle for `canViewSettings`.
- The settings page must respect the role-level flag before rendering.
- Keep the setting under admin control and do not expose it to standard users.

### 5) Password reset flow

- Activate the forgot-password flow in the login form.
- Ensure the app has the reset-password route, such as `/reset-password`.
- Use Supabase Auth password reset flow rather than a custom workaround.
- Configure a valid default sender email / SMTP settings in Supabase so password reset emails can be sent safely.
- Document the email sender configuration required for production and troubleshooting.

### 6) Production safety and visibility

- If a mock fallback is enabled, make it visible only in non-production environments or remove it entirely from production.
- Do not expose development-only fallback behavior in the production app.

## Acceptance criteria

The feature is considered complete when all of the following are true:

- `.env.local` is correctly configured and gitignored
- `user_profiles` and `audit_logs` are confirmed present or created via safe migration
- RLS policies are valid and do not recurse
- `/reset-password` works with Supabase Auth
- Forgot password is enabled from the login form
- Admin users can access the admin page and its subpages
- Non-admin users are redirected to the profile-only view on `/admin`
- User profile contains the requested data points and email is immutable
- `canViewSettings` is managed at the role level
- Settings access is enforced correctly by role
- Password reset emails are sent with valid Supabase sender config

## Working principles

- Prefer secure database enforcement over frontend-only permission checks.
- Prefer explicit, readable role logic over hidden permissions.
- Keep changes small and traceable.
- Validate behavior after DB, auth, and UI updates.
- Do not commit private environment values or secrets.

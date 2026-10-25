// src/pages/invite.tsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { supabaseClient } from "@/lib/supabaseClient";
import { getInvitationByToken } from "@/lib/invitationService";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, Mail } from "lucide-react";
import type { PendingInvitation } from "@/types";

export default function InvitePage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [invitation, setInvitation] = useState<PendingInvitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const validateInvitation = async () => {
      try {
        if (!token) {
          setError("Invalid invitation link");
          setLoading(false);
          return;
        }

        // Check if user is already logged in
        const { data: userData } = await supabaseClient.auth.getUser();
        if (userData.user) {
          // Already logged in, redirect to dashboard
          navigate("/dashboard");
          return;
        }

        // Get invitation by token
        const inv = await getInvitationByToken(token);

        if (!inv) {
          setError("This invitation has expired or is no longer valid");
        } else {
          setInvitation(inv);
        }
      } catch (err: any) {
        setError(err.message || "Failed to validate invitation");
        console.error("Error validating invitation:", err);
      } finally {
        setLoading(false);
      }
    };

    validateInvitation();
  }, [token, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Validating Invitation...</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-center">Please wait</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Invitation Invalid
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertDescription>{error || "This invitation is no longer valid"}</AlertDescription>
            </Alert>

            <p className="text-sm text-muted-foreground">
              If you believe this is an error, please contact your administrator or try requesting
              a new invitation.
            </p>

            <Button
              className="w-full"
              onClick={() => navigate("/login")}
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-5 w-5" />
            You're Invited!
          </CardTitle>
          <CardDescription>
            You've been invited to join the team
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <Alert className="border-green-200 bg-green-50">
            <Mail className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Invitation is valid and ready to use
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase">Email</p>
              <p className="text-lg font-medium">{invitation.email}</p>
            </div>

            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase">Role</p>
              <p className="text-lg capitalize">
                {invitation.role.charAt(0).toUpperCase() + invitation.role.slice(1)}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase">
                Invitation Expires
              </p>
              <p className="text-sm">
                {new Date(invitation.expires_at).toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>

          <Button
            className="w-full"
            onClick={() => navigate("/register", { state: { inviteEmail: invitation.email, inviteToken: token } })}
          >
            Sign Up Now
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Already have an account?{" "}
            <Button
              variant="link"
              className="p-0 h-auto"
              onClick={() => navigate("/login")}
            >
              Sign In
            </Button>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

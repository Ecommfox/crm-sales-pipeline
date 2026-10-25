import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { supabaseClient } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2, CheckCircle } from "lucide-react";
import { acceptInvitation, getInvitationByToken } from "@/lib/invitationService";
import type { PendingInvitation } from "@/types";

export default function RegisterPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [invitation, setInvitation] = useState<PendingInvitation | null>(null);

  // Get invite details from location state
  const inviteEmail = (location.state as any)?.inviteEmail || "";
  const inviteToken = (location.state as any)?.inviteToken || "";

  useEffect(() => {
    if (inviteEmail) {
      setEmail(inviteEmail);
    }

    // Validate invite token if provided
    if (inviteToken) {
      const validateInvite = async () => {
        const inv = await getInvitationByToken(inviteToken);
        setInvitation(inv);
      };
      validateInvite();
    }
  }, [inviteEmail, inviteToken]);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      setLoading(false);
      return;
    }

    try {
      // Sign up user
      const { error: signUpError, data } = await supabaseClient.auth.signUp({
        email,
        password,
      });

      if (signUpError) throw signUpError;

      const userId = data.user?.id;
      if (!userId) throw new Error("Failed to create user account");

      // Auto-login after successful registration
      const { error: signInError } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      // Determine the role based on invitation or default
      const userRole = invitation?.role || "viewer";

      // Create user profile - ALWAYS do this for every new user
      const { error: profileError } = await supabaseClient
        .from("user_profiles")
        .upsert([
          {
            id: userId,
            email,
            role: userRole,
            is_active: true,
            full_name: email.split("@")[0], // Use email prefix as initial name
          },
        ], { onConflict: "id" });

      if (profileError) {
        console.error("Profile error:", profileError);
        throw profileError;
      }

      // If invitation exists, mark it as accepted
      if (invitation && inviteToken) {
        const accepted = await acceptInvitation(inviteToken);
        if (!accepted) {
          console.warn("Failed to mark invitation as accepted");
        }
      }

      setSuccess(true);
      setTimeout(() => navigate("/dashboard"), 1500);
    } catch (err: any) {
      setError(err.message || "Registration failed. Please try again.");
      console.error("Registration error:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-2xl">
            {invitation ? "Accept Invitation" : "Create Account"}
          </CardTitle>
          <CardDescription>
            {invitation ? `Join as ${invitation.role}` : "Join CRM Teleprospecting"}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {invitation && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                You've been invited to join the team!
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                ✓ Account created successfully! Redirecting...
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading || success || !!inviteEmail}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                This will be used as your display name initially
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading || success}
                required
                minLength={6}
              />
              <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading || success}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading || success}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : success ? (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Account Created!
                </>
              ) : (
                invitation ? "Accept & Create Account" : "Create Account"
              )}
            </Button>
          </form>

          <div className="text-center text-sm text-gray-600 pt-2">
            Already have an account?{" "}
            <button
              onClick={() => navigate("/login")}
              className="text-blue-600 hover:underline font-medium">
              Sign in
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

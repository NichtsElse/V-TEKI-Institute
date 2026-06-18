/**
 * Purpose: Render the manual email/password login screen for local demo accounts.
 * Used by: Public auth route `/login`.
 * Main dependencies: appClient auth helpers, shadcn form controls, and AuthLayout.
 * Public/main functions: Default `Login` page export.
 * Important side effects: Creates an auth session and redirects users after successful sign-in.
 */
import React, { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { appClient } from "@/api/appClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn, Mail, Lock, Loader2 } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import GoogleIcon from "@/components/GoogleIcon";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await appClient.auth.loginViaEmailPassword(email.trim(), password);
      window.location.href = redirectUrl;
    } catch (err) {
      setError(err.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = () => {
    appClient.auth.loginWithProvider("google", redirectUrl);
  };

  return (
    <AuthLayout
      icon={LogIn}
      title="Welcome back"
      subtitle="Log in with your email and password"
      footer={
        <>
          Don't have an account?{" "}
          <Link to={`/register?redirect=${encodeURIComponent(redirectUrl)}`} className="text-primary font-medium hover:underline">
            Create one
          </Link>
        </>
      }
    >
      <Button
        variant="outline"
        className="w-full h-12 text-sm font-medium mb-6"
        onClick={handleGoogle}
      >
        <GoogleIcon className="w-5 h-5 mr-2" />
        Continue with Google
      </Button>

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-3 text-muted-foreground">or</span>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      <div className="mb-4 rounded-xl border border-border bg-muted/40 p-4 text-sm">
        <p className="font-medium mb-2">Login flow</p>
        <div className="space-y-1 text-muted-foreground">
          <p>Use the local account email and password shown below.</p>
          <p>Role access follows the local demo account after login.</p>
        </div>
      </div>

      <div className="mb-4 rounded-xl border border-border bg-background p-4 text-sm">
        <p className="font-medium mb-2">Quick access accounts</p>
        <div className="space-y-1 text-muted-foreground">
          <p><span className="font-medium text-foreground">Admin:</span> admin@vteki.local / admin123</p>
          <p><span className="font-medium text-foreground">Trainer:</span> trainer@vteki.local / trainer123</p>
          <p><span className="font-medium text-foreground">Corporate PIC:</span> corporate@vteki.local / corporate123</p>
          <p><span className="font-medium text-foreground">Participant:</span> participant@vteki.local / participant123</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              autoFocus
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link to="/forgot-password" className="text-xs text-primary hover:underline">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>
        <Button type="submit" className="w-full h-12 font-medium" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Logging in...
            </>
          ) : (
            "Log in"
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}

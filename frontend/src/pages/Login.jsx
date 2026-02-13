import { useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";
import { Building2, ShieldCheck, Wallet, Workflow } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, setSessionToken } from "@/lib/api";

export default function Login() {
  const { data: setupStatus } = api.auth.adminSetupStatus.useQuery();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const loginMutation = api.auth.login.useMutation({
    onSuccess: (data) => {
      if (data?.token) {
        setSessionToken(data.token);
      }
      toast.success("Login successful");
      window.location.href = "/";
    },
    onError: (error) => {
      toast.error(error.message || "Invalid email or password");
      setIsLoading(false);
    },
  });

  const handleSubmit = (event) => {
    event.preventDefault();
    setIsLoading(true);

    if (!email || !password) {
      toast.error("Please enter both email and password");
      setIsLoading(false);
      return;
    }

    loginMutation.mutate({ email, password });
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.15fr_1fr]">
      <div className="auth-backdrop relative hidden overflow-hidden p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 opacity-50">
          <div className="absolute -left-20 top-10 h-64 w-64 rounded-full bg-blue-400/30 blur-3xl" />
          <div className="absolute -right-20 bottom-10 h-72 w-72 rounded-full bg-cyan-300/20 blur-3xl" />
        </div>

        <div className="relative z-10">
          <div className="inline-flex items-center gap-3 rounded-xl border border-white/20 bg-white/10 px-4 py-2 backdrop-blur-sm">
            <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 text-sm font-bold">
              D
            </div>
            <span className="text-sm font-semibold tracking-wide">DWS Policy Management</span>
          </div>

          <h1 className="mt-10 max-w-lg text-4xl font-bold leading-tight">
            Industry-ready operations for policies, approvals, and payouts.
          </h1>
          <p className="mt-4 max-w-md text-sm text-white/80">
            A single workspace for admins, HODs, accounts, and employees to manage the full incentive lifecycle.
          </p>
        </div>

        <div className="relative z-10 grid gap-3 text-sm">
          <div className="inline-flex items-center gap-2 text-white/90">
            <ShieldCheck className="h-4 w-4" />
            Role-based access and secure approvals
          </div>
          <div className="inline-flex items-center gap-2 text-white/90">
            <Workflow className="h-4 w-4" />
            End-to-end policy workflows
          </div>
          <div className="inline-flex items-center gap-2 text-white/90">
            <Wallet className="h-4 w-4" />
            Clear credit and redemption tracking
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center bg-background p-6 lg:p-10">
        <div className="w-full max-w-md rounded-2xl border border-border/80 bg-card/90 p-6 shadow-sm backdrop-blur-sm md:p-8">
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-muted/50 px-3 py-1 text-xs font-semibold text-muted-foreground">
              <Building2 className="h-3.5 w-3.5" />
              Secure Sign In
            </div>
            <h2 className="mt-4 text-3xl font-bold tracking-tight">Welcome back</h2>
            <p className="mt-1 text-sm text-muted-foreground">Sign in to continue to your workspace.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <Button type="submit" className="mt-2 w-full" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-muted-foreground">Need help? Contact your administrator.</p>

          {!setupStatus?.adminExists ? (
            <div className="mt-4 text-center text-sm">
              <Link href="/admin-signup" className="font-semibold text-primary hover:underline">
                Create the first admin account
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

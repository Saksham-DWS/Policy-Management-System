import { useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, setSessionToken } from "@/lib/api";

export default function Login() {
  const { data: setupStatus } = api.auth.adminSetupStatus.useQuery();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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

  const handleHelp = () => {
    toast.info("Please contact your administrator for sign-in help.");
  };

  const handleForgotPassword = () => {
    toast.info("Please contact your administrator to reset your password.");
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.02fr_1fr]">
      <div className="auth-backdrop hidden p-14 text-white lg:flex lg:flex-col lg:justify-between">
        <div>
          <p className="text-5xl font-semibold tracking-wide">DWSG</p>

          <div className="mt-42 max-w-[700px]">
            <h1 className="text-7xl font-bold leading-[1.05]">Inventory Management System</h1>
            <p className="mt-8 text-[26px] leading-relaxed text-white/78">
              Welcome to our inventory system. Use this space to manage assets, submit and track requests, and get a
              clear view of inventory across the company.
            </p>
            <h2 className="mt-12 text-6xl font-bold leading-tight">DWSG since 2005</h2>
            <p className="mt-2 text-[22px] text-white/70">Crafting reliable inventory experiences across industries.</p>
          </div>
        </div>

        <p className="text-[18px] text-white/62">@2026 DWSG. All rights reserved.</p>
      </div>

      <div className="flex justify-center bg-[#eff1f5] p-6 lg:px-10 lg:pt-58">
        <div className="w-full max-w-[560px]">
          <div className="mb-9">
            <h2 className="text-[56px] font-bold tracking-tight text-[#0f172a]">Welcome back</h2>
            <p className="mt-2 text-[18px] text-[#5f6f89]">Sign in to your account to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2.5">
              <Label htmlFor="email" className="text-[16px] font-semibold text-[#1e293b]">
                Email address
              </Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-4 top-1/2 h-6 w-6 -translate-y-1/2 text-[#8aa0bf]" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  disabled={isLoading}
                  className="h-12 rounded-xl border-[#c7d3e6] bg-white pl-12 pr-4 text-[16px] text-[#1e293b] placeholder:text-[#8ea1bc]"
                />
              </div>
            </div>

            <div className="space-y-2.5">
              <Label htmlFor="password" className="text-[16px] font-semibold text-[#1e293b]">
                Password
              </Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-4 top-1/2 h-6 w-6 -translate-y-1/2 text-[#8aa0bf]" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  disabled={isLoading}
                  className="h-12 rounded-xl border-[#c7d3e6] bg-white pl-12 pr-12 text-[16px] text-[#1e293b] placeholder:text-[#8ea1bc]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  disabled={isLoading}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8aa0bf] transition-colors hover:text-[#537198] disabled:cursor-not-allowed"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="mt-2 h-12 w-full rounded-xl bg-[#3f7fe6] text-[16px] font-semibold shadow-[0_8px_16px_rgba(63,127,230,0.25)] hover:bg-[#3a74ce]"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          <div className="mt-7 flex items-center justify-between text-[16px]">
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-[#607592] transition-colors hover:text-[#425874]"
            >
              Forgot your password?
            </button>
            <button
              type="button"
              onClick={handleHelp}
              className="font-semibold text-[#3f7fe6] transition-colors hover:text-[#2f63b3]"
            >
              Need help signing in?
            </button>
          </div>

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

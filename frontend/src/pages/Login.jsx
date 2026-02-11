import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, setSessionToken } from "@/lib/api";
import { toast } from "sonner";
import { Link } from "wouter";
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
            toast.success("Login successful!");
            // Reload to get user session
            window.location.href = "/";
        },
        onError: (error) => {
            toast.error(error.message || "Invalid email or password");
            setIsLoading(false);
        },
    }); 
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        if (!email || !password) {
            toast.error("Please enter both email and password");
            setIsLoading(false);
            return;
        }
        loginMutation.mutate({ email, password });
    };
    return (<div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-linear-to-br from-gray-900 via-gray-800 to-black p-12 flex-col justify-between relative overflow-hidden">
        {/* Decorative background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500 rounded-full filter blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-red-500 rounded-full filter blur-3xl"></div>
        </div>

        {/* Content */}
        <div className="relative z-10">
          <h1 className="text-white text-4xl font-bold mb-2">
            Policy Management
          </h1>
          <h2 className="text-white text-3xl font-semibold mb-4">
            System
          </h2>
          <p className="text-gray-300 text-lg italic">
            Together, We Build What's Next
          </p>
        </div>

        {/* Logo at bottom */}
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-16 h-16 border-2 border-white rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">IMS</span>
          </div>
          <div>
            <p className="text-white font-semibold text-lg">
              Policy Management System
            </p>
            <p className="text-gray-400 text-sm">Powered by Digital Web Solutions</p>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back
            </h2>
            <p className="text-gray-600">
              Sign in to access your Policies and Incentives
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-900">
                Email Address
              </Label>
              <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="h-12" required disabled={isLoading}/>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-900">
                Password
              </Label>
              <Input id="password" type="password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-12" required disabled={isLoading}/>
            </div>

            <Button type="submit" className="w-full h-12 bg-black hover:bg-gray-800 text-white font-medium" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            <p>Need help? Contact your administrator</p>
          </div>
          {!setupStatus?.adminExists && (<div className="mt-4 text-center text-sm text-gray-600">
              <Link href="/admin-signup" className="text-black font-medium underline">
                Create the first admin account
              </Link>
            </div>)}
        </div>
      </div>
    </div>);
}



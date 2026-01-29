import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Link } from "wouter";

export default function AdminSignup() {
  const { data: setupStatus, isLoading: statusLoading } =
    api.auth.adminSetupStatus.useQuery();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const adminSignupMutation = api.auth.adminSignup.useMutation({
    onSuccess: () => {
      toast.success("Admin account created. You're signed in!");
      window.location.href = "/";
    },
    onError: (error) => {
      toast.error(error.message || "Unable to create admin account");
      setIsSubmitting(false);
    },
  });

  const handleSubmit = (event) => {
    event.preventDefault();
    if (setupStatus?.adminExists) {
      toast.error("An admin account already exists. Please sign in.");
      return;
    }
    if (!name || !email || !password || !confirmPassword) {
      toast.error("Please fill out all fields");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setIsSubmitting(true);
    adminSignupMutation.mutate({ name, email, password });
  };

  if (statusLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Checking setup...</p>
        </div>
      </div>
    );
  }

  if (setupStatus?.adminExists) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-8">
        <div className="max-w-md text-center space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">
            Admin account already exists
          </h2>
          <p className="text-gray-600">
            Please sign in with your admin credentials.
          </p>
          <Link href="/login" className="inline-flex">
            <Button className="bg-black hover:bg-gray-800 text-white">
              Go to Login
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-linear-to-br from-gray-900 via-gray-800 to-black p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500 rounded-full filter blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-red-500 rounded-full filter blur-3xl"></div>
        </div>

        <div className="relative z-10">
          <h1 className="text-white text-4xl font-bold mb-2">
            Policy Management
          </h1>
          <h2 className="text-white text-3xl font-semibold mb-4">System</h2>
          <p className="text-gray-300 text-lg italic">
            Together, We Build What's Next
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-4">
          <div className="w-16 h-16 border-2 border-white rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">IMS</span>
          </div>
          <div>
            <p className="text-white font-semibold text-lg">
              Policy Management System
            </p>
            <p className="text-gray-400 text-sm">
              Powered by Digital Web Solutions
            </p>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Create admin account
            </h2>
            <p className="text-gray-600">
              Set up your first administrator profile
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium text-gray-900">
                Full Name
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="Admin name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="h-12"
                required
                disabled={isSubmitting}
              />
            </div>
 
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-sm font-medium text-gray-900"
              >
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="h-12"
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="text-sm font-medium text-gray-900"
              >
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Create a password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="h-12"
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="confirmPassword"
                className="text-sm font-medium text-gray-900"
              >
                Confirm Password
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="h-12"
                required
                disabled={isSubmitting}
              />
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-black hover:bg-gray-800 text-white font-medium"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating..." : "Create Admin"}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            <span>Already set up? </span>
            <Link href="/login" className="text-black font-medium underline">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}



// import { useState } from "react";
// import { Link } from "wouter";
// import { toast } from "sonner";
// import { Eye, EyeOff, Lock, Mail } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { api, setSessionToken } from "@/lib/api";

// export default function Login() {
//   const { data: setupStatus } = api.auth.adminSetupStatus.useQuery();
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [showPassword, setShowPassword] = useState(false);

//   const loginMutation = api.auth.login.useMutation({
//     onSuccess: (data) => {
//       if (data?.token) {
//         setSessionToken(data.token);
//       }
//       toast.success("Login successful");
//       window.location.assign("/");
//     },
//     onError: (error) => {
//       toast.error(error.message || "Invalid email or password");
//     },
//   });

//   const handleSubmit = (event) => {
//     event.preventDefault();
//     const normalizedEmail = email.trim().toLowerCase();

//     if (!normalizedEmail || !password) {
//       toast.error("Please enter both email and password");
//       return;
//     }

//     loginMutation.mutate({ email: normalizedEmail, password });
//   };

//   const handleHelp = () => {
//     toast.info("Please contact your administrator for sign-in help.");
//   };

//   const handleForgotPassword = () => {
//     toast.info("Please contact your administrator to reset your password.");
//   };

//   const isLoading = loginMutation.isPending;
//   const showAdminSignupLink = setupStatus?.adminExists === false;

//   return (
//     <div className="grid min-h-screen bg-[#eceef2] lg:grid-cols-[1fr_1fr]">
//       <div className="auth-backdrop hidden border-r border-white/12 text-white lg:flex">
//         <div className="flex w-full flex-col px-12 py-10 xl:px-14 xl:py-12">
//           <p className="font-sans text-[52px] font-semibold leading-none tracking-[0.005em]">DWSG</p>

//           <div className="my-auto max-w-[760px]">
//             <h1 className="font-sans text-[62px] font-bold leading-[1.02] tracking-[-0.02em] xl:text-[70px]">
//               Inventory
//               <br />
//               Management System
//             </h1>
//             <p className="mt-8 text-[18px] leading-[1.45] text-white/80 xl:text-[20px]">
//               Welcome to our inventory system. Use this space to manage assets, submit and track requests, and get a
//               clear view of inventory across the company.
//             </p>
//             <h2 className="font-sans mt-12 text-[52px] font-bold leading-none xl:text-[56px]">DWSG since 2005</h2>
//             <p className="mt-3 text-[17px] text-white/72 xl:text-[19px]">
//               Crafting reliable inventory experiences across industries.
//             </p>
//           </div>

//           <p className="text-[16px] leading-none text-white/62">@2026 DWSG. All rights reserved.</p>
//         </div>
//       </div>

//       <div className="flex items-start justify-center bg-[#e9eaee] px-6 py-10 lg:px-12 lg:pt-36">
//         <div className="w-full max-w-[640px]">
//           <div className="mb-10">
//             <h2 className="font-sans text-[58px] font-bold leading-[1.02] tracking-[-0.02em] text-[#0f1830]">
//               Welcome back
//             </h2>
//             <p className="mt-3 text-[18px] leading-[1.35] text-[#5f6f89]">
//               Sign in to your account to continue
//             </p>
//           </div>

//           <form onSubmit={handleSubmit} className="space-y-4">
//             <div className="space-y-2">
//               <Label htmlFor="email" className="text-[16px] font-semibold text-[#12233f]">
//                 Email address
//               </Label>
//               <div className="relative">
//                 <Mail className="pointer-events-none absolute left-4 top-1/2 h-6 w-6 -translate-y-1/2 text-[#8ea3c2]" />
//                 <Input
//                   id="email"
//                   type="email"
//                   placeholder="Enter your email"
//                   value={email}
//                   onChange={(event) => setEmail(event.target.value)}
//                   autoComplete="email"
//                   required
//                   disabled={isLoading}
//                   className="h-[70px] rounded-[18px] border-[#c5cfdf] bg-[#e9eef6] pl-12 pr-4 text-[16px] text-[#1f2f49] placeholder:text-[#8ea1bc]"
//                 />
//               </div>
//             </div>

//             <div className="space-y-2">
//               <Label htmlFor="password" className="text-[16px] font-semibold text-[#12233f]">
//                 Password
//               </Label>
//               <div className="relative">
//                 <Lock className="pointer-events-none absolute left-4 top-1/2 h-6 w-6 -translate-y-1/2 text-[#8ea3c2]" />
//                 <Input
//                   id="password"
//                   type={showPassword ? "text" : "password"}
//                   placeholder="Enter your password"
//                   value={password}
//                   onChange={(event) => setPassword(event.target.value)}
//                   autoComplete="current-password"
//                   required
//                   disabled={isLoading}
//                   className="h-[70px] rounded-[18px] border-[#c5cfdf] bg-[#e9eef6] pl-12 pr-12 text-[16px] text-[#1f2f49] placeholder:text-[#8ea1bc]"
//                 />
//                 <button
//                   type="button"
//                   onClick={() => setShowPassword((prev) => !prev)}
//                   disabled={isLoading}
//                   className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8ea3c2] transition-colors hover:text-[#537198] disabled:cursor-not-allowed"
//                   aria-label={showPassword ? "Hide password" : "Show password"}
//                 >
//                   {showPassword ? <EyeOff className="h-6 w-6" /> : <Eye className="h-6 w-6" />}
//                 </button>
//               </div>
//             </div>

//             <Button
//               type="submit"
//               className="mt-2 h-[70px] w-full rounded-[18px] bg-[#3f7fe6] text-[18px] font-semibold shadow-[0_10px_20px_rgba(63,127,230,0.22)] hover:bg-[#3a74ce]"
//               disabled={isLoading}
//               aria-busy={isLoading}
//             >
//               {isLoading ? "Signing in..." : "Sign in"}
//             </Button>
//           </form>

//           <div className="mt-8 flex items-center justify-between text-[16px]">
//             <button
//               type="button"
//               onClick={handleForgotPassword}
//               disabled={isLoading}
//               className="text-[#607592] transition-colors hover:text-[#425874] disabled:opacity-70"
//             >
//               Forgot your password?
//             </button>
//             <button
//               type="button"
//               onClick={handleHelp}
//               disabled={isLoading}
//               className="font-semibold text-[#2f62db] transition-colors hover:text-[#2756c5] disabled:opacity-70"
//             >
//               Need help signing in?
//             </button>
//           </div>

//           {showAdminSignupLink ? (
//             <div className="mt-4 text-center text-sm">
//               <Link href="/admin-signup" className="font-semibold text-primary hover:underline">
//                 Create the first admin account
//               </Link>
//             </div>
//           ) : null}
//         </div>
//       </div>
//     </div>
//   );
// }



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

  const loginMutation = api.auth.login.useMutation({
    onSuccess: (data) => {
      if (data?.token) setSessionToken(data.token);
      toast.success("Login successful");
      window.location.assign("/");
    },
    onError: (error) => {
      toast.error(error.message || "Invalid email or password");
    },
  });

  const handleSubmit = (event) => {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      toast.error("Please enter both email and password");
      return;
    }

    loginMutation.mutate({ email: normalizedEmail, password });
  };

  const handleHelp = () => toast.info("Please contact your administrator for sign-in help.");
  const handleForgotPassword = () => toast.info("Please contact your administrator to reset your password.");

  const isLoading = loginMutation.isPending;
  const showAdminSignupLink = setupStatus?.adminExists === false;

  return (
    <div className="min-h-screen bg-[#e9eaee] lg:grid lg:grid-cols-2">
      {/* LEFT PANEL (matches screenshot: deep blue gradient, big type, bottom copyright) */}
      <aside className="relative hidden overflow-hidden lg:block">
        {/* gradient + vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(1200px_700px_at_10%_10%,#2d55d2_0%,#0a1a3c_45%,#050b16_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.0)_0%,rgba(0,0,0,0.18)_55%,rgba(0,0,0,0.35)_100%)]" />
        <div className="absolute inset-y-0 right-0 w-px bg-white/10" />

        <div className="relative flex h-screen flex-col px-14 py-12 text-white">
          <div>
            <p className="text-[34px] font-semibold tracking-[0.02em]">DWSG</p>
          </div>

          <div className="mt-[120px] max-w-[680px]">
            <h1 className="text-[56px] font-semibold leading-[1.06] tracking-[-0.02em]">
              Inventory
              <br />
              Management System
            </h1>

            <p className="mt-7 max-w-[620px] text-[16px] leading-[1.55] text-white/80">
              Welcome to our inventory system. Use this space to manage assets, submit and track requests, and get a
              clear view of inventory across the company.
            </p>

            <div className="mt-10">
              <h2 className="text-[36px] font-semibold leading-none tracking-[-0.01em]">DWSG since 2005</h2>
              <p className="mt-2 text-[14px] leading-[1.6] text-white/70">
                Crafting reliable inventory experiences across industries.
              </p>
            </div>
          </div>

          <div className="mt-auto pt-10">
            <p className="text-[13px] text-white/55">@2026 DWSG. All rights reserved.</p>
          </div>
        </div>
      </aside>

      {/* RIGHT PANEL (white-ish area, vertically centered like screenshot) */}
      <main className="flex min-h-screen items-center justify-center px-6 py-10 lg:px-16">
        <div className="w-full max-w-[520px]">
          <header className="mb-10">
            <h2 className="text-[34px] font-semibold leading-[1.15] tracking-[-0.02em] text-[#0f1830] sm:text-[38px]">
              Welcome back
            </h2>
            <p className="mt-2 text-[15px] leading-[1.55] text-[#607592]">
              Sign in to your account to continue
            </p>
          </header>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[13px] font-medium text-[#233656]">
                Email address
              </Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#98abc4]" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                  disabled={isLoading}
                  className="h-[52px] rounded-[10px] border-[#d3dceb] bg-white pl-11 pr-4 text-[14px] text-[#1f2f49] placeholder:text-[#9aaac0] focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-[13px] font-medium text-[#233656]">
                Password
              </Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#98abc4]" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  disabled={isLoading}
                  className="h-[52px] rounded-[10px] border-[#d3dceb] bg-white pl-11 pr-12 text-[14px] text-[#1f2f49] placeholder:text-[#9aaac0] focus-visible:ring-0 focus-visible:ring-offset-0"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  disabled={isLoading}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-2 text-[#93a7c2] transition-colors hover:text-[#57759b] disabled:cursor-not-allowed"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              aria-busy={isLoading}
              className="h-[52px] w-full rounded-[10px] bg-[#3b82f6] text-[14px] font-semibold shadow-sm hover:bg-[#3373da]"
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          <div className="mt-6 flex items-center justify-between text-[13px]">
            <button
              type="button"
              onClick={handleForgotPassword}
              disabled={isLoading}
              className="text-[#607592] transition-colors hover:text-[#425874] disabled:opacity-70"
            >
              Forgot your password?
            </button>
            <button
              type="button"
              onClick={handleHelp}
              disabled={isLoading}
              className="font-semibold text-[#2f62db] transition-colors hover:text-[#2756c5] disabled:opacity-70"
            >
              Need help signing in?
            </button>
          </div>

          {showAdminSignupLink ? (
            <div className="mt-6 text-center text-[13px]">
              <Link href="/admin-signup" className="font-semibold text-[#2f62db] hover:underline">
                Create the first admin account
              </Link>
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}

import { useAuth } from "@/_core/hooks/useAuth";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Users, FileText, CheckCircle, DollarSign, Clock, TrendingUp, Sparkles } from "lucide-react";
export default function Dashboard() {
    const { user, loading: authLoading } = useAuth();
    const { data: stats, isLoading } = api.dashboard.getStats.useQuery();
    if (authLoading || isLoading) {
        return (<div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary"/>
      </div>);
    }
    if (!user)
        return null;
    const role = user.role;
    return (<div className="space-y-8 p-6">
      {/* Dashboard Header */} 
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Dashboard
        </h1>
        <p className="text-lg text-muted-foreground flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary"/>
          Welcome back, {user.name || user.email}
        </p>
      </div>

      {/* Admin Dashboard */}
      {role === 'admin' && stats && (<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="card-hover border-2 relative overflow-hidden group">
            <div className="absolute inset-0 bg-linear-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"/>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Total Users</CardTitle>
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Users className="h-5 w-5 text-purple-600 dark:text-purple-400"/>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-foreground">
                {stats.totalUsers}
              </div>
              <p className="text-xs text-muted-foreground mt-2">System-wide users</p>
            </CardContent>
          </Card>

          <Card className="card-hover border-2 relative overflow-hidden group">
            <div className="absolute inset-0 bg-linear-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"/>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Total HODs</CardTitle>
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Users className="h-5 w-5 text-blue-600 dark:text-blue-400"/>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-foreground">
                {stats.totalHods}
              </div>
              <p className="text-xs text-muted-foreground mt-2">Department heads</p>
            </CardContent>
          </Card>

          <Card className="card-hover border-2 relative overflow-hidden group">
            <div className="absolute inset-0 bg-linear-to-br from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"/>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Pending Approvals</CardTitle>
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400"/>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-foreground">
                {stats.pendingApprovals}
              </div>
              <p className="text-xs text-muted-foreground mt-2">Awaiting review</p>
            </CardContent>
          </Card>

          <Card className="card-hover border-2 relative overflow-hidden group">
            <div className="absolute inset-0 bg-linear-to-br from-pink-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"/>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Pending Redemptions</CardTitle>
              <div className="p-2 bg-pink-100 dark:bg-pink-900/30 rounded-lg">
                <DollarSign className="h-5 w-5 text-pink-600 dark:text-pink-400"/>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-foreground">
                {stats.pendingRedemptions}
              </div>
              <p className="text-xs text-muted-foreground mt-2">Payment requests</p>
            </CardContent>
          </Card>
        </div>)}

      {/* HOD Dashboard */}
      {role === 'hod' && stats && (<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="card-hover border-2 relative overflow-hidden group">
            <div className="absolute inset-0 bg-linear-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"/>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Team Size</CardTitle>
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Users className="h-5 w-5 text-purple-600 dark:text-purple-400"/>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-foreground">
                {stats.teamSize}
              </div>
              <p className="text-xs text-muted-foreground mt-2">Team members</p>
            </CardContent>
          </Card>

          <Card className="card-hover border-2 relative overflow-hidden group">
            <div className="absolute inset-0 bg-linear-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"/>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Active Policies</CardTitle>
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400"/>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-foreground">
                {stats.activePolicies}
              </div>
              <p className="text-xs text-muted-foreground mt-2">In effect</p>
            </CardContent>
          </Card>

          <Card className="card-hover border-2 relative overflow-hidden group">
            <div className="absolute inset-0 bg-linear-to-br from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"/>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Pending Approvals</CardTitle>
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400"/>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-foreground">
                {stats.pendingApprovals}
              </div>
              <p className="text-xs text-muted-foreground mt-2">Needs your review</p>
            </CardContent>
          </Card>
        </div>)}

      {/* Accounts Manager Dashboard */}
      {role === 'account' && stats && (<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="card-hover border-2 relative overflow-hidden group">
            <div className="absolute inset-0 bg-linear-to-br from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"/>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Pending Redemptions</CardTitle>
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400"/>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-foreground">
                {stats.pendingRedemptions}
              </div>
              <p className="text-xs text-muted-foreground mt-2">Awaiting payment</p>
            </CardContent>
          </Card>

          <Card className="card-hover border-2 relative overflow-hidden group">
            <div className="absolute inset-0 bg-linear-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"/>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Processing Today</CardTitle>
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400"/>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-foreground">
                {stats.processingToday}
              </div>
              <p className="text-xs text-muted-foreground mt-2">In progress</p>
            </CardContent>
          </Card>

          <Card className="card-hover border-2 relative overflow-hidden group">
            <div className="absolute inset-0 bg-linear-to-br from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"/>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Completed This Month</CardTitle>
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400"/>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-foreground">
                {stats.completedThisMonth}
              </div>
              <p className="text-xs text-muted-foreground mt-2">Successfully paid</p>
            </CardContent>
          </Card>
        </div>)}

      {/* User Dashboard */}
      {role === 'employee' && stats && (<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="card-hover border-2 relative overflow-hidden group col-span-2 md:col-span-1">
            <div className="absolute inset-0 bg-linear-to-br from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"/>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Wallet Balance</CardTitle>
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg pulse-glow">
                <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400"/>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-foreground">
                ${stats.walletBalance}
              </div>
              <p className="text-xs text-muted-foreground mt-2">Available balance</p>
            </CardContent>
          </Card>

          <Card className="card-hover border-2 relative overflow-hidden group">
            <div className="absolute inset-0 bg-linear-to-br from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"/>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Pending Reviews</CardTitle>
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400"/>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-foreground">
                {stats.pendingReviews}
              </div>
              <p className="text-xs text-muted-foreground mt-2">Under review</p>
            </CardContent>
          </Card>

          <Card className="card-hover border-2 relative overflow-hidden group">
            <div className="absolute inset-0 bg-linear-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"/>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Active Policies</CardTitle>
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400"/>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-foreground">
                {stats.activePolicies}
              </div>
              <p className="text-xs text-muted-foreground mt-2">Assigned to you</p>
            </CardContent>
          </Card>

          <Card className="card-hover border-2 relative overflow-hidden group">
            <div className="absolute inset-0 bg-linear-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"/>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">This Month Earnings</CardTitle>
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400"/>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-foreground">
                ${stats.thisMonthEarnings}
              </div>
              <p className="text-xs text-muted-foreground mt-2">Earned this month</p>
            </CardContent>
          </Card>
        </div>)}
    </div>);
}



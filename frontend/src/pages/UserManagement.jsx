import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Pencil, Trash2, UserPlus, Users, Mail, Shield, Briefcase, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/_core/hooks/useAuth";

export default function UserManagement() {
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "employee",
    employeeType: "permanent_india",
    hodId: "",
    freelancerInitiatorIds: [],
  });

  const { data: users, isLoading, refetch } = api.users.getAll.useQuery();

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      password: "",
      role: "employee",
      employeeType: "permanent_india",
      hodId: "",
      freelancerInitiatorIds: [],
    });
  };

  const createUser = api.users.create.useMutation({
    onSuccess: () => {
      toast.success("User created successfully");
      resetForm();
      setIsDialogOpen(false);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateUser = api.users.update.useMutation({
    onSuccess: () => {
      toast.success("User updated successfully");
      setIsDialogOpen(false);
      setEditingUser(null);
      resetForm();
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteUser = api.users.delete.useMutation({
    onSuccess: () => {
      toast.success("User deleted successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.role === "hod" && !formData.hodId) {
      toast.error("Please assign an Admin as HOD for this HOD user");
      return;
    }
    if ((formData.role === "employee" || formData.role === "account") && !formData.hodId) {
      toast.error("Please assign a HOD for this user");
      return;
    }
    if (editingUser) {
      const { freelancerInitiatorIds, ...payload } = formData;
      updateUser.mutate({
        id: editingUser._id,
        ...payload,
        password: formData.password || undefined,
      });
    } else {
      const { freelancerInitiatorIds, ...payload } = formData;
      createUser.mutate(payload);
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name || "",
      email: user.email,
      password: "",
      role: user.role,
      employeeType: user.employeeType || "permanent_india",
      hodId: user.hodId?.toString() || "",
      freelancerInitiatorIds: user.freelancerInitiatorIds || [],
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (userId) => {
    if (confirm("Are you sure you want to delete this user?")) {
      deleteUser.mutate({ id: userId });
    }
  };

  const handleDialogClose = (open) => {
    setIsDialogOpen(open);
    if (!open) {
      setEditingUser(null);
      resetForm();
    }
  };

  const admins = users?.filter((u) => u.role === "admin") || [];
  const hodOptions = users?.filter((u) => u.role === "hod" || u.role === "admin") || [];
  const visibleUsers = (() => {
    if (!user || user.role !== "hod") {
      return users || [];
    }
    return (users || []).filter(
      (entry) => entry?._id?.toString() === user.id || entry?.hodId?.toString() === user.id,
    );
  })();

  useEffect(() => {
    if (isDialogOpen && !editingUser) {
      resetForm();
    }
  }, [isDialogOpen, editingUser]);

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case "admin":
        return "bg-amber-100 text-amber-700 border border-amber-200";
      case "hod":
        return "bg-blue-100 text-blue-700 border border-blue-200";
      case "account":
        return "bg-purple-100 text-purple-700 border border-purple-200";
      case "employee":
        return "bg-slate-100 text-slate-700 border border-slate-200";
      default:
        return "bg-gray-100 text-gray-700 border border-gray-200";
    }
  };

  const getEmployeeTypeLabel = (type) => {
    switch (type) {
      case "permanent_india":
        return "Permanent (IN)";
      case "permanent_usa":
        return "Permanent (USA)";
      case "freelancer_india":
        return "Freelancer (IN)";
      case "freelancer_usa":
        return "Freelancer (USA)";
      default:
        return "Employee";
    }
  };

  const getInitials = (nameOrEmail) => {
    if (!nameOrEmail) return "U";
    const cleaned = nameOrEmail.split("@")[0];
    const parts = cleaned.replace(/[^a-zA-Z\s]/g, " ").trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "U";
    if (parts.length === 1) return parts[0][0]?.toUpperCase() || "U";
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const filteredUsers = (visibleUsers || []).filter((user) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    return (
      (user.name || "").toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      (user.role || "").toLowerCase().includes(query) ||
      (user.employeeType || "").toLowerCase().includes(query)
    );
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">User Management</h1>
          <p className="text-sm text-muted-foreground">Manage users and their access permissions</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
          <DialogTrigger asChild>
            <Button 
              size="lg"
              className="gap-2"
              onClick={() => {
                setEditingUser(null);
                resetForm();
              }}
            > 
              <UserPlus className="w-5 h-5" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl text-foreground">
                {editingUser ? "Edit User" : "Create New User"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" />
                    Full Name *
                  </Label>
                  <Input
                    id="name"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-primary" />
                    Email *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" />
                  Password {editingUser && "(leave blank to keep current)"}
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="********"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required={!editingUser}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-primary" />
                    Role *
                  </Label>
                  <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="employee">Employee</SelectItem>
                      <SelectItem value="hod">HOD</SelectItem>
                      <SelectItem value="account">Account</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-primary" />
                    Employee Type *
                  </Label>
                  <Select
                    value={formData.employeeType}
                    onValueChange={(value) => setFormData({ ...formData, employeeType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="permanent_india">Permanent (India)</SelectItem>
                      <SelectItem value="permanent_usa">Permanent (USA)</SelectItem>
                      <SelectItem value="freelancer_india">Freelancer (India)</SelectItem>
                      <SelectItem value="freelancer_usa">Freelancer (USA)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {formData.role !== "admin" && (
                <div className="space-y-4 p-4 bg-muted/50 rounded-lg border">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-primary" />
                      {formData.role === "hod" ? "Assign Admin as HOD *" : "Assign HOD *"}
                    </Label>
                    <Select value={formData.hodId || ""} onValueChange={(value) => setFormData({ ...formData, hodId: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder={formData.role === "hod" ? "Select Admin" : "Select HOD"} />
                      </SelectTrigger>
                      <SelectContent>
                        {(formData.role === "hod" ? admins : hodOptions).map((hod) => (
                          <SelectItem key={hod._id.toString()} value={hod._id.toString()}>
                            {hod.name || hod.email} ({hod.role})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.employeeType?.startsWith("freelancer") && (
                    <div className="rounded-md border border-dashed bg-background p-3 text-xs text-muted-foreground">
                      Initiators are assigned later from Employee Management.
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => handleDialogClose(false)}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    handleSubmit(e);
                  }}
                  disabled={createUser.isPending || updateUser.isPending}
                  className="gap-2"
                >
                  {(createUser.isPending || updateUser.isPending) && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingUser ? "Update User" : "Create User"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="max-w-xl">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search users..."
            className="pl-9"
          />
        </div>
      </div>

      {filteredUsers.length === 0 ? (
        <Card className="border">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Users className="w-12 h-12 text-muted-foreground mb-3" />
            <h3 className="text-lg font-semibold mb-1">No users found</h3>
            <p className="text-sm text-muted-foreground text-center">Try adjusting your search or create a new user.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-xl border bg-card">
          <div className="flex flex-col gap-2 px-6 py-4 sm:flex-row sm:items-center sm:justify-between border-b">
            <h2 className="text-sm font-semibold">Users ({visibleUsers?.length || 0})</h2>
            <p className="text-sm text-muted-foreground">Select a user to manage access</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-muted-foreground">
                <tr className="border-b">
                  <th className="px-6 py-3 font-medium">Name</th>
                  <th className="px-6 py-3 font-medium">Email</th>
                  <th className="px-6 py-3 font-medium">Role</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user._id.toString()} className="border-b last:border-0">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 text-primary font-semibold flex items-center justify-center text-sm">
                          {getInitials(user.name || user.email)}
                        </div>
                        <div>
                          <div className="font-semibold text-foreground">{user.name || "Unnamed User"}</div>
                          <div className="text-xs text-muted-foreground">{getEmployeeTypeLabel(user.employeeType || "permanent_india")}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{user.email}</td>
                    <td className="px-6 py-4">
                      <Badge className={`${getRoleBadgeColor(user.role)} rounded-full px-3 py-1 text-xs font-medium`}>
                        {user.role.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 px-3 py-1 text-xs font-medium">
                        Active
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" className="gap-2" onClick={() => handleEdit(user)}>
                          <Pencil className="h-4 w-4" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2 text-destructive border-destructive/30 hover:bg-destructive/10"
                          onClick={() => handleDelete(user._id.toString())}
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}


import { useMemo, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, UserPlus, Settings2, Trash2, Calendar, Pencil, Check, ChevronsUpDown, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/_core/hooks/useAuth";
 
const employeeTypeLabel = (type) => {
  switch (type) {
    case "permanent_india":
      return "Permanent (India)"; 
    case "permanent_usa":
      return "Permanent (USA)";
    case "freelancer_india":
      return "Freelancer (India)";
    case "freelancer_usa":
      return "Freelancer (USA)";
    default:
      return "Permanent (India)";
  }
};

export default function EmployeeManagement() {
  const { user } = useAuth();
  const isManager = user?.role === "admin" || user?.role === "hod";
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [isUserPickerOpen, setIsUserPickerOpen] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isInitiateDialogOpen, setIsInitiateDialogOpen] = useState(false);
  const [initiateTarget, setInitiateTarget] = useState(null);
  const [initiateForm, setInitiateForm] = useState({ details: "", amount: "", files: [] });
  const [isInitiateSubmitting, setIsInitiateSubmitting] = useState(false);
  const [isPolicyDialogOpen, setIsPolicyDialogOpen] = useState(false);
  const [policyTarget, setPolicyTarget] = useState(null);
  const [policyForm, setPolicyForm] = useState({
    assignmentId: "",
    details: "",
    amount: "",
    files: [],
  });
  const [isPolicySubmitting, setIsPolicySubmitting] = useState(false);
  const [assignmentForm, setAssignmentForm] = useState({
    policyId: "",
    initiatorIds: [],
    effectiveDate: "",
  });
  const [formData, setFormData] = useState({
    employeeType: "permanent_india",
    hodId: "",
    freelancerInitiatorIds: [],
  });

  const { data: team, isLoading, refetch } = api.team.getMyTeam.useQuery();
  const { data: users } = api.users.getAll.useQuery(undefined, { enabled: isManager });
  const { data: policies } = api.policies.getAll.useQuery(undefined, { enabled: isManager });

  const updateEmployee = api.users.update.useMutation();
  const uploadCreditAttachments = api.creditRequests.uploadAttachments.useMutation();
  const createCreditRequest = api.creditRequests.create.useMutation();

  const removeEmployee = api.users.update.useMutation({
    onSuccess: () => {
      toast.success("Removed from employee management");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const assignPolicy = api.team.assignPolicy.useMutation({
    onSuccess: () => {
      toast.success("Policy assigned successfully");
      setAssignmentForm({ policyId: "", initiatorIds: [], effectiveDate: "" });
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const removePolicy = api.team.removePolicy.useMutation({
    onSuccess: () => {
      toast.success("Policy removed successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      employeeType: "permanent_india",
      hodId: user?.role === "hod" ? user.id : "",
      freelancerInitiatorIds: [],
    });
    setSelectedUserIds([]);
  };

  const hodOptions = users?.filter((user) => user.role === "hod" || user.role === "admin") || [];
  const initiatorOptions = users || [];
  const userPickerOptions = useMemo(() => {
    if (!isManager) {
      return [];
    }
    if (user?.role === "hod") {
      return (users || []).filter((entry) => entry?.hodId?.toString() === user.id);
    }
    return users || [];
  }, [isManager, user?.role, user?.id, users]);
  const employees = useMemo(
    () => (team || []).filter((member) => member.role === "employee" && member.isEmployee !== false),
    [team],
  );
  const activePolicies = policies?.filter((policy) => policy.status === "active") || [];
  const usersById = useMemo(() => {
    const map = new Map();
    (users || []).forEach((entry) => {
      map.set(entry._id.toString(), entry);
    });
    return map;
  }, [users]);
  const selectedUsers = useMemo(
    () => selectedUserIds.map((id) => usersById.get(id)).filter(Boolean),
    [selectedUserIds, usersById],
  );
  const getInitiatorNames = (employee) => {
    if (!employee?.employeeType?.startsWith("freelancer")) {
      return [];
    }
    const direct = employee.freelancerInitiators || [];
    const namesFromDirect = direct.map((init) => init?.name || init?.email).filter(Boolean);
    if (namesFromDirect.length > 0) {
      return namesFromDirect;
    }
    const ids = employee.freelancerInitiatorIds || [];
    return ids
      .map((id) => usersById.get(id))
      .map((init) => init?.name || init?.email)
      .filter(Boolean);
  };
  const getPolicyInitiatorNames = (employee) => {
    if (!employee?.policyAssignments) {
      return [];
    }
    const names = employee.policyAssignments
      .flatMap((assignment) => assignment?.initiators || [])
      .map((init) => init?.name || init?.email)
      .filter(Boolean);
    return Array.from(new Set(names));
  };
  const getHodDisplayName = (employee) => {
    if (!employee?.hodId) {
      return "-";
    }
    const fromHydration = employee?.hod?.name || employee?.hod?.email;
    if (fromHydration) {
      return fromHydration;
    }
    const fallback = users?.find((u) => u._id.toString() === employee.hodId?.toString());
    return fallback?.name || fallback?.email || "-";
  };
  const canInitiateForEmployee = (employee) => {
    if (!user?.id) {
      return false;
    }
    if (!employee?.employeeType?.startsWith("freelancer")) {
      return false;
    }
    const hydratedIds = (employee.freelancerInitiators || [])
      .map((init) => init?._id?.toString())
      .filter(Boolean);
    const fallbackIds = (employee.freelancerInitiatorIds || []).map((id) => id?.toString()).filter(Boolean);
    const allIds = hydratedIds.length > 0 ? hydratedIds : fallbackIds;
    return allIds.includes(user.id.toString());
  };
  const getInitiatablePolicyAssignments = (employee) => {
    if (!employee?.policyAssignments || !user?.id) {
      return [];
    }
    return employee.policyAssignments.filter((assignment) => {
      const initiatorIds = (assignment.initiators || [])
        .map((init) => init?._id?.toString())
        .filter(Boolean);
      return initiatorIds.includes(user.id.toString());
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isManager) {
      toast.error("You do not have permission to add employees.");
      return;
    }
    const targetUserIds = editingEmployee ? [editingEmployee._id.toString()] : selectedUserIds;
    if (targetUserIds.length === 0) {
      toast.error("Please select at least one user.");
      return;
    }
    if (!formData.employeeType) {
      toast.error("Please select employee type.");
      return;
    }
    const hodIdToUse = user?.role === "hod" ? user.id : formData.hodId;
    if (!hodIdToUse) {
      toast.error("Please select HOD.");
      return;
    }
    if (formData.employeeType.startsWith("freelancer") && formData.freelancerInitiatorIds.length === 0) {
      toast.error("Please assign at least one initiator for freelancers");
      return;
    }
    setIsSubmitting(true);
    try {
      await Promise.all(
        targetUserIds.map((id) =>
          updateEmployee.mutateAsync({
            id,
            role: "employee",
            employeeType: formData.employeeType,
            hodId: hodIdToUse,
            isEmployee: true,
            freelancerInitiatorIds: formData.employeeType.startsWith("freelancer")
              ? formData.freelancerInitiatorIds
              : undefined,
          }),
        ),
      );
      toast.success(
        editingEmployee
          ? "Employee updated successfully"
          : targetUserIds.length > 1
            ? "Employees added successfully"
            : "Employee added successfully",
      );
      setIsDialogOpen(false);
      setEditingEmployee(null);
      resetForm();
      refetch();
    } catch (error) {
      toast.error(error?.message || "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (employee) => {
    setEditingEmployee(employee);
    setSelectedUserIds([employee._id.toString()]);
    setFormData({
      employeeType: employee.employeeType || "permanent_india",
      hodId: employee.hodId?.toString() || "",
      freelancerInitiatorIds: employee.freelancerInitiatorIds || [],
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id) => {
    if (!isManager) {
      return;
    }
    if (confirm("Remove this user from Employee Management?")) {
      removeEmployee.mutate({ id, isEmployee: false });
    }
  };

  const toggleFreelancerInitiator = (initiatorId) => {
    setFormData((prev) => ({
      ...prev,
      freelancerInitiatorIds: prev.freelancerInitiatorIds.includes(initiatorId)
        ? prev.freelancerInitiatorIds.filter((id) => id !== initiatorId)
        : [...prev.freelancerInitiatorIds, initiatorId],
    }));
  };

  const togglePolicyInitiator = (initiatorId) => {
    setAssignmentForm((prev) => ({
      ...prev,
      initiatorIds: prev.initiatorIds.includes(initiatorId)
        ? prev.initiatorIds.filter((id) => id !== initiatorId)
        : [...prev.initiatorIds, initiatorId],
    }));
  };

  const handleAssignPolicy = () => {
    if (!selectedEmployee) {
      return;
    }
    if (!assignmentForm.policyId || assignmentForm.initiatorIds.length === 0) {
      toast.error("Select a policy and at least one initiator");
      return;
    }
    const effectiveDate = assignmentForm.effectiveDate || new Date().toISOString().slice(0, 10);
    assignPolicy.mutate({
      userId: selectedEmployee._id.toString(),
      policyId: assignmentForm.policyId,
      initiatorIds: assignmentForm.initiatorIds,
      effectiveDate,
    });
  };

  const handleRemoveAssignment = (assignmentId) => {
    if (confirm("Remove this policy assignment?")) {
      removePolicy.mutate({ assignmentId });
    }
  };

  const openInitiateDialog = (employee) => {
    setInitiateTarget(employee);
    setInitiateForm({ details: "", amount: "", files: [] });
    setIsInitiateDialogOpen(true);
  };

  const handleInitiateDialogChange = (open) => {
    setIsInitiateDialogOpen(open);
    if (!open) {
      setInitiateTarget(null);
      setInitiateForm({ details: "", amount: "", files: [] });
    }
  };

  const handleInitiateSubmit = async (event) => {
    event.preventDefault();
    if (!initiateTarget) {
      return;
    }
    if (!canInitiateForEmployee(initiateTarget)) {
      toast.error("You are not allowed to initiate for this freelancer.");
      return;
    }
    const amountValue = Number(initiateForm.amount);
    if (!Number.isFinite(amountValue) || amountValue <= 0) {
      toast.error("Please enter a valid amount.");
      return;
    }
    if (!initiateForm.details.trim()) {
      toast.error("Please provide freelancer details.");
      return;
    }
    setIsInitiateSubmitting(true);
    try {
      let attachments = [];
      if (initiateForm.files.length > 0) {
        const uploadResult = await uploadCreditAttachments.mutateAsync({
          files: initiateForm.files,
        });
        attachments = uploadResult?.attachments || [];
      }
      await createCreditRequest.mutateAsync({
        userId: initiateTarget._id.toString(),
        type: "freelancer",
        baseAmount: amountValue,
        bonus: 0,
        deductions: 0,
        amount: amountValue,
        amountItems: [
          {
            amount: amountValue,
            note: "Initiator submission",
            addedBy: user?.id,
            addedAt: new Date().toISOString(),
          },
        ],
        calculationBreakdown: "Freelancer initiation",
        notes: initiateForm.details.trim(),
        attachments,
      });
      toast.success("Freelancer request submitted for approval.");
      handleInitiateDialogChange(false);
    } catch (error) {
      toast.error(error?.message || "Failed to submit request.");
    } finally {
      setIsInitiateSubmitting(false);
    }
  };
  const openPolicyDialog = (employee) => {
    const assignments = getInitiatablePolicyAssignments(employee);
    setPolicyTarget(employee);
    setPolicyForm({
      assignmentId: assignments[0]?._id?.toString() || "",
      details: "",
      amount: "",
      files: [],
    });
    setIsPolicyDialogOpen(true);
  };

  const handlePolicyDialogChange = (open) => {
    setIsPolicyDialogOpen(open);
    if (!open) {
      setPolicyTarget(null);
      setPolicyForm({ assignmentId: "", details: "", amount: "", files: [] });
    }
  };

  const handlePolicySubmit = async (event) => {
    event.preventDefault();
    if (!policyTarget) {
      return;
    }
    if (!policyForm.assignmentId) {
      toast.error("Please select a policy.");
      return;
    }
    const amountValue = Number(policyForm.amount);
    if (!Number.isFinite(amountValue) || amountValue <= 0) {
      toast.error("Please enter a valid amount.");
      return;
    }
    if (!policyForm.details.trim()) {
      toast.error("Please provide policy details.");
      return;
    }
    setIsPolicySubmitting(true);
    try {
      let attachments = [];
      if (policyForm.files.length > 0) {
        const uploadResult = await uploadCreditAttachments.mutateAsync({
          files: policyForm.files,
        });
        attachments = uploadResult?.attachments || [];
      }
      const assignment = policyTarget.policyAssignments?.find(
        (item) => item._id?.toString() === policyForm.assignmentId,
      );
      await createCreditRequest.mutateAsync({
        userId: policyTarget._id.toString(),
        type: "policy",
        policyId: assignment?.policyId || assignment?.policy?._id?.toString(),
        baseAmount: amountValue,
        bonus: 0,
        deductions: 0,
        amount: amountValue,
        amountItems: [
          {
            amount: amountValue,
            note: "Policy initiation",
            addedBy: user?.id,
            addedAt: new Date().toISOString(),
          },
        ],
        calculationBreakdown: `Policy initiation${assignment?.policy?.name ? ` (${assignment.policy.name})` : ""}`,
        notes: policyForm.details.trim(),
        attachments,
      });
      toast.success("Policy request submitted for approval.");
      handlePolicyDialogChange(false);
    } catch (error) {
      toast.error(error?.message || "Failed to submit policy request.");
    } finally {
      setIsPolicySubmitting(false);
    }
  };
  const openAssignmentDrawer = (employee) => {
    setSelectedEmployee(employee);
    setAssignmentForm({ policyId: "", initiatorIds: [], effectiveDate: "" });
  };

  const handleDialogClose = (open) => {
    setIsDialogOpen(open);
    if (!open) {
      setEditingEmployee(null);
      setIsUserPickerOpen(false);
      resetForm();
    }
  };

  const toggleSelectedUser = (userId) => {
    if (editingEmployee) {
      return;
    }
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId],
    );
  };

  const getInitials = (nameOrEmail) => {
    if (!nameOrEmail) return "U";
    const cleaned = nameOrEmail.split("@")[0];
    const parts = cleaned.replace(/[^a-zA-Z\s]/g, " ").trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "U";
    if (parts.length === 1) return parts[0][0]?.toUpperCase() || "U";
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Employee Management</h1>
          <p className="text-gray-600 mt-1">Manage employees, freelancers, and policy assignments</p>
        </div>
        {isManager && (
        <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
          <DialogTrigger asChild>
            <Button
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => {
                setEditingEmployee(null);
                resetForm();
              }}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Add Employee
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingEmployee ? "Edit Employee" : "Add New Employee"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Select Users *</Label>
                <Popover open={isUserPickerOpen} onOpenChange={setIsUserPickerOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={isUserPickerOpen}
                      disabled={!!editingEmployee}
                      className="w-full justify-between min-h-11 h-auto"
                    >
                      <div className="flex flex-wrap gap-2">
                        {selectedUsers.length > 0 ? (
                          selectedUsers.map((selected) => (
                            <Badge
                              key={selected._id.toString()}
                              variant="secondary"
                              className="flex items-center gap-1"
                            >
                              <span className="font-semibold">
                                {getInitials(selected.name || selected.email)}
                              </span>
                              <span className="truncate max-w-30">{selected.name || selected.email}</span>
                              {!editingEmployee && (
                                <button
                                  type="button"
                                  className="ml-1 text-muted-foreground hover:text-foreground"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleSelectedUser(selected._id.toString());
                                  }}
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              )}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-muted-foreground">Select users...</span>
                        )}
                      </div>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search users..." />
                      <CommandList>
                        <CommandEmpty>No users found.</CommandEmpty>
                        <CommandGroup>
                          {userPickerOptions.map((userOption) => {
                            const userId = userOption._id.toString();
                            const isSelected = selectedUserIds.includes(userId);
                            return (
                              <CommandItem
                                key={userId}
                                value={`${userOption.name || ""} ${userOption.email || ""} ${userOption.role || ""}`}
                                onSelect={() => toggleSelectedUser(userId)}
                              >
                                <div className="flex items-center gap-3">
                                  <div className="h-9 w-9 rounded-full bg-muted text-muted-foreground font-semibold flex items-center justify-center text-xs">
                                    {getInitials(userOption.name || userOption.email)}
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-sm font-medium">{userOption.name || "Unnamed User"}</span>
                                    <span className="text-xs text-muted-foreground">{userOption.email}</span>
                                  </div>
                                </div>
                                <div className="ml-auto flex items-center gap-3">
                                  <span className="text-xs text-muted-foreground uppercase">{userOption.role}</span>
                                  <Check className={`h-4 w-4 ${isSelected ? "opacity-100" : "opacity-0"}`} />
                                </div>
                              </CommandItem>
                            );
                          })}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {editingEmployee && selectedUsers[0] && (
                  <p className="text-xs text-muted-foreground">
                    Editing {selectedUsers[0].name || selectedUsers[0].email}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="employeeType">Employee Type *</Label>
                  <Select
                    value={formData.employeeType}
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        employeeType: value,
                        freelancerInitiatorIds: value.startsWith("freelancer") ? prev.freelancerInitiatorIds : [],
                      }))
                    }
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
                <div>
                  <Label htmlFor="hodId">Assign HOD *</Label>
                  {user?.role === "hod" ? (
                    <Input value={user?.name || user?.email || "Assigned to you"} readOnly />
                  ) : (
                    <Select value={formData.hodId} onValueChange={(value) => setFormData({ ...formData, hodId: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select HOD" />
                      </SelectTrigger>
                      <SelectContent>
                        {hodOptions.map((hod) => (
                          <SelectItem key={hod._id.toString()} value={hod._id.toString()}>
                            {hod.name || hod.email} ({hod.role})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>

              {formData.employeeType.startsWith("freelancer") && (
                <div>
                  <Label>Assign Initiators *</Label>
                  <div className="mt-2 max-h-40 overflow-y-auto rounded-md border bg-background p-3 space-y-2">
                    {initiatorOptions.map((user) => (
                      <div key={user._id.toString()} className="flex items-center space-x-2">
                        <Checkbox
                          id={`freelancer-init-${user._id.toString()}`}
                          checked={formData.freelancerInitiatorIds.includes(user._id.toString())}
                          onCheckedChange={() => toggleFreelancerInitiator(user._id.toString())}
                        />
                        <label htmlFor={`freelancer-init-${user._id.toString()}`} className="text-sm cursor-pointer">
                          {user.name || user.email} ({user.role})
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => handleDialogClose(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting || updateEmployee.isPending}>
                  {(isSubmitting || updateEmployee.isPending) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {editingEmployee ? "Update Employee" : "Add Employee"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        )}
      </div>

      {employees.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-600">
              {isManager
                ? "No employees yet. Add your first employee to get started."
                : "No employees assigned to you yet."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {employees.map((employee) => (
            <Card key={employee._id.toString()} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    {isManager ? (
                      <Button
                        variant="link"
                        className="p-0 h-auto text-left"
                        onClick={() => openAssignmentDrawer(employee)}
                      >
                        <CardTitle className="text-lg truncate">{employee.name}</CardTitle>
                      </Button>
                    ) : (
                      <CardTitle className="text-lg truncate">{employee.name}</CardTitle>
                    )}
                    <p className="text-sm text-gray-600 mt-1 truncate">{employee.email}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {isManager && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(employee._id.toString())}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(employee)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Sheet
                          open={selectedEmployee?._id?.toString() === employee._id?.toString()}
                          onOpenChange={(open) => {
                            if (!open) {
                              setSelectedEmployee(null);
                              setAssignmentForm({ policyId: "", initiatorIds: [], effectiveDate: "" });
                            }
                          }}
                        >
                          <SheetTrigger asChild>
                            <Button variant="ghost" size="sm" onClick={() => openAssignmentDrawer(employee)}>
                              <Settings2 className="h-4 w-4" />
                            </Button>
                          </SheetTrigger>
                          <SheetContent className="w-105 sm:w-140 overflow-y-auto">
                        <SheetHeader>
                          <SheetTitle>Assign Policy to {employee.name}</SheetTitle>
                        </SheetHeader>
                        <div className="mt-6 space-y-6">
                          <div className="space-y-2">
                            <Label>Select Policy</Label>
                            <Select
                              value={assignmentForm.policyId}
                              onValueChange={(value) => setAssignmentForm((prev) => ({ ...prev, policyId: value }))}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Choose a policy" />
                              </SelectTrigger>
                              <SelectContent>
                                {activePolicies.map((policy) => (
                                  <SelectItem key={policy._id.toString()} value={policy._id.toString()}>
                                    {policy.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label>Effective Date</Label>
                            <Input
                              type="date"
                              value={assignmentForm.effectiveDate}
                              onChange={(e) => setAssignmentForm((prev) => ({ ...prev, effectiveDate: e.target.value }))}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Select Initiators</Label>
                            <p className="text-xs text-muted-foreground">
                              Choose who can initiate requests for this policy.
                            </p>
                            <div className="max-h-48 overflow-y-auto rounded-md border bg-background p-3 space-y-2">
                              {initiatorOptions.map((user) => (
                                <div key={user._id.toString()} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`policy-init-${user._id.toString()}`}
                                    checked={assignmentForm.initiatorIds.includes(user._id.toString())}
                                    onCheckedChange={() => togglePolicyInitiator(user._id.toString())}
                                  />
                                  <label htmlFor={`policy-init-${user._id.toString()}`} className="text-sm cursor-pointer">
                                    {user.name || user.email} ({user.role})
                                  </label>
                                </div>
                              ))}
                            </div>
                          </div>

                          <Button onClick={handleAssignPolicy} disabled={assignPolicy.isPending} className="w-full">
                            {assignPolicy.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Assign Policy
                          </Button>

                          {employee.policyAssignments && employee.policyAssignments.length > 0 && (
                            <div className="mt-6 pt-6 border-t">
                              <h4 className="font-semibold mb-3">Current Assignments</h4>
                              <div className="space-y-3">
                                {employee.policyAssignments.map((assignment) => (
                                  <div key={assignment._id.toString()} className="border rounded-lg p-3">
                                    <div className="flex items-start justify-between mb-2">
                                      <div>
                                        <p className="font-medium text-sm">{assignment.policy?.name || "Policy"}</p>
                                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                          <Calendar className="w-3 h-3" />
                                          {assignment.effectiveDate
                                            ? new Date(assignment.effectiveDate).toLocaleDateString()
                                            : "-"}
                                        </p>
                                      </div>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleRemoveAssignment(assignment._id.toString())}
                                        className="text-destructive hover:text-destructive"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </div>
                                    {assignment.initiators && assignment.initiators.length > 0 && (
                                      <div className="flex flex-wrap gap-1 mt-2">
                                        {assignment.initiators.map((init) => (
                                          <Badge key={init._id.toString()} variant="outline" className="text-xs">
                                            {init.name}
                                          </Badge>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </SheetContent>
                    </Sheet>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Type</span>
                    <Badge variant="outline">{employeeTypeLabel(employee.employeeType)}</Badge>
                  </div>
                  {employee.hodId && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">HOD</span>
                      <span>{getHodDisplayName(employee)}</span>
                    </div>
                  )}
                  {employee.employeeType?.startsWith("freelancer") && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Initiators</span>
                      <span className="text-right">
                        {getInitiatorNames(employee).length > 0 ? getInitiatorNames(employee).join(", ") : "-"}
                      </span>
                    </div>
                  )}
                  {employee.policyAssignments && employee.policyAssignments.length > 0 && (
                    <div className="mt-4 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Policies</span>
                        <span className="text-right">
                          {employee.policyAssignments
                            .map((assignment) => assignment.policy?.name)
                            .filter(Boolean)
                            .join(", ") || employee.policyAssignments.length}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Policy Initiators</span>
                        <span className="text-right">
                          {getPolicyInitiatorNames(employee).length > 0
                            ? getPolicyInitiatorNames(employee).join(", ")
                            : "-"}
                        </span>
                      </div>
                    </div>
                  )}
                  {(canInitiateForEmployee(employee) || getInitiatablePolicyAssignments(employee).length > 0) && (
                    <div className="pt-4 flex flex-wrap justify-end gap-2">
                      {getInitiatablePolicyAssignments(employee).length > 0 && (
                        <Button variant="outline" size="sm" onClick={() => openPolicyDialog(employee)}>
                          Initiate Policy
                        </Button>
                      )}
                      {canInitiateForEmployee(employee) && (
                        <Button variant="outline" size="sm" onClick={() => openInitiateDialog(employee)}>
                          Initiate Freelance
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isInitiateDialogOpen} onOpenChange={handleInitiateDialogChange}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Initiate Freelancer Details</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleInitiateSubmit} className="space-y-4">
            {initiateTarget && (
              <div className="rounded-md bg-accent/30 p-3 text-sm space-y-1">
                <p>
                  <span className="font-medium">User:</span> {initiateTarget.name || "Unnamed"} (
                  {initiateTarget.email})
                </p>
                <p>
                  <span className="font-medium">Type:</span> {employeeTypeLabel(initiateTarget.employeeType)}
                </p>
                <p>
                  <span className="font-medium">HOD:</span> {getHodDisplayName(initiateTarget)}
                </p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="freelancer-details">Freelancer Details *</Label>
              <Textarea
                id="freelancer-details"
                value={initiateForm.details}
                onChange={(event) => setInitiateForm((prev) => ({ ...prev, details: event.target.value }))}
                placeholder="Share freelancer details (max 1000+ words)"
                rows={5}
                maxLength={2000}
                className="h-32 max-h-40 break-words break-all overflow-y-auto overflow-x-hidden resize-none"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="freelancer-amount">Amount *</Label>
              <Input
                id="freelancer-amount"
                type="number"
                min="0"
                step="0.01"
                value={initiateForm.amount}
                onChange={(event) => setInitiateForm((prev) => ({ ...prev, amount: event.target.value }))}
                placeholder="Enter amount"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="freelancer-files">Upload / Attach Document</Label>
              <Input
                id="freelancer-files"
                type="file"
                multiple
                accept=".pdf,.png,.jpg,.jpeg,.gif,.webp,.doc,.docx,.xls,.xlsx"
                onChange={(event) =>
                  setInitiateForm((prev) => ({
                    ...prev,
                    files: Array.from(event.target.files || []),
                  }))
                }
              />
              {initiateForm.files.length > 0 && (
                <div className="text-xs text-muted-foreground space-y-1">
                  <p className="font-medium">Selected files</p>
                  <ul className="list-disc list-inside">
                    {initiateForm.files.map((file) => (
                      <li key={file.name}>{file.name}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => handleInitiateDialogChange(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  isInitiateSubmitting || uploadCreditAttachments.isPending || createCreditRequest.isPending
                }
              >
                {(isInitiateSubmitting || uploadCreditAttachments.isPending || createCreditRequest.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Initiate Freelance
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isPolicyDialogOpen} onOpenChange={handlePolicyDialogChange}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Initiate Policy Details</DialogTitle>
          </DialogHeader>
          <form onSubmit={handlePolicySubmit} className="space-y-4">
            {policyTarget && (
              <div className="rounded-md bg-accent/30 p-3 text-sm space-y-1">
                <p>
                  <span className="font-medium">User:</span> {policyTarget.name || "Unnamed"} ({policyTarget.email})
                </p>
                <p>
                  <span className="font-medium">Type:</span> {employeeTypeLabel(policyTarget.employeeType)}
                </p>
                <p>
                  <span className="font-medium">HOD:</span> {getHodDisplayName(policyTarget)}
                </p>
              </div>
            )}
            <div className="space-y-2">
              <Label>Select Policy *</Label>
              <Select
                value={policyForm.assignmentId}
                onValueChange={(value) => setPolicyForm((prev) => ({ ...prev, assignmentId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a policy" />
                </SelectTrigger>
                <SelectContent>
                  {getInitiatablePolicyAssignments(policyTarget || {}).map((assignment) => (
                    <SelectItem key={assignment._id.toString()} value={assignment._id.toString()}>
                      {assignment.policy?.name || "Policy"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="policy-details">Policy Details *</Label>
              <Textarea
                id="policy-details"
                value={policyForm.details}
                onChange={(event) => setPolicyForm((prev) => ({ ...prev, details: event.target.value }))}
                placeholder="Share policy details (max 1000+ words)"
                rows={5}
                maxLength={2000}
                className="h-32 max-h-40 break-words break-all overflow-y-auto overflow-x-hidden resize-none"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="policy-amount">Amount *</Label>
              <Input
                id="policy-amount"
                type="number"
                min="0"
                step="0.01"
                value={policyForm.amount}
                onChange={(event) => setPolicyForm((prev) => ({ ...prev, amount: event.target.value }))}
                placeholder="Enter amount"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="policy-files">Upload / Attach Document</Label>
              <Input
                id="policy-files"
                type="file"
                multiple
                accept=".pdf,.png,.jpg,.jpeg,.gif,.webp,.doc,.docx,.xls,.xlsx"
                onChange={(event) =>
                  setPolicyForm((prev) => ({
                    ...prev,
                    files: Array.from(event.target.files || []),
                  }))
                }
              />
              {policyForm.files.length > 0 && (
                <div className="text-xs text-muted-foreground space-y-1">
                  <p className="font-medium">Selected files</p>
                  <ul className="list-disc list-inside">
                    {policyForm.files.map((file) => (
                      <li key={file.name}>{file.name}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => handlePolicyDialogChange(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isPolicySubmitting || uploadCreditAttachments.isPending || createCreditRequest.isPending}
              >
                {(isPolicySubmitting || uploadCreditAttachments.isPending || createCreditRequest.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Initiate Policy
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}



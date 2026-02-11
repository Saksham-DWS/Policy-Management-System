import { useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, CheckCircle, XCircle, Clock, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/_core/hooks/useAuth";
import { formatCurrencyValue, getUserCurrency } from "@/lib/currency";
export default function Approvals() {
    const { user } = useAuth();
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [actionType, setActionType] = useState("approve");
    const [rejectionReason, setRejectionReason] = useState("");
    const [detailRequest, setDetailRequest] = useState(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const { data: pendingRequests, isLoading, refetch } = api.creditRequests.getPendingApprovals.useQuery();
    const isManager = user?.role === "admin" || user?.role === "hod";
    const approveRequest = (isManager
        ? api.creditRequests.hodApprove
        : api.creditRequests.employeeApprove).useMutation({
        onSuccess: () => {
            toast.success(isManager ? "Credit request approved successfully" : "Approval submitted");
            setIsDialogOpen(false);
            setSelectedRequest(null);
            refetch(); 
        }, 
        onError: (error) => {
            toast.error(error.message);
        },
    });
    const rejectRequest = (isManager
        ? api.creditRequests.hodReject
        : api.creditRequests.employeeReject).useMutation({
        onSuccess: () => {
            toast.success("Request rejected");
            setIsDialogOpen(false);
            setSelectedRequest(null);
            setRejectionReason("");
            refetch();
        },
        onError: (error) => {
            toast.error(error.message);
        },
    });
    const handleApprove = (request) => {
        setSelectedRequest(request);
        setActionType("approve");
        setIsDialogOpen(true);
    };
    const handleReject = (request) => {
        setSelectedRequest(request);
        setActionType("reject");
        setIsDialogOpen(true);
    };
    const confirmAction = () => {
        if (actionType === "approve") {
            approveRequest.mutate({ requestId: selectedRequest._id.toString() });
        }
        else {
            if (!rejectionReason.trim()) {
                toast.error("Please provide a reason for rejection");
                return;
            }
            rejectRequest.mutate({
                requestId: selectedRequest._id.toString(),
                reason: rejectionReason,
            });
        }
    };
    const statusConfig = (status) => {
      switch (status) {
        case "pending_approval":
          return { label: "PENDING HOD", className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" };
        case "pending_employee_approval":
          return { label: "PENDING EMPLOYEE", className: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200" };
        case "pending_signature":
          return { label: "PENDING SIGNATURE", className: "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200" };
        case "approved":
          return { label: "APPROVED", className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200" };
        case "rejected_by_hod":
          return { label: "REJECTED (HOD)", className: "bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200" };
        case "rejected_by_employee":
          return { label: "REJECTED (EMPLOYEE)", className: "bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200" };
        case "rejected_by_user":
          return { label: "REJECTED (USER)", className: "bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200" };
        default:
          return { label: status?.toUpperCase?.() || "UNKNOWN", className: "bg-slate-100 text-slate-800" };
      }
    };
    const sortedRequests = (pendingRequests || []).slice().sort((a, b) => {
      const priority = {
        pending_approval: 0,
        pending_employee_approval: 1,
        pending_signature: 2,
        approved: 3,
        rejected_by_hod: 4,
        rejected_by_employee: 5,
        rejected_by_user: 6,
      };
      const aScore = priority[a.status] ?? 99;
      const bScore = priority[b.status] ?? 99;
      if (aScore !== bScore) return aScore - bScore;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    const pendingCount = (pendingRequests || []).filter((request) =>
      isManager ? request.status === "pending_approval" : request.status === "pending_employee_approval",
    ).length;
    if (isLoading) {
        return (<div className="flex justify-center items-center min-h-100">
        <Loader2 className="w-8 h-8 animate-spin text-primary"/>
      </div>);
    }
    return (<div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Approvals</h1>
        <p className="text-muted-foreground mt-1">
          {isManager
            ? "Review, approve, and track credit requests"
            : "Review, approve, and track your incentive requests"}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Requests ({pendingRequests?.length || 0})</CardTitle>
          <p className="text-xs text-muted-foreground">Pending: {pendingCount}</p>
        </CardHeader>
        <CardContent>
          {!pendingRequests || pendingRequests.length === 0 ? (<div className="text-center py-12">
              <CheckCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4"/>
              <h3 className="text-lg font-semibold mb-2">All caught up!</h3>
              <p className="text-muted-foreground">No requests yet.</p>
            </div>) : (<div className="space-y-4">
              <div className="max-h-[560px] overflow-y-auto pr-1 space-y-3">
                {sortedRequests.map((request) => {
                  const requestId = request._id?.toString();
                  const statusMeta = statusConfig(request.status);
                  const requestCurrency = request.currency || getUserCurrency(request.user);
                  const isActionable = isManager
                    ? request.status === "pending_approval"
                    : request.status === "pending_employee_approval";
                  const isApproved = request.status === "approved";
                  const isRejected = request.status?.startsWith("rejected");
                  return (<div key={requestId} className="border rounded-lg px-4 py-3 hover:shadow-sm transition-shadow">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold truncate">
                            {request.user?.name || "Unnamed User"}
                          </h3>
                          <Badge className={`${statusMeta.className} flex items-center gap-1`}>
                            <Clock className="w-3 h-3"/>
                            {statusMeta.label}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{request.user?.email}</p>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-1">
                          <span className="font-medium text-foreground">
                            {request.type === "policy" ? "Policy" : "Freelancer"}
                          </span>
                          <span>-</span>
                          <span>
                            {request.type === "policy" ? request.policy?.name || "Policy" : request.user?.employeeType?.replace("_", " ")}
                          </span>
                          <span>-</span>
                          <button
                            type="button"
                            className="text-blue-600 hover:underline"
                            onClick={() => {
                                setDetailRequest(request);
                                setIsDetailOpen(true);
                            }}
                          >
                            {request.type === "policy" ? "Policy details" : "Freelance details"}
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 md:gap-4 shrink-0">
                        <div className="text-right">
                          <p className="text-lg font-semibold text-green-600">{formatCurrencyValue(request.amount, requestCurrency)}</p>
                          <p className="text-[11px] text-muted-foreground">Base: {formatCurrencyValue(request.baseAmount, requestCurrency)}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleApprove(request)}
                            size="sm"
                            disabled={!isActionable || approveRequest.isPending || rejectRequest.isPending}
                          >
                            <CheckCircle className="w-4 h-4 mr-1"/>
                            {isApproved ? "Accepted" : "Accept"}
                          </Button>
                          <Button
                            onClick={() => handleReject(request)}
                            variant="destructive"
                            size="sm"
                            disabled={!isActionable || approveRequest.isPending || rejectRequest.isPending}
                          >
                            <XCircle className="w-4 h-4 mr-1"/>
                            {isRejected ? "Rejected" : "Reject"}
                          </Button>
                        </div>
                      </div>
                    </div>

                  </div>);
                })}
              </div>
            </div>)}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "approve" ? "Approve Credit Request" : "Reject Credit Request"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {selectedRequest && (<div className="p-4 bg-accent/30 rounded-md space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Employee:</span>
                  <span className="text-sm">{selectedRequest.user?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Amount:</span>
                  <span className="text-sm font-bold text-green-600">{formatCurrencyValue(selectedRequest.amount, selectedRequest.currency || getUserCurrency(selectedRequest.user))}</span>
                </div>
                {selectedRequest.policy && (<div className="flex justify-between">
                    <span className="text-sm font-medium">Policy:</span>
                    <span className="text-sm">{selectedRequest.policy.name}</span>
                  </div>)}
              </div>)}

            {actionType === "reject" && (<div className="space-y-2">
                <Label htmlFor="reason">Reason for Rejection *</Label>
                <Textarea id="reason" value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} placeholder="Explain why this request is being rejected..." rows={4} required/>
              </div>)}

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => {
            setIsDialogOpen(false);
            setRejectionReason("");
        }}>
                Cancel
              </Button>
              <Button onClick={confirmAction} variant={actionType === "approve" ? "default" : "destructive"} disabled={approveRequest.isPending || rejectRequest.isPending}>
                {(approveRequest.isPending || rejectRequest.isPending) && (<Loader2 className="w-4 h-4 mr-2 animate-spin"/>)}
                {actionType === "approve" ? "Confirm Approval" : "Confirm Rejection"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{detailRequest?.type === "policy" ? "Policy Details" : "Freelance Details"}</DialogTitle>
          </DialogHeader>
          {detailRequest && (<div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">
                    Submitted by: <span className="text-muted-foreground">{detailRequest.initiator?.name}</span>
                  </p>
                  {detailRequest.type === "policy" && detailRequest.policy && (
                    <p className="text-sm font-medium">
                      Policy:{" "}
                      <span className="text-muted-foreground">{detailRequest.policy.name}</span>
                    </p>
                  )}
                  <p className="text-sm font-medium">
                    Calculation: <span className="text-muted-foreground">{detailRequest.calculationBreakdown || "-"}</span>
                  </p>
                </div>
                <div className="text-sm font-medium">
                  Submitted Date:{" "}
                  <span className="text-muted-foreground">
                    {new Date(detailRequest.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              {detailRequest.notes && (<div className="rounded-md bg-muted/50 p-3 text-sm">
                  <span className="font-medium text-muted-foreground">Notes:</span>{" "}
                  <span className="text-foreground">{detailRequest.notes}</span>
                </div>)}
              {detailRequest.attachments && detailRequest.attachments.length > 0 && (<div className="text-sm">
                  <p className="font-medium text-muted-foreground mb-2">Attachments</p>
                  <div className="flex flex-col gap-1">
                    {detailRequest.attachments.map((attachment) => (<a key={attachment.filename} href={attachment.url} className="text-blue-600 hover:underline" target="_blank" rel="noreferrer">
                        {attachment.originalName || attachment.filename}
                      </a>))}
                  </div>
                </div>)}
              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setIsDetailOpen(false)}>
                  Close
                </Button>
              </div>
            </div>)}
        </DialogContent>
      </Dialog>
    </div>);
}


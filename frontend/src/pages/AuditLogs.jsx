import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
export default function AuditLogs() {
    const { data: logs, isLoading } = api.audit.getLogs.useQuery({ limit: 50 });
    if (isLoading) {
        return <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin"/></div>;
    }
    return (<div className="space-y-6">
      <h1 className="text-3xl font-bold">Audit Logs</h1>
      <Card>
        <CardHeader>
          <CardTitle>System Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {logs?.map((log) => (<div key={log._id?.toString()} className="p-3 border rounded text-sm">
                <p className="font-medium">{log.action}</p>
                <p className="text-muted-foreground">
                  {new Date(log.createdAt).toLocaleString()}
                </p>
              </div>))}
          </div> 
        </CardContent>
      </Card>
    </div>);
}


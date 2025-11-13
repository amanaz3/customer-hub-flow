import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Send, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const NOTIFICATION_TYPES = [
  { value: "status_change", label: "Application Status Change" },
  { value: "task_assignment", label: "Task Track Tasks" },
  { value: "bulk_status_change", label: "Bulk Status Change" },
  { value: "document_upload", label: "Document Upload" },
  { value: "comment", label: "New Comment" },
];

export function NotificationTestingSection() {
  const { toast } = useToast();
  const [notificationType, setNotificationType] = useState("status_change");
  const [recipientUserId, setRecipientUserId] = useState("");
  const [sendInApp, setSendInApp] = useState(true);
  const [sendEmail, setSendEmail] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [results, setResults] = useState<any>(null);

  // Mock data fields
  const [customerName, setCustomerName] = useState("John Doe");
  const [applicationId, setApplicationId] = useState("");
  const [taskTitle, setTaskTitle] = useState("Complete customer onboarding");
  const [statusFrom, setStatusFrom] = useState("draft");
  const [statusTo, setStatusTo] = useState("submitted");
  const [documentName, setDocumentName] = useState("passport-scan.pdf");
  const [bulkCount, setBulkCount] = useState("5");
  const [comment, setComment] = useState("This is a test comment for notification testing.");

  const { data: users } = useQuery({
    queryKey: ["profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, name, email, role")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      return data;
    },
  });

  const handleSendTest = async () => {
    if (!recipientUserId) {
      toast({
        title: "Error",
        description: "Please select a recipient",
        variant: "destructive",
      });
      return;
    }

    if (!sendInApp && !sendEmail) {
      toast({
        title: "Error",
        description: "Please select at least one delivery method",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);
    setResults(null);

    try {
      const { data, error } = await supabase.functions.invoke("test-notification", {
        body: {
          notificationType,
          recipientUserId,
          sendInApp,
          sendEmail,
          mockData: {
            customerName,
            applicationId: applicationId || undefined,
            taskTitle,
            statusFrom,
            statusTo,
            documentName,
            bulkCount: parseInt(bulkCount) || 5,
            comment,
          },
        },
      });

      if (error) throw error;

      setResults(data);

      if (data.inAppSent || data.emailSent) {
        toast({
          title: "Test Sent Successfully",
          description: `In-app: ${data.inAppSent ? "✓" : "✗"} | Email: ${data.emailSent ? "✓" : "✗"}`,
        });
      } else {
        toast({
          title: "Test Failed",
          description: "No notifications were sent. Check results below.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Error sending test notification:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send test notification",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="notification-type">Notification Type</Label>
          <Select value={notificationType} onValueChange={setNotificationType}>
            <SelectTrigger id="notification-type" className="bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-background border shadow-md z-50">
              {NOTIFICATION_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="recipient">Recipient User</Label>
          <Select value={recipientUserId} onValueChange={setRecipientUserId}>
            <SelectTrigger id="recipient" className="bg-background">
              <SelectValue placeholder="Select a user" />
            </SelectTrigger>
            <SelectContent className="bg-background border shadow-md z-50">
              {users?.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.name} ({user.email})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        <Label>Delivery Methods</Label>
        <div className="flex gap-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="send-in-app"
              checked={sendInApp}
              onCheckedChange={(checked) => setSendInApp(checked as boolean)}
            />
            <label htmlFor="send-in-app" className="text-sm cursor-pointer">
              In-App
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="send-email"
              checked={sendEmail}
              onCheckedChange={(checked) => setSendEmail(checked as boolean)}
            />
            <label htmlFor="send-email" className="text-sm cursor-pointer">
              Email
            </label>
          </div>
        </div>
      </div>

      <div className="grid gap-3">
        {(notificationType === "status_change" || notificationType === "document_upload" || notificationType === "comment") && (
          <div className="space-y-2">
            <Label htmlFor="customer-name">Customer Name</Label>
            <Input
              id="customer-name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
          </div>
        )}

        {notificationType === "task_assignment" && (
          <div className="space-y-2">
            <Label htmlFor="task-title">Task Title</Label>
            <Input
              id="task-title"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
            />
          </div>
        )}

        {(notificationType === "status_change" || notificationType === "bulk_status_change") && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status-from">From Status</Label>
              <Input
                id="status-from"
                value={statusFrom}
                onChange={(e) => setStatusFrom(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status-to">To Status</Label>
              <Input
                id="status-to"
                value={statusTo}
                onChange={(e) => setStatusTo(e.target.value)}
              />
            </div>
          </div>
        )}

        {notificationType === "bulk_status_change" && (
          <div className="space-y-2">
            <Label htmlFor="bulk-count">Number of Applications</Label>
            <Input
              id="bulk-count"
              type="number"
              value={bulkCount}
              onChange={(e) => setBulkCount(e.target.value)}
            />
          </div>
        )}

        {notificationType === "document_upload" && (
          <div className="space-y-2">
            <Label htmlFor="document-name">Document Name</Label>
            <Input
              id="document-name"
              value={documentName}
              onChange={(e) => setDocumentName(e.target.value)}
            />
          </div>
        )}

        {notificationType === "comment" && (
          <div className="space-y-2">
            <Label htmlFor="comment">Comment Text</Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
            />
          </div>
        )}
      </div>

      <Button
        onClick={handleSendTest}
        disabled={isSending}
        className="w-full"
      >
        <Send className="w-4 h-4 mr-2" />
        {isSending ? "Sending..." : "Send Test Notification"}
      </Button>

      {results && (
        <div className="space-y-3 pt-4">
          <Alert variant={results.inAppSent ? "default" : "destructive"}>
            {results.inAppSent ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
            <AlertDescription>
              In-App: {results.inAppSent ? "Sent ✓" : "Failed ✗"}
            </AlertDescription>
          </Alert>

          <Alert variant={results.emailSent ? "default" : "destructive"}>
            {results.emailSent ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
            <AlertDescription>
              Email: {results.emailSent ? "Sent ✓" : "Failed ✗"}
            </AlertDescription>
          </Alert>

          {results.errors && results.errors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Errors:</strong>
                <ul className="list-disc pl-5 mt-2">
                  {results.errors.map((error: string, index: number) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}
    </div>
  );
}

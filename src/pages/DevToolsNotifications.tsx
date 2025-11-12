import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { NotificationTestingSection } from "@/components/DevTools/NotificationTestingSection";

export default function DevToolsNotifications() {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/dev-tools')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Admin Tools
        </Button>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Bell className="w-8 h-8" />
          Notification Testing
        </h1>
        <p className="text-muted-foreground mt-2">
          Test in-app and email notifications without affecting production data
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Test Notifications</CardTitle>
          <CardDescription>
            Send test notifications to verify your notification system is working correctly
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NotificationTestingSection />
        </CardContent>
      </Card>
    </div>
  );
}

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, ArrowLeft, Box, Users, DollarSign, Settings2, Landmark, Calculator, Globe, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { BankReadinessRulesTab } from "@/components/BankReadiness/BankReadinessRulesTab";
import { ReconciliationRulesAdmin } from "@/components/Bookkeeper/ReconciliationRulesAdmin";

export default function Configure1Business() {
  const navigate = useNavigate();
  const [showBankReadinessRules, setShowBankReadinessRules] = useState(false);
  const [showBookkeeperRules, setShowBookkeeperRules] = useState(false);

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/configure-1')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Configure 1
        </Button>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Building2 className="w-8 h-8" />
          Business Configuration
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage business configuration settings
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => navigate('/products')}
        >
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Box className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Product Management</CardTitle>
                <CardDescription>Manage products and categories</CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => navigate('/customer-services')}
        >
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Services</CardTitle>
                <CardDescription>Manage services and products</CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => navigate('/service-fees')}
        >
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-lg">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Service Fees</CardTitle>
                <CardDescription>Configure fee structures and pricing</CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => navigate('/service-form-configuration')}
        >
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Settings2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Service Details Form</CardTitle>
                <CardDescription>Configure dynamic forms for services</CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => setShowBankReadinessRules(true)}
        >
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Landmark className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Bank Readiness Rules</CardTitle>
                <CardDescription>Configure risk scoring and bank matching</CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => setShowBookkeeperRules(true)}
        >
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Calculator className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">AI Bookkeeper Rules</CardTitle>
                <CardDescription>Reconciliation rules and settings</CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Webflow Card */}
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Globe className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  Webflow
                  <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">New</span>
                </CardTitle>
                <CardDescription>Self-serve flow configuration</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div 
              className="p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors flex items-center gap-3"
              onClick={() => navigate('/webflow-config')}
            >
              <Settings2 className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm">Decision Engine</p>
                <p className="text-xs text-muted-foreground">Countries, jurisdictions, activities, pricing</p>
              </div>
            </div>
            <div 
              className="p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors flex items-center gap-3"
              onClick={() => navigate('/webflow-config?tab=documents')}
            >
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm">Document Matrix</p>
                <p className="text-xs text-muted-foreground">Required documents configuration</p>
              </div>
            </div>
            <div 
              className="p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors flex items-center gap-3"
              onClick={() => window.open('/webflow', '_blank')}
            >
              <Globe className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm">Preview Flow</p>
                <p className="text-xs text-muted-foreground">Test the customer self-serve flow</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
      <Dialog open={showBankReadinessRules} onOpenChange={setShowBankReadinessRules}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Bank Readiness Rules Engine</DialogTitle>
            <DialogDescription>
              Configure risk scoring rules based on your experience with bank rejections
            </DialogDescription>
          </DialogHeader>
          <BankReadinessRulesTab />
        </DialogContent>
      </Dialog>
      <Dialog open={showBookkeeperRules} onOpenChange={setShowBookkeeperRules}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>AI Bookkeeper Rules</DialogTitle>
            <DialogDescription>
              Configure reconciliation rules and matching settings
            </DialogDescription>
          </DialogHeader>
          <ReconciliationRulesAdmin />
        </DialogContent>
      </Dialog>
    </div>
  );
}

import React from 'react';
import { useWebflow } from '@/contexts/WebflowContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Building2, CreditCard, Calculator, FileText, 
  Clock, CheckCircle2, AlertCircle, User, RefreshCcw, Upload, HelpCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'completed': return <CheckCircle2 className="w-4 h-4 text-green-600" />;
    case 'in_progress': return <Clock className="w-4 h-4 text-amber-500" />;
    case 'pending': return <AlertCircle className="w-4 h-4 text-muted-foreground" />;
    default: return null;
  }
};

const documentNames: Record<string, string> = {
  passport: 'Passport Copy',
  photo: 'Passport Photo',
  emirates_id: 'Emirates ID',
  address_proof: 'Address Proof',
};

export const DashboardStep: React.FC = () => {
  const { state, resetFlow, updateState } = useWebflow();

  const handleDocumentUpload = (docId: string) => {
    updateState({
      documentsUploaded: [...state.documentsUploaded, docId],
      pendingDocuments: state.pendingDocuments.filter(id => id !== docId),
    });
  };

  const services = [
    {
      id: 'formation',
      title: 'Company Formation',
      icon: Building2,
      status: state.pendingDocuments.length > 0 ? 'pending' : 'in_progress',
      progress: state.pendingDocuments.length > 0 ? 45 : 65,
      nextAction: state.pendingDocuments.length > 0 
        ? 'Upload pending documents to continue' 
        : 'Awaiting document verification',
    },
    {
      id: 'banking',
      title: 'Bank Account',
      icon: CreditCard,
      status: state.includesBanking ? 'pending' : 'not_included',
      progress: state.includesBanking ? 0 : null,
      nextAction: state.includesBanking ? 'Will start after formation' : 'Not included in plan',
    },
    {
      id: 'bookkeeping',
      title: 'Bookkeeping',
      icon: Calculator,
      status: state.includesBookkeeping ? 'pending' : 'not_included',
      progress: state.includesBookkeeping ? 0 : null,
      nextAction: state.includesBookkeeping ? 'Setup pending' : 'Not included in plan',
    },
    {
      id: 'vat',
      title: 'VAT/Tax Filing',
      icon: FileText,
      status: state.includesVat ? 'pending' : 'not_included',
      progress: state.includesVat ? 0 : null,
      nextAction: state.includesVat ? 'Registration pending' : 'Not included in plan',
    },
  ];

  const pendingActions = [
    ...(state.pendingDocuments.length > 0 
      ? [{ text: `Upload ${state.pendingDocuments.length} pending document(s)`, urgent: true, type: 'documents' }]
      : []),
    { text: 'Schedule identity verification call', urgent: false, type: 'action' },
    { text: 'Review and sign MOA', urgent: false, type: 'action' },
  ];

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-2xl">Welcome, {state.founderName || 'Founder'}!</CardTitle>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Track the progress of your company and compliance tasks here.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <CardDescription>
                Track your business setup progress here
              </CardDescription>
            </div>
            <Badge variant="secondary" className="text-sm">
              Ref: {state.paymentReference || 'N/A'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="font-medium">Your Assigned Agent</p>
              <p className="text-sm text-muted-foreground">
                An agent will be assigned within 24 hours
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pending Documents Alert */}
      {state.pendingDocuments.length > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              <CardTitle className="text-lg text-amber-800">Pending Documents</CardTitle>
            </div>
            <CardDescription className="text-amber-700">
              Please upload these documents to continue your application
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-3">
              {state.pendingDocuments.map(docId => (
                <div
                  key={docId}
                  className="flex items-center justify-between p-3 bg-white rounded-lg border border-amber-200"
                >
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-500" />
                    <span className="text-sm font-medium">{documentNames[docId] || docId}</span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDocumentUpload(docId)}
                    className="border-amber-300 hover:bg-amber-100"
                  >
                    <Upload className="w-4 h-4 mr-1" />
                    Upload
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {services.map(service => {
          const Icon = service.icon;
          const isIncluded = service.status !== 'not_included';

          return (
            <Card key={service.id} className={cn(!isIncluded && "opacity-60")}>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center",
                    isIncluded ? "bg-primary/10" : "bg-muted"
                  )}>
                    <Icon className={cn(
                      "w-5 h-5",
                      isIncluded ? "text-primary" : "text-muted-foreground"
                    )} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">{service.title}</h3>
                      {getStatusIcon(service.status)}
                    </div>
                    {service.progress !== null && (
                      <Progress value={service.progress} className="h-2 mb-2" />
                    )}
                    <p className="text-sm text-muted-foreground">{service.nextAction}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Pending Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {pendingActions.map((action, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {action.urgent ? (
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                  ) : (
                    <Clock className="w-4 h-4 text-muted-foreground" />
                  )}
                  <span className="text-sm">{action.text}</span>
                </div>
                <Button size="sm" variant="outline">
                  Complete
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center">
        <Button variant="ghost" onClick={resetFlow} className="text-muted-foreground">
          <RefreshCcw className="w-4 h-4 mr-2" />
          Start New Application
        </Button>
      </div>
    </div>
  );
};

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useWebflow } from '@/contexts/WebflowContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, CreditCard, Calculator, FileText, 
  Clock, CheckCircle2, AlertCircle, User, RefreshCcw, 
  Upload, Sparkles, ArrowRight, PartyPopper
} from 'lucide-react';
import { cn } from '@/lib/utils';

const documentNames: Record<string, string> = {
  passport: 'Passport Copy',
  photo: 'Passport Photo',
  emirates_id: 'Emirates ID',
  address_proof: 'Address Proof',
};

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
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
      emoji: '🏢',
      status: state.pendingDocuments.length > 0 ? 'pending' : 'in_progress',
      progress: state.pendingDocuments.length > 0 ? 45 : 65,
      nextAction: state.pendingDocuments.length > 0 
        ? 'Upload pending documents' 
        : 'Document verification in progress',
    },
    {
      id: 'banking',
      title: 'Bank Account',
      icon: CreditCard,
      emoji: '💳',
      status: state.includesBanking ? 'pending' : 'not_included',
      progress: state.includesBanking ? 0 : null,
      nextAction: state.includesBanking ? 'Starts after formation' : 'Not in plan',
    },
    {
      id: 'bookkeeping',
      title: 'Bookkeeping',
      icon: Calculator,
      emoji: '📊',
      status: state.includesBookkeeping ? 'pending' : 'not_included',
      progress: state.includesBookkeeping ? 0 : null,
      nextAction: state.includesBookkeeping ? 'Setup pending' : 'Not in plan',
    },
    {
      id: 'vat',
      title: 'VAT/Tax Filing',
      icon: FileText,
      emoji: '📝',
      status: state.includesVat ? 'pending' : 'not_included',
      progress: state.includesVat ? 0 : null,
      nextAction: state.includesVat ? 'Registration pending' : 'Not in plan',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/10">
      {/* Header */}
      <div className="bg-background/80 backdrop-blur-sm border-b sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-bold">Business Dashboard</h1>
                <p className="text-sm text-muted-foreground">Track your setup progress</p>
              </div>
            </div>
            <Badge variant="secondary" className="font-mono">
              {state.paymentReference || 'REF-PENDING'}
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Welcome Card */}
        <Card className="border-0 shadow-lg bg-gradient-to-r from-primary/10 via-primary/5 to-accent/10">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center">
                <PartyPopper className="w-8 h-8 text-primary-foreground" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-1">
                  Welcome, {state.founderName || 'Entrepreneur'}! 🎉
                </h2>
                <p className="text-muted-foreground">
                  Your UAE business journey has begun. We're processing your application.
                </p>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-background/60 rounded-xl flex items-center gap-4">
              <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-muted-foreground" />
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

        {/* Pending Documents */}
        {state.pendingDocuments.length > 0 && (
          <Card className="border-amber-200 bg-amber-50/50 animate-fade-in">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                <CardTitle className="text-lg text-amber-800">
                  Pending Documents ({state.pendingDocuments.length})
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-3">
                {state.pendingDocuments.map(docId => (
                  <div
                    key={docId}
                    className="flex items-center justify-between p-4 bg-white rounded-xl border border-amber-200"
                  >
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-amber-500" />
                      <span className="font-medium">{documentNames[docId]}</span>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleDocumentUpload(docId)}
                      className="gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      Upload
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Services Grid */}
        <div className="grid md:grid-cols-2 gap-4">
          {services.map(service => {
            const Icon = service.icon;
            const isIncluded = service.status !== 'not_included';

            return (
              <Card 
                key={service.id} 
                className={cn(
                  "transition-all hover:shadow-lg",
                  !isIncluded && "opacity-50"
                )}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center text-2xl",
                      isIncluded ? "bg-primary/10" : "bg-muted"
                    )}>
                      {service.emoji}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">{service.title}</h3>
                        {service.status === 'in_progress' && (
                          <Badge className="bg-amber-100 text-amber-800">In Progress</Badge>
                        )}
                        {service.status === 'pending' && isIncluded && (
                          <Badge variant="secondary">Pending</Badge>
                        )}
                        {!isIncluded && (
                          <Badge variant="outline" className="text-muted-foreground">
                            Not Included
                          </Badge>
                        )}
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

        {/* Quick Actions */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-3">
              <Button variant="outline" className="h-auto py-4 flex-col gap-2">
                <User className="w-5 h-5" />
                <span>Contact Agent</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col gap-2">
                <FileText className="w-5 h-5" />
                <span>View Documents</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col gap-2">
                <CreditCard className="w-5 h-5" />
                <span>Payment History</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Reset */}
        <div className="flex justify-center pt-4">
          <Button 
            variant="ghost" 
            onClick={() => {
              resetFlow();
              navigate('/webflow-simple');
            }} 
            className="text-muted-foreground"
          >
            <RefreshCcw className="w-4 h-4 mr-2" />
            Start New Application
          </Button>
        </div>
      </div>
    </div>
  );
};

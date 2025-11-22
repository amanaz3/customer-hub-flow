import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Building2, Mail, Phone, FileText, MessageSquare, Users, RefreshCw, Calendar, Clock, AlertTriangle, Save, Edit, Download, Lightbulb, Calculator, TrendingUp } from 'lucide-react';
import jsPDF from 'jspdf';
import { useAuth } from '@/contexts/SecureAuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { ApplicationService } from '@/services/applicationService';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import type { Application } from '@/types/application';
import { formatApplicationReferenceWithPrefix } from '@/utils/referenceNumberFormatter';
import { CompletionDateDialog } from '@/components/Customer/CompletionDateDialog';
import { CompletionDateHistory } from '@/components/Customer/CompletionDateHistory';
import { AssessmentHistory } from '@/components/Customer/AssessmentHistory';

const ApplicationDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [showCompletionDateDialog, setShowCompletionDateDialog] = useState(false);
  const [pendingStatusUpdate, setPendingStatusUpdate] = useState<string | null>(null);
  const [isEditingCompletionDate, setIsEditingCompletionDate] = useState(false);
  const [systemCompletedTime, setSystemCompletedTime] = useState<string | null>(null);
  const [maxApplicationRef, setMaxApplicationRef] = useState<number>(0);
  const [estimatedCompletionTime, setEstimatedCompletionTime] = useState<string>('');
  const [showRiskDialog, setShowRiskDialog] = useState(false);
  const [productName, setProductName] = useState<string | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<'manual' | 'rule' | 'ai' | 'hybrid' | ''>('');
  const [manualRiskLevel, setManualRiskLevel] = useState<'low' | 'medium' | 'high' | ''>('');
  const [manualReason, setManualReason] = useState('');
  const [calculatedRisk, setCalculatedRisk] = useState<{
    score: number;
    level: 'low' | 'medium' | 'high';
    details: string;
    calculationBreakdown?: Array<{factor: string; points: number}>;
    aiData?: {
      reasoning: string; 
      factors: Array<{factor: string; impact: string; description: string}>;
      scoreBreakdown?: Array<{factor: string; points_contribution: number; justification: string; impact_level: string}>;
      keyConcerns?: string[];
      mitigatingFactors?: string[];
    };
  } | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // Helper function to extract recommendations from assessment
  const getRecommendations = (assessment: any): string[] => {
    if (!assessment) return [];
    
    // AI method - get from aiAnalysis.recommendations
    if (assessment.method === 'ai' && assessment.aiAnalysis?.recommendations) {
      return assessment.aiAnalysis.recommendations;
    }
    
    // Rule-based method - parse from rawDetails
    if (assessment.method === 'rule' && assessment.rawDetails) {
      try {
        const parsed = JSON.parse(assessment.rawDetails);
        if (parsed.recommendations) return parsed.recommendations;
      } catch (e) {
        // Ignore parse errors
      }
    }
    
    // Manual/Hybrid - return generic recommendations based on risk level
    const level = assessment.level;
    if (level === 'high') {
      return [
        'Implement enhanced due diligence procedures',
        'Conduct thorough background checks on all stakeholders',
        'Ensure comprehensive compliance documentation is maintained',
        'Consider additional verification steps before approval'
      ];
    } else if (level === 'medium') {
      return [
        'Maintain detailed records of all business activities and transactions',
        'Ensure all shareholder and signatory documentation is complete',
        'Implement regular compliance review procedures',
        'Monitor for any changes in risk profile'
      ];
    } else {
      return [
        'Continue maintaining good compliance practices',
        'Keep all business documentation updated regularly',
        'Monitor for any changes in risk profile',
        'Conduct periodic reviews as per standard procedures'
      ];
    }
  };

  // Helper function to generate action plan for agents
  const getActionPlan = (assessment: any): string[] => {
    if (!assessment) return [];
    
    const level = assessment.level;
    const method = assessment.method;
    
    let actionPlan: string[] = [];
    
    if (level === 'high') {
      actionPlan = [
        'Schedule an immediate compliance review meeting with the customer',
        'Request additional documentation: beneficial ownership structure, source of funds verification, and detailed business plan',
        'Conduct enhanced background checks on all directors, shareholders, and beneficial owners',
        'Verify all business licenses, permits, and regulatory approvals',
        'Escalate to senior management for approval decision',
        'Document all findings and maintain comprehensive audit trail',
        'Set up ongoing monitoring protocols if approved'
      ];
    } else if (level === 'medium') {
      actionPlan = [
        'Review all submitted documentation for completeness and accuracy',
        'Verify shareholder and signatory information against official records',
        'Conduct standard background checks on key individuals',
        'Request any missing or incomplete documentation',
        'Schedule a follow-up call with the customer to clarify any ambiguities',
        'Document the review process and findings',
        'Proceed with approval process once all requirements are met'
      ];
    } else {
      actionPlan = [
        'Perform standard document verification and completeness check',
        'Verify customer identity and business registration details',
        'Ensure all required forms are properly completed and signed',
        'Process the application through standard approval workflow',
        'Document the assessment and file accordingly',
        'Notify the customer of the approval timeline'
      ];
    }
    
    // Add method-specific actions
    if (method === 'ai') {
      actionPlan.push('Review AI-generated risk factors and ensure all identified concerns are addressed');
    }
    
    return actionPlan;
  };

  const generateAssessmentPDF = async () => {
    if (!application || !application.application_assessment?.riskAssessment) return;

    const assessment = application.application_assessment as any;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = 20;

    // Title
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Risk Assessment Report', pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;

    // Application details
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Application: ${formatApplicationReferenceWithPrefix(application.reference_number, maxApplicationRef, application.created_at)}`, 20, yPos);
    yPos += 7;
    doc.text(`Customer: ${application.customer?.name || 'N/A'}`, 20, yPos);
    yPos += 7;
    doc.text(`Product: ${productName || 'N/A'}`, 20, yPos);
    yPos += 15;

    // Last Assessment Summary
    if (assessment.lastAssessment) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Current Assessment', 20, yPos);
      yPos += 10;
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      const lastAssess = assessment.lastAssessment;
      doc.text(`Method: ${lastAssess.method.toUpperCase()}`, 20, yPos);
      yPos += 7;
      doc.text(`Risk Level: ${lastAssess.level.toUpperCase()}`, 20, yPos);
      yPos += 7;
      doc.text(`Risk Score: ${lastAssess.score}/100`, 20, yPos);
      yPos += 7;
      doc.text(`Date: ${new Date(lastAssess.timestamp).toLocaleString()}`, 20, yPos);
      yPos += 12;
    }

    // Rule-Based Calculation Breakdown
    if (assessment.riskAssessment.method === 'rule' && assessment.riskAssessment.calculationBreakdown) {
      if (yPos > 220) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Calculation Details', 20, yPos);
      yPos += 10;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Total Risk Score: ${assessment.riskAssessment.score}/100`, 20, yPos);
      yPos += 8;

      assessment.riskAssessment.calculationBreakdown.forEach((item: any) => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        doc.text(`${item.factor}: +${item.points} pts`, 25, yPos);
        yPos += 6;
      });
      yPos += 8;
    }

    // AI Score Breakdown with detailed factors
    if (assessment.riskAssessment.method === 'ai' && assessment.riskAssessment.aiAnalysis?.scoreBreakdown) {
      if (yPos > 200) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('AI Score Breakdown', 20, yPos);
      yPos += 10;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Total Risk Score: ${assessment.riskAssessment.score}/100`, 20, yPos);
      yPos += 8;

      assessment.riskAssessment.aiAnalysis.scoreBreakdown.forEach((item: any) => {
        if (yPos > 260) {
          doc.addPage();
          yPos = 20;
        }
        doc.setFont('helvetica', 'bold');
        doc.text(`${item.factor} [${item.impact_level.toUpperCase()}]: +${item.points_contribution} pts`, 25, yPos);
        yPos += 5;
        
        doc.setFont('helvetica', 'normal');
        const splitJustification = doc.splitTextToSize(item.justification, pageWidth - 50);
        splitJustification.forEach((line: string) => {
          if (yPos > 280) {
            doc.addPage();
            yPos = 20;
          }
          doc.text(line, 30, yPos);
          yPos += 5;
        });
        yPos += 4;
      });
      yPos += 8;
    }

    // Key Concerns (AI only)
    if (assessment.riskAssessment.aiAnalysis?.keyConcerns?.length > 0) {
      if (yPos > 240) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Key Concerns', 20, yPos);
      yPos += 8;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      assessment.riskAssessment.aiAnalysis.keyConcerns.forEach((concern: string) => {
        if (yPos > 275) {
          doc.addPage();
          yPos = 20;
        }
        const splitConcern = doc.splitTextToSize(`• ${concern}`, pageWidth - 50);
        splitConcern.forEach((line: string) => {
          doc.text(line, 25, yPos);
          yPos += 5;
        });
        yPos += 2;
      });
      yPos += 8;
    }

    // Mitigating Factors (AI only)
    if (assessment.riskAssessment.aiAnalysis?.mitigatingFactors?.length > 0) {
      if (yPos > 240) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Mitigating Factors', 20, yPos);
      yPos += 8;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      assessment.riskAssessment.aiAnalysis.mitigatingFactors.forEach((factor: string) => {
        if (yPos > 275) {
          doc.addPage();
          yPos = 20;
        }
        const splitFactor = doc.splitTextToSize(`• ${factor}`, pageWidth - 50);
        splitFactor.forEach((line: string) => {
          doc.text(line, 25, yPos);
          yPos += 5;
        });
        yPos += 2;
      });
      yPos += 8;
    }

    // Manual Assessment Details
    if (assessment.riskAssessment.method === 'manual' && (assessment.riskAssessment as any).manualDetails) {
      if (yPos > 220) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Manual Assessment Details', 20, yPos);
      yPos += 10;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Total Risk Score: ${assessment.riskAssessment.score}/100`, 20, yPos);
      yPos += 6;
      doc.text(`Risk Level: ${assessment.riskAssessment.level.toUpperCase()}`, 20, yPos);
      yPos += 6;
      
      if ((assessment.riskAssessment as any).manualDetails.assessedBy) {
        doc.text(`Assessed By: ${(assessment.riskAssessment as any).manualDetails.assessedBy}`, 20, yPos);
        yPos += 8;
      }

      if ((assessment.riskAssessment as any).manualDetails.reason) {
        doc.setFont('helvetica', 'bold');
        doc.text('Reason / Justification:', 20, yPos);
        yPos += 6;
        doc.setFont('helvetica', 'normal');
        const reason = (assessment.riskAssessment as any).manualDetails.reason;
        const splitReason = doc.splitTextToSize(reason, pageWidth - 40);
        splitReason.forEach((line: string) => {
          if (yPos > 280) {
            doc.addPage();
            yPos = 20;
          }
          doc.text(line, 20, yPos);
          yPos += 5;
        });
      }
      yPos += 8;
    }

    // AI Reasoning Summary
    if (assessment.riskAssessment.aiAnalysis?.reasoning) {
      if (yPos > 220) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('AI Reasoning Summary', 20, yPos);
      yPos += 10;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const reasoning = assessment.riskAssessment.aiAnalysis.reasoning;
      const splitReasoning = doc.splitTextToSize(reasoning, pageWidth - 40);
      splitReasoning.forEach((line: string) => {
        if (yPos > 280) {
          doc.addPage();
          yPos = 20;
        }
        doc.text(line, 20, yPos);
        yPos += 5;
      });
      yPos += 8;
    }

    // AI Risk Factors
    if (assessment.riskAssessment.aiAnalysis?.factors?.length > 0) {
      if (yPos > 220) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Risk Factors', 20, yPos);
      yPos += 8;

      doc.setFontSize(10);
      assessment.riskAssessment.aiAnalysis.factors.forEach((factor: any) => {
        if (yPos > 260) {
          doc.addPage();
          yPos = 20;
        }
        doc.setFont('helvetica', 'bold');
        doc.text(`${factor.impact.toUpperCase()}: ${factor.factor}`, 25, yPos);
        yPos += 5;
        
        doc.setFont('helvetica', 'normal');
        const splitDesc = doc.splitTextToSize(factor.description, pageWidth - 50);
        splitDesc.forEach((line: string) => {
          if (yPos > 280) {
            doc.addPage();
            yPos = 20;
          }
          doc.text(line, 30, yPos);
          yPos += 5;
        });
        yPos += 4;
      });
      yPos += 8;
    }

    // Recommendations Section
    const recommendations = getRecommendations(assessment.riskAssessment);
    if (recommendations && recommendations.length > 0) {
      if (yPos > 220) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Risk Reduction Recommendations', 20, yPos);
      yPos += 10;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      recommendations.forEach((rec: string, idx: number) => {
        if (yPos > 275) {
          doc.addPage();
          yPos = 20;
        }
        const recText = `${idx + 1}. ${rec}`;
        const splitRec = doc.splitTextToSize(recText, pageWidth - 45);
        splitRec.forEach((line: string) => {
          doc.text(line, 25, yPos);
          yPos += 5;
        });
        yPos += 2;
      });
      yPos += 8;
    }

    // Action Plan for Agent
    const actionPlan = getActionPlan(assessment.riskAssessment);
    if (actionPlan && actionPlan.length > 0) {
      if (yPos > 220) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Action Plan for Agent', 20, yPos);
      yPos += 10;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      actionPlan.forEach((action: string, idx: number) => {
        if (yPos > 275) {
          doc.addPage();
          yPos = 20;
        }
        const actionText = `Step ${idx + 1}: ${action}`;
        const splitAction = doc.splitTextToSize(actionText, pageWidth - 45);
        splitAction.forEach((line: string) => {
          doc.text(line, 25, yPos);
          yPos += 5;
        });
        yPos += 2;
      });
    }

    // Save PDF
    doc.save(`risk-assessment-${formatApplicationReferenceWithPrefix(application.reference_number, maxApplicationRef, application.created_at)}.pdf`);
    
    toast({
      title: 'PDF Generated',
      description: 'Risk assessment report has been downloaded',
    });
  };

  useEffect(() => {
    const fetchApplication = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const data = await ApplicationService.fetchApplicationById(id);
        setApplication(data);
        setSelectedStatus(data?.status || '');
        setEstimatedCompletionTime(data?.estimated_completion_time || '');
        
        // Fetch product name if product_id exists
        if (data?.application_data?.product_id) {
          const { data: productData } = await supabase
            .from('products')
            .select('name')
            .eq('id', data.application_data.product_id)
            .single();
          setProductName(productData?.name || null);
        }
        
        // Fetch max reference number for auto-scaling formatter
        const { data: maxRefData } = await supabase
          .from('account_applications')
          .select('reference_number')
          .order('reference_number', { ascending: false })
          .limit(1)
          .single();
        setMaxApplicationRef(maxRefData?.reference_number || 0);

        // If application is completed, fetch the system completion time from status_changes
        if (data?.status.toLowerCase() === 'completed') {
          const { data: statusChange, error: statusError } = await supabase
            .from('status_changes')
            .select('created_at')
            .eq('customer_id', data.customer_id)
            .ilike('new_status', 'completed')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          
          if (statusError) {
            console.error('Error fetching status change:', statusError);
          }
          
          setSystemCompletedTime(statusChange?.created_at || null);
        }
      } catch (error) {
        console.error('Error fetching application:', error);
        toast({
          title: 'Error',
          description: 'Failed to load application',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchApplication();
  }, [id, toast]);

  const handleStatusUpdate = async () => {
    if (!id || !selectedStatus || !user) return;

    // Validate estimated completion time for draft->submitted transition
    if (application?.status.toLowerCase() === 'draft' && selectedStatus.toLowerCase() === 'submitted') {
      if (!estimatedCompletionTime) {
        toast({
          title: 'Estimated Completion Date Required',
          description: 'Please set an estimated completion date before submitting the application.',
          variant: 'destructive',
        });
        return;
      }
    }

    // If changing to completed, show completion date dialog
    if (selectedStatus.toLowerCase() === 'completed') {
      setPendingStatusUpdate(selectedStatus);
      setShowCompletionDateDialog(true);
      return;
    }

    // Otherwise, proceed with normal status update
    await performStatusUpdate(selectedStatus);
  };

  const performStatusUpdate = async (status: string, completionDate?: Date) => {
    if (!id || !user) return;

    try {
      setUpdatingStatus(true);

      // If transitioning from draft to submitted, save the estimated completion time
      if (application?.status.toLowerCase() === 'draft' && status.toLowerCase() === 'submitted') {
        await supabase
          .from('account_applications')
          .update({ estimated_completion_time: estimatedCompletionTime })
          .eq('id', id);
      }

      await ApplicationService.updateApplicationStatus(
        id,
        status,
        `Status updated by ${user.email}`,
        user.id,
        isAdmin ? 'admin' : 'user',
        completionDate?.toISOString()
      );

      // Refresh application data
      const updatedApp = await ApplicationService.fetchApplicationById(id);
      setApplication(updatedApp);

      toast({
        title: 'Success',
        description: `Status updated to ${status}. Notifications sent to relevant users.`,
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update status',
        variant: 'destructive',
      });
    } finally {
      setUpdatingStatus(false);
      setShowCompletionDateDialog(false);
      setPendingStatusUpdate(null);
    }
  };

  const handleCompletionDateConfirm = (date: Date) => {
    if (isEditingCompletionDate) {
      handleEditCompletionDate(date);
    } else if (pendingStatusUpdate) {
      performStatusUpdate(pendingStatusUpdate, date);
    }
  };

  const getBackdatingIndicator = (completedAt?: string, completedActual?: string) => {
    if (!completedAt || !completedActual) return null;

    const businessDate = new Date(completedAt);
    const systemDate = new Date(completedActual);
    const diffMs = systemDate.getTime() - businessDate.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours < 24) return null; // No indicator needed

    if (diffHours >= 72) {
      return {
        label: '72+ hours backdated',
        variant: 'destructive' as const,
        icon: AlertTriangle,
        color: 'text-destructive',
      };
    } else if (diffHours >= 48) {
      return {
        label: '48+ hours backdated',
        variant: 'secondary' as const,
        icon: AlertTriangle,
        color: 'text-orange-500',
      };
    } else if (diffHours >= 24) {
      return {
        label: '24+ hours backdated',
        variant: 'outline' as const,
        icon: Clock,
        color: 'text-yellow-600',
      };
    }

    return null;
  };

  const handleEditCompletionDate = async (newDate: Date) => {
    if (!id || !application?.completed_at || !user) return;

    // Only admins can edit completion dates
    if (!isAdmin) {
      toast({
        title: 'Unauthorized',
        description: 'Only administrators can edit completion dates',
        variant: 'destructive',
      });
      return;
    }

    try {
      setUpdatingStatus(true);

      const previousDate = application.completed_at;
      const newDateISO = newDate.toISOString();

      // Update completed_at (keep completed_actual unchanged)
      const { error: updateError } = await supabase
        .from('account_applications')
        .update({
          completed_at: newDateISO,
        })
        .eq('id', id);

      if (updateError) throw updateError;

      // Log the change to completion_date_history
      const { error: historyError } = await supabase
        .from('completion_date_history')
        .insert({
          application_id: id,
          previous_date: previousDate,
          new_date: newDateISO,
          changed_by: user.id,
          changed_by_role: isAdmin ? 'admin' : 'user',
          comment: 'Completion date adjusted',
        });

      if (historyError) {
        console.error('Failed to log completion date change:', historyError);
        // Don't fail the whole operation if audit logging fails
      }

      // Refresh application data
      const updatedApp = await ApplicationService.fetchApplicationById(id);
      setApplication(updatedApp);

      toast({
        title: 'Success',
        description: 'Completion date updated successfully',
      });
    } catch (error) {
      console.error('Error updating completion date:', error);
      toast({
        title: 'Error',
        description: 'Failed to update completion date',
        variant: 'destructive',
      });
    } finally {
      setUpdatingStatus(false);
      setShowCompletionDateDialog(false);
      setIsEditingCompletionDate(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  if (!application) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">Application not found</p>
        <Button onClick={() => navigate('/customers')} className="mt-4">
          Back to Customers
        </Button>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    draft: 'bg-yellow-400 text-black',
    submitted: 'bg-blue-500 text-white',
    'under review': 'bg-orange-500 text-white',
    'under_review': 'bg-orange-500 text-white',
    approved: 'bg-green-500 text-white',
    rejected: 'bg-red-500 text-white',
    completed: 'bg-purple-500 text-white',
    paid: 'bg-green-600 text-white',
    'need more info': 'bg-amber-500 text-white',
    'need_more_info': 'bg-amber-500 text-white',
  };

  const getStatusColor = (status: string) => {
    const normalizedStatus = status?.toLowerCase() || '';
    return statusColors[normalizedStatus] || 'bg-gray-500 text-white';
  };

  const availableStatuses = [
    { value: 'Draft', label: 'Draft' },
    { value: 'Submitted', label: 'Submitted' },
    { value: 'Under Review', label: 'Under Review' },
    { value: 'Need More Info', label: 'Need More Info' },
    { value: 'Approved', label: 'Approved' },
    { value: 'Rejected', label: 'Rejected' },
    { value: 'Paid', label: 'Paid' },
    ...(isAdmin ? [{ value: 'Completed', label: 'Completed' }] : []),
  ];

  return (
    <div className="space-y-6 p-6">
      <CompletionDateDialog
        open={showCompletionDateDialog}
        onOpenChange={setShowCompletionDateDialog}
        onConfirm={handleCompletionDateConfirm}
        isLoading={updatingStatus}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">
                {formatApplicationReferenceWithPrefix(application.reference_number, maxApplicationRef, application.created_at)}
              </h1>
              <Badge variant="outline" className="font-mono text-sm">
                {application.application_type.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1">
              {application.customer?.name || 'Application Details'}
            </p>
          </div>
        </div>
        <Badge className={getStatusColor(application.status)}>
          {application.status?.replace(/_/g, ' ').toUpperCase()}
        </Badge>
      </div>

      {/* Status Update Card - Admin Only */}
      {isAdmin && (
        <Card className="border-2 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Update Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
              <div className="flex-1 w-full">
                <label className="text-sm font-medium mb-2 block">Select New Status</label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose status..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableStatuses.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={handleStatusUpdate} 
                disabled={updatingStatus || selectedStatus === application.status}
                className="whitespace-nowrap"
              >
                {updatingStatus ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Status'
                )}
              </Button>
            </div>
            {selectedStatus !== application.status && selectedStatus && (
              <p className="text-sm text-muted-foreground mt-2">
                Status will change from <strong>{application.status}</strong> to <strong>{selectedStatus}</strong>
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Estimated Completion Date - Visible when in Draft Status */}
      {application.status.toLowerCase() === 'draft' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Estimated Completion Date
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
              <div className="flex-1 w-full">
                <label className="text-sm font-medium mb-2 block">
                  Expected Date <span className="text-destructive">*</span>
                </label>
                <Input
                  type="date"
                  value={estimatedCompletionTime}
                  onChange={(e) => setEstimatedCompletionTime(e.target.value)}
                  className="w-full"
                  min={new Date().toISOString().split('T')[0]}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Required before submitting the application
                </p>
              </div>
              <Button 
                onClick={async () => {
                  if (!id || !estimatedCompletionTime) return;
                  try {
                    const { error } = await supabase
                      .from('account_applications')
                      .update({ estimated_completion_time: estimatedCompletionTime })
                      .eq('id', id);
                    
                    if (error) throw error;
                    
                    toast({
                      title: 'Success',
                      description: 'Estimated completion date saved',
                    });
                  } catch (error) {
                    toast({
                      title: 'Error',
                      description: 'Failed to save estimated completion date',
                      variant: 'destructive',
                    });
                  }
                }}
                disabled={!estimatedCompletionTime}
                variant="outline"
                className="whitespace-nowrap"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Date
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Customer Info Card */}
      {application.customer && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Customer Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Company</p>
                <Link 
                  to={`/customers/${application.customer.id}`}
                  className="font-medium hover:underline"
                >
                  {application.customer.company}
                </Link>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Contact Name</p>
                <p className="font-medium">{application.customer.name}</p>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{application.customer.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Mobile</p>
                  <p className="font-medium">{application.customer.mobile}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="details" className="space-y-4">
        <TabsList>
          <TabsTrigger value="details">Application Details</TabsTrigger>
          <TabsTrigger value="documents">
            <FileText className="h-4 w-4 mr-2" />
            Documents ({application.documents?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="messages">
            <MessageSquare className="h-4 w-4 mr-2" />
            Messages ({application.messages?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="owners">
            <Users className="h-4 w-4 mr-2" />
            Owners ({application.owners?.length || 0})
          </TabsTrigger>
          {application.status.toLowerCase() === 'completed' && (
            <TabsTrigger value="history">
              <Clock className="h-4 w-4 mr-2" />
              Completion History
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>Application Data</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">License Type</p>
                  <p className="font-medium">{application.customer?.license_type || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Amount</p>
                  <p className="font-medium">${application.application_data.amount?.toLocaleString() || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Lead Source</p>
                  <p className="font-medium">{application.application_data.lead_source || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Jurisdiction</p>
                  <p className="font-medium">{application.application_data.jurisdiction || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Preferred Bank</p>
                  <p className="font-medium">{application.application_data.preferred_bank || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Annual Turnover</p>
                  <p className="font-medium">
                    {application.application_data.annual_turnover 
                      ? `$${application.application_data.annual_turnover.toLocaleString()}` 
                      : '-'}
                  </p>
                </div>
              </div>
              
              {/* Bank Account Risk Assessment - Show for all Business Bank Account applications */}
              {productName === 'Business Bank Account' && (
                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Risk Assessment
                    </h4>
                    <div className="flex gap-2">
                      {application.application_assessment?.riskAssessment && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={generateAssessmentPDF}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          PDF Report
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // Reset dialog state when opening
                          setSelectedMethod(application.application_assessment?.riskAssessment?.method as any || '');
                          setCalculatedRisk(null);
                          setShowRiskDialog(true);
                        }}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        {application.application_assessment?.riskAssessment ? 'Edit' : 'Add'} Risk Assessment
                      </Button>
                      {isAdmin && application.application_assessment?.riskAssessment && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            if (!confirm('Are you sure you want to delete this risk assessment? This action will be logged.')) return;
                            
                            try {
                              // Log the deletion to history
                              await supabase.from('application_assessment_history').insert({
                                application_id: application.id,
                                previous_assessment: application.application_assessment,
                                new_assessment: null,
                                change_type: 'deleted',
                                changed_by: user?.id,
                                changed_by_role: 'admin',
                                comment: 'Risk assessment deleted by admin'
                              });

                              // Delete assessment
                              await supabase
                                .from('account_applications')
                                .update({
                                  application_assessment: null,
                                  application_data: {
                                    ...application.application_data,
                                    risk_level: null
                                  }
                                })
                                .eq('id', application.id);

                              toast({
                                title: 'Assessment Deleted',
                                description: 'Risk assessment has been removed',
                              });

                              const updatedApp = await ApplicationService.fetchApplicationById(application.id);
                              setApplication(updatedApp);
                            } catch (error) {
                              console.error('Error deleting assessment:', error);
                              toast({
                                title: 'Error',
                                description: 'Failed to delete assessment',
                                variant: 'destructive',
                              });
                            }
                          }}
                        >
                          Delete
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {!application.application_assessment?.riskAssessment ? (
                    <div className="text-sm text-muted-foreground py-4 px-3 bg-muted/30 rounded-md">
                      No risk assessment data available. Click "Add Risk Assessment" to evaluate this application.
                    </div>
                  ) : (
                    <>
                    {/* Last Assessment Summary */}
                    {application.application_assessment?.lastAssessment && (
                      <div className="mb-4 p-3 bg-primary/5 border-l-4 border-primary rounded">
                        <p className="text-xs font-medium text-muted-foreground mb-2">LAST ASSESSMENT USED</p>
                        <div className="flex items-center gap-4 flex-wrap">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Method:</span>
                            <Badge variant="outline">
                              {application.application_assessment.lastAssessment.method === 'manual' && '👤 Manual'}
                              {application.application_assessment.lastAssessment.method === 'rule' && '📊 Rule-Based'}
                              {application.application_assessment.lastAssessment.method === 'ai' && '🤖 AI-Powered'}
                              {application.application_assessment.lastAssessment.method === 'hybrid' && '🔀 Hybrid'}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Level:</span>
                            <Badge
                              variant={
                                application.application_assessment.lastAssessment.level === 'high' ? 'destructive' : 
                                application.application_assessment.lastAssessment.level === 'medium' ? 'default' : 
                                'secondary'
                              }
                            >
                              {application.application_assessment.lastAssessment.level.toUpperCase()}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Score:</span>
                            <span className="font-semibold">{application.application_assessment.lastAssessment.score}/100</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Date:</span>
                            <span className="text-xs">{new Date(application.application_assessment.lastAssessment.timestamp).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {application.application_assessment?.riskAssessment?.level && (
                        <div>
                          <p className="text-sm text-muted-foreground">Risk Level</p>
                          <Badge 
                            variant={
                              application.application_assessment.riskAssessment.level === 'high' ? 'destructive' : 
                              application.application_assessment.riskAssessment.level === 'medium' ? 'default' : 
                              'secondary'
                            }
                            className="font-semibold mt-1"
                          >
                            {application.application_assessment.riskAssessment.level.toUpperCase()}
                          </Badge>
                        </div>
                      )}
                      {application.application_assessment?.riskAssessment?.method && (
                        <div>
                          <p className="text-sm text-muted-foreground">Calculation Method</p>
                          <Badge variant="outline" className="mt-1">
                            {application.application_assessment.riskAssessment.method === 'manual' && '👤 Manual'}
                            {application.application_assessment.riskAssessment.method === 'rule' && '📊 Rule-Based'}
                            {application.application_assessment.riskAssessment.method === 'ai' && '🤖 AI-Powered'}
                            {application.application_assessment.riskAssessment.method === 'hybrid' && '🔀 Hybrid (AI + Manual)'}
                          </Badge>
                        </div>
                      )}
                      {application.application_assessment?.riskAssessment?.score !== undefined && application.application_assessment?.riskAssessment?.score !== null && (
                        <div>
                          <p className="text-sm text-muted-foreground">Risk Score</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="font-semibold">{application.application_assessment.riskAssessment.score}/100</span>
                            <div className="h-2 flex-1 bg-muted rounded-full overflow-hidden max-w-[120px]">
                              <div 
                                className={`h-full transition-all ${
                                  application.application_assessment.riskAssessment.score >= 67 ? 'bg-destructive' :
                                  application.application_assessment.riskAssessment.score >= 34 ? 'bg-yellow-500' :
                                  'bg-green-500'
                                }`}
                                style={{ width: `${application.application_assessment.riskAssessment.score}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <Accordion type="multiple" className="mt-4">
                      {/* Rule-Based Score Breakdown Accordion */}
                      {application.application_assessment?.riskAssessment?.method === 'rule' &&
                       application.application_assessment?.riskAssessment?.calculationBreakdown && (
                        <AccordionItem value="rule-score-breakdown">
                          <AccordionTrigger className="text-sm font-medium">Score Breakdown</AccordionTrigger>
                          <AccordionContent>
                            <div className="p-3 bg-muted/30 rounded-md text-sm space-y-2">
                              {application.application_assessment.riskAssessment.calculationBreakdown.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center py-1 border-b border-border/30 last:border-0">
                                  <span className="font-medium">{item.factor}</span>
                                  <Badge variant="outline">+{item.points} pts</Badge>
                                </div>
                              ))}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      )}

                      {/* Rule-Based Calculation Details Accordion */}
                      {application.application_assessment?.riskAssessment?.method === 'rule' &&
                       application.application_assessment?.riskAssessment?.calculationBreakdown && (
                        <AccordionItem value="rule-calculation-details">
                          <AccordionTrigger className="text-sm font-medium">Calculation Details</AccordionTrigger>
                          <AccordionContent>
                            <div className="p-3 bg-muted/30 rounded-md text-sm space-y-2">
                              <p className="text-xs text-muted-foreground mb-3">
                                Risk Score Calculation (Total: {application.application_assessment.riskAssessment.score}/100)
                              </p>
                              
                              {application.application_assessment.riskAssessment.calculationBreakdown.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center py-1 border-b border-border/30 last:border-0">
                                  <div className="flex-1">
                                    <span className="font-medium">{item.factor}</span>
                                  </div>
                                  <span className="font-mono font-semibold">+{item.points} pts</span>
                                </div>
                              ))}
                              
                              <div className="mt-3 pt-3 border-t-2 border-primary/20 flex justify-between items-center font-semibold">
                                <span>Total Risk Score</span>
                                <span className="font-mono text-lg">{application.application_assessment.riskAssessment.score}/100</span>
                              </div>
                              
                              <div className="mt-2 flex justify-between items-center text-xs">
                                <span>Risk Classification</span>
                                <Badge variant={
                                  application.application_assessment.riskAssessment.level === 'high' ? 'destructive' :
                                  application.application_assessment.riskAssessment.level === 'medium' ? 'default' :
                                  'secondary'
                                }>
                                  {application.application_assessment.riskAssessment.level.toUpperCase()}
                                </Badge>
                              </div>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      )}

                      {/* AI Score Breakdown Accordion */}
                      {application.application_assessment?.riskAssessment?.method === 'ai' &&
                       application.application_assessment?.riskAssessment?.aiAnalysis?.scoreBreakdown && (
                        <AccordionItem value="score-breakdown">
                          <AccordionTrigger className="text-sm font-medium">AI Score Breakdown</AccordionTrigger>
                          <AccordionContent>
                            <div className="p-3 bg-muted/30 rounded-md text-sm space-y-3">
                          {application.application_assessment.riskAssessment.aiAnalysis.scoreBreakdown.map((item, idx) => (
                            <div key={idx} className="space-y-1">
                              <div className="flex justify-between items-center">
                                <span className="font-medium">{item.factor}</span>
                                <div className="flex items-center gap-2">
                                  <Badge variant={
                                    item.impact_level === 'high' ? 'destructive' :
                                    item.impact_level === 'medium' ? 'default' :
                                    'secondary'
                                  } className="text-xs">
                                    {item.impact_level}
                                  </Badge>
                                  <Badge variant="outline">+{item.points_contribution} pts</Badge>
                                </div>
                              </div>
                              <p className="text-xs text-muted-foreground pl-2">{item.justification}</p>
                            </div>
                          ))}
                        </div>

                        {/* Key Concerns */}
                        {application.application_assessment.riskAssessment.aiAnalysis.keyConcerns && application.application_assessment.riskAssessment.aiAnalysis.keyConcerns.length > 0 && (
                          <div className="mt-3 p-3 bg-destructive/5 border border-destructive/20 rounded-md">
                            <p className="text-xs font-semibold text-destructive mb-2">Key Concerns:</p>
                            <ul className="space-y-1">
                              {application.application_assessment.riskAssessment.aiAnalysis.keyConcerns.map((concern, idx) => (
                                <li key={idx} className="text-xs text-muted-foreground flex items-start gap-2">
                                  <AlertTriangle className="h-3 w-3 text-destructive mt-0.5 flex-shrink-0" />
                                  <span>{concern}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Mitigating Factors */}
                        {application.application_assessment.riskAssessment.aiAnalysis.mitigatingFactors && application.application_assessment.riskAssessment.aiAnalysis.mitigatingFactors.length > 0 && (
                          <div className="mt-3 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-md">
                            <p className="text-xs font-semibold text-green-700 dark:text-green-400 mb-2">Mitigating Factors:</p>
                            <ul className="space-y-1">
                              {application.application_assessment.riskAssessment.aiAnalysis.mitigatingFactors.map((factor, idx) => (
                                <li key={idx} className="text-xs text-muted-foreground">• {factor}</li>
                              ))}
                            </ul>
                              </div>
                            )}
                          </AccordionContent>
                        </AccordionItem>
                      )}

                      {/* Hybrid Method - Score Breakdown Accordion */}
                      {application.application_assessment?.riskAssessment?.method === 'hybrid' &&
                       application.application_assessment?.riskAssessment?.aiAnalysis?.scoreBreakdown && (
                        <AccordionItem value="hybrid-score-breakdown">
                          <AccordionTrigger className="text-sm font-medium">Score Breakdown</AccordionTrigger>
                          <AccordionContent>
                            <div className="p-3 bg-muted/30 rounded-md text-sm space-y-3">
                          {application.application_assessment.riskAssessment.aiAnalysis.scoreBreakdown.map((item, idx) => (
                            <div key={idx} className="space-y-1">
                              <div className="flex justify-between items-center">
                                <span className="font-medium">{item.factor}</span>
                                <div className="flex items-center gap-2">
                                  <Badge variant={
                                    item.impact_level === 'high' ? 'destructive' :
                                    item.impact_level === 'medium' ? 'default' :
                                    'secondary'
                                  } className="text-xs">
                                    {item.impact_level}
                                  </Badge>
                                  <Badge variant="outline">+{item.points_contribution} pts</Badge>
                                </div>
                              </div>
                              <p className="text-xs text-muted-foreground pl-2">{item.justification}</p>
                            </div>
                          ))}
                        </div>

                        {/* Key Concerns */}
                        {application.application_assessment.riskAssessment.aiAnalysis.keyConcerns && application.application_assessment.riskAssessment.aiAnalysis.keyConcerns.length > 0 && (
                          <div className="mt-3 p-3 bg-destructive/5 border border-destructive/20 rounded-md">
                            <p className="text-xs font-semibold text-destructive mb-2">Key Concerns:</p>
                            <ul className="space-y-1">
                              {application.application_assessment.riskAssessment.aiAnalysis.keyConcerns.map((concern, idx) => (
                                <li key={idx} className="text-xs text-muted-foreground flex items-start gap-2">
                                  <AlertTriangle className="h-3 w-3 text-destructive mt-0.5 flex-shrink-0" />
                                  <span>{concern}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Mitigating Factors */}
                        {application.application_assessment.riskAssessment.aiAnalysis.mitigatingFactors && application.application_assessment.riskAssessment.aiAnalysis.mitigatingFactors.length > 0 && (
                          <div className="mt-3 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-md">
                            <p className="text-xs font-semibold text-green-700 dark:text-green-400 mb-2">Mitigating Factors:</p>
                            <ul className="space-y-1">
                              {application.application_assessment.riskAssessment.aiAnalysis.mitigatingFactors.map((factor, idx) => (
                                <li key={idx} className="text-xs text-muted-foreground">• {factor}</li>
                              ))}
                            </ul>
                              </div>
                            )}
                          </AccordionContent>
                        </AccordionItem>
                      )}

                      {/* Hybrid Method - Score Combination Accordion */}
                      {application.application_assessment?.riskAssessment?.method === 'hybrid' && (
                        <AccordionItem value="hybrid-score-combination">
                          <AccordionTrigger className="text-sm font-medium">Hybrid Score Combination</AccordionTrigger>
                          <AccordionContent>
                            <div className="p-3 bg-gradient-to-br from-primary/5 to-primary/10 rounded-md text-sm space-y-4">
                              <p className="text-xs text-muted-foreground font-medium mb-3">
                                The hybrid assessment combines both Rule-Based and AI-Powered approaches to produce a comprehensive risk score:
                              </p>

                              {(() => {
                                // Get hybrid scores from the stored data
                                const ruleBasedScore = (application.application_assessment.riskAssessment as any).hybridDetails?.ruleBasedScore || 0;
                                const aiScore = (application.application_assessment.riskAssessment as any).hybridDetails?.aiScore || 0;
                                const finalScore = application.application_assessment.riskAssessment.score;

                                return (
                                  <>
                                    {/* Rule-Based Component */}
                                    <div className="space-y-2 p-3 bg-background/50 rounded-md border border-border/50">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                          <Badge variant="outline" className="text-xs">Rule-Based</Badge>
                                          <span className="text-xs text-muted-foreground">Weight: 50%</span>
                                        </div>
                                        <span className="font-mono font-semibold">{ruleBasedScore} pts</span>
                                      </div>
                                      <p className="text-xs text-muted-foreground">
                                        Systematic scoring based on predefined business rules and risk indicators
                                      </p>
                                    </div>

                                    {/* AI-Based Component */}
                                    <div className="space-y-2 p-3 bg-background/50 rounded-md border border-border/50">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                          <Badge variant="outline" className="text-xs">AI-Powered</Badge>
                                          <span className="text-xs text-muted-foreground">Weight: 50%</span>
                                        </div>
                                        <span className="font-mono font-semibold">{aiScore} pts</span>
                                      </div>
                                      <p className="text-xs text-muted-foreground">
                                        Intelligent analysis considering context, patterns, and nuanced risk factors
                                      </p>
                                    </div>

                                    {/* Calculation Formula */}
                                    <div className="p-3 bg-primary/10 rounded-md border border-primary/20">
                                      <p className="text-xs font-semibold text-primary mb-2">Hybrid Calculation:</p>
                                      <div className="space-y-1 text-xs font-mono">
                                        <div className="flex justify-between items-center">
                                          <span>Rule-Based (50%)</span>
                                          <span>= {(ruleBasedScore * 0.5).toFixed(1)} pts</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                          <span>AI-Powered (50%)</span>
                                          <span>= {(aiScore * 0.5).toFixed(1)} pts</span>
                                        </div>
                                        <div className="pt-2 mt-2 border-t-2 border-primary/30 flex justify-between items-center font-bold">
                                          <span>Final Hybrid Score</span>
                                          <span className="text-base">= {finalScore} pts</span>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="pt-2 border-t border-border/30">
                                      <p className="text-xs text-muted-foreground italic">
                                        This weighted average approach balances systematic rule-based scoring with contextual AI analysis for a comprehensive risk evaluation.
                                      </p>
                                    </div>
                                  </>
                                );
                              })()}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      )}

                      {/* Hybrid Method - Calculation Details Accordion */}
                      {application.application_assessment?.riskAssessment?.method === 'hybrid' && 
                       application.application_assessment?.riskAssessment?.aiAnalysis?.scoreBreakdown && (
                        <AccordionItem value="hybrid-calculation-details">
                          <AccordionTrigger className="text-sm font-medium">Calculation Details</AccordionTrigger>
                          <AccordionContent>
                            <div className="p-3 bg-muted/30 rounded-md text-sm space-y-2">
                          <p className="text-xs text-muted-foreground mb-3">
                            Risk Score Calculation (Total: {application.application_assessment.riskAssessment.score}/100)
                          </p>
                          
                          {application.application_assessment.riskAssessment.aiAnalysis.scoreBreakdown.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center py-1 border-b border-border/30 last:border-0">
                              <div className="flex-1">
                                <span className="font-medium">{item.factor}</span>
                                <Badge 
                                  variant={
                                    item.impact_level === 'high' ? 'destructive' :
                                    item.impact_level === 'medium' ? 'default' :
                                    'secondary'
                                  } 
                                  className="ml-2 text-xs"
                                >
                                  {item.impact_level}
                                </Badge>
                              </div>
                              <span className="font-mono font-semibold">+{item.points_contribution} pts</span>
                            </div>
                          ))}
                          
                          <div className="mt-3 pt-3 border-t-2 border-primary/20 flex justify-between items-center font-semibold">
                            <span>Total Risk Score</span>
                            <span className="font-mono text-lg">{application.application_assessment.riskAssessment.score}/100</span>
                          </div>
                          
                          <div className="mt-2 flex justify-between items-center text-xs">
                            <span>Risk Classification</span>
                            <Badge variant={
                              application.application_assessment.riskAssessment.level === 'high' ? 'destructive' :
                              application.application_assessment.riskAssessment.level === 'medium' ? 'default' :
                              'secondary'
                            }>
                              {application.application_assessment.riskAssessment.level.toUpperCase()}
                            </Badge>
                              </div>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      )}

                      {/* Manual Reasoning Summary Accordion */}
                      {application.application_assessment?.riskAssessment?.method === 'manual' && (
                        <AccordionItem value="manual-reasoning">
                          <AccordionTrigger className="text-sm font-medium">Reasoning Summary</AccordionTrigger>
                          <AccordionContent>
                            <div className="p-3 bg-primary/5 rounded-md text-sm space-y-3">
                              {(application.application_assessment.riskAssessment as any).manualDetails?.reason ? (
                                <>
                                  <p className="whitespace-pre-wrap text-muted-foreground">
                                    {(application.application_assessment.riskAssessment as any).manualDetails.reason}
                                  </p>
                                  {(application.application_assessment.riskAssessment as any).manualDetails?.assessedBy && (
                                    <p className="text-xs text-muted-foreground italic pt-2 border-t border-primary/10">
                                      — Assessed by {(application.application_assessment.riskAssessment as any).manualDetails.assessedBy}
                                    </p>
                                  )}
                                </>
                              ) : (
                                <p className="whitespace-pre-line">
                                  This risk assessment was conducted using a {application.application_assessment.riskAssessment.method} approach. The final risk score of {application.application_assessment.riskAssessment.score}/100 places this application in the{' '}
                                  <Badge
                                    variant={
                                      application.application_assessment.riskAssessment.level === 'high' ? 'destructive' :
                                      application.application_assessment.riskAssessment.level === 'medium' ? 'default' :
                                      'secondary'
                                    }
                                    className="inline-flex"
                                  >
                                    {application.application_assessment.riskAssessment.level.toUpperCase()} RISK
                                  </Badge>{' '}
                                  category.
                                </p>
                              )}
                              
                              <div className="pt-3 border-t border-primary/10">
                                <p className="font-medium text-xs uppercase text-muted-foreground mb-2">Risk Level Guidelines</p>
                                <div className="space-y-2 text-xs text-muted-foreground">
                                  <div className="flex items-start gap-2">
                                    <Badge variant="secondary" className="mt-0.5">LOW</Badge>
                                    <span>0-33 points: Standard due diligence procedures apply</span>
                                  </div>
                                  <div className="flex items-start gap-2">
                                    <Badge variant="default" className="mt-0.5">MEDIUM</Badge>
                                    <span>34-66 points: Standard due diligence with additional verification</span>
                                  </div>
                                  <div className="flex items-start gap-2">
                                    <Badge variant="destructive" className="mt-0.5">HIGH</Badge>
                                    <span>67-100 points: Enhanced due diligence and senior management approval required</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      )}

                      {/* Rule-Based Reasoning Summary Accordion */}
                      {application.application_assessment?.riskAssessment?.method === 'rule' && (
                        <AccordionItem value="rule-reasoning">
                          <AccordionTrigger className="text-sm font-medium">Reasoning Summary</AccordionTrigger>
                          <AccordionContent>
                            <div className="p-3 bg-primary/5 rounded-md text-sm space-y-3">
                              <p className="whitespace-pre-line">
                                This risk assessment was calculated using a rule-based scoring system that evaluates key risk indicators systematically. The final risk score of {application.application_assessment.riskAssessment.score}/100 places this application in the{' '}
                                <Badge
                                  variant={
                                    application.application_assessment.riskAssessment.level === 'high' ? 'destructive' :
                                    application.application_assessment.riskAssessment.level === 'medium' ? 'default' :
                                    'secondary'
                                  }
                                  className="inline-flex"
                                >
                                  {application.application_assessment.riskAssessment.level.toUpperCase()} RISK
                                </Badge>{' '}
                                category.
                              </p>
                              
                              <div className="pt-3 border-t border-primary/10">
                                <p className="font-medium text-xs uppercase text-muted-foreground mb-2">Risk Level Guidelines</p>
                                <div className="space-y-2 text-xs text-muted-foreground">
                                  <div className="flex items-start gap-2">
                                    <Badge variant="secondary" className="mt-0.5">LOW</Badge>
                                    <span>0-33 points: Standard due diligence procedures apply</span>
                                  </div>
                                  <div className="flex items-start gap-2">
                                    <Badge variant="default" className="mt-0.5">MEDIUM</Badge>
                                    <span>34-66 points: Standard due diligence with additional verification</span>
                                  </div>
                                  <div className="flex items-start gap-2">
                                    <Badge variant="destructive" className="mt-0.5">HIGH</Badge>
                                    <span>67-100 points: Enhanced due diligence and senior management approval required</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      )}

                      {/* Hybrid - Combined Reasoning Summary Accordion */}
                      {application.application_assessment?.riskAssessment?.method === 'hybrid' && (
                        <AccordionItem value="hybrid-reasoning">
                          <AccordionTrigger className="text-sm font-medium">Reasoning Summary</AccordionTrigger>
                          <AccordionContent>
                            <div className="p-3 bg-primary/5 rounded-md text-sm space-y-4">
                              
                              {/* Rule-Based Reasoning Section */}
                              <div className="space-y-2">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge variant="outline" className="text-xs">Rule-Based Analysis</Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  The systematic rule-based assessment evaluated this application using predefined risk indicators across jurisdiction type, shareholder structure, signatory requirements, business turnover, and minimum balance expectations. This methodology ensures consistent, objective scoring based on established business rules and regulatory compliance standards.
                                </p>
                                {application.application_assessment.riskAssessment.calculationBreakdown && (
                                  <div className="mt-2 p-2 bg-muted/30 rounded text-xs">
                                    <span className="font-semibold">Rule-Based Score: </span>
                                    <span className="font-mono">{(application.application_assessment.riskAssessment as any).hybridDetails?.ruleBasedScore || 0}/100</span>
                                  </div>
                                )}
                              </div>

                              <div className="border-t border-border/50"></div>

                              {/* Combined Assessment Conclusion */}
                              <div className="space-y-2 p-3 bg-gradient-to-br from-primary/10 to-primary/5 rounded-md">
                                <p className="font-semibold text-xs uppercase text-primary">Hybrid Assessment Conclusion</p>
                                <p className="text-sm">
                                  By combining systematic rule-based scoring with contextual AI analysis, this hybrid assessment achieves a balanced evaluation. The final risk score of{' '}
                                  <span className="font-mono font-semibold">{application.application_assessment.riskAssessment.score}/100</span> represents equal weighting (50% each) of both methodologies, placing this application in the{' '}
                                  <Badge
                                    variant={
                                      application.application_assessment.riskAssessment.level === 'high' ? 'destructive' :
                                      application.application_assessment.riskAssessment.level === 'medium' ? 'default' :
                                      'secondary'
                                    }
                                    className="inline-flex"
                                  >
                                    {application.application_assessment.riskAssessment.level.toUpperCase()} RISK
                                  </Badge>{' '}
                                  category. This dual-methodology approach provides comprehensive risk assessment by leveraging both structured business rules and intelligent contextual analysis.
                                </p>
                              </div>

                              <div className="pt-3 border-t border-primary/10">
                                <p className="font-medium text-xs uppercase text-muted-foreground mb-2">Risk Level Guidelines</p>
                                <div className="space-y-2 text-xs text-muted-foreground">
                                  <div className="flex items-start gap-2">
                                    <Badge variant="secondary" className="mt-0.5">LOW</Badge>
                                    <span>0-33 points: Standard due diligence procedures apply</span>
                                  </div>
                                  <div className="flex items-start gap-2">
                                    <Badge variant="default" className="mt-0.5">MEDIUM</Badge>
                                    <span>34-66 points: Standard due diligence with additional verification</span>
                                  </div>
                                  <div className="flex items-start gap-2">
                                    <Badge variant="destructive" className="mt-0.5">HIGH</Badge>
                                    <span>67-100 points: Enhanced due diligence and senior management approval required</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      )}


                      {/* Calculation Details Accordion - AI Method */}
                      {application.application_assessment?.riskAssessment?.method === 'ai' && 
                       application.application_assessment?.riskAssessment?.aiAnalysis?.scoreBreakdown && (
                        <AccordionItem value="calculation-details-ai">
                          <AccordionTrigger className="text-sm font-medium">Calculation Details</AccordionTrigger>
                          <AccordionContent>
                            <div className="p-3 bg-muted/30 rounded-md text-sm space-y-2">
                          <p className="text-xs text-muted-foreground mb-3">
                            Risk Score Calculation (Total: {application.application_assessment.riskAssessment.score}/100)
                          </p>
                          
                          {application.application_assessment.riskAssessment.aiAnalysis.scoreBreakdown.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center py-1 border-b border-border/30 last:border-0">
                              <div className="flex-1">
                                <span className="font-medium">{item.factor}</span>
                                <Badge 
                                  variant={
                                    item.impact_level === 'high' ? 'destructive' :
                                    item.impact_level === 'medium' ? 'default' :
                                    'secondary'
                                  } 
                                  className="ml-2 text-xs"
                                >
                                  {item.impact_level}
                                </Badge>
                              </div>
                              <span className="font-mono font-semibold">+{item.points_contribution} pts</span>
                            </div>
                          ))}
                          
                          <div className="mt-3 pt-3 border-t-2 border-primary/20 flex justify-between items-center font-semibold">
                            <span>Total Risk Score</span>
                            <span className="font-mono text-lg">{application.application_assessment.riskAssessment.score}/100</span>
                          </div>
                          
                          <div className="mt-2 flex justify-between items-center text-xs">
                            <span>Risk Classification</span>
                            <Badge variant={
                              application.application_assessment.riskAssessment.level === 'high' ? 'destructive' :
                              application.application_assessment.riskAssessment.level === 'medium' ? 'default' :
                              'secondary'
                            }>
                              {application.application_assessment.riskAssessment.level.toUpperCase()}
                            </Badge>
                              </div>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      )}

                      {/* AI Reasoning Summary Accordion */}
                      {application.application_assessment?.riskAssessment?.aiAnalysis && (
                        <AccordionItem value="ai-reasoning">
                          <AccordionTrigger className="text-sm font-medium">AI Reasoning Summary</AccordionTrigger>
                          <AccordionContent>
                            <div className="p-3 bg-primary/5 rounded-md text-sm space-y-3">
                          <p className="whitespace-pre-line">{application.application_assessment.riskAssessment.aiAnalysis.reasoning}</p>
                          {application.application_assessment.riskAssessment.aiAnalysis.factors?.length > 0 && (
                            <div className="space-y-2 mt-3 pt-3 border-t border-primary/10">
                              <p className="font-medium text-xs uppercase text-muted-foreground">Risk Factors</p>
                              {application.application_assessment.riskAssessment.aiAnalysis.factors.map((factor, idx) => (
                                <div key={idx} className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <Badge variant={
                                      factor.impact === 'high' ? 'destructive' :
                                      factor.impact === 'medium' ? 'default' :
                                      'secondary'
                                    } className="text-xs">
                                      {factor.impact}
                                    </Badge>
                                    <span className="font-medium">{factor.factor}</span>
                                  </div>
                                  <p className="text-xs text-muted-foreground pl-2">{factor.description}</p>
                                </div>
                              ))}
                            </div>
                              )}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      )}

                      {/* Risk Reduction Recommendations Accordion */}
                      {application.application_assessment?.riskAssessment && (
                        <AccordionItem value="recommendations">
                          <AccordionTrigger className="text-sm font-medium">
                            <span className="flex items-center gap-2">
                              <Lightbulb className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                              Risk Reduction Recommendations
                            </span>
                          </AccordionTrigger>
                          <AccordionContent>
                            {/* Rule-Based Recommendations */}
                            {application.application_assessment.riskAssessment.method === 'rule' && 
                             application.application_assessment.riskAssessment.rawDetails && 
                             (() => {
                               try {
                                 const parsedDetails = JSON.parse(application.application_assessment.riskAssessment.rawDetails);
                                 return parsedDetails.recommendations && parsedDetails.recommendations.length > 0 ? (
                                   <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900 rounded-md">
                                   <ul className="space-y-2">
                                     {parsedDetails.recommendations.map((rec: string, idx: number) => (
                                       <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                                         <span className="text-yellow-600 dark:text-yellow-400 mt-0.5">•</span>
                                         <span>{rec}</span>
                                       </li>
                                     ))}
                                     </ul>
                                   </div>
                                 ) : null;
                               } catch {
                                 return null;
                               }
                             })()}

                            {/* AI Recommendations */}
                            {application.application_assessment.riskAssessment.method === 'ai' && 
                             application.application_assessment.riskAssessment.aiAnalysis &&
                             (application.application_assessment.riskAssessment.aiAnalysis as any).recommendations &&
                             Array.isArray((application.application_assessment.riskAssessment.aiAnalysis as any).recommendations) &&
                             (application.application_assessment.riskAssessment.aiAnalysis as any).recommendations.length > 0 && (
                              <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900 rounded-md">
                              <ul className="space-y-2">
                                {((application.application_assessment.riskAssessment.aiAnalysis as any).recommendations as string[]).map((rec: string, idx: number) => (
                                  <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                                    <span className="text-yellow-600 dark:text-yellow-400 mt-0.5">•</span>
                                    <span>{rec}</span>
                                  </li>
                                ))}
                                </ul>
                              </div>
                            )}

                            {/* Manual/Hybrid - Generic Recommendations */}
                            {(application.application_assessment.riskAssessment.method === 'manual' || 
                              application.application_assessment.riskAssessment.method === 'hybrid') && (
                              <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900 rounded-md">
                              <ul className="space-y-2">
                                {application.application_assessment.riskAssessment.level === 'high' && (
                                  <>
                                    <li className="text-sm text-muted-foreground flex items-start gap-2">
                                      <span className="text-yellow-600 dark:text-yellow-400 mt-0.5">•</span>
                                      <span>Implement enhanced due diligence procedures</span>
                                    </li>
                                    <li className="text-sm text-muted-foreground flex items-start gap-2">
                                      <span className="text-yellow-600 dark:text-yellow-400 mt-0.5">•</span>
                                      <span>Conduct thorough background checks on all stakeholders</span>
                                    </li>
                                    <li className="text-sm text-muted-foreground flex items-start gap-2">
                                      <span className="text-yellow-600 dark:text-yellow-400 mt-0.5">•</span>
                                      <span>Ensure comprehensive compliance documentation is maintained</span>
                                    </li>
                                  </>
                                )}
                                {application.application_assessment.riskAssessment.level === 'medium' && (
                                  <>
                                    <li className="text-sm text-muted-foreground flex items-start gap-2">
                                      <span className="text-yellow-600 dark:text-yellow-400 mt-0.5">•</span>
                                      <span>Maintain detailed records of all business activities and transactions</span>
                                    </li>
                                    <li className="text-sm text-muted-foreground flex items-start gap-2">
                                      <span className="text-yellow-600 dark:text-yellow-400 mt-0.5">•</span>
                                      <span>Ensure all shareholder and signatory documentation is complete</span>
                                    </li>
                                    <li className="text-sm text-muted-foreground flex items-start gap-2">
                                      <span className="text-yellow-600 dark:text-yellow-400 mt-0.5">•</span>
                                      <span>Implement regular compliance review procedures</span>
                                    </li>
                                  </>
                                )}
                                {application.application_assessment.riskAssessment.level === 'low' && (
                                  <>
                                    <li className="text-sm text-muted-foreground flex items-start gap-2">
                                      <span className="text-yellow-600 dark:text-yellow-400 mt-0.5">•</span>
                                      <span>Continue maintaining good compliance practices</span>
                                    </li>
                                    <li className="text-sm text-muted-foreground flex items-start gap-2">
                                      <span className="text-yellow-600 dark:text-yellow-400 mt-0.5">•</span>
                                      <span>Keep all business documentation updated regularly</span>
                                    </li>
                                    <li className="text-sm text-muted-foreground flex items-start gap-2">
                                      <span className="text-yellow-600 dark:text-yellow-400 mt-0.5">•</span>
                                      <span>Monitor for any changes in risk profile</span>
                                    </li>
                                  </>
                                )}
                                </ul>
                              </div>
                            )}
                          </AccordionContent>
                        </AccordionItem>
                      )}

                      {/* Action Plan for Agent Accordion */}
                      {application.application_assessment?.riskAssessment && (
                        <AccordionItem value="action-plan">
                          <AccordionTrigger className="text-sm font-medium">
                            <span className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                              Action Plan for Agent
                            </span>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-md">
                          <ol className="space-y-3">
                            {getActionPlan(application.application_assessment.riskAssessment).map((action: string, idx: number) => (
                              <li key={idx} className="text-sm text-muted-foreground flex items-start gap-3">
                                <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 dark:bg-blue-400 text-white dark:text-blue-950 text-xs font-semibold">
                                  {idx + 1}
                                </span>
                                <span className="flex-1 pt-0.5">{action}</span>
                              </li>
                            ))}
                              </ol>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      )}
                    </Accordion>

                    {/* Display assessment timestamp */}
                    {application.application_assessment?.riskAssessment?.timestamp && (
                      <div className="mt-4 text-xs text-muted-foreground">
                        Assessed on {new Date(application.application_assessment.riskAssessment.timestamp).toLocaleString()}
                      </div>
                    )}

                    {/* Assessment History */}
                    <div className="mt-6 pt-6 border-t">
                      <AssessmentHistory applicationId={application.id} />
                    </div>
                    </>
                  )}
                </div>
              )}
              
              {application.application_data.customer_notes && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Notes</p>
                  <p className="p-3 bg-muted rounded-md">
                    {application.application_data.customer_notes}
                  </p>
                </div>
              )}

              <div className="pt-4 border-t space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                  <div>
                    <p>Created</p>
                    <p className="font-medium text-foreground">
                      {new Date(application.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p>Last Updated</p>
                    <p className="font-medium text-foreground">
                      {new Date(application.updated_at).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Completion Timestamps - Only shown for completed applications */}
                {application.status.toLowerCase() === 'completed' && (
                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Completion Details
                        </h4>
                        {(() => {
                          const indicator = getBackdatingIndicator(
                            application.completed_at,
                            application.completed_actual
                          );
                          if (!indicator) return null;
                          const IconComponent = indicator.icon;
                          return (
                            <Badge variant={indicator.variant} className="flex items-center gap-1">
                              <IconComponent className="h-3 w-3" />
                              {indicator.label}
                            </Badge>
                          );
                        })()}
                      </div>
                      {isAdmin && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setIsEditingCompletionDate(true);
                            setShowCompletionDateDialog(true);
                          }}
                        >
                          <Clock className="h-3 w-3 mr-1" />
                          Edit Date
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Business Completion Date
                        </p>
                        <p className="font-medium text-foreground">
                          {application.completed_at 
                            ? new Date(application.completed_at).toLocaleString()
                            : 'Not set'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          When work was completed
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          System Completion Time
                        </p>
                        <p className="font-medium text-foreground">
                          {systemCompletedTime 
                            ? new Date(systemCompletedTime).toLocaleString()
                            : 'Not set'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          When admin marked complete
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle>Documents</CardTitle>
            </CardHeader>
            <CardContent>
              {!application.documents || application.documents.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No documents uploaded yet
                </p>
              ) : (
                <div className="space-y-2">
                  {application.documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{doc.document_type}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(doc.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Badge variant={doc.is_uploaded ? 'default' : 'secondary'}>
                        {doc.is_uploaded ? 'Uploaded' : 'Pending'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="messages">
          <Card>
            <CardHeader>
              <CardTitle>Messages & Comments</CardTitle>
            </CardHeader>
            <CardContent>
              {!application.messages || application.messages.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No messages yet
                </p>
              ) : (
                <div className="space-y-4">
                  {application.messages.map((msg) => (
                    <div key={msg.id} className="p-4 border rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge variant={msg.sender_type === 'admin' ? 'default' : 'secondary'}>
                          {msg.sender_type}
                        </Badge>
                        <p className="text-xs text-muted-foreground">
                          {new Date(msg.created_at).toLocaleString()}
                        </p>
                      </div>
                      <p className="text-sm">{msg.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="owners">
          <Card>
            <CardHeader>
              <CardTitle>Application Owners</CardTitle>
            </CardHeader>
            <CardContent>
              {!application.owners || application.owners.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No owners added yet
                </p>
              ) : (
                <div className="space-y-2">
                  {application.owners.map((owner) => (
                    <div key={owner.id} className="p-4 border rounded-lg">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Name</p>
                          <p className="font-medium">{owner.name}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Nationality</p>
                          <p className="font-medium">{owner.nationality || '-'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Passport</p>
                          <p className="font-medium">{owner.passport_number || '-'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Ownership</p>
                          <p className="font-medium">{owner.ownership_percentage || '-'}%</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {application.status.toLowerCase() === 'completed' && (
          <TabsContent value="history">
            <CompletionDateHistory applicationId={application.id} />
          </TabsContent>
        )}
      </Tabs>

      {/* Risk Assessment Dialog */}
      <Dialog open={showRiskDialog} onOpenChange={setShowRiskDialog}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>
              {application?.application_assessment?.riskAssessment ? 'Edit' : 'Add'} Risk Assessment
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Step 1: Method Selection */}
            <div className="space-y-2">
              <Label htmlFor="method">Select Assessment Method *</Label>
              <Select
                value={selectedMethod}
                onValueChange={(value) => {
                  setSelectedMethod(value as any);
                  setCalculatedRisk(null);
                  setManualRiskLevel('');
                  setManualReason('');
                }}
                disabled={isCalculating}
              >
                <SelectTrigger id="method">
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">👤 Manual Assessment</SelectItem>
                  <SelectItem value="rule">📊 Rule-Based Calculation</SelectItem>
                  <SelectItem value="ai">🤖 AI-Powered Analysis</SelectItem>
                  <SelectItem value="hybrid">🔀 Hybrid (AI + Manual)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Run Assessment Button */}
            {selectedMethod && selectedMethod !== 'manual' && !calculatedRisk && !isCalculating && (
              <Button
                onClick={async () => {
                  if (!application) return;
                  
                  setIsCalculating(true);
                  try {
                    const { data, error } = await supabase.functions.invoke('calculate-bank-risk', {
                      body: { applicationId: application.id, method: selectedMethod }
                    });

                    if (error) throw error;

                    if (data.requiresManualInput) {
                      toast({
                        title: 'Manual Input Required',
                        description: data.message,
                      });
                      setIsCalculating(false);
                      return;
                    }

                    // Parse calculation details
                    let parsedDetails;
                    try {
                      parsedDetails = JSON.parse(data.calculationDetails);
                    } catch {
                      parsedDetails = null;
                    }

                    // Build risk data based on method
                    let riskData: any = {
                      score: data.riskScore,
                      level: data.riskLevel,
                      details: data.calculationDetails
                    };

                    if (selectedMethod === 'rule') {
                      riskData.calculationBreakdown = parsedDetails?.breakdown && Array.isArray(parsedDetails.breakdown) ? parsedDetails.breakdown : undefined;
                    } else if (selectedMethod === 'ai') {
                      riskData.aiData = parsedDetails?.reasoning ? parsedDetails : undefined;
                    } else if (selectedMethod === 'hybrid') {
                      // Hybrid has both rule-based and AI data
                      riskData.calculationBreakdown = parsedDetails?.calculationBreakdown && Array.isArray(parsedDetails.calculationBreakdown) ? parsedDetails.calculationBreakdown : undefined;
                      riskData.aiData = parsedDetails?.aiAnalysis || undefined;
                      riskData.ruleBasedScore = parsedDetails?.ruleBasedScore || 0;
                      riskData.aiScore = parsedDetails?.aiScore || 0;
                    }

                    setCalculatedRisk(riskData);

                    // Auto-save after calculation
                    const newAssessment: any = {
                      method: selectedMethod,
                      score: data.riskScore,
                      level: data.riskLevel,
                      timestamp: new Date().toISOString(),
                      manualDetails: null
                    };

                    // Add method-specific data
                    if (selectedMethod === 'rule') {
                      newAssessment.calculationBreakdown = riskData.calculationBreakdown || null;
                    } else if (selectedMethod === 'ai') {
                      newAssessment.aiAnalysis = riskData.aiData || null;
                    } else if (selectedMethod === 'hybrid') {
                      newAssessment.calculationBreakdown = riskData.calculationBreakdown || null;
                      newAssessment.aiAnalysis = riskData.aiData || null;
                      newAssessment.hybridDetails = {
                        ruleBasedScore: riskData.ruleBasedScore,
                        aiScore: riskData.aiScore
                      };
                    }

                    const existingHistory = application.application_assessment?.assessmentHistory || [];
                    const updatedHistory = existingHistory.filter((h: any) => h.method !== selectedMethod);
                    
                    const assessmentDetails = {
                      riskAssessment: newAssessment,
                      lastAssessment: {
                        method: selectedMethod,
                        score: data.riskScore,
                        level: data.riskLevel,
                        timestamp: new Date().toISOString(),
                        calculationBreakdown: riskData.calculationBreakdown || null
                      },
                      assessmentHistory: [...updatedHistory, newAssessment]
                    };

                    const changeType = application.application_assessment?.riskAssessment ? 'updated' : 'created';
                    
                    await supabase.from('application_assessment_history').insert({
                      application_id: application.id,
                      previous_assessment: application.application_assessment || null,
                      new_assessment: assessmentDetails,
                      change_type: changeType,
                      changed_by: user?.id,
                      changed_by_role: isAdmin ? 'admin' : 'user',
                      comment: `Risk assessment ${changeType} using ${selectedMethod} method`
                    });

                    const updatedApplicationData = {
                      ...application.application_data,
                      risk_level: data.riskLevel,
                    };

                    await supabase
                      .from('account_applications')
                      .update({
                        application_data: updatedApplicationData,
                        application_assessment: assessmentDetails,
                      })
                      .eq('id', application.id);

                    toast({
                      title: 'Assessment Complete',
                      description: `${selectedMethod.charAt(0).toUpperCase() + selectedMethod.slice(1)} assessment calculated and saved`,
                    });

                    const updatedApp = await ApplicationService.fetchApplicationById(application.id);
                    setApplication(updatedApp);
                    setShowRiskDialog(false);
                    setSelectedMethod('');
                    setCalculatedRisk(null);
                  } catch (error) {
                    console.error('Error running assessment:', error);
                    toast({
                      title: 'Error',
                      description: 'Failed to run risk assessment',
                      variant: 'destructive',
                    });
                  } finally {
                    setIsCalculating(false);
                  }
                }}
                className="w-full"
              >
                <TrendingUp className="mr-2 h-4 w-4" />
                Run {selectedMethod.charAt(0).toUpperCase() + selectedMethod.slice(1)} Assessment
              </Button>
            )}

            {/* Show calculation in progress */}
            {isCalculating && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                <RefreshCw className="h-4 w-4 animate-spin" />
                Calculating risk assessment...
              </div>
            )}

            {/* Step 2: Show Calculated Results */}
            {calculatedRisk && !isCalculating && (
              <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Risk Score:</span>
                  <span className="text-lg font-bold">{calculatedRisk.score}/100</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Risk Level:</span>
                  <Badge
                    variant={
                      calculatedRisk.level === 'high' ? 'destructive' :
                      calculatedRisk.level === 'medium' ? 'default' :
                      'secondary'
                    }
                    className="font-semibold"
                  >
                    {calculatedRisk.level.toUpperCase()}
                  </Badge>
                </div>
                
                {/* Rule-based calculation breakdown */}
                {calculatedRisk.calculationBreakdown && calculatedRisk.calculationBreakdown.length > 0 && (
                  <div className="pt-2 border-t">
                    <p className="text-xs font-medium mb-2">Calculation Details:</p>
                    <div className="space-y-1">
                      {calculatedRisk.calculationBreakdown.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-xs">
                          <span className="text-muted-foreground">{item.factor}:</span>
                          <span className="font-medium">+{item.points}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* AI analysis details */}
                {calculatedRisk.aiData && (
                  <div className="pt-2 border-t space-y-2">
                    <div>
                      <p className="text-xs font-medium mb-1">AI Reasoning:</p>
                      <p className="text-xs text-muted-foreground">{calculatedRisk.aiData.reasoning}</p>
                    </div>
                    {calculatedRisk.aiData.factors && calculatedRisk.aiData.factors.length > 0 && (
                      <div>
                        <p className="text-xs font-medium mb-1">Factors Analyzed:</p>
                        <div className="space-y-1">
                          {calculatedRisk.aiData.factors.map((factor, idx) => (
                            <div key={idx} className="text-xs flex items-start gap-2">
                              <Badge 
                                variant="outline" 
                                className={`text-[10px] px-1 py-0 ${
                                  factor.impact === 'negative' ? 'border-destructive text-destructive' :
                                  factor.impact === 'positive' ? 'border-green-500 text-green-600' :
                                  'border-muted-foreground/50 text-muted-foreground'
                                }`}
                              >
                                {factor.impact}
                              </Badge>
                              <div className="flex-1">
                                <p className="font-medium">{factor.factor}</p>
                                <p className="text-muted-foreground">{factor.description}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Manual Assessment Inputs */}
            {selectedMethod === 'manual' && !isCalculating && (
              <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                <div className="space-y-2">
                  <Label htmlFor="manual-risk-level">Risk Level *</Label>
                  <Select value={manualRiskLevel} onValueChange={(value) => setManualRiskLevel(value as 'low' | 'medium' | 'high')}>
                    <SelectTrigger id="manual-risk-level" className="bg-background">
                      <SelectValue placeholder="Select risk level" />
                    </SelectTrigger>
                    <SelectContent className="bg-background pointer-events-auto z-[100]">
                      <SelectItem value="low">🟢 Low Risk</SelectItem>
                      <SelectItem value="medium">🟡 Medium Risk</SelectItem>
                      <SelectItem value="high">🔴 High Risk</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="manual-reason">Reason / Justification *</Label>
                  <Textarea
                    id="manual-reason"
                    placeholder="Explain the reasoning behind this risk assessment..."
                    value={manualReason}
                    onChange={(e) => setManualReason(e.target.value)}
                    className="min-h-[100px] bg-background"
                  />
                  <p className="text-xs text-muted-foreground">
                    Provide detailed justification for the risk classification based on your expertise and analysis.
                  </p>
                </div>
              </div>
            )}
            {selectedMethod === 'hybrid' && !isCalculating && (
              <div className="text-sm text-muted-foreground p-3 bg-muted/30 rounded-md">
                Hybrid combines AI analysis with manual override. Calculate with AI first, then adjust if needed.
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowRiskDialog(false);
                setSelectedMethod('');
                setCalculatedRisk(null);
                setManualRiskLevel('');
                setManualReason('');
              }}
            >
              Close
            </Button>
            {selectedMethod === 'manual' && (
              <Button
              onClick={async () => {
                if (!selectedMethod || !application) {
                  toast({
                    title: 'Method Required',
                    description: 'Please select an assessment method',
                    variant: 'destructive',
                  });
                  return;
                }

                // Validate manual assessment inputs
                if (selectedMethod === 'manual') {
                  if (!manualRiskLevel) {
                    toast({
                      title: 'Risk Level Required',
                      description: 'Please select a risk level',
                      variant: 'destructive',
                    });
                    return;
                  }
                  if (!manualReason.trim()) {
                    toast({
                      title: 'Reason Required',
                      description: 'Please provide a reason for the risk assessment',
                      variant: 'destructive',
                    });
                    return;
                  }
                }

                if (!calculatedRisk) {
                  toast({
                    title: 'Calculation Required',
                    description: 'Risk calculation required for manual assessment',
                    variant: 'destructive',
                  });
                  return;
                }

                try {
                  // For manual assessment, derive score from selected level
                  let finalScore = calculatedRisk?.score;
                  let finalLevel = calculatedRisk?.level;
                  let manualDetails = null;

                  if (selectedMethod === 'manual') {
                    finalLevel = manualRiskLevel as 'low' | 'medium' | 'high';
                    // Calculate score based on level: low (16), medium (50), high (83)
                    finalScore = manualRiskLevel === 'low' ? 16 : manualRiskLevel === 'medium' ? 50 : 83;
                    manualDetails = {
                      reason: manualReason,
                      assessedBy: user?.profile?.name || 'Admin'
                    };
                  }

                  const updatedApplicationData = {
                    ...application.application_data,
                    risk_level: finalLevel || 'medium',
                  };

                  // Prepare assessment details for application_assessment column
                  const newAssessment = {
                    method: selectedMethod,
                    score: finalScore || null,
                    level: finalLevel || 'medium',
                    timestamp: new Date().toISOString(),
                    calculationBreakdown: calculatedRisk?.calculationBreakdown || null,
                    aiAnalysis: calculatedRisk?.aiData || null,
                    rawDetails: calculatedRisk?.details || null,
                    manualDetails: manualDetails
                  };

                  // Get existing history and update/replace if same method used
                  const existingHistory = application.application_assessment?.assessmentHistory || [];
                  const updatedHistory = existingHistory.filter(h => h.method !== selectedMethod);
                  
                  const assessmentDetails = {
                    riskAssessment: newAssessment,
                    lastAssessment: {
                      method: selectedMethod,
                      score: calculatedRisk?.score || 0,
                      level: calculatedRisk?.level || 'medium',
                      timestamp: new Date().toISOString(),
                      calculationBreakdown: calculatedRisk?.calculationBreakdown || null
                    },
                    assessmentHistory: [...updatedHistory, newAssessment]
                  };

                  // Determine change type
                  const changeType = application.application_assessment?.riskAssessment ? 'updated' : 'created';
                  
                  // Log to history
                  await supabase.from('application_assessment_history').insert({
                    application_id: application.id,
                    previous_assessment: application.application_assessment || null,
                    new_assessment: assessmentDetails,
                    change_type: changeType,
                    changed_by: user?.id,
                    changed_by_role: isAdmin ? 'admin' : 'user',
                    comment: `Risk assessment ${changeType} using ${selectedMethod} method`
                  });

                  const { error } = await supabase
                    .from('account_applications')
                    .update({
                      application_data: updatedApplicationData,
                      application_assessment: assessmentDetails,
                    })
                    .eq('id', application.id);

                  if (error) throw error;

                  toast({
                    title: 'Risk Assessment Saved',
                    description: `${selectedMethod.charAt(0).toUpperCase() + selectedMethod.slice(1)} assessment ${changeType} successfully`,
                  });

                  const updatedApp = await ApplicationService.fetchApplicationById(application.id);
                  setApplication(updatedApp);
                  setShowRiskDialog(false);
                  setSelectedMethod('');
                  setCalculatedRisk(null);
                  setManualRiskLevel('');
                  setManualReason('');
                } catch (error) {
                  console.error('Error saving risk assessment:', error);
                  toast({
                    title: 'Error',
                    description: 'Failed to save risk assessment',
                    variant: 'destructive',
                  });
                }
              }}
              disabled={!manualRiskLevel || !manualReason || isCalculating}
            >
              {isCalculating ? 'Saving...' : 'Save Manual Assessment'}
            </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ApplicationDetail;

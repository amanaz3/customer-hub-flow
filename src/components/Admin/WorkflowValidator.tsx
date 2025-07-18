
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/SecureAuthContext';
import { supabase } from '@/lib/supabase';
import { CheckCircle, XCircle, AlertCircle, Play } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ValidationResult {
  name: string;
  status: 'pass' | 'fail' | 'warning' | 'pending';
  message: string;
  details?: string;
}

const WorkflowValidator: React.FC = () => {
  const { isAdmin, user } = useAuth();
  const { toast } = useToast();
  const [results, setResults] = useState<ValidationResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runValidation = async () => {
    setIsRunning(true);
    const validationResults: ValidationResult[] = [];

    try {
      // Test 1: Database Connection
      try {
        await supabase.from('profiles').select('count').single();
        validationResults.push({
          name: 'Database Connection',
          status: 'pass',
          message: 'Successfully connected to Supabase database'
        });
      } catch (error) {
        validationResults.push({
          name: 'Database Connection',
          status: 'fail',
          message: 'Failed to connect to database',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      // Test 2: Authentication System
      if (user) {
        validationResults.push({
          name: 'Authentication',
          status: 'pass',
          message: `User authenticated: ${user.email}`
        });
      } else {
        validationResults.push({
          name: 'Authentication',
          status: 'fail',
          message: 'User not authenticated'
        });
      }

      // Test 3: Role System
      if (isAdmin) {
        validationResults.push({
          name: 'Admin Role',
          status: 'pass',
          message: 'Admin privileges confirmed'
        });
      } else {
        validationResults.push({
          name: 'Admin Role',
          status: 'warning',
          message: 'User role detected (not admin)'
        });
      }

      // Test 4: Customer Table Access
      try {
        const { data, error } = await supabase
          .from('customers')
          .select('count')
          .limit(1);
        
        if (error) throw error;
        
        validationResults.push({
          name: 'Customer Data Access',
          status: 'pass',
          message: 'Can access customer table'
        });
      } catch (error) {
        validationResults.push({
          name: 'Customer Data Access',
          status: 'fail',
          message: 'Cannot access customer table',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      // Test 5: Document Upload Capability
      try {
        const { data: buckets } = await supabase.storage.listBuckets();
        if (buckets && buckets.length > 0) {
          validationResults.push({
            name: 'File Storage',
            status: 'pass',
            message: 'Storage buckets accessible'
          });
        } else {
          validationResults.push({
            name: 'File Storage',
            status: 'warning',
            message: 'No storage buckets found'
          });
        }
      } catch (error) {
        validationResults.push({
          name: 'File Storage',
          status: 'fail',
          message: 'Storage system error',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      // Test 6: Status Change System
      try {
        const { data, error } = await supabase
          .from('status_changes')
          .select('count')
          .limit(1);
        
        if (error) throw error;
        
        validationResults.push({
          name: 'Status History',
          status: 'pass',
          message: 'Status tracking system functional'
        });
      } catch (error) {
        validationResults.push({
          name: 'Status History',
          status: 'fail',
          message: 'Status tracking system error',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      // Test 7: Comment System
      try {
        const { data, error } = await supabase
          .from('comments')
          .select('count')
          .limit(1);
        
        if (error) throw error;
        
        validationResults.push({
          name: 'Comment System',
          status: 'pass',
          message: 'Comment system operational'
        });
      } catch (error) {
        validationResults.push({
          name: 'Comment System',
          status: 'fail',
          message: 'Comment system error',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }

    } catch (globalError) {
      validationResults.push({
        name: 'Global System Check',
        status: 'fail',
        message: 'Unexpected system error',
        details: globalError instanceof Error ? globalError.message : 'Unknown error'
      });
    }

    setResults(validationResults);
    setIsRunning(false);

    // Show summary toast
    const failedTests = validationResults.filter(r => r.status === 'fail').length;
    const warningTests = validationResults.filter(r => r.status === 'warning').length;
    
    if (failedTests === 0 && warningTests === 0) {
      toast({
        title: 'All Systems Operational',
        description: 'All workflow validations passed successfully',
      });
    } else if (failedTests > 0) {
      toast({
        title: 'Critical Issues Found',
        description: `${failedTests} critical issues and ${warningTests} warnings detected`,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Minor Issues Found',
        description: `${warningTests} warnings detected`,
        variant: 'default',
      });
    }
  };

  const getStatusIcon = (status: ValidationResult['status']) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'fail':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: ValidationResult['status']) => {
    switch (status) {
      case 'pass':
        return <Badge className="bg-green-100 text-green-800">Pass</Badge>;
      case 'fail':
        return <Badge className="bg-red-100 text-red-800">Fail</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-800">Warning</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Pending</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Workflow System Validation</span>
          <Button 
            onClick={runValidation} 
            disabled={isRunning}
            className="flex items-center gap-2"
          >
            <Play className="w-4 h-4" />
            {isRunning ? 'Running...' : 'Run Validation'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {results.length === 0 && !isRunning && (
          <p className="text-muted-foreground text-center py-8">
            Click "Run Validation" to check all workflow systems
          </p>
        )}
        
        {isRunning && (
          <p className="text-muted-foreground text-center py-8">
            Running validation tests...
          </p>
        )}

        <div className="space-y-3">
          {results.map((result, index) => (
            <div key={`workflow-result-${result.name}-${result.status}-${index}`} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                {getStatusIcon(result.status)}
                <div>
                  <h4 className="font-medium">{result.name}</h4>
                  <p className="text-sm text-muted-foreground">{result.message}</p>
                  {result.details && (
                    <p className="text-xs text-red-600 mt-1">{result.details}</p>
                  )}
                </div>
              </div>
              {getStatusBadge(result.status)}
            </div>
          ))}
        </div>

        {results.length > 0 && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium mb-2">Summary</h4>
            <div className="flex gap-4 text-sm">
              <span className="text-green-600">
                ✓ {results.filter(r => r.status === 'pass').length} Passed
              </span>
              <span className="text-yellow-600">
                ⚠ {results.filter(r => r.status === 'warning').length} Warnings
              </span>
              <span className="text-red-600">
                ✗ {results.filter(r => r.status === 'fail').length} Failed
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WorkflowValidator;

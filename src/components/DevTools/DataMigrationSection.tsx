import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function DataMigrationSection() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const runMigration = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log('Getting auth session...');
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('No active session - please log in again');
      }

      console.log('Invoking migration function...');
      const { data, error: funcError } = await supabase.functions.invoke(
        'migrate-customer-applications',
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      console.log('Migration response:', data);

      if (funcError) {
        console.error('Function error:', funcError);
        throw funcError;
      }
      
      setResult(data);
      
      if (data?.success) {
        toast.success(`Migration completed! ${data.migrated} records migrated, ${data.skipped} skipped`);
      } else {
        toast.error(data?.error || 'Migration failed');
      }
    } catch (err: any) {
      console.error('Migration error:', err);
      setError(err.message);
      toast.error(`Migration error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        This will create application records in the account_applications table
        for all existing customers, maintaining the link between customers and their applications.
      </div>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Important:</strong> This is a one-time migration. Running it multiple times will skip already migrated records.
        </AlertDescription>
      </Alert>

      <Button onClick={runMigration} disabled={loading} size="lg">
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Run Migration
      </Button>

      <div className="rounded-lg border bg-card p-4">
        <h3 className="font-semibold mb-3">What This Migration Does</h3>
        <div className="space-y-2 text-sm">
          <p>✅ Creates application records in <code className="bg-muted px-1 rounded">account_applications</code> table</p>
          <p>✅ Links applications to their respective customers</p>
          <p>✅ Preserves all application data (status, license type, banks, etc.)</p>
          <p>✅ Maintains original timestamps (created_at, updated_at)</p>
          <p>✅ Skips records that have already been migrated</p>
          <p>⚠️ Original customer data remains untouched for safety</p>
        </div>
      </div>

      {result && (
        <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription>
            <div className="font-medium text-green-900 dark:text-green-100">Migration Complete!</div>
            <ul className="mt-2 space-y-1 text-sm text-green-800 dark:text-green-200">
              <li><strong>Total Records:</strong> {result.total}</li>
              <li><strong>Migrated:</strong> {result.migrated}</li>
              <li><strong>Skipped:</strong> {result.skipped}</li>
              {result.errors && (
                <li className="text-red-600 dark:text-red-400">
                  <strong>Errors:</strong> {result.errors.length}
                </li>
              )}
            </ul>
            {result.errors && (
              <details className="mt-2">
                <summary className="cursor-pointer text-sm font-medium">View Errors</summary>
                <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto">
                  {JSON.stringify(result.errors, null, 2)}
                </pre>
              </details>
            )}
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="font-medium">Migration Failed</div>
            <div className="text-sm mt-1">{error}</div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

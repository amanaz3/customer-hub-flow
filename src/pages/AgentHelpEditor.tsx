import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Save, Eye, ArrowLeft } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';

const AgentHelpEditor = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [helpContent, setHelpContent] = useState({
    overview: '',
    required_basic: '',
    required_application: '',
    company_tips: '',
    bank_account_fields: '',
    bookkeeping_fields: '',
    tax_filing_fields: '',
    document_upload_info: '',
    best_practices_dos: '',
    best_practices_donts: '',
    troubleshooting: ''
  });

  useEffect(() => {
    loadHelpContent();
  }, []);

  const loadHelpContent = () => {
    setLoading(true);
    try {
      const stored = localStorage.getItem('agent_help_content');
      if (stored) {
        const parsed = JSON.parse(stored);
        setHelpContent(parsed);
      }
    } catch (error) {
      console.error('Error loading help content:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    setSaving(true);
    try {
      localStorage.setItem('agent_help_content', JSON.stringify(helpContent));

      toast({
        title: "Success",
        description: "Help guide content saved successfully",
      });
    } catch (error) {
      console.error('Error saving help content:', error);
      toast({
        title: "Error",
        description: "Failed to save help guide content",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading editor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">Agent Help Guide Editor</h1>
          <p className="text-muted-foreground mt-1">
            Customize the help guide content for your agents
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => window.open('/applications/new', '_blank')}
          >
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid grid-cols-4 lg:grid-cols-6 mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="required">Required Info</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="practices">Best Practices</TabsTrigger>
          <TabsTrigger value="troubleshooting">Troubleshooting</TabsTrigger>
        </TabsList>

        <ScrollArea className="h-[calc(100vh-250px)]">
          {/* Overview Section */}
          <TabsContent value="overview">
            <Card>
              <CardHeader>
                <CardTitle>Application Process Overview</CardTitle>
                <CardDescription>
                  Explain the overall process to agents
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="overview">Overview Text</Label>
                  <Textarea
                    id="overview"
                    value={helpContent.overview}
                    onChange={(e) => setHelpContent({ ...helpContent, overview: e.target.value })}
                    placeholder="This form follows a 2-stage process..."
                    rows={6}
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Use line breaks for lists or steps
                  </p>
                </div>

                <div>
                  <Label htmlFor="company_tips">Company Selection Tips</Label>
                  <Textarea
                    id="company_tips"
                    value={helpContent.company_tips}
                    onChange={(e) => setHelpContent({ ...helpContent, company_tips: e.target.value })}
                    placeholder="Tips for selecting or creating companies..."
                    rows={4}
                    className="mt-2"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Required Info Section */}
          <TabsContent value="required">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Required Basic Information</CardTitle>
                  <CardDescription>
                    List required customer information fields
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Label htmlFor="required_basic">Basic Fields (one per line)</Label>
                  <Textarea
                    id="required_basic"
                    value={helpContent.required_basic}
                    onChange={(e) => setHelpContent({ ...helpContent, required_basic: e.target.value })}
                    placeholder="Customer Name (Full legal name)&#10;Email Address (Valid format required)&#10;Mobile Number (10-20 digits)"
                    rows={6}
                    className="mt-2"
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Required Application Details</CardTitle>
                  <CardDescription>
                    List required application fields
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Label htmlFor="required_application">Application Fields (one per line)</Label>
                  <Textarea
                    id="required_application"
                    value={helpContent.required_application}
                    onChange={(e) => setHelpContent({ ...helpContent, required_application: e.target.value })}
                    placeholder="Product/Service Selection (Required)&#10;License Type (Mainland/Freezone/Offshore)"
                    rows={6}
                    className="mt-2"
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Product-Specific Fields */}
          <TabsContent value="products">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Business Bank Account Fields</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={helpContent.bank_account_fields}
                    onChange={(e) => setHelpContent({ ...helpContent, bank_account_fields: e.target.value })}
                    placeholder="Mainland or Freezone status&#10;Signatory type (Single/Joint)"
                    rows={5}
                    className="mt-2"
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Bookkeeping Services Fields</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={helpContent.bookkeeping_fields}
                    onChange={(e) => setHelpContent({ ...helpContent, bookkeeping_fields: e.target.value })}
                    placeholder="Company incorporation date&#10;Number of monthly entries"
                    rows={5}
                    className="mt-2"
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Corporate Tax Filing Fields</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={helpContent.tax_filing_fields}
                    onChange={(e) => setHelpContent({ ...helpContent, tax_filing_fields: e.target.value })}
                    placeholder="Tax year period&#10;First-time filing status"
                    rows={5}
                    className="mt-2"
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Document Upload */}
          <TabsContent value="documents">
            <Card>
              <CardHeader>
                <CardTitle>Document Upload Guide</CardTitle>
                <CardDescription>
                  Instructions for the document upload stage
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={helpContent.document_upload_info}
                  onChange={(e) => setHelpContent({ ...helpContent, document_upload_info: e.target.value })}
                  placeholder="After creating the customer, you'll be automatically moved to the document upload stage..."
                  rows={8}
                  className="mt-2"
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Best Practices */}
          <TabsContent value="practices">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Do's (Best Practices)</CardTitle>
                  <CardDescription className="text-green-600">
                    What agents should do
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={helpContent.best_practices_dos}
                    onChange={(e) => setHelpContent({ ...helpContent, best_practices_dos: e.target.value })}
                    placeholder="Verify customer email and phone before submitting&#10;Double-check company name spelling"
                    rows={8}
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    One tip per line
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Don'ts (What to Avoid)</CardTitle>
                  <CardDescription className="text-red-600">
                    What agents should avoid
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={helpContent.best_practices_donts}
                    onChange={(e) => setHelpContent({ ...helpContent, best_practices_donts: e.target.value })}
                    placeholder="Don't create duplicate companies&#10;Don't skip mandatory fields"
                    rows={8}
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    One tip per line
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Troubleshooting */}
          <TabsContent value="troubleshooting">
            <Card>
              <CardHeader>
                <CardTitle>Common Issues & Solutions</CardTitle>
                <CardDescription>
                  Help agents solve common problems
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={helpContent.troubleshooting}
                  onChange={(e) => setHelpContent({ ...helpContent, troubleshooting: e.target.value })}
                  placeholder="Format: Problem | Solution (separate with |)&#10;Form won't submit? | Check for validation errors&#10;Can't find company? | Use the search box"
                  rows={10}
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Format: Problem | Solution (one per line, separated by |)
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </ScrollArea>
      </Tabs>

      {/* Floating Save Button */}
      <div className="fixed bottom-6 right-6">
        <Button size="lg" onClick={handleSave} disabled={saving} className="shadow-lg">
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save All Changes'}
        </Button>
      </div>
    </div>
  );
};

export default AgentHelpEditor;

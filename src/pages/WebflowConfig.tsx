import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Globe, Building2, Briefcase, CreditCard, FileText, Plus, Pencil, Trash2, Settings,
  AlertTriangle, CheckCircle, XCircle, Search, Filter, Workflow, Download, Upload, 
  History, RotateCcw, Loader2, Tag, Mail, Package, Users, Layers
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import RulesTab from '@/components/Webflow/RulesTab';
import PromoCodesTab from '@/components/Webflow/PromoCodesTab';
import EmailTemplatesTab from '@/components/Webflow/EmailTemplatesTab';
import { toast } from '@/hooks/use-toast';
import { 
  useWebflowConfig, 
  WebflowCountryConfig, 
  WebflowJurisdictionConfig, 
  WebflowActivityConfig, 
  WebflowDocumentConfig,
  WebflowPricingConfig,
  WebflowConfigVersion
} from '@/hooks/useWebflowConfig';

const RISK_COLORS: Record<string, string> = {
  low: 'bg-green-100 text-green-800',
  standard: 'bg-blue-100 text-blue-800',
  high: 'bg-amber-100 text-amber-800',
  prohibited: 'bg-red-100 text-red-800'
};

const TYPE_COLORS: Record<string, string> = {
  mainland: 'bg-blue-100 text-blue-800',
  freezone: 'bg-purple-100 text-purple-800',
  offshore: 'bg-slate-100 text-slate-800'
};

export default function WebflowConfig() {
  const [activeTab, setActiveTab] = useState('countries');
  const [searchQuery, setSearchQuery] = useState('');
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { 
    config, 
    configData, 
    versions, 
    loading, 
    saving, 
    exportConfig, 
    importConfig,
    restoreVersion,
    updateCountries,
    updateJurisdictions,
    updateActivities,
    updateDocuments,
    updatePricing,
    updateRules,
    updatePromoCodes,
    updateEmailTemplates
  } = useWebflowConfig();

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await importConfig(file);
      e.target.value = '';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Settings className="w-8 h-8" />
            Webflow Decision Engine
          </h1>
          <p className="text-muted-foreground mt-1">
            Configure eligibility rules, jurisdictions, activities, pricing, and documents
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            v{config?.version_number || 1}
          </Badge>
          <Button variant="outline" size="sm" onClick={() => setShowVersionHistory(true)}>
            <History className="h-4 w-4 mr-2" />
            History
          </Button>
          <Button variant="outline" size="sm" onClick={exportConfig}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileImport}
            className="hidden"
          />
        </div>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        {saving && (
          <Badge variant="secondary" className="flex items-center gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            Saving...
          </Badge>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="countries" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Countries
          </TabsTrigger>
          <TabsTrigger value="jurisdictions" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Jurisdictions
          </TabsTrigger>
          <TabsTrigger value="activities" className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            Activities
          </TabsTrigger>
          <TabsTrigger value="pricing" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Pricing
          </TabsTrigger>
          <TabsTrigger value="promos" className="flex items-center gap-2">
            <Tag className="h-4 w-4" />
            Promos
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Documents
          </TabsTrigger>
          <TabsTrigger value="rules" className="flex items-center gap-2">
            <Workflow className="h-4 w-4" />
            Rules
          </TabsTrigger>
          <TabsTrigger value="emails" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Emails
          </TabsTrigger>
        </TabsList>

        <TabsContent value="countries">
          <CountriesTab 
            searchQuery={searchQuery} 
            countries={configData.countries}
            onUpdate={updateCountries}
          />
        </TabsContent>
        
        <TabsContent value="jurisdictions">
          <JurisdictionsTab 
            searchQuery={searchQuery}
            jurisdictions={configData.jurisdictions}
            onUpdate={updateJurisdictions}
          />
        </TabsContent>
        
        <TabsContent value="activities">
          <ActivitiesTab 
            searchQuery={searchQuery}
            activities={configData.activities}
            onUpdate={updateActivities}
          />
        </TabsContent>
        
        <TabsContent value="pricing">
          <PricingTab 
            searchQuery={searchQuery}
            pricing={configData.pricing}
            onUpdate={updatePricing}
          />
        </TabsContent>
        
        <TabsContent value="documents">
          <DocumentsTab 
            searchQuery={searchQuery}
            documents={configData.documents}
            onUpdate={updateDocuments}
          />
        </TabsContent>

        <TabsContent value="promos">
          <PromoCodesTab 
            promoCodes={configData.promoCodes || []}
            pricing={configData.pricing}
            jurisdictions={configData.jurisdictions}
            onUpdate={updatePromoCodes}
            searchQuery={searchQuery}
          />
        </TabsContent>

        <TabsContent value="rules">
          <RulesTab 
            rules={config?.config_data?.rules || []} 
            onUpdate={async (rules) => { await updateRules(rules as any); }}
          />
        </TabsContent>

        <TabsContent value="emails">
          <EmailTemplatesTab 
            emailTemplates={configData.emailTemplates || []}
            onUpdate={updateEmailTemplates}
          />
        </TabsContent>
      </Tabs>

      <VersionHistoryDialog
        open={showVersionHistory}
        onOpenChange={setShowVersionHistory}
        versions={versions}
        currentVersion={config?.version_number || 1}
        onRestore={restoreVersion}
      />
    </div>
  );
}

// Version History Dialog
function VersionHistoryDialog({
  open,
  onOpenChange,
  versions,
  currentVersion,
  onRestore
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  versions: WebflowConfigVersion[];
  currentVersion: number;
  onRestore: (version: WebflowConfigVersion) => Promise<boolean>;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Version History</DialogTitle>
          <DialogDescription>
            View and restore previous configuration versions
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[400px] overflow-y-auto">
          {versions.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No previous versions</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Version</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {versions.map((version) => (
                  <TableRow key={version.id}>
                    <TableCell>
                      <Badge variant={version.version_number === currentVersion - 1 ? "default" : "outline"}>
                        v{version.version_number}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {new Date(version.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {version.change_notes || '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => onRestore(version)}
                      >
                        <RotateCcw className="h-4 w-4 mr-1" />
                        Restore
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Countries Tab Component
function CountriesTab({ 
  searchQuery, 
  countries,
  onUpdate
}: { 
  searchQuery: string;
  countries: WebflowCountryConfig[];
  onUpdate: (countries: WebflowCountryConfig[]) => Promise<boolean>;
}) {
  const [editingCountry, setEditingCountry] = useState<WebflowCountryConfig | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleSave = async (country: Partial<WebflowCountryConfig>) => {
    let updatedCountries: WebflowCountryConfig[];
    
    if (editingCountry?.id) {
      updatedCountries = countries.map(c => 
        c.id === editingCountry.id ? { ...c, ...country } as WebflowCountryConfig : c
      );
    } else {
      const newCountry: WebflowCountryConfig = {
        id: crypto.randomUUID(),
        country_code: country.country_code || '',
        country_name: country.country_name || '',
        is_blocked: country.is_blocked || false,
        block_reason: country.block_reason || null,
        risk_level: country.risk_level || 'standard',
        requires_enhanced_due_diligence: country.requires_enhanced_due_diligence || false,
        is_active: country.is_active !== false
      };
      updatedCountries = [...countries, newCountry];
    }
    
    await onUpdate(updatedCountries);
    setIsDialogOpen(false);
    setEditingCountry(null);
  };

  const handleDelete = async (id: string) => {
    const updatedCountries = countries.filter(c => c.id !== id);
    await onUpdate(updatedCountries);
  };

  const filteredCountries = countries.filter(c => 
    c.country_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.country_code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Country Eligibility</CardTitle>
          <CardDescription>Manage country-based eligibility rules and restrictions</CardDescription>
        </div>
        <Button onClick={() => { setEditingCountry(null); setIsDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Country
        </Button>
      </CardHeader>
      <CardContent>
        {filteredCountries.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground">No countries configured</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Country</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Risk Level</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>EDD Required</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCountries.map((country) => (
                <TableRow key={country.id}>
                  <TableCell className="font-medium">{country.country_name}</TableCell>
                  <TableCell>{country.country_code}</TableCell>
                  <TableCell>
                    <Badge className={RISK_COLORS[country.risk_level] || RISK_COLORS.standard}>
                      {country.risk_level}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {country.is_blocked ? (
                      <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                        <XCircle className="h-3 w-3" />
                        Blocked
                      </Badge>
                    ) : country.is_active ? (
                      <Badge variant="outline" className="flex items-center gap-1 w-fit text-green-600 border-green-600">
                        <CheckCircle className="h-3 w-3" />
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {country.requires_enhanced_due_diligence && (
                      <Badge variant="outline" className="text-amber-600 border-amber-600">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        EDD
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => { setEditingCountry(country); setIsDialogOpen(true); }}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(country.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <CountryDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen}
        country={editingCountry}
        onSave={handleSave}
      />
    </Card>
  );
}

function CountryDialog({ 
  open, onOpenChange, country, onSave 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
  country: WebflowCountryConfig | null;
  onSave: (country: Partial<WebflowCountryConfig>) => void;
}) {
  const [formData, setFormData] = useState<Partial<WebflowCountryConfig>>({});

  useEffect(() => {
    if (country) {
      setFormData(country);
    } else {
      setFormData({
        country_code: '',
        country_name: '',
        is_blocked: false,
        block_reason: '',
        risk_level: 'standard',
        requires_enhanced_due_diligence: false,
        is_active: true
      });
    }
  }, [country, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{country ? 'Edit Country' : 'Add Country'}</DialogTitle>
          <DialogDescription>Configure country eligibility rules</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Country Code</Label>
              <Input 
                value={formData.country_code || ''} 
                onChange={(e) => setFormData({...formData, country_code: e.target.value.toUpperCase()})}
                placeholder="UAE"
                maxLength={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Country Name</Label>
              <Input 
                value={formData.country_name || ''} 
                onChange={(e) => setFormData({...formData, country_name: e.target.value})}
                placeholder="United Arab Emirates"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Risk Level</Label>
            <Select 
              value={formData.risk_level || 'standard'} 
              onValueChange={(value) => setFormData({...formData, risk_level: value})}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low Risk</SelectItem>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="high">High Risk</SelectItem>
                <SelectItem value="prohibited">Prohibited</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <Label>Blocked</Label>
            <Switch 
              checked={formData.is_blocked || false} 
              onCheckedChange={(checked) => setFormData({...formData, is_blocked: checked})}
            />
          </div>

          {formData.is_blocked && (
            <div className="space-y-2">
              <Label>Block Reason</Label>
              <Textarea 
                value={formData.block_reason || ''} 
                onChange={(e) => setFormData({...formData, block_reason: e.target.value})}
                placeholder="Reason for blocking..."
              />
            </div>
          )}

          <div className="flex items-center justify-between">
            <Label>Requires Enhanced Due Diligence</Label>
            <Switch 
              checked={formData.requires_enhanced_due_diligence || false} 
              onCheckedChange={(checked) => setFormData({...formData, requires_enhanced_due_diligence: checked})}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label>Active</Label>
            <Switch 
              checked={formData.is_active !== false} 
              onCheckedChange={(checked) => setFormData({...formData, is_active: checked})}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => onSave(formData)}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Jurisdictions Tab Component
function JurisdictionsTab({ 
  searchQuery,
  jurisdictions,
  onUpdate
}: { 
  searchQuery: string;
  jurisdictions: WebflowJurisdictionConfig[];
  onUpdate: (jurisdictions: WebflowJurisdictionConfig[]) => Promise<boolean>;
}) {
  const [editingJurisdiction, setEditingJurisdiction] = useState<WebflowJurisdictionConfig | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleSave = async (jurisdiction: Partial<WebflowJurisdictionConfig>) => {
    let updated: WebflowJurisdictionConfig[];
    
    if (editingJurisdiction?.id) {
      updated = jurisdictions.map(j => 
        j.id === editingJurisdiction.id ? { ...j, ...jurisdiction } as WebflowJurisdictionConfig : j
      );
    } else {
      const newItem: WebflowJurisdictionConfig = {
        id: crypto.randomUUID(),
        jurisdiction_code: jurisdiction.jurisdiction_code || '',
        jurisdiction_name: jurisdiction.jurisdiction_name || '',
        jurisdiction_type: jurisdiction.jurisdiction_type || 'freezone',
        emirate: jurisdiction.emirate || '',
        legal_forms: jurisdiction.legal_forms || [],
        base_price: jurisdiction.base_price || 0,
        processing_days: jurisdiction.processing_days || 14,
        is_active: jurisdiction.is_active !== false,
        notes: jurisdiction.notes || null
      };
      updated = [...jurisdictions, newItem];
    }
    
    await onUpdate(updated);
    setIsDialogOpen(false);
    setEditingJurisdiction(null);
  };

  const handleDelete = async (id: string) => {
    await onUpdate(jurisdictions.filter(j => j.id !== id));
  };

  const filteredJurisdictions = jurisdictions.filter(j => 
    j.jurisdiction_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    j.jurisdiction_code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Jurisdictions & Legal Forms</CardTitle>
          <CardDescription>Manage UAE jurisdictions, free zones, and legal entity types</CardDescription>
        </div>
        <Button onClick={() => { setEditingJurisdiction(null); setIsDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Jurisdiction
        </Button>
      </CardHeader>
      <CardContent>
        {filteredJurisdictions.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground">No jurisdictions configured</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Jurisdiction</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Legal Forms</TableHead>
                <TableHead>Base Price</TableHead>
                <TableHead>Processing</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredJurisdictions.map((jurisdiction) => {
                const legalForms = jurisdiction.legal_forms || [];
                return (
                  <TableRow key={jurisdiction.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{jurisdiction.jurisdiction_name}</p>
                        <p className="text-xs text-muted-foreground">{jurisdiction.emirate || '-'}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={TYPE_COLORS[jurisdiction.jurisdiction_type] || TYPE_COLORS.freezone}>
                        {jurisdiction.jurisdiction_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {legalForms.length === 0 ? (
                          <span className="text-xs text-muted-foreground">All forms</span>
                        ) : (
                          <>
                            {legalForms.slice(0, 2).map((form, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">{form}</Badge>
                            ))}
                            {legalForms.length > 2 && (
                              <Badge variant="secondary" className="text-xs">+{legalForms.length - 2}</Badge>
                            )}
                          </>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>AED {jurisdiction.base_price?.toLocaleString()}</TableCell>
                    <TableCell>{jurisdiction.processing_days} days</TableCell>
                    <TableCell>
                      {jurisdiction.is_active ? (
                        <Badge variant="outline" className="text-green-600 border-green-600">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => { setEditingJurisdiction(jurisdiction); setIsDialogOpen(true); }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(jurisdiction.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <JurisdictionDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen}
        jurisdiction={editingJurisdiction}
        onSave={handleSave}
      />
    </Card>
  );
}

function JurisdictionDialog({ 
  open, onOpenChange, jurisdiction, onSave 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
  jurisdiction: WebflowJurisdictionConfig | null;
  onSave: (jurisdiction: Partial<WebflowJurisdictionConfig>) => void;
}) {
  const [formData, setFormData] = useState<Partial<WebflowJurisdictionConfig>>({});
  const [legalFormsText, setLegalFormsText] = useState('');

  useEffect(() => {
    if (jurisdiction) {
      setFormData(jurisdiction);
      setLegalFormsText((jurisdiction.legal_forms || []).join(', '));
    } else {
      setFormData({
        jurisdiction_code: '', jurisdiction_name: '', jurisdiction_type: 'freezone',
        emirate: '', legal_forms: [], base_price: 0, processing_days: 14, is_active: true, notes: ''
      });
      setLegalFormsText('');
    }
  }, [jurisdiction, open]);

  const handleSave = () => {
    const legalForms = legalFormsText.split(',').map(s => s.trim()).filter(Boolean);
    onSave({ ...formData, legal_forms: legalForms });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{jurisdiction ? 'Edit Jurisdiction' : 'Add Jurisdiction'}</DialogTitle>
          <DialogDescription>Configure jurisdiction settings and available legal forms</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Code</Label>
              <Input value={formData.jurisdiction_code || ''} onChange={(e) => setFormData({...formData, jurisdiction_code: e.target.value})} placeholder="DMCC" />
            </div>
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={formData.jurisdiction_name || ''} onChange={(e) => setFormData({...formData, jurisdiction_name: e.target.value})} placeholder="Dubai Multi Commodities Centre" />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={formData.jurisdiction_type || 'freezone'} onValueChange={(value) => setFormData({...formData, jurisdiction_type: value as any})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="mainland">Mainland</SelectItem>
                  <SelectItem value="freezone">Free Zone</SelectItem>
                  <SelectItem value="offshore">Offshore</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Emirate</Label>
              <Select value={formData.emirate || ''} onValueChange={(value) => setFormData({...formData, emirate: value})}>
                <SelectTrigger><SelectValue placeholder="Select emirate" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Dubai">Dubai</SelectItem>
                  <SelectItem value="Abu Dhabi">Abu Dhabi</SelectItem>
                  <SelectItem value="Sharjah">Sharjah</SelectItem>
                  <SelectItem value="Ajman">Ajman</SelectItem>
                  <SelectItem value="Ras Al Khaimah">Ras Al Khaimah</SelectItem>
                  <SelectItem value="Fujairah">Fujairah</SelectItem>
                  <SelectItem value="Umm Al Quwain">Umm Al Quwain</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Base Price (AED)</Label>
              <Input type="number" value={formData.base_price || 0} onChange={(e) => setFormData({...formData, base_price: parseFloat(e.target.value) || 0})} />
            </div>
            <div className="space-y-2">
              <Label>Processing Days</Label>
              <Input type="number" value={formData.processing_days || 14} onChange={(e) => setFormData({...formData, processing_days: parseInt(e.target.value) || 14})} />
            </div>
          </div>

          <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Label className="font-semibold">Available Legal Forms</Label>
            </div>
            <Input value={legalFormsText} onChange={(e) => setLegalFormsText(e.target.value)} placeholder="LLC, FZC, FZE, Branch (comma-separated)" className="text-sm" />
            <p className="text-xs text-muted-foreground">Legal entity types available in this jurisdiction. Leave empty for all forms.</p>
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea value={formData.notes || ''} onChange={(e) => setFormData({...formData, notes: e.target.value})} placeholder="Additional notes..." />
          </div>

          <div className="flex items-center justify-between">
            <Label>Active</Label>
            <Switch checked={formData.is_active !== false} onCheckedChange={(checked) => setFormData({...formData, is_active: checked})} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Activities Tab Component
function ActivitiesTab({ 
  searchQuery,
  activities,
  onUpdate
}: { 
  searchQuery: string;
  activities: WebflowActivityConfig[];
  onUpdate: (activities: WebflowActivityConfig[]) => Promise<boolean>;
}) {
  const [editingActivity, setEditingActivity] = useState<WebflowActivityConfig | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleSave = async (activity: Partial<WebflowActivityConfig>) => {
    let updated: WebflowActivityConfig[];
    
    if (editingActivity?.id) {
      updated = activities.map(a => a.id === editingActivity.id ? { ...a, ...activity } as WebflowActivityConfig : a);
    } else {
      const newItem: WebflowActivityConfig = {
        id: crypto.randomUUID(),
        activity_code: activity.activity_code || '',
        activity_name: activity.activity_name || '',
        category: activity.category || '',
        risk_level: activity.risk_level || 'standard',
        is_restricted: activity.is_restricted || false,
        restriction_reason: activity.restriction_reason || null,
        requires_approval: activity.requires_approval || false,
        allowed_jurisdictions: activity.allowed_jurisdictions || [],
        price_modifier: activity.price_modifier || 0,
        enhanced_due_diligence: activity.enhanced_due_diligence || false,
        edd_requirements: activity.edd_requirements || [],
        is_active: activity.is_active !== false
      };
      updated = [...activities, newItem];
    }
    
    await onUpdate(updated);
    setIsDialogOpen(false);
    setEditingActivity(null);
  };

  const handleDelete = async (id: string) => {
    await onUpdate(activities.filter(a => a.id !== id));
  };

  const filteredActivities = activities.filter(a => 
    a.activity_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.activity_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (a.category?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Business Activities</CardTitle>
          <CardDescription>Manage business activities and their risk classifications</CardDescription>
        </div>
        <Button onClick={() => { setEditingActivity(null); setIsDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Activity
        </Button>
      </CardHeader>
      <CardContent>
        {filteredActivities.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground">No activities configured</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Activity</TableHead>
                <TableHead>Risk & Rules</TableHead>
                <TableHead>Allowed Jurisdictions</TableHead>
                <TableHead>Price Modifier</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredActivities.map((activity) => (
                <TableRow key={activity.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{activity.activity_name}</p>
                      <p className="text-xs text-muted-foreground">{activity.category || '-'}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      <Badge className={RISK_COLORS[activity.risk_level] || RISK_COLORS.standard}>{activity.risk_level}</Badge>
                      {activity.is_restricted && <Badge variant="destructive" className="text-xs">Restricted</Badge>}
                      {activity.enhanced_due_diligence && <Badge variant="outline" className="text-amber-600 text-xs">EDD</Badge>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1 max-w-[150px]">
                      {(activity.allowed_jurisdictions || []).length === 0 ? (
                        <span className="text-xs text-muted-foreground">All</span>
                      ) : (
                        <>
                          {activity.allowed_jurisdictions.slice(0, 2).map((j, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">{j}</Badge>
                          ))}
                          {activity.allowed_jurisdictions.length > 2 && (
                            <Badge variant="secondary" className="text-xs">+{activity.allowed_jurisdictions.length - 2}</Badge>
                          )}
                        </>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {activity.price_modifier !== 0 && (
                      <span className={activity.price_modifier > 0 ? 'text-red-600' : 'text-green-600'}>
                        {activity.price_modifier > 0 ? '+' : ''}{activity.price_modifier}%
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {activity.is_active ? (
                      <Badge variant="outline" className="text-green-600 border-green-600">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => { setEditingActivity(activity); setIsDialogOpen(true); }}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(activity.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <ActivityDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen}
        activity={editingActivity}
        onSave={handleSave}
      />
    </Card>
  );
}

function ActivityDialog({ 
  open, onOpenChange, activity, onSave 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
  activity: WebflowActivityConfig | null;
  onSave: (activity: Partial<WebflowActivityConfig>) => void;
}) {
  const [formData, setFormData] = useState<Partial<WebflowActivityConfig>>({});
  const [jurisdictionsText, setJurisdictionsText] = useState('');
  const [eddReqText, setEddReqText] = useState('');

  useEffect(() => {
    if (activity) {
      setFormData(activity);
      setJurisdictionsText((activity.allowed_jurisdictions || []).join(', '));
      setEddReqText((activity.edd_requirements || []).join(', '));
    } else {
      setFormData({
        activity_code: '', activity_name: '', category: '', risk_level: 'standard',
        is_restricted: false, restriction_reason: '', requires_approval: false,
        allowed_jurisdictions: [], price_modifier: 0, enhanced_due_diligence: false,
        edd_requirements: [], is_active: true
      });
      setJurisdictionsText('');
      setEddReqText('');
    }
  }, [activity, open]);

  const handleSave = () => {
    onSave({
      ...formData,
      allowed_jurisdictions: jurisdictionsText.split(',').map(s => s.trim()).filter(Boolean),
      edd_requirements: eddReqText.split(',').map(s => s.trim()).filter(Boolean)
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{activity ? 'Edit Activity' : 'Add Activity'}</DialogTitle>
          <DialogDescription>Configure business activity settings</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Code</Label>
              <Input value={formData.activity_code || ''} onChange={(e) => setFormData({...formData, activity_code: e.target.value})} placeholder="GEN-TRAD" />
            </div>
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={formData.activity_name || ''} onChange={(e) => setFormData({...formData, activity_name: e.target.value})} placeholder="General Trading" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Input value={formData.category || ''} onChange={(e) => setFormData({...formData, category: e.target.value})} placeholder="Trading" />
            </div>
            <div className="space-y-2">
              <Label>Risk Level</Label>
              <Select value={formData.risk_level || 'standard'} onValueChange={(value) => setFormData({...formData, risk_level: value})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="prohibited">Prohibited</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Allowed Jurisdictions</Label>
            <Input value={jurisdictionsText} onChange={(e) => setJurisdictionsText(e.target.value)} placeholder="mainland, freezone (comma-separated, leave empty for all)" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Price Modifier (%)</Label>
              <Input type="number" value={formData.price_modifier || 0} onChange={(e) => setFormData({...formData, price_modifier: parseFloat(e.target.value) || 0})} />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Label>Restricted</Label>
            <Switch checked={formData.is_restricted || false} onCheckedChange={(checked) => setFormData({...formData, is_restricted: checked})} />
          </div>

          {formData.is_restricted && (
            <div className="space-y-2">
              <Label>Restriction Reason</Label>
              <Textarea value={formData.restriction_reason || ''} onChange={(e) => setFormData({...formData, restriction_reason: e.target.value})} placeholder="Reason..." />
            </div>
          )}

          <div className="flex items-center justify-between">
            <Label>Requires Enhanced Due Diligence</Label>
            <Switch checked={formData.enhanced_due_diligence || false} onCheckedChange={(checked) => setFormData({...formData, enhanced_due_diligence: checked})} />
          </div>

          {formData.enhanced_due_diligence && (
            <div className="space-y-2">
              <Label>EDD Requirements</Label>
              <Input value={eddReqText} onChange={(e) => setEddReqText(e.target.value)} placeholder="SOF declaration, Bank references (comma-separated)" />
            </div>
          )}

          <div className="flex items-center justify-between">
            <Label>Active</Label>
            <Switch checked={formData.is_active !== false} onCheckedChange={(checked) => setFormData({...formData, is_active: checked})} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Types for Services (Products) and Bundles
interface ProductService {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  service_category_id: string | null;
}

interface ServiceBundle {
  id: string;
  bundle_name: string;
  bundle_description: string | null;
  total_arr: number;
  is_active: boolean;
}

type WorkflowMode = 'web' | 'agent';

// Pricing Tab Component with Workflow Mode
function PricingTab({ 
  searchQuery,
  pricing,
  onUpdate
}: { 
  searchQuery: string;
  pricing: WebflowPricingConfig[];
  onUpdate: (pricing: WebflowPricingConfig[]) => Promise<boolean>;
}) {
  const [workflowMode, setWorkflowMode] = useState<WorkflowMode>('web');
  const [activeSubTab, setActiveSubTab] = useState<'plans' | 'services' | 'bundles'>('plans');
  const [editingPricing, setEditingPricing] = useState<WebflowPricingConfig | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Services (Products) state
  const [services, setServices] = useState<ProductService[]>([]);
  const [editingService, setEditingService] = useState<ProductService | null>(null);
  const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false);
  const [loadingServices, setLoadingServices] = useState(false);
  
  // Bundles state
  const [bundles, setBundles] = useState<ServiceBundle[]>([]);
  const [editingBundle, setEditingBundle] = useState<ServiceBundle | null>(null);
  const [isBundleDialogOpen, setIsBundleDialogOpen] = useState(false);
  const [loadingBundles, setLoadingBundles] = useState(false);

  // Fetch services and bundles when agent mode is active
  useEffect(() => {
    if (workflowMode === 'agent') {
      fetchServices();
      fetchBundles();
    }
  }, [workflowMode]);

  const fetchServices = async () => {
    setLoadingServices(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, description, is_active, service_category_id')
        .order('name');
      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error('Error fetching services:', error);
      toast({ title: 'Error', description: 'Failed to load services', variant: 'destructive' });
    } finally {
      setLoadingServices(false);
    }
  };

  const fetchBundles = async () => {
    setLoadingBundles(true);
    try {
      const { data, error } = await supabase
        .from('service_bundles')
        .select('*')
        .order('bundle_name');
      if (error) throw error;
      setBundles(data || []);
    } catch (error) {
      console.error('Error fetching bundles:', error);
      toast({ title: 'Error', description: 'Failed to load bundles', variant: 'destructive' });
    } finally {
      setLoadingBundles(false);
    }
  };

  // Plan handlers
  const handleSavePlan = async (item: Partial<WebflowPricingConfig>) => {
    let updated: WebflowPricingConfig[];
    
    if (editingPricing?.id) {
      updated = pricing.map(p => p.id === editingPricing.id ? { ...p, ...item } as WebflowPricingConfig : p);
    } else {
      const newItem: WebflowPricingConfig = {
        id: crypto.randomUUID(),
        plan_code: item.plan_code || '',
        plan_name: item.plan_name || '',
        description: item.description || null,
        base_price: item.base_price || 0,
        features: item.features || [],
        included_services: item.included_services || [],
        jurisdiction_pricing: item.jurisdiction_pricing || {},
        is_popular: item.is_popular || false,
        is_active: item.is_active !== false,
        sort_order: item.sort_order || 0
      };
      updated = [...pricing, newItem];
    }
    
    await onUpdate(updated);
    setIsDialogOpen(false);
    setEditingPricing(null);
  };

  const handleDeletePlan = async (id: string) => {
    await onUpdate(pricing.filter(p => p.id !== id));
  };

  // Service (Product) handlers
  const handleSaveService = async (service: Partial<ProductService>) => {
    try {
      if (editingService?.id) {
        const { error } = await supabase
          .from('products')
          .update({
            name: service.name,
            description: service.description,
            is_active: service.is_active
          })
          .eq('id', editingService.id);
        if (error) throw error;
        toast({ title: 'Success', description: 'Service updated' });
      } else {
        const { error } = await supabase
          .from('products')
          .insert({
            name: service.name || '',
            description: service.description || '',
            is_active: service.is_active !== false
          });
        if (error) throw error;
        toast({ title: 'Success', description: 'Service created' });
      }
      fetchServices();
      setIsServiceDialogOpen(false);
      setEditingService(null);
    } catch (error) {
      console.error('Error saving service:', error);
      toast({ title: 'Error', description: 'Failed to save service', variant: 'destructive' });
    }
  };

  const handleDeleteService = async (id: string) => {
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Success', description: 'Service deleted' });
      fetchServices();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete service', variant: 'destructive' });
    }
  };

  // Bundle handlers
  const handleSaveBundle = async (bundle: Partial<ServiceBundle>) => {
    try {
      if (editingBundle?.id) {
        const { error } = await supabase
          .from('service_bundles')
          .update({
            bundle_name: bundle.bundle_name,
            bundle_description: bundle.bundle_description,
            total_arr: bundle.total_arr,
            is_active: bundle.is_active
          })
          .eq('id', editingBundle.id);
        if (error) throw error;
        toast({ title: 'Success', description: 'Bundle updated' });
      } else {
        const { error } = await supabase
          .from('service_bundles')
          .insert({
            bundle_name: bundle.bundle_name || '',
            bundle_description: bundle.bundle_description || '',
            total_arr: bundle.total_arr || 0,
            is_active: bundle.is_active !== false
          });
        if (error) throw error;
        toast({ title: 'Success', description: 'Bundle created' });
      }
      fetchBundles();
      setIsBundleDialogOpen(false);
      setEditingBundle(null);
    } catch (error) {
      console.error('Error saving bundle:', error);
      toast({ title: 'Error', description: 'Failed to save bundle', variant: 'destructive' });
    }
  };

  const handleDeleteBundle = async (id: string) => {
    try {
      const { error } = await supabase.from('service_bundles').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Success', description: 'Bundle deleted' });
      fetchBundles();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete bundle', variant: 'destructive' });
    }
  };

  const filteredPricing = pricing.filter(p => 
    p.plan_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.plan_code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredServices = services.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredBundles = bundles.filter(b => 
    b.bundle_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Pricing & Services</CardTitle>
          <CardDescription>
            {workflowMode === 'web' 
              ? 'Manage pricing plans for customer webflow' 
              : 'Manage plans, individual services, and bundles for agent workflow'}
          </CardDescription>
        </div>
        <div className="flex items-center gap-3">
          {/* Workflow Mode Toggle */}
          <div className="flex items-center gap-2 border rounded-lg p-1 bg-muted/50">
            <Button
              variant={workflowMode === 'web' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => { setWorkflowMode('web'); setActiveSubTab('plans'); }}
              className="gap-2"
            >
              <Globe className="h-4 w-4" />
              Web Workflow
            </Button>
            <Button
              variant={workflowMode === 'agent' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setWorkflowMode('agent')}
              className="gap-2"
            >
              <Users className="h-4 w-4" />
              Agent Workflow
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Agent Workflow Sub-tabs */}
        {workflowMode === 'agent' && (
          <div className="flex items-center gap-2 border-b pb-3">
            <Button
              variant={activeSubTab === 'plans' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveSubTab('plans')}
              className="gap-2"
            >
              <CreditCard className="h-4 w-4" />
              Plans
              <Badge variant="secondary" className="ml-1">{pricing.length}</Badge>
            </Button>
            <Button
              variant={activeSubTab === 'services' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveSubTab('services')}
              className="gap-2"
            >
              <Layers className="h-4 w-4" />
              Services
              <Badge variant="secondary" className="ml-1">{services.length}</Badge>
            </Button>
            <Button
              variant={activeSubTab === 'bundles' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveSubTab('bundles')}
              className="gap-2"
            >
              <Package className="h-4 w-4" />
              Bundles
              <Badge variant="secondary" className="ml-1">{bundles.length}</Badge>
            </Button>
          </div>
        )}

        {/* Plans Table (shown in both modes) */}
        {(workflowMode === 'web' || activeSubTab === 'plans') && (
          <div className="space-y-3">
            <div className="flex justify-end">
              <Button onClick={() => { setEditingPricing(null); setIsDialogOpen(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                Add Plan
              </Button>
            </div>
            {filteredPricing.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">No pricing plans configured</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Plan</TableHead>
                    <TableHead>Base Price</TableHead>
                    <TableHead>Features</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPricing.map((plan) => (
                    <TableRow key={plan.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{plan.plan_name}</p>
                          {plan.is_popular && <Badge variant="default" className="text-xs">Popular</Badge>}
                        </div>
                      </TableCell>
                      <TableCell>AED {plan.base_price?.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{(plan.features || []).length} features</Badge>
                      </TableCell>
                      <TableCell>
                        {plan.is_active ? (
                          <Badge variant="outline" className="text-green-600 border-green-600">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => { setEditingPricing(plan); setIsDialogOpen(true); }}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeletePlan(plan.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        )}

        {/* Services Table (Agent mode only) */}
        {workflowMode === 'agent' && activeSubTab === 'services' && (
          <div className="space-y-3">
            <div className="flex justify-end">
              <Button onClick={() => { setEditingService(null); setIsServiceDialogOpen(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                Add Service
              </Button>
            </div>
            {loadingServices ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredServices.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">No services configured</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Service Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredServices.map((service) => (
                    <TableRow key={service.id}>
                      <TableCell className="font-medium">{service.name}</TableCell>
                      <TableCell className="text-muted-foreground max-w-xs truncate">
                        {service.description || '-'}
                      </TableCell>
                      <TableCell>
                        {service.is_active ? (
                          <Badge variant="outline" className="text-green-600 border-green-600">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => { setEditingService(service); setIsServiceDialogOpen(true); }}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteService(service.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        )}

        {/* Bundles Table (Agent mode only) */}
        {workflowMode === 'agent' && activeSubTab === 'bundles' && (
          <div className="space-y-3">
            <div className="flex justify-end">
              <Button onClick={() => { setEditingBundle(null); setIsBundleDialogOpen(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                Add Bundle
              </Button>
            </div>
            {loadingBundles ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredBundles.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">No bundles configured</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bundle Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Total ARR</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBundles.map((bundle) => (
                    <TableRow key={bundle.id}>
                      <TableCell className="font-medium">{bundle.bundle_name}</TableCell>
                      <TableCell className="text-muted-foreground max-w-xs truncate">
                        {bundle.bundle_description || '-'}
                      </TableCell>
                      <TableCell>AED {Number(bundle.total_arr).toLocaleString()}</TableCell>
                      <TableCell>
                        {bundle.is_active ? (
                          <Badge variant="outline" className="text-green-600 border-green-600">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => { setEditingBundle(bundle); setIsBundleDialogOpen(true); }}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteBundle(bundle.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        )}
      </CardContent>

      {/* Plan Dialog */}
      <PricingDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen}
        pricing={editingPricing}
        onSave={handleSavePlan}
      />

      {/* Service Dialog */}
      <ServiceDialog
        open={isServiceDialogOpen}
        onOpenChange={setIsServiceDialogOpen}
        service={editingService}
        onSave={handleSaveService}
      />

      {/* Bundle Dialog */}
      <BundleDialog
        open={isBundleDialogOpen}
        onOpenChange={setIsBundleDialogOpen}
        bundle={editingBundle}
        onSave={handleSaveBundle}
      />
    </Card>
  );
}

// Service Dialog Component
function ServiceDialog({
  open,
  onOpenChange,
  service,
  onSave
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: ProductService | null;
  onSave: (service: Partial<ProductService>) => void;
}) {
  const [formData, setFormData] = useState<Partial<ProductService>>({});

  useEffect(() => {
    if (service) {
      setFormData(service);
    } else {
      setFormData({
        name: '',
        description: '',
        is_active: true
      });
    }
  }, [service, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{service ? 'Edit Service' : 'Add Service'}</DialogTitle>
          <DialogDescription>Configure service/product details</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Service Name</Label>
            <Input 
              value={formData.name || ''} 
              onChange={(e) => setFormData({...formData, name: e.target.value})} 
              placeholder="Business Bank Account" 
            />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea 
              value={formData.description || ''} 
              onChange={(e) => setFormData({...formData, description: e.target.value})} 
              placeholder="Service description..." 
            />
          </div>
          <div className="flex items-center justify-between">
            <Label>Active</Label>
            <Switch 
              checked={formData.is_active !== false} 
              onCheckedChange={(checked) => setFormData({...formData, is_active: checked})} 
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => onSave(formData)}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Bundle Dialog Component
function BundleDialog({
  open,
  onOpenChange,
  bundle,
  onSave
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bundle: ServiceBundle | null;
  onSave: (bundle: Partial<ServiceBundle>) => void;
}) {
  const [formData, setFormData] = useState<Partial<ServiceBundle>>({});

  useEffect(() => {
    if (bundle) {
      setFormData(bundle);
    } else {
      setFormData({
        bundle_name: '',
        bundle_description: '',
        total_arr: 0,
        is_active: true
      });
    }
  }, [bundle, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{bundle ? 'Edit Bundle' : 'Add Bundle'}</DialogTitle>
          <DialogDescription>Configure service bundle details</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Bundle Name</Label>
            <Input 
              value={formData.bundle_name || ''} 
              onChange={(e) => setFormData({...formData, bundle_name: e.target.value})} 
              placeholder="Full Package" 
            />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea 
              value={formData.bundle_description || ''} 
              onChange={(e) => setFormData({...formData, bundle_description: e.target.value})} 
              placeholder="Complete accounting solution..." 
            />
          </div>
          <div className="space-y-2">
            <Label>Total ARR (AED)</Label>
            <Input 
              type="number" 
              value={formData.total_arr || 0} 
              onChange={(e) => setFormData({...formData, total_arr: parseFloat(e.target.value) || 0})} 
            />
          </div>
          <div className="flex items-center justify-between">
            <Label>Active</Label>
            <Switch 
              checked={formData.is_active !== false} 
              onCheckedChange={(checked) => setFormData({...formData, is_active: checked})} 
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => onSave(formData)}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PricingDialog({ 
  open, onOpenChange, pricing, onSave 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
  pricing: WebflowPricingConfig | null;
  onSave: (pricing: Partial<WebflowPricingConfig>) => void;
}) {
  const [formData, setFormData] = useState<Partial<WebflowPricingConfig>>({});
  const [featuresText, setFeaturesText] = useState('');

  useEffect(() => {
    if (pricing) {
      setFormData(pricing);
      setFeaturesText((pricing.features || []).join('\n'));
    } else {
      setFormData({
        plan_code: '', plan_name: '', description: '', base_price: 0,
        features: [], included_services: [], jurisdiction_pricing: {},
        is_popular: false, is_active: true, sort_order: 0
      });
      setFeaturesText('');
    }
  }, [pricing, open]);

  const handleSave = () => {
    onSave({
      ...formData,
      features: featuresText.split('\n').map(s => s.trim()).filter(Boolean)
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{pricing ? 'Edit Plan' : 'Add Plan'}</DialogTitle>
          <DialogDescription>Configure pricing plan details</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Code</Label>
              <Input value={formData.plan_code || ''} onChange={(e) => setFormData({...formData, plan_code: e.target.value})} placeholder="BASIC" />
            </div>
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={formData.plan_name || ''} onChange={(e) => setFormData({...formData, plan_name: e.target.value})} placeholder="Basic Plan" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={formData.description || ''} onChange={(e) => setFormData({...formData, description: e.target.value})} placeholder="Plan description..." />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Base Price (AED)</Label>
              <Input type="number" value={formData.base_price || 0} onChange={(e) => setFormData({...formData, base_price: parseFloat(e.target.value) || 0})} />
            </div>
            <div className="space-y-2">
              <Label>Sort Order</Label>
              <Input type="number" value={formData.sort_order || 0} onChange={(e) => setFormData({...formData, sort_order: parseInt(e.target.value) || 0})} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Features (one per line)</Label>
            <Textarea value={featuresText} onChange={(e) => setFeaturesText(e.target.value)} placeholder="Trade license&#10;Visa quota: 3&#10;Office space included" rows={4} />
          </div>

          <div className="flex items-center justify-between">
            <Label>Popular</Label>
            <Switch checked={formData.is_popular || false} onCheckedChange={(checked) => setFormData({...formData, is_popular: checked})} />
          </div>

          <div className="flex items-center justify-between">
            <Label>Active</Label>
            <Switch checked={formData.is_active !== false} onCheckedChange={(checked) => setFormData({...formData, is_active: checked})} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Documents Tab Component
function DocumentsTab({ 
  searchQuery,
  documents,
  onUpdate
}: { 
  searchQuery: string;
  documents: WebflowDocumentConfig[];
  onUpdate: (documents: WebflowDocumentConfig[]) => Promise<boolean>;
}) {
  const [editingDocument, setEditingDocument] = useState<WebflowDocumentConfig | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleSave = async (doc: Partial<WebflowDocumentConfig>) => {
    let updated: WebflowDocumentConfig[];
    
    if (editingDocument?.id) {
      updated = documents.map(d => d.id === editingDocument.id ? { ...d, ...doc } as WebflowDocumentConfig : d);
    } else {
      const newItem: WebflowDocumentConfig = {
        id: crypto.randomUUID(),
        document_code: doc.document_code || '',
        document_name: doc.document_name || '',
        description: doc.description || null,
        is_mandatory: doc.is_mandatory || false,
        applies_to_nationalities: doc.applies_to_nationalities || [],
        applies_to_jurisdictions: doc.applies_to_jurisdictions || [],
        applies_to_activities: doc.applies_to_activities || [],
        accepted_formats: doc.accepted_formats || ['pdf', 'jpg', 'png'],
        max_file_size_mb: doc.max_file_size_mb || 10,
        is_active: doc.is_active !== false,
        sort_order: doc.sort_order || 0
      };
      updated = [...documents, newItem];
    }
    
    await onUpdate(updated);
    setIsDialogOpen(false);
    setEditingDocument(null);
  };

  const handleDelete = async (id: string) => {
    await onUpdate(documents.filter(d => d.id !== id));
  };

  const filteredDocuments = documents.filter(d => 
    d.document_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.document_code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Required Documents</CardTitle>
          <CardDescription>Manage document requirements and upload rules</CardDescription>
        </div>
        <Button onClick={() => { setEditingDocument(null); setIsDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Document
        </Button>
      </CardHeader>
      <CardContent>
        {filteredDocuments.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground">No documents configured</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document</TableHead>
                <TableHead>Applies To (Rules)</TableHead>
                <TableHead>Formats</TableHead>
                <TableHead>Required</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDocuments.map((doc) => {
                const hasRules = (doc.applies_to_nationalities?.length || 0) > 0 || 
                                (doc.applies_to_jurisdictions?.length || 0) > 0 || 
                                (doc.applies_to_activities?.length || 0) > 0;
                return (
                  <TableRow key={doc.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{doc.document_name}</p>
                        <p className="text-xs text-muted-foreground">{doc.document_code}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {hasRules ? (
                        <div className="flex flex-wrap gap-1">
                          {(doc.applies_to_nationalities?.length || 0) > 0 && (
                            <Badge variant="outline" className="text-xs">{doc.applies_to_nationalities.length} nationalities</Badge>
                          )}
                          {(doc.applies_to_jurisdictions?.length || 0) > 0 && (
                            <Badge variant="outline" className="text-xs">{doc.applies_to_jurisdictions.length} jurisdictions</Badge>
                          )}
                          {(doc.applies_to_activities?.length || 0) > 0 && (
                            <Badge variant="outline" className="text-xs">{doc.applies_to_activities.length} activities</Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">All Applications</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-xs">{(doc.accepted_formats || []).join(', ')}</span>
                    </TableCell>
                    <TableCell>
                      {doc.is_mandatory ? (
                        <Badge variant="destructive" className="text-xs">Required</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">Optional</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {doc.is_active ? (
                        <Badge variant="outline" className="text-green-600 border-green-600">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => { setEditingDocument(doc); setIsDialogOpen(true); }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(doc.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <DocumentDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen}
        document={editingDocument}
        onSave={handleSave}
      />
    </Card>
  );
}

function DocumentDialog({ 
  open, onOpenChange, document, onSave 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
  document: WebflowDocumentConfig | null;
  onSave: (document: Partial<WebflowDocumentConfig>) => void;
}) {
  const [formData, setFormData] = useState<Partial<WebflowDocumentConfig>>({});
  const [nationalitiesText, setNationalitiesText] = useState('');
  const [jurisdictionsText, setJurisdictionsText] = useState('');
  const [activitiesText, setActivitiesText] = useState('');
  const [formatsText, setFormatsText] = useState('');

  useEffect(() => {
    if (document) {
      setFormData(document);
      setNationalitiesText((document.applies_to_nationalities || []).join(', '));
      setJurisdictionsText((document.applies_to_jurisdictions || []).join(', '));
      setActivitiesText((document.applies_to_activities || []).join(', '));
      setFormatsText((document.accepted_formats || []).join(', '));
    } else {
      setFormData({
        document_code: '', document_name: '', description: '', is_mandatory: false,
        applies_to_nationalities: [], applies_to_jurisdictions: [], applies_to_activities: [],
        accepted_formats: ['pdf', 'jpg', 'png'], max_file_size_mb: 10, is_active: true, sort_order: 0
      });
      setNationalitiesText('');
      setJurisdictionsText('');
      setActivitiesText('');
      setFormatsText('pdf, jpg, png');
    }
  }, [document, open]);

  const handleSave = () => {
    onSave({
      ...formData,
      applies_to_nationalities: nationalitiesText.split(',').map(s => s.trim()).filter(Boolean),
      applies_to_jurisdictions: jurisdictionsText.split(',').map(s => s.trim()).filter(Boolean),
      applies_to_activities: activitiesText.split(',').map(s => s.trim()).filter(Boolean),
      accepted_formats: formatsText.split(',').map(s => s.trim()).filter(Boolean)
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{document ? 'Edit Document' : 'Add Document'}</DialogTitle>
          <DialogDescription>Configure document requirements</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Code</Label>
              <Input value={formData.document_code || ''} onChange={(e) => setFormData({...formData, document_code: e.target.value})} placeholder="PASSPORT" />
            </div>
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={formData.document_name || ''} onChange={(e) => setFormData({...formData, document_name: e.target.value})} placeholder="Passport Copy" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={formData.description || ''} onChange={(e) => setFormData({...formData, description: e.target.value})} placeholder="Document description..." />
          </div>

          <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
            <Label className="font-semibold">Applies To (Rules)</Label>
            <div className="space-y-2">
              <Label className="text-xs">Nationalities (leave empty for all)</Label>
              <Input value={nationalitiesText} onChange={(e) => setNationalitiesText(e.target.value)} placeholder="IN, PK, BD (comma-separated)" className="text-sm" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Jurisdictions (leave empty for all)</Label>
              <Input value={jurisdictionsText} onChange={(e) => setJurisdictionsText(e.target.value)} placeholder="mainland, freezone (comma-separated)" className="text-sm" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Activities (leave empty for all)</Label>
              <Input value={activitiesText} onChange={(e) => setActivitiesText(e.target.value)} placeholder="MONEY-EX, CRYPTO (comma-separated)" className="text-sm" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Accepted Formats</Label>
              <Input value={formatsText} onChange={(e) => setFormatsText(e.target.value)} placeholder="pdf, jpg, png" />
            </div>
            <div className="space-y-2">
              <Label>Max File Size (MB)</Label>
              <Input type="number" value={formData.max_file_size_mb || 10} onChange={(e) => setFormData({...formData, max_file_size_mb: parseInt(e.target.value) || 10})} />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Label>Mandatory</Label>
            <Switch checked={formData.is_mandatory || false} onCheckedChange={(checked) => setFormData({...formData, is_mandatory: checked})} />
          </div>

          <div className="flex items-center justify-between">
            <Label>Active</Label>
            <Switch checked={formData.is_active !== false} onCheckedChange={(checked) => setFormData({...formData, is_active: checked})} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Globe, 
  Building2, 
  Briefcase, 
  CreditCard, 
  FileText, 
  Plus, 
  Pencil, 
  Trash2, 
  Settings,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  Workflow
} from 'lucide-react';
import RulesTab from '@/components/Webflow/RulesTab';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

// Types - using any for flexibility with Supabase JSONB/enum returns
interface WebflowCountry {
  id: string;
  country_code: string;
  country_name: string;
  is_blocked: boolean;
  block_reason: string | null;
  risk_level: string;
  requires_enhanced_due_diligence: boolean;
  is_active: boolean;
}

interface WebflowJurisdiction {
  id: string;
  jurisdiction_code: string;
  jurisdiction_name: string;
  jurisdiction_type: string;
  emirate: string | null;
  legal_forms: any[];
  base_price: number;
  processing_days: number;
  is_active: boolean;
  notes: string | null;
}

interface WebflowActivity {
  id: string;
  activity_code: string;
  activity_name: string;
  category: string | null;
  risk_level: string;
  is_restricted: boolean;
  restriction_reason: string | null;
  requires_approval: boolean;
  allowed_jurisdictions: any[];
  additional_requirements: any[];
  price_modifier: number;
  is_active: boolean;
}

interface WebflowPricing {
  id: string;
  plan_code: string;
  plan_name: string;
  description: string | null;
  base_price: number;
  features: any[];
  included_services: any[];
  jurisdiction_pricing: any;
  is_popular: boolean;
  is_active: boolean;
  sort_order: number;
}

interface WebflowDocument {
  id: string;
  document_code: string;
  document_name: string;
  description: string | null;
  is_mandatory: boolean;
  applies_to_nationalities: any[];
  applies_to_jurisdictions: any[];
  applies_to_activities: any[];
  accepted_formats: any[];
  max_file_size_mb: number;
  is_active: boolean;
  sort_order: number;
}

const RISK_COLORS: Record<string, string> = {
  low: 'bg-green-100 text-green-800',
  standard: 'bg-blue-100 text-blue-800',
  high: 'bg-amber-100 text-amber-800',
  prohibited: 'bg-red-100 text-red-800'
};

export default function WebflowConfig() {
  const [activeTab, setActiveTab] = useState('countries');
  const [searchQuery, setSearchQuery] = useState('');

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
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
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
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Documents
          </TabsTrigger>
          <TabsTrigger value="rules" className="flex items-center gap-2">
            <Workflow className="h-4 w-4" />
            Rules
          </TabsTrigger>
        </TabsList>

        <TabsContent value="countries">
          <CountriesTab searchQuery={searchQuery} />
        </TabsContent>
        
        <TabsContent value="jurisdictions">
          <JurisdictionsTab searchQuery={searchQuery} />
        </TabsContent>
        
        <TabsContent value="activities">
          <ActivitiesTab searchQuery={searchQuery} />
        </TabsContent>
        
        <TabsContent value="pricing">
          <PricingTab searchQuery={searchQuery} />
        </TabsContent>
        
        <TabsContent value="documents">
          <DocumentsTab searchQuery={searchQuery} />
        </TabsContent>

        <TabsContent value="rules">
          <RulesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Countries Tab Component
function CountriesTab({ searchQuery }: { searchQuery: string }) {
  const [countries, setCountries] = useState<WebflowCountry[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCountry, setEditingCountry] = useState<WebflowCountry | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    fetchCountries();
  }, []);

  const fetchCountries = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('webflow_countries')
      .select('*')
      .order('country_name');
    
    if (error) {
      toast({ title: 'Error', description: 'Failed to fetch countries', variant: 'destructive' });
    } else {
      setCountries(data || []);
    }
    setLoading(false);
  };

  const handleSave = async (country: Partial<WebflowCountry>) => {
    if (editingCountry?.id) {
      const { error } = await supabase
        .from('webflow_countries')
        .update(country)
        .eq('id', editingCountry.id);
      
      if (error) {
        toast({ title: 'Error', description: 'Failed to update country', variant: 'destructive' });
      } else {
        toast({ title: 'Success', description: 'Country updated' });
        fetchCountries();
      }
    } else {
      const { error } = await supabase
        .from('webflow_countries')
        .insert(country as any);
      
      if (error) {
        toast({ title: 'Error', description: 'Failed to create country', variant: 'destructive' });
      } else {
        toast({ title: 'Success', description: 'Country created' });
        fetchCountries();
      }
    }
    setIsDialogOpen(false);
    setEditingCountry(null);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('webflow_countries')
      .delete()
      .eq('id', id);
    
    if (error) {
      toast({ title: 'Error', description: 'Failed to delete country', variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Country deleted' });
      fetchCountries();
    }
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
        {loading ? (
          <p className="text-center py-8 text-muted-foreground">Loading...</p>
        ) : filteredCountries.length === 0 ? (
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
                    <Badge className={RISK_COLORS[country.risk_level]}>
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
  open, 
  onOpenChange, 
  country, 
  onSave 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
  country: WebflowCountry | null;
  onSave: (country: Partial<WebflowCountry>) => void;
}) {
  const [formData, setFormData] = useState<Partial<WebflowCountry>>({
    country_code: '',
    country_name: '',
    is_blocked: false,
    block_reason: '',
    risk_level: 'standard',
    requires_enhanced_due_diligence: false,
    is_active: true
  });

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
          <DialogDescription>
            Configure country eligibility rules
          </DialogDescription>
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
              onValueChange={(value) => setFormData({...formData, risk_level: value as WebflowCountry['risk_level']})}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
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
function JurisdictionsTab({ searchQuery }: { searchQuery: string }) {
  const [jurisdictions, setJurisdictions] = useState<WebflowJurisdiction[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingJurisdiction, setEditingJurisdiction] = useState<WebflowJurisdiction | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    fetchJurisdictions();
  }, []);

  const fetchJurisdictions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('webflow_jurisdictions')
      .select('*')
      .order('jurisdiction_name');
    
    if (error) {
      toast({ title: 'Error', description: 'Failed to fetch jurisdictions', variant: 'destructive' });
    } else {
      setJurisdictions((data || []).map(j => ({
        ...j,
        legal_forms: Array.isArray(j.legal_forms) ? j.legal_forms : []
      })));
    }
    setLoading(false);
  };

  const handleSave = async (jurisdiction: Partial<WebflowJurisdiction>) => {
    if (editingJurisdiction?.id) {
      const { error } = await supabase
        .from('webflow_jurisdictions')
        .update(jurisdiction)
        .eq('id', editingJurisdiction.id);
      
      if (error) {
        toast({ title: 'Error', description: 'Failed to update jurisdiction', variant: 'destructive' });
      } else {
        toast({ title: 'Success', description: 'Jurisdiction updated' });
        fetchJurisdictions();
      }
    } else {
      const { error } = await supabase
        .from('webflow_jurisdictions')
        .insert(jurisdiction as any);
      
      if (error) {
        toast({ title: 'Error', description: 'Failed to create jurisdiction', variant: 'destructive' });
      } else {
        toast({ title: 'Success', description: 'Jurisdiction created' });
        fetchJurisdictions();
      }
    }
    setIsDialogOpen(false);
    setEditingJurisdiction(null);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('webflow_jurisdictions')
      .delete()
      .eq('id', id);
    
    if (error) {
      toast({ title: 'Error', description: 'Failed to delete jurisdiction', variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Jurisdiction deleted' });
      fetchJurisdictions();
    }
  };

  const filteredJurisdictions = jurisdictions.filter(j => 
    j.jurisdiction_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    j.jurisdiction_code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const TYPE_COLORS = {
    mainland: 'bg-blue-100 text-blue-800',
    freezone: 'bg-purple-100 text-purple-800',
    offshore: 'bg-slate-100 text-slate-800'
  };

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
        {loading ? (
          <p className="text-center py-8 text-muted-foreground">Loading...</p>
        ) : filteredJurisdictions.length === 0 ? (
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
                      <Badge className={TYPE_COLORS[jurisdiction.jurisdiction_type as keyof typeof TYPE_COLORS]}>
                        {jurisdiction.jurisdiction_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {legalForms.length === 0 ? (
                          <span className="text-xs text-muted-foreground">All forms</span>
                        ) : (
                          <>
                            {legalForms.slice(0, 2).map((form: string, idx: number) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {form}
                              </Badge>
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
  open, 
  onOpenChange, 
  jurisdiction, 
  onSave 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
  jurisdiction: WebflowJurisdiction | null;
  onSave: (jurisdiction: Partial<WebflowJurisdiction>) => void;
}) {
  const [formData, setFormData] = useState<Partial<WebflowJurisdiction>>({
    jurisdiction_code: '',
    jurisdiction_name: '',
    jurisdiction_type: 'freezone',
    emirate: '',
    legal_forms: [],
    base_price: 0,
    processing_days: 14,
    is_active: true,
    notes: ''
  });
  
  const [legalFormsText, setLegalFormsText] = useState('');

  useEffect(() => {
    if (jurisdiction) {
      setFormData(jurisdiction);
      setLegalFormsText((jurisdiction.legal_forms || []).join(', '));
    } else {
      setFormData({
        jurisdiction_code: '',
        jurisdiction_name: '',
        jurisdiction_type: 'freezone',
        emirate: '',
        legal_forms: [],
        base_price: 0,
        processing_days: 14,
        is_active: true,
        notes: ''
      });
      setLegalFormsText('');
    }
  }, [jurisdiction, open]);

  const handleSave = () => {
    const legalForms = legalFormsText.split(',').map(s => s.trim()).filter(Boolean);
    onSave({
      ...formData,
      legal_forms: legalForms
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{jurisdiction ? 'Edit Jurisdiction' : 'Add Jurisdiction'}</DialogTitle>
          <DialogDescription>
            Configure jurisdiction settings and available legal forms
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Code</Label>
              <Input 
                value={formData.jurisdiction_code || ''} 
                onChange={(e) => setFormData({...formData, jurisdiction_code: e.target.value})}
                placeholder="DMCC"
              />
            </div>
            <div className="space-y-2">
              <Label>Name</Label>
              <Input 
                value={formData.jurisdiction_name || ''} 
                onChange={(e) => setFormData({...formData, jurisdiction_name: e.target.value})}
                placeholder="Dubai Multi Commodities Centre"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select 
                value={formData.jurisdiction_type || 'freezone'} 
                onValueChange={(value) => setFormData({...formData, jurisdiction_type: value as WebflowJurisdiction['jurisdiction_type']})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mainland">Mainland</SelectItem>
                  <SelectItem value="freezone">Free Zone</SelectItem>
                  <SelectItem value="offshore">Offshore</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Emirate</Label>
              <Select 
                value={formData.emirate || ''} 
                onValueChange={(value) => setFormData({...formData, emirate: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select emirate" />
                </SelectTrigger>
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
              <Input 
                type="number"
                value={formData.base_price || 0} 
                onChange={(e) => setFormData({...formData, base_price: parseFloat(e.target.value) || 0})}
              />
            </div>
            <div className="space-y-2">
              <Label>Processing Days</Label>
              <Input 
                type="number"
                value={formData.processing_days || 14} 
                onChange={(e) => setFormData({...formData, processing_days: parseInt(e.target.value) || 14})}
              />
            </div>
          </div>

          {/* Legal Forms Section */}
          <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Label className="font-semibold">Available Legal Forms</Label>
            </div>
            <Input 
              value={legalFormsText} 
              onChange={(e) => setLegalFormsText(e.target.value)}
              placeholder="LLC, FZC, FZE, Branch (comma-separated)"
              className="text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Legal entity types available in this jurisdiction. Leave empty for all forms.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea 
              value={formData.notes || ''} 
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              placeholder="Additional notes..."
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
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Activities Tab Component
function ActivitiesTab({ searchQuery }: { searchQuery: string }) {
  const [activities, setActivities] = useState<WebflowActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingActivity, setEditingActivity] = useState<WebflowActivity | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('webflow_activities')
      .select('*')
      .order('activity_name');
    
    if (error) {
      toast({ title: 'Error', description: 'Failed to fetch activities', variant: 'destructive' });
    } else {
      setActivities((data || []).map(a => ({
        ...a,
        allowed_jurisdictions: Array.isArray(a.allowed_jurisdictions) ? a.allowed_jurisdictions : [],
        additional_requirements: Array.isArray(a.additional_requirements) ? a.additional_requirements : []
      })));
    }
    setLoading(false);
  };

  const handleSave = async (activity: Partial<WebflowActivity>) => {
    if (editingActivity?.id) {
      const { error } = await supabase
        .from('webflow_activities')
        .update(activity)
        .eq('id', editingActivity.id);
      
      if (error) {
        toast({ title: 'Error', description: 'Failed to update activity', variant: 'destructive' });
      } else {
        toast({ title: 'Success', description: 'Activity updated' });
        fetchActivities();
      }
    } else {
      const { error } = await supabase
        .from('webflow_activities')
        .insert(activity as any);
      
      if (error) {
        toast({ title: 'Error', description: 'Failed to create activity', variant: 'destructive' });
      } else {
        toast({ title: 'Success', description: 'Activity created' });
        fetchActivities();
      }
    }
    setIsDialogOpen(false);
    setEditingActivity(null);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('webflow_activities')
      .delete()
      .eq('id', id);
    
    if (error) {
      toast({ title: 'Error', description: 'Failed to delete activity', variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Activity deleted' });
      fetchActivities();
    }
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
        {loading ? (
          <p className="text-center py-8 text-muted-foreground">Loading...</p>
        ) : filteredActivities.length === 0 ? (
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
              {filteredActivities.map((activity) => {
                const allowedJurisdictions = activity.allowed_jurisdictions || [];
                const hasEDD = (activity as any).enhanced_due_diligence === true;
                
                return (
                  <TableRow key={activity.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{activity.activity_name}</p>
                        <p className="text-xs text-muted-foreground">{activity.category || '-'}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Badge className={RISK_COLORS[activity.risk_level]}>
                          {activity.risk_level}
                        </Badge>
                        {activity.is_restricted && (
                          <Badge variant="outline" className="text-amber-600 border-amber-600 ml-1">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Restricted
                          </Badge>
                        )}
                        {hasEDD && (
                          <Badge variant="outline" className="text-red-600 border-red-600 ml-1">
                            EDD
                          </Badge>
                        )}
                        {activity.requires_approval && (
                          <Badge variant="outline" className="text-blue-600 border-blue-600 ml-1">
                            Approval
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-[180px]">
                        {allowedJurisdictions.length === 0 ? (
                          <Badge variant="secondary" className="text-xs">
                            <Globe className="h-3 w-3 mr-1" />
                            All
                          </Badge>
                        ) : (
                          <>
                            {allowedJurisdictions.slice(0, 2).map((jur: string, idx: number) => (
                              <Badge key={idx} variant="outline" className="text-xs bg-blue-50 border-blue-300">
                                {jur}
                              </Badge>
                            ))}
                            {allowedJurisdictions.length > 2 && (
                              <Badge variant="secondary" className="text-xs">+{allowedJurisdictions.length - 2}</Badge>
                            )}
                          </>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {activity.price_modifier > 0 ? (
                        <Badge variant="outline" className="text-amber-600">+{activity.price_modifier}%</Badge>
                      ) : activity.price_modifier < 0 ? (
                        <Badge variant="outline" className="text-green-600">{activity.price_modifier}%</Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
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
                );
              })}
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
  open, 
  onOpenChange, 
  activity, 
  onSave 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
  activity: WebflowActivity | null;
  onSave: (activity: Partial<WebflowActivity>) => void;
}) {
  const [formData, setFormData] = useState<Partial<WebflowActivity>>({
    activity_code: '',
    activity_name: '',
    category: '',
    risk_level: 'standard',
    is_restricted: false,
    restriction_reason: '',
    requires_approval: false,
    price_modifier: 0,
    is_active: true,
    allowed_jurisdictions: []
  });
  
  const [allowedJurisdictionsText, setAllowedJurisdictionsText] = useState('');
  const [eddRequirementsText, setEddRequirementsText] = useState('');
  const [enhancedDD, setEnhancedDD] = useState(false);

  useEffect(() => {
    if (activity) {
      setFormData(activity);
      setAllowedJurisdictionsText((activity.allowed_jurisdictions || []).join(', '));
      setEnhancedDD((activity as any).enhanced_due_diligence || false);
      setEddRequirementsText(((activity as any).edd_requirements || []).join(', '));
    } else {
      setFormData({
        activity_code: '',
        activity_name: '',
        category: '',
        risk_level: 'standard',
        is_restricted: false,
        restriction_reason: '',
        requires_approval: false,
        price_modifier: 0,
        is_active: true,
        allowed_jurisdictions: []
      });
      setAllowedJurisdictionsText('');
      setEnhancedDD(false);
      setEddRequirementsText('');
    }
  }, [activity, open]);

  const handleSave = () => {
    const allowedJurisdictions = allowedJurisdictionsText.split(',').map(s => s.trim()).filter(Boolean);
    const eddRequirements = eddRequirementsText.split(',').map(s => s.trim()).filter(Boolean);
    
    onSave({
      ...formData,
      allowed_jurisdictions: allowedJurisdictions,
      enhanced_due_diligence: enhancedDD,
      edd_requirements: eddRequirements
    } as any);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{activity ? 'Edit Activity' : 'Add Activity'}</DialogTitle>
          <DialogDescription>
            Configure business activity settings and jurisdiction rules
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Code</Label>
              <Input 
                value={formData.activity_code || ''} 
                onChange={(e) => setFormData({...formData, activity_code: e.target.value})}
                placeholder="CONSULTING"
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Input 
                value={formData.category || ''} 
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                placeholder="Professional Services"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Activity Name</Label>
            <Input 
              value={formData.activity_name || ''} 
              onChange={(e) => setFormData({...formData, activity_name: e.target.value})}
              placeholder="Management Consultancy"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Risk Level</Label>
              <Select 
                value={formData.risk_level || 'standard'} 
                onValueChange={(value) => setFormData({...formData, risk_level: value as WebflowActivity['risk_level']})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low Risk</SelectItem>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="high">High Risk</SelectItem>
                  <SelectItem value="prohibited">Prohibited</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Price Modifier (%)</Label>
              <Input 
                type="number"
                value={formData.price_modifier || 0} 
                onChange={(e) => setFormData({...formData, price_modifier: parseFloat(e.target.value) || 0})}
              />
            </div>
          </div>

          {/* Jurisdiction Rules Section */}
          <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <Label className="font-semibold">Jurisdiction Rules</Label>
            </div>
            <Input 
              value={allowedJurisdictionsText} 
              onChange={(e) => setAllowedJurisdictionsText(e.target.value)}
              placeholder="DMCC, DIFC, ADGM (comma-separated codes)"
              className="text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Jurisdictions where this activity is allowed. Leave empty for all jurisdictions.
            </p>
          </div>

          {/* EDD Section */}
          <div className="border rounded-lg p-4 space-y-3 bg-amber-50/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <Label className="font-semibold">Enhanced Due Diligence</Label>
              </div>
              <Switch 
                checked={enhancedDD} 
                onCheckedChange={setEnhancedDD}
              />
            </div>
            {enhancedDD && (
              <>
                <Input 
                  value={eddRequirementsText} 
                  onChange={(e) => setEddRequirementsText(e.target.value)}
                  placeholder="Source of Funds, Bank Reference (comma-separated)"
                  className="text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Additional compliance requirements for this high-risk activity
                </p>
              </>
            )}
          </div>

          <div className="flex items-center justify-between">
            <Label>Restricted Activity</Label>
            <Switch 
              checked={formData.is_restricted || false} 
              onCheckedChange={(checked) => setFormData({...formData, is_restricted: checked})}
            />
          </div>

          {formData.is_restricted && (
            <div className="space-y-2">
              <Label>Restriction Reason</Label>
              <Textarea 
                value={formData.restriction_reason || ''} 
                onChange={(e) => setFormData({...formData, restriction_reason: e.target.value})}
                placeholder="Reason for restriction..."
              />
            </div>
          )}

          <div className="flex items-center justify-between">
            <Label>Requires Approval</Label>
            <Switch 
              checked={formData.requires_approval || false} 
              onCheckedChange={(checked) => setFormData({...formData, requires_approval: checked})}
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
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Pricing Tab Component
function PricingTab({ searchQuery }: { searchQuery: string }) {
  const [pricing, setPricing] = useState<WebflowPricing[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState<WebflowPricing | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    fetchPricing();
  }, []);

  const fetchPricing = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('webflow_pricing')
      .select('*')
      .order('sort_order');
    
    if (error) {
      toast({ title: 'Error', description: 'Failed to fetch pricing', variant: 'destructive' });
    } else {
      setPricing((data || []).map(p => ({
        ...p,
        features: Array.isArray(p.features) ? p.features : [],
        included_services: Array.isArray(p.included_services) ? p.included_services : [],
        jurisdiction_pricing: typeof p.jurisdiction_pricing === 'object' ? p.jurisdiction_pricing : {}
      })));
    }
    setLoading(false);
  };

  const handleSave = async (plan: Partial<WebflowPricing>) => {
    if (editingPlan?.id) {
      const { error } = await supabase
        .from('webflow_pricing')
        .update(plan)
        .eq('id', editingPlan.id);
      
      if (error) {
        toast({ title: 'Error', description: 'Failed to update plan', variant: 'destructive' });
      } else {
        toast({ title: 'Success', description: 'Plan updated' });
        fetchPricing();
      }
    } else {
      const { error } = await supabase
        .from('webflow_pricing')
        .insert(plan as any);
      
      if (error) {
        toast({ title: 'Error', description: 'Failed to create plan', variant: 'destructive' });
      } else {
        toast({ title: 'Success', description: 'Plan created' });
        fetchPricing();
      }
    }
    setIsDialogOpen(false);
    setEditingPlan(null);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('webflow_pricing')
      .delete()
      .eq('id', id);
    
    if (error) {
      toast({ title: 'Error', description: 'Failed to delete plan', variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Plan deleted' });
      fetchPricing();
    }
  };

  const filteredPricing = pricing.filter(p => 
    p.plan_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.plan_code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Pricing & Plans</CardTitle>
          <CardDescription>Manage pricing plans and included services</CardDescription>
        </div>
        <Button onClick={() => { setEditingPlan(null); setIsDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Plan
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-center py-8 text-muted-foreground">Loading...</p>
        ) : filteredPricing.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground">No pricing plans configured</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPricing.map((plan) => (
              <Card key={plan.id} className={`relative ${plan.is_popular ? 'border-primary border-2' : ''}`}>
                {plan.is_popular && (
                  <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-primary">
                    Popular
                  </Badge>
                )}
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {plan.plan_name}
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => { setEditingPlan(plan); setIsDialogOpen(true); }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(plan.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-4">
                    AED {plan.base_price.toLocaleString()}
                  </div>
                  <div className="space-y-2">
                    {(plan.features as string[]).slice(0, 4).map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        {feature}
                      </div>
                    ))}
                    {(plan.features as string[]).length > 4 && (
                      <p className="text-sm text-muted-foreground">
                        +{(plan.features as string[]).length - 4} more features
                      </p>
                    )}
                  </div>
                  <div className="mt-4">
                    {plan.is_active ? (
                      <Badge variant="outline" className="text-green-600 border-green-600">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>

      <PricingDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen}
        plan={editingPlan}
        onSave={handleSave}
      />
    </Card>
  );
}

function PricingDialog({ 
  open, 
  onOpenChange, 
  plan, 
  onSave 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
  plan: WebflowPricing | null;
  onSave: (plan: Partial<WebflowPricing>) => void;
}) {
  const [formData, setFormData] = useState<Partial<WebflowPricing>>({
    plan_code: '',
    plan_name: '',
    description: '',
    base_price: 0,
    features: [],
    is_popular: false,
    is_active: true,
    sort_order: 0
  });
  const [featuresText, setFeaturesText] = useState('');

  useEffect(() => {
    if (plan) {
      setFormData(plan);
      setFeaturesText(Array.isArray(plan.features) ? (plan.features as string[]).join('\n') : '');
    } else {
      setFormData({
        plan_code: '',
        plan_name: '',
        description: '',
        base_price: 0,
        features: [],
        is_popular: false,
        is_active: true,
        sort_order: 0
      });
      setFeaturesText('');
    }
  }, [plan, open]);

  const handleSave = () => {
    const features = featuresText.split('\n').filter(f => f.trim());
    onSave({ ...formData, features });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{plan ? 'Edit Plan' : 'Add Plan'}</DialogTitle>
          <DialogDescription>
            Configure pricing plan settings
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Code</Label>
              <Input 
                value={formData.plan_code || ''} 
                onChange={(e) => setFormData({...formData, plan_code: e.target.value})}
                placeholder="STARTER"
              />
            </div>
            <div className="space-y-2">
              <Label>Name</Label>
              <Input 
                value={formData.plan_name || ''} 
                onChange={(e) => setFormData({...formData, plan_name: e.target.value})}
                placeholder="Starter Plan"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea 
              value={formData.description || ''} 
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Plan description..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Base Price (AED)</Label>
              <Input 
                type="number"
                value={formData.base_price || 0} 
                onChange={(e) => setFormData({...formData, base_price: parseFloat(e.target.value) || 0})}
              />
            </div>
            <div className="space-y-2">
              <Label>Sort Order</Label>
              <Input 
                type="number"
                value={formData.sort_order || 0} 
                onChange={(e) => setFormData({...formData, sort_order: parseInt(e.target.value) || 0})}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Features (one per line)</Label>
            <Textarea 
              value={featuresText} 
              onChange={(e) => setFeaturesText(e.target.value)}
              placeholder="Feature 1&#10;Feature 2&#10;Feature 3"
              rows={5}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label>Popular Plan</Label>
            <Switch 
              checked={formData.is_popular || false} 
              onCheckedChange={(checked) => setFormData({...formData, is_popular: checked})}
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
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Documents Tab Component
function DocumentsTab({ searchQuery }: { searchQuery: string }) {
  const [documents, setDocuments] = useState<WebflowDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingDocument, setEditingDocument] = useState<WebflowDocument | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('webflow_documents')
      .select('*')
      .order('sort_order');
    
    if (error) {
      toast({ title: 'Error', description: 'Failed to fetch documents', variant: 'destructive' });
    } else {
      setDocuments((data || []).map(d => ({
        ...d,
        applies_to_nationalities: Array.isArray(d.applies_to_nationalities) ? d.applies_to_nationalities : [],
        applies_to_jurisdictions: Array.isArray(d.applies_to_jurisdictions) ? d.applies_to_jurisdictions : [],
        applies_to_activities: Array.isArray(d.applies_to_activities) ? d.applies_to_activities : [],
        accepted_formats: Array.isArray(d.accepted_formats) ? d.accepted_formats : ['pdf', 'jpg', 'png']
      })));
    }
    setLoading(false);
  };

  const handleSave = async (document: Partial<WebflowDocument>) => {
    if (editingDocument?.id) {
      const { error } = await supabase
        .from('webflow_documents')
        .update(document)
        .eq('id', editingDocument.id);
      
      if (error) {
        toast({ title: 'Error', description: 'Failed to update document', variant: 'destructive' });
      } else {
        toast({ title: 'Success', description: 'Document updated' });
        fetchDocuments();
      }
    } else {
      const { error } = await supabase
        .from('webflow_documents')
        .insert(document as any);
      
      if (error) {
        toast({ title: 'Error', description: 'Failed to create document', variant: 'destructive' });
      } else {
        toast({ title: 'Success', description: 'Document created' });
        fetchDocuments();
      }
    }
    setIsDialogOpen(false);
    setEditingDocument(null);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('webflow_documents')
      .delete()
      .eq('id', id);
    
    if (error) {
      toast({ title: 'Error', description: 'Failed to delete document', variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Document deleted' });
      fetchDocuments();
    }
  };

  const filteredDocuments = documents.filter(d => 
    d.document_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.document_code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Document Requirements</CardTitle>
          <CardDescription>Manage required documents and their conditions</CardDescription>
        </div>
        <Button onClick={() => { setEditingDocument(null); setIsDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Document
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-center py-8 text-muted-foreground">Loading...</p>
        ) : filteredDocuments.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground">No documents configured</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document</TableHead>
                <TableHead>Mandatory</TableHead>
                <TableHead>Applies To (Rules)</TableHead>
                <TableHead>Formats</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDocuments.map((doc) => {
                const hasActivities = doc.applies_to_activities && doc.applies_to_activities.length > 0;
                const hasJurisdictions = doc.applies_to_jurisdictions && doc.applies_to_jurisdictions.length > 0;
                const hasNationalities = doc.applies_to_nationalities && doc.applies_to_nationalities.length > 0;
                const isUniversal = !hasActivities && !hasJurisdictions && !hasNationalities;
                
                return (
                  <TableRow key={doc.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{doc.document_name}</p>
                        <p className="text-xs text-muted-foreground">{doc.document_code}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {doc.is_mandatory ? (
                        <Badge variant="destructive">Required</Badge>
                      ) : (
                        <Badge variant="outline">Optional</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 max-w-[250px]">
                        {isUniversal ? (
                          <Badge variant="secondary" className="text-xs">
                            <Globe className="h-3 w-3 mr-1" />
                            All Applications
                          </Badge>
                        ) : (
                          <>
                            {hasActivities && (
                              <div className="flex flex-wrap gap-1">
                                <span className="text-xs text-muted-foreground mr-1">Activities:</span>
                                {(doc.applies_to_activities as string[]).slice(0, 2).map((act, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs bg-amber-50 border-amber-300">
                                    <Briefcase className="h-2.5 w-2.5 mr-1" />
                                    {act}
                                  </Badge>
                                ))}
                                {doc.applies_to_activities.length > 2 && (
                                  <Badge variant="secondary" className="text-xs">+{doc.applies_to_activities.length - 2}</Badge>
                                )}
                              </div>
                            )}
                            {hasJurisdictions && (
                              <div className="flex flex-wrap gap-1">
                                <span className="text-xs text-muted-foreground mr-1">Jurisdictions:</span>
                                {(doc.applies_to_jurisdictions as string[]).slice(0, 2).map((jur, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs bg-blue-50 border-blue-300">
                                    <Building2 className="h-2.5 w-2.5 mr-1" />
                                    {jur}
                                  </Badge>
                                ))}
                                {doc.applies_to_jurisdictions.length > 2 && (
                                  <Badge variant="secondary" className="text-xs">+{doc.applies_to_jurisdictions.length - 2}</Badge>
                                )}
                              </div>
                            )}
                            {hasNationalities && (
                              <div className="flex flex-wrap gap-1">
                                <span className="text-xs text-muted-foreground mr-1">Nationalities:</span>
                                {(doc.applies_to_nationalities as string[]).slice(0, 2).map((nat, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs bg-green-50 border-green-300">
                                    <Globe className="h-2.5 w-2.5 mr-1" />
                                    {nat}
                                  </Badge>
                                ))}
                                {doc.applies_to_nationalities.length > 2 && (
                                  <Badge variant="secondary" className="text-xs">+{doc.applies_to_nationalities.length - 2}</Badge>
                                )}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {(doc.accepted_formats as string[]).slice(0, 3).map((fmt, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">{fmt}</Badge>
                        ))}
                      </div>
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
  open, 
  onOpenChange, 
  document, 
  onSave 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
  document: WebflowDocument | null;
  onSave: (document: Partial<WebflowDocument>) => void;
}) {
  const [formData, setFormData] = useState<Partial<WebflowDocument>>({
    document_code: '',
    document_name: '',
    description: '',
    is_mandatory: true,
    accepted_formats: ['pdf', 'jpg', 'png'],
    max_file_size_mb: 10,
    is_active: true,
    sort_order: 0,
    applies_to_activities: [],
    applies_to_jurisdictions: [],
    applies_to_nationalities: []
  });
  
  const [activitiesText, setActivitiesText] = useState('');
  const [jurisdictionsText, setJurisdictionsText] = useState('');
  const [nationalitiesText, setNationalitiesText] = useState('');

  useEffect(() => {
    if (document) {
      setFormData(document);
      setActivitiesText((document.applies_to_activities || []).join(', '));
      setJurisdictionsText((document.applies_to_jurisdictions || []).join(', '));
      setNationalitiesText((document.applies_to_nationalities || []).join(', '));
    } else {
      setFormData({
        document_code: '',
        document_name: '',
        description: '',
        is_mandatory: true,
        accepted_formats: ['pdf', 'jpg', 'png'],
        max_file_size_mb: 10,
        is_active: true,
        sort_order: 0,
        applies_to_activities: [],
        applies_to_jurisdictions: [],
        applies_to_nationalities: []
      });
      setActivitiesText('');
      setJurisdictionsText('');
      setNationalitiesText('');
    }
  }, [document, open]);

  const handleSave = () => {
    const activities = activitiesText.split(',').map(s => s.trim()).filter(Boolean);
    const jurisdictions = jurisdictionsText.split(',').map(s => s.trim()).filter(Boolean);
    const nationalities = nationalitiesText.split(',').map(s => s.trim()).filter(Boolean);
    
    onSave({
      ...formData,
      applies_to_activities: activities,
      applies_to_jurisdictions: jurisdictions,
      applies_to_nationalities: nationalities
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{document ? 'Edit Document' : 'Add Document'}</DialogTitle>
          <DialogDescription>
            Configure document requirement settings and dynamic rules
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Code</Label>
              <Input 
                value={formData.document_code || ''} 
                onChange={(e) => setFormData({...formData, document_code: e.target.value})}
                placeholder="PASSPORT"
              />
            </div>
            <div className="space-y-2">
              <Label>Sort Order</Label>
              <Input 
                type="number"
                value={formData.sort_order || 0} 
                onChange={(e) => setFormData({...formData, sort_order: parseInt(e.target.value) || 0})}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Document Name</Label>
            <Input 
              value={formData.document_name || ''} 
              onChange={(e) => setFormData({...formData, document_name: e.target.value})}
              placeholder="Passport Copy"
            />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea 
              value={formData.description || ''} 
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Document description..."
            />
          </div>

          {/* Dynamic Rules Section */}
          <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Label className="font-semibold">Dynamic Rules (leave empty for all applications)</Label>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm flex items-center gap-2">
                <Briefcase className="h-3.5 w-3.5 text-amber-600" />
                Applies to Activities
              </Label>
              <Input 
                value={activitiesText} 
                onChange={(e) => setActivitiesText(e.target.value)}
                placeholder="money_exchange, crypto_trading (comma-separated activity codes)"
                className="text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Document required when customer selects these activities
              </p>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm flex items-center gap-2">
                <Building2 className="h-3.5 w-3.5 text-blue-600" />
                Applies to Jurisdictions
              </Label>
              <Input 
                value={jurisdictionsText} 
                onChange={(e) => setJurisdictionsText(e.target.value)}
                placeholder="DIFC, ADGM (comma-separated jurisdiction codes)"
                className="text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Document required when customer selects these jurisdictions
              </p>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm flex items-center gap-2">
                <Globe className="h-3.5 w-3.5 text-green-600" />
                Applies to Nationalities
              </Label>
              <Input 
                value={nationalitiesText} 
                onChange={(e) => setNationalitiesText(e.target.value)}
                placeholder="IRN, SYR, PRK (comma-separated country codes)"
                className="text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Document required for customers from these countries
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Max File Size (MB)</Label>
            <Input 
              type="number"
              value={formData.max_file_size_mb || 10} 
              onChange={(e) => setFormData({...formData, max_file_size_mb: parseInt(e.target.value) || 10})}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label>Mandatory</Label>
            <Switch 
              checked={formData.is_mandatory !== false} 
              onCheckedChange={(checked) => setFormData({...formData, is_mandatory: checked})}
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
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

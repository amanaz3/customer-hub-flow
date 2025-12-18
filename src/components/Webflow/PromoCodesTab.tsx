import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, Trash2, Tag, Percent, DollarSign, Calendar, CheckCircle, XCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { WebflowPromoCodeConfig, WebflowPricingConfig, WebflowJurisdictionConfig } from '@/hooks/useWebflowConfig';
import { format } from 'date-fns';

interface PromoCodesTabProps {
  promoCodes: WebflowPromoCodeConfig[];
  pricing: WebflowPricingConfig[];
  jurisdictions: WebflowJurisdictionConfig[];
  onUpdate: (promoCodes: WebflowPromoCodeConfig[]) => Promise<boolean>;
  searchQuery: string;
}

export default function PromoCodesTab({ 
  promoCodes, 
  pricing, 
  jurisdictions, 
  onUpdate, 
  searchQuery 
}: PromoCodesTabProps) {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<WebflowPromoCodeConfig | null>(null);
  const [formData, setFormData] = useState<Partial<WebflowPromoCodeConfig>>({});

  const filteredPromoCodes = promoCodes.filter(promo =>
    promo.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    promo.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openCreateDialog = () => {
    setEditingPromo(null);
    setFormData({
      code: '',
      discount_type: 'percentage',
      discount_value: 10,
      min_order_value: null,
      max_uses: null,
      current_uses: 0,
      valid_from: null,
      valid_until: null,
      applies_to_plans: [],
      applies_to_jurisdictions: [],
      is_active: true,
      description: ''
    });
    setEditDialogOpen(true);
  };

  const openEditDialog = (promo: WebflowPromoCodeConfig) => {
    setEditingPromo(promo);
    setFormData({ ...promo });
    setEditDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.code?.trim()) {
      toast({ title: 'Error', description: 'Promo code is required', variant: 'destructive' });
      return;
    }

    // Check for duplicate codes (excluding current editing one)
    const isDuplicate = promoCodes.some(
      p => p.code.toUpperCase() === formData.code?.toUpperCase() && p.id !== editingPromo?.id
    );
    if (isDuplicate) {
      toast({ title: 'Error', description: 'Promo code already exists', variant: 'destructive' });
      return;
    }

    const promoData: WebflowPromoCodeConfig = {
      id: editingPromo?.id || crypto.randomUUID(),
      code: formData.code.toUpperCase().trim(),
      discount_type: formData.discount_type || 'percentage',
      discount_value: formData.discount_value || 0,
      min_order_value: formData.min_order_value || null,
      max_uses: formData.max_uses || null,
      current_uses: formData.current_uses || 0,
      valid_from: formData.valid_from || null,
      valid_until: formData.valid_until || null,
      applies_to_plans: formData.applies_to_plans || [],
      applies_to_jurisdictions: formData.applies_to_jurisdictions || [],
      is_active: formData.is_active ?? true,
      description: formData.description || null
    };

    let updatedPromoCodes: WebflowPromoCodeConfig[];
    if (editingPromo) {
      updatedPromoCodes = promoCodes.map(p => p.id === editingPromo.id ? promoData : p);
    } else {
      updatedPromoCodes = [...promoCodes, promoData];
    }

    const success = await onUpdate(updatedPromoCodes);
    if (success) {
      setEditDialogOpen(false);
      toast({ title: 'Success', description: editingPromo ? 'Promo code updated' : 'Promo code created' });
    }
  };

  const handleDelete = async (promoId: string) => {
    if (!confirm('Are you sure you want to delete this promo code?')) return;
    const updatedPromoCodes = promoCodes.filter(p => p.id !== promoId);
    const success = await onUpdate(updatedPromoCodes);
    if (success) {
      toast({ title: 'Success', description: 'Promo code deleted' });
    }
  };

  const isExpired = (promo: WebflowPromoCodeConfig) => {
    if (!promo.valid_until) return false;
    return new Date(promo.valid_until) < new Date();
  };

  const isNotStarted = (promo: WebflowPromoCodeConfig) => {
    if (!promo.valid_from) return false;
    return new Date(promo.valid_from) > new Date();
  };

  const isMaxedOut = (promo: WebflowPromoCodeConfig) => {
    if (!promo.max_uses) return false;
    return promo.current_uses >= promo.max_uses;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Promo Codes
            </CardTitle>
            <CardDescription>
              Manage discount codes for pricing
            </CardDescription>
          </div>
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Add Promo Code
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Discount</TableHead>
              <TableHead>Valid Period</TableHead>
              <TableHead>Usage</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPromoCodes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No promo codes configured. Click "Add Promo Code" to create one.
                </TableCell>
              </TableRow>
            ) : (
              filteredPromoCodes.map(promo => (
                <TableRow key={promo.id}>
                  <TableCell>
                    <div className="font-mono font-bold text-lg">{promo.code}</div>
                    {promo.description && (
                      <div className="text-xs text-muted-foreground">{promo.description}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-mono">
                      {promo.discount_type === 'percentage' ? (
                        <><Percent className="h-3 w-3 mr-1" />{promo.discount_value}%</>
                      ) : (
                        <><DollarSign className="h-3 w-3 mr-1" />AED {promo.discount_value}</>
                      )}
                    </Badge>
                    {promo.min_order_value && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Min: AED {promo.min_order_value}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <Calendar className="h-3 w-3" />
                      {promo.valid_from ? format(new Date(promo.valid_from), 'MMM d') : '∞'}
                      {' - '}
                      {promo.valid_until ? format(new Date(promo.valid_until), 'MMM d, yyyy') : '∞'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {promo.current_uses} / {promo.max_uses || '∞'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {!promo.is_active ? (
                        <Badge variant="outline" className="text-muted-foreground">
                          <XCircle className="h-3 w-3 mr-1" /> Disabled
                        </Badge>
                      ) : isExpired(promo) ? (
                        <Badge variant="destructive">Expired</Badge>
                      ) : isNotStarted(promo) ? (
                        <Badge variant="outline">Scheduled</Badge>
                      ) : isMaxedOut(promo) ? (
                        <Badge variant="secondary">Maxed Out</Badge>
                      ) : (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" /> Active
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(promo)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(promo.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>

      {/* Edit/Create Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingPromo ? 'Edit Promo Code' : 'Create Promo Code'}</DialogTitle>
            <DialogDescription>
              Configure discount code settings
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Promo Code *</Label>
                <Input
                  value={formData.code || ''}
                  onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="SAVE20"
                  className="font-mono uppercase"
                />
              </div>
              <div className="space-y-2">
                <Label>Discount Type</Label>
                <Select
                  value={formData.discount_type}
                  onValueChange={v => setFormData({ ...formData, discount_type: v as 'percentage' | 'fixed' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                    <SelectItem value="fixed">Fixed Amount (AED)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Discount Value</Label>
                <Input
                  type="number"
                  value={formData.discount_value || ''}
                  onChange={e => setFormData({ ...formData, discount_value: Number(e.target.value) })}
                  placeholder={formData.discount_type === 'percentage' ? '10' : '500'}
                />
              </div>
              <div className="space-y-2">
                <Label>Min Order Value (AED)</Label>
                <Input
                  type="number"
                  value={formData.min_order_value || ''}
                  onChange={e => setFormData({ ...formData, min_order_value: e.target.value ? Number(e.target.value) : null })}
                  placeholder="Optional"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Valid From</Label>
                <Input
                  type="date"
                  value={formData.valid_from ? formData.valid_from.split('T')[0] : ''}
                  onChange={e => setFormData({ ...formData, valid_from: e.target.value || null })}
                />
              </div>
              <div className="space-y-2">
                <Label>Valid Until</Label>
                <Input
                  type="date"
                  value={formData.valid_until ? formData.valid_until.split('T')[0] : ''}
                  onChange={e => setFormData({ ...formData, valid_until: e.target.value || null })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Max Uses</Label>
              <Input
                type="number"
                value={formData.max_uses || ''}
                onChange={e => setFormData({ ...formData, max_uses: e.target.value ? Number(e.target.value) : null })}
                placeholder="Unlimited if empty"
              />
            </div>

            <div className="space-y-2">
              <Label>Description (Optional)</Label>
              <Input
                value={formData.description || ''}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="Summer sale discount"
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={formData.is_active ?? true}
                onCheckedChange={checked => setFormData({ ...formData, is_active: checked })}
              />
              <Label>Active</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingPromo ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

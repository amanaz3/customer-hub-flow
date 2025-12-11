import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useLeads } from '@/hooks/useLeads';
import { useAuth } from '@/contexts/SecureAuthContext';
import { LEAD_SOURCES } from '@/types/lead';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';

interface CreateLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateLeadDialog({ open, onOpenChange }: CreateLeadDialogProps) {
  const { createLead } = useLeads();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<{ id: string; name: string }[]>([]);
  const [users, setUsers] = useState<{ id: string; name: string }[]>([]);
  
  const [formData, setFormData] = useState<{
    name: string;
    email: string;
    mobile: string;
    company: string;
    source: string;
    score: 'hot' | 'warm' | 'cold';
    notes: string;
    product_interest_id: string;
    assigned_to: string;
    estimated_value: string;
    next_follow_up: string;
  }>({
    name: '',
    email: '',
    mobile: '',
    company: '',
    source: '',
    score: 'warm',
    notes: '',
    product_interest_id: '',
    assigned_to: '',
    estimated_value: '',
    next_follow_up: '',
  });

  useEffect(() => {
    if (open) {
      // Fetch products
      supabase
        .from('products')
        .select('id, name')
        .eq('is_active', true)
        .then(({ data }) => setProducts(data || []));

      // Fetch users
      supabase
        .from('profiles')
        .select('id, name')
        .eq('is_active', true)
        .then(({ data }) => setUsers(data || []));

      // Set default assigned_to to current user
      if (user?.id) {
        setFormData((prev) => ({ ...prev, assigned_to: user.id }));
      }
    }
  }, [open, user?.id]);

  // Auto-score based on estimated value
  const calculateAutoScore = (value: number | null): 'hot' | 'warm' | 'cold' => {
    if (!value) return 'cold';
    if (value >= 50000) return 'hot';
    if (value >= 10000) return 'warm';
    return 'cold';
  };

  // Update score when estimated value changes
  const handleEstimatedValueChange = (value: string) => {
    const numValue = value ? parseFloat(value) : null;
    const autoScore = calculateAutoScore(numValue);
    setFormData({ ...formData, estimated_value: value, score: autoScore });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const estimatedValue = formData.estimated_value ? parseFloat(formData.estimated_value) : null;
    
    const leadData = {
      name: formData.name,
      email: formData.email || null,
      mobile: formData.mobile || null,
      company: formData.company || null,
      source: formData.source || null,
      score: calculateAutoScore(estimatedValue), // Always recalculate on submit
      notes: formData.notes || null,
      product_interest_id: formData.product_interest_id || null,
      assigned_to: formData.assigned_to || null,
      estimated_value: estimatedValue,
      next_follow_up: formData.next_follow_up || null,
    };

    const result = await createLead(leadData);
    setLoading(false);

    if (result) {
      setFormData({
        name: '',
        email: '',
        mobile: '',
        company: '',
        source: '',
        score: 'warm',
        notes: '',
        product_interest_id: '',
        assigned_to: user?.id || '',
        estimated_value: '',
        next_follow_up: '',
      });
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Lead</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="mobile">Mobile</Label>
              <Input
                id="mobile"
                value={formData.mobile}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="source">Lead Source</Label>
              <Select
                value={formData.source}
                onValueChange={(value) => setFormData({ ...formData, source: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent>
                  {LEAD_SOURCES.map((source) => (
                    <SelectItem key={source} value={source}>
                      {source}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="score">Lead Score</Label>
              <Select
                value={formData.score}
                onValueChange={(value: 'hot' | 'warm' | 'cold') =>
                  setFormData({ ...formData, score: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hot">🔥 Hot</SelectItem>
                  <SelectItem value="warm">🌡️ Warm</SelectItem>
                  <SelectItem value="cold">❄️ Cold</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="product_interest">Product Interest</Label>
              <Select
                value={formData.product_interest_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, product_interest_id: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="assigned_to">Assigned To</Label>
              <Select
                value={formData.assigned_to}
                onValueChange={(value) => setFormData({ ...formData, assigned_to: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select user" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="estimated_value">Estimated Value (AED)</Label>
              <Input
                id="estimated_value"
                type="number"
                value={formData.estimated_value}
                onChange={(e) => handleEstimatedValueChange(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Auto-scores: ≥50K = Hot, ≥10K = Warm, &lt;10K = Cold
              </p>
            </div>

            <div>
              <Label htmlFor="next_follow_up">Next Follow-up</Label>
              <Input
                id="next_follow_up"
                type="date"
                value={formData.next_follow_up}
                onChange={(e) =>
                  setFormData({ ...formData, next_follow_up: e.target.value })
                }
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Lead'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

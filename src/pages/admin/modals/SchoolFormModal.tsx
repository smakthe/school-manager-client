import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { FormError } from '../../../components/shared/FormError';
import { Loader2 } from 'lucide-react';
import type { SchoolAttributes, BoardPattern, SubscriptionStatus } from '../../../types/school';
import { schoolsApi } from '../../../api/admin/schools';
import { toast } from 'sonner';

interface SchoolFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schoolId: string | null;
  onSuccess: () => void;
}

export function SchoolFormModal({ open, onOpenChange, schoolId, onSuccess }: SchoolFormModalProps) {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<any>(null);

  const [formData, setFormData] = useState<Partial<SchoolAttributes>>({
    name: '',
    subdomain: '',
    board: 'cbse',
    phone: '',
    address: '',
    timezone: 'Asia/Kolkata',
    subscription_status: 'trial',
  });

  useEffect(() => {
    if (open) {
      setError(null);
      if (schoolId) {
        fetchSchool(schoolId);
      } else {
        setFormData({
          name: '',
          subdomain: '',
          board: 'cbse',
          phone: '',
          address: '',
          timezone: 'Asia/Kolkata',
          subscription_status: 'trial',
        });
      }
    }
  }, [open, schoolId]);

  const fetchSchool = async (id: string) => {
    setLoading(true);
    try {
      const res = await schoolsApi.get(id);
      setFormData(res.data.attributes);
    } catch (err) {
      toast.error('Failed to fetch school details');
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      if (schoolId) {
        await schoolsApi.update(schoolId, formData);
        toast.success('School updated successfully');
      } else {
        await schoolsApi.create(formData);
        toast.success('School created successfully');
      }
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      setError(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (field: keyof SchoolAttributes, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{schoolId ? 'Edit School' : 'Add New School'}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormError error={error} />
            
            <div className="space-y-2">
              <Label htmlFor="name">School Name *</Label>
              <Input
                id="name"
                value={formData.name || ''}
                onChange={(e) => handleChange('name', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subdomain">Subdomain *</Label>
              <Input
                id="subdomain"
                value={formData.subdomain || ''}
                onChange={(e) => handleChange('subdomain', e.target.value)}
                placeholder="e.g. springfield"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Board</Label>
                <Select
                  value={formData.board}
                  onValueChange={(val) => handleChange('board', val as BoardPattern)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select board" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cbse">CBSE</SelectItem>
                    <SelectItem value="icse">ICSE</SelectItem>
                    <SelectItem value="state">State</SelectItem>
                    <SelectItem value="ib">IB</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={formData.subscription_status}
                  onValueChange={(val) => handleChange('subscription_status', val as SubscriptionStatus)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="trial">Trial</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone || ''}
                  onChange={(e) => handleChange('phone', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Input
                  id="timezone"
                  value={formData.timezone || ''}
                  onChange={(e) => handleChange('timezone', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.address || ''}
                onChange={(e) => handleChange('address', e.target.value)}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { FormError } from '../../../components/shared/FormError';
import { Loader2 } from 'lucide-react';
import type { TeacherAttributes } from '../../../types/teacher';
import { principalTeachersApi } from '../../../api/principal/teachers';
import { Checkbox } from '../../../components/ui/checkbox';
import { toast } from 'sonner';

interface TeacherFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teacherId: string | null;
  onSuccess: () => void;
}

export function TeacherFormModal({ open, onOpenChange, teacherId, onSuccess }: TeacherFormModalProps) {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<any>(null);

  const [formData, setFormData] = useState<Partial<TeacherAttributes>>({
    name: '', employee_code: '', doj: '', salary: 0, is_active: true,
  });

  const [userCredentials, setUserCredentials] = useState({ email: '', password: '' });

  useEffect(() => {
    if (open) {
      setError(null);
      if (teacherId) {
        fetchTeacher(teacherId);
      } else {
        setFormData({ name: '', employee_code: '', doj: '', salary: 0, is_active: true });
        setUserCredentials({ email: '', password: '' });
      }
    }
  }, [open, teacherId]);

  const fetchTeacher = async (id: string) => {
    setLoading(true);
    try {
      const res = await principalTeachersApi.get(id);
      setFormData(res.data.attributes);
    } catch {
      toast.error('Failed to fetch teacher details');
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
      if (teacherId) {
        await principalTeachersApi.update(teacherId, formData);
        toast.success('Teacher updated successfully');
      } else {
        await principalTeachersApi.create({ ...formData, user: userCredentials });
        toast.success('Teacher created successfully');
      }
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      setError(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{teacherId ? 'Edit Teacher' : 'Add New Teacher'}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormError error={error} />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input id="name" value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="employee_code">Employee Code *</Label>
                <Input id="employee_code" value={formData.employee_code || ''} onChange={(e) => setFormData({ ...formData, employee_code: e.target.value })} required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="doj">Date of Joining</Label>
                <Input id="doj" type="date" value={formData.doj || ''} onChange={(e) => setFormData({ ...formData, doj: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="salary">Salary</Label>
                <Input id="salary" type="number" min="0" step="0.01" value={formData.salary || 0} onChange={(e) => setFormData({ ...formData, salary: parseFloat(e.target.value) })} />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox id="is_active" checked={formData.is_active} onCheckedChange={(c) => setFormData({ ...formData, is_active: c as boolean })} />
              <Label htmlFor="is_active">Active Employee</Label>
            </div>

            {!teacherId && (
              <div className="mt-6 border-t pt-4 space-y-4">
                <h4 className="text-sm font-medium">Login Credentials</h4>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input id="email" type="email" value={userCredentials.email} onChange={(e) => setUserCredentials({ ...userCredentials, email: e.target.value })} required />
                  <p className="text-xs text-muted-foreground">Must use your school's domain (e.g. name@school.co.edu)</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <Input id="password" type="password" value={userCredentials.password} onChange={(e) => setUserCredentials({ ...userCredentials, password: e.target.value })} required minLength={6} />
                </div>
              </div>
            )}
            {teacherId && (
              <p className="text-sm text-muted-foreground border-t pt-4">Email and Password cannot be changed here after creation.</p>
            )}

            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>Cancel</Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { FormError } from '../../../components/shared/FormError';
import { Loader2 } from 'lucide-react';
import type { TeacherAttributes } from '../../../types/teacher';
import { teachersApi } from '../../../api/admin/teachers';
import { schoolsApi } from '../../../api/admin/schools';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
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
  const [schools, setSchools] = useState<any[]>([]);

  const [formData, setFormData] = useState<Partial<TeacherAttributes>>({
    name: '',
    school_id: undefined,
    employee_code: '',
    doj: '',
    salary: 0,
    is_active: true,
  });

  const [userCredentials, setUserCredentials] = useState({
    email: '',
    password: '',
  });

  const selectedSchoolId = formData.school_id;
  const selectedSchool = schools.find((s) => Number(s.id) === Number(selectedSchoolId));

  useEffect(() => {
    if (open) {
      setError(null);
      fetchSchools();
      if (teacherId) {
        fetchTeacher(teacherId);
      } else {
        setFormData({
          name: '',
          school_id: undefined,
          employee_code: '',
          doj: '',
          salary: 0,
          is_active: true,
        });
        setUserCredentials({ email: '', password: '' });
      }
    }
  }, [open, teacherId]);

  const fetchSchools = async () => {
    try {
      const res = await schoolsApi.list(1);
      setSchools(res.data);
    } catch (err) {
      console.error('Failed to fetch schools', err);
    }
  };

  const fetchTeacher = async (id: string) => {
    setLoading(true);
    try {
      const res = await teachersApi.get(id);
      setFormData(res.data.attributes);
      
      const userRel = res.data.relationships?.user?.data;
      if (userRel) {
         setUserCredentials(prev => ({ ...prev, email: userRel.email || '' }));
      }
      
    } catch (err) {
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
        await teachersApi.update(teacherId, formData);
        toast.success('Teacher updated successfully');
      } else {
        await teachersApi.create({
          ...formData,
          user: userCredentials,
        });
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
          <div className="flex justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormError error={error} />

            <div className="space-y-2">
              <Label>School *</Label>
              <Select
                value={formData.school_id?.toString()}
                onValueChange={(val) => setFormData((prev) => ({ ...prev, school_id: val ? parseInt(val) : undefined }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a school" />
                </SelectTrigger>
                <SelectContent>
                  {schools.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.attributes.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="employee_code">Employee Code *</Label>
                <Input
                  id="employee_code"
                  value={formData.employee_code || ''}
                  onChange={(e) => setFormData({ ...formData, employee_code: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="doj">Date of Joining</Label>
                <Input
                  id="doj"
                  type="date"
                  value={formData.doj || ''}
                  onChange={(e) => setFormData({ ...formData, doj: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="salary">Salary</Label>
                <Input
                  id="salary"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.salary || 0}
                  onChange={(e) => setFormData({ ...formData, salary: parseFloat(e.target.value) })}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(c) => setFormData({ ...formData, is_active: c as boolean })}
              />
              <Label htmlFor="is_active">Active Employee</Label>
            </div>

            <div className="mt-6 border-t pt-4">
              <h4 className="text-sm font-medium mb-3">Login Credentials</h4>
              {!teacherId && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={userCredentials.email}
                      onChange={(e) => setUserCredentials({ ...userCredentials, email: e.target.value })}
                      required
                    />
                    {selectedSchool && (
                      <p className="text-xs text-muted-foreground">
                        Must end with <strong>@{selectedSchool.attributes.subdomain}.co.edu</strong>
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password *</Label>
                    <Input
                      id="password"
                      type="password"
                      value={userCredentials.password}
                      onChange={(e) => setUserCredentials({ ...userCredentials, password: e.target.value })}
                      required
                      minLength={6}
                    />
                  </div>
                </div>
              )}
              {teacherId && (
                 <p className="text-sm text-muted-foreground">Email and Password can't be changed here after creation.</p>
              )}
            </div>

            <DialogFooter className="mt-6">
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

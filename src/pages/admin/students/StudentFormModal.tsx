import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { FormError } from '../../../components/shared/FormError';
import { Loader2 } from 'lucide-react';
import type { StudentAttributes, Gender } from '../../../types/student';
import { studentsApi } from '../../../api/admin/students';
import { schoolsApi } from '../../../api/admin/schools';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Checkbox } from '../../../components/ui/checkbox';
import { toast } from 'sonner';

interface StudentFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string | null;
  onSuccess: () => void;
}

export function StudentFormModal({ open, onOpenChange, studentId, onSuccess }: StudentFormModalProps) {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<any>(null);
  const [schools, setSchools] = useState<any[]>([]);

  const [formData, setFormData] = useState<Partial<StudentAttributes>>({
    name: '',
    school_id: undefined,
    admission_number: '',
    dob: '',
    gender: 'male',
    is_active: true,
  });

  useEffect(() => {
    if (open) {
      setError(null);
      fetchSchools();
      if (studentId) {
        fetchStudent(studentId);
      } else {
        setFormData({
          name: '',
          school_id: undefined,
          admission_number: '',
          dob: '',
          gender: 'male',
          is_active: true,
        });
      }
    }
  }, [open, studentId]);

  const fetchSchools = async () => {
    try {
      const res = await schoolsApi.list(1);
      setSchools(res.data);
    } catch (err) { }
  };

  const fetchStudent = async (id: string) => {
    setLoading(true);
    try {
      const res = await studentsApi.get(id);
      setFormData(res.data.attributes);
    } catch (err) {
      toast.error('Failed to fetch student details');
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
      if (studentId) {
        await studentsApi.update(studentId, formData);
        toast.success('Student updated successfully');
      } else {
        await studentsApi.create(formData);
        toast.success('Student created successfully');
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
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>{studentId ? 'Edit Student' : 'Add New Student'}</DialogTitle>
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

            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="admission_number">Admission No *</Label>
                <Input
                  id="admission_number"
                  value={formData.admission_number || ''}
                  onChange={(e) => setFormData({ ...formData, admission_number: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dob">Date of Birth</Label>
                <Input
                  id="dob"
                  type="date"
                  value={formData.dob || ''}
                  onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Gender</Label>
                <Select
                  value={formData.gender}
                  onValueChange={(val) => setFormData((prev) => ({ ...prev, gender: val as Gender }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center space-x-2 mt-4">
              <Checkbox
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(c) => setFormData({ ...formData, is_active: c as boolean })}
              />
              <Label htmlFor="is_active">Active Student</Label>
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

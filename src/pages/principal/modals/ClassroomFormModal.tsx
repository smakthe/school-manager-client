import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { Label } from '../../../components/ui/label';
import { FormError } from '../../../components/shared/FormError';
import { Loader2 } from 'lucide-react';
import type { ClassroomAttributes, Section } from '../../../types/classroom';
import { principalClassroomsApi } from '../../../api/principal/classrooms';
import { principalTeachersApi } from '../../../api/principal/teachers';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { toast } from 'sonner';

interface ClassroomFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classroomId: string | null;
  onSuccess: () => void;
}

export function ClassroomFormModal({ open, onOpenChange, classroomId, onSuccess }: ClassroomFormModalProps) {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<any>(null);
  const [teachers, setTeachers] = useState<any[]>([]);

  const [formData, setFormData] = useState<Partial<ClassroomAttributes>>({
    academic_year_id: undefined,
    class_teacher_id: undefined,
    grade: 1,
    section: 'a',
  });

  useEffect(() => {
    if (open) {
      setError(null);
      fetchTeachers();
      if (classroomId) {
        fetchClassroom(classroomId);
      } else {
        setFormData({ academic_year_id: undefined, class_teacher_id: undefined, grade: 1, section: 'a' });
      }
    }
  }, [open, classroomId]);

  const fetchTeachers = async () => {
    try {
      const res = await principalTeachersApi.list(1);
      setTeachers(res.data);
    } catch {}
  };

  const fetchClassroom = async (id: string) => {
    setLoading(true);
    try {
      const res = await principalClassroomsApi.get(id);
      setFormData({
        academic_year_id: res.data.attributes.academic_year_id,
        class_teacher_id: res.data.attributes.class_teacher_id,
        grade: res.data.attributes.grade,
        section: res.data.attributes.section,
      });
    } catch {
      toast.error('Failed to fetch classroom details');
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
      if (classroomId) {
        await principalClassroomsApi.update(classroomId, formData);
        toast.success('Classroom updated successfully');
      } else {
        await principalClassroomsApi.create(formData);
        toast.success('Classroom created successfully');
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
          <DialogTitle>{classroomId ? 'Edit Classroom' : 'Add New Classroom'}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormError error={error} />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Grade *</Label>
                <Select
                  value={formData.grade?.toString()}
                  onValueChange={(val) => setFormData((prev) => ({ ...prev, grade: val ? parseInt(val) : undefined }))}
                >
                  <SelectTrigger><SelectValue placeholder="Grade" /></SelectTrigger>
                  <SelectContent>
                    {[1,2,3,4,5,6,7,8,9,10,11,12].map(g => (
                      <SelectItem key={g} value={g.toString()}>Grade {g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Section *</Label>
                <Select
                  value={formData.section}
                  onValueChange={(val) => setFormData((prev) => ({ ...prev, section: val as Section }))}
                >
                  <SelectTrigger><SelectValue placeholder="Section" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="a">A</SelectItem>
                    <SelectItem value="b">B</SelectItem>
                    <SelectItem value="c">C</SelectItem>
                    <SelectItem value="d">D</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Class Teacher</Label>
              <Select
                value={formData.class_teacher_id?.toString() || 'none'}
                onValueChange={(val) => setFormData((prev) => ({ ...prev, class_teacher_id: val === 'none' ? undefined : parseInt(val) }))}
              >
                <SelectTrigger><SelectValue placeholder="Select class teacher" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {teachers.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.attributes.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

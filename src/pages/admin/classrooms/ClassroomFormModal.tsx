import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { Label } from '../../../components/ui/label';
import { FormError } from '../../../components/shared/FormError';
import { Loader2 } from 'lucide-react';
import type { ClassroomAttributes, Section } from '../../../types/classroom';
import { classroomsApi } from '../../../api/admin/classrooms';
import { schoolsApi } from '../../../api/admin/schools';
import { teachersApi } from '../../../api/admin/teachers';
import { academicYearsApi } from '../../../api/admin/academicYears';
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
  
  const [schools, setSchools] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);

  const [formData, setFormData] = useState<Partial<ClassroomAttributes>>({
    school_id: undefined,
    academic_year_id: undefined,
    class_teacher_id: undefined,
    grade: 1,
    section: 'a',
  });

  useEffect(() => {
    if (open) {
      setError(null);
      fetchDependencies();
      if (classroomId) {
        fetchClassroom(classroomId);
      } else {
        setFormData({
          school_id: undefined,
          academic_year_id: undefined,
          class_teacher_id: undefined,
          grade: 1,
          section: 'a',
        });
      }
    }
  }, [open, classroomId]);

  // When school changes, we should ideally fetch teachers for that school to populate class teacher dropdown
  useEffect(() => {
    if (formData.school_id) {
       teachersApi.list(1, formData.school_id.toString()).then(res => {
         setTeachers(res.data);
       }).catch(() => {
         // silently fail or toast
       });
    } else {
       setTeachers([]);
    }
  }, [formData.school_id]);

  const fetchDependencies = async () => {
    try {
      const schoolsRes = await schoolsApi.list(1);
      setSchools(schoolsRes.data);
      
      // Probing academic years API - if it fails we just leave it empty and user will see a TODO comment
      try {
         const ayRes = await academicYearsApi.list();
         setAcademicYears(ayRes.data);
      } catch (e) {
         console.warn("Academic years API not available", e);
      }
    } catch (err) { }
  };

  const fetchClassroom = async (id: string) => {
    setLoading(true);
    try {
      const res = await classroomsApi.get(id);
      setFormData({
        school_id: res.data.attributes.school_id,
        academic_year_id: res.data.attributes.academic_year_id,
        class_teacher_id: res.data.attributes.class_teacher_id,
        grade: res.data.attributes.grade,
        section: res.data.attributes.section,
      });
    } catch (err) {
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
        await classroomsApi.update(classroomId, formData);
        toast.success('Classroom updated successfully');
      } else {
        await classroomsApi.create(formData);
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
                <Label htmlFor="grade">Grade *</Label>
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
                  <SelectTrigger>
                    <SelectValue placeholder="Select section" />
                  </SelectTrigger>
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
                value={formData.class_teacher_id?.toString() || "none"}
                onValueChange={(val) => setFormData((prev) => ({ ...prev, class_teacher_id: val === "none" || !val ? undefined : parseInt(val) }))}
                disabled={!formData.school_id}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select class teacher" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {teachers.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.attributes.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!formData.school_id && <p className="text-xs text-muted-foreground">Select a school first</p>}
            </div>

            <div className="space-y-2">
              <Label>Academic Year *</Label>
              {/* TODO: Implement real academic year fetching once endpoint is verified */}
              <Select
                value={formData.academic_year_id?.toString()}
                onValueChange={(val) => setFormData((prev) => ({ ...prev, academic_year_id: val ? parseInt(val) : undefined }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select academic year" />
                </SelectTrigger>
                <SelectContent>
                  {academicYears.length > 0 ? (
                    academicYears.map(ay => (
                      <SelectItem key={ay.id} value={ay.id}>{ay.attributes.name}</SelectItem>
                    ))
                  ) : (
                    // Fallback since API may not exist yet
                    <SelectItem value="1">2024-2025 (Fallback ID: 1)</SelectItem>
                  )}
                </SelectContent>
              </Select>
              {academicYears.length === 0 && <p className="text-xs text-amber-500">Note: Academic year API TBD, using fallback ID.</p>}
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

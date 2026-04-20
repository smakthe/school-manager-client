import { useState, useEffect } from "react";
import { teacherStudentsApi } from "../../../api/teacher/students";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import { Checkbox } from "../../../components/ui/checkbox";
import { Label } from "../../../components/ui/label";
import { FormError } from "../../../components/shared/FormError";
import { toast } from "sonner";
import { BookOpen, GraduationCap, Users, Edit, Loader2 } from "lucide-react";
import { Badge } from "../../../components/ui/badge";
import { StudentSheet } from "../../admin/explore/components/StudentSheet";
import type { StudentAttributes, Gender } from "../../../types/student";

// ── Inline edit modal (teacher-restricted fields only) ──────────────────────

interface EditStudentModalProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  student: any | null;
  onSuccess: () => void;
}

function EditStudentModal({
  open,
  onOpenChange,
  student,
  onSuccess,
}: EditStudentModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<any>(null);
  const [formData, setFormData] = useState<Partial<StudentAttributes>>({});

  useEffect(() => {
    if (open && student) {
      setError(null);
      setFormData({
        name: student.attributes.name,
        dob: student.attributes.dob || "",
        gender: student.attributes.gender,
        is_active: student.attributes.is_active,
      });
    }
  }, [open, student]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await teacherStudentsApi.update(student.id, formData);
      toast.success("Student updated successfully");
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
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Edit Student</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <FormError error={error} />

          <div className="space-y-2">
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              value={formData.name || ""}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dob">Date of Birth</Label>
              <Input
                id="dob"
                type="date"
                value={formData.dob || ""}
                onChange={(e) =>
                  setFormData({ ...formData, dob: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Gender</Label>
              <Select
                value={formData.gender}
                onValueChange={(val) =>
                  setFormData((prev) => ({ ...prev, gender: val as Gender }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(c) =>
                setFormData({ ...formData, is_active: c as boolean })
              }
            />
            <Label htmlFor="is_active">Active Student</Label>
          </div>

          <p className="text-xs text-muted-foreground border-t pt-3">
            Note: Admission number cannot be edited. Only class teachers can
            edit their homeroom students.
          </p>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

interface Homeroom {
  id: number;
  display_name: string;
  grade: number;
  section: string;
  class_teacher_id?: number;
}

export function TeacherClassroomView({ homeroom }: { homeroom: Homeroom }) {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [viewingStudent, setViewingStudent] = useState<any>(null);
  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const fetchClassDetails = async () => {
    try {
      // Fetch all students in this classroom (paginate through all pages)
      let allStudents: any[] = [],
        page = 1,
        total = 1;
      do {
        const res = await teacherStudentsApi.list(page, homeroom.id.toString());
        allStudents = [...allStudents, ...res.data];
        total = res.meta.pages || 1;
        page++;
      } while (page <= total);
      setStudents(allStudents);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClassDetails();
  }, [homeroom.id]);

  if (loading)
    return (
      <div className="flex h-40 items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );

  return (
    <div className="space-y-8">
      {/* ── Summary Cards ─────────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-2 flex flex-row items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardDescription>Your classroom</CardDescription>
              <CardTitle className="text-2xl">
                Class {homeroom.display_name}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Grade {homeroom.grade} · Section {homeroom.section?.toUpperCase()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center gap-3">
            <div className="rounded-lg bg-muted p-2">
              <Users className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <CardDescription>Total Students</CardDescription>
              <CardTitle className="text-2xl">{students.length}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Enrolled in class</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center gap-3">
            <div className="rounded-lg bg-muted p-2">
              <GraduationCap className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <CardDescription>Active Students</CardDescription>
              <CardTitle className="text-2xl">
                {students.filter((s) => s.attributes.is_active).length}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Enrolled Students ─────────────────────────────────────────────── */}
      <div>
        <div className="flex flex-col sm:flex-row justify-between gap-4 mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <GraduationCap className="h-5 w-5" /> Enrolled Students
          </h3>
        </div>
        {students.length === 0 ? (
          <p className="py-10 text-center text-muted-foreground">
            No students found.
          </p>
        ) : (
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8">
            {students.map((s) => (
              <div
                key={s.id}
                className="relative flex flex-col p-4 border rounded-md bg-card hover:border-primary hover:shadow-sm cursor-pointer group transition-all"
                onClick={() => setViewingStudent(s)}
              >
                <div className="pr-2">
                  <p
                    className="font-medium truncate text-sm"
                    title={s.attributes.name}
                  >
                    {s.attributes.name}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1 truncate">
                    {s.attributes.admission_number}
                  </p>
                </div>
                <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-card/90 backdrop-blur-sm rounded-md shadow-sm border border-border/50">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingStudent(s);
                      setIsEditModalOpen(true);
                    }}
                  >
                    <Edit className="h-3.5 w-3.5 text-primary" />
                  </Button>
                </div>
                {!s.attributes.is_active && (
                  <Badge
                    variant="secondary"
                    className="mt-2 text-[10px] py-0 h-4 w-fit opacity-70"
                  >
                    Inactive
                  </Badge>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Shared Student Slide-Out Sheet ────────────────────────────────── */}
      <StudentSheet
        student={viewingStudent}
        onClose={() => setViewingStudent(null)}
        onEdit={(s) => {
          setViewingStudent(null);
          setEditingStudent(s);
          setIsEditModalOpen(true);
        }}
        marksEndpoint="/teacher/marks?student_id="
      />

      {/* ── Edit Modal ────────────────────────────────────────────────────── */}
      <EditStudentModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        student={editingStudent}
        onSuccess={fetchClassDetails}
      />
    </div>
  );
}

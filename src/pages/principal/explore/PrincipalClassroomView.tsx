import { useState, useEffect } from "react";
import { principalStudentsApi } from "../../../api/principal/students";
import { principalTeachersApi } from "../../../api/principal/teachers";
import { apiFetch } from "../../../api/client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Separator } from "../../../components/ui/separator";
import {
  Users,
  ArrowLeft,
  GraduationCap,
  Edit,
  Trash2,
  Plus,
  BookOpen,
} from "lucide-react";

import { StudentFormModal } from "../modals/StudentFormModal";
import { TeacherFormModal } from "../modals/TeacherFormModal";
import { ConfirmDialog } from "../../../components/shared/ConfirmDialog";
import { StudentSheet } from "../../admin/explore/components/StudentSheet";
import { TeacherSheet } from "../../admin/explore/components/TeacherSheet";

export function PrincipalClassroomView({
  classroom,
  onBack,
}: {
  classroom: any;
  onBack: () => void;
}) {
  const [students, setStudents] = useState<any[]>([]);
  const [teacher, setTeacher] = useState<any | null>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [modals, setModals] = useState({
    student: false,
    teacher: false,
  });
  const [editing, setEditing] = useState<{ student: any; teacher: any }>({
    student: null,
    teacher: null,
  });

  const [viewingStudent, setViewingStudent] = useState<any>(null);
  const [viewingTeacher, setViewingTeacher] = useState<any>(null);
  const [deleteConfig, setDeleteConfig] = useState<any>({
    isOpen: false,
    type: null,
    entity: null,
    loading: false,
  });

  const fetchClassDetails = async () => {
    try {
      // Fetch all students in this classroom
      let allStudents: any[] = [],
        page = 1,
        total = 1;
      do {
        const res = await principalStudentsApi.list(page, classroom.id);
        allStudents = [...allStudents, ...res.data];
        total = res.meta.pages || 1;
        page++;
      } while (page <= total);
      setStudents(allStudents);

      // Fetch class teacher
      const tid = classroom.attributes.class_teacher_id;
      setTeacher(tid ? (await principalTeachersApi.get(tid)).data : null);

      // Fetch subject assignments for this classroom
      const assignRes = await apiFetch<any>(
        `/principal/teacher_subject_assignments?classroom_id=${classroom.id}`,
      ).catch(() => ({ data: [] }));
      setAssignments(assignRes.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClassDetails();
  }, [classroom.id]);


  const confirmDelete = async () => {
    setDeleteConfig((prev: any) => ({ ...prev, loading: true }));
    try {
      if (deleteConfig.type === "student") {
        await principalStudentsApi.delete(deleteConfig.entity.id);
      }
      await fetchClassDetails();
    } finally {
      setDeleteConfig({ isOpen: false, type: null, entity: null, loading: false });
    }
  };

  if (loading)
    return (
      <div className="flex h-40 items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );

  return (
    <div className="space-y-8">
      <Button variant="ghost" onClick={onBack} className="-ml-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Classrooms
      </Button>

      {/* ── Summary Cards ─────────────────────────────────────────────────── */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card
          className="bg-primary/5 border-primary/20 relative group cursor-pointer"
          onClick={() => teacher && setViewingTeacher(teacher)}
        >
          {teacher && (
            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100">
              <Button
                variant="secondary"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setEditing({ ...editing, teacher });
                  setModals({ ...modals, teacher: true });
                }}
              >
                <Edit className="mr-2 h-4 w-4" /> Edit
              </Button>
            </div>
          )}
          <CardContent className="flex items-center gap-4 p-6">
            <div className="p-3 bg-primary/10 rounded-full">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Class Teacher</h3>
              <p className="text-muted-foreground">
                {teacher
                  ? `${teacher.attributes.name} (${teacher.attributes.employee_code})`
                  : "No teacher assigned."}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-around p-6">
            <div className="text-center">
              <p className="text-3xl font-bold">{students.length}</p>
              <p className="text-sm text-muted-foreground">Students</p>
            </div>
            <Separator orientation="vertical" className="h-12" />
            <div className="text-center">
              <p className="text-3xl font-bold">{assignments.length}</p>
              <p className="text-sm text-muted-foreground">Subjects Assigned</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Subject Assignments ───────────────────────────────────────────── */}
      {assignments.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <BookOpen className="h-5 w-5" /> Subject Teachers
          </h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {assignments.map((a) => (
              <Card key={a.id}>
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-base">
                    {a.attributes.subject?.name || "Subject"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 text-sm text-muted-foreground">
                  <span className="font-medium text-muted-foreground">
                    {a.attributes.teacher?.name || "Unknown"}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ── Enrolled Students ─────────────────────────────────────────────── */}
      <div>
        <div className="flex flex-col sm:flex-row justify-between gap-4 mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <GraduationCap className="h-5 w-5" /> Enrolled Students
          </h3>
          <Button
            onClick={() => {
              setEditing({ ...editing, student: null });
              setModals({ ...modals, student: true });
            }}
          >
            <Plus className="mr-2 h-4 w-4" /> Add
          </Button>
        </div>
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8">
          {students.map((s) => (
            <div
              key={s.id}
              className="relative flex flex-col p-4 border rounded-md bg-card hover:border-primary hover:shadow-sm cursor-pointer group transition-all"
              onClick={() => setViewingStudent(s)}
            >
              <div className="pr-2">
                <p className="font-medium truncate" title={s.attributes.name}>
                  {s.attributes.name}
                </p>
                <p className="text-xs text-muted-foreground mt-1 truncate">
                  {s.attributes.admission_number}
                </p>
              </div>
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-card/90 backdrop-blur-sm rounded-md shadow-sm">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditing({ ...editing, student: s });
                    setModals({ ...modals, student: true });
                  }}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteConfig({ isOpen: true, type: "student", entity: s });
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Modals ────────────────────────────────────────────────────────── */}
      {modals.student && (
        <StudentFormModal
          open={modals.student}
          onOpenChange={(v) => setModals({ ...modals, student: v })}
          studentId={editing.student?.id}
          onSuccess={fetchClassDetails}
        />
      )}
      {modals.teacher && (
        <TeacherFormModal
          open={modals.teacher}
          onOpenChange={(v) => setModals({ ...modals, teacher: v })}
          teacherId={editing.teacher?.id}
          onSuccess={fetchClassDetails}
        />
      )}

      {/* ── Shared Slide-Out Sheets ───────────────────────────────────────── */}
      <StudentSheet
        student={viewingStudent}
        onClose={() => setViewingStudent(null)}
        onEdit={(s) => {
          setViewingStudent(null);
          setEditing({ ...editing, student: s });
          setModals({ ...modals, student: true });
        }}
        marksEndpoint="/principal/marks?student_id="
      />
      <TeacherSheet
        teacher={viewingTeacher}
        onClose={() => setViewingTeacher(null)}
        onEdit={(t) => {
          setViewingTeacher(null);
          setEditing({ ...editing, teacher: t });
          setModals({ ...modals, teacher: true });
        }}
        assignmentsEndpoint="/principal/teacher_subject_assignments?teacher_id="
      />
      <ConfirmDialog
        open={deleteConfig.isOpen}
        onCancel={() =>
          setDeleteConfig({ isOpen: false, type: null, entity: null, loading: false })
        }
        onConfirm={confirmDelete}
        title="Delete"
        description="Are you sure? This cannot be undone."
        isDeleting={deleteConfig.loading}
      />
    </div>
  );
}

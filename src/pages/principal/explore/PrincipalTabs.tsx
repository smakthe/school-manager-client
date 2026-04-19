import { useState, useEffect, useRef, useCallback } from "react";
import { principalClassroomsApi } from "../../../api/principal/classrooms";
import { principalStudentsApi } from "../../../api/principal/students";
import { principalTeachersApi } from "../../../api/principal/teachers";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../../components/ui/tabs";
import { Edit, Trash2, Plus } from "lucide-react";

import { ClassroomFormModal } from "../modals/ClassroomFormModal";
import { StudentFormModal } from "../modals/StudentFormModal";
import { TeacherFormModal } from "../modals/TeacherFormModal";
import { ConfirmDialog } from "../../../components/shared/ConfirmDialog";
import { StudentSheet } from "../../admin/explore/components/StudentSheet";
import { TeacherSheet } from "../../admin/explore/components/TeacherSheet";

export function PrincipalTabs({
  onSelectClassroom,
}: {
  onSelectClassroom: (c: any) => void;
}) {
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadingMoreStudents, setLoadingMoreStudents] = useState(false);
  const [studentMeta, setStudentMeta] = useState<any>({ page: 1, pages: 1 });

  const [searchQueries, setSearchQueries] = useState({
    class: "",
    student: "",
    teacher: "",
  });

  const [modals, setModals] = useState({
    class: false,
    student: false,
    teacher: false,
  });
  const [editing, setEditing] = useState<{
    class: any;
    student: any;
    teacher: any;
  }>({ class: null, student: null, teacher: null });

  const [viewingStudent, setViewingStudent] = useState<any>(null);
  const [viewingTeacher, setViewingTeacher] = useState<any>(null);
  const [deleteConfig, setDeleteConfig] = useState<any>({
    isOpen: false,
    type: null,
    entity: null,
    loading: false,
  });

  // ── Infinite Scroll for Students ──────────────────────────────────────────
  const observer = useRef<IntersectionObserver | null>(null);
  const isFetchingRef = useRef(false);
  const lastStudentRef = useCallback(
    (node: HTMLDivElement) => {
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (
          entries[0].isIntersecting &&
          !isFetchingRef.current &&
          studentMeta.page < studentMeta.pages
        ) {
          fetchStudents(studentMeta.page + 1);
        }
      });
      if (node) observer.current.observe(node);
    },
    [studentMeta.page, studentMeta.pages],
  );

  // ── Fetchers ──────────────────────────────────────────────────────────────
  const fetchClassrooms = async () => {
    let all: any[] = [],
      page = 1,
      total = 1;
    do {
      const res = await principalClassroomsApi.list(page);
      all = [...all, ...res.data];
      total = res.meta.pages || 1;
      page++;
    } while (page <= total);
    setClassrooms(all);
  };

  const fetchTeachers = async () => {
    let all: any[] = [],
      page = 1,
      total = 1;
    do {
      const res = await principalTeachersApi.list(page);
      all = [...all, ...res.data];
      total = res.meta.pages || 1;
      page++;
    } while (page <= total);
    setTeachers(all);
  };

  const fetchStudents = async (page = 1) => {
    isFetchingRef.current = true;
    if (page > 1) setLoadingMoreStudents(true);
    try {
      const res = await principalStudentsApi.list(page);
      if (page === 1) setStudents(res.data);
      else
        setStudents((prev) => [
          ...prev,
          ...res.data.filter((s: any) => !prev.find((p) => p.id === s.id)),
        ]);
      setStudentMeta(res.meta);
    } finally {
      setLoadingMoreStudents(false);
      isFetchingRef.current = false;
    }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchClassrooms(), fetchTeachers(), fetchStudents(1)]).finally(
      () => setLoading(false),
    );
  }, []);

  // ── Delete ────────────────────────────────────────────────────────────────
  const confirmDelete = async () => {
    setDeleteConfig((prev: any) => ({ ...prev, loading: true }));
    try {
      if (deleteConfig.type === "class") {
        await principalClassroomsApi.delete(deleteConfig.entity.id);
        await fetchClassrooms();
      }
      if (deleteConfig.type === "student") {
        await principalStudentsApi.delete(deleteConfig.entity.id);
        await fetchStudents(1);
      }
      if (deleteConfig.type === "teacher") {
        await principalTeachersApi.delete(deleteConfig.entity.id);
        await fetchTeachers();
      }
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
    <div className="space-y-4">
      <Tabs defaultValue="classrooms" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="classrooms">
            Classrooms ({classrooms.length})
          </TabsTrigger>
          <TabsTrigger value="students">
            Student Directory ({studentMeta.count || students.length})
          </TabsTrigger>
          <TabsTrigger value="teachers">
            Teacher Directory ({teachers.length})
          </TabsTrigger>
        </TabsList>

        {/* ── Classrooms ───────────────────────────────────────────────── */}
        <TabsContent value="classrooms" className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <Input
              placeholder="Search classrooms..."
              value={searchQueries.class}
              onChange={(e) =>
                setSearchQueries({ ...searchQueries, class: e.target.value })
              }
              className="sm:w-96"
            />
            <Button
              onClick={() => {
                setEditing({ ...editing, class: null });
                setModals({ ...modals, class: true });
              }}
            >
              <Plus className="mr-2 h-4 w-4" /> Add Classroom
            </Button>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {classrooms
              .filter((c) =>
                c.attributes.display_name
                  .toLowerCase()
                  .includes(searchQueries.class.toLowerCase()),
              )
              .map((c) => (
                <Card
                  key={c.id}
                  className="cursor-pointer hover:border-primary transition-colors group"
                  onClick={() => onSelectClassroom(c)}
                >
                  <CardHeader className="flex flex-row justify-between pb-2">
                    <CardTitle className="text-xl">
                      {c.attributes.display_name}
                    </CardTitle>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                      <Button
                        variant="secondary"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditing({ ...editing, class: c });
                          setModals({ ...modals, class: true });
                        }}
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfig({
                            isOpen: true,
                            type: "class",
                            entity: c,
                          });
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1.5 mt-4 pt-4 border-t border-dashed text-sm">
                      <p className="flex justify-between">
                        <span className="text-muted-foreground">
                          Class Teacher
                        </span>{" "}
                        <span className="font-medium truncate ml-2 text-right">
                          {c.attributes.class_teacher?.name || "Not Assigned"}
                        </span>
                      </p>
                      <p className="flex justify-between">
                        <span className="text-muted-foreground">
                          Student Strength
                        </span>{" "}
                        <span className="font-medium">
                          {c.attributes.students_count || 0}
                        </span>
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>

        {/* ── Student Directory ─────────────────────────────────────────── */}
        <TabsContent value="students" className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <Input
              placeholder="Search students..."
              value={searchQueries.student}
              onChange={(e) =>
                setSearchQueries({ ...searchQueries, student: e.target.value })
              }
              className="sm:w-96"
            />
            <Button
              onClick={() => {
                setEditing({ ...editing, student: null });
                setModals({ ...modals, student: true });
              }}
            >
              <Plus className="mr-2 h-4 w-4" /> Add Student
            </Button>
          </div>
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8">
            {students
              .filter((s) =>
                s.attributes.name
                  .toLowerCase()
                  .includes(searchQueries.student.toLowerCase()),
              )
              .map((s, i, arr) => (
                <div
                  ref={arr.length === i + 1 ? lastStudentRef : null}
                  key={s.id}
                  className="relative flex flex-col p-4 border rounded-md bg-card hover:border-primary hover:shadow-sm cursor-pointer group transition-all"
                  onClick={() => setViewingStudent(s)}
                >
                  <div className="pr-2">
                    <p
                      className="font-medium truncate"
                      title={s.attributes.name}
                    >
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
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfig({
                          isOpen: true,
                          type: "student",
                          entity: s,
                        });
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
          </div>
          {loadingMoreStudents && (
            <div className="flex justify-center py-6">
              <div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </TabsContent>

        {/* ── Teacher Directory ─────────────────────────────────────────── */}
        <TabsContent value="teachers" className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <Input
              placeholder="Search staff..."
              value={searchQueries.teacher}
              onChange={(e) =>
                setSearchQueries({ ...searchQueries, teacher: e.target.value })
              }
              className="sm:w-96"
            />
            <Button
              onClick={() => {
                setEditing({ ...editing, teacher: null });
                setModals({ ...modals, teacher: true });
              }}
            >
              <Plus className="mr-2 h-4 w-4" /> Add Staff
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
            {teachers
              .filter((t) =>
                t.attributes.name
                  .toLowerCase()
                  .includes(searchQueries.teacher.toLowerCase()),
              )
              .sort((a, b) => {
                if (
                  a.attributes.type === "Principal" &&
                  b.attributes.type !== "Principal"
                )
                  return -1;
                if (
                  b.attributes.type === "Principal" &&
                  a.attributes.type !== "Principal"
                )
                  return 1;
                return 0;
              })
              .map((t) => (
                <Card
                  key={t.id}
                  className={`cursor-pointer hover:border-primary transition-colors group relative ${t.attributes.type === "Principal" ? "border-primary/50 bg-primary/5" : ""}`}
                  onClick={() => setViewingTeacher(t)}
                >
                  <CardHeader className="flex flex-row justify-between pb-2">
                    <CardTitle className="text-lg pr-14">
                      {t.attributes.name}
                    </CardTitle>
                    <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      <Button
                        variant="secondary"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditing({ ...editing, teacher: t });
                          setModals({ ...modals, teacher: true });
                        }}
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfig({
                            isOpen: true,
                            type: "teacher",
                            entity: t,
                          });
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="relative">
                    <p className="text-sm text-muted-foreground">
                      {t.attributes.employee_code}
                    </p>
                    {t.attributes.type === "Principal" && (
                      <div className="absolute bottom-0 right-0">
                        <span className="inline-flex items-center rounded-tl-md rounded-br-md bg-gradient-to-r from-blue-800 via-indigo-900 to-purple-900 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-200 shadow-md shadow-indigo-900/30 ring-1 ring-inset ring-amber-400/30">
                          Principal
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* ── Modals ────────────────────────────────────────────────────────── */}
      {modals.class && (
        <ClassroomFormModal
          open={modals.class}
          onOpenChange={(v) => setModals({ ...modals, class: v })}
          classroomId={editing.class?.id}
          onSuccess={fetchClassrooms}
        />
      )}
      {modals.student && (
        <StudentFormModal
          open={modals.student}
          onOpenChange={(v) => setModals({ ...modals, student: v })}
          studentId={editing.student?.id}
          onSuccess={() => fetchStudents(1)}
        />
      )}
      {modals.teacher && (
        <TeacherFormModal
          open={modals.teacher}
          onOpenChange={(v) => setModals({ ...modals, teacher: v })}
          teacherId={editing.teacher?.id}
          onSuccess={fetchTeachers}
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

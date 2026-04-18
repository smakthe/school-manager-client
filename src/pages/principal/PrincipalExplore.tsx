import { useState, useEffect, useMemo } from "react";
import { PageHeader } from "../../components/shared/PageHeader";
import { principalClassroomsApi } from "../../api/principal/classrooms";
import { principalStudentsApi } from "../../api/principal/students";
import { principalTeachersApi } from "../../api/principal/teachers";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "../../components/ui/sheet";
import { Badge } from "../../components/ui/badge";
import { Separator } from "../../components/ui/separator";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "../../components/ui/pagination";
import {
  Search,
  Edit,
  Trash2,
  Plus,
  ChevronRight,
  ArrowLeft,
  GraduationCap,
} from "lucide-react";
import { ClassroomFormModal } from "./modals/ClassroomFormModal";
import { StudentFormModal } from "./modals/StudentFormModal";
import { TeacherFormModal } from "./modals/TeacherFormModal";
import { ConfirmDialog } from "../../components/shared/ConfirmDialog";

export function PrincipalExplore() {
  const [selectedClassroom, setSelectedClassroom] = useState<any | null>(null);

  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [classStudents, setClassStudents] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);

  const [classroomMeta, setClassroomMeta] = useState({
    page: 1,
    pages: 1,
    count: 0,
  });
  const [studentMeta, setStudentMeta] = useState({
    page: 1,
    pages: 1,
    count: 0,
  });
  const [teacherMeta, setTeacherMeta] = useState({
    page: 1,
    pages: 1,
    count: 0,
  });
  const [classStudentMeta, setClassStudentMeta] = useState({
    page: 1,
    pages: 1,
    count: 0,
  });

  const [classroomSearch, setClassroomSearch] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [teacherSearch, setTeacherSearch] = useState("");

  const [isClassroomModalOpen, setIsClassroomModalOpen] = useState(false);
  const [editingClassroom, setEditingClassroom] = useState<any | null>(null);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any | null>(null);
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<any | null>(null);

  const [viewingStudent, setViewingStudent] = useState<any | null>(null);
  const [viewingTeacher, setViewingTeacher] = useState<any | null>(null);

  const [deleteConfig, setDeleteConfig] = useState<{
    isOpen: boolean;
    type: "classroom" | "student" | "teacher" | null;
    entity: any | null;
    loading: boolean;
  }>({ isOpen: false, type: null, entity: null, loading: false });

  // Fetchers
  const fetchClassrooms = async (page = 1) => {
    try {
      const res = await principalClassroomsApi.list(page);
      setClassrooms(res.data);
      setClassroomMeta(res.meta);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStudents = async (page = 1) => {
    try {
      const res = await principalStudentsApi.list(page);
      setStudents(res.data);
      setStudentMeta(res.meta);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTeachers = async (page = 1) => {
    try {
      const res = await principalTeachersApi.list(page);
      setTeachers(res.data);
      setTeacherMeta(res.meta);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchClassStudents = async (page = 1) => {
    if (!selectedClassroom) return;
    try {
      const res = await principalStudentsApi.list(page, selectedClassroom.id);
      setClassStudents(res.data);
      setClassStudentMeta(res.meta);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAll = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchClassrooms(1),
        fetchStudents(1),
        fetchTeachers(1),
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);
  useEffect(() => {
    if (selectedClassroom) fetchClassStudents(1);
  }, [selectedClassroom]);

  const filteredClassrooms = useMemo(
    () =>
      classrooms.filter((c) =>
        c.attributes.display_name
          .toLowerCase()
          .includes(classroomSearch.toLowerCase()),
      ),
    [classrooms, classroomSearch],
  );

  const filteredStudents = useMemo(
    () =>
      students.filter(
        (s) =>
          s.attributes.name
            .toLowerCase()
            .includes(studentSearch.toLowerCase()) ||
          s.attributes.admission_number
            .toLowerCase()
            .includes(studentSearch.toLowerCase()),
      ),
    [students, studentSearch],
  );

  const filteredTeachers = useMemo(
    () =>
      teachers.filter(
        (t) =>
          t.attributes.name
            .toLowerCase()
            .includes(teacherSearch.toLowerCase()) ||
          t.attributes.employee_code
            .toLowerCase()
            .includes(teacherSearch.toLowerCase()),
      ),
    [teachers, teacherSearch],
  );

  const handleDeleteClick = (
    e: React.MouseEvent | null,
    type: typeof deleteConfig.type,
    entity: any,
  ) => {
    if (e) e.stopPropagation();
    setDeleteConfig({ isOpen: true, type, entity, loading: false });
  };

  const confirmDelete = async () => {
    if (!deleteConfig.entity) return;
    setDeleteConfig((prev) => ({ ...prev, loading: true }));
    try {
      if (deleteConfig.type === "classroom") {
        await principalClassroomsApi.delete(deleteConfig.entity.id);
        if (selectedClassroom?.id === deleteConfig.entity.id)
          setSelectedClassroom(null);
        await fetchClassrooms(classroomMeta.page);
      } else if (deleteConfig.type === "student") {
        await principalStudentsApi.delete(deleteConfig.entity.id);
        await fetchStudents(studentMeta.page);
        if (selectedClassroom) await fetchClassStudents(classStudentMeta.page);
      } else if (deleteConfig.type === "teacher") {
        await principalTeachersApi.delete(deleteConfig.entity.id);
        await fetchTeachers(teacherMeta.page);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDeleteConfig({
        isOpen: false,
        type: null,
        entity: null,
        loading: false,
      });
    }
  };

  const renderPagination = (
    meta: { page: number; pages: number },
    onPageChange: (p: number) => void,
  ) => {
    if (!meta || meta.pages <= 1) return null;
    return (
      <div className="mt-6 mb-2 flex justify-center">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => meta.page > 1 && onPageChange(meta.page - 1)}
                className={
                  meta.page <= 1
                    ? "pointer-events-none opacity-50"
                    : "cursor-pointer"
                }
              />
            </PaginationItem>
            {Array.from({ length: meta.pages }).map((_, i) => {
              const page = i + 1;
              if (
                page === 1 ||
                page === meta.pages ||
                (page >= meta.page - 1 && page <= meta.page + 1)
              ) {
                return (
                  <PaginationItem key={page}>
                    <PaginationLink
                      isActive={page === meta.page}
                      onClick={() => onPageChange(page)}
                      className="cursor-pointer"
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                );
              } else if (page === meta.page - 2 || page === meta.page + 2) {
                return (
                  <PaginationItem key={page}>
                    <span className="px-2">...</span>
                  </PaginationItem>
                );
              }
              return null;
            })}
            <PaginationItem>
              <PaginationNext
                onClick={() =>
                  meta.page < meta.pages && onPageChange(meta.page + 1)
                }
                className={
                  meta.page >= meta.pages
                    ? "pointer-events-none opacity-50"
                    : "cursor-pointer"
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Explore"
        description="Manage classrooms, students, and staff in your school."
      />

      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-sm text-muted-foreground pb-4 border-b">
        <button
          onClick={() => setSelectedClassroom(null)}
          className={`hover:text-primary transition-colors ${!selectedClassroom ? "font-semibold text-foreground" : ""}`}
        >
          All Classrooms
        </button>
        {selectedClassroom && (
          <>
            <ChevronRight className="h-4 w-4" />
            <span className="font-semibold text-foreground">
              Class {selectedClassroom.attributes.display_name}
            </span>
          </>
        )}
      </div>

      {loading && (
        <div className="flex h-40 items-center justify-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* VIEW 1: School-level tabs */}
      {!loading && !selectedClassroom && (
        <Tabs defaultValue="classrooms" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="classrooms">
              Classrooms ({classroomMeta.count || classrooms.length})
            </TabsTrigger>
            <TabsTrigger value="directory">
              Student Directory ({studentMeta.count || students.length})
            </TabsTrigger>
            <TabsTrigger value="staff">
              Staff Directory ({teacherMeta.count || teachers.length})
            </TabsTrigger>
          </TabsList>

          {/* Classrooms */}
          <TabsContent value="classrooms" className="space-y-4 mt-0">
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <div className="relative w-full sm:w-96">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search classrooms..."
                  className="pl-8"
                  value={classroomSearch}
                  onChange={(e) => setClassroomSearch(e.target.value)}
                />
              </div>
              <Button
                onClick={() => {
                  setEditingClassroom(null);
                  setIsClassroomModalOpen(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" /> Add Classroom
              </Button>
            </div>
            <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-5">
              {filteredClassrooms.map((classroom) => (
                <Card
                  key={classroom.id}
                  className="cursor-pointer hover:border-primary transition-colors hover:shadow-md relative group"
                  onClick={() => setSelectedClassroom(classroom)}
                >
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-xl">
                      {classroom.attributes.display_name}
                    </CardTitle>
                    <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="secondary"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingClassroom(classroom);
                          setIsClassroomModalOpen(true);
                        }}
                      >
                        <Edit className="h-3.5 w-3.5 text-primary" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e) =>
                          handleDeleteClick(e, "classroom", classroom)
                        }
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Grade: {classroom.attributes.grade} |{" "}
                      {classroom.attributes.section.toUpperCase()}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
            {renderPagination(classroomMeta, fetchClassrooms)}
          </TabsContent>

          {/* Student Directory */}
          <TabsContent value="directory" className="space-y-4 mt-0">
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <div className="relative w-full sm:w-96">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search students..."
                  className="pl-8"
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                />
              </div>
              <Button
                onClick={() => {
                  setEditingStudent(null);
                  setIsStudentModalOpen(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" /> Add Student
              </Button>
            </div>
            <div className="rounded-md border bg-card divide-y">
              {filteredStudents.map((student) => (
                <div
                  key={student.id}
                  className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors group cursor-pointer"
                  onClick={() => setViewingStudent(student)}
                >
                  <div>
                    <p className="font-medium">{student.attributes.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Adm: {student.attributes.admission_number}
                    </p>
                  </div>
                  <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingStudent(student);
                        setIsStudentModalOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4 text-primary" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => handleDeleteClick(e, "student", student)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            {renderPagination(studentMeta, fetchStudents)}
          </TabsContent>

          {/* Staff Directory */}
          <TabsContent value="staff" className="space-y-4 mt-0">
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <div className="relative w-full sm:w-96">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search staff..."
                  className="pl-8"
                  value={teacherSearch}
                  onChange={(e) => setTeacherSearch(e.target.value)}
                />
              </div>
              <Button
                onClick={() => {
                  setEditingTeacher(null);
                  setIsTeacherModalOpen(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" /> Add Staff
              </Button>
            </div>
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
              {filteredTeachers.map((teacher) => (
                <Card
                  key={teacher.id}
                  className="cursor-pointer hover:border-primary transition-colors hover:shadow-md relative group"
                  onClick={() => setViewingTeacher(teacher)}
                >
                  <CardHeader className="flex flex-row items-start justify-between pb-2">
                    <CardTitle className="text-lg font-bold">
                      {teacher.attributes.name}
                    </CardTitle>
                    <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="secondary"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingTeacher(teacher);
                          setIsTeacherModalOpen(true);
                        }}
                      >
                        <Edit className="h-3.5 w-3.5 text-primary" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e) =>
                          handleDeleteClick(e, "teacher", teacher)
                        }
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {teacher.attributes.employee_code}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
            {renderPagination(teacherMeta, fetchTeachers)}
          </TabsContent>
        </Tabs>
      )}

      {/* VIEW 2: Classroom drill-down */}
      {!loading && selectedClassroom && (
        <div className="space-y-4">
          <Button
            variant="ghost"
            onClick={() => setSelectedClassroom(null)}
            className="-ml-4 mb-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to All Classrooms
          </Button>
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search students in class..."
                className="pl-8"
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="rounded-md border bg-card divide-y">
            {classStudents
              .filter(
                (s) =>
                  s.attributes.name
                    .toLowerCase()
                    .includes(studentSearch.toLowerCase()) ||
                  s.attributes.admission_number
                    .toLowerCase()
                    .includes(studentSearch.toLowerCase()),
              )
              .map((student) => (
                <div
                  key={student.id}
                  className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors group cursor-pointer"
                  onClick={() => setViewingStudent(student)}
                >
                  <div>
                    <p className="font-medium">{student.attributes.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Adm: {student.attributes.admission_number}
                    </p>
                  </div>
                </div>
              ))}
          </div>
          {renderPagination(classStudentMeta, fetchClassStudents)}
        </div>
      )}

      {/* Student Slide-Out */}
      <Sheet
        open={!!viewingStudent}
        onOpenChange={(o) => !o && setViewingStudent(null)}
      >
        <SheetContent>
          <SheetHeader>
            <SheetTitle className="text-xl">
              {viewingStudent?.attributes.name}
            </SheetTitle>
            <SheetDescription>
              {viewingStudent?.attributes.admission_number}
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <Separator />
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Gender</p>
                <p className="font-medium capitalize">
                  {viewingStudent?.attributes.gender}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Date of Birth</p>
                <p className="font-medium">
                  {viewingStudent?.attributes.dob || "—"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Status</p>
                <Badge
                  variant={
                    viewingStudent?.attributes.is_active
                      ? "default"
                      : "secondary"
                  }
                >
                  {viewingStudent?.attributes.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Teacher Slide-Out */}
      <Sheet
        open={!!viewingTeacher}
        onOpenChange={(o) => !o && setViewingTeacher(null)}
      >
        <SheetContent>
          <SheetHeader>
            <SheetTitle className="text-xl flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              {viewingTeacher?.attributes.name}
            </SheetTitle>
            <SheetDescription>
              {viewingTeacher?.attributes.employee_code}
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <Separator />
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Salary</p>
                <p className="font-medium">
                  ₹{viewingTeacher?.attributes.salary?.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Date of Joining</p>
                <p className="font-medium">
                  {viewingTeacher?.attributes.doj || "—"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Status</p>
                <Badge
                  variant={
                    viewingTeacher?.attributes.is_active
                      ? "default"
                      : "secondary"
                  }
                >
                  {viewingTeacher?.attributes.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Modals */}
      {isClassroomModalOpen && (
        <ClassroomFormModal
          open={isClassroomModalOpen}
          onOpenChange={setIsClassroomModalOpen}
          classroomId={editingClassroom?.id || null}
          onSuccess={() => fetchClassrooms(classroomMeta.page)}
        />
      )}
      {isStudentModalOpen && (
        <StudentFormModal
          open={isStudentModalOpen}
          onOpenChange={setIsStudentModalOpen}
          studentId={editingStudent?.id || null}
          onSuccess={() => fetchStudents(studentMeta.page)}
        />
      )}
      {isTeacherModalOpen && (
        <TeacherFormModal
          open={isTeacherModalOpen}
          onOpenChange={setIsTeacherModalOpen}
          teacherId={editingTeacher?.id || null}
          onSuccess={() => fetchTeachers(teacherMeta.page)}
        />
      )}

      <ConfirmDialog
        open={deleteConfig.isOpen}
        onCancel={() =>
          setDeleteConfig({
            isOpen: false,
            type: null,
            entity: null,
            loading: false,
          })
        }
        onConfirm={confirmDelete}
        title={`Delete ${deleteConfig.type}?`}
        description={`This action cannot be undone. The ${deleteConfig.type} will be permanently removed.`}
        isDeleting={deleteConfig.loading}
      />
    </div>
  );
}

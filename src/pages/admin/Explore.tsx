import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { PageHeader } from "../../components/shared/PageHeader";
import { schoolsApi } from "../../api/admin/schools";
import { classroomsApi } from "../../api/admin/classrooms";
import { studentsApi } from "../../api/admin/students";
import { teachersApi } from "../../api/admin/teachers";
import { apiFetch } from "../../api/client";
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
  Users,
  ChevronRight,
  ArrowLeft,
  GraduationCap,
  Search,
  Edit,
  Trash2,
  Plus,
  Calendar,
  CreditCard,
  BookOpen,
  UserPlus,
} from "lucide-react";

// Modals
import { SchoolFormModal } from "./schools/SchoolFormModal";
import { ClassroomFormModal } from "./classrooms/ClassroomFormModal";
import { StudentFormModal } from "./students/StudentFormModal";
import { TeacherFormModal } from "./teachers/TeacherFormModal";
import { ConfirmDialog } from "../../components/shared/ConfirmDialog";

export function Explore() {
  // Navigation State
  const [selectedSchool, setSelectedSchool] = useState<any | null>(null);
  const [selectedClassroom, setSelectedClassroom] = useState<any | null>(null);

  // Data State
  const [schools, setSchools] = useState<any[]>([]);
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [schoolStudents, setSchoolStudents] = useState<any[]>([]);
  const [schoolTeachers, setSchoolTeachers] = useState<any[]>([]);

  const [classStudents, setClassStudents] = useState<any[]>([]);
  const [classTeacher, setClassTeacher] = useState<any | null>(null);
  const [classAssignments, setClassAssignments] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadingMoreSchools, setLoadingMoreSchools] = useState(false);
  const [loadingMoreSchoolStudents, setLoadingMoreSchoolStudents] =
    useState(false);

  // Meta States (Counts & Pages)
  const [schoolMeta, setSchoolMeta] = useState<any>({ page: 1, pages: 1 });
  const [classroomMeta, setClassroomMeta] = useState<any>({
    page: 1,
    pages: 1,
    count: 0,
  });
  const [schoolStudentMeta, setSchoolStudentMeta] = useState<any>({
    page: 1,
    pages: 1,
  });
  const [schoolTeacherMeta, setSchoolTeacherMeta] = useState<any>({
    page: 1,
    pages: 1,
    count: 0,
  });
  const [classStudentMeta, setClassStudentMeta] = useState<any>({
    page: 1,
    pages: 1,
    count: 0,
  });

  // Search States
  const [schoolSearchQuery, setSchoolSearchQuery] = useState("");
  const [classroomSearchQuery, setClassroomSearchQuery] = useState("");
  const [studentSearchQuery, setStudentSearchQuery] = useState("");
  const [teacherSearchQuery, setTeacherSearchQuery] = useState("");

  // Modal States
  const [isSchoolModalOpen, setIsSchoolModalOpen] = useState(false);
  const [editingSchool, setEditingSchool] = useState<any | null>(null);
  const [isClassroomModalOpen, setIsClassroomModalOpen] = useState(false);
  const [editingClassroom, setEditingClassroom] = useState<any | null>(null);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any | null>(null);
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<any | null>(null);

  // Slide-Out States
  const [viewingStudent, setViewingStudent] = useState<any | null>(null);
  const [viewingTeacher, setViewingTeacher] = useState<any | null>(null);

  // Unified Delete State
  const [deleteConfig, setDeleteConfig] = useState<{
    isOpen: boolean;
    type: "school" | "classroom" | "student" | "teacher" | "assignment" | null;
    entity: any | null;
    loading: boolean;
  }>({ isOpen: false, type: null, entity: null, loading: false });

  // --- Infinite Scroll Logic for Schools ---
  const observerSchools = useRef<IntersectionObserver | null>(null);
  const isFetchingSchoolsRef = useRef(false);

  const lastSchoolElementRef = useCallback(
    (node: HTMLDivElement) => {
      if (observerSchools.current) observerSchools.current.disconnect();

      observerSchools.current = new IntersectionObserver((entries) => {
        if (
          entries[0].isIntersecting &&
          !isFetchingSchoolsRef.current &&
          schoolMeta.page < schoolMeta.pages
        ) {
          fetchSchools(schoolMeta.page + 1);
        }
      });

      if (node) observerSchools.current.observe(node);
    },
    [schoolMeta.page, schoolMeta.pages],
  );

  // --- Infinite Scroll Logic for School Students Directory ---
  const observerSchoolStudents = useRef<IntersectionObserver | null>(null);
  const isFetchingSchoolStudentsRef = useRef(false);

  const lastSchoolStudentElementRef = useCallback(
    (node: HTMLDivElement) => {
      if (observerSchoolStudents.current)
        observerSchoolStudents.current.disconnect();

      observerSchoolStudents.current = new IntersectionObserver((entries) => {
        if (
          entries[0].isIntersecting &&
          !isFetchingSchoolStudentsRef.current &&
          schoolStudentMeta.page < schoolStudentMeta.pages
        ) {
          fetchSchoolStudents(schoolStudentMeta.page + 1);
        }
      });

      if (node) observerSchoolStudents.current.observe(node);
    },
    [schoolStudentMeta.page, schoolStudentMeta.pages],
  );

  // --- Fetchers ---
  const fetchSchools = async (page = 1) => {
    isFetchingSchoolsRef.current = true;

    if (page === 1) setLoading(true);
    else setLoadingMoreSchools(true);

    try {
      const res = await schoolsApi.list(page);
      if (page === 1) {
        setSchools(res.data);
      } else {
        setSchools((prev) => {
          const existingIds = new Set(prev.map((s) => s.id));
          const newSchools = res.data.filter(
            (s: any) => !existingIds.has(s.id),
          );
          return [...prev, ...newSchools];
        });
      }
      setSchoolMeta(res.meta);
    } catch (err) {
      console.error("Failed to fetch schools", err);
    } finally {
      setLoading(false);
      setLoadingMoreSchools(false);
      isFetchingSchoolsRef.current = false;
    }
  };

  const fetchClassrooms = async () => {
    if (!selectedSchool) return;
    try {
      let allData: any[] = [];
      let currentPage = 1;
      let totalPages = 1;

      do {
        const res = await classroomsApi.list(currentPage, selectedSchool.id);
        allData = [...allData, ...res.data];
        totalPages = res.meta.pages || 1;
        currentPage++;
      } while (currentPage <= totalPages);

      setClassrooms(allData);
      setClassroomMeta({ page: 1, pages: 1, count: allData.length });
    } catch (err) {
      console.error("Failed to fetch classrooms", err);
    }
  };

  const fetchSchoolTeachers = async () => {
    if (!selectedSchool) return;
    try {
      let allData: any[] = [];
      let currentPage = 1;
      let totalPages = 1;

      do {
        const res = await teachersApi.list(currentPage, selectedSchool.id);
        allData = [...allData, ...res.data];
        totalPages = res.meta.pages || 1;
        currentPage++;
      } while (currentPage <= totalPages);

      setSchoolTeachers(allData);
      setSchoolTeacherMeta({ page: 1, pages: 1, count: allData.length });
    } catch (err) {
      console.error("Failed to fetch teachers", err);
    }
  };

  const fetchSchoolStudents = async (page = 1) => {
    if (!selectedSchool) return;
    isFetchingSchoolStudentsRef.current = true;

    if (page > 1) setLoadingMoreSchoolStudents(true);

    try {
      const res = await studentsApi.list(page, selectedSchool.id);
      if (page === 1) {
        setSchoolStudents(res.data);
      } else {
        setSchoolStudents((prev) => {
          const existingIds = new Set(prev.map((s) => s.id));
          const newStudents = res.data.filter(
            (s: any) => !existingIds.has(s.id),
          );
          return [...prev, ...newStudents];
        });
      }
      setSchoolStudentMeta(res.meta);
    } catch (err) {
      console.error(err);
    } finally {
      if (page > 1) setLoadingMoreSchoolStudents(false);
      isFetchingSchoolStudentsRef.current = false;
    }
  };

  const fetchSchoolLevelData = async () => {
    if (!selectedSchool) return;
    setLoading(true);
    try {
      await Promise.all([
        fetchClassrooms(),
        fetchSchoolStudents(1),
        fetchSchoolTeachers(),
      ]);
    } catch (err) {
      console.error("Failed to fetch school data", err);
    } finally {
      setLoading(false);
    }
  };

  // --- UPDATED: Load ALL Class Students at once ---
  const fetchClassStudents = async () => {
    if (!selectedSchool || !selectedClassroom) return;
    try {
      let allData: any[] = [];
      let currentPage = 1;
      let totalPages = 1;

      do {
        const res = await studentsApi.list(
          currentPage,
          selectedSchool.id,
          selectedClassroom.id,
        );
        allData = [...allData, ...res.data];
        totalPages = res.meta.pages || 1;
        currentPage++;
      } while (currentPage <= totalPages);

      setClassStudents(allData);
      setClassStudentMeta({ page: 1, pages: 1, count: allData.length });
    } catch (err) {
      console.error("Failed to fetch class students", err);
    }
  };

  const fetchClassDetails = async () => {
    if (!selectedSchool || !selectedClassroom) return;
    setLoading(true);
    try {
      await fetchClassStudents(); // Fetches all enrolled students

      const teacherId = selectedClassroom.attributes.class_teacher_id;
      setClassTeacher(
        teacherId ? (await teachersApi.get(teacherId)).data : null,
      );

      try {
        const assignmentsRes = await apiFetch<any>(
          `/admin/teacher_subject_assignments?classroom_id=${selectedClassroom.id}`,
        );
        setClassAssignments(assignmentsRes.data || []);
      } catch (e) {
        console.warn(
          "TeacherSubjectAssignments API not ready yet on backend",
          e,
        );
        setClassAssignments([]);
      }
    } catch (err) {
      console.error("Failed to fetch class details", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchools(1);
  }, []);

  useEffect(() => {
    fetchSchoolLevelData();
  }, [selectedSchool]);

  useEffect(() => {
    fetchClassDetails();
  }, [selectedClassroom]);

  // --- Local Page Filters ---
  const filteredSchools = useMemo(
    () =>
      schools.filter(
        (s) =>
          s.attributes.name
            .toLowerCase()
            .includes(schoolSearchQuery.toLowerCase()) ||
          s.attributes.subdomain
            .toLowerCase()
            .includes(schoolSearchQuery.toLowerCase()),
      ),
    [schools, schoolSearchQuery],
  );
  const filteredClassrooms = useMemo(
    () =>
      classrooms.filter((c) =>
        c.attributes.display_name
          .toLowerCase()
          .includes(classroomSearchQuery.toLowerCase()),
      ),
    [classrooms, classroomSearchQuery],
  );
  const filteredSchoolStudents = useMemo(
    () =>
      schoolStudents.filter(
        (s) =>
          s.attributes.name
            .toLowerCase()
            .includes(studentSearchQuery.toLowerCase()) ||
          s.attributes.admission_number
            .toLowerCase()
            .includes(studentSearchQuery.toLowerCase()),
      ),
    [schoolStudents, studentSearchQuery],
  );
  const filteredSchoolTeachers = useMemo(
    () =>
      schoolTeachers.filter(
        (t) =>
          t.attributes.name
            .toLowerCase()
            .includes(teacherSearchQuery.toLowerCase()) ||
          t.attributes.employee_code
            .toLowerCase()
            .includes(teacherSearchQuery.toLowerCase()),
      ),
    [schoolTeachers, teacherSearchQuery],
  );
  const filteredClassStudents = useMemo(
    () =>
      classStudents.filter(
        (s) =>
          s.attributes.name
            .toLowerCase()
            .includes(studentSearchQuery.toLowerCase()) ||
          s.attributes.admission_number
            .toLowerCase()
            .includes(studentSearchQuery.toLowerCase()),
      ),
    [classStudents, studentSearchQuery],
  );

  // --- Action Handlers ---
  const handleEdit = (
    e: React.MouseEvent | null,
    type: "school" | "classroom" | "student" | "teacher",
    entity: any,
  ) => {
    if (e) e.stopPropagation();
    switch (type) {
      case "school":
        setEditingSchool(entity);
        setIsSchoolModalOpen(true);
        break;
      case "classroom":
        setEditingClassroom(entity);
        setIsClassroomModalOpen(true);
        break;
      case "student":
        setEditingStudent(entity);
        setIsStudentModalOpen(true);
        break;
      case "teacher":
        setEditingTeacher(entity);
        setIsTeacherModalOpen(true);
        break;
    }
  };

  const handleCreate = (
    type: "school" | "classroom" | "student" | "teacher" | "assignment",
  ) => {
    switch (type) {
      case "school":
        setEditingSchool(null);
        setIsSchoolModalOpen(true);
        break;
      case "classroom":
        setEditingClassroom(null);
        setIsClassroomModalOpen(true);
        break;
      case "student":
        setEditingStudent(null);
        setIsStudentModalOpen(true);
        break;
      case "teacher":
        setEditingTeacher(null);
        setIsTeacherModalOpen(true);
        break;
    }
  };

  const handleDeleteClick = (
    e: React.MouseEvent | null,
    type: "school" | "classroom" | "student" | "teacher" | "assignment",
    entity: any,
  ) => {
    if (e) e.stopPropagation();
    setDeleteConfig({ isOpen: true, type, entity, loading: false });
  };

  const confirmDelete = async () => {
    if (!deleteConfig.entity) return;
    setDeleteConfig((prev) => ({ ...prev, loading: true }));
    try {
      if (deleteConfig.type === "school") {
        await schoolsApi.delete(deleteConfig.entity.id);
        await fetchSchools(1);
        if (selectedSchool?.id === deleteConfig.entity.id) {
          setSelectedSchool(null);
          setSelectedClassroom(null);
        }
      } else if (deleteConfig.type === "classroom") {
        await classroomsApi.delete(deleteConfig.entity.id);
        await fetchClassrooms();
        if (selectedClassroom?.id === deleteConfig.entity.id)
          setSelectedClassroom(null);
      } else if (deleteConfig.type === "student") {
        await studentsApi.delete(deleteConfig.entity.id);
        if (selectedClassroom) await fetchClassStudents(); // Refresh all class students
        await fetchSchoolStudents(1);
      } else if (deleteConfig.type === "teacher") {
        await teachersApi.delete(deleteConfig.entity.id);
        if (selectedClassroom) await fetchClassDetails();
        await fetchSchoolTeachers();
      } else if (deleteConfig.type === "assignment") {
        await apiFetch(
          `/admin/teacher_subject_assignments/${deleteConfig.entity.id}`,
          { method: "DELETE" },
        );
        await fetchClassDetails();
      }
    } catch (err) {
      console.error(`Failed to delete ${deleteConfig.type}`, err);
    } finally {
      setDeleteConfig({
        isOpen: false,
        type: null,
        entity: null,
        loading: false,
      });
    }
  };

  return (
    <div className="space-y-6 relative pb-12">
      <PageHeader
        title="Explore"
        description="Manage schools, classrooms and personnel."
      />

      <div className="flex items-center space-x-2 text-sm text-muted-foreground pb-4 border-b">
        <button
          onClick={() => {
            setSelectedSchool(null);
            setSelectedClassroom(null);
          }}
          className={`hover:text-primary transition-colors ${!selectedSchool ? "font-semibold text-foreground" : ""}`}
        >
          All Schools
        </button>
        {selectedSchool && (
          <>
            <ChevronRight className="h-4 w-4" />
            <button
              onClick={() => setSelectedClassroom(null)}
              className={`hover:text-primary transition-colors ${!selectedClassroom ? "font-semibold text-foreground" : ""}`}
            >
              {selectedSchool.attributes.name}
            </button>
          </>
        )}
        {selectedClassroom && (
          <>
            <ChevronRight className="h-4 w-4" />
            <span className="font-semibold text-foreground">
              Class {selectedClassroom.attributes.display_name}
            </span>
          </>
        )}
      </div>

      {loading && !loadingMoreSchools && (
        <div className="flex h-40 items-center justify-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {/* VIEW 1: SCHOOLS (Infinite Scroll) */}
      {!loading && !selectedSchool && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search schools..."
                className="pl-8"
                value={schoolSearchQuery}
                onChange={(e) => setSchoolSearchQuery(e.target.value)}
              />
            </div>
            <Button onClick={() => handleCreate("school")}>
              <Plus className="mr-2 h-4 w-4" /> Add School
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
            {filteredSchools.map((school, index) => {
              const isLastElement = filteredSchools.length === index + 1;
              const cardContent = (
                <Card
                  className="cursor-pointer hover:border-primary transition-colors hover:shadow-md relative group h-full"
                  onClick={() => setSelectedSchool(school)}
                >
                  <CardHeader className="flex flex-row items-start justify-between pb-2">
                    <CardTitle className="text-lg font-bold pr-16 leading-tight">
                      {school.attributes.name}
                    </CardTitle>
                    <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="secondary"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e) => handleEdit(e, "school", school)}
                      >
                        <Edit className="h-3.5 w-3.5 text-primary" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e) => handleDeleteClick(e, "school", school)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {school.attributes.board.toUpperCase()} Board
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {school.attributes.subdomain}.school.com
                    </p>
                  </CardContent>
                </Card>
              );

              if (isLastElement)
                return (
                  <div ref={lastSchoolElementRef} key={school.id}>
                    {cardContent}
                  </div>
                );
              return <div key={school.id}>{cardContent}</div>;
            })}
          </div>

          {loadingMoreSchools && (
            <div className="flex justify-center py-6">
              <div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: SCHOOL TABS */}
      {!loading && selectedSchool && !selectedClassroom && (
        <div className="space-y-4">
          <Button
            variant="ghost"
            onClick={() => setSelectedSchool(null)}
            className="-ml-4 mb-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Schools
          </Button>

          <Tabs defaultValue="classrooms" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="classrooms">
                Classrooms ({classrooms.length})
              </TabsTrigger>
              <TabsTrigger value="directory">
                Student Directory (
                {schoolStudentMeta.count || schoolStudents.length})
              </TabsTrigger>
              <TabsTrigger value="staff">
                Staff Directory ({schoolTeachers.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="classrooms" className="space-y-4 mt-0">
              <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div className="relative w-full sm:w-96">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search classrooms..."
                    className="pl-8"
                    value={classroomSearchQuery}
                    onChange={(e) => setClassroomSearchQuery(e.target.value)}
                  />
                </div>
                <Button onClick={() => handleCreate("classroom")}>
                  <Plus className="mr-2 h-4 w-4" /> Add Classroom
                </Button>
              </div>

              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
                          onClick={(e) => handleEdit(e, "classroom", classroom)}
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
                      <div className="space-y-1.5 mt-4 pt-4 border-t border-dashed">
                        <p className="text-sm flex justify-between items-center">
                          <span className="text-muted-foreground">
                            Class Teacher:
                          </span>
                          <span className="font-medium truncate ml-2 text-right">
                            {classroom.attributes.class_teacher?.name ||
                              "Not Assigned"}
                          </span>
                        </p>
                        <p className="text-sm flex justify-between items-center">
                          <span className="text-muted-foreground">
                            Students:
                          </span>
                          <span className="font-medium">
                            {classroom.attributes.students_count || 0}
                          </span>
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="directory" className="space-y-4 mt-0">
              <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div className="relative w-full sm:w-96">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search all students..."
                    className="pl-8"
                    value={studentSearchQuery}
                    onChange={(e) => setStudentSearchQuery(e.target.value)}
                  />
                </div>
                <Button onClick={() => handleCreate("student")}>
                  <Plus className="mr-2 h-4 w-4" /> Add Student
                </Button>
              </div>
              <div className="rounded-md border bg-card divide-y">
                {filteredSchoolStudents.map((student, index) => {
                  const isLastElement =
                    filteredSchoolStudents.length === index + 1;
                  const rowContent = (
                    <div
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
                          onClick={(e) => handleEdit(e, "student", student)}
                        >
                          <Edit className="h-4 w-4 text-primary" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) =>
                            handleDeleteClick(e, "student", student)
                          }
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  );

                  if (isLastElement)
                    return (
                      <div ref={lastSchoolStudentElementRef} key={student.id}>
                        {rowContent}
                      </div>
                    );
                  return <div key={student.id}>{rowContent}</div>;
                })}
              </div>

              {loadingMoreSchoolStudents && (
                <div className="flex justify-center py-6">
                  <div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="staff" className="space-y-4 mt-0">
              <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div className="relative w-full sm:w-96">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search staff..."
                    className="pl-8"
                    value={teacherSearchQuery}
                    onChange={(e) => setTeacherSearchQuery(e.target.value)}
                  />
                </div>
                <Button onClick={() => handleCreate("teacher")}>
                  <Plus className="mr-2 h-4 w-4" /> Add Staff
                </Button>
              </div>
              <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
                {filteredSchoolTeachers.map((teacher) => (
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
                          onClick={(e) => handleEdit(e, "teacher", teacher)}
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
                        ID: {teacher.attributes.employee_code}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* VIEW 3: CLASS DETAILS */}
      {!loading && selectedClassroom && (
        <div className="space-y-8">
          <Button
            variant="ghost"
            onClick={() => setSelectedClassroom(null)}
            className="-ml-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Classrooms
          </Button>

          <div className="grid gap-6 md:grid-cols-2">
            <Card
              className="bg-primary/5 border-primary/20 relative group cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => classTeacher && setViewingTeacher(classTeacher)}
            >
              {classTeacher && (
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={(e) => handleEdit(e, "teacher", classTeacher)}
                  >
                    <Edit className="mr-2 h-4 w-4 text-primary" /> Edit
                  </Button>
                </div>
              )}
              <CardContent className="flex items-center gap-4 p-6">
                <div className="p-3 bg-primary/10 rounded-full">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">
                    Class Teacher (Homeroom)
                  </h3>
                  <p className="text-muted-foreground">
                    {classTeacher
                      ? `${classTeacher.attributes.name} (${classTeacher.attributes.employee_code})`
                      : "No teacher assigned."}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center justify-around p-6">
                <div className="text-center">
                  <p className="text-3xl font-bold">{classStudents.length}</p>
                  <p className="text-sm text-muted-foreground">Students</p>
                </div>
                <Separator orientation="vertical" className="h-12" />
                <div className="text-center">
                  <p className="text-3xl font-bold">
                    {classAssignments.length}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Subjects Assigned
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <BookOpen className="h-5 w-5" /> Subject Teachers
              </h3>
              <Button
                variant="outline"
                onClick={() => handleCreate("assignment")}
              >
                <UserPlus className="mr-2 h-4 w-4" /> Assign Subject
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {classAssignments.map((assignment) => (
                <Card key={assignment.id} className="relative group">
                  <div className="absolute top-2 right-2 flex opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={(e) =>
                        handleDeleteClick(e, "assignment", assignment)
                      }
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-base">
                      {assignment.attributes.subject?.name || "Subject"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 text-sm text-muted-foreground">
                    Taught by:{" "}
                    <span className="font-medium text-foreground">
                      {assignment.attributes.teacher?.name || "Unknown"}
                    </span>
                  </CardContent>
                </Card>
              ))}
              {classAssignments.length === 0 && (
                <div className="col-span-full py-8 text-center text-muted-foreground border-2 border-dashed rounded-lg bg-muted/20">
                  <p>No subject teachers assigned yet.</p>
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <GraduationCap className="h-5 w-5" /> Enrolled Students
              </h3>
              <div className="flex gap-4 w-full sm:w-auto">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search students..."
                    className="pl-8"
                    value={studentSearchQuery}
                    onChange={(e) => setStudentSearchQuery(e.target.value)}
                  />
                </div>
                <Button onClick={() => handleCreate("student")}>
                  <Plus className="mr-2 h-4 w-4" /> Add
                </Button>
              </div>
            </div>

            <div className="rounded-md border bg-card divide-y">
              {filteredClassStudents.map((student) => (
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
                      onClick={(e) => handleEdit(e, "student", student)}
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
          </div>
        </div>
      )}

      {/* --- Slide-Out Deep Profiles --- */}
      <Sheet
        open={!!viewingStudent}
        onOpenChange={(open) => !open && setViewingStudent(null)}
      >
        <SheetContent className="sm:max-w-[500px] overflow-y-auto">
          {viewingStudent && (
            <>
              <SheetHeader className="pb-6 border-b">
                <SheetTitle className="text-2xl flex items-center gap-2">
                  <GraduationCap className="h-6 w-6 text-primary" />
                  {viewingStudent.attributes.name}
                </SheetTitle>
                <SheetDescription>
                  Admission No: {viewingStudent.attributes.admission_number}
                </SheetDescription>
                <div className="flex gap-2 mt-4">
                  <Badge
                    variant={
                      viewingStudent.attributes.is_active
                        ? "default"
                        : "secondary"
                    }
                  >
                    {viewingStudent.attributes.is_active
                      ? "Active"
                      : "Inactive"}
                  </Badge>
                  <Badge variant="outline" className="capitalize">
                    {viewingStudent.attributes.gender}
                  </Badge>
                </div>
              </SheetHeader>

              <Tabs defaultValue="profile" className="mt-6">
                <TabsList className="w-full">
                  <TabsTrigger value="profile" className="flex-1">
                    Profile
                  </TabsTrigger>
                  <TabsTrigger value="academic" className="flex-1">
                    Academic Record
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="profile" className="space-y-6 mt-6">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground mb-1">
                        Date of Birth
                      </p>
                      <p className="font-medium flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {new Date(
                          viewingStudent.attributes.dob,
                        ).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setViewingStudent(null);
                        handleEdit(null, "student", viewingStudent);
                      }}
                    >
                      Edit Profile
                    </Button>
                  </div>
                </TabsContent>
                <TabsContent value="academic" className="mt-6">
                  <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground border-2 border-dashed rounded-lg">
                    <BookOpen className="h-10 w-10 mb-4 opacity-20" />
                    <p>Academic records will be displayed here.</p>
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}
        </SheetContent>
      </Sheet>

      <Sheet
        open={!!viewingTeacher}
        onOpenChange={(open) => !open && setViewingTeacher(null)}
      >
        <SheetContent className="sm:max-w-[500px] overflow-y-auto">
          {viewingTeacher && (
            <>
              <SheetHeader className="pb-6 border-b">
                <SheetTitle className="text-2xl flex items-center gap-2">
                  <Users className="h-6 w-6 text-primary" />
                  {viewingTeacher.attributes.name}
                </SheetTitle>
                <SheetDescription>
                  Employee ID: {viewingTeacher.attributes.employee_code}
                </SheetDescription>
              </SheetHeader>
              <Tabs defaultValue="profile" className="mt-6">
                <TabsList className="w-full">
                  <TabsTrigger value="profile" className="flex-1">
                    Profile
                  </TabsTrigger>
                  <TabsTrigger value="assignments" className="flex-1">
                    Assignments
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="profile" className="space-y-6 mt-6">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground mb-1">Base Salary</p>
                      <p className="font-medium flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />₹
                        {viewingTeacher.attributes.salary?.toLocaleString() ||
                          "N/A"}
                      </p>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setViewingTeacher(null);
                        handleEdit(null, "teacher", viewingTeacher);
                      }}
                    >
                      Edit Profile
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* --- Dynamic Modals & Dialogs --- */}
      {isSchoolModalOpen && (
        <SchoolFormModal
          open={isSchoolModalOpen}
          onOpenChange={setIsSchoolModalOpen}
          schoolId={editingSchool?.id || null}
          onSuccess={() => fetchSchools(schoolMeta.page)}
        />
      )}

      {isClassroomModalOpen && (
        <ClassroomFormModal
          open={isClassroomModalOpen}
          onOpenChange={setIsClassroomModalOpen}
          classroomId={editingClassroom?.id || null}
          onSuccess={fetchClassrooms}
        />
      )}

      {isStudentModalOpen && (
        <StudentFormModal
          open={isStudentModalOpen}
          onOpenChange={setIsStudentModalOpen}
          studentId={editingStudent?.id || null}
          onSuccess={() => {
            if (selectedClassroom) fetchClassStudents();
            fetchSchoolStudents(1);
          }}
        />
      )}
      {isTeacherModalOpen && (
        <TeacherFormModal
          open={isTeacherModalOpen}
          onOpenChange={setIsTeacherModalOpen}
          teacherId={editingTeacher?.id || null}
          onSuccess={() => {
            if (selectedClassroom) fetchClassDetails();
            fetchSchoolTeachers();
          }}
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
        title={`Delete ${deleteConfig.type}`}
        description="Are you sure? This action cannot be undone."
        isDeleting={deleteConfig.loading}
      />
    </div>
  );
}

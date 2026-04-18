import { useState, useEffect, useMemo } from "react";
import { PageHeader } from "../../components/shared/PageHeader";
import { useTeacherStore } from "../../stores/teacherStore";
import { teacherDashboardApi } from "../../api/teacher/dashboard";
import { teacherStudentsApi } from "../../api/teacher/students";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "../../components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../components/ui/dialog";
import { Label } from "../../components/ui/label";
import { Badge } from "../../components/ui/badge";
import { Separator } from "../../components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Checkbox } from "../../components/ui/checkbox";
import { FormError } from "../../components/shared/FormError";
import { toast } from "sonner";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { apiFetch } from "../../api/client";
import {
  Search,
  Edit,
  Users,
  BookOpen,
  Loader2,
  GraduationCap,
  Calendar,
} from "lucide-react";
import type { StudentAttributes, Gender } from "../../types/student";

// ─── Inline edit modal (teacher-permission-restricted fields only) ────────────

interface EditStudentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

// ─── Main Component ──────────────────────────────────────────────────────────

export function TeacherExplore() {
  const { homeroom: storeHomeroom } = useTeacherStore();
  const [homeroom, setHomeroom] = useState<any>(storeHomeroom ?? null);
  const [students, setStudents] = useState<any[]>([]);
  const [meta, setMeta] = useState({ page: 1, pages: 1, count: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [viewingStudent, setViewingStudent] = useState<any | null>(null);
  const [editingStudent, setEditingStudent] = useState<any | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [marks, setMarks] = useState<any[]>([]);
  const [loadingMarks, setLoadingMarks] = useState(false);

  useEffect(() => {
    if (viewingStudent) {
      setLoadingMarks(true);
      apiFetch(`/api/v1/teacher/marks?student_id=${viewingStudent.id}`)
        .then((res: any) => setMarks(res.data || []))
        .catch((err) => console.error("Failed to fetch academic records", err))
        .finally(() => setLoadingMarks(false));
    } else {
      setMarks([]);
    }
  }, [viewingStudent]);

  const formatTerm = (term: string) => {
    if (!term) return "Unknown";
    return term.replace("term", "Term ");
  };

  const fetchStudents = async (page: number, classroomId: string) => {
    try {
      const res = await teacherStudentsApi.list(page, classroomId);
      setStudents(res.data);
      setMeta(res.meta);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // If the store already has homeroom data (user visited Dashboard first),
  // skip the extra API call. Otherwise fetch it.
  useEffect(() => {
    if (storeHomeroom !== undefined) {
      setHomeroom(storeHomeroom);
      if (storeHomeroom) fetchStudents(1, storeHomeroom.id.toString());
      else setLoading(false);
      return;
    }

    const init = async () => {
      setLoading(true);
      try {
        const res = await teacherDashboardApi.getStats();
        const hr = res.homeroom ?? null;
        setHomeroom(hr);
        if (hr) fetchStudents(1, hr.id.toString());
        else setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };
    init();
  }, [storeHomeroom]);

  const filteredStudents = useMemo(
    () =>
      students.filter(
        (s) =>
          s.attributes.name.toLowerCase().includes(search.toLowerCase()) ||
          s.attributes.admission_number
            .toLowerCase()
            .includes(search.toLowerCase()),
      ),
    [students, search],
  );

  // If homeroom is confirmed null (not a class teacher), redirect/show nothing.
  // The Navbar already hides the link, so this URL shouldn't be reachable;
  // a simple loading state covers the brief moment before the store hydrates.
  if (!loading && !homeroom) return null;

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="My Classroom"
        description={
          homeroom ? `Managing Class ${homeroom.display_name}` : "Loading..."
        }
      />

      {/* Homeroom card */}
      {homeroom && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader className="pb-2 flex flex-row items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardDescription>Your Homeroom</CardDescription>
                <CardTitle className="text-2xl">
                  Class {homeroom.display_name}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Grade {homeroom.grade} · Section{" "}
                {homeroom.section?.toUpperCase()}
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
                <CardTitle className="text-2xl">
                  {loading ? "—" : meta.count || students.length}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Enrolled in your class
              </p>
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
                  {loading
                    ? "—"
                    : students.filter((s) => s.attributes.is_active).length}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Currently active</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search bar */}
      <div className="relative w-full sm:w-96">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or admission no..."
          className="pl-8"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Student list */}
      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8">
            {filteredStudents.length === 0 ? (
              <p className="col-span-full py-10 text-center text-muted-foreground">
                No students found.
              </p>
            ) : (
              filteredStudents.map((student) => (
                <div
                  key={student.id}
                  className="relative flex flex-col p-4 border rounded-md bg-card hover:border-primary hover:shadow-sm cursor-pointer group transition-all"
                  onClick={() => setViewingStudent(student)}
                >
                  <div className="pr-2">
                    <p
                      className="font-medium truncate text-sm"
                      title={student.attributes.name}
                    >
                      {student.attributes.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1 truncate">
                      {student.attributes.admission_number}
                    </p>
                  </div>
                  <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-card/90 backdrop-blur-sm rounded-md shadow-sm border border-border/50">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingStudent(student);
                        setIsEditModalOpen(true);
                      }}
                    >
                      <Edit className="h-3.5 w-3.5 text-primary" />
                    </Button>
                  </div>
                  {!student.attributes.is_active && (
                    <Badge
                      variant="secondary"
                      className="mt-2 text-[10px] py-0 h-4 w-fit opacity-70"
                    >
                      Inactive
                    </Badge>
                  )}
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* Student detail slide-out */}
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
                <SheetDescription className="flex flex-col gap-1 mt-2">
                  <span className="text-sm font-semibold text-foreground">
                    Class {viewingStudent.attributes.current_class_display}
                  </span>
                  <span>
                    Admission No: {viewingStudent.attributes.admission_number}
                  </span>
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
                        {viewingStudent.attributes.dob
                          ? new Date(
                              viewingStudent.attributes.dob,
                            ).toLocaleDateString()
                          : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">Classroom</p>
                      <p className="font-medium">
                        Class {homeroom?.display_name}
                      </p>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditingStudent(viewingStudent);
                        setIsEditModalOpen(true);
                        setViewingStudent(null);
                      }}
                    >
                      <Edit className="mr-2 h-4 w-4" /> Edit Profile
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="academic" className="mt-6">
                  {loadingMarks ? (
                    <div className="flex justify-center py-12">
                      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  ) : marks.length > 0 ? (
                    <div className="rounded-md border bg-card">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-[11px] uppercase tracking-wider">
                              Term
                            </TableHead>
                            <TableHead className="text-[11px] uppercase tracking-wider">
                              Subject
                            </TableHead>
                            <TableHead className="text-right text-[11px] uppercase tracking-wider">
                              Score
                            </TableHead>
                            <TableHead className="text-right text-[11px] uppercase tracking-wider">
                              %
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {marks.map((mark: any) => (
                            <TableRow key={mark.id} className="text-xs">
                              <TableCell className="font-medium">
                                {formatTerm(mark.attributes.term)}
                              </TableCell>
                              <TableCell>
                                {mark.attributes.subject_name || "N/A"}
                              </TableCell>
                              <TableCell className="text-right">
                                {mark.attributes.score} /{" "}
                                {mark.attributes.max_score}
                              </TableCell>
                              <TableCell className="text-right font-medium text-primary">
                                {mark.attributes.percentage}%
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground border-2 border-dashed rounded-lg bg-muted/10">
                      <BookOpen className="h-10 w-10 mb-4 opacity-20" />
                      <p className="font-medium text-foreground">
                        No Records Found
                      </p>
                      <p className="text-sm mt-1">
                        This student does not have any
                        <br />
                        marks recorded yet.
                      </p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Edit modal */}
      <EditStudentModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        student={editingStudent}
        onSuccess={() =>
          homeroom && fetchStudents(meta.page, homeroom.id.toString())
        }
      />
    </div>
  );
}

import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "../../../../components/ui/sheet";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../../../components/ui/tabs";
import { Separator } from "../../../../components/ui/separator";
import { Button } from "../../../../components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../../components/ui/table";
import { Users, CreditCard, BookOpen } from "lucide-react";
import { apiFetch } from "../../../../api/client";

interface TeacherSheetProps {
  teacher: any | null;
  onClose: () => void;
  onEdit: (teacher: any) => void;
}

export function TeacherSheet({ teacher, onClose, onEdit }: TeacherSheetProps) {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (teacher) {
      setLoading(true);
      apiFetch(`/admin/teacher_subject_assignments?teacher_id=${teacher.id}`)
        .then((res: any) => setAssignments(res.data || []))
        .catch((err) => console.error("Failed to fetch assignments", err))
        .finally(() => setLoading(false));
    } else {
      setAssignments([]);
    }
  }, [teacher]);

  const isPrincipal = teacher?.attributes?.type === "Principal";

  return (
    <Sheet open={!!teacher} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="sm:max-w-[500px] overflow-y-auto">
        {teacher && (
          <>
            <SheetHeader
              className={`pb-6 border-b ${
                isPrincipal
                  ? "bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 -mt-6 -mx-6 p-6 shadow-md shadow-amber-500/10"
                  : "relative"
              }`}
            >
              <SheetTitle
                className={`text-2xl flex items-center gap-2 ${
                  isPrincipal ? "text-amber-950" : ""
                }`}
              >
                <Users
                  className={`h-6 w-6 ${isPrincipal ? "text-amber-900" : "text-primary"}`}
                />
                {isPrincipal
                  ? `Principal ${teacher.attributes.name}`
                  : teacher.attributes.name}
              </SheetTitle>

              <SheetDescription
                className={isPrincipal ? "text-amber-900/80 font-medium" : ""}
              >
                Employee ID: {teacher.attributes.employee_code}
              </SheetDescription>
            </SheetHeader>

            <Tabs defaultValue="profile" className="mt-6">
              <TabsList className="w-full">
                <TabsTrigger value="profile" className="flex-1">
                  Profile
                </TabsTrigger>
                <TabsTrigger value="assignments" className="flex-1">
                  Assignments ({assignments.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="profile" className="space-y-6 mt-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground mb-1">Base Salary</p>
                    <p className="font-medium flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />₹
                      {teacher.attributes.salary?.toLocaleString() || "N/A"}
                    </p>
                  </div>
                </div>
                <Separator />
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      onClose();
                      onEdit(teacher);
                    }}
                  >
                    Edit Profile
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="assignments" className="mt-6">
                {loading ? (
                  <div className="flex justify-center py-12">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : assignments.length > 0 ? (
                  <div className="rounded-md border bg-card">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[120px]">Classroom</TableHead>
                          <TableHead>Subject Assigned</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {assignments.map((assignment) => (
                          <TableRow key={assignment.id}>
                            <TableCell className="font-medium text-primary">
                              {assignment.attributes.classroom?.display_name ||
                                "N/A"}
                            </TableCell>
                            <TableCell>
                              {assignment.attributes.subject?.name || "N/A"}
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
                      No Assignments Yet
                    </p>
                    <p className="text-sm mt-1">
                      This teacher has not been assigned
                      <br />
                      to any subjects or classrooms.
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

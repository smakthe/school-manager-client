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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../../components/ui/table";
import { Badge } from "../../../../components/ui/badge";
import { Separator } from "../../../../components/ui/separator";
import { Button } from "../../../../components/ui/button";
import { GraduationCap, Calendar, BookOpen } from "lucide-react";
import { apiFetch } from "../../../../api/client";

interface StudentSheetProps {
  student: any | null;
  onClose: () => void;
  onEdit: (student: any) => void;
}

export function StudentSheet({ student, onClose, onEdit }: StudentSheetProps) {
  const [marks, setMarks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (student) {
      setLoading(true);
      // Fetch all marks for this specific student
      apiFetch(`/admin/marks?student_id=${student.id}`)
        .then((res: any) => setMarks(res.data || []))
        .catch((err) => console.error("Failed to fetch academic records", err))
        .finally(() => setLoading(false));
    } else {
      setMarks([]);
    }
  }, [student]);

  // Helper to nicely format the term enum (e.g., "term1" -> "Term 1")
  const formatTerm = (term: string) => {
    if (!term) return "Unknown";
    return term.replace("term", "Term ");
  };

  return (
    <Sheet open={!!student} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="sm:max-w-[500px] overflow-y-auto">
        {student && (
          <>
            <SheetHeader className="pb-6 border-b">
              <SheetTitle className="text-2xl flex items-center gap-2">
                <GraduationCap className="h-6 w-6 text-primary" />
                {student.attributes.name}
              </SheetTitle>
              <SheetDescription>
                Admission No: {student.attributes.admission_number}
              </SheetDescription>
              <div className="flex gap-2 mt-4">
                <Badge
                  variant={
                    student.attributes.is_active ? "default" : "secondary"
                  }
                >
                  {student.attributes.is_active ? "Active" : "Inactive"}
                </Badge>
                <Badge variant="outline" className="capitalize">
                  {student.attributes.gender}
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
                    <p className="text-muted-foreground mb-1">Date of Birth</p>
                    <p className="font-medium flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {new Date(student.attributes.dob).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Separator />
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      onClose();
                      onEdit(student);
                    }}
                  >
                    Edit Profile
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="academic" className="mt-6">
                {loading ? (
                  <div className="flex justify-center py-12">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : marks.length > 0 ? (
                  <div className="rounded-md border bg-card">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Term</TableHead>
                          <TableHead>Subject</TableHead>
                          <TableHead className="text-right">Score</TableHead>
                          <TableHead className="text-right">%</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {marks.map((mark) => (
                          <TableRow key={mark.id}>
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
  );
}

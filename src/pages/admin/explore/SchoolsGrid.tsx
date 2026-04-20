import {
  useState,
  useEffect,
  useRef,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import { schoolsApi } from "../../../api/admin/schools";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Edit, Trash2, GraduationCap, Building2, Users } from "lucide-react";
import { SchoolFormModal } from "../modals/SchoolFormModal";
import { ConfirmDialog } from "../../../components/shared/ConfirmDialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../../components/ui/tooltip";

const BOARDS = [
  {
    id: "cbse",
    label: "Central Board of Secondary Education",
    shortLabel: "CBSE",
    activeClass:
      "border-blue-500 bg-blue-500/10 text-blue-800 dark:text-blue-300 dark:border-blue-500/50",
    badgeClass: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
    cardColor: "border-blue-500/50 hover:border-blue-500",
  },
  {
    id: "icse",
    label: "Indian Certificate of Secondary Education",
    shortLabel: "ICSE",
    activeClass:
      "border-pink-500 bg-pink-500/10 text-pink-800 dark:text-pink-300 dark:border-pink-500/50",
    badgeClass: "bg-pink-500/10 text-pink-700 dark:text-pink-400",
    cardColor: "border-pink-500/50 hover:border-pink-500",
  },
  {
    id: "state",
    label: "State Board",
    shortLabel: "State Board",
    activeClass:
      "border-emerald-500 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 dark:border-emerald-500/50",
    badgeClass: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    cardColor: "border-emerald-500/50 hover:border-emerald-500",
  },
  {
    id: "ib",
    label: "International Board",
    shortLabel: "IB",
    activeClass:
      "border-amber-500 bg-amber-500/10 text-amber-800 dark:text-amber-300 dark:border-amber-500/50",
    badgeClass: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
    cardColor: "border-amber-500/50 hover:border-amber-500",
  },
];

export interface SchoolsGridRef {
  openAddModal: () => void;
}

export const SchoolsGrid = forwardRef<
  SchoolsGridRef,
  { onSelectSchool: (school: any) => void }
>(({ onSelectSchool }, ref) => {
  const [schools, setSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMoreSchools, setLoadingMoreSchools] = useState(false);
  const [schoolMeta, setSchoolMeta] = useState<any>({ page: 1, pages: 1 });
  const [activeBoards, setActiveBoards] = useState<string[]>(
    BOARDS.map((b) => b.id),
  );
  const [boardStats, setBoardStats] = useState<
    Record<string, { schools: number; teachers: number; students: number }>
  >({});

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchool, setEditingSchool] = useState<any | null>(null);
  const [deleteConfig, setDeleteConfig] = useState<{
    isOpen: boolean;
    entity: any | null;
    loading: boolean;
  }>({ isOpen: false, entity: null, loading: false });

  const observer = useRef<IntersectionObserver | null>(null);
  const isFetchingRef = useRef(false);

  useImperativeHandle(ref, () => ({
    openAddModal: () => {
      setEditingSchool(null);
      setIsModalOpen(true);
    },
  }));

  const fetchSchools = useCallback(
    async (page = 1, boards = activeBoards) => {
      isFetchingRef.current = true;
      if (page === 1) setLoading(true);
      else setLoadingMoreSchools(true);

      try {
        const res = await schoolsApi.list(page, boards);
        if (page === 1) setSchools(res.data);
        else {
          setSchools((prev) => {
            const existingIds = new Set(prev.map((s) => s.id));
            return [
              ...prev,
              ...res.data.filter((s: any) => !existingIds.has(s.id)),
            ];
          });
        }
        setSchoolMeta(res.meta);
      } catch (err) {
        console.error(err);
      } finally {
        if (page === 1) setLoading(false);
        setLoadingMoreSchools(false);
        isFetchingRef.current = false;
      }
    },
    [activeBoards],
  );

  useEffect(() => {
    // Determine whether to skip clearing schools state right away for minor UX improvement
    // However, since boards change, wiping the list and showing loading spinner is simpler semantics
    setSchools([]);
    fetchSchools(1, activeBoards);
  }, [activeBoards, fetchSchools]);

  useEffect(() => {
    schoolsApi.getBoardStats().then(setBoardStats).catch(console.error);
  }, []);

  const lastElementRef = useCallback(
    (node: HTMLDivElement) => {
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (
          entries[0].isIntersecting &&
          !isFetchingRef.current &&
          schoolMeta.page < schoolMeta.pages
        ) {
          fetchSchools(schoolMeta.page + 1, activeBoards);
        }
      });
      if (node) observer.current.observe(node);
    },
    [schoolMeta.page, schoolMeta.pages, fetchSchools, activeBoards],
  );

  const confirmDelete = async () => {
    if (!deleteConfig.entity) return;
    setDeleteConfig((prev) => ({ ...prev, loading: true }));
    try {
      await schoolsApi.delete(deleteConfig.entity.id);
      await fetchSchools(1, activeBoards);
    } catch (err) {
      console.error(err);
    } finally {
      setDeleteConfig({ isOpen: false, entity: null, loading: false });
    }
  };

  const getBoardStyle = (boardId: string) => {
    const board = BOARDS.find((b) => b.id === boardId);
    return board || BOARDS[0];
  };

  const toggleBoard = (id: string) => {
    setActiveBoards((prev) =>
      prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id],
    );
  };

  return (
    <div className="space-y-6">
      {/* Toggles */}
      <TooltipProvider>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {BOARDS.map((board) => {
            const isActive = activeBoards.includes(board.id);
            const stats = boardStats[board.id] || {
              schools: 0,
              teachers: 0,
              students: 0,
            };

            return (
              <div
                key={board.id}
                role="button"
                tabIndex={0}
                onClick={() => toggleBoard(board.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    toggleBoard(board.id);
                  }
                }}
                className={`flex flex-col items-center justify-between p-4 min-h-[110px] rounded-xl border-2 transition-all duration-200 text-center cursor-pointer ${
                  isActive
                    ? board.activeClass
                    : "border-muted/60 bg-muted/20 text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                }`}
              >
                <div className="flex flex-col items-center justify-center w-full flex-grow">
                  <span className="font-bold text-sm tracking-wide">
                    {board.shortLabel}
                  </span>
                  <span className="text-[11px] mt-1 opacity-80 max-w-[140px] leading-tight">
                    {board.label}
                  </span>
                </div>

                <div
                  className={`flex w-full justify-evenly items-center mt-3 pt-2 text-xs border-t transition-colors ${
                    isActive
                      ? "border-current/20"
                      : "border-muted-foreground/20"
                  }`}
                >
                  <Tooltip>
                    <TooltipTrigger className="flex items-center gap-1.5 cursor-pointer hover:opacity-100 opacity-80 outline-none">
                      <Building2 className="h-3.5 w-3.5" />
                      <span className="font-semibold">{stats.schools}</span>
                    </TooltipTrigger>
                    <TooltipContent>Total Schools</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger className="flex items-center gap-1.5 cursor-pointer hover:opacity-100 opacity-80 outline-none">
                      <Users className="h-3.5 w-3.5" />
                      <span className="font-semibold">{stats.teachers}</span>
                    </TooltipTrigger>
                    <TooltipContent>Total Teachers</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger className="flex items-center gap-1.5 cursor-pointer hover:opacity-100 opacity-80 outline-none">
                      <GraduationCap className="h-3.5 w-3.5" />
                      <span className="font-semibold">{stats.students}</span>
                    </TooltipTrigger>
                    <TooltipContent>Total Students</TooltipContent>
                  </Tooltip>
                </div>
              </div>
            );
          })}
        </div>
      </TooltipProvider>

      {loading && !loadingMoreSchools ? (
        <div className="flex h-56 items-center justify-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : activeBoards.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed rounded-xl bg-muted/5">
          <GraduationCap className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-semibold">No boards selected</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            Please activate at least one board filter above to view the schools.
          </p>
        </div>
      ) : schools.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed rounded-xl bg-muted/5">
          <GraduationCap className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-semibold">No schools found</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            There are no schools matching your active filters.
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {schools.map((school, index) => {
              const style = getBoardStyle(school.attributes.board);
              const card = (
                <Card
                  className={`cursor-pointer transition-all duration-200 hover:shadow-lg relative group h-full border-t-4 shadow-sm hover:-translate-y-1 ${style.cardColor}`}
                  onClick={() => onSelectSchool(school)}
                >
                  <CardHeader className="flex flex-col items-start gap-3 pb-3">
                    <div className="flex w-full items-start justify-between">
                      <div
                        className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${style.badgeClass}`}
                      >
                        {school.attributes.board}
                      </div>
                      <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 bg-background/80 backdrop-blur-sm border shadow-sm hover:bg-background"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingSchool(school);
                            setIsModalOpen(true);
                          }}
                        >
                          <Edit className="h-3.5 w-3.5 text-primary" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 bg-background/80 backdrop-blur-sm border shadow-sm hover:bg-destructive hover:text-destructive-foreground hover:border-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfig({
                              isOpen: true,
                              entity: school,
                              loading: false,
                            });
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    <CardTitle className="text-xl font-bold leading-tight line-clamp-2">
                      {school.attributes.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center text-sm text-muted-foreground mt-1 bg-muted/30 px-3 py-2 rounded-md font-mono">
                      <span className="w-full truncate">
                        {school.attributes.subdomain}.school.com
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
              return schools.length === index + 1 ? (
                <div ref={lastElementRef} key={school.id} className="h-full">
                  {card}
                </div>
              ) : (
                <div key={school.id} className="h-full">
                  {card}
                </div>
              );
            })}
          </div>
          {loadingMoreSchools && (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </>
      )}

      {isModalOpen && (
        <SchoolFormModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          schoolId={editingSchool?.id || null}
          onSuccess={() => fetchSchools(1, activeBoards)}
        />
      )}
      <ConfirmDialog
        open={deleteConfig.isOpen}
        onCancel={() =>
          setDeleteConfig({ isOpen: false, entity: null, loading: false })
        }
        onConfirm={confirmDelete}
        title="Delete School"
        description="Are you sure? This action cannot be undone and will delete all associated teachers, students, and classrooms."
        isDeleting={deleteConfig.loading}
      />
    </div>
  );
});

import { useState, useEffect, useMemo } from "react";
import { useAuthStore } from "../../stores/authStore";
import { useTeacherStore } from "../../stores/teacherStore";
import { teacherDashboardApi } from "../../api/teacher/dashboard";
import { PageHeader } from "../../components/shared/PageHeader";
// import { StatCard } from "../../components/shared/StatCard";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
import { BookOpen } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "../../components/ui/tabs";
import { CHART_PALETTE } from "../../components/ui/palette";
import { Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

// ─── Helpers ────────────────────────────────────────────────────────────────

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];

// Parse r,g,b from an rgba(...) string produced by CHART_PALETTE
function parseRgba(rgba: string): [number, number, number] {
  const m = rgba.match(/rgba\(\s*(\d+),\s*(\d+),\s*(\d+)/);
  return m ? [+m[1], +m[2], +m[3]] : [128, 128, 128];
}

// Shared hash — same index into CHART_PALETTE for both roster tiles and chart bars
function subjectPaletteIndex(subject: string): number {
  return (
    subject.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) %
    CHART_PALETTE.length
  );
}

// Returns inline CSSProperties for roster tiles (bg 15%, text 90%, border 35%)
function subjectColor(subject: string): React.CSSProperties {
  const [r, g, b] = parseRgba(CHART_PALETTE[subjectPaletteIndex(subject)]);
  return {
    backgroundColor: `rgba(${r}, ${g}, ${b}, 0.15)`,
    color: "rgba(0, 0, 0, 0.85)",
    borderColor: `rgba(${r}, ${g}, ${b}, 0.35)`,
  };
}

// Returns an rgba string for Chart.js dataset colours
function subjectChartColor(subject: string): string {
  return CHART_PALETTE[subjectPaletteIndex(subject)];
}

// ─── Weekly Calendar ─────────────────────────────────────────────────────────
// Since there is no timetable model yet, we distribute the teacher's
// subject-classroom assignments evenly across the five working days so
// the calendar looks meaningful and interactive.

interface RosterItem {
  classroom_id: number;
  classroom_name: string;
  grade: number;
  section: string;
  subjects: { id: number; name: string; code: string }[];
}

function buildWeeklySchedule(roster: RosterItem[]) {
  // Flatten into individual (classroom, subject) slots
  const slots: {
    classroom: string;
    classroomId: number;
    subject: string;
    code: string;
  }[] = [];
  roster.forEach((r) => {
    r.subjects.forEach((s) => {
      slots.push({
        classroom: r.classroom_name,
        classroomId: r.classroom_id,
        subject: s.name,
        code: s.code || s.name.slice(0, 3).toUpperCase(),
      });
    });
  });

  // Distribute slots round-robin across the 5 days
  const schedule: (typeof slots)[number][][] = DAYS.map(() => []);
  slots.forEach((slot, i) => {
    schedule[i % 5].push(slot);
  });
  return schedule;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function TeacherDashboard() {
  const { user } = useAuthStore();
  const { setHomeroom } = useTeacherStore();
  const [loading, setLoading] = useState(true);
  // const [stats, setStats] = useState({
  //   taught_classrooms: 0,
  //   total_students: 0,
  //   total_subjects: 0,
  // });
  const [homeroom, setLocalHomeroom] = useState<any>(null);
  const [performance, setPerformance] = useState<any[]>([]);
  const [roster, setRoster] = useState<RosterItem[]>([]);
  const [selectedClassroom, setSelectedClassroom] =
    useState<string>("All Classes");
  const [selectedSubject, setSelectedSubject] =
    useState<string>("All Subjects");
  const [perfSubjectFilter, setPerfSubjectFilter] = useState<
    Record<string, string>
  >({});

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await teacherDashboardApi.getStats();
        // setStats(res.totals);
        setHomeroom(res.homeroom ?? null);
        setLocalHomeroom(res.homeroom);
        setPerformance(res.subject_performance || []);
        setRoster(res.roster || []);
      } catch (err) {
        console.error("Failed to load teacher dashboard", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const weekSchedule = useMemo(() => buildWeeklySchedule(roster), [roster]);

  // Unique classrooms for the filter dropdowns
  const uniqueClassrooms = useMemo(
    () =>
      roster.map((r) => ({
        id: r.classroom_id.toString(),
        name: r.classroom_name,
      })),
    [roster],
  );

  // Unique subjects across all roster entries
  const uniqueSubjects = useMemo(
    () =>
      Array.from(
        new Set(roster.flatMap((r) => r.subjects.map((s) => s.name))),
      ).sort(),
    [roster],
  );

  // Group performance rows by classroom, preserving subject-level detail
  const perfByGrade = useMemo(() => {
    // Build a quick lookup: classroom_name → { grade, section }
    const meta = new Map<string, { grade: number; section: string }>();
    roster.forEach((r) =>
      meta.set(r.classroom_name, { grade: r.grade, section: r.section }),
    );

    // grade (number) → section (string) → performance rows
    const gradeMap = new Map<
      number,
      Map<string, { subject: string; average: number | null }[]>
    >();

    performance.forEach((p) => {
      const m = meta.get(p.classroom);
      if (!m) return;
      if (!gradeMap.has(m.grade)) gradeMap.set(m.grade, new Map());
      const sectionMap = gradeMap.get(m.grade)!;
      if (!sectionMap.has(m.section)) sectionMap.set(m.section, []);
      sectionMap
        .get(m.section)!
        .push({ subject: p.subject, average: p.average ?? null });
    });

    return Array.from(gradeMap.entries())
      .sort(([a], [b]) => a - b)
      .map(([grade, sectionMap]) => ({
        grade,
        roman: ROMAN[grade - 1] ?? String(grade),
        sections: Array.from(sectionMap.entries())
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([section, rows]) => ({ section, rows })),
      }));
  }, [performance, roster]);

  return (
    <div className="space-y-6 pb-12">
      {/* Greeting */}
      <div className="rounded-xl border bg-card px-6 py-5 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight">
          {getGreeting()}, {user?.name || "Teacher"}
        </h1>
        <p className="mt-1 text-muted-foreground">
          Welcome back to{" "}
          <span className="font-medium text-foreground">
            {user?.school_name || "your school"}
          </span>
          . Here's your week ahead.
        </p>
        {homeroom && (
          <p className="mt-2 text-sm text-muted-foreground">
            You are the class teacher of{" "}
            <Badge variant="secondary" className="text-xs">
              Class {homeroom.display_name}
            </Badge>
          </p>
        )}
      </div>

      <PageHeader
        title="My Dashboard"
        description="Your classes, roster, and student performance."
      />

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* ── Weekly Roster Calendar ─────────────────────────────────── */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle>Weekly Class Roster</CardTitle>
                <div className="flex items-center gap-2">
                  {uniqueClassrooms.length > 0 && (
                    <Select
                      value={selectedClassroom}
                      onValueChange={(val) => setSelectedClassroom(val || "All Classes")}
                    >
                      <SelectTrigger className="h-8 w-40 text-xs">
                        <SelectValue placeholder="Filter by class" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All Classes">All Classes</SelectItem>
                        {uniqueClassrooms.map((c) => (
                          <SelectItem key={c.id} value={c.name}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {uniqueSubjects.length > 0 && (
                    <Select
                      value={selectedSubject}
                      onValueChange={(val) => setSelectedSubject(val || "All Subjects")}
                    >
                      <SelectTrigger className="h-8 w-40 text-xs">
                        <SelectValue placeholder="Filter by subject" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All Subjects">
                          All Subjects
                        </SelectItem>
                        {uniqueSubjects.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {roster.length === 0 ? (
                <p className="py-8 text-center text-muted-foreground">
                  No class assignments found.
                </p>
              ) : (
                <div className="grid grid-cols-5 gap-2 min-w-[640px]">
                  {DAYS.map((day, i) => {
                    const todayDay = new Date().getDay();
                    const todayIdx =
                      todayDay >= 1 && todayDay <= 5 ? todayDay - 1 : -1;
                    return (
                      <div
                        key={day}
                        className={`rounded-lg px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide transition-colors ${
                          i === todayIdx
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {day.slice(0, 3)}
                      </div>
                    );
                  })}
                  {DAYS.map((_, dayIdx) => (
                    <div key={dayIdx} className="flex flex-col gap-2">
                      {weekSchedule[dayIdx].length === 0 ? (
                        <div className="rounded-lg border border-dashed border-border/50 h-16 flex items-center justify-center">
                          <span className="text-xs text-muted-foreground/50">
                            —
                          </span>
                        </div>
                      ) : (
                        weekSchedule[dayIdx].map((slot, si) => {
                          const isFiltered =
                            (selectedClassroom !== "All Classes" &&
                              slot.classroom !== selectedClassroom) ||
                            (selectedSubject !== "All Subjects" &&
                              slot.subject !== selectedSubject);
                          return (
                            <div
                              key={si}
                              className="rounded-lg border px-3 py-2.5 text-xs transition-all cursor-default"
                              style={
                                isFiltered
                                  ? {
                                      backgroundColor: "rgba(0,0,0,0.04)",
                                      borderColor: "rgba(0,0,0,0.08)",
                                      color: "rgba(0,0,0,0.25)",
                                    }
                                  : subjectColor(slot.subject)
                              }
                            >
                              <p className="font-bold tracking-wide">
                                {slot.subject}
                              </p>
                              <p className="opacity-80 mt-0.5 truncate">
                                {slot.classroom}
                              </p>
                            </div>
                          );
                        })
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── Assignment Summary (grouped by subject) ──────────────── */}
          {roster.length > 0 &&
            (() => {
              const bySubject = new Map<
                string,
                { classrooms: string[]; code: string }
              >();
              roster.forEach((r) =>
                r.subjects.forEach((s) => {
                  if (!bySubject.has(s.name))
                    bySubject.set(s.name, {
                      classrooms: [],
                      code: s.code || s.name.slice(0, 3).toUpperCase(),
                    });
                  bySubject.get(s.name)!.classrooms.push(r.classroom_name);
                }),
              );
              return (
                <Card>
                  <CardHeader>
                    <CardTitle>Class Assignments by Subject</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {Array.from(bySubject.entries()).map(
                        ([subjectName, { classrooms, code }]) => {
                          const style = subjectColor(subjectName);
                          return (
                            <div
                              key={subjectName}
                              className="rounded-lg border p-3 space-y-2"
                              style={style}
                            >
                              <div className="flex items-center justify-between">
                                <p className="font-bold text-sm">
                                  {subjectName}
                                </p>
                                <span className="text-[10px] font-mono font-semibold opacity-60 uppercase tracking-widest">
                                  {code}
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {classrooms.map((cls) => (
                                  <span
                                    key={cls}
                                    className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium"
                                    style={{
                                      backgroundColor: "rgba(0,0,0,0.08)",
                                      color: "rgba(0,0,0,0.75)",
                                    }}
                                  >
                                    {cls}
                                  </span>
                                ))}
                              </div>
                            </div>
                          );
                        },
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })()}

          {/* ── Student Performance — Grade tabs + Section sub-tabs ───── */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Student Performance by Subject</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Select a class to view average scores per subject.
              </p>
            </CardHeader>

            <CardContent>
              {!perfByGrade.length ? (
                <div className="flex h-40 flex-col items-center justify-center gap-1 text-muted-foreground">
                  <BookOpen className="h-6 w-6 opacity-40" />
                  <p className="text-sm">No performance data available yet.</p>
                </div>
              ) : (
                <Tabs defaultValue={String(perfByGrade[0].grade)}>
                  {/* ── Outer tabs: Class I – X ────────────────────────── */}
                  <TabsList className="flex-wrap h-auto gap-1 mb-4">
                    {perfByGrade.map(({ grade, roman }) => (
                      <TabsTrigger
                        key={grade}
                        value={String(grade)}
                        className="text-xs min-w-[40px]"
                      >
                        {roman}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {perfByGrade.map(({ grade, roman, sections }) => (
                    <TabsContent key={grade} value={String(grade)}>
                      {sections.length === 0 ? (
                        <div className="flex h-32 items-center justify-center text-muted-foreground text-sm">
                          No sections found for Class {roman}.
                        </div>
                      ) : (
                        /* ── Inner tabs: Section A, B, C … ─────────────── */
                        <Tabs defaultValue={sections[0].section}>
                          <TabsList className="flex-wrap h-auto gap-1 mb-4">
                            {sections.map(({ section }) => (
                              <TabsTrigger
                                key={section}
                                value={section}
                                className="text-xs min-w-[36px]"
                              >
                                {section.toUpperCase()}
                              </TabsTrigger>
                            ))}
                          </TabsList>

                          {sections.map(({ section, rows }) => {
                            const tabKey = `${grade}-${section}`;
                            const activeSubject =
                              perfSubjectFilter[tabKey] ?? "All Subjects";

                            const subjectsInSection = Array.from(
                              new Set(rows.map((r) => r.subject)),
                            ).sort();

                            const chartRows =
                              activeSubject === "All Subjects"
                                ? rows.filter((r) => r.average !== null)
                                : rows.filter(
                                    (r) =>
                                      r.subject === activeSubject &&
                                      r.average !== null,
                                  );

                            const chartData =
                              chartRows.length > 0
                                ? {
                                    labels: chartRows.map((r) => r.subject),
                                    datasets: [
                                      {
                                        label: "Avg Score",
                                        data: chartRows.map((r) => r.average),
                                        backgroundColor: chartRows.map((r) =>
                                          subjectChartColor(r.subject),
                                        ),
                                        borderRadius: 6,
                                        barThickness: 28,
                                      },
                                    ],
                                  }
                                : null;

                            return (
                              <TabsContent key={section} value={section}>
                                {/* Section header + subject filter */}
                                <div className="flex items-center justify-between mb-4">
                                  <p className="text-sm font-medium text-muted-foreground">
                                    {roman} –{" "}
                                    <span className="text-foreground font-semibold">
                                      {section.toUpperCase()}
                                    </span>
                                    {activeSubject !== "All Subjects" && (
                                      <span className="ml-2 text-xs font-semibold">
                                        · {activeSubject}
                                      </span>
                                    )}
                                  </p>

                                  {subjectsInSection.length > 1 && (
                                    <Select
                                      value={activeSubject}
                                      onValueChange={(val) =>
                                        setPerfSubjectFilter((prev) => ({
                                          ...prev,
                                          [tabKey]: val || "All Subjects",
                                        }))
                                      }
                                    >
                                      <SelectTrigger className="h-8 w-40 text-xs">
                                        <SelectValue placeholder="Filter by subject" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="All Subjects">
                                          All Subjects
                                        </SelectItem>
                                        {subjectsInSection.map((s) => (
                                          <SelectItem key={s} value={s}>
                                            {s}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  )}
                                </div>

                                {/* Chart */}
                                {chartData ? (
                                  <div
                                    className="w-full pr-2 pt-2"
                                    style={{
                                      height: `${Math.max(160, chartRows.length * 52 + 40)}px`,
                                    }}
                                  >
                                    <Bar
                                      data={chartData}
                                      options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        indexAxis: "y" as const,
                                        plugins: {
                                          legend: { display: false },
                                          tooltip: {
                                            callbacks: {
                                              label: (c) =>
                                                ` Avg: ${c.raw} / 100`,
                                            },
                                          },
                                        },
                                        scales: {
                                          x: {
                                            beginAtZero: true,
                                            max: 100,
                                            title: {
                                              display: true,
                                              text: "Average Score",
                                            },
                                            ticks: { stepSize: 20 },
                                          },
                                          y: {
                                            ticks: { font: { size: 12 } },
                                          },
                                        },
                                      }}
                                    />
                                  </div>
                                ) : (
                                  <div className="flex h-40 items-center justify-center text-muted-foreground text-sm">
                                    No assessment data for{" "}
                                    {activeSubject !== "All Subjects"
                                      ? activeSubject
                                      : `Class ${roman} – Section ${section}`}{" "}
                                    yet.
                                  </div>
                                )}
                              </TabsContent>
                            );
                          })}
                        </Tabs>
                      )}
                    </TabsContent>
                  ))}
                </Tabs>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

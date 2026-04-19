import { useEffect, useState } from "react";
import { PageHeader } from "../../components/shared/PageHeader";
import { StatCard } from "../../components/shared/StatCard";
import { Users, GraduationCap, BookOpen } from "lucide-react";
import { principalDashboardApi } from "../../api/principal/dashboard";
import { useAuthStore } from "../../stores/authStore";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Pie, Bar, Line } from "react-chartjs-2";
import { CHART_PALETTE } from "../../components/ui/palette";

ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
  Filler,
);

// Shared hash — same index into CHART_PALETTE for consistent subject coloring
function subjectPaletteIndex(subject: string): number {
  return (
    subject.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) %
    CHART_PALETTE.length
  );
}

// Returns an rgba string for Chart.js dataset colours
function subjectChartColor(subject: string): string {
  return CHART_PALETTE[subjectPaletteIndex(subject)];
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function PrincipalDashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState({
    classrooms: 0,
    teachers: 0,
    students: 0,
  });
  const [loading, setLoading] = useState(true);
  const [genderChartData, setGenderChartData] = useState<any>(null);
  const [hiringChartData, setHiringChartData] = useState<any>(null);
  const [subjectChartData, setSubjectChartData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await principalDashboardApi.getStats();

        setStats({
          classrooms: response.totals.classrooms,
          teachers: response.totals.teachers,
          students: response.totals.students,
        });

        const subjectMap: Record<string, string> = {
          Mathematics: "MAT",
          English: "ENG",
          Hindi: "HIN",
          "Social Studies": "SST",
          Sanskrit: "SAN",
          Commerce: "COM",
          Economics: "ECO",
          "Business Studies": "BST",
          Accountancy: "ACC",
          History: "HIS",
          Geography: "GEO",
          Physics: "PHY",
          Chemistry: "CHE",
          Biology: "BIO",
          Botany: "BOT",
          Zoology: "ZOO",
          "Computer Science": "CMP",
          Craft: "CRA",
          "Political Science": "POL",
          Psychology: "PSY",
          "Environmental Science": "EVS",
        };

        if (Object.keys(response.charts.gender_distribution || {}).length > 0) {
          const raw = response.charts.gender_distribution;
          const total = response.totals.students || 1;
          setGenderChartData({
            labels: ["Male", "Female", "Other"],
            datasets: [
              {
                label: "% of Students",
                data: [
                  parseFloat((((raw["male"] || 0) / total) * 100).toFixed(1)),
                  parseFloat((((raw["female"] || 0) / total) * 100).toFixed(1)),
                  parseFloat((((raw["other"] || 0) / total) * 100).toFixed(1)),
                ],
                backgroundColor: [
                  "rgba(59, 130, 246, 0.8)",
                  "rgba(236, 72, 153, 0.8)",
                  "rgba(16, 185, 129, 0.8)",
                ],
                borderRadius: 4,
              },
            ],
          });
        }

        if (Object.keys(response.charts.hiring_trend || {}).length > 0) {
          const sortedYears = Object.keys(response.charts.hiring_trend).sort();
          setHiringChartData({
            labels: sortedYears.map((y) => parseInt(y).toString()),
            datasets: [
              {
                label: "Teachers Hired",
                data: sortedYears.map((y) => response.charts.hiring_trend[y]),
                borderColor: "rgba(139, 92, 246, 1)",
                backgroundColor: "rgba(139, 92, 246, 0.2)",
                pointBackgroundColor: "rgba(139, 92, 246, 1)",
                tension: 0.4,
                fill: true,
              },
            ],
          });
        }

        if (
          Object.keys(response.charts.subject_distribution || {}).length > 0
        ) {
          const fullNames = Object.keys(response.charts.subject_distribution);
          const total =
            Object.values(
              response.charts.subject_distribution as Record<string, number>,
            ).reduce((s, v) => s + v, 0) || 1;
          setSubjectChartData({
            labels: fullNames.map((n) => subjectMap[n] || n),
            fullNames,
            datasets: [
              {
                data: fullNames.map((n) =>
                  parseFloat(
                    (
                      (response.charts.subject_distribution[n] / total) *
                      100
                    ).toFixed(1),
                  ),
                ),
                backgroundColor: fullNames.map((n) => subjectChartColor(n)),
                borderWidth: 1,
              },
            ],
          });
        }
      } catch (err) {
        console.error("Failed to load principal dashboard", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Personalised greeting */}
      <div className="rounded-xl border bg-card px-6 py-5 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight">
          {getGreeting()}, Principal{user?.name ? ` ${user.name}` : ""}
        </h1>
        <p className="mt-1 text-muted-foreground">
          Welcome back to{" "}
          <span className="font-medium text-foreground">
            {user?.school_name || "your school"}
          </span>
          . Here's today's overview.
        </p>
      </div>

      <PageHeader
        title="Dashboard"
        description="Overview of your school's classrooms, students, and staff."
      />

      {/* Stat cards */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <StatCard
          title="Total Classrooms"
          value={stats.classrooms}
          icon={<BookOpen className="h-4 w-4" />}
          loading={loading}
        />
        <StatCard
          title="Total Teachers"
          value={stats.teachers}
          icon={<Users className="h-4 w-4" />}
          loading={loading}
        />
        <StatCard
          title="Total Students"
          value={stats.students}
          icon={<GraduationCap className="h-4 w-4" />}
          loading={loading}
        />
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Subject Distribution */}
            <Card className="md:col-span-2 lg:col-span-2">
              <CardHeader>
                <CardTitle>Teacher Distribution by Subject (%)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px] flex items-center justify-center pb-4">
                  {subjectChartData ? (
                    <Pie
                      data={subjectChartData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { position: "right" },
                          tooltip: {
                            callbacks: {
                              label: (c) => {
                                const full =
                                  subjectChartData.fullNames[c.dataIndex];
                                return ` ${full || c.label}: ${c.raw}%`;
                              },
                            },
                          },
                        },
                      }}
                    />
                  ) : (
                    <p className="text-muted-foreground">No data available</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Gender Distribution */}
            <Card className="md:col-span-2 lg:col-span-1">
              <CardHeader>
                <CardTitle>Student Gender Demographics (%)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px] flex items-center justify-center pb-4">
                  {genderChartData ? (
                    <Bar
                      data={genderChartData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: {
                          y: {
                            beginAtZero: true,
                            max: 100,
                            title: { display: true, text: "Percentage (%)" },
                          },
                        },
                      }}
                    />
                  ) : (
                    <p className="text-muted-foreground">No data available</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Hiring Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Teacher Hiring Trend (Year over Year)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[350px] w-full pb-4 pt-2 pr-4">
                {hiringChartData ? (
                  <Line
                    data={hiringChartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: { legend: { display: false } },
                      scales: {
                        y: {
                          beginAtZero: true,
                          ticks: { precision: 0 },
                          title: {
                            display: true,
                            text: "Number of Teachers Hired",
                          },
                        },
                      },
                    }}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    No historical data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

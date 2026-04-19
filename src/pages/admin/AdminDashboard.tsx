import { useEffect, useState } from "react";
import { PageHeader } from "../../components/shared/PageHeader";
import { StatCard } from "../../components/shared/StatCard";
import { Building2, Users, GraduationCap } from "lucide-react";
import { dashboardApi } from "../../api/admin/dashboard";
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
import { Doughnut, Pie, Bar, Line } from "react-chartjs-2";
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

export function AdminDashboard() {
  const [stats, setStats] = useState({
    schools: 0,
    teachers: 0,
    students: 0,
  });
  const [loading, setLoading] = useState(true);

  const [boardChartData, setBoardChartData] = useState<any>(null);
  const [subjectChartData, setSubjectChartData] = useState<any>(null);
  const [genderChartData, setGenderChartData] = useState<any>(null);
  const [hiringChartData, setHiringChartData] = useState<any>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const response = await dashboardApi.getStats();

        setStats({
          schools: response.totals.schools,
          teachers: response.totals.teachers,
          students: response.totals.students,
        });

        const toPercentages = (dataObj: Record<string, number>) => {
          const total =
            Object.values(dataObj).reduce((sum, val) => sum + val, 0) || 1;
          return Object.keys(dataObj).map((key) =>
            parseFloat(((dataObj[key] / total) * 100).toFixed(1)),
          );
        };

        // 1. Schools by Board Chart
        if (Object.keys(response.charts.board_distribution || {}).length > 0) {
          const rawBoardData = response.charts.board_distribution;
          const boardLabels = Object.keys(rawBoardData).map((l) =>
            l.toUpperCase(),
          );

          setBoardChartData({
            labels: boardLabels,
            datasets: [
              {
                data: Object.values(rawBoardData),
                backgroundColor: [
                  "rgba(236, 72, 153, 0.8)", // pink
                  "rgba(59, 130, 246, 0.8)", // blue
                  "rgba(16, 185, 129, 0.8)", // emerald
                  "rgba(245, 158, 11, 0.8)", // amber
                ],
                borderWidth: 1,
              },
            ],
          });
        }

        // 2. Subject Distribution
        if (
          Object.keys(response.charts.subject_distribution || {}).length > 0
        ) {
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
          const subjectLabels = Object.keys(
            response.charts.subject_distribution,
          ).map((name) => subjectMap[name] || name);

          setSubjectChartData({
            labels: subjectLabels,
            fullNames: Object.keys(response.charts.subject_distribution),
            datasets: [
              {
                data: toPercentages(response.charts.subject_distribution),
                backgroundColor: Object.keys(
                  response.charts.subject_distribution,
                ).map((name) => subjectChartColor(name)),
                borderWidth: 1,
              },
            ],
          });
        }

        // 3. Gender Distribution
        if (Object.keys(response.charts.gender_distribution || {}).length > 0) {
          const rawGenderData = response.charts.gender_distribution;
          const totalStudents = response.totals.students || 1;
          const malePct = parseFloat(
            (((rawGenderData["male"] || 0) / totalStudents) * 100).toFixed(1),
          );
          const femalePct = parseFloat(
            (((rawGenderData["female"] || 0) / totalStudents) * 100).toFixed(1),
          );
          const otherPct = parseFloat(
            (((rawGenderData["other"] || 0) / totalStudents) * 100).toFixed(1),
          );

          setGenderChartData({
            labels: ["Male", "Female", "Other"],
            datasets: [
              {
                label: "% of Students",
                data: [malePct, femalePct, otherPct],
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

        // 4. Hiring Trend
        if (Object.keys(response.charts.hiring_trend || {}).length > 0) {
          const sortedYears = Object.keys(response.charts.hiring_trend).sort();
          const trendData = sortedYears.map(
            (year) => response.charts.hiring_trend[year],
          );

          setHiringChartData({
            labels: sortedYears.map((y) => parseInt(y).toString()),
            datasets: [
              {
                label: "Teachers Hired",
                data: trendData,
                borderColor: "rgba(139, 92, 246, 1)",
                backgroundColor: "rgba(139, 92, 246, 0.2)",
                pointBackgroundColor: "rgba(139, 92, 246, 1)",
                tension: 0.4,
                fill: true,
              },
            ],
          });
        }
      } catch (err) {
        console.error("Failed to fetch dashboard stats", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div>
      <PageHeader
        title="Admin Dashboard"
        description="Global overview of your school management system."
      />

      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <StatCard
          title="Total Schools"
          value={stats.schools}
          icon={<Building2 className="h-4 w-4" />}
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
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Schools by Board</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px] flex items-center justify-center pb-4">
                  {boardChartData ? (
                    <Doughnut
                      data={boardChartData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { position: "bottom" } },
                      }}
                    />
                  ) : (
                    <p className="text-muted-foreground">No data available</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
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
                                const fullName =
                                  subjectChartData.fullNames[c.dataIndex];
                                return ` ${fullName || c.label}: ${c.raw}%`;
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

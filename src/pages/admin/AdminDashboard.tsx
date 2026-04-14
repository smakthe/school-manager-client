import { useEffect, useState } from 'react';
import { PageHeader } from '../../components/shared/PageHeader';
import { StatCard } from '../../components/shared/StatCard';
import { Building2, Users, GraduationCap } from 'lucide-react';
import { schoolsApi } from '../../api/admin/schools';
import { teachersApi } from '../../api/admin/teachers';
import { studentsApi } from '../../api/admin/students';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

export function AdminDashboard() {
  const [stats, setStats] = useState({
    schools: 0,
    teachers: 0,
    students: 0,
  });
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<any>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const [schoolsRes, teachersRes, studentsRes] = await Promise.all([
          schoolsApi.list(1),
          teachersApi.list(1),
          studentsApi.list(1),
        ]);

        setStats({
          schools: schoolsRes.meta.count,
          teachers: teachersRes.meta.count,
          students: studentsRes.meta.count,
        });

        // Group schools by subscription status for chart
        const schools = schoolsRes.data;
        const statusCounts: Record<string, number> = {};
        schools.forEach((school) => {
          const status = school.attributes.subscription_status || 'unknown';
          statusCounts[status] = (statusCounts[status] || 0) + 1;
        });

        const labels = Object.keys(statusCounts);
        const data = Object.values(statusCounts);

        setChartData({
          labels: labels.map((l) => l.charAt(0).toUpperCase() + l.slice(1)),
          datasets: [
            {
              data,
              backgroundColor: [
                'rgba(79, 70, 229, 0.8)', // indigo-600
                'rgba(16, 185, 129, 0.8)', // emerald-500
                'rgba(245, 158, 11, 0.8)', // amber-500
                'rgba(239, 68, 68, 0.8)',  // red-500
              ],
              borderColor: [
                'rgba(79, 70, 229, 1)',
                'rgba(16, 185, 129, 1)',
                'rgba(245, 158, 11, 1)',
                'rgba(239, 68, 68, 1)',
              ],
              borderWidth: 1,
            },
          ],
        });
      } catch (err) {
        console.error('Failed to fetch dashboard stats', err);
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Schools by Subscription</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex h-[200px] items-center justify-center">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : chartData ? (
              <div className="h-[250px] flex items-center justify-center">
                <Doughnut
                  data={chartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { position: 'bottom' },
                    },
                  }}
                />
              </div>
            ) : (
              <div className="flex h-[200px] items-center justify-center text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

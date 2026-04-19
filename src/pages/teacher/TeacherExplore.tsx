import { useState, useEffect } from "react";
import { PageHeader } from "../../components/shared/PageHeader";
import { useTeacherStore } from "../../stores/teacherStore";
import { teacherDashboardApi } from "../../api/teacher/dashboard";
import { TeacherClassroomView } from "./explore/TeacherClassroomView";

export function TeacherExplore() {
  const { homeroom: storeHomeroom, setHomeroom: setStoreHomeroom } = useTeacherStore();
  const [homeroom, setHomeroom] = useState<any>(storeHomeroom ?? null);
  const [loading, setLoading] = useState(true);

  // If the store already has homeroom data, use it.
  // Otherwise fetch it to be sure.
  useEffect(() => {
    if (storeHomeroom !== undefined) {
      setHomeroom(storeHomeroom);
      setLoading(false);
      return;
    }

    const init = async () => {
      setLoading(true);
      try {
        const res = await teacherDashboardApi.getStats();
        const hr = res.homeroom ?? null;
        setHomeroom(hr);
        setStoreHomeroom(hr);
      } catch (err) {
        console.error("Failed to initialize teacher explore", err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [storeHomeroom, setStoreHomeroom]);

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // If homeroom is confirmed null (not a class teacher), show a message or redirect.
  // The Navbar hides the link for non-class-teachers.
  if (!homeroom) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="My Classroom"
          description="You are currently not assigned as a Class Teacher for any homeroom."
        />
        <div className="flex flex-col items-center justify-center min-h-[400px] border-2 border-dashed rounded-xl bg-muted/5">
          <p className="text-muted-foreground">No homeroom assigned.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="My Classroom"
        description={`Managing Class ${homeroom.display_name}`}
      />

      <TeacherClassroomView homeroom={homeroom} />
    </div>
  );
}

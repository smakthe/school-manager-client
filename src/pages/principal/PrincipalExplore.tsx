import { useState } from "react";
import { PageHeader } from "../../components/shared/PageHeader";
import { ChevronRight } from "lucide-react";
import { PrincipalTabs } from "./explore/PrincipalTabs";
import { PrincipalClassroomView } from "./explore/PrincipalClassroomView";

export function PrincipalExplore() {
  const [selectedClassroom, setSelectedClassroom] = useState<any | null>(null);

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Explore"
        description="Manage classrooms, students, and staff in your school."
      />

      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-sm text-muted-foreground pb-4 border-b">
        <button
          onClick={() => setSelectedClassroom(null)}
          className={`hover:text-primary transition-colors ${!selectedClassroom ? "font-semibold text-foreground" : ""}`}
        >
          All Classrooms
        </button>
        {selectedClassroom && (
          <>
            <ChevronRight className="h-4 w-4" />
            <span className="font-semibold text-foreground">
              Class {selectedClassroom.attributes.display_name}
            </span>
          </>
        )}
      </div>

      {!selectedClassroom ? (
        <PrincipalTabs onSelectClassroom={setSelectedClassroom} />
      ) : (
        <PrincipalClassroomView
          classroom={selectedClassroom}
          onBack={() => setSelectedClassroom(null)}
        />
      )}
    </div>
  );
}

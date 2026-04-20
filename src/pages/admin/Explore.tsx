import { useState, useRef } from "react";
import { PageHeader } from "../../components/shared/PageHeader";
import { ChevronRight, Plus } from "lucide-react";
import { Button } from "../../components/ui/button";

import { SchoolsGrid, type SchoolsGridRef } from "./explore/SchoolsGrid";
import { SchoolTabs } from "./explore/SchoolTabs";
import { ClassroomView } from "./explore/ClassroomView";

export function Explore() {
  const [selectedSchool, setSelectedSchool] = useState<any | null>(null);
  const [selectedClassroom, setSelectedClassroom] = useState<any | null>(null);
  const schoolsGridRef = useRef<SchoolsGridRef>(null);

  return (
    <div className="space-y-6 relative pb-12">
      <PageHeader
        title="Explore"
        description="Manage schools, classrooms and personnel."
      />

      {/* Breadcrumbs Navigation */}
      <div className="flex items-center justify-between pb-4 border-b">
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
        <button
          onClick={() => {
            setSelectedSchool(null);
            setSelectedClassroom(null);
          }}
          className={`hover:text-primary transition-colors ${!selectedSchool ? "font-semibold text-foreground" : ""}`}
        >
          All Schools
        </button>

        {selectedSchool && (
          <>
            <ChevronRight className="h-4 w-4" />
            <button
              onClick={() => setSelectedClassroom(null)}
              className={`hover:text-primary transition-colors ${!selectedClassroom ? "font-semibold text-foreground" : ""}`}
            >
              {selectedSchool.attributes.name}
            </button>
          </>
        )}

        {selectedClassroom && (
          <>
            <ChevronRight className="h-4 w-4" />
            <span className="font-semibold text-foreground">
              Class {selectedClassroom.attributes.display_name}
            </span>
          </>
        )}
        </div>

        {!selectedSchool && (
          <Button
            className="shadow-sm"
            onClick={() => schoolsGridRef.current?.openAddModal()}
          >
            <Plus className="mr-2 h-4 w-4" /> Add School
          </Button>
        )}
      </div>

      {/* The Orchestrator: Displaying the correct view component based on drill-down depth */}
      {!selectedSchool ? (
        <SchoolsGrid ref={schoolsGridRef} onSelectSchool={setSelectedSchool} />
      ) : !selectedClassroom ? (
        <SchoolTabs
          school={selectedSchool}
          onBack={() => setSelectedSchool(null)}
          onSelectClassroom={setSelectedClassroom}
        />
      ) : (
        <ClassroomView
          school={selectedSchool}
          classroom={selectedClassroom}
          onBack={() => setSelectedClassroom(null)}
        />
      )}
    </div>
  );
}

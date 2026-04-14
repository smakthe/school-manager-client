export type Section = 'a' | 'b' | 'c';

export interface ClassroomAttributes {
  school_id: number;
  academic_year_id: number;
  class_teacher_id: number;
  grade: number;
  section: Section;
  display_name?: string;
}

export interface AcademicYearAttributes {
  start_date: string;
  end_date: string;
  name: string;
  is_active: boolean;
}

export interface SubjectAttributes {
  name: string;
  grade: number;
}

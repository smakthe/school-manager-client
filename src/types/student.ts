export type Gender = 'male' | 'female' | 'other';

export interface StudentAttributes {
  name: string;
  school_id: number;
  admission_number: string;
  dob: string;
  gender: Gender;
  is_active: boolean;
}

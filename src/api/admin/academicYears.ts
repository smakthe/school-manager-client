import { apiFetch } from '../client';
import type { JsonApiCollectionResponse } from '../../types/api';
import type { AcademicYearAttributes } from '../../types/classroom';

// TODO: Endpoint TBD. These are placeholders based on educated guess
export const academicYearsApi = {
  list: (): Promise<JsonApiCollectionResponse<AcademicYearAttributes, 'academic_year'>> => {
    return apiFetch(`/admin/academic_years`);
  },
};

import { apiFetch } from '../client';
import type { JsonApiCollectionResponse } from '../../types/api';
import type { SubjectAttributes } from '../../types/classroom';

// TODO: Endpoint TBD. These are placeholders based on educated guess
export const subjectsApi = {
  list: (): Promise<JsonApiCollectionResponse<SubjectAttributes, 'subject'>> => {
    return apiFetch(`/admin/subjects`);
  },
};

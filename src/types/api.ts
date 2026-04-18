export type Role = 'admin' | 'principal' | 'teacher';

export interface User {
  id: number;
  email: string;
  role: Role;
  userable_id: number;
  name?: string;
  school_name?: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface JsonApiResource<T, U extends string> {
  id: string;
  type: U;
  attributes: T;
  relationships?: Record<string, any>;
}

export interface JsonApiResponse<T, U extends string> {
  data: JsonApiResource<T, U>;
}

export interface JsonApiCollectionResponse<T, U extends string> {
  data: JsonApiResource<T, U>[];
  meta: {
    page: number;
    items: number;
    count: number;
    pages: number;
  };
}

export interface ApiError {
  error: string;
}

export interface ApiValidationError {
  errors: string[];
}

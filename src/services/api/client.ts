import { logger } from '@/lib/logger';

export interface ApiError {
  error: string;
  details?: string;
  code?: string;
}

export async function fetchApi<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    let errorDetail: ApiError;
    try {
      errorDetail = await response.json();
    } catch {
      errorDetail = { error: `HTTP ${response.status}: ${response.statusText}` };
    }

    logger.error(`API Error [${url}]:`, errorDetail);
    throw new Error(errorDetail.details || errorDetail.error || 'Unknown API Error');
  }

  // Handle empty responses
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

/**
 * For multipart/form-data, we shouldn't set Content-Type manually
 */
export async function fetchApiFormData<T>(
  url: string,
  formData: FormData,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(url, {
    ...options,
    method: options.method || 'POST',
    body: formData,
    // Note: Do NOT set Content-Type here, browser will do it with boundary
  });

  if (!response.ok) {
    let errorDetail: ApiError;
    try {
      errorDetail = await response.json();
    } catch {
      errorDetail = { error: `HTTP ${response.status}: ${response.statusText}` };
    }

    logger.error(`API Error [${url}] (Status ${response.status} ${response.statusText}):`, errorDetail);
    throw new Error(errorDetail.details || errorDetail.error || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

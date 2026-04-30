import { ENDPOINTS } from '../constants/config';

// Fetcher có kèm JWT token
async function apiFetch(path: string, token: string, options: RequestInit = {}) {
  const res = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// -------- Auth --------
export async function socialLogin(payload: {
  email: string;
  name: string;
  provider: string;
  provider_id: string;
}) {
  const res = await fetch(ENDPOINTS.socialLogin, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Login failed: HTTP ${res.status}`);
  return res.json();
}

// -------- Cameras --------
export const fetchCameras = (token: string) =>
  apiFetch(ENDPOINTS.cameras, token);

// -------- Incidents --------
export const fetchIncidents = (token: string) =>
  apiFetch(ENDPOINTS.incidents, token);

// -------- Health Profile --------
export const fetchHealthProfile = (token: string) =>
  apiFetch(ENDPOINTS.healthProfile, token);

export const updateHealthProfile = (token: string, payload: any) =>
  apiFetch(ENDPOINTS.healthProfile, token, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });

export const updateContacts = (token: string, contacts: any[]) =>
  apiFetch(ENDPOINTS.contacts, token, {
    method: 'PUT',
    body: JSON.stringify(contacts),
  });

export const addCamera = (token: string, payload: { name: string; rtsp_url: string }) =>
  apiFetch(ENDPOINTS.cameras, token, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const deleteCamera = (token: string, id: string) =>
  apiFetch(`${ENDPOINTS.cameras}/${id}`, token, {
    method: 'DELETE',
  });

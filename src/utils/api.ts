import {
  GlassLineItem,
  ProjectAttachment,
  ProjectInfo,
  ProjectStatus,
  ReportsSummaryResponse,
  SavedProjectRecord,
  SavedProjectSummary,
} from '../types/glass';

const BASE_URL = '/api';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      if (data?.error) message = data.error;
    } catch {
      // ignore parse error
    }
    throw new Error(message);
  }
  return res.json();
}

export async function fetchProjects(): Promise<SavedProjectSummary[]> {
  const res = await fetch(`${BASE_URL}/projects`);
  return handleResponse<SavedProjectSummary[]>(res);
}

export async function fetchProjectById(id: string): Promise<SavedProjectRecord> {
  const res = await fetch(`${BASE_URL}/projects/${encodeURIComponent(id)}`);
  return handleResponse<SavedProjectRecord>(res);
}

export async function createProject(payload: {
  project: ProjectInfo;
  items: GlassLineItem[];
  status?: ProjectStatus;
}): Promise<SavedProjectRecord> {
  const res = await fetch(`${BASE_URL}/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse<SavedProjectRecord>(res);
}

export async function updateProject(
  id: string,
  payload: {
    project: ProjectInfo;
    items: GlassLineItem[];
    status?: ProjectStatus;
  }
): Promise<SavedProjectRecord> {
  const res = await fetch(`${BASE_URL}/projects/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse<SavedProjectRecord>(res);
}

export async function updateProjectStatus(
  id: string,
  status: ProjectStatus
): Promise<{ id: string; status: ProjectStatus }> {
  const res = await fetch(`${BASE_URL}/projects/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  return handleResponse<{ id: string; status: ProjectStatus }>(res);
}

export async function deleteProject(id: string): Promise<{ deleted: boolean; id: string }> {
  const res = await fetch(`${BASE_URL}/projects/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  return handleResponse<{ deleted: boolean; id: string }>(res);
}

export async function fetchReportsSummary(): Promise<ReportsSummaryResponse> {
  const res = await fetch(`${BASE_URL}/reports/summary`);
  return handleResponse<ReportsSummaryResponse>(res);
}

export async function fetchProjectAttachments(
  projectId: string
): Promise<ProjectAttachment[]> {
  const res = await fetch(
    `${BASE_URL}/projects/${encodeURIComponent(projectId)}/attachments`
  );
  return handleResponse<ProjectAttachment[]>(res);
}

export async function uploadProjectAttachment(
  projectId: string,
  file: File
): Promise<ProjectAttachment> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(
    `${BASE_URL}/projects/${encodeURIComponent(projectId)}/attachments`,
    {
      method: 'POST',
      body: formData,
    }
  );
  return handleResponse<ProjectAttachment>(res);
}

export async function deleteAttachment(
  attachmentId: string
): Promise<{ deleted: boolean; id: string }> {
  const res = await fetch(
    `${BASE_URL}/attachments/${encodeURIComponent(attachmentId)}`,
    { method: 'DELETE' }
  );
  return handleResponse<{ deleted: boolean; id: string }>(res);
}

export function getAttachmentUrl(attachmentId: string, download = false): string {
  return `${BASE_URL}/attachments/${encodeURIComponent(attachmentId)}${
    download ? '?download=1' : ''
  }`;
}


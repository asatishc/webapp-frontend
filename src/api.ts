
const SPRING_BASE = '/api/admin';   // relative — works everywhere
// const SPRING_BASE = 'http://localhost:8086/api/admin';

export const isUuid = (s?: string) =>
  !!s && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(s);

export const admin = {
  listWorkflows: () => fetch(`${SPRING_BASE}/workflows`).then(r=>r.json()),
  getDefinition: (id: string) => fetch(`${SPRING_BASE}/workflows/${id}/definition`).then(r=>r.json()),
  createWorkflow: (body: any) => fetch(`${SPRING_BASE}/workflows`, {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body)}).then(r=>r.json()),
  updateWorkflow: (id: string, body: any) => fetch(`${SPRING_BASE}/workflows/${id}`, {method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body)}).then(r=>r.json()),
  resetWorkflow: (id: string) => fetch(`${SPRING_BASE}/workflows/${id}/reset`, {method:'POST'}).then(r=>r.json()),
  deleteWorkflow: (id: string) => fetch(`${SPRING_BASE}/workflows/${id}`, {method:'DELETE'}).then(r=>r.json()),
  addStep: (id: string, body: any) => fetch(`${SPRING_BASE}/workflows/${id}/steps`, {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body)}).then(r=>r.json()),
  updateStep: (wfId: string, stepId: string, body: any) => fetch(`${SPRING_BASE}/workflows/${wfId}/steps/${stepId}`, {method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body)}).then(r=>r.json()),
  deleteStep: (wfId: string, stepId: string) => fetch(`${SPRING_BASE}/workflows/${wfId}/steps/${stepId}`, {method:'DELETE'}).then(r=>r.json()),
  addTransition: (id: string, body: any) => fetch(`${SPRING_BASE}/workflows/${id}/transitions`, {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body)}).then(r=>r.json()),
  deleteTransition: (wfId: string, trId: string) => fetch(`${SPRING_BASE}/workflows/${wfId}/transitions/${trId}`, {method:'DELETE'}).then(r=>r.json()),
  listRunSummary: (workflowId?: string) => fetch(workflowId? `${SPRING_BASE}/runs?workflowId=${workflowId}`: `${SPRING_BASE}/runs`).then(r=>r.json()),
  getRun: (runId: string) => fetch(`${SPRING_BASE}/runs/${runId}`).then(r=>r.json()),
  listRunsForWorkflow: (wfId: string) => fetch(`${SPRING_BASE}/workflows/${wfId}/runs`).then(r=>r.json()),
  trigger: (wfId: string, payload: any) => fetch(`${SPRING_BASE}/workflows/${wfId}/trigger`, {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload||{})}).then(r=>r.json()),
};

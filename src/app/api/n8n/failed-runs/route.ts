import { NextResponse } from "next/server";
import type { N8nRun, N8nRunOutcome } from "@/types/n8n";

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function pickString(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return undefined;
}

function normalizeUiBaseUrl(uiBaseUrl: string): string {
  const trimmed = uiBaseUrl.trim().replace(/\/$/, "");

  try {
    return new URL(trimmed).origin;
  } catch {
    return trimmed.replace(/\/home\/workflows.*$/i, "");
  }
}

function toExecutionUrl(
  uiBaseUrl: string | undefined,
  executionId: string,
  workflowId?: string
): string | undefined {
  if (!uiBaseUrl) return undefined;
  const normalized = normalizeUiBaseUrl(uiBaseUrl);
  if (workflowId) {
    return `${normalized}/workflow/${workflowId}/executions/${executionId}`;
  }
  return `${normalized}/execution/${executionId}`;
}

function toOutcome(status: string, error: string | undefined, finished: unknown): N8nRunOutcome {
  const normalized = status.toLowerCase();
  if (
    normalized.includes("fail") ||
    normalized.includes("error") ||
    normalized.includes("crash") ||
    normalized.includes("cancel") ||
    Boolean(error)
  ) {
    return "failed";
  }
  if (normalized.includes("success") || normalized.includes("done") || finished === true) {
    return "success";
  }
  return "other";
}

function normalizeExecution(
  raw: unknown,
  uiBaseUrl: string | undefined,
  workflowNames: Map<string, string>
): N8nRun | null {
  const execution = asRecord(raw);
  if (!execution) return null;

  const workflow = asRecord(execution.workflow);
  const errorObject = asRecord(execution.error);

  const id = pickString(execution.id, execution.executionId);
  if (!id) return null;

  const workflowId = pickString(execution.workflowId, execution.workflow_id, workflow?.id);
  const workflowNameFromLookup = workflowId ? workflowNames.get(workflowId) : undefined;
  const workflowName =
    pickString(execution.workflowName, execution.workflow_name, workflow?.name, workflowNameFromLookup) ||
    "Unknown Workflow";
  const status =
    pickString(
      execution.status,
      execution.state,
      execution.mode,
      execution.finished === false ? "running" : undefined,
      execution.finished === true ? "success" : undefined
    ) || "unknown";

  const startedAt =
    pickString(execution.startedAt, execution.started_at, execution.createdAt, execution.created_at) || null;
  const stoppedAt = pickString(execution.stoppedAt, execution.stopped_at) || null;

  const error = pickString(
    execution.lastNodeError,
    execution.last_node_error,
    execution.error,
    errorObject?.message,
    errorObject?.description
  );
  const outcome = toOutcome(status, error, execution.finished);

  return {
    id,
    workflowId,
    workflowName,
    status,
    outcome,
    startedAt,
    stoppedAt,
    error,
    url: toExecutionUrl(uiBaseUrl, id, workflowId),
  };
}

function executionTimestamp(run: N8nRun): number {
  const date = new Date(run.startedAt || run.stoppedAt || "").getTime();
  return Number.isFinite(date) ? date : 0;
}

function normalizeWorkflow(raw: unknown): { id: string; name: string } | null {
  const workflow = asRecord(raw);
  if (!workflow) return null;

  const id = pickString(workflow.id, workflow.workflowId, workflow.workflow_id);
  const name = pickString(workflow.name, workflow.workflowName, workflow.workflow_name);

  if (!id || !name) return null;
  return { id, name };
}

async function fetchWorkflowNames(
  n8nApiBaseUrl: string,
  headers: HeadersInit,
  fetchLimit: number
): Promise<Map<string, string>> {
  const endpoint = new URL(`${n8nApiBaseUrl.replace(/\/$/, "")}/workflows`);
  endpoint.searchParams.set("limit", String(fetchLimit));

  const response = await fetch(endpoint.toString(), {
    method: "GET",
    headers,
    cache: "no-store",
  });

  if (!response.ok) {
    return new Map();
  }

  const payload = await response.json().catch(() => null);
  const payloadRecord = asRecord(payload);
  const rawWorkflows =
    (Array.isArray(payload) && payload) ||
    (payloadRecord && Array.isArray(payloadRecord.data) && payloadRecord.data) ||
    (payloadRecord && Array.isArray(payloadRecord.results) && payloadRecord.results) ||
    (payloadRecord && Array.isArray(payloadRecord.workflows) && payloadRecord.workflows) ||
    [];

  const workflowMap = new Map<string, string>();
  for (const rawWorkflow of rawWorkflows) {
    const normalized = normalizeWorkflow(rawWorkflow);
    if (!normalized) continue;
    workflowMap.set(normalized.id, normalized.name);
  }

  return workflowMap;
}

export async function GET() {
  const n8nApiBaseUrl = process.env.N8N_API_BASE_URL;
  const n8nApiKey = process.env.N8N_API_KEY;
  const n8nBearerToken = process.env.N8N_BEARER_TOKEN;
  const n8nUiBaseUrl = process.env.N8N_UI_BASE_URL;
  const recentDays = Math.min(Math.max(Number(process.env.N8N_RECENT_RUNS_DAYS || "2"), 1), 14);
  const fetchLimit = Math.min(Math.max(Number(process.env.N8N_RECENT_RUNS_FETCH_LIMIT || "250"), 1), 1000);
  const displayLimit = Math.min(Math.max(Number(process.env.N8N_RECENT_RUNS_LIMIT || "250"), 1), 1000);
  const cutoffTime = Date.now() - recentDays * 24 * 60 * 60 * 1000;

  if (!n8nApiBaseUrl || (!n8nApiKey && !n8nBearerToken)) {
    return NextResponse.json({
      runs: [],
      configured: false,
      error: "n8n is not configured yet.",
    });
  }

  const endpoint = new URL(`${n8nApiBaseUrl.replace(/\/$/, "")}/executions`);
  endpoint.searchParams.set("limit", String(fetchLimit));
  endpoint.searchParams.set("includeData", "false");

  const headers: HeadersInit = { Accept: "application/json" };
  if (n8nApiKey) headers["X-N8N-API-KEY"] = n8nApiKey;
  if (n8nBearerToken) headers.Authorization = `Bearer ${n8nBearerToken}`;

  try {
    const [executionsResponse, workflowNames] = await Promise.all([
      fetch(endpoint.toString(), {
        method: "GET",
        headers,
        cache: "no-store",
      }),
      fetchWorkflowNames(n8nApiBaseUrl, headers, fetchLimit),
    ]);

    const payload = await executionsResponse.json().catch(() => null);

    if (!executionsResponse.ok) {
      return NextResponse.json({
        runs: [],
        configured: true,
        error: `n8n API request failed (${executionsResponse.status}).`,
        details: payload,
      });
    }

    const payloadRecord = asRecord(payload);
    const rawExecutions =
      (Array.isArray(payload) && payload) ||
      (payloadRecord && Array.isArray(payloadRecord.data) && payloadRecord.data) ||
      (payloadRecord && Array.isArray(payloadRecord.results) && payloadRecord.results) ||
      (payloadRecord && Array.isArray(payloadRecord.executions) && payloadRecord.executions) ||
      [];

    const runs = rawExecutions
      .map((raw) => normalizeExecution(raw, n8nUiBaseUrl, workflowNames))
      .filter((run): run is N8nRun => Boolean(run))
      .filter((run) => executionTimestamp(run) >= cutoffTime)
      .sort((a, b) => executionTimestamp(b) - executionTimestamp(a))
      .slice(0, displayLimit);

    return NextResponse.json({
      runs,
      configured: true,
      windowDays: recentDays,
    });
  } catch (error) {
    return NextResponse.json({
      runs: [],
      configured: true,
      error: "Failed to fetch n8n runs.",
      details: error instanceof Error ? error.message : String(error),
    });
  }
}

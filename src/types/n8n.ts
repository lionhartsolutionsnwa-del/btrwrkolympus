export type N8nRunOutcome = "success" | "failed" | "other";

export interface N8nRun {
  id: string;
  workflowId?: string;
  workflowName: string;
  status: string;
  outcome: N8nRunOutcome;
  startedAt?: string | null;
  stoppedAt?: string | null;
  error?: string;
  url?: string;
}

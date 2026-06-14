export type SourceSystem = 'Gmail' | 'Slack' | 'Linear' | 'Notion' | 'Calendar' | 'Stripe';

export interface Provenance {
  source: SourceSystem;
  author: string;
  timestamp: string;
  message_id: string;
  link_to_source: string;
  raw_content?: string; // Original text message or email body
}

export interface Blocker {
  id: string;
  issue: string;
  severity: 'High' | 'Medium' | 'Low';
  status: 'Open' | 'Resolved';
  provenance: Provenance;
}

export interface Metric {
  id: string;
  name: string;
  old_value: number | string;
  new_value: number | string;
  change: string; // e.g. "+25%", "-10%"
  provenance: Provenance;
}

export interface Decision {
  id: string;
  decision: string;
  reason: string;
  date: string;
  blockerIds: string[]; // Decisions can link to multiple blockers
  metricIds: string[];  // Decisions can link to multiple metrics
  provenance: Provenance;
}

export interface Commitment {
  id: string;
  owner: string;
  task: string;
  deadline: string;
  status: 'Open' | 'Fulfilled' | 'Overdue';
  decisionId?: string; // Commitments can link to a decision
  provenance: Provenance;
}

export type MemoryType = 'Decision' | 'Commitment' | 'Blocker' | 'Metric';

export interface MemoryItem {
  id: string;
  type: MemoryType;
  title: string;
  content: string;
  timestamp: string;
  provenance: Provenance;
  
  // Specific payloads based on type
  decisionDetails?: Decision;
  commitmentDetails?: Commitment;
  blockerDetails?: Blocker;
  metricDetails?: Metric;

  // Generic relationship trackers
  relatedMemoryIds?: string[];
}

export interface ResearchProjectCycleDocument {
  id: string;
  project_id: string;
  cycle_number: number;
  created_at: Date;
  updated_at: Date;
}

export interface CycleScopedResearchDocument {
  id: string;
  project_id: string;
  cycle_id: string;
  created_at: Date;
  updated_at: Date;
}

export interface ResearchProjectCharterDocument extends CycleScopedResearchDocument {}

export type ResearchProjectTaskStatus = 'todo' | 'doing' | 'done';

export interface ResearchProjectTaskDocument extends CycleScopedResearchDocument {
  title: string;
  assignee_user_id: string | null;
  status: ResearchProjectTaskStatus;
  due_date: string | null;
  created_by: string;
  completed_at: Date | null;
}

export type ResearchProjectReviewVerdict = 'approve' | 'request_changes';

export interface ResearchProjectReviewDocument extends CycleScopedResearchDocument {
  reviewer_id: string;
  verdict: ResearchProjectReviewVerdict;
  content: string;
}

export interface ResearchProjectOutcomeDocument extends CycleScopedResearchDocument {}

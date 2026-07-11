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

export interface ResearchProjectTaskDocument extends CycleScopedResearchDocument {}

export interface ResearchProjectReviewDocument extends CycleScopedResearchDocument {}

export interface ResearchProjectOutcomeDocument extends CycleScopedResearchDocument {}

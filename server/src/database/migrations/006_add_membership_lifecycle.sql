-- Add active/inactive lifecycle fields to research project memberships
-- 为课题成员关系增加 active/inactive 生命周期字段

ALTER TABLE research_project_members
ADD COLUMN active BOOLEAN DEFAULT TRUE COMMENT '是否为当前有效成员' AFTER role,
ADD COLUMN removed_at TIMESTAMP NULL DEFAULT NULL COMMENT '移除/退出时间' AFTER active;

UPDATE research_project_members
SET active = TRUE
WHERE active IS NULL;

ALTER TABLE research_project_members
ADD INDEX idx_user_active_project (user_id, active, project_id),
ADD INDEX idx_project_active_role (project_id, active, role);

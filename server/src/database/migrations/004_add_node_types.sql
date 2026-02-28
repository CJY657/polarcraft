-- Add discussion, media, note node types
-- 添加讨论、媒体、便签节点类型

-- Alter the ENUM type for research_nodes
-- Note: MySQL requires re-specifying all ENUM values
ALTER TABLE research_nodes
MODIFY COLUMN type ENUM('problem', 'experiment', 'conclusion', 'discussion', 'media', 'note') NOT NULL COMMENT '节点类型';

-- Add discussion-specific fields
-- 添加讨论节点专用字段
ALTER TABLE research_nodes
ADD COLUMN topic_zh TEXT COMMENT '话题（中文）' AFTER future_work_en,
ADD COLUMN topic_en TEXT COMMENT '话题（英文）' AFTER topic_zh,
ADD COLUMN participants JSON COMMENT '参与者用户ID数组' AFTER topic_en;

-- Add media-specific fields
-- 添加媒体节点专用字段
ALTER TABLE research_nodes
ADD COLUMN media_url VARCHAR(500) COMMENT '媒体URL' AFTER participants,
ADD COLUMN media_type VARCHAR(50) COMMENT '媒体类型 (image/video/audio/file)' AFTER media_url;

-- Add note-specific fields
-- 添加便签节点专用字段
ALTER TABLE research_nodes
ADD COLUMN content_zh TEXT COMMENT '内容（中文）' AFTER media_type,
ADD COLUMN content_en TEXT COMMENT '内容（英文）' AFTER content_zh,
ADD COLUMN color VARCHAR(20) DEFAULT 'yellow' COMMENT '颜色' AFTER content_en,
ADD COLUMN pinned BOOLEAN DEFAULT FALSE COMMENT '是否置顶' AFTER color;

-- Add sort_order column to courses table
-- 给课程表添加排序字段

ALTER TABLE courses ADD COLUMN sort_order INT DEFAULT 0 COMMENT '排序顺序' AFTER color;
ALTER TABLE courses ADD INDEX idx_sort (sort_order);

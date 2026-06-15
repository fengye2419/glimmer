-- 种子数据导入说明
-- MVP 阶段从 backend/data/static/*.json 维护内容
-- 切换 MySQL 时运行: go run ./cmd/migrate （后期实现）
-- 或手动将 skills.json / questions.json 转为 INSERT 语句导入

USE glimmer;

-- 示例（完整数据请通过 migrate 工具从 JSON 生成）:
-- INSERT INTO skills (id, name, grade, description) VALUES ('s01', '认识分数', 4, '理解部分与整体的关系，读写分数');

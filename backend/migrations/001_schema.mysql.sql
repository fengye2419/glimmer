-- glimmer MySQL schema (预生成，MVP 阶段不执行)
CREATE DATABASE IF NOT EXISTS glimmer DEFAULT CHARSET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE glimmer;

CREATE TABLE IF NOT EXISTS students (
    id         VARCHAR(36) PRIMARY KEY,
    name       VARCHAR(64) NOT NULL,
    grade      TINYINT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS skills (
    id          VARCHAR(32) PRIMARY KEY,
    name        VARCHAR(64) NOT NULL,
    grade       TINYINT NOT NULL,
    description TEXT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS skill_prerequisites (
    skill_id         VARCHAR(32) NOT NULL,
    prerequisite_id  VARCHAR(32) NOT NULL,
    PRIMARY KEY (skill_id, prerequisite_id),
    FOREIGN KEY (skill_id) REFERENCES skills(id),
    FOREIGN KEY (prerequisite_id) REFERENCES skills(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS questions (
    id                  VARCHAR(32) PRIMARY KEY,
    stem                TEXT NOT NULL,
    answer              VARCHAR(128) NOT NULL,
    difficulty          TINYINT NOT NULL DEFAULT 1,
    hints_json          JSON,
    solution_steps_json JSON
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS question_skills (
    question_id VARCHAR(32) NOT NULL,
    skill_id    VARCHAR(32) NOT NULL,
    weight      DECIMAL(4,2) NOT NULL DEFAULT 1.00,
    PRIMARY KEY (question_id, skill_id),
    FOREIGN KEY (question_id) REFERENCES questions(id),
    FOREIGN KEY (skill_id) REFERENCES skills(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS mastery_states (
    student_id VARCHAR(36) NOT NULL,
    skill_id   VARCHAR(32) NOT NULL,
    p_known    DECIMAL(5,4) NOT NULL DEFAULT 0.5000,
    updated_at DATETIME NOT NULL,
    PRIMARY KEY (student_id, skill_id),
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (skill_id) REFERENCES skills(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS attempts (
    id          VARCHAR(36) PRIMARY KEY,
    student_id  VARCHAR(36) NOT NULL,
    question_id VARCHAR(32) NOT NULL,
    correct     TINYINT(1) NOT NULL,
    duration_ms INT NOT NULL DEFAULT 0,
    context     VARCHAR(32) NOT NULL DEFAULT 'practice',
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (question_id) REFERENCES questions(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS review_schedule (
    student_id     VARCHAR(36) NOT NULL,
    skill_id       VARCHAR(32) NOT NULL,
    next_review_at DATETIME NOT NULL,
    stage          TINYINT NOT NULL DEFAULT 0,
    PRIMARY KEY (student_id, skill_id),
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (skill_id) REFERENCES skills(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS tutor_sessions (
    id          VARCHAR(36) PRIMARY KEY,
    student_id  VARCHAR(36) NOT NULL,
    question_id VARCHAR(32) NOT NULL,
    state       VARCHAR(32) NOT NULL,
    messages_json JSON,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (question_id) REFERENCES questions(id)
) ENGINE=InnoDB;

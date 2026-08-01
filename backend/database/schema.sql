CREATE DATABASE IF NOT EXISTS banditlearn;
USE banditlearn;

CREATE TABLE IF NOT EXISTS users (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  user_id        VARCHAR(50)  UNIQUE NOT NULL,
  email          VARCHAR(255) UNIQUE NOT NULL,
  password_hash  VARCHAR(255) NOT NULL,
  display_name   VARCHAR(100) NOT NULL,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_active    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS submissions (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  user_id      VARCHAR(50)  NOT NULL,
  problem_id   VARCHAR(50)  NOT NULL,
  title        VARCHAR(255) NOT NULL,
  topic        VARCHAR(50)  NOT NULL,
  difficulty   VARCHAR(20)  NOT NULL,
  mode         VARCHAR(20)  NOT NULL,
  outcome      ENUM('solved', 'failed') NOT NULL,
  attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_attempted_at (attempted_at)
);

CREATE TABLE IF NOT EXISTS bandit_sessions (
  user_id      VARCHAR(50)  NOT NULL PRIMARY KEY,
  session_data JSON NOT NULL,
  updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_updated_at (updated_at)
);

CREATE TABLE IF NOT EXISTS problems (
  problem_id            VARCHAR(50)  NOT NULL PRIMARY KEY,
  title                 VARCHAR(255) NOT NULL,
  topic                 VARCHAR(50)  NOT NULL,
  difficulty            VARCHAR(20)  NOT NULL,
  tags                  JSON NULL,
  platform              VARCHAR(100) NOT NULL,
  url                   TEXT NULL,
  estimated_solving_time INT NOT NULL DEFAULT 20,
  created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_topic_difficulty (topic, difficulty),
  INDEX idx_difficulty (difficulty)
);

-- 1. 고정 루틴 테이블
CREATE TABLE routines (
  id INT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  subtitle VARCHAR(255),
  tag VARCHAR(100)
);

-- 2. 유저 루틴 관계 테이블
CREATE TABLE user_routines (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  routine_id INT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (routine_id) REFERENCES routines(id)
);
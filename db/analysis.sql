CREATE TABLE analysis_results (
  id INT AUTO_INCREMENT PRIMARY KEY,

  user_id INT NOT NULL,                      -- 사용자 ID (외래키)
  date DATE NOT NULL,                        -- 분석 날짜 (YYYY-MM-DD)
  analysis_result JSON NOT NULL,             -- AI 분석 결과 (JSON)

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- 생성 시각

  UNIQUE KEY user_date_unique (user_id, date),     -- 사용자별 날짜 1건만 허용
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
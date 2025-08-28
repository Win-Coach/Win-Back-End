CREATE TABLE match_analysis_results (
  id INT AUTO_INCREMENT PRIMARY KEY,
  
  -- 사용자 ID (어떤 유저의 분석 결과인지 식별)
  user_id INT NOT NULL,
  
  -- 경기일지 ID (어떤 경기일지에 대한 분석인지 연결)
  match_log_id INT NOT NULL UNIQUE, -- 하나의 경기일지에는 하나의 분석 결과만 있도록 UNIQUE 제약조건 추가

  -- AI가 분석한 결과 (JSON 형식으로 저장)
  -- 예: {"good": "...", "bad": "...", "coaching": "..."}
  analysis_result JSON,

  -- 분석 결과 생성 시간
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- 외래키 설정
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (match_log_id) REFERENCES match_logs(id) ON DELETE CASCADE
);
CREATE TABLE match_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,

  -- 경기 날짜 (기본값: 현재 시간)
  match_date DATETIME DEFAULT CURRENT_TIMESTAMP,

  -- === 1단계: 필수 정보 (이미지 참고) ===
  
  -- 날씨
  weather ENUM('맑음', '흐림', '비', '바람'),
  
  -- 경기 순위 (예: 2)
  match_rank INT,
  
  -- 개인 기록 (예: "11.23초", "150kg" 등 다양한 형식을 위해 VARCHAR 사용)
  personal_record VARCHAR(50),

  -- 경기 몰입도
  match_immersion ENUM('매우 높음', '높음', '보통', '낮음', '매우 낮음'),

  -- 경기 후 느낀 감정 (JSON 형식으로 다중 선택 저장)
  emotion JSON,

  -- 통증 부위 및 강도 (기존 training_logs와 동일)
  pain_head TINYINT DEFAULT 0 CHECK (pain_head BETWEEN 0 AND 8),
  pain_neck TINYINT DEFAULT 0 CHECK (pain_neck BETWEEN 0 AND 8),
  pain_shoulder TINYINT DEFAULT 0 CHECK (pain_shoulder BETWEEN 0 AND 8),
  pain_chest TINYINT DEFAULT 0 CHECK (pain_chest BETWEEN 0 AND 8),
  pain_abdomen TINYINT DEFAULT 0 CHECK (pain_abdomen BETWEEN 0 AND 8),
  pain_waist TINYINT DEFAULT 0 CHECK (pain_waist BETWEEN 0 AND 8),
  pain_arm TINYINT DEFAULT 0 CHECK (pain_arm BETWEEN 0 AND 8),
  pain_wrist TINYINT DEFAULT 0 CHECK (pain_wrist BETWEEN 0 AND 8),
  pain_pelvis TINYINT DEFAULT 0 CHECK (pain_pelvis BETWEEN 0 AND 8),
  pain_thigh TINYINT DEFAULT 0 CHECK (pain_thigh BETWEEN 0 AND 8),
  pain_knee TINYINT DEFAULT 0 CHECK (pain_knee BETWEEN 0 AND 8),
  pain_calf TINYINT DEFAULT 0 CHECK (pain_calf BETWEEN 0 AND 8),
  pain_ankle TINYINT DEFAULT 0 CHECK (pain_ankle BETWEEN 0 AND 8),
  pain_foot TINYINT DEFAULT 0 CHECK (pain_foot BETWEEN 0 AND 8),

  -- === 2단계: 경기 기록 (이미지 참고) ===

  -- 경기 내용
  match_content TEXT,
  
  -- 경기 셀프 피드백
  match_feedback TEXT,
  
  -- 다음 경기 목표
  next_match_goal TEXT,

  -- 생성 시간
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- 외래키 설정
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

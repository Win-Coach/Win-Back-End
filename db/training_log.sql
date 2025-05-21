CREATE TABLE training_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,

  -- 자동 날짜 기록
  date DATETIME DEFAULT CURRENT_TIMESTAMP,

  -- 훈련 강도: 1 ~ 10
  intensity TINYINT CHECK (intensity BETWEEN 1 AND 10),

  -- 훈련 몰입도: 1 ~ 5
  immersion TINYINT CHECK (immersion BETWEEN 1 AND 5),

  -- 훈련 성과: 1 ~ 5
  achievement TINYINT CHECK (achievement BETWEEN 1 AND 5),

  -- 감정 목록 (여러 개 선택 가능하므로 JSON 형태)
  emotion JSON,

  -- 통증 강도: 가슴, 어깨, 허벅지 각각 1 ~ 8
  pain_chest TINYINT CHECK (pain_chest BETWEEN 0 AND 8),
  pain_shoulder TINYINT CHECK (pain_shoulder BETWEEN 0 AND 8),
  pain_thigh TINYINT CHECK (pain_thigh BETWEEN 0 AND 8),

  -- 자유입력 텍스트
  training_content TEXT,
  feedback TEXT,
  next_goal TEXT,

  -- 훈련 후 체중
  weight FLOAT,

  -- 날씨: 맑음 / 흐림 / 비 / 바람 중 하나
  weather ENUM('맑음', '흐림', '비', '바람'),

  -- 생성 시간
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- 외래키
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
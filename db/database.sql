


CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
  
    -- 계정 정보
    user_id VARCHAR(50) NOT NULL UNIQUE,   -- 로그인용 아이디
    password VARCHAR(255) NOT NULL,        -- 해시된 비밀번호
  
    -- 개인정보
    name VARCHAR(100) NOT NULL,
    nickname VARCHAR(50) NOT NULL UNIQUE,
    gender ENUM('남성', '여성', '기타') NOT NULL,
    age INT NOT NULL,
    height_cm FLOAT NOT NULL,              -- cm 기준
    weight_kg FLOAT NOT NULL,              -- kg 기준
    mbti VARCHAR(4),                       -- 선택 입력 (NULL 허용)
  users
    -- 운동/목표 관련
    athlete_type ENUM('엘리트', '아마추어') NOT NULL,
    sport VARCHAR(100) NOT NULL,           -- 종목명
    weekly_exercise_count INT NOT NULL,    -- 주 운동 횟수
    concern TEXT,                          -- 평소 문제점 (선택)
    goal TEXT NOT NULL,                    -- 최종 목표
  
    -- 등록 시간
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
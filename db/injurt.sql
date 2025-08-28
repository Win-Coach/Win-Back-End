-- 1. 부상 및 재활 통합 일지
CREATE TABLE injury_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,

    -- 로그 타입: '부상' 또는 '재활'
    log_type ENUM('부상', '재활') NOT NULL,
    
    -- 재활일 경우, 어떤 부상에 대한 기록인지 연결 (최초 부상 기록일 경우 NULL)
    parent_injury_id INT, 

    -- === 공통 및 부상/재활 정보 ===
    log_date DATETIME DEFAULT CURRENT_TIMESTAMP, -- 기록 날짜

    -- '부상' 타입일 때 주로 사용되는 필드 (재활 시 NULL)
    injury_site VARCHAR(50),      -- 부상 부위
    injury_detail VARCHAR(50),    -- 세부 부위 (예: 왼쪽, 오른쪽)
    injury_intensity ENUM('가벼움', '경미한 부상', '가벼운 부상', '중간 부상', '심한 부상', '극심한 부상'),
    expected_recovery_period VARCHAR(100),
    expert_opinion TEXT,

    -- '재활' 타입일 때 주로 사용되는 필드 (부상 시 NULL)
    weather ENUM('맑음', '흐림', '비', '바람'),
    rehab_intensity ENUM('매우 낮음', '낮음', '보통', '높음', '매우 높음'),
    rehab_immersion ENUM('매우 낮음', '낮음', '보통', '높음', '매우 높음'),
    emotion JSON,
    rehab_content TEXT,
    rehab_feedback TEXT,
    next_rehab_goal TEXT,

    -- 통증 기록 (부상, 재활 모두 사용 가능)
    pain_head TINYINT DEFAULT 0, pain_neck TINYINT DEFAULT 0, pain_shoulder TINYINT DEFAULT 0,
    pain_chest TINYINT DEFAULT 0, pain_abdomen TINYINT DEFAULT 0, pain_waist TINYINT DEFAULT 0,
    pain_arm TINYINT DEFAULT 0, pain_wrist TINYINT DEFAULT 0, pain_pelvis TINYINT DEFAULT 0,
    pain_thigh TINYINT DEFAULT 0, pain_knee TINYINT DEFAULT 0, pain_calf TINYINT DEFAULT 0,
    pain_ankle TINYINT DEFAULT 0, pain_foot TINYINT DEFAULT 0,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    -- 자기 자신을 참조하여 부모-자식 관계를 형성
    FOREIGN KEY (parent_injury_id) REFERENCES injury_logs(id) ON DELETE CASCADE
);


-- 2. 재활일지 분석 결과 (통합된 injury_logs 테이블 참조)
CREATE TABLE rehab_analysis_results (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    
    -- 분석할 재활일지의 ID (injury_logs 테이블의 id를 참조)
    rehab_log_id INT NOT NULL, 

    analysis_result JSON, -- AI 분석 결과

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_rehab_log_id UNIQUE (rehab_log_id), -- 하나의 재활일지에는 하나의 분석 결과만 존재
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (rehab_log_id) REFERENCES injury_logs(id) ON DELETE CASCADE
);

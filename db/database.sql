CREATE TABLE training_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  date DATE DEFAULT CURRENT_DATE,
  intensity INT,
  immersion INT,
  achievement INT,
  emotion JSON,
  pain_location TEXT,
  pain_level INT,
  training_details JSON,
  feedback TEXT,
  next_goal TEXT,
  weight FLOAT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
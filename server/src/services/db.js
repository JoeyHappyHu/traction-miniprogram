const mysql = require('mysql2/promise');

let pool;

async function initDB() {
  pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'traction_planner',
    waitForConnections: true,
    connectionLimit: 10,
    charset: 'utf8mb4'
  });

  // 建表
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      openid VARCHAR(64) NOT NULL UNIQUE,
      nickname VARCHAR(64),
      avatar_url VARCHAR(512),
      session_key VARCHAR(128),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      title VARCHAR(128),
      status ENUM('chatting', 'cards', 'done') DEFAULT 'chatting',
      goal_summary TEXT,
      context_summary TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_user_id (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS messages (
      id INT AUTO_INCREMENT PRIMARY KEY,
      task_id INT NOT NULL,
      role ENUM('user', 'ai', 'system') NOT NULL,
      content TEXT NOT NULL,
      phase VARCHAR(32) DEFAULT 'greeting',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
      INDEX idx_task_id (task_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS cards (
      id INT AUTO_INCREMENT PRIMARY KEY,
      task_id INT NOT NULL,
      risk_score INT,
      risk_desc VARCHAR(200),
      exec_score INT,
      exec_desc VARCHAR(200),
      benefit_score INT,
      benefit_desc VARCHAR(200),
      summary VARCHAR(300),
      image_url VARCHAR(512),
      path_direction VARCHAR(100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
      INDEX idx_task_id (task_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  console.log('[DB] 数据库初始化完成');
}

function getPool() {
  return pool;
}

module.exports = { initDB, getPool };

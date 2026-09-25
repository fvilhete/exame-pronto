const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

let connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn('AVISO: A variável de ambiente DATABASE_URL não está configurada. O backend pode falhar ao ligar à base de dados.');
} else if (!connectionString.includes('client_encoding')) {
  connectionString += (connectionString.includes('?') ? '&' : '?') + 'client_encoding=UTF8';
}

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  keepAlive: true
});

// Tratamento anti-crash de erro em clientes inativos do pool (resiliência com Supabase)
pool.on('error', (err, client) => {
  console.warn('⚠️ [PostgreSQL Pool] Conexão ociosa redefinida pelo servidor remoto:', err.message);
});


// Traduz placeholders do formato SQLite (?) para o formato PostgreSQL ($1, $2, ...)
function translateQuery(query) {
  let index = 1;
  return query.replace(/\?/g, () => `$${index++}`);
}

function run(query, params, callback) {
  let finalParams = params;
  let finalCallback = callback;
  if (typeof params === 'function') {
    finalCallback = params;
    finalParams = [];
  }

  let sql = translateQuery(query);
  
  // Emular this.lastID anexando RETURNING id às queries de inserção
  const isInsert = sql.trim().toUpperCase().startsWith('INSERT');
  if (isInsert && !sql.toUpperCase().includes('RETURNING')) {
    sql += ' RETURNING id';
  }

  pool.query(sql, finalParams, (err, res) => {
    if (err) {
      if (finalCallback) finalCallback(err);
      return;
    }

    const context = {
      changes: res.rowCount,
      lastID: null
    };

    if (isInsert && res.rows && res.rows.length > 0) {
      context.lastID = res.rows[0].id;
    }

    if (finalCallback) {
      finalCallback.call(context, null);
    }
  });
}

const db = {
  get: function(query, params, callback) {
    let finalParams = params;
    let finalCallback = callback;
    if (typeof params === 'function') {
      finalCallback = params;
      finalParams = [];
    }
    pool.query(translateQuery(query), finalParams, (err, res) => {
      if (err) {
        if (finalCallback) finalCallback(err);
      } else {
        if (finalCallback) finalCallback(null, res.rows[0]);
      }
    });
  },

  all: function(query, params, callback) {
    let finalParams = params;
    let finalCallback = callback;
    if (typeof params === 'function') {
      finalCallback = params;
      finalParams = [];
    }
    pool.query(translateQuery(query), finalParams, (err, res) => {
      if (err) {
        if (finalCallback) finalCallback(err);
      } else {
        if (finalCallback) finalCallback(null, res.rows);
      }
    });
  },

  run: run,

  serialize: function(callback) {
    if (callback) callback();
  },

  // Exportar o pool bruto para fins de depuração ou conexões complexas se necessário
  pool: pool
};

// Migração idempotente para colunas de Província, Ligas Regionais, TRI, Glicko-2, Certificados e Reportes
pool.query(`
  ALTER TABLE users ADD COLUMN IF NOT EXISTS province VARCHAR(100) DEFAULT 'Maputo Cidade';
  ALTER TABLE users ADD COLUMN IF NOT EXISTS tri_proficiency NUMERIC DEFAULT 500.0;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS glicko_rating NUMERIC DEFAULT 1500.0;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS glicko_rd NUMERIC DEFAULT 350.0;

  ALTER TABLE game_scores ADD COLUMN IF NOT EXISTS province VARCHAR(100) DEFAULT 'Maputo Cidade';

  ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS tri_score NUMERIC;
  ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS tri_scale_20 NUMERIC;
  ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS tri_coherence NUMERIC;

  ALTER TABLE questions ADD COLUMN IF NOT EXISTS difficulty_b NUMERIC DEFAULT 0.0;
  ALTER TABLE questions ADD COLUMN IF NOT EXISTS discrimination_a NUMERIC DEFAULT 1.0;

  CREATE TABLE IF NOT EXISTS certificates (
    id SERIAL PRIMARY KEY,
    code VARCHAR(64) UNIQUE NOT NULL,
    user_id INTEGER,
    student_name VARCHAR(255) NOT NULL,
    student_phone VARCHAR(50),
    province VARCHAR(100) DEFAULT 'Maputo Cidade',
    exam_id VARCHAR(100),
    exam_title VARCHAR(255) NOT NULL,
    institution VARCHAR(100),
    score_raw VARCHAR(50),
    percentage NUMERIC,
    tri_score NUMERIC,
    grade_20 NUMERIC,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS question_reports (
    id SERIAL PRIMARY KEY,
    question_id INTEGER,
    exam_id VARCHAR(100),
    user_id INTEGER,
    user_phone VARCHAR(50),
    issue_type VARCHAR(100) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'pendente',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  -- Versão 9.0: Ligas (Duolingo), XP, Radar de Competências (Khan) e Rota do Caloiro (Codemao)
  ALTER TABLE users ADD COLUMN IF NOT EXISTS league_tier VARCHAR(50) DEFAULT 'bronze';
  ALTER TABLE users ADD COLUMN IF NOT EXISTS xp_points INTEGER DEFAULT 0;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS mastery_data TEXT DEFAULT '{}';
  ALTER TABLE users ADD COLUMN IF NOT EXISTS campaign_progress TEXT DEFAULT '{"unlocked_provinces":["Maputo Província"],"completed_missions":[]}';

  -- Leitor Óptico de Gabarito (Gradeo / ZipGrade)
  CREATE TABLE IF NOT EXISTS optical_scans (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    user_phone VARCHAR(50),
    exam_id VARCHAR(100),
    exam_title VARCHAR(255),
    scanned_answers TEXT,
    total_questions INTEGER,
    correct_count INTEGER,
    percentage NUMERIC,
    tri_score NUMERIC,
    grade_20 NUMERIC,
    image_metadata TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  -- Mini-Aulas & Fórum de Soluções da Comunidade (Coursera / Udemy)
  CREATE TABLE IF NOT EXISTS community_solutions (
    id SERIAL PRIMARY KEY,
    question_id INTEGER NOT NULL,
    exam_id VARCHAR(100),
    author_name VARCHAR(100) DEFAULT 'Estudante Moçambicano',
    author_province VARCHAR(100) DEFAULT 'Maputo Cidade',
    user_id INTEGER,
    solution_text TEXT NOT NULL,
    shortcut_tip TEXT,
    time_to_solve_sec INTEGER DEFAULT 60,
    upvotes INTEGER DEFAULT 0,
    is_verified_teacher BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`, (err) => {
  if (err) console.warn('⚠️ [Database] Aviso na migração de tabelas e colunas:', err.message);
  else console.log('✅ [Database] Migrações de TRI, Glicko-2, Ligas XP, OMR e Fórum verificadas com sucesso.');
});

console.log('Base de dados: Camada de compatibilidade Supabase/PostgreSQL inicializada.');

module.exports = db;

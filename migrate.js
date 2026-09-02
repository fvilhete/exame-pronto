const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('ERRO: A variável de ambiente DATABASE_URL não está configurada no arquivo .env');
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

const schema = [
  // 1. Tabela de Utilizadores
  `CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    phone TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    premium_until BIGINT DEFAULT 0,
    is_admin INTEGER DEFAULT 0
  );`,

  // Garante que a coluna de admin é adicionada se a tabela já existir no Supabase
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin INTEGER DEFAULT 0;`,

  // 2. Tabela de Exames
  `CREATE TABLE IF NOT EXISTS exams (
    id TEXT PRIMARY KEY,
    level TEXT NOT NULL,
    level_name TEXT NOT NULL,
    subject TEXT NOT NULL,
    subject_name TEXT NOT NULL,
    year INTEGER NOT NULL,
    duration_minutes INTEGER DEFAULT 120
  );`,

  // 3. Tabela de Perguntas
  `CREATE TABLE IF NOT EXISTS questions (
    id SERIAL PRIMARY KEY,
    exam_id TEXT NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    number INTEGER NOT NULL,
    text TEXT NOT NULL,
    options TEXT NOT NULL,
    correct_option INTEGER NOT NULL,
    explanation TEXT NOT NULL
  );`,

  // 4. Tabela de Explicações/Aulas
  `CREATE TABLE IF NOT EXISTS lessons (
    id SERIAL PRIMARY KEY,
    level TEXT NOT NULL,
    subject TEXT NOT NULL,
    title TEXT NOT NULL,
    summary TEXT NOT NULL,
    content TEXT NOT NULL,
    is_premium INTEGER DEFAULT 0
  );`,

  // 5. Tabela de Pagamentos
  `CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    transaction_ref TEXT UNIQUE NOT NULL,
    amount DOUBLE PRECISION NOT NULL,
    status TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );`,

  // 6. Tabela de Progresso de Exames
  `CREATE TABLE IF NOT EXISTS progress (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    exam_id TEXT NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    score INTEGER NOT NULL,
    total INTEGER NOT NULL,
    date TEXT NOT NULL
  );`,

  // 7. Tabela de Pontuação de Jogos
  `CREATE TABLE IF NOT EXISTS game_scores (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    game_name TEXT NOT NULL,
    score INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );`,

  // 8. Tabela de Vouchers / Códigos de Ativação Físicos
  `CREATE TABLE IF NOT EXISTS vouchers (
    id SERIAL PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    days INTEGER NOT NULL,
    is_used INTEGER DEFAULT 0,
    used_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    used_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );`,

  // 9. Tabela de Logs do Gerador Automático de Conteúdo
  `CREATE TABLE IF NOT EXISTS content_generator_logs (
    id SERIAL PRIMARY KEY,
    type TEXT NOT NULL,
    target_id TEXT NOT NULL,
    title TEXT NOT NULL,
    details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );`
];

async function runMigrations() {
  const client = await pool.connect();
  try {
    console.log('Iniciando migrações no Supabase (PostgreSQL)...');
    
    // Criar tabelas
    for (const query of schema) {
      await client.query(query);
    }
    console.log('Tabelas criadas ou já existentes com sucesso.');

    // Verificar se existe arquivo de backup dos dados
    const dumpPath = path.join(__dirname, 'dumped_data.json');
    if (!fs.existsSync(dumpPath)) {
      console.log('Arquivo dumped_data.json não encontrado. Ignorando sementeira de dados.');
      return;
    }

    console.log('Lendo dados para sementeira...');
    const data = JSON.parse(fs.readFileSync(dumpPath, 'utf8'));

    // Sementear Exames
    console.log(`Semeando exames (${data.exams.length})...`);
    for (const exam of data.exams) {
      await client.query(`
        INSERT INTO exams (id, level, level_name, subject, subject_name, year, duration_minutes)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (id) DO NOTHING
      `, [exam.id, exam.level, exam.level_name, exam.subject, exam.subject_name, exam.year, exam.duration_minutes]);
    }

    // Sementear Perguntas
    console.log(`Semeando perguntas (${data.questions.length})...`);
    for (const q of data.questions) {
      // Remover perguntas duplicadas para evitar restrições de chave se rodar de novo
      await client.query(`DELETE FROM questions WHERE exam_id = $1 AND number = $2`, [q.exam_id, q.number]);
      
      await client.query(`
        INSERT INTO questions (exam_id, number, text, options, correct_option, explanation)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [q.exam_id, q.number, q.text, q.options, q.correct_option, q.explanation]);
    }

    // Sementear Lições
    console.log(`Semeando lições (${data.lessons.length})...`);
    for (const l of data.lessons) {
      await client.query(`DELETE FROM lessons WHERE level = $1 AND subject = $2 AND title = $3`, [l.level, l.subject, l.title]);
      
      await client.query(`
        INSERT INTO lessons (level, subject, title, summary, content, is_premium)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [l.level, l.subject, l.title, l.summary, l.content, l.is_premium]);
    }

    console.log('Sementeira concluída com sucesso!');
  } catch (err) {
    console.error('Erro durante a migração/sementeira:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations();

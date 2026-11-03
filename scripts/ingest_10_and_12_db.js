/**
 * INGESTÃO OFICIAL DE 10ª E 12ª CLASSE NO SUPABASE
 * Lê scratch/exams_10_12_to_ingest.json e insere/atualiza todos os exames
 * na tabela `exams` da base de dados PostgreSQL/Supabase.
 */

const fs = require('fs');
const path = require('path');
const db = require('../database');

const JSON_PATH = path.join(__dirname, '..', 'scratch', 'exams_10_12_to_ingest.json');

function dbRun(query, params = []) {
  return new Promise((resolve, reject) => {
    db.run(query, params, function (err) {
      if (err) return reject(err);
      resolve(this);
    });
  });
}

async function run() {
  console.log('===============================================================');
  console.log(' INGESTÃO NO SUPABASE - ACERVO OFICIAL 10ª E 12ª CLASSE');
  console.log('===============================================================');

  if (!fs.existsSync(JSON_PATH)) {
    console.error(`Ficheiro não encontrado: ${JSON_PATH}`);
    process.exit(1);
  }

  const list = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8'));
  console.log(`Carregados ${list.length} registos do arquivo JSON.`);

  let totalDone = 0;
  for (const e of list) {
    await dbRun(
      `INSERT INTO exams (id, level, level_name, subject, subject_name, year, duration_minutes, university)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT (id) DO UPDATE SET
         level = EXCLUDED.level,
         level_name = EXCLUDED.level_name,
         subject = EXCLUDED.subject,
         subject_name = EXCLUDED.subject_name,
         year = EXCLUDED.year,
         duration_minutes = EXCLUDED.duration_minutes,
         university = EXCLUDED.university`,
      [
        e.id,
        e.level,
        e.level_name,
        e.subject,
        e.subject_name,
        e.year,
        e.duration_minutes || 120,
        e.university || 'MINEDH'
      ]
    );
    totalDone++;
  }

  console.log(`✅ Sucesso absoluto: ${totalDone} exames gravados no Supabase.`);
  process.exit(0);
}

run().catch(err => {
  console.error('❌ Erro na ingestão:', err);
  process.exit(1);
});

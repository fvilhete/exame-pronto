/**
 * INGESTÃO OFICIAL DE EXAMES UP 2025/2026 NO SUPABASE
 * Lê os 22 exames e 954 questões extraídas de scratch/up_2025_2026_parsed.json
 * e grava na base de dados com parâmetros TRI e figuras.
 */

const fs = require('fs');
const path = require('path');
const db = require('../database');

const JSON_PATH = path.join(__dirname, '..', 'scratch', 'up_2025_2026_parsed.json');

function dbRun(query, params = []) {
  return new Promise((resolve, reject) => {
    db.run(query, params, function (err) {
      if (err) return reject(err);
      resolve(this);
    });
  });
}

async function ingestAll() {
  console.log('===============================================================');
  console.log(' EXAMEPRONTO - INGESTÃO DE EXAMES UP 2025/2026 NO SUPABASE');
  console.log('===============================================================');

  if (!fs.existsSync(JSON_PATH)) {
    console.error(`Ficheiro não encontrado: ${JSON_PATH}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(JSON_PATH, 'utf-8');
  const examsData = JSON.parse(raw);
  console.log(`Carregados ${examsData.length} exames do arquivo JSON.`);

  let totalExams = 0;
  let totalQuestions = 0;

  for (const item of examsData) {
    const meta = item.meta;
    const questions = item.questions;

    console.log(`\nA gravar ${meta.subject_name} (${meta.year}) - ID: ${meta.id} [${questions.length} Qs]...`);

    // 1. Inserir ou atualizar na tabela exams
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
        meta.id,
        'superior',
        'Ensino Superior (Admissão UP)',
        meta.subject,
        meta.subject_name,
        meta.year,
        meta.duration || 120,
        'UP'
      ]
    );

    // 2. Limpar questões antigas para idempotência
    await dbRun(`DELETE FROM questions WHERE exam_id = ?`, [meta.id]);

    // 3. Inserir em lotes ou sequencialmente
    for (const q of questions) {
      await dbRun(
        `INSERT INTO questions (exam_id, number, text, options, correct_option, explanation, image_url, difficulty_b, discrimination_a)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          meta.id,
          q.number,
          q.text,
          JSON.stringify(q.options),
          q.correct_option,
          q.explanation,
          q.image_url || null,
          q.difficulty_b || '0.5',
          q.discrimination_a || '1.2'
        ]
      );
      totalQuestions++;
    }

    totalExams++;
    console.log(`✅ [${totalExams}/${examsData.length}] ${meta.subject_name} gravado com sucesso!`);
  }

  console.log('\n===============================================================');
  console.log(' RESUMO FINAL:');
  console.log(` • Exames gravados: ${totalExams}`);
  console.log(` • Questões gravadas: ${totalQuestions}`);
  console.log('===============================================================');
  process.exit(0);
}

ingestAll().catch(err => {
  console.error('❌ ERRO NA INGESTÃO:', err);
  process.exit(1);
});

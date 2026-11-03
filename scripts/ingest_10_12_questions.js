/**
 * INGESTÃO OFICIAL DE QUESTÕES DE 10ª E 12ª CLASSE NO SUPABASE / POSTGRESQL (BATCH INSERT OTIMIZADO)
 * Ingestão de mais de 3.400 questões dos exames nacionais do MINEDH.
 */

const fs = require('fs');
const path = require('path');
const db = require('../database');

const Q12_PATH = path.join(__dirname, '..', 'scratch', '12a_extracted_questions.json');
const Q10_PATH = path.join(__dirname, '..', 'scratch', '10a_extracted_questions.json');

function dbRun(query, params = []) {
  return new Promise((resolve, reject) => {
    db.run(query, params, function (err, result) {
      if (err) return reject(err);
      resolve(result);
    });
  });
}

async function insertExamQuestionsBatch(examId, questions) {
  if (!questions || questions.length === 0) return 0;

  // 1. Apagar questões antigas do exame
  await dbRun('DELETE FROM questions WHERE exam_id = ?', [examId]);

  // 2. Montar batch de inserção (pedaços de até 25 para evitar limites de parâmetros)
  const chunkSize = 25;
  let inserted = 0;

  for (let i = 0; i < questions.length; i += chunkSize) {
    const chunk = questions.slice(i, i + chunkSize);
    const valuePlaceholders = [];
    const params = [];

    chunk.forEach(q => {
      valuePlaceholders.push('(?, ?, ?, ?, ?, ?, ?, ?)');
      params.push(
        examId,
        q.number,
        q.text,
        JSON.stringify(q.options),
        q.correct_option !== undefined ? q.correct_option : 0,
        q.explanation || `Resolução oficial da Questão ${q.number} do MINEDH.`,
        '0.5',
        '1.0'
      );
    });

    const query = `
      INSERT INTO questions (exam_id, number, text, options, correct_option, explanation, difficulty_b, discrimination_a)
      VALUES ${valuePlaceholders.join(', ')}
    `;

    await dbRun(query, params);
    inserted += chunk.length;
  }

  return inserted;
}

async function run() {
  console.log('===============================================================');
  console.log(' INGESTÃO DE QUESTÕES OFICIAIS (BATCH) - 10ª E 12ª CLASSE');
  console.log('===============================================================');

  const q12Data = fs.existsSync(Q12_PATH) ? JSON.parse(fs.readFileSync(Q12_PATH, 'utf-8')) : {};
  const q10Data = fs.existsSync(Q10_PATH) ? JSON.parse(fs.readFileSync(Q10_PATH, 'utf-8')) : {};

  const totalExams12 = Object.keys(q12Data).length;
  const totalExams10 = Object.keys(q10Data).length;
  console.log(`Carregados ${totalExams12} exames da 12ª Classe.`);
  console.log(`Carregados ${totalExams10} exames da 10ª Classe.`);

  let totalQuestionsIngested = 0;
  let examsDone = 0;

  console.log('\n--- Ingerindo Questões da 12ª Classe ---');
  for (const [examId, data] of Object.entries(q12Data)) {
    const count = await insertExamQuestionsBatch(examId, data.questions);
    totalQuestionsIngested += count;
    examsDone++;
    if (examsDone % 10 === 0 || examsDone === totalExams12) {
      console.log(`[12ª Classe] Processados ${examsDone}/${totalExams12} exames (${totalQuestionsIngested} questões até agora)`);
    }
  }

  console.log('\n--- Ingerindo Questões da 10ª Classe ---');
  let exams10Done = 0;
  for (const [examId, data] of Object.entries(q10Data)) {
    const count = await insertExamQuestionsBatch(examId, data.questions);
    totalQuestionsIngested += count;
    exams10Done++;
    if (exams10Done % 10 === 0 || exams10Done === totalExams10) {
      console.log(`[10ª Classe] Processados ${exams10Done}/${totalExams10} exames (${totalQuestionsIngested} questões no total)`);
    }
  }

  console.log('\n===============================================================');
  console.log(`✅ INGESTÃO CONCLUÍDA COM SUCESSO!`);
  console.log(`   Exames atualizados: ${examsDone + exams10Done}`);
  console.log(`   Total de questões inseridas no banco: ${totalQuestionsIngested}`);
  console.log('===============================================================');
  process.exit(0);
}

run().catch(err => {
  console.error('❌ Erro durante a ingestão:', err);
  process.exit(1);
});

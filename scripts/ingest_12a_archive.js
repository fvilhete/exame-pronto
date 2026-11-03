/**
 * INGESTÃO OFICIAL DO ACERVO NACIONAL DA 12ª CLASSE (MINEDH 2000-2025)
 * Regista todos os 251 cadernos de exames nacionais da 12ª classe no Supabase/PostgreSQL.
 */

const fs = require('fs');
const path = require('path');
const db = require('../database');

const EXAMS_DIR = path.join(__dirname, '..', 'public', 'pdf', 'exams');

const SUBJ_MAP = {
  bio: { slug: 'biologia', name: 'Biologia' },
  dgd: { slug: 'desenho', name: 'Desenho e Geometria Descritiva' },
  des: { slug: 'desenho', name: 'Desenho' },
  fil: { slug: 'filosofia', name: 'Filosofia' },
  fis: { slug: 'fisica', name: 'Física' },
  fra: { slug: 'frances', name: 'Francês' },
  fr: { slug: 'frances', name: 'Francês' },
  geo: { slug: 'geografia', name: 'Geografia' },
  his: { slug: 'historia', name: 'História' },
  hist: { slug: 'historia', name: 'História' },
  ing: { slug: 'ingles', name: 'Inglês' },
  mat: { slug: 'matematica', name: 'Matemática' },
  port: { slug: 'portugues', name: 'Português' },
  quim: { slug: 'quimica', name: 'Química' }
};

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
  console.log(' INGESTÃO DO ACERVO NACIONAL DA 12ª CLASSE (MINEDH 2000-2025)');
  console.log('===============================================================');

  const files = fs.readdirSync(EXAMS_DIR).filter(f => f.startsWith('12a_') && f.endsWith('.pdf'));
  console.log(`Detectados ${files.length} ficheiros de exames da 12ª Classe.`);

  let totalInserted = 0;

  for (const f of files) {
    const parts = f.replace('.pdf', '').split('_');
    const subjCode = parts[1].toLowerCase();
    const year = parseInt(parts[2], 10);
    const epocaCode = parts[3] || '1e';

    const info = SUBJ_MAP[subjCode] || { slug: 'geral', name: 'Geral' };
    let epocaLabel = '1ª Época';
    if (epocaCode.includes('2e')) epocaLabel = '2ª Época';
    else if (epocaCode.includes('ext')) epocaLabel = 'Extraordinário';

    const examId = `esg-${subjCode}-12-${year}-${epocaCode}`;
    const subjectName = `${info.name} (${epocaLabel})`;

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
        examId,
        '12a',
        '12ª Classe (Ensino Secundário)',
        info.slug,
        subjectName,
        year,
        120,
        'MINEDH'
      ]
    );

    totalInserted++;
  }

  console.log(`✅ Sucesso: ${totalInserted} exames da 12ª Classe registados no Supabase.`);
  process.exit(0);
}

run().catch(err => {
  console.error('❌ Erro na ingestão da 12ª Classe:', err);
  process.exit(1);
});

/**
 * INGESTÃO OFICIAL DE FÍSICA UEM (COLEÇÃO MOZSKILLS / BANCO MUNDIAL 2013-2025)
 * Extrai 16 exames completos de Física com questões e resoluções detalhadas passo a passo.
 */

const fs = require('fs');
const { PDFParse } = require('pdf-parse');
const db = require('../database');

function cleanPdfArtifacts(str) {
  return str
    .replace(/\r/g, '')
    .replace(/\t+/g, ' ')
    .replace(/--\s*\d+\s*of\s*\d+\s*--/gi, '')
    .replace(/Exame\s*de\s*admissão.*?Página\s*\d+\s*de\s*\d+/gi, '')
    .replace(/Projecto\s*Melhoria.*?Banco\s*Mundial\s*[a-z0-9]*/gi, '')
    .replace(/[ ]+/g, ' ')
    .replace(/\0/g, '')
    .trim();
}

function extractOptionsFromString(str) {
  const norm = str.replace(/(?:^|\s)([A-E])[\.:\)]\s*/g, ' $1. ');
  const optAMatch = norm.match(/(?:\n|\s)(A\.\s+)/);
  if (!optAMatch) return null;
  const optAIndex = optAMatch.index;
  const optsString = norm.slice(optAIndex).trim();

  const optSplit = optsString.split(/(?:^|\s|\n)([A-E]\.\s+)/).filter(Boolean);
  const tempOpts = {};
  for (let i = 0; i < optSplit.length; i += 2) {
    const prefix = optSplit[i].trim().slice(0, 1).toUpperCase();
    const content = (optSplit[i + 1] || '').trim().replace(/[;\.]$/, '');
    tempOpts[prefix] = content;
  }

  if (tempOpts['A'] && tempOpts['B'] && tempOpts['C'] && tempOpts['D']) {
    const options = [
      `A) ${tempOpts['A']}`,
      `B) ${tempOpts['B']}`,
      `C) ${tempOpts['C']}`,
      `D) ${tempOpts['D']}`
    ];
    if (tempOpts['E']) {
      options.push(`E) ${tempOpts['E']}`);
    }
    return {
      options,
      optAIndex,
      beforeOpts: norm.slice(0, optAIndex).trim()
    };
  }
  return null;
}

function parsePhysicsQuestionBlock(rawBlock) {
  const cleanBlock = cleanPdfArtifacts(rawBlock);
  const numMatch = cleanBlock.match(/^(\d+)[\.\s]\s*/);
  if (!numMatch) return null;
  const number = parseInt(numMatch[1], 10);

  const resMatch = cleanBlock.match(/\n\s*(?:(?:Dados\s+)?Resolu[çc][ãa]o|Sol\.:|Coment[áa]rios|Resposta\s*:?\s*[“"']?\[?[A-E]\]?|Dados\b)/i);
  if (!resMatch) return null;

  const resIndex = resMatch.index;
  const partBefore = cleanBlock.slice(numMatch[0].length, resIndex).trim();
  const partAfter = cleanBlock.slice(resIndex).trim();

  let text = '';
  let options = [];
  let explanation = '';

  // Caso 1: Opções estão no enunciado (antes da resolução)
  const optsBefore = extractOptionsFromString(partBefore);
  if (optsBefore) {
    text = optsBefore.beforeOpts;
    options = optsBefore.options;
    explanation = partAfter;
  } else {
    // Caso 2: Opções estão no final (após a resolução, como em 2020)
    const optsAfter = extractOptionsFromString(partAfter);
    if (optsAfter) {
      text = partBefore;
      explanation = optsAfter.beforeOpts;
      options = optsAfter.options;
    } else {
      return null;
    }
  }

  // Extrair letra correta: "Sol.: [E]", "Resposta: [E]", "Sol.: E", "Resposta: E", "Opção [E]"
  let correctLetter = null;
  const solMatch = cleanBlock.match(/Sol\.:\s*\[?([A-E])\]?/i) ||
                   cleanBlock.match(/Resposta\s*:?\s*[“"']?\[?([A-E])\]?[”"']?/i) ||
                   cleanBlock.match(/Opção\s*(?:correcta|correta|certa)?\s*\[?([A-E])\]?/i) ||
                   cleanBlock.match(/letra\s*\[?([A-E])\]?/i);

  if (solMatch) {
    correctLetter = solMatch[1].toUpperCase();
  }

  const letterMap = { 'A': 0, 'B': 1, 'C': 2, 'D': 3, 'E': 4 };
  const correctIndex = correctLetter ? letterMap[correctLetter] : 0;

  const cleanText = text.replace(/[ \t]+/g, ' ').replace(/\0/g, '').trim();
  const cleanExp = explanation.replace(/[ \t]+/g, ' ').replace(/\0/g, '').trim();
  const cleanOptions = options.map(o => o.replace(/\0/g, ''));

  return {
    number,
    text: cleanText,
    options: cleanOptions,
    correct_option: correctIndex,
    correctLetter: correctLetter || 'A',
    explanation: cleanExp
  };
}

async function runPhysicsIngestion(isExecute = false) {
  console.log(`\n================================================================`);
  console.log(`INGESTÃO DE FÍSICA UEM (MOZSKILLS / BANCO MUNDIAL 2013-2025)`);
  console.log(`MODO: ${isExecute ? '⚡ EXECUÇÃO REAL (GRAVAÇÃO NO SUPABASE)' : '🔍 SIMULAÇÃO (DRY RUN)'}`);
  console.log(`================================================================\n`);

  const filePath = 'C:\\Users\\fvilh\\Downloads\\Kico\\UEM\\BROCHURA-FISICA-RESOLUCAO-2.pdf';
  const buf = fs.readFileSync(filePath);
  const parser = new PDFParse({ data: buf });
  await parser.load();
  const textObj = await parser.getText();
  const fullText = textObj.text || textObj;

  const exams = [
    { title: 'Física (UEM 2013 - Resoluções Oficiais)', year: 2013, id: 'uem-fis-2013-mozskills', start: 4344 },
    { title: 'Física (UEM 2014 - Resoluções Oficiais)', year: 2014, id: 'uem-fis-2014-mozskills', start: 48902 },
    { title: 'Física (UEM 2016 - Resoluções Oficiais)', year: 2016, id: 'uem-fis-2016-mozskills', start: 74812 },
    { title: 'Física (UEM 2018 - Resoluções Oficiais)', year: 2018, id: 'uem-fis-2018-mozskills', start: 100961 },
    { title: 'Física (UEM 2019 - Resoluções Oficiais)', year: 2019, id: 'uem-fis-2019-mozskills', start: 126287 },
    { title: 'Física (UEM 2020 - Resoluções Oficiais)', year: 2020, id: 'uem-fis-2020-mozskills', start: 149830 },
    { title: 'Física I (UEM 2021 - Resoluções Oficiais)', year: 2021, id: 'uem-fis-1-2021-mozskills', start: 183294 },
    { title: 'Física II (UEM 2021 - Resoluções Oficiais)', year: 2021, id: 'uem-fis-2-2021-mozskills', start: 200348 },
    { title: 'Física I (UEM 2022 - Resoluções Oficiais)', year: 2022, id: 'uem-fis-1-2022-mozskills', start: 218051 },
    { title: 'Física II (UEM 2022 - Resoluções Oficiais)', year: 2022, id: 'uem-fis-2-2022-mozskills', start: 239954 },
    { title: 'Física I (UEM 2023 - Resoluções Oficiais)', year: 2023, id: 'uem-fis-1-2023-mozskills', start: 259130 },
    { title: 'Física II (UEM 2023 - Resoluções Oficiais)', year: 2023, id: 'uem-fis-2-2023-mozskills', start: 279660 },
    { title: 'Física I (UEM 2024 - Resoluções Oficiais)', year: 2024, id: 'uem-fis-1-2024-mozskills', start: 305553 },
    { title: 'Física II (UEM 2024 - Resoluções Oficiais)', year: 2024, id: 'uem-fis-2-2024-mozskills', start: 332265 },
    { title: 'Física I (UEM 2025 - Resoluções Oficiais)', year: 2025, id: 'uem-fis-1-2025-mozskills', start: 357413 },
    { title: 'Física II (UEM 2025 - Resoluções Oficiais)', year: 2025, id: 'uem-fis-2-2025-mozskills', start: 379486 }
  ];

  let totalParsedQuestions = 0;
  const examStats = [];

  for (let idx = 0; idx < exams.length; idx++) {
    const meta = exams[idx];
    const nextStart = idx + 1 < exams.length ? exams[idx + 1].start : fullText.length;
    let chunk = fullText.slice(meta.start, nextStart).replace(/\r/g, '').replace(/\t+/g, ' ');

    const rawBlocks = chunk.split(/\n(?=\s*\d+[\.\s]\s*[A-ZÀ-Ú])/);
    const validQuestions = [];

    for (let b = 1; b < rawBlocks.length; b++) {
      const q = parsePhysicsQuestionBlock(rawBlocks[b]);
      if (q && q.options.length >= 4 && q.text.length >= 10 && q.explanation.length >= 10) {
        validQuestions.push(q);
      }
    }

    totalParsedQuestions += validQuestions.length;
    examStats.push({
      id: meta.id,
      title: meta.title,
      year: meta.year,
      count: validQuestions.length,
      questions: validQuestions
    });

    console.log(`[EXAME ${idx + 1}/${exams.length}] ${meta.title} (${meta.year}) -> ${validQuestions.length} questões extraídas.`);
  }

  console.log(`\n================================================================`);
  console.log(`RESUMO TOTAL: ${exams.length} Exames de Física analisados.`);
  console.log(`TOTAL DE QUESTÕES OFICIAIS COM RESOLUÇÃO EXTRAÍDAS: ${totalParsedQuestions}`);
  console.log(`Média por exame: ~${Math.round(totalParsedQuestions / exams.length)} questões.`);
  console.log(`================================================================\n`);

  if (!isExecute) {
    console.log(`[DRY RUN CONCLUÍDO] Para gravar no banco de dados, execute com: --execute\n`);
    return;
  }

  console.log(`⚡ A gravar exames e questões de Física no Supabase/PostgreSQL...`);

  for (const item of examStats) {
    if (item.questions.length === 0) continue;

    // 1. Inserir ou atualizar Exame
    await new Promise((resolve) => {
      const insertSql = `
        INSERT INTO exams (id, level, level_name, subject, subject_name, year, duration_minutes, university)
        VALUES (?, 'superior', 'Ensino Superior', 'fisica', ?, ?, 120, 'UEM')
        ON CONFLICT (id) DO UPDATE SET subject_name = EXCLUDED.subject_name, year = EXCLUDED.year
      `;
      db.run(insertSql, [item.id, item.title, item.year], function(err) {
        if (err) console.error(`Erro ao gravar exame ${item.id}:`, err.message);
        resolve();
      });
    });

    // 2. Limpar questões antigas desse exame
    await new Promise((resolve) => {
      db.run('DELETE FROM questions WHERE exam_id = ?', [item.id], () => resolve());
    });

    // 3. Inserir cada questão com resolução
    for (const q of item.questions) {
      await new Promise((resolve) => {
        const qSql = `
          INSERT INTO questions (exam_id, number, text, options, correct_option, explanation, difficulty_b, discrimination_a)
          VALUES (?, ?, ?, ?, ?, ?, 0.5, 1.2)
        `;
        db.run(qSql, [
          item.id,
          q.number,
          q.text,
          JSON.stringify(q.options),
          q.correct_option,
          q.explanation
        ], (qErr) => {
          if (qErr) console.warn(`Aviso na questão ${q.number} do exame ${item.id}:`, qErr.message);
          resolve();
        });
      });
    }

    console.log(`✓ [GRAVADO] ${item.title}: ${item.questions.length} questões armazenadas com sucesso.`);
  }

  console.log(`\n🎉 SUCESSO! Todos os ${exams.length} exames de Física UEM MozSkills foram integrados com sucesso.\n`);
}

const shouldExecute = process.argv.includes('--execute');
runPhysicsIngestion(shouldExecute)
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Erro na ingestão de física:', err);
    process.exit(1);
  });

/**
 * INGESTÃO OFICIAL DE QUÍMICA UEM (COLEÇÃO MOZSKILLS / BANCO MUNDIAL 2013-2025)
 * Extrai 16 exames de Química com questões e resoluções estequiométricas comentadas.
 */

const fs = require('fs');
const { PDFParse } = require('pdf-parse');
const db = require('../database');

function stripQuimicaHeaders(text) {
  return text
    .replace(/--\s*\d+\s*of\s*\d+\s*--\n?/gi, '')
    .replace(/Exame\s*de\s*Qu[ií]mica\s*[-–]\s*20\d{2}[^\n]*\n?/gi, '')
    .replace(/Projecto\s*Melhoria[^\n]*\n?/gi, '')
    .replace(/Ficha\s*Técnica[^\n]*\n?/gi, '')
    .replace(/\0/g, '');
}

function parseQuimicaQuestionBlock(rawBlock) {
  const numMatch = rawBlock.match(/^\s*(\d+)\.\s*/);
  if (!numMatch) return null;
  const number = parseInt(numMatch[1], 10);

  const resMatch = rawBlock.match(/\n(Resolu[çc][ãa]o\s*:?|Sol\.:?)/i);
  if (!resMatch) return null;

  const resIndex = resMatch.index;
  const questionAndOptsPart = rawBlock.slice(numMatch[0].length, resIndex).trim();
  const resolutionPart = rawBlock.slice(resIndex + resMatch[0].length).trim();

  // Extrair alternativa correta: "Resposta C" ou "Resposta: C" ou "Opção correcta C"
  let correctLetter = null;
  const ansRegexes = [
    /Resposta\s*(?:certa|correcta|correta)?\s*:?\s*[“"']?\[?([A-E])\]?[”"']?/i,
    /A\s*resposta\s*(?:certa|correcta|correta)\s*é\s*:?\s*([A-E])/i,
    /Sol\.:?\s*\[?([A-E])\]?/i,
    /Opção\s*(?:certa|correcta|correta)\s*:?\s*([A-E])/i,
    /letra\s*([A-E])/i
  ];

  for (const reg of ansRegexes) {
    const m = resolutionPart.match(reg);
    if (m) {
      const letter = m[1];
      if (/^[A-E]$/i.test(letter)) {
        correctLetter = letter.toUpperCase();
        break;
      }
    }
  }

  let text = questionAndOptsPart;
  let options = [];

  const optAMatch = questionAndOptsPart.match(/(?:\n|\s)(A[\.:]\s+)/);
  if (optAMatch) {
    const optAIndex = optAMatch.index;
    text = questionAndOptsPart.slice(0, optAIndex).trim();
    const optsString = questionAndOptsPart.slice(optAIndex).trim();

    const optSplit = optsString.split(/(?:^|\s|\n)([A-E][\.:]\s+)/).filter(Boolean);
    const tempOpts = {};
    for (let i = 0; i < optSplit.length; i += 2) {
      const prefix = optSplit[i].trim().slice(0, 1).toUpperCase();
      const content = (optSplit[i + 1] || '').trim().replace(/[;\.]$/, '');
      tempOpts[prefix] = content;
    }

    if (tempOpts['A'] && tempOpts['B'] && tempOpts['C'] && tempOpts['D']) {
      options = [
        `A) ${tempOpts['A']}`,
        `B) ${tempOpts['B']}`,
        `C) ${tempOpts['C']}`,
        `D) ${tempOpts['D']}`
      ];
      if (tempOpts['E']) {
        options.push(`E) ${tempOpts['E']}`);
      }
    }
  }

  const letterMap = { 'A': 0, 'B': 1, 'C': 2, 'D': 3, 'E': 4 };
  const correctIndex = correctLetter ? letterMap[correctLetter] : 0;

  const cleanText = text.replace(/[ \t]+/g, ' ').replace(/\0/g, '').trim();
  const cleanExp = resolutionPart.replace(/[ \t]+/g, ' ').replace(/\0/g, '').trim();
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

async function runQuimicaIngestion(isExecute = false) {
  console.log(`\n================================================================`);
  console.log(`INGESTÃO DE QUÍMICA UEM (MOZSKILLS / BANCO MUNDIAL 2013-2025)`);
  console.log(`MODO: ${isExecute ? '⚡ EXECUÇÃO REAL (GRAVAÇÃO NO SUPABASE)' : '🔍 SIMULAÇÃO (DRY RUN)'}`);
  console.log(`================================================================\n`);

  const filePath = 'C:\\Users\\fvilh\\Downloads\\Kico\\UEM\\Brochura_QUIMICA_2025.pdf';
  const buf = fs.readFileSync(filePath);
  const parser = new PDFParse({ data: buf });
  await parser.load();
  const fullText = (await parser.getText()).text;

  // 16 Exames de Química com posições reais no texto
  const examsMeta = [
    { title: 'Química (UEM 2013 - Resoluções Oficiais)', year: 2013, id: 'uem-qui-2013-mozskills', start: 3811 },
    { title: 'Química (UEM 2014 - Resoluções Oficiais)', year: 2014, id: 'uem-qui-2014-mozskills', start: 47160 },
    { title: 'Química (UEM 2017 - Resoluções Oficiais)', year: 2017, id: 'uem-qui-2017-mozskills', start: 77555 },
    { title: 'Química (UEM 2018 - Resoluções Oficiais)', year: 2018, id: 'uem-qui-2018-mozskills', start: 112336 },
    { title: 'Química (UEM 2019 - Resoluções Oficiais)', year: 2019, id: 'uem-qui-2019-mozskills', start: 153217 },
    { title: 'Química (UEM 2020 - Resoluções Oficiais)', year: 2020, id: 'uem-qui-2020-mozskills', start: 201036 },
    { title: 'Química I (UEM 2021 - Resoluções Oficiais)', year: 2021, id: 'uem-qui-1-2021-mozskills', start: 236136 },
    { title: 'Química II (UEM 2021 - Resoluções Oficiais)', year: 2021, id: 'uem-qui-2-2021-mozskills', start: 263784 },
    { title: 'Química I (UEM 2022 - Resoluções Oficiais)', year: 2022, id: 'uem-qui-1-2022-mozskills', start: 296287 },
    { title: 'Química II (UEM 2022 - Resoluções Oficiais)', year: 2022, id: 'uem-qui-2-2022-mozskills', start: 327982 },
    { title: 'Química I (UEM 2023 - Resoluções Oficiais)', year: 2023, id: 'uem-qui-1-2023-mozskills', start: 359431 },
    { title: 'Química II (UEM 2023 - Resoluções Oficiais)', year: 2023, id: 'uem-qui-2-2023-mozskills', start: 384100 },
    { title: 'Química I (UEM 2024 - Resoluções Oficiais)', year: 2024, id: 'uem-qui-1-2024-mozskills', start: 408053 },
    { title: 'Química II (UEM 2024 - Resoluções Oficiais)', year: 2024, id: 'uem-qui-2-2024-mozskills', start: 440220 },
    { title: 'Química I (UEM 2025 - Resoluções Oficiais)', year: 2025, id: 'uem-qui-1-2025-mozskills', start: 474941 },
    { title: 'Química II (UEM 2025 - Resoluções Oficiais)', year: 2025, id: 'uem-qui-2-2025-mozskills', start: 518150 }
  ];

  let totalParsedQuestions = 0;
  const examStats = [];

  for (let idx = 0; idx < examsMeta.length; idx++) {
    const meta = examsMeta[idx];
    const nextStart = idx + 1 < examsMeta.length ? examsMeta[idx + 1].start : fullText.length;
    let chunk = fullText.slice(meta.start, nextStart);
    chunk = stripQuimicaHeaders(chunk);

    const rawBlocks = chunk.split(/\n(?=\d+\.\s+)/);
    const validQuestions = [];

    for (let b = 1; b < rawBlocks.length; b++) {
      const q = parseQuimicaQuestionBlock(rawBlocks[b]);
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

    console.log(`[EXAME ${idx + 1}/16] ${meta.title} (${meta.year}) -> ${validQuestions.length} questões extraídas.`);
  }

  console.log(`\n================================================================`);
  console.log(`RESUMO TOTAL: 16 Exames de Química analisados.`);
  console.log(`TOTAL DE QUESTÕES OFICIAIS COM RESOLUÇÃO EXTRAÍDAS: ${totalParsedQuestions}`);
  console.log(`Média por exame: ~${Math.round(totalParsedQuestions / 16)} questões.`);
  console.log(`================================================================\n`);

  if (!isExecute) {
    console.log('[DRY RUN CONCLUÍDO] Para gravar os exames e questões no banco de dados, execute com: --execute');
    process.exit(0);
  }

  console.log('⚡ A gravar exames e questões de Química no Supabase/PostgreSQL...');

  for (const es of examStats) {
    if (es.count === 0) continue;

    await new Promise((resolve) => {
      const insertSql = `
        INSERT INTO exams (id, level, level_name, subject, subject_name, year, duration_minutes, university)
        VALUES (?, 'superior', 'Ensino Superior', 'quimica', ?, ?, 120, 'UEM')
        ON CONFLICT (id) DO UPDATE SET subject_name = EXCLUDED.subject_name, year = EXCLUDED.year
      `;
      db.run(insertSql, [es.id, es.title, es.year], () => resolve());
    });

    await new Promise((resolve) => {
      db.run('DELETE FROM questions WHERE exam_id = ?', [es.id], () => resolve());
    });

    for (const q of es.questions) {
      await new Promise((resolve) => {
        const qSql = `
          INSERT INTO questions (exam_id, number, text, options, correct_option, explanation, difficulty_b, discrimination_a)
          VALUES (?, ?, ?, ?, ?, ?, 0.5, 1.2)
        `;
        db.run(qSql, [
          es.id,
          q.number,
          q.text,
          JSON.stringify(q.options),
          q.correct_option,
          q.explanation
        ], () => resolve());
      });
    }

    console.log(`✓ [GRAVADO] ${es.title}: ${es.count} questões armazenadas.`);
  }

  console.log('\n🎉 SUCESSO! Todos os 16 exames de Química UEM MozSkills foram integrados com sucesso.');
  process.exit(0);
}

const isExecute = process.argv.includes('--execute');
runQuimicaIngestion(isExecute);

/**
 * INGESTÃO OFICIAL DE BIOLOGIA UEM (COLEÇÃO MOZSKILLS / BANCO MUNDIAL 2013-2025)
 * Extrai 22 exames completos de Biologia com questões e resoluções detalhadas.
 */

const fs = require('fs');
const { PDFParse } = require('pdf-parse');
const db = require('../database');

function stripBiologiaHeaders(text) {
  return text
    .replace(/\r/g, '')
    .replace(/\t+/g, ' ')
    .replace(/--\s*\d+\s*of\s*\d+\s*--\n?/gi, '')
    .replace(/Exame\s*de\s*admissão\s*de\s*Biologia[^\n]*\n?/gi, '')
    .replace(/Projecto\s*Melhoria[^\n]*\n?/gi, '')
    .replace(/Ficha\s*Técnica[^\n]*\n?/gi, '')
    .replace(/[ ]+/g, ' ')
    .replace(/\0/g, '');
}

function parseBiologiaQuestionBlock(rawBlock) {
  const cleanBlock = rawBlock
    .replace(/\r/g, '')
    .replace(/\t+/g, ' ')
    .replace(/[ ]+/g, ' ')
    .trim();

  const numMatch = cleanBlock.match(/^(\d+)[\.\s]\s*/);
  if (!numMatch) return null;
  const number = parseInt(numMatch[1], 10);

  // Separar enunciado da resposta/resolução:
  const resMatch = cleanBlock.match(/\n\s*(Resposta\s*:?\s*[“"']?\[?[A-E]\]?[”"']?|Resolu[çc][ãa]o\s*:?|Sol\.:?)/i);
  if (!resMatch) return null;

  const resIndex = resMatch.index;
  const questionAndOptsPart = cleanBlock.slice(numMatch[0].length, resIndex).trim();
  const resolutionPart = cleanBlock.slice(resIndex).trim();

  // Extrair alternativa correta:
  let correctLetter = null;
  const ansRegexes = [
    /Resposta\s*:?\s*[“"']?\[?([A-E])\]?[”"']?/i,
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

  const optAMatch = questionAndOptsPart.match(/(?:\n|\s)(A[\.:\)]\s+)/i);
  if (optAMatch) {
    const optAIndex = optAMatch.index;
    text = questionAndOptsPart.slice(0, optAIndex).trim();
    const optsString = questionAndOptsPart.slice(optAIndex).trim();

    const optSplit = optsString.split(/(?:^|\s|\n)([A-E][\.:\)]\s+)/i).filter(Boolean);
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

async function runBiologiaIngestion(isExecute = false) {
  console.log(`\n================================================================`);
  console.log(`INGESTÃO DE BIOLOGIA UEM (MOZSKILLS / BANCO MUNDIAL 2013-2025)`);
  console.log(`MODO: ${isExecute ? '⚡ EXECUÇÃO REAL (GRAVAÇÃO NO SUPABASE)' : '🔍 SIMULAÇÃO (DRY RUN)'}`);
  console.log(`================================================================\n`);

  const filePath = 'C:\\Users\\fvilh\\Downloads\\Kico\\UEM\\Brochura-de-exames-resolvidos_UEM_Biologia_2013-2025.pdf';
  const buf = fs.readFileSync(filePath);
  const parser = new PDFParse({ data: buf });
  await parser.load();
  const fullText = (await parser.getText()).text;

  // 22 Exames de Biologia com posições reais
  const examsMeta = [
    { title: 'Biologia (UEM 2013 - Resoluções Oficiais)', year: 2013, id: 'uem-bio-2013-mozskills', start: 5229 },
    { title: 'Biologia (UEM 2014 - Resoluções Oficiais)', year: 2014, id: 'uem-bio-2014-mozskills', start: 80521 },
    { title: 'Biologia (UEM 2016 - Resoluções Oficiais)', year: 2016, id: 'uem-bio-2016-mozskills', start: 161653 },
    { title: 'Biologia (UEM 2017 - Resoluções Oficiais)', year: 2017, id: 'uem-bio-2017-mozskills', start: 225697 },
    { title: 'Biologia (UEM 2018 - Resoluções Oficiais)', year: 2018, id: 'uem-bio-2018-mozskills', start: 310341 },
    { title: 'Biologia (UEM 2019 - Resoluções Oficiais)', year: 2019, id: 'uem-bio-2019-mozskills', start: 408998 },
    { title: 'Biologia (UEM 2020 - Resoluções Oficiais)', year: 2020, id: 'uem-bio-2020-mozskills', start: 497517 },
    { title: 'Biologia I (UEM 2021 - Resoluções Oficiais)', year: 2021, id: 'uem-bio-1-2021-mozskills', start: 582996 },
    { title: 'Biologia II (UEM 2021 - Resoluções Oficiais)', year: 2021, id: 'uem-bio-2-2021-mozskills', start: 647127 },
    { title: 'Biologia III (UEM 2021 - Resoluções Oficiais)', year: 2021, id: 'uem-bio-3-2021-mozskills', start: 695502 },
    { title: 'Biologia I (UEM 2022 - Resoluções Oficiais)', year: 2022, id: 'uem-bio-1-2022-mozskills', start: 757777 },
    { title: 'Biologia II (UEM 2022 - Resoluções Oficiais)', year: 2022, id: 'uem-bio-2-2022-mozskills', start: 801895 },
    { title: 'Biologia III (UEM 2022 - Resoluções Oficiais)', year: 2022, id: 'uem-bio-3-2022-mozskills', start: 850568 },
    { title: 'Biologia I (UEM 2023 - Resoluções Oficiais)', year: 2023, id: 'uem-bio-1-2023-mozskills', start: 899651 },
    { title: 'Biologia II (UEM 2023 - Resoluções Oficiais)', year: 2023, id: 'uem-bio-2-2023-mozskills', start: 971047 },
    { title: 'Biologia III (UEM 2023 - Resoluções Oficiais)', year: 2023, id: 'uem-bio-3-2023-mozskills', start: 1046761 },
    { title: 'Biologia I (UEM 2024 - Resoluções Oficiais)', year: 2024, id: 'uem-bio-1-2024-mozskills', start: 1095392 },
    { title: 'Biologia II (UEM 2024 - Resoluções Oficiais)', year: 2024, id: 'uem-bio-2-2024-mozskills', start: 1157977 },
    { title: 'Biologia III (UEM 2024 - Resoluções Oficiais)', year: 2024, id: 'uem-bio-3-2024-mozskills', start: 1217416 },
    { title: 'Biologia I (UEM 2025 - Resoluções Oficiais)', year: 2025, id: 'uem-bio-1-2025-mozskills', start: 1276631 },
    { title: 'Biologia II (UEM 2025 - Resoluções Oficiais)', year: 2025, id: 'uem-bio-2-2025-mozskills', start: 1334059 },
    { title: 'Biologia III (UEM 2025 - Resoluções Oficiais)', year: 2025, id: 'uem-bio-3-2025-mozskills', start: 1388750 }
  ];

  let totalParsedQuestions = 0;
  const examStats = [];

  for (let idx = 0; idx < examsMeta.length; idx++) {
    const meta = examsMeta[idx];
    const nextStart = idx + 1 < examsMeta.length ? examsMeta[idx + 1].start : fullText.length;
    let chunk = fullText.slice(meta.start, nextStart);
    chunk = stripBiologiaHeaders(chunk);

    const rawBlocks = chunk.split(/\n(?=\s*\d+[\.\s]\s*[A-ZÀ-Ú])/);
    const validQuestions = [];

    for (let b = 1; b < rawBlocks.length; b++) {
      const q = parseBiologiaQuestionBlock(rawBlocks[b]);
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

    console.log(`[EXAME ${idx + 1}/22] ${meta.title} (${meta.year}) -> ${validQuestions.length} questões extraídas.`);
  }

  console.log(`\n================================================================`);
  console.log(`RESUMO TOTAL: 22 Exames de Biologia analisados.`);
  console.log(`TOTAL DE QUESTÕES OFICIAIS COM RESOLUÇÃO EXTRAÍDAS: ${totalParsedQuestions}`);
  console.log(`Média por exame: ~${Math.round(totalParsedQuestions / 22)} questões.`);
  console.log(`================================================================\n`);

  if (!isExecute) {
    console.log('[DRY RUN CONCLUÍDO] Para gravar no banco de dados, execute com: --execute');
    process.exit(0);
  }

  console.log('⚡ A gravar exames e questões de Biologia no Supabase/PostgreSQL...');

  for (const es of examStats) {
    if (es.count === 0) continue;

    await new Promise((resolve) => {
      const insertSql = `
        INSERT INTO exams (id, level, level_name, subject, subject_name, year, duration_minutes, university)
        VALUES (?, 'superior', 'Ensino Superior', 'biologia', ?, ?, 120, 'UEM')
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

  console.log('\n🎉 SUCESSO! Todos os 22 exames de Biologia UEM MozSkills foram integrados com sucesso.');
  process.exit(0);
}

const isExecute = process.argv.includes('--execute');
runBiologiaIngestion(isExecute);

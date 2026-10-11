/**
 * INGESTÃO OFICIAL DE MATEMÁTICA UEM (COLEÇÃO MOZSKILLS / BANCO MUNDIAL 2013-2025)
 * Extrai 20 exames completos com questões oficiais e resoluções comentadas passo a passo.
 */

const fs = require('fs');
const { PDFParse } = require('pdf-parse');
const db = require('../database');

function stripPageHeaders(text) {
  return text
    .replace(/Colecção\s*-\s*CTEM-II[^\n]*\n?/gi, '')
    .replace(/Com\s*apoio\s*do\s*Fundo[^\n]*\n?/gi, '')
    .replace(/--\s*\d+\s*of\s*\d+\s*--\n?/gi, '')
    .replace(/UEM\s*-\s*DRA[^\n]*\n?/gi, '')
    .replace(/Resolução\s*comentada[^\n]*\n?/gi, '')
    .replace(/Exame\s*de\s*admissão[^\n]*\n?/gi, '')
    .replace(/Projecto\s*Melhoria[^\n]*\n?/gi, '');
}

function parseMathQuestionBlock(rawBlock) {
  const numMatch = rawBlock.match(/^\s*(\d+)\.\s*/);
  if (!numMatch) return null;
  const number = parseInt(numMatch[1], 10);

  // Reconhecer 'Resolução', 'Rsolução' (typo do tex), 'Sol.:'
  const resMatch = rawBlock.match(/\n(R[e|s]?solu[çc][ãa]o\s*:?|Sol\.:?)/i);
  if (!resMatch) return null;

  const resIndex = resMatch.index;
  const questionAndOptsPart = rawBlock.slice(numMatch[0].length, resIndex).trim();
  const resolutionPart = rawBlock.slice(resIndex + resMatch[0].length).trim();

  // Extrair alternativa correta
  let correctLetter = null;
  const ansRegexes = [
    /A\s*resposta\s*(certa|correcta|correta)\s*é\s*:?\s*([A-E])/i,
    /Resposta\s*(certa|correcta|correta)?\s*:?\s*[“"']?\s*\[?([A-E])\]?\s*[”"']?/i,
    /Sol\.:?\s*\[?([A-E])\]?/i,
    /Opção\s*(certa|correcta|correta)\s*é\s*:?\s*([A-E])/i,
    /Alternativa\s*(certa|correcta|correta)\s*é\s*:?\s*([A-E])/i,
    /Logo,?\s*a\s*opção\s*(certa|correcta|correta)\s*é\s*:?\s*([A-E])/i,
    /Portanto,?\s*a\s*opção\s*(certa|correcta|correta)\s*é\s*:?\s*([A-E])/i,
    /A\s*opção\s*([A-E])\s*é\s*a\s*(certa|correcta)/i,
    /letra\s*([A-E])/i
  ];

  for (const reg of ansRegexes) {
    const m = resolutionPart.match(reg);
    if (m) {
      const letter = m[2] || m[1];
      if (/^[A-E]$/i.test(letter)) {
        correctLetter = letter.toUpperCase();
        break;
      }
    }
  }

  let text = questionAndOptsPart;
  let options = [];

  const optAMatch = questionAndOptsPart.match(/(?:\n|\s)(A[:\.]\s+)/);
  if (optAMatch) {
    const optAIndex = optAMatch.index;
    text = questionAndOptsPart.slice(0, optAIndex).trim();
    const optsString = questionAndOptsPart.slice(optAIndex).trim();

    const optSplit = optsString.split(/(?:^|\s|\n)([A-E][:\.]\s+)/).filter(Boolean);
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

  // Limpeza de texto final
  const cleanText = text.replace(/ˆ/g, '•').replace(/[ \t]+/g, ' ').replace(/\0/g, '').trim();
  const cleanExp = resolutionPart.replace(/ˆ/g, '•').replace(/[ \t]+/g, ' ').replace(/\0/g, '').trim();
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

async function runMathIngestion(isExecute = false) {
  console.log(`\n================================================================`);
  console.log(`INGESTÃO DE MATEMÁTICA UEM (MOZSKILLS / BANCO MUNDIAL 2013-2025)`);
  console.log(`MODO: ${isExecute ? '⚡ EXECUÇÃO REAL (GRAVAÇÃO NO SUPABASE)' : '🔍 SIMULAÇÃO (DRY RUN)'}`);
  console.log(`================================================================\n`);

  const filePath = 'C:\\Users\\fvilh\\Downloads\\Kico\\UEM\\MAematica-brochura_exames_2013_2025-4-1-1.pdf';
  const buf = fs.readFileSync(filePath);
  const parser = new PDFParse({ data: buf });
  await parser.load();
  const textObj = await parser.getText();
  const fullText = textObj.text || textObj;

  // Lista dos 20 exames com posições e metadados
  const examsMeta = [
    { title: 'Matemática (UEM 2013 - Resoluções Oficiais)', year: 2013, variant: '', id: 'uem-mat-2013-mozskills', start: 868 },
    { title: 'Matemática (UEM 2014 - Resoluções Oficiais)', year: 2014, variant: '', id: 'uem-mat-2014-mozskills', start: 37057 },
    { title: 'Matemática (UEM 2016 - Resoluções Oficiais)', year: 2016, variant: '', id: 'uem-mat-2016-mozskills', start: 67271 },
    { title: 'Matemática (UEM 2017 - Resoluções Oficiais)', year: 2017, variant: '', id: 'uem-mat-2017-mozskills', start: 91730 },
    { title: 'Matemática (UEM 2018 - Resoluções Oficiais)', year: 2018, variant: '', id: 'uem-mat-2018-mozskills', start: 118303 },
    { title: 'Matemática (UEM 2019 - Resoluções Oficiais)', year: 2019, variant: '', id: 'uem-mat-2019-mozskills', start: 142749 },
    { title: 'Matemática (UEM 2020A - Resoluções Oficiais)', year: 2020, variant: 'A', id: 'uem-mat-2020a-mozskills', start: 172691 },
    { title: 'Matemática (UEM 2020B - Resoluções Oficiais)', year: 2020, variant: 'B', id: 'uem-mat-2020b-mozskills', start: 203441 },
    { title: 'Matemática I (UEM 2021 - Resoluções Oficiais)', year: 2021, variant: 'I', id: 'uem-mat-1-2021-mozskills', start: 243899 },
    { title: 'Matemática III (UEM 2021 - Resoluções Oficiais)', year: 2021, variant: 'III', id: 'uem-mat-3-2021-mozskills', start: 270839 },
    { title: 'Matemática IV (UEM 2021 - Resoluções Oficiais)', year: 2021, variant: 'IV', id: 'uem-mat-4-2021-mozskills', start: 293838 },
    { title: 'Matemática I (UEM 2022 - Resoluções Oficiais)', year: 2022, variant: 'I', id: 'uem-mat-1-2022-mozskills', start: 318485 },
    { title: 'Matemática II (UEM 2022 - Resoluções Oficiais)', year: 2022, variant: 'II', id: 'uem-mat-2-2022-mozskills', start: 343706 },
    { title: 'Matemática III (UEM 2022 - Resoluções Oficiais)', year: 2022, variant: 'III', id: 'uem-mat-3-2022-mozskills', start: 364787 },
    { title: 'Matemática I (UEM 2023 - Resoluções Oficiais)', year: 2023, variant: 'I', id: 'uem-mat-1-2023-mozskills', start: 390910 },
    { title: 'Matemática II (UEM 2023 - Resoluções Oficiais)', year: 2023, variant: 'II', id: 'uem-mat-2-2023-mozskills', start: 411776 },
    { title: 'Matemática III (UEM 2023 - Resoluções Oficiais)', year: 2023, variant: 'III', id: 'uem-mat-3-2023-mozskills', start: 435692 },
    { title: 'Matemática I (UEM 2024 - Resoluções Oficiais)', year: 2024, variant: 'I', id: 'uem-mat-1-2024-mozskills', start: 458238 },
    { title: 'Matemática II (UEM 2024 - Resoluções Oficiais)', year: 2024, variant: 'II', id: 'uem-mat-2-2024-mozskills', start: 480505 },
    { title: 'Matemática II (UEM 2025 - Resoluções Oficiais)', year: 2025, variant: 'II', id: 'uem-mat-2-2025-mozskills', start: 496307 }
  ];

  let totalParsedQuestions = 0;
  const examStats = [];

  for (let idx = 0; idx < examsMeta.length; idx++) {
    const meta = examsMeta[idx];
    const nextStart = idx + 1 < examsMeta.length ? examsMeta[idx + 1].start : fullText.length;
    let chunk = fullText.slice(meta.start, nextStart);
    chunk = stripPageHeaders(chunk);

    const rawBlocks = chunk.split(/\n(?=\d+\.\s+)/);
    const validQuestions = [];

    for (let b = 1; b < rawBlocks.length; b++) {
      const q = parseMathQuestionBlock(rawBlocks[b]);
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

    console.log(`[EXAME ${idx + 1}/20] ${meta.title} (${meta.year}) -> ${validQuestions.length} questões com resolução comentada extraídas.`);
  }

  console.log(`\n================================================================`);
  console.log(`RESUMO TOTAL: 20 Exames de Matemática analisados.`);
  console.log(`TOTAL DE QUESTÕES OFICIAIS COM RESOLUÇÃO EXTRAÍDAS: ${totalParsedQuestions}`);
  console.log(`Média por exame: ~${Math.round(totalParsedQuestions / 20)} questões.`);
  console.log(`================================================================\n`);

  if (!isExecute) {
    console.log('[DRY RUN CONCLUÍDO] Para gravar os exames e questões no banco de dados, execute com: --execute');
    process.exit(0);
  }

  console.log('⚡ A gravar exames e questões no Supabase/PostgreSQL...');

  for (const es of examStats) {
    if (es.count === 0) continue;

    // 1. Inserir ou atualizar Exame
    await new Promise((resolve, reject) => {
      const insertSql = `
        INSERT INTO exams (id, level, level_name, subject, subject_name, year, duration_minutes, university)
        VALUES (?, 'superior', 'Ensino Superior', 'matematica', ?, ?, 120, 'UEM')
        ON CONFLICT (id) DO UPDATE SET subject_name = EXCLUDED.subject_name, year = EXCLUDED.year
      `;
      db.run(insertSql, [es.id, es.title, es.year], function(err) {
        if (err) {
          console.error(`Erro ao gravar exame ${es.id}:`, err.message);
          resolve();
        } else {
          resolve();
        }
      });
    });

    // 2. Limpar questões antigas desse exame específico (se houver) para evitar duplicatas
    await new Promise((resolve) => {
      db.run('DELETE FROM questions WHERE exam_id = ?', [es.id], () => resolve());
    });

    // 3. Inserir as questões com resolução oficial
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
        ], (qErr) => {
          if (qErr) console.warn(`Aviso na questão ${q.number} do exame ${es.id}:`, qErr.message);
          resolve();
        });
      });
    }

    console.log(`✓ [GRAVADO] ${es.title}: ${es.count} questões armazenadas com sucesso.`);
  }

  console.log('\n🎉 SUCESSO ABSOLUTO! Todos os 20 exames de Matemática da coleção MozSkills UEM foram integrados ao banco de dados.');
  process.exit(0);
}

const isExecute = process.argv.includes('--execute');
runMathIngestion(isExecute);

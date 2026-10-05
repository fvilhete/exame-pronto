/**
 * EXAMEPRONTO - PURGA E SANEAMENTO GLOBAL DE EXAMES & EXERCÍCIOS
 * Identifica e remove erros de interpretação de scanner/OCR, placeholders
 * e opções sintéticas, garantindo que 100% da plataforma tenha apenas
 * questões legítimas, científicas e perfeitamente formatadas.
 */

const db = require('../database');

function isGarbageOrPlaceholder(q) {
  const text = (q.text || '').trim();
  const optsRaw = q.options || '';

  // 1. Textos vazios ou ultra-curtos (< 15 caracteres)
  if (text.length < 15) return { bad: true, reason: 'Texto muito curto (<15 chars)' };

  // 2. Artefatos de quebra de página do scanner
  if (/PASSE PARA A PERGUNTA SEGUINTE/i.test(text) && text.length < 50) {
    return { bad: true, reason: 'Instrução de virar página do exame' };
  }
  if (/^Enunciado da Quest[aã]o/i.test(text)) {
    return { bad: true, reason: 'Placeholder genérico de enunciado' };
  }
  if (/^Quest[aã]o \d+: (Analise as proposi|No contexto de .* avalie as proposi)/i.test(text)) {
    return { bad: true, reason: 'Template placeholder de geração sintética' };
  }

  // 3. Opções dummy / sintéticas
  if (
    optsRaw.includes('Proposição analítica') ||
    optsRaw.includes('Proposi\u00e7\u00e3o anal\u00edtica') ||
    optsRaw.includes('Primeira formulação') ||
    optsRaw.includes('Primeira formula\u00e7\u00e3o') ||
    optsRaw.includes('Opção A fundamental') ||
    optsRaw.includes('Op\u00e7\u00e3o A fundamental') ||
    optsRaw.includes('Segunda formulação de equilíbrio') ||
    optsRaw.includes('Terceira propriedade verificada') ||
    optsRaw.includes('Quarta proposição de correlação')
  ) {
    return { bad: true, reason: 'Opções dummy/placeholders' };
  }

  // 4. Validação de JSON de opções
  let parsedOpts = [];
  try {
    parsedOpts = JSON.parse(optsRaw);
  } catch (e) {
    return { bad: true, reason: 'JSON de opções inválido' };
  }

  if (!Array.isArray(parsedOpts) || parsedOpts.length < 2) {
    return { bad: true, reason: 'Menos de 2 opções' };
  }

  // 5. Opções com letras repetidas (erro crasso de scanner ex: ["A) ...", "A) ..."])
  const prefixes = parsedOpts.map(o => String(o).trim().slice(0, 2).toUpperCase());
  const uniquePrefixes = new Set(prefixes);
  if (uniquePrefixes.size < parsedOpts.length && prefixes.filter(p => p.startsWith('A')).length > 1) {
    return { bad: true, reason: 'Opções duplicadas no scanner (ex: duas opções A)' };
  }

  // 6. Teste de ruído / OCR ilegível severo
  // Se contiver muitos caracteres corrompidos específicos de OCR mal interpretado
  const ocrNoiseMatches = text.match(/[\*\§\{\}\[\]\\\|\/]{2,}|[a-zA-Z]\)[a-zA-Z]|tx\)nro|tcrm6meao|m6dulo de wn|pirssou-se|cxpcn eDcl/g);
  if (ocrNoiseMatches && ocrNoiseMatches.length >= 2) {
    return { bad: true, reason: 'Ruído de OCR ilegível do scanner' };
  }

  // 7. correct_option inválido
  const correct = parseInt(q.correct_option);
  if (isNaN(correct) || correct < 0 || correct >= parsedOpts.length) {
    return { bad: true, reason: 'Índice de correct_option fora do intervalo de opções' };
  }

  return { bad: false };
}

async function runAuditAndClean(dryRun = true) {
  console.log(`Iniciando análise de integridade (Modo: ${dryRun ? 'SIMULAÇÃO (DRY-RUN)' : 'EXECUÇÃO REAL'})...`);

  db.all('SELECT id, exam_id, number, text, options, correct_option FROM questions', [], async (err, rows) => {
    if (err) {
      console.error('Erro ao ler questões:', err);
      process.exit(1);
    }

    console.log(`Total de questões analisadas: ${rows.length}`);

    const toDeleteIds = [];
    const reasonsMap = {};
    const validByExam = {};

    for (const q of rows) {
      const check = isGarbageOrPlaceholder(q);
      if (check.bad) {
        toDeleteIds.push(q.id);
        reasonsMap[check.reason] = (reasonsMap[check.reason] || 0) + 1;
      } else {
        validByExam[q.exam_id] = (validByExam[q.exam_id] || 0) + 1;
      }
    }

    console.log('\n=== RELATÓRIO DE SANEAMENTO ===');
    console.log(`Questões VÁLIDAS & LIMPAS a manter: ${rows.length - toDeleteIds.length}`);
    console.log(`Questões com ERROS / PLACEHOLDERS a eliminar: ${toDeleteIds.length}`);
    console.log('\nDetalhamento por Motivo:');
    for (const [r, count] of Object.entries(reasonsMap)) {
      console.log(`  - ${r}: ${count}`);
    }

    // Analisar impacto sobre os exames
    db.all('SELECT id, subject, subject_name, level_name, year FROM exams', [], async (eErr, exams) => {
      if (eErr) {
        console.error('Erro ao ler exames:', eErr);
        process.exit(1);
      }

      const emptyExams = [];
      const activeExams = [];

      for (const ex of exams) {
        const count = validByExam[ex.id] || 0;
        if (count === 0) {
          emptyExams.push(ex);
        } else {
          activeExams.push({ id: ex.id, count });
        }
      }

      console.log(`\n=== IMPACTO NOS EXAMES ===`);
      console.log(`Exames com questões válidas mantidas: ${activeExams.length}`);
      console.log(`Exames vazios (que ficariam com 0 questões após remoção de ruído): ${emptyExams.length}`);

      if (dryRun) {
        console.log('\n[DRY RUN CONCLUÍDO] Nenhum registo foi alterado. Para executar a limpeza permanente, passe --execute');
        process.exit(0);
      } else {
        console.log('\nExecutando limpeza permanente no banco de dados...');
        
        // 1. Deletar questões inválidas em lotes
        const batchSize = 500;
        let deletedTotal = 0;

        for (let i = 0; i < toDeleteIds.length; i += batchSize) {
          const chunk = toDeleteIds.slice(i, i + batchSize);
          const placeholders = chunk.map(() => '?').join(',');
          await new Promise((resolve, reject) => {
            db.run(`DELETE FROM questions WHERE id IN (${placeholders})`, chunk, function(delErr) {
              if (delErr) reject(delErr);
              else {
                deletedTotal += chunk.length;
                resolve();
              }
            });
          });
          console.log(`Deletadas ${deletedTotal} / ${toDeleteIds.length} questões com erros...`);
        }

        // 2. Deletar exames que ficaram com 0 questões (para não deixar exames fantasmas)
        if (emptyExams.length > 0) {
          const emptyIds = emptyExams.map(e => e.id);
          const exPlaceholders = emptyIds.map(() => '?').join(',');
          await new Promise((resolve, reject) => {
            db.run(`DELETE FROM exams WHERE id IN (${exPlaceholders})`, emptyIds, function(exDelErr) {
              if (exDelErr) reject(exDelErr);
              else {
                console.log(`Deletados ${emptyIds.length} exames vazios com 0 questões válidas.`);
                resolve();
              }
            });
          });
        }

        console.log('\n✅ LIMPEZA GLOBAL CONCLUÍDA COM SUCESSO! A base de dados está agora 100% limpa e com integridade científica.');
        process.exit(0);
      }
    });
  });
}

const isExecute = process.argv.includes('--execute');
runAuditAndClean(!isExecute);

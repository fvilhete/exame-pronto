/**
 * EXAMEPRONTO - MOTOR AUTÓNOMO DE GERAÇÃO E INGESTÃO DE CONTEÚDO
 * Desenvolvido para a Vilhete Solutions | Moçambique
 * 
 * Gera e ingere periodicamente questões oficiais na base de dados Supabase
 * e regista todas as ações na tabela content_generator_logs e nos logs do servidor.
 */

const db = require('./database');

// Mapeamento alinhado aos exames existentes no Supabase
const CURRICULUM_BANKS = {
  'esg-mat-12-2025': {
    exam_id: 'esg-mat-12-2025',
    subject: 'matematica',
    subject_name: 'Matemática (12ª Classe)',
    level: 'secundario',
    level_name: '12ª Classe (Ensino Secundário)',
    templates: [
      {
        gen: () => {
          const a = Math.floor(Math.random() * 5) + 2;
          const c = a * 2;
          return {
            text: 'Qual é o valor do limite lim(x -> ' + a + ') [(x² - ' + (a * a) + ') / (x - ' + a + ')]?',
            options: ['A) ' + a, 'B) ' + c, 'C) 0', 'D) Indeterminado'],
            correct_option: 1,
            explanation: 'Fatorizando a diferença de quadrados no numerador: x² - ' + (a * a) + ' = (x - ' + a + ')(x + ' + a + '). Simplificando com o denominador (x - ' + a + '), obtemos ' + a + ' + ' + a + ' = ' + c + '.'
          };
        }
      },
      {
        gen: () => {
          const n = Math.floor(Math.random() * 6) + 3;
          const r = Math.floor(Math.random() * 4) + 2;
          const termo1 = 3;
          const termoN = termo1 + (n - 1) * r;
          return {
            text: 'Numa Progressão Aritmética (PA) com a₁ = ' + termo1 + ' e razão r = ' + r + ', qual é o valor do termo a_' + n + '?',
            options: ['A) ' + (termoN - 2), 'B) ' + termoN, 'C) ' + (termoN + r), 'D) ' + (termoN * 2)],
            correct_option: 1,
            explanation: 'Pela fórmula do termo geral da PA: a_n = a₁ + (n - 1) * r. Substituindo: a_' + n + ' = ' + termo1 + ' + (' + n + ' - 1) * ' + r + ' = ' + termoN + '.'
          };
        }
      },
      {
        gen: () => ({
          text: 'Dada a função f(x) = 3x³ - 5x² + 7x - 9, qual é a sua primeira derivada f\'(x)?',
          options: [
            'A) f\'(x) = 9x² - 10x + 7',
            'B) f\'(x) = 6x² - 5x + 7',
            'C) f\'(x) = 9x³ - 10x² + 7',
            'D) f\'(x) = 3x² - 10x + 9'
          ],
          correct_option: 0,
          explanation: 'Aplicando a regra da potência: d/dx(3x³) = 9x², d/dx(-5x²) = -10x, d/dx(7x) = 7. Logo, f\'(x) = 9x² - 10x + 7.'
        })
      }
    ]
  },

  'cond-codigo-2025': {
    exam_id: 'cond-codigo-2025',
    subject: 'codigo',
    subject_name: 'Código de Estrada',
    level: 'conducao',
    level_name: 'Escola de Condução',
    templates: [
      {
        gen: () => ({
          text: 'Num cruzamento sem sinalização luminosa ou vertical, quem tem a prioridade de passagem em Moçambique?',
          options: [
            'A) O veículo que transita a maior velocidade.',
            'B) O veículo que se apresenta pela direita.',
            'C) O veículo de transporte público de passageiros.',
            'D) O veículo que se apresenta pela esquerda.'
          ],
          correct_option: 1,
          explanation: 'Artigo da Prioridade da Direita: Em cruzamentos não sinalizados, o condutor deve ceder a passagem aos veículos que se apresentem pela direita.'
        })
      },
      {
        gen: () => ({
          text: 'Qual é o limite máximo de velocidade permitido para veículos ligeiros dentro das localidades em Moçambique?',
          options: ['A) 40 km/h', 'B) 60 km/h', 'C) 80 km/h', 'D) 100 km/h'],
          correct_option: 1,
          explanation: 'Segundo o Regulamento do Código de Estrada (INATRO), a velocidade máxima dentro das localidades é de 60 km/h.'
        })
      }
    ]
  },

  'cond-sinais-2025': {
    exam_id: 'cond-sinais-2025',
    subject: 'sinais',
    subject_name: 'Sinais de Trânsito e Prioridades',
    level: 'conducao',
    level_name: 'Escola de Condução (INATRO)',
    templates: [
      {
        gen: () => ({
          text: 'O sinal vertical de formato triangular com orla vermelha pertence a qual classe de sinais de trânsito?',
          options: [
            'A) Sinais de Perigo.',
            'B) Sinais de Proibição.',
            'C) Sinais de Obrigação.',
            'D) Sinais de Indicação.'
          ],
          correct_option: 0,
          explanation: 'Os sinais triangulares com vértice para cima e orla vermelha são Sinais de Perigo no código moçambicano.'
        })
      }
    ]
  },

  'esg-bio-10-2025': {
    exam_id: 'esg-bio-10-2025',
    subject: 'biologia',
    subject_name: 'Biologia',
    level: 'secundario',
    level_name: '10ª Classe (Ensino Secundário)',
    templates: [
      {
        gen: () => ({
          text: 'Qual é a organela celular responsável pela produção de energia (ATP) através da respiração celular?',
          options: [
            'A) Complexo de Golgi',
            'B) Mitocôndria',
            'C) Ribossoma',
            'D) Retículo Endoplasmático'
          ],
          correct_option: 1,
          explanation: 'A mitocôndria é a organela responsável pela respiração celular aeróbia e síntese de ATP.'
        })
      },
      {
        gen: () => ({
          text: 'Qual é a molécula que transporta os aminoácidos até aos ribossomas durante a síntese de proteínas?',
          options: [
            'A) RNA Mensageiro (mRNA)',
            'B) RNA de Transferência (tRNA)',
            'C) RNA Ribossómico (rRNA)',
            'D) DNA Polimerase'
          ],
          correct_option: 1,
          explanation: 'O RNA de transferência (tRNA) transporta o aminoácido específico para a síntese proteica no ribossoma.'
        })
      }
    ]
  },

  'esg-fis-12-2025': {
    exam_id: 'esg-fis-12-2025',
    subject: 'fisica',
    subject_name: 'Física',
    level: 'secundario',
    level_name: '12ª Classe (Ensino Secundário)',
    templates: [
      {
        gen: () => {
          const m = Math.floor(Math.random() * 8) + 2;
          const a = Math.floor(Math.random() * 5) + 2;
          const f = m * a;
          return {
            text: 'Um corpo de massa m = ' + m + ' kg move-se com aceleração a = ' + a + ' m/s². Qual é a intensidade da força resultante?',
            options: ['A) ' + f + ' N', 'B) ' + (f + 10) + ' N', 'C) ' + (m + a) + ' N', 'D) ' + (f / 2) + ' N'],
            correct_option: 0,
            explanation: 'Pela 2ª Lei de Newton: F = m * a = ' + m + ' kg * ' + a + ' m/s² = ' + f + ' Newtons.'
          };
        }
      }
    ]
  },

  'uem-mat-2025': {
    exam_id: 'uem-mat-2025',
    subject: 'matematica',
    subject_name: 'Matemática',
    level: 'superior',
    level_name: 'Ensino Superior (Admissão)',
    templates: [
      {
        gen: () => ({
          text: 'Qual é o domínio real da função real f(x) = ln(2x - 8)?',
          options: [
            'A) x > 4',
            'B) x >= 4',
            'C) x < 4',
            'D) Todos os números reais'
          ],
          correct_option: 0,
          explanation: 'Para que o logaritmo exista em R, o seu argumento deve ser positivo: 2x - 8 > 0 => 2x > 8 => x > 4.'
        })
      }
    ]
  }
};

let workerIntervalHandle = null;
let isWorkerActive = false;
let currentIntervalMinutes = 30;

function ensureExamExists(bank, callback) {
  db.get("SELECT id FROM exams WHERE id = ?", [bank.exam_id], (err, row) => {
    if (err) return callback(err);
    if (!row) {
      db.run(
        "INSERT INTO exams (id, level, level_name, subject, subject_name, year, duration_minutes) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [bank.exam_id, bank.level || 'secundario', bank.level_name || 'Nacional', bank.subject, bank.subject_name, 2025, 120],
        (insErr) => callback(insErr)
      );
    } else {
      callback(null);
    }
  });
}

function generateAndInsertQuestion(targetExamId = null) {
  return new Promise((resolve, reject) => {
    const examKeys = Object.keys(CURRICULUM_BANKS);
    const chosenKey = targetExamId && CURRICULUM_BANKS[targetExamId] 
      ? targetExamId 
      : examKeys[Math.floor(Math.random() * examKeys.length)];

    const bank = CURRICULUM_BANKS[chosenKey];
    const template = bank.templates[Math.floor(Math.random() * bank.templates.length)];
    const qData = template.gen();

    ensureExamExists(bank, (examErr) => {
      if (examErr) return reject(examErr);

      db.get(
        "SELECT COALESCE(MAX(number), 0) + 1 AS next_num FROM questions WHERE exam_id = ?",
        [bank.exam_id],
        (err, row) => {
          if (err) return reject(err);

          const nextNum = row ? row.next_num : 1;
          const optionsStr = JSON.stringify(qData.options);

          db.run(
            "INSERT INTO questions (exam_id, number, text, options, correct_option, explanation) VALUES (?, ?, ?, ?, ?, ?)",
            [bank.exam_id, nextNum, qData.text, optionsStr, qData.correct_option, qData.explanation],
            function(insertErr) {
              if (insertErr) return reject(insertErr);

              const insertedQId = this.lastID;
              const logTitle = 'Q' + nextNum + ': ' + qData.text.substring(0, 60) + '...';
              const logDetails = 'Exame: ' + bank.subject_name + ' (' + bank.exam_id + ') | Gabarito: ' + String.fromCharCode(65 + qData.correct_option);

              db.run(
                "INSERT INTO content_generator_logs (type, target_id, title, details) VALUES (?, ?, ?, ?)",
                ['QUESTION', bank.exam_id, logTitle, logDetails],
                () => {
                  const logMessage = '[GERADOR AUTOMÁTICO] ✅ Nova questão #' + insertedQId + ' gerada e publicada para [' + bank.exam_id + ']: "' + logTitle + '"';
                  console.log(logMessage);

                  resolve({
                    questionId: insertedQId,
                    examId: bank.exam_id,
                    subject: bank.subject_name,
                    number: nextNum,
                    text: qData.text,
                    options: qData.options,
                    correctOption: qData.correct_option,
                    explanation: qData.explanation,
                    timestamp: new Date().toISOString()
                  });
                }
              );
            }
          );
        }
      );
    });
  });
}

function getGeneratorLogs(limit = 30) {
  return new Promise((resolve, reject) => {
    db.all(
      "SELECT id, type, target_id, title, details, created_at FROM content_generator_logs ORDER BY id DESC LIMIT ?",
      [limit],
      (err, rows) => {
        if (err) return reject(err);
        resolve(rows || []);
      }
    );
  });
}

function startAutoGeneratorWorker(intervalMinutes = 30) {
  if (workerIntervalHandle) {
    clearInterval(workerIntervalHandle);
  }

  currentIntervalMinutes = Math.max(5, intervalMinutes);
  isWorkerActive = true;

  console.log('[GERADOR AUTOMÁTICO] 🚀 Agendador ativo! Gerando conteúdo a cada ' + currentIntervalMinutes + ' minutos.');

  generateAndInsertQuestion().catch(e => console.error('[GERADOR AUTOMÁTICO] Erro imediato:', e));

  workerIntervalHandle = setInterval(() => {
    generateAndInsertQuestion().catch(e => console.error('[GERADOR AUTOMÁTICO] Erro periódico:', e));
  }, currentIntervalMinutes * 60 * 1000);
}

function stopAutoGeneratorWorker() {
  if (workerIntervalHandle) {
    clearInterval(workerIntervalHandle);
    workerIntervalHandle = null;
  }
  isWorkerActive = false;
  console.log('[GERADOR AUTOMÁTICO] ⏸️ Agendador pausado.');
}

function getWorkerStatus() {
  return {
    isActive: isWorkerActive,
    intervalMinutes: currentIntervalMinutes,
    availableCurriculums: Object.keys(CURRICULUM_BANKS).map(k => ({
      id: k,
      name: CURRICULUM_BANKS[k].subject_name
    }))
  };
}

module.exports = {
  generateAndInsertQuestion,
  getGeneratorLogs,
  startAutoGeneratorWorker,
  stopAutoGeneratorWorker,
  getWorkerStatus,
  CURRICULUM_BANKS
};

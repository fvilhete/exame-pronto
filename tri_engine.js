/**
 * Algoritmo de Teoria de Resposta ao Item (TRI - Modelo Logístico 3PL) & Rating Glicko-2
 * Adaptado para os Exames Nacionais e Admissão Universitária de Moçambique (UEM, UP, ESG, INATRO)
 * ExamePronto v8.5
 */

// Parâmetros base da TRI
const D_FACTOR = 1.7; // Constante de escala logística
const DEFAULT_GUESSING = 0.20; // Probabilidade de acerto ao acaso em 5 opções (1/5)

/**
 * Probabilidade de acerto no item segundo o Modelo Logístico de 3 Parâmetros (3PL)
 * P_i(θ) = c_i + (1 - c_i) / (1 + exp(-D * a_i * (θ - b_i)))
 */
function probability3PL(theta, a = 1.2, b = 0.0, c = DEFAULT_GUESSING) {
  const exponent = -D_FACTOR * a * (theta - b);
  return c + (1 - c) / (1 + Math.exp(exponent));
}

/**
 * Estimação da Proficiência (θ) via Máxima Verossimilhança com Regularização Bayesiana (EAP aproximado)
 * @param {Array<{isCorrect: boolean, difficulty: number, discrimination?: number}>} responses
 * @returns {number} θ estimado no intervalo [-3.0, +3.0]
 */
function estimateTheta(responses) {
  if (!responses || responses.length === 0) return 0.0;

  let bestTheta = 0.0;
  let maxLogLikelihood = -Infinity;

  // Grid Search de alta fidelidade no espaço de proficiência [-3.00, +3.00] com passo de 0.05
  for (let theta = -3.0; theta <= 3.0; theta += 0.05) {
    let logLikelihood = 0;

    for (let i = 0; i < responses.length; i++) {
      const resp = responses[i];
      const a = Number(resp.discrimination) || 1.2;
      const b = Number(resp.difficulty) || 0.0;
      const c = Number(resp.guessing) || DEFAULT_GUESSING;

      const p = Math.max(1e-6, Math.min(1 - 1e-6, probability3PL(theta, a, b, c)));
      if (resp.isCorrect) {
        logLikelihood += Math.log(p);
      } else {
        logLikelihood += Math.log(1 - p);
      }
    }

    // Priori normal padrão N(0, 1) para regularização (Bayesian MAP)
    const logPrior = -0.5 * theta * theta;
    const totalPosterior = logLikelihood + logPrior;

    if (totalPosterior > maxLogLikelihood) {
      maxLogLikelihood = totalPosterior;
      bestTheta = theta;
    }
  }

  return Math.round(bestTheta * 100) / 100;
}

/**
 * Calcula o Índice de Coerência Pedagógica (detecta se houve chute ou consistência)
 * Alunos consistentes acertam fáceis e erram difíceis. Respostas caóticas reduzem a coerência.
 */
function calculateCoherence(responses, theta) {
  if (!responses || responses.length < 3) return 100;

  let consistentItems = 0;
  for (const resp of responses) {
    const b = Number(resp.difficulty) || 0.0;
    // Se a proficiência do aluno for superior à dificuldade da questão, esperava-se acerto
    const expectedCorrect = theta >= (b - 0.2);
    if ((resp.isCorrect && expectedCorrect) || (!resp.isCorrect && !expectedCorrect)) {
      consistentItems++;
    }
  }

  const ratio = Math.round((consistentItems / responses.length) * 100);
  return Math.max(35, Math.min(100, ratio));
}

/**
 * Calcula a nota completa em TRI para um conjunto de respostas
 * @param {Array<{isCorrect: boolean, difficulty?: number, discrimination?: number}>} responses
 */
function calculateTRIMetrics(responses) {
  if (!responses || responses.length === 0) {
    return {
      theta: 0.0,
      triScore: 500,
      grade20: 10.0,
      coherence: 100,
      percentile: 50,
      classification: "Intermédio"
    };
  }

  const theta = estimateTheta(responses);
  const coherence = calculateCoherence(responses, theta);

  // Escala Padronizada TRI (200 a 1000 pontos) - padrão internacional
  // θ = -3.0 -> 200 pts | θ = 0.0 -> 600 pts | θ = +3.0 -> 1000 pts
  let triScore = Math.round(200 + ((theta + 3.0) / 6.0) * 800);
  
  // Penalização leve de coerência se houve padrão claro de chute aleatório
  if (coherence < 60) {
    const penalty = Math.round((60 - coherence) * 2.5);
    triScore = Math.max(200, triScore - penalty);
  }

  // Escala Nacional Universitária Moçambicana (0 a 20.0 Valores com 1 casa decimal)
  let rawGrade20 = 10.0 + (theta * 3.33);
  if (coherence < 60) rawGrade20 -= (60 - coherence) * 0.05;
  const grade20 = Math.max(0, Math.min(20, Math.round(rawGrade20 * 10) / 10));

  // Percentil Nacional Estimado
  // Função de distribuição cumulativa normal padrão aproximada
  const z = theta;
  const t = 1.0 / (1.0 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp(-z * z / 2);
  let p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  let percentile = z > 0 ? (1.0 - p) : p;
  percentile = Math.max(1, Math.min(99, Math.round(percentile * 100)));

  let classification = "Intermédio";
  if (grade20 >= 16.0) classification = "Excelente (Admissão Provável)";
  else if (grade20 >= 14.0) classification = "Muito Bom (Competitivo)";
  else if (grade20 >= 10.0) classification = "Suficiente (Aprovado)";
  else if (grade20 >= 7.0) classification = "Em Desenvolvimento";
  else classification = "Necessita Reforço Urgente";

  return {
    theta,
    triScore,
    grade20,
    coherence,
    percentile,
    classification
  };
}

/**
 * Algoritmo Glicko-2 / Elo Adaptativo para Duelos Multiplayer
 * Calcula a variação de rating e desvio (RD) após um duelo 1v1
 */
function updateGlickoRating(p1Rating, p1RD, p2Rating, p2RD, p1Won) {
  const q = Math.log(10) / 400;
  const g = (rd) => 1 / Math.sqrt(1 + (3 * q * q * rd * rd) / (Math.PI * Math.PI));
  
  const gRD2 = g(p2RD);
  const expectedP1 = 1 / (1 + Math.pow(10, (-gRD2 * (p1Rating - p2Rating)) / 400));
  const actualScore = p1Won ? 1 : 0;

  // Fator K dinâmico baseado no RD
  const d2 = 1 / (q * q * gRD2 * gRD2 * expectedP1 * (1 - expectedP1));
  const delta = (q / ((1 / (p1RD * p1RD)) + (1 / d2))) * gRD2 * (actualScore - expectedP1);

  let newRating = Math.round(p1Rating + delta);
  newRating = Math.max(800, Math.min(3000, newRating));

  // Redução do RD após uma partida
  let newRD = Math.round(Math.sqrt(1 / ((1 / (p1RD * p1RD)) + (1 / d2))));
  newRD = Math.max(50, Math.min(350, newRD));

  return {
    newRating,
    newRD,
    delta: Math.round(delta)
  };
}

/**
 * Gera um código criptográfico único e legível para certificados moçambicanos
 * Exemplo: EXP-MZ-2026-B8E3D7A1
 */
function generateCertificateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let hash = '';
  for (let i = 0; i < 8; i++) {
    hash += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  const year = new Date().getFullYear();
  return `EXP-MZ-${year}-${hash}`;
}

module.exports = {
  probability3PL,
  estimateTheta,
  calculateTRIMetrics,
  updateGlickoRating,
  generateCertificateCode
};

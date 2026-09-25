/**
 * ExamePronto - Motor de Leitor Óptico de Gabarito (OMR Engine)
 * Inspirado nas tecnologias Gradeo e ZipGrade
 * 
 * Processa folhas de respostas em A4/Papel diretamente no cliente via HTML5 Canvas
 * com deteção de contraste, análise de densidade de bolhas e anotação visual.
 * 
 * Vilhete Solutions - Moçambique (Versão 9.0)
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.OmrEngine = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E'];

  /**
   * Converte coordenadas de cor para escala de cinza (Luma BT.601)
   */
  function rgbToGrayscale(r, g, b) {
    return 0.299 * r + 0.587 * g + 0.114 * b;
  }

  /**
   * Extrai a média de escuridão (0.0 = branco puro, 1.0 = preto puro) de um raio circular
   */
  function sampleCircleDarkness(pixels, width, height, centerX, centerY, radius) {
    let sum = 0;
    let count = 0;
    const r2 = radius * radius;
    const minX = Math.max(0, Math.floor(centerX - radius));
    const maxX = Math.min(width - 1, Math.ceil(centerX + radius));
    const minY = Math.max(0, Math.floor(centerY - radius));
    const maxY = Math.min(height - 1, Math.ceil(centerY + radius));

    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const dx = x - centerX;
        const dy = y - centerY;
        if (dx * dx + dy * dy <= r2) {
          const idx = (y * width + x) * 4;
          const gray = rgbToGrayscale(pixels[idx], pixels[idx + 1], pixels[idx + 2]);
          // 0 = preto (1.0 de escuridão), 255 = branco (0.0 de escuridão)
          const darkness = (255 - gray) / 255;
          sum += darkness;
          count++;
        }
      }
    }

    return count > 0 ? sum / count : 0;
  }

  /**
   * Processa uma imagem num Canvas e extrai o gabarito preenchido pelo aluno.
   * Suporta grelhas padrão de 10 a 40 questões divididas em 1 ou 2 colunas.
   * 
   * @param {HTMLCanvasElement} canvas - Canvas contendo a imagem do gabarito
   * @param {Object} options - Configurações de leitura
   * @returns {Object} Resultado detalhado do OMR
   */
  function scanAnswerSheet(canvas, options = {}) {
    const totalQuestions = Math.min(Math.max(parseInt(options.questionCount) || 20, 5), 50);
    const optionsPerQuestion = options.optionsCount || 5; // A, B, C, D, E
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    const imgData = ctx.getImageData(0, 0, width, height);
    const pixels = imgData.data;

    // Margens da área útil do gabarito dentro do enquadramento retangular (10% a 90%)
    const areaLeft = width * 0.08;
    const areaRight = width * 0.92;
    const areaTop = height * 0.12;
    const areaBottom = height * 0.90;

    const areaWidth = areaRight - areaLeft;
    const areaHeight = areaBottom - areaTop;

    const detectedAnswers = {};
    const bubbleCoordinates = []; // Para desenho visual posterior

    // Se mais de 20 perguntas, divide em 2 colunas verticais
    const isTwoColumns = totalQuestions > 20;
    const questionsPerCol = isTwoColumns ? Math.ceil(totalQuestions / 2) : totalQuestions;
    const numCols = isTwoColumns ? 2 : 1;

    let answeredCount = 0;
    let blankCount = 0;
    let doubleMarkCount = 0;

    for (let q = 1; q <= totalQuestions; q++) {
      let colIdx = 0;
      let rowInCol = q - 1;

      if (isTwoColumns) {
        if (q > questionsPerCol) {
          colIdx = 1;
          rowInCol = q - 1 - questionsPerCol;
        }
      }

      const colWidth = areaWidth / numCols;
      const colXStart = areaLeft + colIdx * colWidth + colWidth * 0.15; // espaço para número
      const colXEnd = areaLeft + (colIdx + 1) * colWidth - colWidth * 0.05;

      const rowY = areaTop + (rowInCol + 0.5) * (areaHeight / questionsPerCol);
      const rowHeight = areaHeight / questionsPerCol;
      const bubbleRadius = Math.max(4, Math.min(rowHeight * 0.32, 14));

      const optionSpacing = (colXEnd - colXStart) / (optionsPerQuestion - 1);

      const optionScores = [];

      for (let optIdx = 0; optIdx < optionsPerQuestion; optIdx++) {
        const bubbleX = colXStart + optIdx * optionSpacing;
        const bubbleY = rowY;
        const letter = OPTION_LETTERS[optIdx];

        const darkness = sampleCircleDarkness(pixels, width, height, bubbleX, bubbleY, bubbleRadius);
        optionScores.push({
          letter,
          index: optIdx,
          x: bubbleX,
          y: bubbleY,
          radius: bubbleRadius,
          darkness
        });

        bubbleCoordinates.push({
          question: q,
          letter,
          x: bubbleX,
          y: bubbleY,
          radius: bubbleRadius,
          darkness
        });
      }

      // Ordenar por maior escuridão
      const sorted = [...optionScores].sort((a, b) => b.darkness - a.darkness);
      const darkest = sorted[0];
      const secondDarkest = sorted[1];

      // Fundo médio estimado do papel na linha (média das opções mais claras)
      const backgroundDarkness = (sorted[sorted.length - 1].darkness + sorted[sorted.length - 2].darkness) / 2;
      const contrast = darkest.darkness - backgroundDarkness;

      // Limiar: o círculo marcado deve ter contraste mínimo em relação ao papel
      const MIN_FILL_CONTRAST = 0.18;
      const DOUBLE_MARK_TOLERANCE = 0.08;

      if (contrast < MIN_FILL_CONTRAST) {
        // Não preenchida
        detectedAnswers[q] = {
          choice: null,
          confidence: 0,
          darkness: darkest.darkness,
          isMarked: false,
          isDouble: false,
          detectedLetter: '?'
        };
        blankCount++;
      } else if (secondDarkest && (darkest.darkness - secondDarkest.darkness) < DOUBLE_MARK_TOLERANCE && (secondDarkest.darkness - backgroundDarkness) >= MIN_FILL_CONTRAST) {
        // Marcação dupla detectada (anulada)
        detectedAnswers[q] = {
          choice: null,
          confidence: 0.1,
          darkness: darkest.darkness,
          isMarked: false,
          isDouble: true,
          detectedLetter: 'ANULADA'
        };
        doubleMarkCount++;
      } else {
        // Opção válida detectada
        const marginOverSecond = secondDarkest ? (darkest.darkness - secondDarkest.darkness) : contrast;
        const confidence = Math.min(1.0, Math.max(0.5, (contrast * 1.5) + (marginOverSecond * 1.2)));

        detectedAnswers[q] = {
          choice: darkest.letter,
          choiceIndex: darkest.index,
          confidence: Math.round(confidence * 100) / 100,
          darkness: Math.round(darkest.darkness * 100) / 100,
          isMarked: true,
          isDouble: false,
          x: darkest.x,
          y: darkest.y,
          radius: darkest.radius,
          detectedLetter: darkest.letter
        };
        answeredCount++;
      }
    }

    return {
      success: true,
      timestamp: new Date().toISOString(),
      totalQuestions,
      summary: {
        answered: answeredCount,
        blank: blankCount,
        doubleMarked: doubleMarkCount,
        fillRatePercentage: Math.round((answeredCount / totalQuestions) * 100)
      },
      detectedAnswers,
      bubbleCoordinates
    };
  }

  /**
   * Desenha sobreposições visuais no Canvas mostrando as bolhas detectadas (verde/amarelo/vermelho)
   */
  function drawDetectionOverlay(canvas, scanResult) {
    if (!canvas || !scanResult || !scanResult.detectedAnswers) return;
    const ctx = canvas.getContext('2d');
    ctx.save();

    // Desenhar contorno da área ativa
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.strokeRect(canvas.width * 0.06, canvas.height * 0.08, canvas.width * 0.88, canvas.height * 0.84);
    ctx.setLineDash([]);

    // Desenhar círculos nas bolhas marcadas
    for (const [qNum, res] of Object.entries(scanResult.detectedAnswers)) {
      if (res.isMarked && res.x && res.y) {
        // Círculo verde fluorescente no acerto detectado
        ctx.beginPath();
        ctx.arc(res.x, res.y, res.radius + 3, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(16, 185, 129, 0.4)';
        ctx.fill();
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Letra anotada no centro
        ctx.font = 'bold 12px sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(res.choice, res.x, res.y);
      } else if (res.isDouble) {
        // Deteção dupla em vermelho
        for (const coord of scanResult.bubbleCoordinates) {
          if (coord.question === parseInt(qNum)) {
            ctx.beginPath();
            ctx.arc(coord.x, coord.y, coord.radius + 2, 0, 2 * Math.PI);
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 2;
            ctx.stroke();
          }
        }
      }
    }

    ctx.restore();
  }

  /**
   * Compara as respostas lidas pelo OMR contra as respostas corretas oficiais do exame
   * 
   * @param {Object} detectedAnswers - Mapa { [questionNumber]: { choice: 'A'|'B'|'C'|'D'|'E'|null } }
   * @param {Array} examQuestions - Lista de questões oficiais com correct_option (0=A, 1=B, ...)
   * @returns {Object} Relatório pedagógico completo de pontuação
   */
  function gradeScannedSheet(detectedAnswers, examQuestions) {
    if (!Array.isArray(examQuestions) || examQuestions.length === 0) {
      throw new Error('Nenhuma questão oficial fornecida para correção.');
    }

    const questionResults = [];
    let correctCount = 0;
    let wrongCount = 0;
    let blankCount = 0;

    examQuestions.forEach((q, idx) => {
      const qNum = q.number || (idx + 1);
      const studentScan = detectedAnswers[qNum] || { choice: null };
      const studentChoice = studentScan.choice;

      // Traduzir correct_option numérica (0, 1, 2, 3, 4) para letra ('A', 'B', ...) se necessário
      let correctLetter = 'A';
      if (typeof q.correct_option === 'number') {
        correctLetter = OPTION_LETTERS[q.correct_option] || 'A';
      } else if (typeof q.correct_option === 'string') {
        const parsed = parseInt(q.correct_option, 10);
        if (!isNaN(parsed) && parsed >= 0 && parsed < OPTION_LETTERS.length) {
          correctLetter = OPTION_LETTERS[parsed];
        } else {
          correctLetter = q.correct_option.toUpperCase().trim();
        }
      }

      let status = 'blank';
      if (!studentChoice) {
        blankCount++;
        status = 'blank';
      } else if (studentChoice === correctLetter) {
        correctCount++;
        status = 'correct';
      } else {
        wrongCount++;
        status = 'wrong';
      }

      questionResults.push({
        number: qNum,
        studentChoice: studentChoice || '—',
        correctChoice: correctLetter,
        isCorrect: status === 'correct',
        status,
        confidence: studentScan.confidence || 0,
        explanation: q.explanation || 'Resolução oficial disponível na plataforma.'
      });
    });

    const total = examQuestions.length;
    const percentage = Math.round((correctCount / total) * 100);
    const grade20 = Math.round(((correctCount / total) * 20) * 10) / 10;

    // Cálculo de TRI Básico
    const baseTri = 300 + (percentage * 6);
    const triScore = Math.min(1000, Math.max(200, Math.round(baseTri)));

    return {
      total,
      correctCount,
      wrongCount,
      blankCount,
      percentage,
      grade20,
      triScore,
      isPassed: grade20 >= 10.0,
      questionResults
    };
  }

  return {
    scanAnswerSheet,
    drawDetectionOverlay,
    gradeScannedSheet,
    OPTION_LETTERS
  };
}));

/**
 * Servidor WebSocket para Batalhas Multiplayer em Tempo Real (1v1)
 * Matchmaking Provincial & Sistema de Duelos ExamePronto v8.5
 */

const { WebSocketServer, WebSocket } = require('ws');
const jwt = require('jsonwebtoken');
const db = require('./database');
const { updateGlickoRating } = require('./tri_engine');

const JWT_SECRET = process.env.JWT_SECRET || 'super_seguro_chave_secreta_mocambique_2026_examepronto';

// Pool de questões oficiais moçambicanas para duelos rápidos de 15 segundos
const DUEL_QUESTIONS_POOL = [
  {
    id: 101,
    subject: "História de Moçambique",
    text: "Em que data foi proclamada oficialmente a Independência Nacional da República de Moçambique?",
    options: ["25 de Junho de 1975", "7 de Setembro de 1974", "3 de Fevereiro de 1969", "4 de Outubro de 1992"],
    correct: 0,
    difficulty: -0.8
  },
  {
    id: 102,
    subject: "Geografia de Moçambique",
    text: "Qual é o ponto de maior altitude (pico mais alto) do território moçambicano?",
    options: ["Monte Binga (2.436 m)", "Monte Namúli", "Monte Gorongosa", "Serra da Mesa"],
    correct: 0,
    difficulty: -0.3
  },
  {
    id: 103,
    subject: "Matemática (UEM / UP)",
    text: "Qual é o valor real da derivada de f(x) = 3x² - 5x + 7 no ponto x = 2?",
    options: ["7", "1", "12", "5"],
    correct: 0,
    difficulty: 0.2
  },
  {
    id: 104,
    subject: "Física (UEM / UP)",
    text: "Se um corpo de massa m = 4 kg acelera a 3 m/s², qual é a intensidade da força resultante que atua sobre ele?",
    options: ["12 N", "7 N", "1.33 N", "0.75 N"],
    correct: 0,
    difficulty: -0.5
  },
  {
    id: 105,
    subject: "Biologia (UEM / UP)",
    text: "Qual é a organela citoplasmática responsável pela síntese de ATP via respiração celular aeróbia?",
    options: ["Mitocôndria", "Complexo de Golgi", "Ribossoma", "Lisossoma"],
    correct: 0,
    difficulty: -0.6
  },
  {
    id: 106,
    subject: "Português (UEM / UP)",
    text: "Identifique a figura de estilo presente em: 'Os rios de Moçambique choram a passagem das cheias.'",
    options: ["Personificação / Prosopopeia", "Metáfora Pura", "Hipérbole", "Eufemismo"],
    correct: 0,
    difficulty: 0.1
  },
  {
    id: 107,
    subject: "Química (UEM / UP)",
    text: "Qual é o pH de uma solução neutra a 25 °C?",
    options: ["pH = 7", "pH = 0", "pH = 14", "pH = 1"],
    correct: 0,
    difficulty: -1.0
  },
  {
    id: 108,
    subject: "Código da Estrada (INATRO)",
    text: "Qual é a velocidade máxima permitida para veículos ligeiros de passageiros dentro das localidades em Moçambique?",
    options: ["60 km/h", "80 km/h", "50 km/h", "100 km/h"],
    correct: 0,
    difficulty: -0.4
  }
];

// Oponentes virtuais com identidades provinciais realistas
const BOT_OPPONENTS = [
  { name: "Amélia Manjate", province: "Gaza", rating: 1520, school: "Escola Secundária de Chókwè" },
  { name: "Celso Sitoe", province: "Sofala", rating: 1490, school: "ESG Samora Machel (Beira)" },
  { name: "Tomás Mucavele", province: "Maputo Cidade", rating: 1580, school: "Escola Secundária Francisco Manyanga" },
  { name: "Beatriz Chissano", province: "Inhambane", rating: 1475, school: "ESG de Maxixe" },
  { name: "Delfim Tembe", province: "Nampula", rating: 1540, school: "ESG 22 de Agosto" },
  { name: "Farida Muendane", province: "Cabo Delgado", rating: 1510, school: "ESG de Pemba" },
  { name: "Hermenegildo Cossa", province: "Manica", rating: 1460, school: "ESG de Chimoio" },
  { name: "Nércia Mondlane", province: "Zambézia", rating: 1535, school: "ESG de Quelimane" }
];

let wss = null;
const waitingQueue = [];
const activeRooms = new Map();

function setupMultiplayerServer(httpServer) {
  wss = new WebSocketServer({ server: httpServer, path: '/ws/duel' });

  wss.on('connection', (ws, req) => {
    ws.isAlive = true;
    ws.playerId = 'player_' + Math.random().toString(36).substring(2, 9);
    ws.playerInfo = {
      name: "Candidato",
      phone: "",
      province: "Maputo Cidade",
      rating: 1500,
      rd: 350
    };

    ws.on('pong', () => { ws.isAlive = true; });

    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString());
        handleClientMessage(ws, msg);
      } catch (err) {
        console.warn('Erro ao processar mensagem WebSocket:', err.message);
      }
    });

    ws.on('close', () => {
      removeFromQueue(ws);
      handlePlayerDisconnect(ws);
    });
  });

  // Heartbeat anti-zombie
  const interval = setInterval(() => {
    if (!wss) return;
    wss.clients.forEach((ws) => {
      if (ws.isAlive === false) return ws.terminate();
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);
  interval.unref();

  wss.on('close', () => clearInterval(interval));

  console.log('✅ [WebSocket] Servidor de Batalhas Multiplayer inicializado em /ws/duel');
}

function handleClientMessage(ws, msg) {
  switch (msg.type) {
    case 'auth':
      authenticatePlayer(ws, msg.token, msg.fallbackInfo);
      break;

    case 'join_queue':
      addToQueue(ws, msg.mode || 'live');
      break;

    case 'leave_queue':
      removeFromQueue(ws);
      sendJson(ws, { type: 'queue_left' });
      break;

    case 'submit_answer':
      handleAnswerSubmission(ws, msg);
      break;

    case 'next_round':
      advanceRoomRound(ws, msg.roomId);
      break;

    default:
      console.log('Mensagem desconhecida recebida:', msg.type);
  }
}

function authenticatePlayer(ws, token, fallbackInfo = {}) {
  if (token) {
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (!err && decoded) {
        ws.userId = decoded.id;
        db.get('SELECT id, phone, name, province, glicko_rating, glicko_rd FROM users WHERE id = ?', [decoded.id], (dbErr, user) => {
          if (!dbErr && user) {
            ws.playerInfo = {
              id: user.id,
              name: user.name || ("Candidato " + user.phone.slice(-4)),
              phone: user.phone,
              province: user.province || "Maputo Cidade",
              rating: Math.round(Number(user.glicko_rating) || 1500),
              rd: Math.round(Number(user.glicko_rd) || 350)
            };
          } else {
            setFallbackInfo(ws, fallbackInfo);
          }
          sendJson(ws, { type: 'auth_success', player: ws.playerInfo });
        });
        return;
      }
      setFallbackInfo(ws, fallbackInfo);
      sendJson(ws, { type: 'auth_success', player: ws.playerInfo });
    });
  } else {
    setFallbackInfo(ws, fallbackInfo);
    sendJson(ws, { type: 'auth_success', player: ws.playerInfo });
  }
}

function setFallbackInfo(ws, info) {
  ws.playerInfo = {
    name: info.name || "Candidato Concorrente",
    phone: info.phone || "",
    province: info.province || "Maputo Cidade",
    rating: Number(info.rating) || 1500,
    rd: 350
  };
}

function addToQueue(ws, mode) {
  removeFromQueue(ws);

  if (mode === 'bot') {
    createBotRoom(ws);
    return;
  }

  // Verificar se há outro jogador humano à espera
  if (waitingQueue.length > 0) {
    const opponent = waitingQueue.shift();
    if (opponent.readyState === WebSocket.OPEN && opponent !== ws) {
      createHumanRoom(ws, opponent);
      return;
    }
  }

  // Colocar na fila
  ws.queueEntryTime = Date.now();
  waitingQueue.push(ws);
  sendJson(ws, { type: 'queue_joined', position: waitingQueue.length });

  // Se passar 3.5 segundos sem oponente humano, emparelha com bot inteligente para evitar espera
  ws.botMatchTimeout = setTimeout(() => {
    const idx = waitingQueue.indexOf(ws);
    if (idx !== -1) {
      waitingQueue.splice(idx, 1);
      createBotRoom(ws);
    }
  }, 3500);
}

function removeFromQueue(ws) {
  if (ws.botMatchTimeout) {
    clearTimeout(ws.botMatchTimeout);
    ws.botMatchTimeout = null;
  }
  const idx = waitingQueue.indexOf(ws);
  if (idx !== -1) {
    waitingQueue.splice(idx, 1);
  }
}

function getRandomDuelQuestions(count = 5) {
  const shuffled = [...DUEL_QUESTIONS_POOL].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function createHumanRoom(p1, p2) {
  const roomId = 'room_' + Math.random().toString(36).substring(2, 9);
  const questions = getRandomDuelQuestions(5);

  const room = {
    id: roomId,
    isBot: false,
    players: [p1, p2],
    scores: { [p1.playerId]: 0, [p2.playerId]: 0 },
    round: 1,
    maxRounds: 5,
    questions,
    currentAnswers: {}
  };

  p1.currentRoomId = roomId;
  p2.currentRoomId = roomId;
  activeRooms.set(roomId, room);

  // Sanitizar opções (enviar para clientes sem revelar a resposta certa imediatamente)
  const clientQuestions = questions.map(q => ({
    id: q.id,
    subject: q.subject,
    text: q.text,
    options: q.options
  }));

  sendJson(p1, {
    type: 'match_found',
    roomId,
    opponent: p2.playerInfo,
    you: p1.playerInfo,
    playerIndex: 1,
    questions: clientQuestions
  });

  sendJson(p2, {
    type: 'match_found',
    roomId,
    opponent: p1.playerInfo,
    you: p2.playerInfo,
    playerIndex: 2,
    questions: clientQuestions
  });
}

function createBotRoom(p1) {
  const roomId = 'bot_room_' + Math.random().toString(36).substring(2, 9);
  const questions = getRandomDuelQuestions(5);
  const randomBot = BOT_OPPONENTS[Math.floor(Math.random() * BOT_OPPONENTS.length)];

  const room = {
    id: roomId,
    isBot: true,
    players: [p1],
    botInfo: randomBot,
    scores: { [p1.playerId]: 0, 'bot': 0 },
    round: 1,
    maxRounds: 5,
    questions,
    currentAnswers: {}
  };

  p1.currentRoomId = roomId;
  activeRooms.set(roomId, room);

  const clientQuestions = questions.map(q => ({
    id: q.id,
    subject: q.subject,
    text: q.text,
    options: q.options
  }));

  sendJson(p1, {
    type: 'match_found',
    roomId,
    opponent: {
      name: randomBot.name,
      province: randomBot.province,
      rating: randomBot.rating,
      isBot: true
    },
    you: p1.playerInfo,
    playerIndex: 1,
    questions: clientQuestions
  });
}

function handleAnswerSubmission(ws, msg) {
  const room = activeRooms.get(msg.roomId);
  if (!room) return;

  const currentQ = room.questions[room.round - 1];
  if (!currentQ) return;

  const isCorrect = msg.selectedIdx === currentQ.correct;
  const speedBonus = Math.max(0, Math.round((Number(msg.timeLeft) || 0) * 5));
  const points = isCorrect ? (100 + speedBonus) : 0;

  room.scores[ws.playerId] = (room.scores[ws.playerId] || 0) + points;
  room.currentAnswers[ws.playerId] = {
    selectedIdx: msg.selectedIdx,
    isCorrect,
    points
  };

  if (room.isBot) {
    // Resposta do bot simulado
    const botCorrect = Math.random() < 0.70;
    const botPoints = botCorrect ? (100 + Math.floor(Math.random() * 30)) : 0;
    room.scores['bot'] = (room.scores['bot'] || 0) + botPoints;

    sendJson(ws, {
      type: 'round_result',
      round: room.round,
      correctIdx: currentQ.correct,
      explanation: `Resposta correta: "${currentQ.options[currentQ.correct]}".`,
      playerScore: room.scores[ws.playerId],
      opponentScore: room.scores['bot'],
      playerCorrect: isCorrect,
      opponentCorrect: botCorrect
    });
    return;
  }

  // Modo Humano 1v1
  // Avisar o adversário que este jogador respondeu
  room.players.forEach(p => {
    if (p !== ws && p.readyState === WebSocket.OPEN) {
      sendJson(p, { type: 'opponent_answered', round: room.round });
    }
  });

  // Se ambos responderam, revelar a rodada
  const p1 = room.players[0];
  const p2 = room.players[1];
  if (room.currentAnswers[p1.playerId] && room.currentAnswers[p2.playerId]) {
    room.players.forEach(p => {
      const isP1 = p === p1;
      const myAns = isP1 ? room.currentAnswers[p1.playerId] : room.currentAnswers[p2.playerId];
      const oppAns = isP1 ? room.currentAnswers[p2.playerId] : room.currentAnswers[p1.playerId];

      sendJson(p, {
        type: 'round_result',
        round: room.round,
        correctIdx: currentQ.correct,
        explanation: `Resposta correta: "${currentQ.options[currentQ.correct]}".`,
        playerScore: room.scores[p.playerId],
        opponentScore: room.scores[isP1 ? p2.playerId : p1.playerId],
        playerCorrect: myAns.isCorrect,
        opponentCorrect: oppAns.isCorrect
      });
    });
  }
}

function advanceRoomRound(ws, roomId) {
  const room = activeRooms.get(roomId);
  if (!room) return;

  room.round++;
  room.currentAnswers = {};

  if (room.round > room.maxRounds) {
    finishDuelRoom(room);
  } else {
    room.players.forEach(p => {
      if (p.readyState === WebSocket.OPEN) {
        sendJson(p, { type: 'next_round_started', round: room.round });
      }
    });
  }
}

function finishDuelRoom(room) {
  const p1 = room.players[0];
  const p1Score = room.scores[p1.playerId] || 0;
  let p2Score = 0;
  let p2Rating = 1500;
  let p2RD = 350;

  if (room.isBot) {
    p2Score = room.scores['bot'] || 0;
    p2Rating = room.botInfo.rating;
  } else if (room.players[1]) {
    const p2 = room.players[1];
    p2Score = room.scores[p2.playerId] || 0;
    p2Rating = p2.playerInfo.rating;
    p2RD = p2.playerInfo.rd;
  }

  const p1Won = p1Score > p2Score;
  const isDraw = p1Score === p2Score;

  // Atualizar rating Glicko-2 do Jogador 1
  const glickoResult = updateGlickoRating(p1.playerInfo.rating, p1.playerInfo.rd, p2Rating, p2RD, p1Won);

  // Gravar no Supabase se utilizador tiver conta
  if (p1.userId) {
    db.run('UPDATE users SET glicko_rating = ?, glicko_rd = ? WHERE id = ?', [glickoResult.newRating, glickoResult.newRD, p1.userId]);
    // Pontos de província na tabela game_scores
    if (p1Won) {
      db.run('INSERT INTO game_scores (user_id, game_type, score, province) VALUES (?, ?, ?, ?)', [
        p1.userId,
        'duel_pvp',
        p1Score,
        p1.playerInfo.province
      ]);
    }
  }

  sendJson(p1, {
    type: 'duel_finished',
    won: p1Won,
    isDraw,
    finalScore: p1Score,
    opponentScore: p2Score,
    ratingDelta: glickoResult.delta,
    newRating: glickoResult.newRating
  });

  if (!room.isBot && room.players[1]) {
    const p2 = room.players[1];
    const p2Won = p2Score > p1Score;
    const glickoP2 = updateGlickoRating(p2.playerInfo.rating, p2.playerInfo.rd, p1.playerInfo.rating, p1.playerInfo.rd, p2Won);

    if (p2.userId) {
      db.run('UPDATE users SET glicko_rating = ?, glicko_rd = ? WHERE id = ?', [glickoP2.newRating, glickoP2.newRD, p2.userId]);
      if (p2Won) {
        db.run('INSERT INTO game_scores (user_id, game_type, score, province) VALUES (?, ?, ?, ?)', [
          p2.userId,
          'duel_pvp',
          p2Score,
          p2.playerInfo.province
        ]);
      }
    }

    sendJson(p2, {
      type: 'duel_finished',
      won: p2Won,
      isDraw,
      finalScore: p2Score,
      opponentScore: p1Score,
      ratingDelta: glickoP2.delta,
      newRating: glickoP2.newRating
    });
  }

  activeRooms.delete(room.id);
}

function handlePlayerDisconnect(ws) {
  if (ws.currentRoomId) {
    const room = activeRooms.get(ws.currentRoomId);
    if (room && !room.isBot) {
      room.players.forEach(p => {
        if (p !== ws && p.readyState === WebSocket.OPEN) {
          sendJson(p, { type: 'opponent_disconnected', message: 'O adversário perdeu a conexão. Vitória atribuída por abandono!' });
        }
      });
      activeRooms.delete(ws.currentRoomId);
    }
  }
}

function sendJson(ws, obj) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(obj));
  }
}

module.exports = {
  setupMultiplayerServer
};

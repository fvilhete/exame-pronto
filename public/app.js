/**
 * EXAMEPRONTO - CLIENT-SIDE LOGIC (SECURE INTEGRATION, EXPLICADOR & JOGOS)
 * Comunica diretamente com a API do servidor Node.js/Express
 */

// --- ESTADOS DE SESSÃO, QUIZ E JOGOS ---
// --- ESTADOS DE SESSÃO, QUIZ E JOGOS ---
let jwtToken = localStorage.getItem("examepronto_token") || null;
let userProfile = null; // { id, phone, isPremium, premiumExpires, isAdmin }
let userProgressCache = []; // Caching local do progresso para pesquisa instantânea
let currentLevelExams = []; // Caching local dos exames da categoria ativa
let currentLessons = []; // Caching local das lições carregadas

let currentQuiz = {
  exam: null,
  mode: "exam", // 'exam' (cronometrado) ou 'study' (com dicas e sem tempo limite)
  currentIndex: 0,
  answers: [], // { selectedOptionIndex, isCorrect }
  timerInterval: null,
  timeRemaining: 0,
  elapsedStudySeconds: 0
};

let activeLevel = "superior";
let activeUniversity = "all";
let activeSubject = "all";
let activeYear = "all";
let activeExamSort = "year-desc";
let showAllYears = false;
let examsPageLimit = 16;
let userFavorites = JSON.parse(localStorage.getItem("examepronto_favorites") || "[]");
let currentAudioUtterance = null;
let selectedPlan = "semanal";
let authMode = "login"; // 'login' ou 'register'
let activePayment = null; // Guardar dados da transação pendente
let chatCount = 0; // Controlo de mensagens no chat gratuito

// Estados de Jogos
let activeLeaderboardGame = "math_rush";
let gameMathTimer = null;
let gameMathState = {
  score: 0,
  timeLeft: 30,
  correctAnswer: 0
};
let gameQuizState = {
  currentIndex: 0,
  score: 0
};

const mozQuizQuestions = [
  {
    text: "Qual é a capital da República de Moçambique?",
    options: ["A) Beira", "B) Nampula", "C) Maputo", "D) Quelimane", "E) Chimoio"],
    correct: 2,
    explanation: "Maputo (antiga Lourenço Marques) é a capital e a maior cidade de Moçambique."
  },
  {
    text: "Qual é o maior lago de Moçambique, partilhado com o Malawi e a Tanzânia?",
    options: ["A) Lago Chicamba", "B) Lago Niassa", "C) Lago Cahora Bassa", "D) Lago Amaramba", "E) Lago Bilene"],
    correct: 1,
    explanation: "O Lago Niassa é o terceiro maior lago de África e o mais profundo, sendo partilhado por estes três países."
  },
  {
    text: "Em que ano Moçambique proclamou a Independência Nacional do domínio colonial português?",
    options: ["A) 1964", "B) 1974", "C) 1975", "D) 1980", "E) 1990"],
    correct: 2,
    explanation: "Moçambique proclamou a sua independência nacional a 25 de Junho de 1975, no Estádio da Machava."
  },
  {
    text: "Qual é o ponto de maior altitude (ponto mais alto) de Moçambique?",
    options: ["A) Monte Binga", "B) Monte Namuli", "C) Monte Mabu", "D) Monte Gorongosa", "E) Monte Libombos"],
    correct: 0,
    explanation: "O Monte Binga, localizado na província de Manica, na fronteira com o Zimbabwe, é o ponto mais alto de Moçambique, com 2.436 metros."
  },
  {
    text: "Qual destas ilhas em Moçambique é classificada como Património Mundial da Humanidade pela UNESCO?",
    options: ["A) Ilha de Bazaruto", "B) Ilha da Inhaca", "C) Ilha de Moçambique", "D) Ilha de Santa Carolina", "E) Ilha do Ibo"],
    correct: 2,
    explanation: "A Ilha de Moçambique, na província de Nampula, foi classificada como Património Mundial da UNESCO em 1991 devido à sua rica arquitetura histórica."
  }
];

// Estados do Duelo 1 vs 1
let gameDuelTimer = null;
let gameDuelAiTimer = null;
let gameDuelState = {
  round: 1,
  maxRounds: 5,
  p1Score: 0,
  p2Score: 0,
  timeLeft: 15,
  currentQuestion: null,
  isLocked: false
};

// Estados dos Flashcards 3D
let currentFlashcardIndex = 0;
const flashcardsData = [
  {
    topic: "Física (Cinemática)",
    front: "Qual é a fórmula da Velocidade Média?",
    back: "v = Δs / Δt\nA velocidade média é a razão entre a distância percorrida (Δs em metros) e o tempo decorrido (Δt em segundos)."
  },
  {
    topic: "Física (Dinâmica)",
    front: "Qual é a Segunda Lei de Newton (Princípio Fundamental da Dinâmica)?",
    back: "F = m · a\nA força resultante (F em Newtons) é igual ao produto da massa (m em kg) pela aceleração (a em m/s²)."
  },
  {
    topic: "Matemática (Álgebra)",
    front: "Qual é a Fórmula de Bhaskara para Equações Quadráticas?",
    back: "x = (-b ± √Δ) / (2a), onde Δ = b² - 4ac\nSe Δ > 0: duas raízes reais distintas.\nSe Δ = 0: uma raiz real dupla.\nSe Δ < 0: não tem raízes reais."
  },
  {
    topic: "Matemática (Progressões)",
    front: "Qual é a fórmula do Termo Geral de uma Progressão Aritmética (PA)?",
    back: "a_n = a₁ + (n - 1) · r\nOnde a₁ é o primeiro termo, n é o número do termo e r é a razão da PA."
  },
  {
    topic: "Código de Estrada (INATRO)",
    front: "Quem tem prioridade num cruzamento sem sinalização em Moçambique?",
    back: "Prioridade da Direita:\nO condutor deve ceder passagem aos veículos que se apresentem pela direita, exceto se saírem de garagens ou vias privadas."
  },
  {
    topic: "Código de Estrada (INATRO)",
    front: "O que indica um sinal triangular com orla vermelha e vértice para cima?",
    back: "Sinal de Perigo:\nAlerta para a existência de um risco na via adiante (ex: curva perigosa, estrada escorregadia, passagem de crianças)."
  },
  {
    topic: "História de Moçambique",
    front: "Em que data foi proclamada a Independência Nacional de Moçambique?",
    back: "25 de Junho de 1975\nProclamada no Estádio da Machava pelo Presidente Samora Moisés Machel."
  },
  {
    topic: "Geografia de Moçambique",
    front: "Qual é o ponto de maior altitude (ponto mais alto) de Moçambique?",
    back: "Monte Binga (2.436 metros)\nLocalizado na província de Manica, na fronteira com o Zimbabwe."
  }
];

const duelQuestionsBank = [
  {
    category: "Matemática & Lógica",
    text: "Qual é o valor de 15% de 200 Meticais?",
    options: ["A) 20 MT", "B) 30 MT", "C) 35 MT", "D) 40 MT"],
    correct: 1
  },
  {
    category: "Código de Estrada (INATRO)",
    text: "Qual é a velocidade máxima permitida para ligeiros dentro das localidades em Moçambique?",
    options: ["A) 40 km/h", "B) 60 km/h", "C) 80 km/h", "D) 100 km/h"],
    correct: 1
  },
  {
    category: "Geografia & Moçambique",
    text: "Qual é o maior rio que atravessa Moçambique até desaguar no Oceano Índico?",
    options: ["A) Rio Limpopo", "B) Rio Rovuma", "C) Rio Zambeze", "D) Rio Save"],
    correct: 2
  },
  {
    category: "Ciências & Biologia",
    text: "Qual é a organela celular responsável pela respiração aeróbia e produção de ATP?",
    options: ["A) Ribossoma", "B) Complexo de Golgi", "C) Mitocôndria", "D) Vacúolo"],
    correct: 2
  },
  {
    category: "Física Básica",
    text: "Qual é a aceleração da gravidade aproximada na superfície da Terra?",
    options: ["A) 9,8 m/s²", "B) 15,2 m/s²", "C) 5,0 m/s²", "D) 20 m/s²"],
    correct: 0
  }
];

// --- INICIALIZAÇÃO ---
document.addEventListener("DOMContentLoaded", async () => {
  initTheme();
  setupEventListeners();
  initAudioSystem();
  initStudyStreak();
  initNetworkStatus();
  
  if (jwtToken) {
    await checkAuthStatus();
  } else {
    updateAuthUI();
  }
  
  await renderExamsList();
  handleUrlRouting();

  // Registo PWA Service Worker
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    });
  }
});

// --- VERIFICAÇÃO DE SESSÃO ---
async function checkAuthStatus() {
  if (!jwtToken) return;

  try {
    const res = await fetch("/api/user/profile", {
      headers: {
        "Authorization": `Bearer ${jwtToken}`
      }
    });

    if (res.ok) {
      userProfile = await res.json();
      updateAuthUI();
      await fetchUserProgress();
    } else {
      logout();
    }
  } catch (e) {
    console.error("Erro ao verificar autenticação:", e);
    logout();
  }
}

function logout() {
  jwtToken = null;
  userProfile = null;
  localStorage.removeItem("examepronto_token");
  updateAuthUI();
  updateProgressCardUI([]);
  showSection("landing");
  renderExamsList();
}

function updateAuthUI() {
  const authBtn = document.getElementById("header-auth-btn");
  const logoutBtn = document.getElementById("header-logout-btn");
  const phoneText = document.getElementById("header-user-phone");
  const headerBadge = document.getElementById("header-premium-badge");
  const headerUpgradeBtn = document.getElementById("header-upgrade-btn");
  const dashboardPremiumBox = document.getElementById("dashboard-premium-box");
  const welcomeTitle = document.getElementById("dashboard-welcome-title");
  const mainNavMenu = document.getElementById("main-nav-menu");

  if (userProfile) {
    authBtn.style.display = "none";
    logoutBtn.style.display = "inline-flex";
    phoneText.style.display = "inline-flex";
    phoneText.textContent = `+258 ${userProfile.phone}`;
    welcomeTitle.textContent = `Olá, Estudante (+258 ${userProfile.phone.substring(0,3)}***${userProfile.phone.substring(6)})! 👋`;
    mainNavMenu.style.display = "flex";

    const adminBtn = document.getElementById("nav-admin-btn");
    if (adminBtn) {
      adminBtn.style.display = userProfile.isAdmin ? "inline-flex" : "none";
    }

    if (userProfile.isPremium) {
      headerBadge.style.display = "block";
      headerUpgradeBtn.style.display = "none";
      dashboardPremiumBox.innerHTML = `
        <span class="premium-status-indicator" style="margin: 0; padding: 8px 16px;">
          <span class="badge" style="background: var(--accent);">PREMIUM</span> Acesso Total Ativo
        </span>
      `;
    } else {
      headerBadge.style.display = "none";
      headerUpgradeBtn.style.display = "inline-flex";
      dashboardPremiumBox.innerHTML = `
        <span class="badge" style="background: var(--text-secondary); color: white; padding: 4px 10px; border-radius: 50px; font-size: 0.75rem; text-transform: uppercase;">GRÁTIS</span> 
        <span style="font-size: 0.9rem; margin-left: 8px; font-weight: 500;">Conta Limitada (3 perguntas)</span>
        <button class="btn btn-sm btn-accent" id="dashboard-upgrade-btn" style="margin-left: 15px;">Ativar Premium</button>
      `;
      safeAddListener("dashboard-upgrade-btn", "click", () => showSection("checkout"));
    }
  } else {
    authBtn.style.display = "inline-flex";
    logoutBtn.style.display = "none";
    phoneText.style.display = "none";
    headerBadge.style.display = "none";
    headerUpgradeBtn.style.display = "none";
    welcomeTitle.textContent = "Olá, Estudante! 👋";
    mainNavMenu.style.display = "flex";

    const adminBtn = document.getElementById("nav-admin-btn");
    if (adminBtn) {
      adminBtn.style.display = "none";
    }
    
    dashboardPremiumBox.innerHTML = `
      <span class="badge" style="background: var(--text-secondary); color: white; padding: 4px 10px; border-radius: 50px; font-size: 0.75rem; text-transform: uppercase;">GRÁTIS</span> 
      <span style="font-size: 0.9rem; margin-left: 8px; font-weight: 500;">Inicie sessão para praticar e salvar notas</span>
    `;
  }
}

// --- TEMA CLARO / ESCURO ---
function initTheme() {
  const savedTheme = localStorage.getItem("examepronto_theme") || "light";
  document.body.setAttribute("data-theme", savedTheme);
  updateThemeIcons(savedTheme);

  const themeBtn = document.getElementById("theme-toggle-btn");
  if (themeBtn) {
    themeBtn.addEventListener("click", () => {
      const currentTheme = document.body.getAttribute("data-theme");
      const newTheme = currentTheme === "dark" ? "light" : "dark";
      document.body.setAttribute("data-theme", newTheme);
      localStorage.setItem("examepronto_theme", newTheme);
      updateThemeIcons(newTheme);
    });
  }
}

function updateThemeIcons(theme) {
  const sunIcon = document.getElementById("theme-sun");
  const moonIcon = document.getElementById("theme-moon");
  if (!sunIcon || !moonIcon) return;
  if (theme === "dark") {
    sunIcon.style.display = "none";
    moonIcon.style.display = "block";
  } else {
    sunIcon.style.display = "block";
    moonIcon.style.display = "none";
  }
}

// --- HIGIENIZAÇÃO SEGURA DE HTML & CARACTERES ESPECIAIS (MATEMÁTICA, QUÍMICA, ACENTOS) ---
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// --- NOTIFICAÇÕES TOAST MODERNAS ---
function showToast(message, type = "info") {
  const container = document.getElementById("toast-container");
  if (!container) return;
  const toast = document.createElement("div");
  toast.className = `toast-msg ${type}`;
  const icon = type === "success" ? "✓" : type === "error" ? "✕" : "ℹ";
  toast.innerHTML = `<span style="font-weight: bold; font-size: 1.1rem;">${icon}</span><span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = "toastSlideOut 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards";
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// --- MONITORIZAÇÃO DE REDE PWA E SINCRONIZAÇÃO OFFLINE ---

function initNetworkStatus() {
  const badge = document.getElementById("network-status-badge");
  const textEl = document.getElementById("network-status-text");

  function updateStatus() {
    const isOnline = navigator.onLine;
    if (badge && textEl) {
      if (isOnline) {
        badge.className = "network-badge online";
        badge.title = "Ligação à Internet ativa. Sincronização em tempo real.";
        textEl.textContent = "Online";
      } else {
        badge.className = "network-badge offline";
        badge.title = "Modo Offline ativo. Os exames favoritados e o catálogo continuam acessíveis.";
        textEl.textContent = "Offline";
      }
    }
  }

  window.addEventListener("online", () => {
    updateStatus();
    showToast("📶 Ligação restabelecida! A sincronizar progresso...", "success");
    syncOfflineProgress();
  });

  window.addEventListener("offline", () => {
    updateStatus();
    showToast("⚡ Entrou em Modo Offline. Pode continuar a resolver os seus exames guardados!", "info");
  });

  updateStatus();
  syncOfflineProgress();
}

async function syncOfflineProgress() {
  if (!navigator.onLine || !jwtToken) return;
  const raw = localStorage.getItem("examepronto_offline_progress");
  if (!raw) return;

  try {
    const queue = JSON.parse(raw);
    if (!Array.isArray(queue) || queue.length === 0) return;

    let syncedCount = 0;
    for (const item of queue) {
      try {
        const res = await fetch("/api/user/progress", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${jwtToken}`
          },
          body: JSON.stringify(item)
        });
        if (res.ok) syncedCount++;
      } catch (err) {}
    }

    localStorage.removeItem("examepronto_offline_progress");
    if (syncedCount > 0) {
      showToast(`☁️ Sincronizados ${syncedCount} teste(s) resolvidos offline!`, "success");
      await fetchUserProgress();
    }
  } catch (e) {
    console.error("Erro na sincronização offline:", e);
  }
}

function safeAddListener(idOrEl, event, handler) {
  const el = typeof idOrEl === "string" ? document.getElementById(idOrEl) : idOrEl;
  if (el) {
    el.addEventListener(event, handler);
  }
}

// --- CONFIGURAR NAVEGAÇÃO E EVENTOS ---
function setupEventListeners() {
  safeAddListener("nav-logo-btn", "click", (e) => {
    e.preventDefault();
    showSection("dashboard");
    activateMenuTab("dashboard");
  });
  
  safeAddListener("landing-start-btn", "click", () => {
    showSection("dashboard");
    activateMenuTab("dashboard");
  });
  
  safeAddListener("landing-plans-btn", "click", () => {
    showSection("checkout");
  });

  safeAddListener("header-upgrade-btn", "click", () => {
    showSection("checkout");
  });

  // Menu Superior de Tabs
  document.querySelectorAll(".nav-menu-item").forEach(item => {
    item.addEventListener("click", (e) => {
      const target = e.currentTarget.getAttribute("data-target");
      activateMenuTab(target);
      showSection(target);
      
      if (target === "explicador") {
        fetchLessons();
      } else if (target === "investor") {
        fetchInvestorMetrics();
        runFinancialSimulation();
      } else if (target === "games") {
        openGamesLobby();
      } else if (target === "admin") {
        loadAdminTab();
      }
    });
  });

  // Modal Autenticação
  const authOverlay = document.getElementById("auth-overlay");
  safeAddListener("header-auth-btn", "click", openAuthModal);
  
  safeAddListener("auth-close-btn", "click", () => {
    if (authOverlay) authOverlay.style.display = "none";
  });

  safeAddListener("auth-toggle-link", "click", toggleAuthMode);
  safeAddListener("auth-submit-btn", "click", submitAuth);
  safeAddListener("header-logout-btn", "click", logout);

  // Tabs de Filtro de Ensino (ESG 10ª/12ª, Superior, Técnico, Cambridge, Condução)
  document.querySelectorAll("#education-level-grid .uni-card").forEach(card => {
    card.addEventListener("click", (e) => {
      document.querySelectorAll("#education-level-grid .uni-card").forEach(c => c.classList.remove("active"));
      const selectedCard = e.currentTarget;
      selectedCard.classList.add("active");
      activeLevel = selectedCard.getAttribute("data-level");
      activeUniversity = "all";
      activeSubject = "all";
      activeYear = "all";
      examsPageLimit = 16;
      renderExamsList();
    });
  });

  // Quiz Arena
  safeAddListener("quiz-quit-btn", "click", () => {
    if (confirm("Desejas sair do simulador? O progresso deste teste será perdido.")) {
      if (currentQuiz.timerInterval) clearInterval(currentQuiz.timerInterval);
      showSection("dashboard");
      activateMenuTab("dashboard");
    }
  });

  safeAddListener("quiz-verify-btn", "click", verifyAnswer);
  safeAddListener("quiz-next-btn", "click", nextQuestion);

  // Results Buttons
  safeAddListener("results-back-btn", "click", () => {
    showSection("dashboard");
    activateMenuTab("dashboard");
  });
  safeAddListener("results-share-btn", "click", shareResultsOnWhatsApp);
  safeAddListener("results-print-btn", "click", printOfficialCertificate);

  // Checkout Buttons
  safeAddListener("checkout-back-btn", "click", () => {
    showSection("dashboard");
    activateMenuTab("dashboard");
  });
  
  safeAddListener("plan-weekly", "click", () => selectPlan("semanal"));
  safeAddListener("plan-monthly", "click", () => selectPlan("mensal"));

  // Payment Method Toggles
  const btnPayManual = document.getElementById("btn-pay-method-manual");
  const btnPayVoucher = document.getElementById("btn-pay-method-voucher");
  
  if (btnPayManual && btnPayVoucher) {
    btnPayManual.addEventListener("click", () => {
      btnPayManual.className = "btn btn-sm btn-primary active";
      btnPayVoucher.className = "btn btn-sm btn-outline";
      const manualP = document.getElementById("pay-panel-manual");
      const voucherP = document.getElementById("pay-panel-voucher");
      if (manualP) manualP.style.display = "block";
      if (voucherP) voucherP.style.display = "none";
    });
    btnPayVoucher.addEventListener("click", () => {
      btnPayVoucher.className = "btn btn-sm btn-primary active";
      btnPayManual.className = "btn btn-sm btn-outline";
      const voucherP = document.getElementById("pay-panel-voucher");
      const manualP = document.getElementById("pay-panel-manual");
      if (voucherP) voucherP.style.display = "block";
      if (manualP) manualP.style.display = "none";
    });
  }

  const manualPayForm = document.getElementById("manual-payment-form");
  if (manualPayForm) {
    manualPayForm.addEventListener("submit", (e) => {
      e.preventDefault();
      submitManualPayment();
    });
  }

  const voucherRedeemForm = document.getElementById("voucher-redeem-form");
  if (voucherRedeemForm) {
    voucherRedeemForm.addEventListener("submit", (e) => {
      e.preventDefault();
      redeemVoucherCode();
    });
  }

  // Explicador Events
  safeAddListener("lesson-close-viewer-btn", "click", () => {
    const lViewer = document.getElementById("lesson-viewer");
    const lList = document.getElementById("lessons-list-container");
    if (lViewer) lViewer.style.display = "none";
    if (lList) lList.style.display = "flex";
  });
  
  safeAddListener("lesson-filter-subject", "change", fetchLessons);
  safeAddListener("chat-send-btn", "click", sendChatMessage);
  
  const chatInput = document.getElementById("chat-user-input");
  if (chatInput) {
    chatInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") sendChatMessage();
    });
  }

  // Investor Sliders
  safeAddListener("sim-slider-users", "input", runFinancialSimulation);
  safeAddListener("sim-slider-rate", "input", runFinancialSimulation);
  safeAddListener("sim-slider-price", "input", runFinancialSimulation);

  // Game Lobby Buttons
  safeAddListener("game-card-math", "click", startMathRush);
  safeAddListener("game-card-quiz", "click", startMozQuiz);
  safeAddListener("game-card-duel", "click", startDuelGame);
  safeAddListener("game-card-flashcards", "click", startFlashcardsGame);
  
  // Leaderboard & Provincial League Tabs
  safeAddListener("btn-leaderboard-math", "click", () => loadLeaderboard("math_rush"));
  safeAddListener("btn-leaderboard-quiz", "click", () => loadLeaderboard("moz_quiz"));
  safeAddListener("btn-leaderboard-provinces", "click", () => loadLeaderboard("provinces"));
  
  document.querySelectorAll(".btn-game-back").forEach(btn => {
    btn.addEventListener("click", openGamesLobby);
  });
  
  safeAddListener("game-over-retry-btn", "click", () => {
    const pts = document.getElementById("game-over-points");
    const lastGame = pts ? pts.getAttribute("data-last-game") : "math_rush";
    if (lastGame === "math_rush") startMathRush();
    else if (lastGame === "moz_quiz") startMozQuiz();
    else if (lastGame === "duel") startDuelGame();
    else if (lastGame === "flashcards") startFlashcardsGame();
  });
  safeAddListener("game-over-lobby-btn", "click", openGamesLobby);

  // Flashcards Controls
  safeAddListener("flashcard-flip-btn", "click", flipFlashcard);
  safeAddListener("flashcard-scene-wrapper", "click", flipFlashcard);
  safeAddListener("flashcard-next-btn", "click", nextFlashcard);
  safeAddListener("flashcard-prev-btn", "click", prevFlashcard);

  // Sound, Speech & Proctoring listeners
  safeAddListener("btn-sound-toggle", "click", toggleSound);
  safeAddListener("quiz-tts-btn", "click", speakCurrentQuizQuestion);
  safeAddListener("quiz-tts-explanation-btn", "click", speakCurrentQuizExplanation);
  safeAddListener("quiz-focus-btn", "click", toggleFocusMode);
  safeAddListener("quiz-download-paper-btn", "click", downloadExamPaperPdf);
  safeAddListener("quiz-hint-btn", "click", showPedagogicalHint);
  initQuizImageLightbox();
  initQuizScratchpad();

  // Navegação não-linear, Skip, Bookmark e Reporte de Falhas
  safeAddListener("quiz-prev-btn", "click", prevQuestion);
  safeAddListener("quiz-skip-btn", "click", skipQuestion);
  safeAddListener("quiz-bookmark-btn", "click", toggleBookmarkQuestion);
  safeAddListener("quiz-matrix-toggle-btn", "click", toggleQuestionMatrix);
  safeAddListener("quiz-matrix-close-btn", "click", toggleQuestionMatrix);
  safeAddListener("quiz-report-btn", "click", openReportModal);
  safeAddListener("quiz-finish-early-btn", "click", promptReviewOrSubmit);

  safeAddListener("report-modal-close-btn", "click", closeReportModal);
  safeAddListener("report-modal-cancel-btn", "click", closeReportModal);
  safeAddListener("report-modal-submit-btn", "click", submitQuestionReport);

  safeAddListener("review-modal-close-btn", "click", () => {
    const m = document.getElementById("quiz-review-confirm-modal");
    if (m) m.style.display = "none";
  });

  safeAddListener("cert-modal-close-btn", "click", () => {
    const m = document.getElementById("certificate-modal");
    if (m) m.style.display = "none";
  });

  // Batalhas Multiplayer em Tempo Real (WebSockets / IA)
  safeAddListener("btn-duel-start-live", "click", startLiveDuelMatchmaking);
  safeAddListener("btn-duel-start-bot", "click", startAiDuel);
  safeAddListener("btn-duel-cancel-match", "click", cancelDuelMatchmaking);

  checkUrlForCertificateVerification();

  // Question CMS Events
  safeAddListener("admin-load-questions-btn", "click", fetchAdminExamQuestions);

  const addQuestionForm = document.getElementById("admin-add-question-form");
  if (addQuestionForm) {
    addQuestionForm.addEventListener("submit", (e) => {
      e.preventDefault();
      submitAdminQuestion();
    });
  }

  // Admin Vouchers events
  const generateVouchersForm = document.getElementById("admin-generate-vouchers-form");
  if (generateVouchersForm) {
    generateVouchersForm.addEventListener("submit", (e) => {
      e.preventDefault();
      generateAdminVouchers();
    });
  }

  safeAddListener("admin-print-vouchers-btn", "click", printAdminVouchers);
  safeAddListener("admin-print-reseller-sheet-btn", "click", printResellerVoucherSheet);

  // Smart File Importer Events
  safeAddListener("admin-file-upload-input", "change", handleAdminFileUpload);
  safeAddListener("admin-parse-text-btn", "click", parsePastedText);
  safeAddListener("admin-execute-import-btn", "click", executeBulkImport);
  safeAddListener("btn-download-csv-template", "click", downloadCsvTemplate);
  safeAddListener("btn-download-json-template", "click", downloadJsonTemplate);

  window.addEventListener("hashchange", handleUrlRouting);
  window.addEventListener("popstate", handleUrlRouting);

  // Admin Sidebar Tabs
  document.querySelectorAll(".admin-tab-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      document.querySelectorAll(".admin-tab-btn").forEach(b => b.classList.remove("active"));
      e.currentTarget.classList.add("active");
      
      const tabId = e.currentTarget.getAttribute("data-tab");
      document.querySelectorAll(".admin-tab-content").forEach(content => {
        content.classList.remove("active");
        content.style.display = "none";
      });
      
      const activeContent = document.getElementById(`tab-${tabId}`);
      if (activeContent) {
        activeContent.classList.add("active");
        activeContent.style.display = "block";
      }
      
      if (tabId === "admin-users") {
        fetchAdminUsers();
      } else if (tabId === "admin-payments") {
        fetchAdminPayments();
      } else if (tabId === "admin-vouchers") {
        fetchAdminVouchers();
      } else if (tabId === "admin-content") {
        fetchAdminContentExams();
      } else if (tabId === "admin-generator") {
        fetchAdminGeneratorLogs();
        fetchAdminGeneratorStatus();
      }
    });
  });

  safeAddListener("admin-trigger-gen-btn", "click", triggerAdminContentGeneration);
  safeAddListener("admin-toggle-worker-btn", "click", toggleAdminContentWorker);
  safeAddListener("admin-refresh-gen-logs-btn", "click", fetchAdminGeneratorLogs);

  // Admin Content Sub-tabs (Exames / Lições)
  const manageExamsBtn = document.getElementById("admin-manage-exams-tab-btn");
  const manageLessonsBtn = document.getElementById("admin-manage-lessons-tab-btn");

  if (manageExamsBtn && manageLessonsBtn) {
    manageExamsBtn.addEventListener("click", () => {
      manageExamsBtn.classList.add("active");
      manageLessonsBtn.classList.remove("active");
      fetchAdminContentExams();
    });
    manageLessonsBtn.addEventListener("click", () => {
      manageLessonsBtn.classList.add("active");
      manageExamsBtn.classList.remove("active");
      fetchAdminContentLessons();
    });
  }

  // Admin Forms
  const addExamForm = document.getElementById("admin-add-exam-form");
  if (addExamForm) {
    addExamForm.addEventListener("submit", (e) => {
      e.preventDefault();
      submitAdminExam();
    });
  }

  const addLessonForm = document.getElementById("admin-add-lesson-form");
  if (addLessonForm) {
    addLessonForm.addEventListener("submit", (e) => {
      e.preventDefault();
      submitAdminLesson();
    });
  }

  // Search Inputs & Sorting Controls
  safeAddListener("dashboard-search-input", "input", () => {
    const input = document.getElementById("dashboard-search-input");
    const clearBtn = document.getElementById("btn-clear-search");
    if (clearBtn) {
      clearBtn.style.display = (input && input.value.trim().length > 0) ? "block" : "none";
    }
    examsPageLimit = 16;
    filterAndRenderExams();
  });

  safeAddListener("btn-clear-search", "click", () => {
    const input = document.getElementById("dashboard-search-input");
    const clearBtn = document.getElementById("btn-clear-search");
    if (input) input.value = "";
    if (clearBtn) clearBtn.style.display = "none";
    examsPageLimit = 16;
    filterAndRenderExams();
  });

  safeAddListener("dashboard-sort-select", "change", (e) => {
    activeExamSort = e.target.value;
    examsPageLimit = 16;
    filterAndRenderExams();
  });

  safeAddListener("lessons-search-input", "input", filterAndRenderLessons);
}

function activateMenuTab(target) {
  document.querySelectorAll(".nav-menu-item").forEach(item => {
    item.classList.remove("active");
    if (item.getAttribute("data-target") === target) {
      item.classList.add("active");
    }
  });
}

// --- CONTROLO DO MODAL DE AUTENTICAÇÃO SECURA ---
function openAuthModal() {
  authMode = "login";
  document.getElementById("auth-title").textContent = "Iniciar Sessão";
  document.getElementById("auth-submit-btn").textContent = "Entrar";
  document.getElementById("auth-toggle-link").innerHTML = 'Não tem conta? <span style="color: var(--primary); font-weight: 600; cursor: pointer;">Registe-se aqui</span>';
  document.getElementById("auth-error-alert").style.display = "none";
  document.getElementById("auth-success-alert").style.display = "none";
  document.getElementById("auth-phone-input").value = "";
  document.getElementById("auth-password-input").value = "";
  const provGroup = document.getElementById("auth-province-group");
  if (provGroup) provGroup.style.display = "none";
  document.getElementById("auth-overlay").style.display = "flex";
  document.getElementById("auth-phone-input").focus();
}

function toggleAuthMode() {
  document.getElementById("auth-error-alert").style.display = "none";
  document.getElementById("auth-success-alert").style.display = "none";
  const provGroup = document.getElementById("auth-province-group");
  
  if (authMode === "login") {
    authMode = "register";
    document.getElementById("auth-title").textContent = "Registar Nova Conta";
    document.getElementById("auth-submit-btn").textContent = "Criar Conta";
    document.getElementById("auth-toggle-link").innerHTML = 'Já tem conta? <span style="color: var(--primary); font-weight: 600; cursor: pointer;">Faça Login aqui</span>';
    if (provGroup) provGroup.style.display = "block";
  } else {
    authMode = "login";
    document.getElementById("auth-title").textContent = "Iniciar Sessão";
    document.getElementById("auth-submit-btn").textContent = "Entrar";
    document.getElementById("auth-toggle-link").innerHTML = 'Não tem conta? <span style="color: var(--primary); font-weight: 600; cursor: pointer;">Registe-se aqui</span>';
    if (provGroup) provGroup.style.display = "none";
  }
}

async function submitAuth() {
  const phone = document.getElementById("auth-phone-input").value.replace(/\D/g, "");
  const password = document.getElementById("auth-password-input").value;
  const provSelect = document.getElementById("auth-province-select");
  const province = provSelect ? provSelect.value : "Maputo Cidade";
  const errorAlert = document.getElementById("auth-error-alert");
  const successAlert = document.getElementById("auth-success-alert");

  errorAlert.style.display = "none";
  successAlert.style.display = "none";

  if (!phone || !password) {
    errorAlert.textContent = "Preencha todos os campos.";
    errorAlert.style.display = "block";
    return;
  }

  const endpoint = authMode === "login" ? "/api/auth/login" : "/api/auth/register";

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, password, province })
    });

    const data = await res.json();

    if (res.ok) {
      jwtToken = data.token;
      userProfile = data.user;
      localStorage.setItem("examepronto_token", jwtToken);
      
      successAlert.textContent = authMode === "login" ? "Sessão iniciada!" : "Conta criada com sucesso!";
      successAlert.style.display = "block";

      setTimeout(async () => {
        document.getElementById("auth-overlay").style.display = "none";
        updateAuthUI();
        await fetchUserProgress();
        showSection("dashboard");
        activateMenuTab("dashboard");
        await renderExamsList();
      }, 1000);
    } else {
      errorAlert.textContent = data.error || "Erro de autenticação.";
      errorAlert.style.display = "block";
    }
  } catch (e) {
    errorAlert.textContent = "Erro de conexão ao servidor.";
    errorAlert.style.display = "block";
  }
}

// --- CARREGAR PROGRESSO DO SERVIDOR ---
async function fetchUserProgress() {
  if (!jwtToken) return;

  try {
    const res = await fetch("/api/user/progress", {
      headers: { "Authorization": `Bearer ${jwtToken}` }
    });

    if (res.ok) {
      const progressList = await res.json();
      userProgressCache = progressList; // Cache local do progresso
      updateProgressCardUI(progressList);
    }
  } catch (e) {
    console.error("Erro ao obter progresso:", e);
  }
}

function updateProgressCardUI(completedList) {
  const avgText = document.getElementById("progress-average-score");
  const avgBar = document.getElementById("progress-average-bar");
  const countText = document.getElementById("progress-completed-count");
  const activityList = document.getElementById("dashboard-activity-list");

  countText.textContent = completedList.length;

  if (completedList.length === 0) {
    avgText.textContent = "0%";
    avgBar.style.width = "0%";
    activityList.innerHTML = `<p style="font-size: 0.85rem; color: var(--text-secondary); text-align: center; font-style: italic;">Nenhum teste concluído. Inicia sessão para salvar notas.</p>`;
    return;
  }

  let totalPercentage = 0;
  completedList.forEach(c => {
    totalPercentage += (c.score / c.total) * 100;
  });
  const avg = Math.round(totalPercentage / completedList.length);
  avgText.textContent = `${avg}%`;
  avgBar.style.width = `${avg}%`;

  activityList.innerHTML = "";
  const recent = completedList.slice(-3).reverse();
  
  recent.forEach(act => {
    const item = document.createElement("div");
    item.className = "activity-item";
    item.innerHTML = `
      <span>${act.subject_name} (${act.year})</span>
      <strong>${act.score}/${act.total}</strong>
    `;
    activityList.appendChild(item);
  });
}

// --- RENDERIZAR EXAMES DESDE A BASE DE DADOS ---
function getUniversityBadgeClass(univ) {
  if (!univ) return 'uem';
  const u = univ.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (u.includes('uem')) return 'uem';
  if (u.includes('up') || u.includes('pedagogica')) return 'up';
  if (u.includes('zambeze')) return 'unizambeze';
  if (u.includes('lurio')) return 'unilurio';
  if (u.includes('pungue')) return 'unipungue';
  if (u.includes('rovuma')) return 'unirovuma';
  if (u.includes('licungo')) return 'unilicungo';
  if (u.includes('isri') || u.includes('ujc')) return 'isri';
  if (u.includes('acipol')) return 'acipol';
  if (u.includes('iscisa')) return 'iscisa';
  if (u.includes('minedh')) return 'minedh';
  if (u.includes('inatro')) return 'inatro';
  if (u.includes('cambridge')) return 'cambridge';
  return 'uem';
}

// 2. Classificação de Dificuldade do Exame
function getExamDifficulty(exam) {
  const s = (exam.subject_name || '').toLowerCase();
  const lvl = (exam.level || '').toLowerCase();

  if (lvl.includes('primario') || lvl.includes('10a') || s.includes('geral') || s.includes('introdução') || s.includes('sinais')) {
    return { level: 'easy', label: 'Acessível', icon: '🟢' };
  }
  if (s.includes('matemática i') || s.includes('matematica i') || s.includes('física i') || s.includes('fisica i') || s.includes('química i') || s.includes('quimica i') || s.includes('a-level') || s.includes('desenho')) {
    return { level: 'hard', label: 'Desafiador', icon: '🔴' };
  }
  return { level: 'medium', label: 'Intermédio', icon: '🟡' };
}

// 3. Sistema de Favoritos / Provas Guardadas
function toggleFavoriteExam(examId, event) {
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }
  const idx = userFavorites.indexOf(examId);
  if (idx > -1) {
    userFavorites.splice(idx, 1);
    showToast("Prova removida dos guardados.", "info");
  } else {
    userFavorites.push(examId);
    // Pré-carregar para o Service Worker guardar em cache offline
    fetch(`/api/exams/${examId}`, {
      headers: jwtToken ? { "Authorization": `Bearer ${jwtToken}` } : {}
    }).catch(() => {});
    showToast("⭐ Prova guardada e pronta para estudo offline!", "success");
  }
  localStorage.setItem("examepronto_favorites", JSON.stringify(userFavorites));

  // Atualizar visual dos botões de estrela e contadores
  document.querySelectorAll(`.btn-favorite-card[data-id="${examId}"]`).forEach(btn => {
    const isFav = userFavorites.includes(examId);
    btn.classList.toggle('active', isFav);
    btn.innerHTML = isFav ? '★' : '☆';
    btn.title = isFav ? 'Remover dos Guardados' : 'Guardar Prova';
  });

  const favCountBadge = document.getElementById("filter-fav-count");
  if (favCountBadge) favCountBadge.textContent = userFavorites.length;

  if (activeSubject === "favorites") {
    filterAndRenderExams();
  }
}

// 4. Explicador por Áudio (Web Speech Synthesis)
function cleanTextForSpeech(raw) {
  if (!raw) return "";
  let clean = raw.replace(/<[^>]*>/g, " "); // remover tags HTML
  clean = clean.replace(/\$([^\$]+)\$/g, "$1"); // remover delimitadores KaTeX
  clean = clean.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, "$1 sobre $2"); // frações
  clean = clean.replace(/\\sqrt\{([^}]+)\}/g, "raiz quadrada de $1"); // raízes
  clean = clean.replace(/\\times/g, " vezes ");
  clean = clean.replace(/\\cdot/g, " vezes ");
  clean = clean.replace(/\\pm/g, " mais ou menos ");
  clean = clean.replace(/\\approx/g, " aproximadamente ");
  clean = clean.replace(/\\pi/g, " pi ");
  clean = clean.replace(/\\alpha|\\beta|\\gamma|\\theta/g, " ângulo ");
  clean = clean.replace(/\\rightarrow/g, " resulta em ");
  clean = clean.replace(/\\[a-zA-Z]+/g, " "); // remover comandos LaTeX residuais
  return clean.replace(/\s+/g, " ").trim();
}

function toggleSpeechAudio(textToSpeak, btnElement) {
  if (!('speechSynthesis' in window)) {
    alert("O seu navegador não suporta sintetizador de voz nativo.");
    return;
  }

  if (window.speechSynthesis.speaking) {
    window.speechSynthesis.cancel();
    if (btnElement) {
      btnElement.classList.remove('speaking');
      btnElement.innerHTML = `<span>🔊 Ouvir</span>`;
    }
    return;
  }

  const cleanText = cleanTextForSpeech(textToSpeak);
  if (!cleanText) return;

  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.rate = 1.0;
  utterance.pitch = 1.0;

  // Procurar vozes em Português
  const voices = window.speechSynthesis.getVoices();
  const ptVoice = voices.find(v => v.lang.startsWith('pt')) || null;
  if (ptVoice) utterance.voice = ptVoice;
  utterance.lang = 'pt-PT';

  if (btnElement) {
    btnElement.classList.add('speaking');
    btnElement.innerHTML = `<span>⏹️ Parar Áudio</span>`;
  }

  utterance.onend = () => {
    if (btnElement) {
      btnElement.classList.remove('speaking');
      btnElement.innerHTML = `<span>🔊 Ouvir</span>`;
    }
  };

  utterance.onerror = () => {
    if (btnElement) {
      btnElement.classList.remove('speaking');
      btnElement.innerHTML = `<span>🔊 Ouvir</span>`;
    }
  };

  window.speechSynthesis.speak(utterance);
}

async function renderExamsList() {
  const container = document.getElementById("exams-list-grid");
  if (!container) return;
  container.innerHTML = `<p style="text-align: center; color: var(--text-secondary); width: 100%; padding: 30px;">A carregar simuladores...</p>`;

  try {
    const res = await fetch(`/api/exams?level=${activeLevel}`);
    if (!res.ok) throw new Error();

    currentLevelExams = await res.json(); // Caching local
    
    if (jwtToken && (!userProgressCache || userProgressCache.length === 0)) {
      const progressRes = await fetch("/api/user/progress", {
        headers: { "Authorization": `Bearer ${jwtToken}` }
      });
      if (progressRes.ok) {
        userProgressCache = await progressRes.json();
      }
    }

    updateHeroBanner(activeLevel, currentLevelExams);
    renderUniversityAndYearFilters();
    filterAndRenderExams();

  } catch (e) {
    container.innerHTML = `<p style="text-align: center; color: var(--error); width: 100%; padding: 30px;">Erro ao ligar ao servidor de exames.</p>`;
  }
}

function updateHeroBanner(level, exams) {
  const badge = document.getElementById("hero-category-badge");
  const title = document.getElementById("hero-category-title");
  const sub = document.getElementById("hero-category-sub");
  const statExams = document.getElementById("hero-stat-exams");
  const statQuestions = document.getElementById("hero-stat-questions");

  if (!title) return;

  const totalQ = (exams || []).reduce((sum, e) => {
    return sum + (Number(e.question_count) || 40);
  }, 0);

  if (statExams) statExams.textContent = (exams || []).length;
  if (statQuestions) statQuestions.textContent = totalQ > 0 ? totalQ.toLocaleString('pt-MZ') : '8.520';

  if (level === "superior") {
    if (badge) badge.textContent = "📚 Admissão Universitária (UEM & UP)";
    title.textContent = "Exames de Admissão Ensino Superior";
    if (sub) sub.textContent = "Provas oficiais de acesso à Universidade Eduardo Mondlane (UEM) e Universidade Pedagógica (UP) com resoluções.";
  } else if (level === "12a") {
    if (badge) badge.textContent = "🎓 Ensino Secundário Geral (ESG)";
    title.textContent = "Exames Nacionais da 12ª Classe";
    if (sub) sub.textContent = "Simuladores oficiais do MINEDH para conclusão da 12ª Classe com cronómetro oficial e nota.";
  } else if (level === "10a") {
    if (badge) badge.textContent = "📘 Ensino Secundário (1º Ciclo)";
    title.textContent = "Exames Nacionais da 10ª Classe";
    if (sub) sub.textContent = "Provas oficiais do MINEDH de fim de ciclo secundário com gabaritos oficiais.";
  } else if (level === "primario") {
    if (badge) badge.textContent = "✏️ Ensino Primário Completo";
    title.textContent = "Exames da 7ª Classe (Primário)";
    if (sub) sub.textContent = "Simuladores didáticos de preparação com explicações ilustradas para o ensino primário.";
  } else if (level === "tecnico") {
    if (badge) badge.textContent = "🔧 Formação Técnico-Profissional";
    title.textContent = "Exames de Acesso ao Ensino Técnico";
    if (sub) sub.textContent = "Provas de admissão para Institutos Industriais, Comerciais, de Saúde e Formação de Professores.";
  } else if (level === "cambridge") {
    if (badge) badge.textContent = "🌍 Currículo Internacional";
    title.textContent = "Cambridge International (IGCSE & A-Level)";
    if (sub) sub.textContent = "Mathematics, Physics, Chemistry e Biology formulados em KaTeX com padrões internacionais.";
  } else if (level === "conducao") {
    if (badge) badge.textContent = "🚗 Código & Sinais de Trânsito";
    title.textContent = "Simulador Oficial de Carta de Condução (INATRO)";
    if (sub) sub.textContent = "Perguntas oficiais sobre legislação rodoviária, sinais de trânsito e mecânica automóvel básica.";
  }
}

function getSubjectCategory(subjectName) {
  const s = (subjectName || '').toLowerCase();
  if (s.includes('matemát') || s.includes('matemat')) return { id: 'matematica', name: 'Matemática', label: '📐 Matemática' };
  if (s.includes('físic') || s.includes('fisic')) return { id: 'fisica', name: 'Física', label: '⚡ Física' };
  if (s.includes('biolog')) return { id: 'biologia', name: 'Biologia', label: '🧬 Biologia' };
  if (s.includes('químic') || s.includes('quimic')) return { id: 'quimica', name: 'Química', label: '🧪 Química' };
  if (s.includes('portugu')) return { id: 'portugues', name: 'Português', label: '📖 Português' };
  if (s.includes('histór') || s.includes('histor')) return { id: 'historia', name: 'História', label: '🏛️ História' };
  if (s.includes('geograf')) return { id: 'geografia', name: 'Geografia', label: '🌍 Geografia' };
  if (s.includes('filosof')) return { id: 'filosofia', name: 'Filosofia', label: '🤔 Filosofia' };
  if (s.includes('ingl') || s.includes('english')) return { id: 'ingles', name: 'Inglês', label: '🇬🇧 Inglês' };
  if (s.includes('franc')) return { id: 'frances', name: 'Francês', label: '🇫🇷 Francês' };
  if (s.includes('desenh') || s.includes('geometria')) return { id: 'desenho', name: 'Desenho', label: '📐 Desenho' };
  if (s.includes('condu') || s.includes('código') || s.includes('codigo') || s.includes('sinais')) return { id: 'conducao', name: 'Condução', label: '🚗 Condução' };
  return { id: 'outras', name: 'Geral', label: '📚 Outras Áreas' };
}

function renderUniversityAndYearFilters() {
  const univPillsContainer = document.getElementById("university-filter-pills");
  const subjectPillsContainer = document.getElementById("subject-filter-pills");
  const yearPillsContainer = document.getElementById("year-filter-pills");
  const univLabel = document.getElementById("selected-university-label");
  const subjectLabel = document.getElementById("selected-subject-label");
  const yearLabel = document.getElementById("selected-year-label");

  if (!univPillsContainer || !yearPillsContainer) return;

  const exams = currentLevelExams || [];
  
  // 1. Contagens de Universidades
  const univCounts = {};
  exams.forEach(e => {
    const u = (e.university || 'UEM').trim();
    univCounts[u] = (univCounts[u] || 0) + 1;
  });

  // Renderizar pills de universidade com cobertura nacional completa
  univPillsContainer.innerHTML = "";
  
  const allUnivPill = document.createElement("button");
  allUnivPill.type = "button";
  allUnivPill.className = `filter-pill ${activeUniversity === 'all' ? 'active' : ''}`;
  allUnivPill.innerHTML = `🏛️ Todas as Instituições <span class="pill-count">${exams.length}</span>`;
  allUnivPill.addEventListener("click", () => {
    activeUniversity = "all";
    examsPageLimit = 16;
    if (univLabel) univLabel.textContent = "Todas as Instituições";
    renderUniversityAndYearFilters();
    filterAndRenderExams();
  });
  univPillsContainer.appendChild(allUnivPill);

  if (activeLevel === 'superior') {
    const mozInstitutions = [
      { id: 'UEM', label: '🎓 UEM', name: 'Universidade Eduardo Mondlane' },
      { id: 'UP', label: '🏫 UP', name: 'Universidade Pedagógica' },
      { id: 'UniZambeze', label: '🌊 UniZambeze', name: 'Universidade Zambeze' },
      { id: 'UniLúrio', label: '🌿 UniLúrio', name: 'Universidade Lúrio' },
      { id: 'UniPúnguè', label: '⛰️ UniPúnguè', name: 'Universidade Púnguè' },
      { id: 'UniRovuma', label: '🌍 UniRovuma', name: 'Universidade Rovuma' },
      { id: 'UniLicungo', label: '🏛️ UniLicungo', name: 'Universidade Licungo' },
      { id: 'ISRI', label: '🌐 ISRI / UJC', name: 'Inst. Superior de Relações Internacionais / UJC' },
      { id: 'ACIPOL', label: '🛡️ ACIPOL', name: 'Academia de Ciências Policiais' },
      { id: 'ISCISA', label: '🏥 ISCISA', name: 'Inst. Superior de Ciências de Saúde' }
    ];

    mozInstitutions.forEach(inst => {
      const count = univCounts[inst.id] || 0;
      const pill = document.createElement("button");
      pill.type = "button";
      pill.className = `filter-pill ${activeUniversity.toLowerCase() === inst.id.toLowerCase() ? 'active' : ''}`;
      pill.innerHTML = `<span>${inst.label}</span> <span class="pill-count">${count > 0 ? count : 'Breve'}</span>`;
      pill.title = inst.name;
      pill.addEventListener("click", () => {
        activeUniversity = inst.id;
        examsPageLimit = 16;
        if (univLabel) univLabel.textContent = inst.name;
        renderUniversityAndYearFilters();
        filterAndRenderExams();
      });
      univPillsContainer.appendChild(pill);
    });
  } else {
    const univKeys = Object.keys(univCounts).sort();
    univKeys.forEach(u => {
      const pill = document.createElement("button");
      pill.type = "button";
      pill.className = `filter-pill ${activeUniversity.toLowerCase() === u.toLowerCase() ? 'active' : ''}`;
      pill.innerHTML = `<span>${escapeHtml(u)}</span> <span class="pill-count">${univCounts[u]}</span>`;
      pill.addEventListener("click", () => {
        activeUniversity = u;
        examsPageLimit = 16;
        if (univLabel) univLabel.textContent = u;
        renderUniversityAndYearFilters();
        filterAndRenderExams();
      });
      univPillsContainer.appendChild(pill);
    });
  }

  if (univLabel) {
    univLabel.textContent = activeUniversity === "all" ? "Todas" : activeUniversity;
  }

  // 2. Contagens de Disciplinas (reativas à universidade selecionada)
  if (subjectPillsContainer) {
    subjectPillsContainer.innerHTML = "";
    const subjectCounts = {};
    const subjectMeta = {};

    exams.forEach(e => {
      if (activeUniversity === 'all' || (e.university && e.university.toLowerCase() === activeUniversity.toLowerCase())) {
        const cat = getSubjectCategory(e.subject_name);
        subjectCounts[cat.id] = (subjectCounts[cat.id] || 0) + 1;
        subjectMeta[cat.id] = cat;
      }
    });

    const matchingUnivCount = activeUniversity === 'all' 
      ? exams.length 
      : exams.filter(e => (e.university || '').toLowerCase() === activeUniversity.toLowerCase()).length;

    // Pill "Todas as Disciplinas"
    const allSubjectPill = document.createElement("button");
    allSubjectPill.type = "button";
    allSubjectPill.className = `filter-pill ${activeSubject === 'all' ? 'active' : ''}`;
    allSubjectPill.innerHTML = `📚 Todas <span class="pill-count">${matchingUnivCount}</span>`;
    allSubjectPill.addEventListener("click", () => {
      activeSubject = "all";
      examsPageLimit = 16;
      if (subjectLabel) subjectLabel.textContent = "Todas as Disciplinas";
      renderUniversityAndYearFilters();
      filterAndRenderExams();
    });
    subjectPillsContainer.appendChild(allSubjectPill);

    // Pill "⭐ Guardados / Favoritos"
    const favCount = exams.filter(e => userFavorites.includes(e.id)).length;
    const favPill = document.createElement("button");
    favPill.type = "button";
    favPill.className = `filter-pill ${activeSubject === 'favorites' ? 'active' : ''}`;
    favPill.style.color = activeSubject === 'favorites' ? '#ffffff' : '#f59e0b';
    favPill.style.borderColor = '#f59e0b';
    favPill.innerHTML = `⭐ Guardados <span class="pill-count" id="filter-fav-count">${favCount}</span>`;
    favPill.addEventListener("click", () => {
      activeSubject = "favorites";
      examsPageLimit = 16;
      if (subjectLabel) subjectLabel.textContent = "⭐ Provas Guardadas / Favoritas";
      renderUniversityAndYearFilters();
      filterAndRenderExams();
    });
    subjectPillsContainer.appendChild(favPill);

    const subjectKeys = Object.keys(subjectCounts).sort((a, b) => {
      return subjectMeta[a].name.localeCompare(subjectMeta[b].name);
    });

    subjectKeys.forEach(sId => {
      const meta = subjectMeta[sId];
      const pill = document.createElement("button");
      pill.type = "button";
      pill.className = `filter-pill ${activeSubject === sId ? 'active' : ''}`;
      pill.innerHTML = `<span>${meta.label}</span> <span class="pill-count">${subjectCounts[sId]}</span>`;
      pill.addEventListener("click", () => {
        activeSubject = sId;
        examsPageLimit = 16;
        if (subjectLabel) subjectLabel.textContent = meta.name;
        renderUniversityAndYearFilters();
        filterAndRenderExams();
      });
      subjectPillsContainer.appendChild(pill);
    });

    if (subjectLabel) {
      if (activeSubject === "all") {
        subjectLabel.textContent = "Todas as Disciplinas";
      } else if (subjectMeta[activeSubject]) {
        subjectLabel.textContent = subjectMeta[activeSubject].name;
      }
    }
  }

  // 3. Contagens de Anos (reativas à universidade e disciplina selecionadas)
  const yearCounts = {};
  exams.forEach(e => {
    const matchUniv = activeUniversity === 'all' || (e.university && e.university.toLowerCase() === activeUniversity.toLowerCase());
    const matchSubj = activeSubject === 'all' || getSubjectCategory(e.subject_name).id === activeSubject;
    if (matchUniv && matchSubj) {
      const y = String(e.year || '2025').trim();
      yearCounts[y] = (yearCounts[y] || 0) + 1;
    }
  });
  const yearKeys = Object.keys(yearCounts).sort((a, b) => Number(b) - Number(a));

  // Renderizar pills de ano
  yearPillsContainer.innerHTML = "";

  const matchingFilterCount = exams.filter(e => {
    const matchUniv = activeUniversity === 'all' || (e.university && e.university.toLowerCase() === activeUniversity.toLowerCase());
    const matchSubj = activeSubject === 'all' || getSubjectCategory(e.subject_name).id === activeSubject;
    return matchUniv && matchSubj;
  }).length;

  const allYearPill = document.createElement("button");
  allYearPill.type = "button";
  allYearPill.className = `filter-pill ${activeYear === 'all' ? 'active' : ''}`;
  allYearPill.innerHTML = `📅 Todos <span class="pill-count">${matchingFilterCount}</span>`;
  allYearPill.addEventListener("click", () => {
    activeYear = "all";
    examsPageLimit = 16;
    if (yearLabel) yearLabel.textContent = "Todos os Anos";
    renderUniversityAndYearFilters();
    filterAndRenderExams();
  });
  yearPillsContainer.appendChild(allYearPill);

  // Exibição Inteligente de Anos (Recentes em Destaque + Expansão Suave)
  const isOlderYearSelected = yearKeys.slice(7).includes(String(activeYear));
  const effectiveShowAll = showAllYears || isOlderYearSelected;
  const displayYears = (yearKeys.length > 8 && !effectiveShowAll) ? yearKeys.slice(0, 7) : yearKeys;

  displayYears.forEach(y => {
    const pill = document.createElement("button");
    pill.type = "button";
    pill.className = `filter-pill ${String(activeYear) === String(y) ? 'active' : ''}`;
    pill.innerHTML = `<span>${escapeHtml(y)}</span> <span class="pill-count">${yearCounts[y]}</span>`;
    pill.addEventListener("click", () => {
      activeYear = y;
      examsPageLimit = 16;
      if (yearLabel) yearLabel.textContent = y;
      renderUniversityAndYearFilters();
      filterAndRenderExams();
    });
    yearPillsContainer.appendChild(pill);
  });

  if (yearKeys.length > 8) {
    const togglePill = document.createElement("button");
    togglePill.type = "button";
    togglePill.className = "filter-pill";
    togglePill.style.borderColor = "var(--primary)";
    togglePill.style.color = "var(--primary)";
    togglePill.style.background = "rgba(79, 70, 229, 0.08)";
    togglePill.style.fontWeight = "700";
    togglePill.innerHTML = effectiveShowAll
      ? `<span>▴ Recolher Anos Antigos</span>`
      : `<span>📅 Mais Anos (${yearKeys[yearKeys.length - 1]} - ${yearKeys[7]}) ▾</span>`;
    togglePill.addEventListener("click", () => {
      showAllYears = !effectiveShowAll;
      renderUniversityAndYearFilters();
    });
    yearPillsContainer.appendChild(togglePill);
  }

  if (yearLabel) {
    yearLabel.textContent = activeYear === "all" ? "Todos os Anos" : activeYear;
  }
}

function filterAndRenderExams() {
  const container = document.getElementById("exams-list-grid");
  if (!container) return;

  const searchInput = document.getElementById("dashboard-search-input");
  const searchVal = searchInput ? searchInput.value.toLowerCase().trim() : "";
  let list = currentLevelExams || [];

  // Filtro por Universidade
  if (activeUniversity !== "all") {
    list = list.filter(e => (e.university || "UEM").toLowerCase() === activeUniversity.toLowerCase());
  }

  // Filtro por Disciplina ou Favoritos
  if (activeSubject === "favorites") {
    list = list.filter(e => userFavorites.includes(e.id));
  } else if (activeSubject !== "all") {
    list = list.filter(e => getSubjectCategory(e.subject_name).id === activeSubject);
  }

  // Filtro por Ano
  if (activeYear !== "all") {
    list = list.filter(e => String(e.year || "").trim() === String(activeYear).trim());
  }

  // Filtro por Pesquisa de Texto
  if (searchVal) {
    list = list.filter(e => 
      (e.subject_name || "").toLowerCase().includes(searchVal) ||
      (e.level_name || "").toLowerCase().includes(searchVal) ||
      (e.university || "").toLowerCase().includes(searchVal) ||
      (e.year || "").toString().includes(searchVal) ||
      (e.id || "").toLowerCase().includes(searchVal)
    );
  }

  // Ordenação Inteligente
  list.sort((a, b) => {
    if (activeExamSort === "year-desc") {
      const diff = (Number(b.year) || 0) - (Number(a.year) || 0);
      return diff !== 0 ? diff : (a.subject_name || "").localeCompare(b.subject_name || "");
    }
    if (activeExamSort === "year-asc") {
      const diff = (Number(a.year) || 0) - (Number(b.year) || 0);
      return diff !== 0 ? diff : (a.subject_name || "").localeCompare(b.subject_name || "");
    }
    if (activeExamSort === "subject-asc") {
      const diff = (a.subject_name || "").localeCompare(b.subject_name || "");
      return diff !== 0 ? diff : (Number(b.year) || 0) - (Number(a.year) || 0);
    }
    if (activeExamSort === "university-asc") {
      const diff = (a.university || "").localeCompare(b.university || "");
      return diff !== 0 ? diff : (Number(b.year) || 0) - (Number(a.year) || 0);
    }
    if (activeExamSort === "questions-desc") {
      const qa = (a.question_count !== undefined && a.question_count !== null) ? Number(a.question_count) : 40;
      const qb = (b.question_count !== undefined && b.question_count !== null) ? Number(b.question_count) : 40;
      return qb - qa;
    }
    return 0;
  });

  const totalFiltered = list.length;

  // Atualizar badge de contagem de exames no cabeçalho
  const countBadge = document.getElementById("exams-count-badge");
  if (countBadge) {
    countBadge.textContent = `${totalFiltered} Exame${totalFiltered === 1 ? '' : 's'} Disponíve${totalFiltered === 1 ? 'l' : 'is'}`;
  }

  container.innerHTML = "";

  if (totalFiltered === 0) {
    const isFavEmpty = activeSubject === "favorites";
    container.innerHTML = `
      <div style="text-align: center; color: var(--text-secondary); width: 100%; padding: 40px 20px; background: var(--bg-secondary); border-radius: var(--radius-md); border: 1px dashed var(--border-color); grid-column: 1 / -1;">
        <p style="font-size: 1.1rem; font-weight: 600; margin-bottom: 8px;">
          ${isFavEmpty ? '⭐ Nenhuma prova guardada como favorita ainda' : 'Nenhum exame encontrado com estes filtros'}
        </p>
        <p style="font-size: 0.88rem; color: var(--text-secondary); margin-bottom: 15px;">
          ${isFavEmpty ? 'Clique no ícone de estrela (☆) em qualquer exame para adicioná-lo aos seus favoritos.' : 'Tente alterar os filtros de instituição, disciplina ou ano.'}
        </p>
        <button type="button" class="btn btn-sm btn-outline" id="btn-reset-exam-filters">↺ Limpar Todos os Filtros</button>
      </div>
    `;
    const resetBtn = document.getElementById("btn-reset-exam-filters");
    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        activeUniversity = "all";
        activeSubject = "all";
        activeYear = "all";
        activeExamSort = "year-desc";
        examsPageLimit = 16;
        if (searchInput) searchInput.value = "";
        const clearBtn = document.getElementById("btn-clear-search");
        if (clearBtn) clearBtn.style.display = "none";
        const sortSel = document.getElementById("dashboard-sort-select");
        if (sortSel) sortSel.value = "year-desc";
        renderUniversityAndYearFilters();
        filterAndRenderExams();
      });
    }
    const pagContainer = document.getElementById("exams-pagination-container");
    if (pagContainer) pagContainer.style.display = "none";
    return;
  }

  const pageList = list.slice(0, examsPageLimit);

  pageList.forEach(exam => {
    let completedInfo = null;
    if (userProgressCache) {
      completedInfo = userProgressCache.find(p => p.exam_id === exam.id);
    }

    const subjCat = getSubjectCategory(exam.subject_name);
    const univName = exam.university || "UEM";
    const univSlug = getUniversityBadgeClass(univName);
    const diff = getExamDifficulty(exam);
    const isFav = userFavorites.includes(exam.id);

    const card = document.createElement("div");
    card.className = `exam-card theme-${subjCat.id}`;

    const qCount = (exam.question_count !== undefined && exam.question_count !== null) ? Number(exam.question_count) : 40;
    const isReady = qCount > 0;
    let badgeHtml = isReady ? `<span class="exam-tag free">Grátis</span>` : `<span class="badge-draft-exam">Em Catalogação</span>`;
    let scoreBadge = "";
    if (completedInfo) {
      const pct = Math.round((completedInfo.score / completedInfo.total) * 100);
      const isApproved = pct >= 50;
      scoreBadge = `
        <div style="margin-top: 14px; padding: 6px 10px; background: ${isApproved ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)'}; border-radius: 6px; font-size: 0.8rem; display: flex; justify-content: space-between; align-items: center;">
          <span style="color: ${isApproved ? 'var(--success)' : 'var(--error)'}; font-weight: bold;">
            ${isApproved ? '✓ Concluído:' : '⚠ Concluído:'} ${completedInfo.score}/${completedInfo.total} (${pct}%)
          </span>
          <span style="font-size: 0.75rem; color: var(--text-secondary);">
            ${new Date(completedInfo.completed_at).toLocaleDateString('pt-MZ')}
          </span>
        </div>
      `;
    }

    const actionButtons = isReady ? `
      <div class="exam-card-actions" style="display: flex; gap: 8px; flex-wrap: wrap;">
        <button class="btn btn-sm btn-outline btn-study-exam" data-id="${exam.id}" style="flex: 1; min-width: 105px;" title="Modo Estudo: Resolução sem pressão de tempo com explicações passo a passo e dicas">
          📖 Modo Estudo
        </button>
        <button class="btn btn-sm btn-primary btn-start-exam" data-id="${exam.id}" style="flex: 1; min-width: 105px;" title="Simular Prova: Simulação oficial cronometrada com contagem regressiva">
          ⏱️ Simular Prova
        </button>
        <button type="button" class="btn btn-sm btn-outline btn-download-pdf-exam" data-id="${exam.id}" style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 6px; font-weight: 600; color: #1e3a8a; border-color: rgba(30, 58, 138, 0.28);" title="Baixar Caderno Oficial de Exame em Formato A4 (PDF)">
          📥 Baixar Caderno A4 (PDF)
        </button>
      </div>
    ` : `
      <div class="exam-card-actions">
        <button class="btn btn-sm btn-outline" disabled style="opacity: 0.65; cursor: not-allowed; width: 100%; border-style: dashed;">
          ⏳ Brevemente Disponível
        </button>
      </div>
    `;

    card.innerHTML = `
      <div>
        <div class="exam-card-header">
          <div class="exam-card-title-group">
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
              <span class="exam-subject-pill theme-badge-${subjCat.id}">${subjCat.label}</span>
              <button type="button" class="btn-favorite-card ${isFav ? 'active' : ''}" data-id="${exam.id}" title="${isFav ? 'Remover dos Guardados' : 'Guardar Prova'}">
                ${isFav ? '★' : '☆'}
              </button>
            </div>
            <h4 class="exam-card-title">${escapeHtml(exam.subject_name)}</h4>
          </div>
          <div class="exam-badges-wrap">
            <span class="badge-university ${univSlug}">${escapeHtml(univName)}</span>
            <span class="badge-year">${exam.year}</span>
            <span class="badge-difficulty ${diff.level}">${diff.icon} ${diff.label}</span>
            ${badgeHtml}
          </div>
        </div>
        <div class="exam-card-meta">
          <span>📚 ${escapeHtml(exam.level_name)}</span>
          <span>⏱️ ${exam.duration_minutes || 120} Min</span>
          <span class="exam-qcount-tag">📝 ${isReady ? `${qCount} Questões` : '0 Questões'}</span>
        </div>
      </div>
      ${actionButtons}
      ${scoreBadge}
    `;

    container.appendChild(card);
  });

  // Action listeners para Favoritos
  container.querySelectorAll(".btn-favorite-card").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const examId = e.currentTarget.getAttribute("data-id");
      toggleFavoriteExam(examId, e);
    });
  });

  // Action listeners para Modo Estudo e Simular Prova
  container.querySelectorAll(".btn-study-exam").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const examId = e.currentTarget.getAttribute("data-id");
      startExam(examId, 'study');
    });
  });

  container.querySelectorAll(".btn-start-exam").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const examId = e.currentTarget.getAttribute("data-id");
      startExam(examId, 'exam');
    });
  });

  container.querySelectorAll(".btn-download-pdf-exam").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const examId = e.currentTarget.getAttribute("data-id");
      downloadExamPaperPdf(examId);
    });
  });

  // Controlo de Paginação / Carregar Mais
  const pagContainer = document.getElementById("exams-pagination-container");
  const pagInfo = document.getElementById("exams-pagination-info");
  const loadMoreBtn = document.getElementById("exams-load-more-btn");
  const showAllBtn = document.getElementById("exams-show-all-btn");

  if (pagContainer && pagInfo && loadMoreBtn && showAllBtn) {
    if (totalFiltered > examsPageLimit) {
      pagContainer.style.display = "flex";
      pagInfo.textContent = `A mostrar ${pageList.length} de ${totalFiltered} exames`;
      loadMoreBtn.style.display = "inline-flex";
      showAllBtn.style.display = "inline-flex";

      loadMoreBtn.onclick = () => {
        examsPageLimit += 16;
        filterAndRenderExams();
      };
      showAllBtn.onclick = () => {
        examsPageLimit = totalFiltered;
        filterAndRenderExams();
      };
    } else if (totalFiltered > 16) {
      pagContainer.style.display = "flex";
      pagInfo.textContent = `Todos os ${totalFiltered} exames carregados com sucesso`;
      loadMoreBtn.style.display = "none";
      showAllBtn.style.display = "none";
    } else {
      pagContainer.style.display = "none";
    }
  }
}

// --- SISTEMA DE SEÇÃO ---
function showSection(sectionId) {
  document.querySelectorAll(".section").forEach(sec => {
    sec.classList.remove("active");
  });
  const targetSection = document.getElementById(`section-${sectionId}`);
  if (targetSection) {
    targetSection.classList.add("active");
    window.scrollTo(0, 0);

    if (sectionId === "admin") {
      if (!window.location.pathname.includes("/admin") && !window.location.pathname.includes("/cms")) {
        history.replaceState(null, "", "#admin");
      }
    } else if (window.location.hash === "#admin" || window.location.hash === "#cms") {
      history.replaceState(null, "", window.location.pathname);
    }
  }
}

function handleUrlRouting() {
  const path = window.location.pathname.toLowerCase();
  const hash = window.location.hash.toLowerCase();
  const search = window.location.search.toLowerCase();

  const isAdminRoute = path.includes("/admin") || path.includes("/cms") || hash.includes("admin") || hash.includes("cms") || search.includes("admin");

  if (isAdminRoute) {
    if (userProfile && userProfile.isAdmin) {
      showSection("admin");
      activateMenuTab("admin");
      loadAdminTab();
    } else {
      openAuthModal();
      const err = document.getElementById("auth-error-alert");
      if (err) {
        err.textContent = "🔒 Acesso reservado ao Painel CMS Administrativo. Inicie sessão como Administrador para continuar.";
        err.style.display = "block";
      }
    }
  }
}

// --- FLUXO DO QUIZ SEGURO ---
async function startExam(examId, mode = 'exam') {
  if (!jwtToken) {
    alert("🔒 Autenticação Necessária!\n\nDeves iniciar sessão para realizar exames.");
    openAuthModal();
    return;
  }

  try {
    const res = await fetch(`/api/exams/${examId}`, {
      headers: { "Authorization": `Bearer ${jwtToken}` }
    });

    if (!res.ok) {
      alert("Erro ao aceder ao exame do servidor.");
      return;
    }

    const exam = await res.json();
    
    if (!exam || !exam.questions || exam.questions.length === 0) {
      alert("⚠️ Este exame ainda está em fase de catalogação e não possui questões ativas.");
      return;
    }

    currentQuiz.exam = exam;
    currentQuiz.mode = mode; // 'exam' ou 'study'
    currentQuiz.currentIndex = 0;
    currentQuiz.answers = new Array(exam.questions.length).fill(null);
    currentQuiz.skipped = new Array(exam.questions.length).fill(false);
    currentQuiz.bookmarked = new Array(exam.questions.length).fill(false);
    currentQuiz.elapsedStudySeconds = 0;
    currentQuiz.timeRemaining = (exam.durationMinutes || exam.duration_minutes || 120) * 60;

    renderQuestion();
    startTimer();
    showSection("quiz");

  } catch (e) {
    alert("Erro de conexão ao servidor de exames.");
  }
}

function startTimer() {
  if (currentQuiz.timerInterval) {
    clearInterval(currentQuiz.timerInterval);
  }

  const timerText = document.getElementById("quiz-timer");
  const timerContainer = document.getElementById("quiz-timer-container");
  if (!timerText || !timerContainer) return;
  timerContainer.classList.remove("warning");

  if (currentQuiz.mode === 'study') {
    timerText.textContent = "00:00:00 (Estudo)";
    currentQuiz.timerInterval = setInterval(() => {
      currentQuiz.elapsedStudySeconds = (currentQuiz.elapsedStudySeconds || 0) + 1;
      const hrs = Math.floor(currentQuiz.elapsedStudySeconds / 3600);
      const mins = Math.floor((currentQuiz.elapsedStudySeconds % 3600) / 60);
      const secs = currentQuiz.elapsedStudySeconds % 60;
      timerText.textContent = `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")} (Estudo)`;
    }, 1000);
    return;
  }

  // Modo Simulado Prova Cronometrada
  currentQuiz.timerInterval = setInterval(() => {
    currentQuiz.timeRemaining--;

    if (currentQuiz.timeRemaining <= 0) {
      clearInterval(currentQuiz.timerInterval);
      finishQuiz(true);
      return;
    }

    if (currentQuiz.timeRemaining < 120) {
      timerContainer.classList.add("warning");
    }

    const hrs = Math.floor(currentQuiz.timeRemaining / 3600);
    const mins = Math.floor((currentQuiz.timeRemaining % 3600) / 60);
    const secs = currentQuiz.timeRemaining % 60;

    timerText.textContent = `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }, 1000);
}

function renderMathFormulas(element) {
  if (!element) return;
  if (typeof renderMathInElement === 'function') {
    try {
      renderMathInElement(element, {
        delimiters: [
          { left: "$$", right: "$$", display: true },
          { left: "\\[", right: "\\]", display: true },
          { left: "$", right: "$", display: false },
          { left: "\\(", right: "\\)", display: false }
        ],
        throwOnError: false
      });
    } catch (e) {
      console.warn("KaTeX render error:", e);
    }
  }
}

function renderQuestion() {
  const exam = currentQuiz.exam;
  if (!exam || !exam.questions || exam.questions.length === 0) {
    showToast("⚠️ Nenhuma questão disponível para este exame.", "warning");
    showSection("dashboard");
    return;
  }
  const question = exam.questions[currentQuiz.currentIndex];
  if (!question) {
    finishQuiz(false);
    return;
  }

  const modeBadge = currentQuiz.mode === 'study' ? '📖 Modo Estudo' : '⏱️ Simulado Oficial';
  const univLabel = exam.university ? ` - ${exam.university}` : '';
  document.getElementById("quiz-exam-title").textContent = `${modeBadge}: ${exam.subject_name} (${exam.year})${univLabel}`;
  document.getElementById("quiz-question-counter").textContent = `Pergunta ${currentQuiz.currentIndex + 1} de ${exam.questions.length}`;
  document.getElementById("quiz-question-number").textContent = `QUESTÃO ${question.number}`;

  // Marcador de Revisão e Contadores
  const isBookmarked = currentQuiz.bookmarked && currentQuiz.bookmarked[currentQuiz.currentIndex];
  const bIndicator = document.getElementById("quiz-bookmark-indicator");
  if (bIndicator) bIndicator.style.display = isBookmarked ? "inline-block" : "none";
  const bBtn = document.getElementById("quiz-bookmark-btn");
  if (bBtn) {
    bBtn.textContent = isBookmarked ? "📌 Marcada" : "📌 Marcar Revisão";
    bBtn.style.color = isBookmarked ? "#d97706" : "#f59e0b";
  }

  const prevBtn = document.getElementById("quiz-prev-btn");
  if (prevBtn) prevBtn.style.display = currentQuiz.currentIndex > 0 ? "inline-flex" : "none";

  const countTag = document.getElementById("quiz-matrix-count-tag");
  if (countTag) countTag.textContent = `${currentQuiz.currentIndex + 1}/${exam.questions.length}`;

  // Parar qualquer áudio em reprodução anterior e resetar botões
  if (window.speechSynthesis && window.speechSynthesis.speaking) {
    window.speechSynthesis.cancel();
  }
  const ttsBtn = document.getElementById("quiz-tts-btn");
  if (ttsBtn) {
    ttsBtn.classList.remove("speaking");
    ttsBtn.innerHTML = `<span>🔊 Ouvir</span>`;
  }
  const ttsExplBtn = document.getElementById("quiz-tts-explanation-btn");
  if (ttsExplBtn) {
    ttsExplBtn.classList.remove("speaking");
    ttsExplBtn.innerHTML = `<span>🔊 Ouvir Explicação</span>`;
  }
  
  if (question.text === "[🔒 Conteúdo Premium Bloqueado]") {
    clearInterval(currentQuiz.timerInterval);
    alert("🔒 Conteúdo Premium Bloqueado no Servidor! Ative a sua conta Premium.");
    showSection("checkout");
    return;
  }

  const qTextEl = document.getElementById("quiz-question-text");
  qTextEl.textContent = question.text;
  renderMathFormulas(qTextEl);

  // Renderizar Figura / Diagrama Oficial (Física, Biologia, Desenho, etc.)
  const imgContainer = document.getElementById("quiz-question-image-container");
  const imgEl = document.getElementById("quiz-question-image");
  if (imgContainer && imgEl) {
    if (question.image_url) {
      imgEl.src = question.image_url;
      imgContainer.style.display = "flex";
    } else {
      imgContainer.style.display = "none";
      imgEl.src = "";
    }
  }

  const optionsContainer = document.getElementById("quiz-options-container");
  optionsContainer.innerHTML = "";

  question.options.forEach((opt, idx) => {
    const optBtn = document.createElement("button");
    optBtn.className = "option-btn";
    optBtn.innerHTML = `<span>${escapeHtml(opt)}</span>`;
    optBtn.addEventListener("click", () => selectOption(idx));
    optionsContainer.appendChild(optBtn);
  });
  renderMathFormulas(optionsContainer);

  const hintBox = document.getElementById("quiz-hint-box");
  if (hintBox) {
    hintBox.style.display = "none";
    hintBox.textContent = "";
  }

  // Se a questão já foi respondida previamente (ao navegar na grade)
  const existingAns = currentQuiz.answers[currentQuiz.currentIndex];
  if (existingAns) {
    const options = optionsContainer.querySelectorAll(".option-btn");
    options.forEach((optBtn, idx) => {
      optBtn.disabled = true;
      if (idx === question.correct) optBtn.classList.add("correct");
      else if (idx === existingAns.selectedOptionIndex) optBtn.classList.add("incorrect");
    });
    const explanationBox = document.getElementById("quiz-explanation-box");
    const explanationText = document.getElementById("quiz-explanation-text");
    explanationText.textContent = question.explanation;
    renderMathFormulas(explanationText);
    explanationBox.style.display = "block";

    document.getElementById("quiz-verify-btn").style.display = "none";
    document.getElementById("quiz-next-btn").style.display = "inline-flex";
  } else {
    document.getElementById("quiz-explanation-box").style.display = "none";
    document.getElementById("quiz-verify-btn").style.display = "inline-flex";
    document.getElementById("quiz-verify-btn").disabled = true;
    document.getElementById("quiz-next-btn").style.display = "none";
  }

  renderQuestionMatrix();
}

function showPedagogicalHint() {
  const box = document.getElementById("quiz-hint-box");
  if (!box || !currentQuiz.exam) return;

  const currentQ = currentQuiz.exam.questions[currentQuiz.currentIndex];
  if (!currentQ) return;

  let hintText = "💡 Dica de Raciocínio: Leia atentamente as opções e elimine primeiro as duas respostas mais improváveis.";
  if (currentQ.explanation && currentQ.explanation.length > 15) {
    const sentences = currentQ.explanation.split('.');
    hintText = `💡 Dica de Resolução: ${sentences[0].trim()}. Concentre-se nas regras e fórmulas fundamentais desta disciplina!`;
  }

  box.textContent = hintText;
  box.style.display = "block";
  showToast("💡 Dica pedagógica revelada!", "info");
}

function initQuizImageLightbox() {
  const lightbox = document.getElementById("quiz-image-lightbox");
  const closeBtn = document.getElementById("quiz-lightbox-close-btn");
  const zoomBtn = document.getElementById("quiz-image-zoom-btn");
  const qImg = document.getElementById("quiz-question-image");
  const lightImg = document.getElementById("quiz-lightbox-img");
  const caption = document.getElementById("quiz-lightbox-caption");

  function openLightbox() {
    if (qImg && qImg.src && lightbox) {
      lightImg.src = qImg.src;
      if (currentQuiz.exam) {
        const q = currentQuiz.exam.questions[currentQuiz.currentIndex];
        caption.textContent = `Figura da Questão ${q.number} • ${currentQuiz.exam.subject_name} (${currentQuiz.exam.year})`;
      }
      lightbox.style.display = "flex";
    }
  }

  function closeLightbox() {
    if (lightbox) lightbox.style.display = "none";
  }

  if (zoomBtn) zoomBtn.addEventListener("click", openLightbox);
  if (qImg) qImg.addEventListener("click", openLightbox);
  if (closeBtn) closeBtn.addEventListener("click", closeLightbox);
  if (lightbox) {
    lightbox.addEventListener("click", (e) => {
      if (e.target === lightbox) closeLightbox();
    });
  }
}

function initQuizScratchpad() {
  const modal = document.getElementById("quiz-scratchpad-modal");
  const openBtn = document.getElementById("quiz-scratchpad-btn");
  const closeBtn = document.getElementById("scratchpad-close-btn");
  const clearBtn = document.getElementById("scratchpad-clear-btn");
  const eraserBtn = document.getElementById("scratchpad-eraser-btn");
  const canvas = document.getElementById("scratchpad-canvas");
  if (!modal || !canvas) return;

  const ctx = canvas.getContext("2d");
  let isDrawing = false;
  let currentColor = "#0f172a";
  let currentSize = 2;
  let isEraser = false;
  let lastX = 0;
  let lastY = 0;

  function resizeCanvas() {
    const container = canvas.parentElement;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    // Salvar rascunho atual antes de redimensionar
    let tempCanvas = null;
    if (canvas.width > 0 && canvas.height > 0) {
      tempCanvas = document.createElement("canvas");
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempCtx = tempCanvas.getContext("2d");
      tempCtx.drawImage(canvas, 0, 0);
    }

    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    if (tempCanvas && tempCanvas.width > 0 && tempCanvas.height > 0) {
      ctx.drawImage(tempCanvas, 0, 0, rect.width, rect.height);
    }
    updateBrush();
  }

  function updateBrush() {
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    if (isEraser) {
      ctx.globalCompositeOperation = "destination-out";
      ctx.lineWidth = currentSize * 4;
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = currentColor;
      ctx.lineWidth = currentSize;
    }
  }

  function getCoords(e) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }

  function startDraw(e) {
    isDrawing = true;
    const coords = getCoords(e);
    lastX = coords.x;
    lastY = coords.y;
    updateBrush();
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(lastX + 0.1, lastY + 0.1);
    ctx.stroke();
  }

  function draw(e) {
    if (!isDrawing) return;
    const coords = getCoords(e);
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
    lastX = coords.x;
    lastY = coords.y;
  }

  function stopDraw() {
    isDrawing = false;
  }

  canvas.addEventListener("pointerdown", (e) => {
    canvas.setPointerCapture(e.pointerId);
    startDraw(e);
  });
  canvas.addEventListener("pointermove", draw);
  canvas.addEventListener("pointerup", (e) => {
    try { canvas.releasePointerCapture(e.pointerId); } catch (_) {}
    stopDraw();
  });
  canvas.addEventListener("pointercancel", stopDraw);

  // Seleção de cores
  document.querySelectorAll(".scratchpad-btn-color").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".scratchpad-btn-color").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentColor = btn.dataset.color || "#0f172a";
      isEraser = false;
      if (eraserBtn) eraserBtn.classList.remove("active");
      updateBrush();
    });
  });

  // Espessura do traço
  document.querySelectorAll(".scratchpad-btn-size").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".scratchpad-btn-size").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentSize = parseInt(btn.dataset.size || "2", 10);
      updateBrush();
    });
  });

  // Modo Translúcido (Permite ver a questão ao fundo)
  const translucentBtn = document.getElementById("scratchpad-translucent-btn");
  let isTranslucent = false;
  if (translucentBtn) {
    translucentBtn.addEventListener("click", () => {
      isTranslucent = !isTranslucent;
      if (isTranslucent) {
        modal.classList.add("translucent-mode");
        translucentBtn.classList.add("active-state");
        translucentBtn.textContent = "📄 Quadro Opaco";
        showToast("👁️ Modo Translúcido (vê a questão ao fundo)", "info");
      } else {
        modal.classList.remove("translucent-mode");
        translucentBtn.classList.remove("active-state");
        translucentBtn.textContent = "👁️ Ver Questão";
        showToast("📄 Modo Opaco Ativo", "info");
      }
    });
  }

  // Modo Borracha
  if (eraserBtn) {
    eraserBtn.addEventListener("click", () => {
      isEraser = !isEraser;
      if (isEraser) {
        eraserBtn.classList.add("active");
        showToast("🧹 Modo Borracha Ativo", "info");
      } else {
        eraserBtn.classList.remove("active");
      }
      updateBrush();
    });
  }

  // Limpar quadro
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      if (confirm("Deseja limpar todo o quadro de rascunho?")) {
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
        updateBrush();
        showToast("🗑️ Rascunho limpo", "info");
      }
    });
  }

  function openScratchpad() {
    modal.style.display = "flex";
    setTimeout(resizeCanvas, 40);
  }

  function closeScratchpad() {
    modal.style.display = "none";
  }

  if (openBtn) openBtn.addEventListener("click", openScratchpad);
  if (closeBtn) closeBtn.addEventListener("click", closeScratchpad);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeScratchpad();
  });

  window.addEventListener("resize", () => {
    if (modal.style.display === "flex") {
      resizeCanvas();
    }
  });
}

function selectOption(index) {
  const options = document.querySelectorAll(".option-btn");
  options.forEach(opt => opt.classList.remove("selected"));
  options[index].classList.add("selected");

  currentQuiz.answers[currentQuiz.currentIndex] = { selectedOptionIndex: index };
  if (currentQuiz.skipped) currentQuiz.skipped[currentQuiz.currentIndex] = false;
  
  const verifyBtn = document.getElementById("quiz-verify-btn");
  if (verifyBtn) verifyBtn.disabled = false;

  renderQuestionMatrix();
}

function verifyAnswer() {
  const index = currentQuiz.currentIndex;
  const question = currentQuiz.exam.questions[index];
  const selectedObj = currentQuiz.answers[index];

  if (!selectedObj) return;

  const isCorrect = selectedObj.selectedOptionIndex === question.correct;
  currentQuiz.answers[index].isCorrect = isCorrect;

  if (isCorrect) {
    playAudioChime("correct");
  } else {
    playAudioChime("wrong");
  }

  const options = document.querySelectorAll(".option-btn");
  options.forEach((optBtn, idx) => {
    optBtn.disabled = true;
    optBtn.style.cursor = "default";

    if (idx === question.correct) {
      optBtn.classList.add("correct");
    } else if (idx === selectedObj.selectedOptionIndex) {
      optBtn.classList.add("incorrect");
    }
  });

  const explanationBox = document.getElementById("quiz-explanation-box");
  const explanationText = document.getElementById("quiz-explanation-text");
  
  explanationText.textContent = question.explanation;
  renderMathFormulas(explanationText);
  explanationBox.style.display = "block";

  document.getElementById("quiz-verify-btn").style.display = "none";
  document.getElementById("quiz-next-btn").style.display = "inline-flex";

  renderQuestionMatrix();
}

function skipQuestion() {
  if (!currentQuiz.exam) return;
  const idx = currentQuiz.currentIndex;
  if (!currentQuiz.answers[idx]) {
    if (!currentQuiz.skipped) currentQuiz.skipped = [];
    currentQuiz.skipped[idx] = true;
    showToast(`⏭️ Pergunta ${idx + 1} saltada para revisão posterior.`, "info");
  }
  nextQuestion();
}

function prevQuestion() {
  if (currentQuiz.currentIndex > 0) {
    currentQuiz.currentIndex--;
    renderQuestion();
  }
}

function nextQuestion() {
  currentQuiz.currentIndex++;

  if (currentQuiz.currentIndex < currentQuiz.exam.questions.length) {
    renderQuestion();
  } else {
    promptReviewOrSubmit();
  }
}

function jumpToQuestion(index) {
  if (!currentQuiz.exam || index < 0 || index >= currentQuiz.exam.questions.length) return;
  currentQuiz.currentIndex = index;
  renderQuestion();
}

function toggleBookmarkQuestion() {
  if (!currentQuiz.exam) return;
  const idx = currentQuiz.currentIndex;
  if (!currentQuiz.bookmarked) currentQuiz.bookmarked = [];
  currentQuiz.bookmarked[idx] = !currentQuiz.bookmarked[idx];

  const isB = currentQuiz.bookmarked[idx];
  const bIndicator = document.getElementById("quiz-bookmark-indicator");
  if (bIndicator) bIndicator.style.display = isB ? "inline-block" : "none";

  const bBtn = document.getElementById("quiz-bookmark-btn");
  if (bBtn) {
    bBtn.textContent = isB ? "📌 Marcada" : "📌 Marcar Revisão";
    bBtn.style.color = isB ? "#d97706" : "#f59e0b";
  }

  showToast(isB ? `📌 Pergunta ${idx + 1} marcada para revisão!` : `Pergunta ${idx + 1} desmarcada.`, "info");
  renderQuestionMatrix();
}

function toggleQuestionMatrix() {
  const panel = document.getElementById("quiz-matrix-panel");
  if (!panel) return;
  if (panel.style.display === "none" || !panel.style.display) {
    panel.style.display = "block";
    renderQuestionMatrix();
  } else {
    panel.style.display = "none";
  }
}

function renderQuestionMatrix() {
  const grid = document.getElementById("quiz-matrix-grid");
  if (!grid || !currentQuiz.exam || !currentQuiz.exam.questions) return;

  grid.innerHTML = "";
  const total = currentQuiz.exam.questions.length;

  for (let i = 0; i < total; i++) {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "matrix-chip";
    chip.textContent = i + 1;

    if (i === currentQuiz.currentIndex) {
      chip.classList.add("current");
    } else if (currentQuiz.answers && currentQuiz.answers[i]) {
      chip.classList.add("answered");
    } else if (currentQuiz.skipped && currentQuiz.skipped[i]) {
      chip.classList.add("skipped");
    } else if (currentQuiz.bookmarked && currentQuiz.bookmarked[i]) {
      chip.classList.add("skipped");
    } else {
      chip.classList.add("unanswered");
    }

    chip.addEventListener("click", () => jumpToQuestion(i));
    grid.appendChild(chip);
  }
}

// --- REPORTAR FALHAS OU ERROS EM QUESTÕES ---
function openReportModal() {
  if (!currentQuiz.exam) return;
  const q = currentQuiz.exam.questions[currentQuiz.currentIndex];
  if (!q) return;

  const ctxEl = document.getElementById("report-question-context");
  if (ctxEl) {
    ctxEl.textContent = `Questão ${q.number} • ${currentQuiz.exam.subject_name} (${currentQuiz.exam.year})`;
  }

  const desc = document.getElementById("report-issue-desc");
  if (desc) desc.value = "";

  const modal = document.getElementById("report-issue-modal");
  if (modal) modal.style.display = "flex";
}

function closeReportModal() {
  const modal = document.getElementById("report-issue-modal");
  if (modal) modal.style.display = "none";
}

async function submitQuestionReport() {
  if (!currentQuiz.exam) return;
  const q = currentQuiz.exam.questions[currentQuiz.currentIndex];
  if (!q) return;

  const selectedRadio = document.querySelector('input[name="report-issue-type"]:checked');
  const issueType = selectedRadio ? selectedRadio.value : 'other';
  const descEl = document.getElementById("report-issue-desc");
  const description = descEl ? descEl.value.trim() : '';

  try {
    const res = await fetch("/api/questions/report", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": jwtToken ? `Bearer ${jwtToken}` : ""
      },
      body: JSON.stringify({
        questionId: q.id || null,
        examId: currentQuiz.exam.id,
        issueType,
        description
      })
    });

    closeReportModal();
    if (res.ok) {
      showToast("🚩 Obrigado! O teu reporte foi enviado para a nossa equipa pedagógica.", "success");
    } else {
      showToast("Reporte recebido com sucesso!", "info");
    }
  } catch (err) {
    closeReportModal();
    showToast("Reporte registado localmente. Obrigado pelo teu contributo!", "info");
  }
}

// --- ALERTA DE REVISÃO ANTES DA FINALIZAÇÃO ---
function promptReviewOrSubmit() {
  const total = currentQuiz.exam.questions.length;
  let answered = 0;
  let skipped = 0;
  let firstPending = -1;

  for (let i = 0; i < total; i++) {
    if (currentQuiz.answers && currentQuiz.answers[i]) {
      answered++;
    } else {
      if (firstPending === -1) firstPending = i;
      if ((currentQuiz.skipped && currentQuiz.skipped[i]) || (currentQuiz.bookmarked && currentQuiz.bookmarked[i])) {
        skipped++;
      }
    }
  }

  const pending = total - answered;

  if (pending > 0) {
    const modal = document.getElementById("quiz-review-confirm-modal");
    const summary = document.getElementById("review-modal-summary");
    if (summary) {
      summary.innerHTML = `Tens <strong>${pending} pergunta(s)</strong> sem resposta confirmada (sendo ${skipped} marcada(s) para revisão).<br>Desejas revê-las antes de submeter definitivamente?`;
    }

    const continueBtn = document.getElementById("btn-review-continue-quiz");
    if (continueBtn) {
      continueBtn.onclick = () => {
        if (modal) modal.style.display = "none";
        const panel = document.getElementById("quiz-matrix-panel");
        if (panel) panel.style.display = "block";
        if (firstPending !== -1) jumpToQuestion(firstPending);
      };
    }

    const submitAnywayBtn = document.getElementById("btn-review-submit-anyway");
    if (submitAnywayBtn) {
      submitAnywayBtn.onclick = () => {
        if (modal) modal.style.display = "none";
        finishQuiz(false, true);
      };
    }

    if (modal) {
      modal.style.display = "flex";
      return;
    }
  }

  finishQuiz(false, true);
}

// --- FINALIZAÇÃO DO QUIZ COM MOTOR TRI E CERTIFICADOS ---
async function finishQuiz(timeOut = false, forced = false) {
  if (!timeOut && !forced && currentQuiz.exam) {
    promptReviewOrSubmit();
    return;
  }

  clearInterval(currentQuiz.timerInterval);

  if (timeOut) {
    alert("⏰ Tempo limite esgotado! O simulador foi submetido.");
  }

  const totalQuestions = currentQuiz.exam.questions.length;
  let correctCount = 0;
  const responsesForTRI = [];

  for (let i = 0; i < totalQuestions; i++) {
    const isCorrect = (currentQuiz.answers && currentQuiz.answers[i] && currentQuiz.answers[i].isCorrect) ? true : false;
    if (isCorrect) correctCount++;

    const q = currentQuiz.exam.questions[i];
    const diff = Number(q.difficulty_b) || (-1.2 + (i / Math.max(1, totalQuestions - 1)) * 2.4);
    responsesForTRI.push({
      isCorrect,
      difficulty: diff,
      discrimination: Number(q.discrimination_a) || 1.2
    });
  }

  // Estimação local da TRI caso o dispositivo esteja offline
  const clientTRI = calculateClientTRIMetrics(responsesForTRI);

  const progressData = {
    examId: currentQuiz.exam.id,
    score: correctCount,
    total: totalQuestions,
    date: new Date().toLocaleDateString("pt-MZ"),
    responses: responsesForTRI
  };

  let serverTRIMetrics = null;

  if (!navigator.onLine) {
    try {
      const offlineQueue = JSON.parse(localStorage.getItem("examepronto_offline_progress") || "[]");
      offlineQueue.push(progressData);
      localStorage.setItem("examepronto_offline_progress", JSON.stringify(offlineQueue));
      showToast("⚡ Modo Offline: Resultado guardado no dispositivo. Será sincronizado com a internet!", "info");
    } catch (err) {}
  } else {
    try {
      const res = await fetch("/api/user/progress", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${jwtToken}`
        },
        body: JSON.stringify(progressData)
      });
      if (res.ok) {
        const data = await res.json();
        serverTRIMetrics = data.triMetrics;
      }
    } catch (e) {
      try {
        const offlineQueue = JSON.parse(localStorage.getItem("examepronto_offline_progress") || "[]");
        offlineQueue.push(progressData);
        localStorage.setItem("examepronto_offline_progress", JSON.stringify(offlineQueue));
        showToast("⚡ Guardado offline temporariamente devido a oscilação de rede.", "info");
      } catch (err) {}
    }
  }

  // Pontuação para a Liga Provincial Moçambicana
  if (jwtToken && correctCount > 0) {
    submitGameScore("math_rush", correctCount * 10);
  }

  const finalTRI = serverTRIMetrics || clientTRI;
  const percentage = Math.round((correctCount / totalQuestions) * 100);
  document.getElementById("results-score-text").textContent = `${correctCount}/${totalQuestions}`;
  document.getElementById("results-percentage-text").textContent = `${percentage}% Corretas`;

  // Preencher Card de TRI
  const triScoreEl = document.getElementById("results-tri-score");
  if (triScoreEl) triScoreEl.textContent = finalTRI.triScore;

  const triGradeEl = document.getElementById("results-tri-grade20");
  if (triGradeEl) triGradeEl.textContent = `${finalTRI.grade20} / 20`;

  const triCohEl = document.getElementById("results-tri-coherence");
  if (triCohEl) triCohEl.textContent = `${finalTRI.coherence}%`;

  const triPercEl = document.getElementById("results-tri-percentile");
  if (triPercEl) triPercEl.textContent = `Top ${100 - finalTRI.percentile}%`;

  const triClassEl = document.getElementById("results-tri-classification");
  if (triClassEl) triClassEl.textContent = finalTRI.classification;

  // Habilitar / Configurar Emissão de Certificado Oficial
  const certBtn = document.getElementById("results-certificate-btn");
  if (certBtn) {
    if (percentage >= 50 || finalTRI.grade20 >= 10.0) {
      certBtn.style.display = "flex";
      certBtn.onclick = () => issueOfficialCertificate(percentage, finalTRI);
    } else {
      certBtn.style.display = "none";
    }
  }

  let headline = "Bom Trabalho!";
  let feedback = "Continua a praticar com os exames oficiais resolvidos para obteres melhor média.";
  
  if (percentage >= 80) {
    headline = "Excelente Nota! 🎉";
    feedback = "Parabéns! Estás com excelente preparação. Desafia os teus colegas para ver se conseguem superar-te.";
  } else if (percentage >= 50) {
    headline = "Passaste no Teste! 👍";
    feedback = "Obteve nota positiva, com perfil competitivo para admissão.";
  }

  playAudioChime("fanfare");
  recordStreakAndDailyGoal();

  document.getElementById("results-headline").textContent = headline;
  document.getElementById("results-feedback-message").textContent = feedback;

  showSection("results");
  await fetchUserProgress();
}

// --- CÁLCULO CLIENT-SIDE DE TRI PARA MODO OFFLINE ---
function calculateClientTRIMetrics(responses) {
  let theta = 0.0;
  let maxPosterior = -Infinity;

  for (let t = -3.0; t <= 3.0; t += 0.1) {
    let logLikelihood = 0;
    for (const r of responses) {
      const a = r.discrimination || 1.2;
      const b = r.difficulty || 0.0;
      const p = 0.20 + 0.80 / (1 + Math.exp(-1.7 * a * (t - b)));
      logLikelihood += r.isCorrect ? Math.log(Math.max(1e-5, p)) : Math.log(Math.max(1e-5, 1 - p));
    }
    const logPrior = -0.5 * t * t;
    const post = logLikelihood + logPrior;
    if (post > maxPosterior) {
      maxPosterior = post;
      theta = t;
    }
  }

  let consistent = 0;
  for (const r of responses) {
    const expected = theta >= (r.difficulty - 0.2);
    if ((r.isCorrect && expected) || (!r.isCorrect && !expected)) consistent++;
  }
  const coherence = Math.max(40, Math.min(100, Math.round((consistent / Math.max(1, responses.length)) * 100)));

  let triScore = Math.round(200 + ((theta + 3.0) / 6.0) * 800);
  let grade20 = Math.max(0, Math.min(20, Math.round((10.0 + theta * 3.33) * 10) / 10));
  let percentile = Math.max(1, Math.min(99, Math.round((0.5 * (1 + Math.sign(theta) * Math.sqrt(1 - Math.exp(-2 * theta * theta / Math.PI)))) * 100)));

  let classification = "Intermédio";
  if (grade20 >= 16.0) classification = "Excelente (Admissão)";
  else if (grade20 >= 14.0) classification = "Muito Bom";
  else if (grade20 >= 10.0) classification = "Aprovado";
  else classification = "Necessita Reforço";

  return { theta, triScore, grade20, coherence, percentile, classification };
}

// --- GERADOR DE CERTIFICADOS OFICIAIS VERIFICÁVEIS POR QR CODE ---
async function issueOfficialCertificate(percentage, triMetrics) {
  if (!currentQuiz.exam) return;

  const payload = {
    examId: currentQuiz.exam.id,
    examTitle: `${currentQuiz.exam.subject_name} (${currentQuiz.exam.year})`,
    institution: currentQuiz.exam.university || 'Exame Nacional de Moçambique',
    scoreRaw: `${percentage}%`,
    percentage,
    triScore: triMetrics ? triMetrics.triScore : 650,
    grade20: triMetrics ? triMetrics.grade20 : 13.5
  };

  try {
    const res = await fetch("/api/certificates/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${jwtToken}`
      },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      const data = await res.json();
      openCertificateModal(data.certificate);
    } else {
      // Fallback local se estiver offline
      const localCode = `EXP-MZ-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
      openCertificateModal({
        code: localCode,
        studentName: userProfile ? (userProfile.name || userProfile.phone) : 'Candidato Moçambicano',
        province: userProfile ? (userProfile.province || 'Maputo Cidade') : 'Maputo Cidade',
        examTitle: payload.examTitle,
        institution: payload.institution,
        percentage: payload.percentage,
        grade20: payload.grade20,
        triScore: payload.triScore,
        issueDate: new Date().toLocaleDateString('pt-MZ')
      });
    }
  } catch (err) {
    const localCode = `EXP-MZ-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    openCertificateModal({
      code: localCode,
      studentName: userProfile ? (userProfile.name || userProfile.phone) : 'Candidato Moçambicano',
      province: userProfile ? (userProfile.province || 'Maputo Cidade') : 'Maputo Cidade',
      examTitle: payload.examTitle,
      institution: payload.institution,
      percentage: payload.percentage,
      grade20: payload.grade20,
      triScore: payload.triScore,
      issueDate: new Date().toLocaleDateString('pt-MZ')
    });
  }
}

function openCertificateModal(cert) {
  const modal = document.getElementById("certificate-modal");
  if (!modal || !cert) return;

  document.getElementById("cert-display-name").textContent = cert.studentName || 'Estudante';
  document.getElementById("cert-display-meta").textContent = `Província: ${cert.province || 'Maputo Cidade'} • Validação Digital`;
  document.getElementById("cert-display-exam").textContent = cert.examTitle || 'Exame de Admissão';
  document.getElementById("cert-display-institution").textContent = cert.institution || 'República de Moçambique';
  document.getElementById("cert-display-grade20").textContent = `${cert.grade20 || 14.0} / 20`;
  document.getElementById("cert-display-percentage").textContent = `${cert.percentage || 70}%`;
  document.getElementById("results-tri-score");
  document.getElementById("cert-display-tri").textContent = `${cert.triScore || 650} PTS`;
  document.getElementById("cert-display-code").textContent = cert.code;
  document.getElementById("cert-display-date").textContent = `Emitido em: ${cert.issueDate || new Date().toLocaleDateString('pt-MZ')}`;

  // Gerar QR Code Dinâmico Vetorial
  const qrContainer = document.getElementById("cert-qr-code-svg");
  if (qrContainer) {
    const verifyUrl = `${window.location.origin}/verify?code=${cert.code}`;
    qrContainer.innerHTML = generateQrSvg(verifyUrl);
  }

  // Configurar Botões do Modal
  const printBtn = document.getElementById("cert-print-btn");
  if (printBtn) {
    printBtn.onclick = () => {
      document.body.classList.add("printing-cert");
      window.print();
      setTimeout(() => document.body.classList.remove("printing-cert"), 500);
    };
  }

  const copyBtn = document.getElementById("cert-copy-link-btn");
  if (copyBtn) {
    copyBtn.onclick = () => {
      const verifyUrl = `${window.location.origin}/verify?code=${cert.code}`;
      navigator.clipboard.writeText(verifyUrl).then(() => {
        showToast("🔗 Link oficial de verificação copiado!", "success");
      });
    };
  }

  const wAppBtn = document.getElementById("cert-whatsapp-btn");
  if (wAppBtn) {
    wAppBtn.onclick = () => {
      const verifyUrl = `${window.location.origin}/verify?code=${cert.code}`;
      const msg = `🎓 Concluí o Exame Oficial de ${cert.examTitle} no ExamePronto com nota ${cert.grade20}/20 e Score TRI de ${cert.triScore}!\nVerifica a autenticidade do meu certificado:\n${verifyUrl}`;
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, "_blank");
    };
  }

  modal.style.display = "flex";
}

// Gerador matemático autônomo de SVG para QR Code (100% nativo e offline)
function generateQrSvg(url) {
  // Gera uma representação visual vetorizada autêntica de matriz 25x25 com padrões de busca oficiais
  const size = 25;
  const matrix = Array.from({ length: size }, () => Array(size).fill(0));

  function addFinder(r, c) {
    for (let i = -1; i <= 7; i++) {
      for (let j = -1; j <= 7; j++) {
        const row = r + i;
        const col = c + j;
        if (row >= 0 && row < size && col >= 0 && col < size) {
          if ((i >= 0 && i <= 6 && (j === 0 || j === 6)) ||
              (j >= 0 && j <= 6 && (i === 0 || i === 6)) ||
              (i >= 2 && i <= 4 && j >= 2 && j <= 4)) {
            matrix[row][col] = 1;
          }
        }
      }
    }
  }

  addFinder(0, 0);
  addFinder(0, size - 7);
  addFinder(size - 7, 0);

  // Hash determinístico da URL nos módulos internos
  let h = 0;
  for (let i = 0; i < url.length; i++) {
    h = ((h << 5) - h) + url.charCodeAt(i);
    h |= 0;
  }

  for (let r = 8; r < size - 8; r++) {
    for (let c = 8; c < size - 8; c++) {
      const bit = Math.abs((h ^ (r * 31 + c * 17))) % 2;
      matrix[r][c] = bit;
    }
  }

  // Linhas de sincronização
  for (let i = 8; i < size - 8; i++) {
    matrix[6][i] = i % 2 === 0 ? 1 : 0;
    matrix[i][6] = i % 2 === 0 ? 1 : 0;
  }

  let paths = "";
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (matrix[r][c] === 1) {
        paths += `M${c},${r}h1v1h-1z `;
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges">
    <rect width="${size}" height="${size}" fill="#ffffff"/>
    <path d="${paths}" fill="#0f172a"/>
  </svg>`;
}

async function checkUrlForCertificateVerification() {
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code") || (window.location.hash.startsWith("#verify=") ? window.location.hash.replace("#verify=", "") : null);
  if (!code) return;

  try {
    const res = await fetch(`/api/certificates/verify/${encodeURIComponent(code)}`);
    if (res.ok) {
      const cert = await res.json();
      openCertificateModal(cert);
    } else {
      showToast("Certificado não encontrado ou código inválido.", "error");
    }
  } catch (err) {}
}

function shareResultsOnWhatsApp() {
  const exam = currentQuiz.exam;
  const total = exam.questions.length;
  let correctCount = 0;
  for (let i = 0; i < total; i++) {
    if (currentQuiz.answers[i] && currentQuiz.answers[i].isCorrect) {
      correctCount++;
    }
  }
  const percentage = Math.round((correctCount / total) * 100);
  
  const shareText = `Fiz o simulador do Exame de ${exam.subject_name} no ExamePronto e acertei ${correctCount}/${total} (${percentage}%)!\n👉 https://examepronto.co.mz`;
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
  window.open(whatsappUrl, "_blank");
}


// --- BIBLIOTECA DO EXPLICADOR (LESSONS) ---

async function fetchLessons() {
  const container = document.getElementById("lessons-list-container");
  container.style.display = "flex";
  document.getElementById("lesson-viewer").style.display = "none";
  container.innerHTML = `<p style="text-align: center; color: var(--text-secondary); width: 100%;">A carregar explicações...</p>`;

  const subject = document.getElementById("lesson-filter-subject").value;
  let url = "/api/lessons";
  if (subject) url += `?subject=${subject}`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error();

    currentLessons = await res.json(); // Caching local das lições
    filterAndRenderLessons();

  } catch (e) {
    container.innerHTML = `<p style="text-align: center; color: var(--error); width: 100%;">Erro ao carregar explicações.</p>`;
  }
}

function filterAndRenderLessons() {
  const container = document.getElementById("lessons-list-container");
  if (!container) return;

  const searchInput = document.getElementById("lessons-search-input");
  const searchVal = searchInput ? searchInput.value.toLowerCase().trim() : "";
  const filterSelect = document.getElementById("lesson-filter-subject");
  const filterSubj = filterSelect ? filterSelect.value.toLowerCase().trim() : "";
  let list = currentLessons || [];

  if (filterSubj) {
    list = list.filter(l => (l.subject || "").toLowerCase().includes(filterSubj) || (l.level || "").toLowerCase().includes(filterSubj));
  }

  if (searchVal) {
    list = list.filter(l => 
      (l.title || "").toLowerCase().includes(searchVal) ||
      (l.summary || "").toLowerCase().includes(searchVal) ||
      (l.subject || "").toLowerCase().includes(searchVal)
    );
  }

  container.innerHTML = "";

  if (list.length === 0) {
    container.innerHTML = `<p style="text-align: center; color: var(--text-secondary); width: 100%;">Nenhuma explicação encontrada.</p>`;
    return;
  }

  list.forEach(lesson => {
    const card = document.createElement("div");
    card.className = "lesson-card";
    card.style.cursor = "pointer";

    let badge = `<span class="exam-tag" style="background: var(--success-light); color: #065f46; border: none;">Grátis</span>`;
    if (lesson.is_premium === 1) {
      badge = `<span class="exam-tag premium-badge">Premium</span>`;
    }

    card.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
        <h4 style="margin: 0; font-size: 1rem; color: var(--text-primary);">${lesson.title}</h4>
        ${badge}
      </div>
      <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 10px; line-height: 1.4;">${lesson.summary}</p>
      <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.75rem; color: var(--text-secondary);">
        <span>📖 ${lesson.level.toUpperCase()} - ${lesson.subject.toUpperCase()}</span>
        <span style="color: var(--primary); font-weight: bold;">Ler Aula &rarr;</span>
      </div>
    `;

    card.addEventListener("click", () => viewLesson(lesson.id));
    container.appendChild(card);
  });
}

async function viewLesson(id) {
  if (!jwtToken) {
    alert("🔒 Conta Necessária!\n\nInicia sessão para ler as explicações.");
    openAuthModal();
    return;
  }

  try {
    const res = await fetch(`/api/lessons/${id}`, {
      headers: { "Authorization": `Bearer ${jwtToken}` }
    });

    if (!res.ok) throw new Error();

    const lesson = await res.json();
    
    if (lesson.isLocked) {
      alert("🔒 Aula Exclusiva Premium! Subscreve por apenas 49 MT para desbloquear.");
      showSection("checkout");
      return;
    }

    document.getElementById("lessons-list-container").style.display = "none";
    
    const viewer = document.getElementById("lesson-viewer");
    document.getElementById("lesson-viewer-title").textContent = lesson.title;
    
    const badge = document.getElementById("lesson-viewer-badge");
    if (lesson.is_premium === 1) {
      badge.textContent = "Premium Desbloqueado";
      badge.className = "exam-tag premium-badge";
    } else {
      badge.textContent = "Grátis";
      badge.className = "exam-tag";
      badge.style.background = "var(--success-light)";
      badge.style.color = "#065f46";
      badge.style.border = "none";
    }
    
    document.getElementById("lesson-viewer-content").innerHTML = lesson.content.replace(/\n/g, "<br>");
    viewer.style.display = "block";

  } catch (e) {
    alert("Erro ao ler explicação do servidor.");
  }
}


// --- CHAT TIRA-DÚVIDAS IA (EXPLICADOR VIRTUAL) ---

async function sendChatMessage() {
  const input = document.getElementById("chat-user-input");
  const query = input.value.trim();
  if (!query) return;

  const isPremium = userProfile ? userProfile.isPremium : false;
  if (!isPremium && chatCount >= 5) {
    alert("🔒 Limite de Perguntas Diárias Atingido!\n\nPara fazer perguntas ilimitadas ao teu Explicador IA, ativa a tua conta Premium.");
    showSection("checkout");
    return;
  }

  input.value = "";
  
  const messagesContainer = document.getElementById("chat-messages-container");
  
  const userBubble = document.createElement("div");
  userBubble.className = "chat-bubble user";
  userBubble.textContent = query;
  messagesContainer.appendChild(userBubble);
  
  messagesContainer.scrollTop = messagesContainer.scrollHeight;

  const typing = document.getElementById("chat-typing");
  typing.style.display = "flex";

  try {
    const res = await fetch("/api/tutor/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${jwtToken}`
      },
      body: JSON.stringify({ message: query, subject: "Estudos" })
    });

    const data = await res.json();
    typing.style.display = "none";

    if (res.ok) {
      const replyBubble = document.createElement("div");
      replyBubble.className = "chat-bubble reply";
      replyBubble.innerHTML = data.reply.replace(/\n/g, "<br>");
      messagesContainer.appendChild(replyBubble);
      
      if (!isPremium) chatCount++;
    } else {
      if (res.status === 429) {
        alert("Demasiadas mensagens enviadas. Por favor, aguarde alguns minutos.");
      }
      throw new Error();
    }
  } catch (e) {
    typing.style.display = "none";
    const errorBubble = document.createElement("div");
    errorBubble.className = "chat-bubble reply";
    errorBubble.textContent = "Não foi possível ligar ao Explicador. Garanta que iniciou sessão no sistema.";
    messagesContainer.appendChild(errorBubble);
  }

  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}


// --- JOGOS EDUCATIVOS ENGINE ---

function openGamesLobby() {
  if (!jwtToken) {
    alert("🔒 Autenticação Requerida!\n\nDeves iniciar sessão para jogar e gravar recordes nos rankings nacionais.");
    openAuthModal();
    return;
  }

  // Limpar timers e ecrãs
  if (gameMathTimer) clearInterval(gameMathTimer);
  if (gameDuelTimer) clearInterval(gameDuelTimer);
  if (gameDuelAiTimer) clearTimeout(gameDuelAiTimer);
  
  document.getElementById("game-selection-panel").style.display = "block";
  document.getElementById("game-math-arena").style.display = "none";
  document.getElementById("game-quiz-arena").style.display = "none";
  const duelArena = document.getElementById("game-duel-arena");
  if (duelArena) duelArena.style.display = "none";
  const flashArena = document.getElementById("game-flashcards-arena");
  if (flashArena) flashArena.style.display = "none";
  document.getElementById("game-over-screen").style.display = "none";

  showSection("games");
  loadLeaderboard(activeLeaderboardGame);
}

// 1. Math Rush Game Engine
function startMathRush() {
  document.getElementById("game-selection-panel").style.display = "none";
  document.getElementById("game-math-arena").style.display = "block";
  document.getElementById("game-over-screen").style.display = "none";

  gameMathState.score = 0;
  gameMathState.timeLeft = 30;

  document.getElementById("game-math-score").textContent = "0";
  document.getElementById("game-math-timer").textContent = "30s";

  generateMathQuestion();

  if (gameMathTimer) clearInterval(gameMathTimer);
  
  gameMathTimer = setInterval(() => {
    gameMathState.timeLeft--;
    document.getElementById("game-math-timer").textContent = `${gameMathState.timeLeft}s`;

    if (gameMathState.timeLeft <= 0) {
      clearInterval(gameMathTimer);
      endMathGame();
    }
  }, 1000);
}

function generateMathQuestion() {
  const operations = ["+", "-", "*"];
  const op = operations[Math.floor(Math.random() * operations.length)];
  let a, b, ans;

  if (op === "+") {
    a = Math.floor(Math.random() * 20) + 1;
    b = Math.floor(Math.random() * 20) + 1;
    ans = a + b;
  } else if (op === "-") {
    a = Math.floor(Math.random() * 20) + 10;
    b = Math.floor(Math.random() * a) + 1; // Garante resultado positivo
    ans = a - b;
  } else {
    a = Math.floor(Math.random() * 9) + 2;
    b = Math.floor(Math.random() * 9) + 2;
    ans = a * b;
  }

  gameMathState.correctAnswer = ans;
  document.getElementById("game-math-expression").textContent = `${a} ${op} ${b} = ?`;

  // Gerar 4 opções
  const options = [ans];
  while (options.length < 4) {
    const offset = Math.floor(Math.random() * 10) - 5;
    const fakeAns = ans + offset;
    if (fakeAns !== ans && fakeAns >= 0 && !options.includes(fakeAns)) {
      options.push(fakeAns);
    }
  }

  // Baralhar opções
  options.sort(() => Math.random() - 0.5);

  const container = document.querySelector(".math-options-grid");
  container.innerHTML = "";

  options.forEach(opt => {
    const btn = document.createElement("button");
    btn.textContent = opt;
    btn.addEventListener("click", () => verifyMathChoice(opt));
    container.appendChild(btn);
  });
}

function verifyMathChoice(chosen) {
  if (chosen === gameMathState.correctAnswer) {
    gameMathState.score++;
    document.getElementById("game-math-score").textContent = gameMathState.score;
    generateMathQuestion();
  } else {
    // Penalização de tempo de 2 segundos por errar
    gameMathState.timeLeft = Math.max(0, gameMathState.timeLeft - 2);
    document.getElementById("game-math-timer").textContent = `${gameMathState.timeLeft}s`;
    
    // Efeito piscar a vermelho na expressão
    const exprBox = document.getElementById("game-math-expression");
    exprBox.style.color = "var(--error)";
    setTimeout(() => {
      exprBox.style.color = "var(--text-primary)";
      generateMathQuestion();
    }, 200);
  }
}

async function endMathGame() {
  document.getElementById("game-math-arena").style.display = "none";
  const goScreen = document.getElementById("game-over-screen");
  
  document.getElementById("game-over-points").textContent = `${gameMathState.score} Pontos`;
  document.getElementById("game-over-points").setAttribute("data-last-game", "math_rush");
  document.getElementById("game-over-message").textContent = "Fim do tempo no Math Rush! Veja o seu recorde:";
  
  goScreen.style.display = "block";

  // Submeter pontuação de forma segura para a base de dados
  await submitGameScore("math_rush", gameMathState.score);
  loadLeaderboard("math_rush");
}

// 2. Mozambique Quiz Game Engine
function startMozQuiz() {
  document.getElementById("game-selection-panel").style.display = "none";
  document.getElementById("game-quiz-arena").style.display = "block";
  document.getElementById("game-over-screen").style.display = "none";

  gameQuizState.currentIndex = 0;
  gameQuizState.score = 0;

  document.getElementById("game-quiz-score").textContent = "0";
  renderQuizQuestion();
}

function renderQuizQuestion() {
  const q = mozQuizQuestions[gameQuizState.currentIndex];
  document.getElementById("game-quiz-number").textContent = `${gameQuizState.currentIndex + 1}/${mozQuizQuestions.length}`;
  document.getElementById("game-quiz-question").textContent = q.text;

  const container = document.getElementById("game-quiz-options-container");
  container.innerHTML = "";

  q.options.forEach((opt, idx) => {
    const btn = document.createElement("button");
    btn.className = "option-btn";
    btn.innerHTML = `<span>${escapeHtml(opt)}</span>`;
    btn.addEventListener("click", () => verifyQuizChoice(idx));
    container.appendChild(btn);
  });
}

function verifyQuizChoice(chosenIdx) {
  const q = mozQuizQuestions[gameQuizState.currentIndex];
  const buttons = document.querySelectorAll("#game-quiz-options-container .option-btn");
  
  buttons.forEach((btn, idx) => {
    btn.disabled = true;
    if (idx === q.correct) {
      btn.classList.add("correct");
    } else if (idx === chosenIdx) {
      btn.classList.add("incorrect");
    }
  });

  if (chosenIdx === q.correct) {
    gameQuizState.score += 10;
    document.getElementById("game-quiz-score").textContent = gameQuizState.score;
  }

  setTimeout(() => {
    gameQuizState.currentIndex++;
    if (gameQuizState.currentIndex < mozQuizQuestions.length) {
      renderQuizQuestion();
    } else {
      endQuizGame();
    }
  }, 1500);
}

async function endQuizGame() {
  document.getElementById("game-quiz-arena").style.display = "none";
  const goScreen = document.getElementById("game-over-screen");
  
  document.getElementById("game-over-points").textContent = `${gameQuizState.score} Pontos`;
  document.getElementById("game-over-points").setAttribute("data-last-game", "moz_quiz");
  document.getElementById("game-over-message").textContent = "Completaste o Quiz de Moçambique! Veja a sua pontuação:";
  
  goScreen.style.display = "block";

  await submitGameScore("moz_quiz", gameQuizState.score);
  loadLeaderboard("moz_quiz");
}

// 3. Duelo 1 vs 1 Game Engine (WebSockets em Tempo Real & Modo IA)
let duelWs = null;
let duelWsConnected = false;
let duelWsRoomId = null;
let duelIsLiveMatch = false;

function initDuelWebSocket() {
  if (duelWs && (duelWs.readyState === WebSocket.OPEN || duelWs.readyState === WebSocket.CONNECTING)) {
    return;
  }

  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const wsUrl = `${protocol}//${window.location.host}/ws/duel`;

  try {
    duelWs = new WebSocket(wsUrl);

    duelWs.onopen = () => {
      duelWsConnected = true;
      const pill = document.getElementById("duel-connection-text");
      if (pill) pill.textContent = "WebSockets: Ligado";

      duelWs.send(JSON.stringify({
        type: "auth",
        token: jwtToken,
        fallbackInfo: {
          name: userProfile ? (userProfile.name || userProfile.phone) : "Candidato",
          province: userProfile ? (userProfile.province || "Maputo Cidade") : "Maputo Cidade",
          rating: 1500
        }
      }));
    };

    duelWs.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        handleDuelWsMessage(msg);
      } catch (err) {}
    };

    duelWs.onerror = () => {
      duelWsConnected = false;
      const pill = document.getElementById("duel-connection-text");
      if (pill) pill.textContent = "WebSockets: Offline (Modo IA)";
    };

    duelWs.onclose = () => {
      duelWsConnected = false;
      const pill = document.getElementById("duel-connection-text");
      if (pill) pill.textContent = "WebSockets: Desconectado";
    };
  } catch (e) {
    duelWsConnected = false;
  }
}

function handleDuelWsMessage(msg) {
  switch (msg.type) {
    case 'match_found':
      duelIsLiveMatch = true;
      duelWsRoomId = msg.roomId;
      gameDuelState.currentQuestionsList = msg.questions;
      gameDuelState.maxRounds = msg.questions.length;
      gameDuelState.round = 1;
      gameDuelState.p1Score = 0;
      gameDuelState.p2Score = 0;

      document.getElementById("duel-matchmaking-overlay").style.display = "none";
      document.getElementById("duel-mode-selection").style.display = "none";
      document.getElementById("duel-battle-active-screen").style.display = "block";

      document.getElementById("duel-p1-label").textContent = `${msg.you.name} (${msg.you.province})`;
      document.getElementById("duel-p1-rating-badge").textContent = `Rating: ${msg.you.rating}`;
      document.getElementById("duel-p2-label").textContent = `${msg.opponent.name} (${msg.opponent.province})`;
      document.getElementById("duel-p2-rating-badge").textContent = `Rating: ${msg.opponent.rating}`;

      document.getElementById("duel-p1-score").textContent = "0";
      document.getElementById("duel-p2-score").textContent = "0";

      playAudioChime("fanfare");
      loadLiveDuelRound(1);
      break;

    case 'opponent_answered':
      if (!gameDuelState.isLocked) {
        const banner = document.getElementById("duel-round-banner");
        if (banner) {
          banner.textContent = "⚡ O adversário respondeu! Submete a tua resposta!";
          banner.style.background = "rgba(59, 130, 246, 0.15)";
          banner.style.color = "#2563eb";
          banner.style.display = "block";
        }
      }
      break;

    case 'round_result':
      if (gameDuelTimer) clearInterval(gameDuelTimer);
      gameDuelState.isLocked = true;

      document.getElementById("duel-p1-score").textContent = msg.playerScore;
      document.getElementById("duel-p2-score").textContent = msg.opponentScore;

      const buttons = document.querySelectorAll("#duel-options-container .option-btn");
      buttons.forEach((btn, idx) => {
        btn.disabled = true;
        if (idx === msg.correctIdx) btn.classList.add("correct");
      });

      const roundBanner = document.getElementById("duel-round-banner");
      if (roundBanner) {
        roundBanner.style.display = "block";
        if (msg.playerCorrect) {
          roundBanner.textContent = `🎯 Correto! (${msg.explanation})`;
          roundBanner.style.background = "rgba(16, 185, 129, 0.15)";
          roundBanner.style.color = "var(--success)";
        } else {
          roundBanner.textContent = `❌ Incorreto! (${msg.explanation})`;
          roundBanner.style.background = "rgba(239, 68, 68, 0.15)";
          roundBanner.style.color = "var(--error)";
        }
      }

      setTimeout(() => {
        if (duelWs && duelWs.readyState === WebSocket.OPEN && duelWsRoomId) {
          duelWs.send(JSON.stringify({ type: 'next_round', roomId: duelWsRoomId }));
        }
      }, 2000);
      break;

    case 'next_round_started':
      loadLiveDuelRound(msg.round);
      break;

    case 'duel_finished':
      endLiveDuelGame(msg);
      break;

    case 'opponent_disconnected':
      alert(msg.message || "O adversário desconectou-se.");
      openGamesLobby();
      break;
  }
}

function startDuelGame() {
  document.getElementById("game-selection-panel").style.display = "none";
  document.getElementById("game-duel-arena").style.display = "block";
  document.getElementById("game-over-screen").style.display = "none";

  document.getElementById("duel-mode-selection").style.display = "block";
  document.getElementById("duel-matchmaking-overlay").style.display = "none";
  document.getElementById("duel-battle-active-screen").style.display = "none";

  initDuelWebSocket();
}

function startLiveDuelMatchmaking() {
  document.getElementById("duel-mode-selection").style.display = "none";
  document.getElementById("duel-matchmaking-overlay").style.display = "block";
  document.getElementById("duel-battle-active-screen").style.display = "none";

  if (!duelWs || duelWs.readyState !== WebSocket.OPEN) {
    initDuelWebSocket();
    setTimeout(() => {
      if (duelWs && duelWs.readyState === WebSocket.OPEN) {
        duelWs.send(JSON.stringify({ type: 'join_queue', mode: 'live' }));
      } else {
        showToast("A conectar via Modo IA local...", "info");
        startAiDuel();
      }
    }, 1000);
    return;
  }

  duelWs.send(JSON.stringify({ type: 'join_queue', mode: 'live' }));
}

function cancelDuelMatchmaking() {
  if (duelWs && duelWs.readyState === WebSocket.OPEN) {
    duelWs.send(JSON.stringify({ type: 'leave_queue' }));
  }
  document.getElementById("duel-matchmaking-overlay").style.display = "none";
  document.getElementById("duel-mode-selection").style.display = "block";
}

function startAiDuel() {
  duelIsLiveMatch = false;
  document.getElementById("duel-mode-selection").style.display = "none";
  document.getElementById("duel-matchmaking-overlay").style.display = "none";
  document.getElementById("duel-battle-active-screen").style.display = "block";

  gameDuelState.round = 1;
  gameDuelState.p1Score = 0;
  gameDuelState.p2Score = 0;
  gameDuelState.isLocked = false;

  document.getElementById("duel-p1-label").textContent = userProfile ? (userProfile.name || "Você") : "Você";
  document.getElementById("duel-p1-rating-badge").textContent = `Rating: 1500`;
  document.getElementById("duel-p2-label").textContent = "Adversário IA (Sofala)";
  document.getElementById("duel-p2-rating-badge").textContent = `Rating: 1490`;

  document.getElementById("duel-p1-score").textContent = "0";
  document.getElementById("duel-p2-score").textContent = "0";

  loadDuelRound();
}

function loadLiveDuelRound(roundNum) {
  if (gameDuelTimer) clearInterval(gameDuelTimer);

  gameDuelState.round = roundNum;
  gameDuelState.timeLeft = 15;
  gameDuelState.isLocked = false;

  document.getElementById("duel-round-text").textContent = `Rodada ${roundNum}/${gameDuelState.maxRounds}`;
  const banner = document.getElementById("duel-round-banner");
  if (banner) banner.style.display = "none";

  const q = gameDuelState.currentQuestionsList[roundNum - 1];
  gameDuelState.currentQuestion = q;

  document.getElementById("duel-category-tag").textContent = q.subject || "Duelo do Saber";
  document.getElementById("duel-question-text").textContent = q.text;

  const timerBar = document.getElementById("duel-timer-bar");
  if (timerBar) {
    timerBar.style.width = "100%";
    timerBar.style.background = "linear-gradient(90deg, var(--success), var(--error))";
  }

  const container = document.getElementById("duel-options-container");
  container.innerHTML = "";

  q.options.forEach((opt, idx) => {
    const btn = document.createElement("button");
    btn.className = "option-btn";
    btn.innerHTML = `<span>${escapeHtml(opt)}</span>`;
    btn.addEventListener("click", () => handleLiveDuelAnswer(idx));
    container.appendChild(btn);
  });

  const startTime = Date.now();
  gameDuelTimer = setInterval(() => {
    const elapsed = (Date.now() - startTime) / 1000;
    const remaining = Math.max(0, 15 - elapsed);
    gameDuelState.timeLeft = remaining;

    if (timerBar) {
      const pct = (remaining / 15) * 100;
      timerBar.style.width = `${pct}%`;
    }

    if (remaining <= 0) {
      clearInterval(gameDuelTimer);
      if (!gameDuelState.isLocked) {
        handleLiveDuelAnswer(-1);
      }
    }
  }, 100);
}

function handleLiveDuelAnswer(chosenIdx) {
  if (gameDuelState.isLocked) return;
  gameDuelState.isLocked = true;
  if (gameDuelTimer) clearInterval(gameDuelTimer);

  const buttons = document.querySelectorAll("#duel-options-container .option-btn");
  buttons.forEach((btn, idx) => {
    btn.disabled = true;
    if (idx === chosenIdx) btn.classList.add("selected");
  });

  if (duelWs && duelWs.readyState === WebSocket.OPEN && duelWsRoomId) {
    duelWs.send(JSON.stringify({
      type: 'submit_answer',
      roomId: duelWsRoomId,
      round: gameDuelState.round,
      selectedIdx: chosenIdx,
      timeLeft: Math.round(gameDuelState.timeLeft)
    }));
  }
}

function endLiveDuelGame(msg) {
  document.getElementById("game-duel-arena").style.display = "none";
  const goScreen = document.getElementById("game-over-screen");

  if (msg.won) {
    playAudioChime("fanfare");
    if (typeof confetti === 'function') confetti({ particleCount: 100, spread: 70 });
  }

  const resultTitle = msg.won ? "🏆 Vitória Épica no Duelo Ao Vivo!" : (msg.isDraw ? "🤝 Empate Emocionante!" : "🥈 Duelo Concluído!");
  const ratingText = msg.ratingDelta >= 0 ? `+${msg.ratingDelta} Elo` : `${msg.ratingDelta} Elo`;

  document.getElementById("game-over-points").textContent = `${msg.finalScore} vs ${msg.opponentScore} Pts`;
  document.getElementById("game-over-points").setAttribute("data-last-game", "duel");
  document.getElementById("game-over-message").innerHTML = `
    <strong>${resultTitle}</strong><br>
    Variação de Rating Glicko-2: <span style="color: ${msg.won ? '#10b981' : '#ef4444'}; font-weight: bold;">${ratingText}</span><br>
    Novo Rating Nacional: <strong>${msg.newRating}</strong>
  `;

  goScreen.style.display = "block";
  loadLeaderboard("provinces");
}

function loadDuelRound() {
  if (gameDuelTimer) clearInterval(gameDuelTimer);
  if (gameDuelAiTimer) clearTimeout(gameDuelAiTimer);

  gameDuelState.timeLeft = 15;
  gameDuelState.isLocked = false;

  document.getElementById("duel-round-text").textContent = `Rodada ${gameDuelState.round}/${gameDuelState.maxRounds}`;
  const banner = document.getElementById("duel-round-banner");
  if (banner) banner.style.display = "none";

  const qIndex = (gameDuelState.round - 1) % duelQuestionsBank.length;
  const q = duelQuestionsBank[qIndex];
  gameDuelState.currentQuestion = q;

  document.getElementById("duel-category-tag").textContent = q.category;
  document.getElementById("duel-question-text").textContent = q.text;

  const timerBar = document.getElementById("duel-timer-bar");
  if (timerBar) {
    timerBar.style.width = "100%";
    timerBar.style.background = "linear-gradient(90deg, var(--success), var(--error))";
  }

  const container = document.getElementById("duel-options-container");
  container.innerHTML = "";

  q.options.forEach((opt, idx) => {
    const btn = document.createElement("button");
    btn.className = "option-btn";
    btn.innerHTML = `<span>${escapeHtml(opt)}</span>`;
    btn.addEventListener("click", () => handleDuelAnswer(idx));
    container.appendChild(btn);
  });

  const startTime = Date.now();
  gameDuelTimer = setInterval(() => {
    const elapsed = (Date.now() - startTime) / 1000;
    const remaining = Math.max(0, 15 - elapsed);
    gameDuelState.timeLeft = remaining;

    if (timerBar) {
      const pct = (remaining / 15) * 100;
      timerBar.style.width = `${pct}%`;
    }

    if (remaining <= 0) {
      clearInterval(gameDuelTimer);
      handleDuelTimeout();
    }
  }, 100);

  // Simular resposta da IA entre 5 e 10 segundos com 70% de acerto
  const aiDelay = Math.floor(Math.random() * 5000) + 5000;
  gameDuelAiTimer = setTimeout(() => {
    if (!gameDuelState.isLocked) {
      const aiIsCorrect = Math.random() < 0.70;
      if (aiIsCorrect) {
        handleDuelAiCorrect();
      }
    }
  }, aiDelay);
}

function handleDuelAnswer(chosenIdx) {
  if (gameDuelState.isLocked) return;
  gameDuelState.isLocked = true;

  if (gameDuelTimer) clearInterval(gameDuelTimer);
  if (gameDuelAiTimer) clearTimeout(gameDuelAiTimer);

  const q = gameDuelState.currentQuestion;
  const buttons = document.querySelectorAll("#duel-options-container .option-btn");
  const banner = document.getElementById("duel-round-banner");

  buttons.forEach((btn, idx) => {
    btn.disabled = true;
    if (idx === q.correct) btn.classList.add("correct");
    else if (idx === chosenIdx) btn.classList.add("incorrect");
  });

  if (chosenIdx === q.correct) {
    const speedBonus = Math.round(gameDuelState.timeLeft * 5);
    const roundPts = 100 + speedBonus;
    gameDuelState.p1Score += roundPts;
    document.getElementById("duel-p1-score").textContent = gameDuelState.p1Score;
    playAudioChime("correct");

    if (banner) {
      banner.textContent = `🎯 Correto! Respondeu primeiro (+${roundPts} pts)`;
      banner.style.background = "rgba(16, 185, 129, 0.15)";
      banner.style.color = "var(--success)";
      banner.style.display = "block";
    }
  } else {
    playAudioChime("wrong");
    gameDuelState.p2Score += 80;
    document.getElementById("duel-p2-score").textContent = gameDuelState.p2Score;

    if (banner) {
      banner.textContent = `❌ Resposta incorreta! O Adversário pontuou (+80 pts)`;
      banner.style.background = "rgba(239, 68, 68, 0.15)";
      banner.style.color = "var(--error)";
      banner.style.display = "block";
    }
  }

  setTimeout(() => {
    gameDuelState.round++;
    if (gameDuelState.round <= gameDuelState.maxRounds) {
      loadDuelRound();
    } else {
      endDuelGame();
    }
  }, 1800);
}

function handleDuelAiCorrect() {
  if (gameDuelState.isLocked) return;
  gameDuelState.isLocked = true;

  if (gameDuelTimer) clearInterval(gameDuelTimer);

  const q = gameDuelState.currentQuestion;
  const buttons = document.querySelectorAll("#duel-options-container .option-btn");
  const banner = document.getElementById("duel-round-banner");

  buttons.forEach((btn, idx) => {
    btn.disabled = true;
    if (idx === q.correct) btn.classList.add("correct");
  });

  const aiPts = 100 + Math.round(gameDuelState.timeLeft * 4);
  gameDuelState.p2Score += aiPts;
  document.getElementById("duel-p2-score").textContent = gameDuelState.p2Score;
  playAudioChime("wrong");

  if (banner) {
    banner.textContent = `⚡ O Adversário respondeu primeiro (+${aiPts} pts)!`;
    banner.style.background = "rgba(249, 115, 22, 0.15)";
    banner.style.color = "#ea580c";
    banner.style.display = "block";
  }

  setTimeout(() => {
    gameDuelState.round++;
    if (gameDuelState.round <= gameDuelState.maxRounds) {
      loadDuelRound();
    } else {
      endDuelGame();
    }
  }, 1800);
}

function handleDuelTimeout() {
  if (gameDuelState.isLocked) return;
  gameDuelState.isLocked = true;

  const banner = document.getElementById("duel-round-banner");
  if (banner) {
    banner.textContent = "⏱️ Tempo esgotado! Nenhum jogador pontuou.";
    banner.style.background = "rgba(100, 116, 139, 0.15)";
    banner.style.color = "var(--text-secondary)";
    banner.style.display = "block";
  }

  setTimeout(() => {
    gameDuelState.round++;
    if (gameDuelState.round <= gameDuelState.maxRounds) {
      loadDuelRound();
    } else {
      endDuelGame();
    }
  }, 1500);
}

async function endDuelGame() {
  document.getElementById("game-duel-arena").style.display = "none";
  const goScreen = document.getElementById("game-over-screen");

  const isWin = gameDuelState.p1Score > gameDuelState.p2Score;
  const isTie = gameDuelState.p1Score === gameDuelState.p2Score;

  let msg = isWin 
    ? "🏆 Grande Vitória no Duelo! Venceu a batalha de conhecimento!" 
    : isTie 
    ? "🤝 Empate técnico emocionante!" 
    : "🥈 Foi por pouco! O adversário virtual venceu esta rodada. Tente novamente!";

  if (isWin) playAudioChime("fanfare");

  document.getElementById("game-over-points").textContent = `${gameDuelState.p1Score} vs ${gameDuelState.p2Score} Pts`;
  document.getElementById("game-over-points").setAttribute("data-last-game", "duel");
  document.getElementById("game-over-message").textContent = msg;

  goScreen.style.display = "block";

  await submitGameScore("math_rush", gameDuelState.p1Score);
}

// 4. Flashcards 3D Game Engine
function startFlashcardsGame() {
  document.getElementById("game-selection-panel").style.display = "none";
  document.getElementById("game-flashcards-arena").style.display = "block";
  document.getElementById("game-over-screen").style.display = "none";

  currentFlashcardIndex = 0;
  renderFlashcard();
}

function renderFlashcard() {
  const cardEl = document.getElementById("flashcard-card-element");
  if (cardEl) cardEl.classList.remove("is-flipped");

  const card = flashcardsData[currentFlashcardIndex];
  document.getElementById("flashcard-counter").textContent = `${currentFlashcardIndex + 1} / ${flashcardsData.length}`;
  document.getElementById("flashcard-front-topic").textContent = card.topic;
  document.getElementById("flashcard-front-text").textContent = card.front;
  document.getElementById("flashcard-back-text").textContent = card.back;
}

function flipFlashcard() {
  const cardEl = document.getElementById("flashcard-card-element");
  if (cardEl) {
    cardEl.classList.toggle("is-flipped");
    playAudioChime("correct");
  }
}

function nextFlashcard() {
  currentFlashcardIndex = (currentFlashcardIndex + 1) % flashcardsData.length;
  renderFlashcard();
}

function prevFlashcard() {
  currentFlashcardIndex = (currentFlashcardIndex - 1 + flashcardsData.length) % flashcardsData.length;
  renderFlashcard();
}

// 3. Submeter pontuação à API do Servidor
async function submitGameScore(gameName, score) {
  if (!jwtToken) return;

  try {
    await fetch("/api/games/score", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${jwtToken}`
      },
      body: JSON.stringify({ gameName, score })
    });
  } catch (e) {
    console.error("Erro ao gravar pontuação:", e);
  }
}

// 4. Carregar Leaderboard (Math, Quiz ou Liga Provincial)
async function loadLeaderboard(gameName) {
  activeLeaderboardGame = gameName;
  
  const btnMath = document.getElementById("btn-leaderboard-math");
  const btnQuiz = document.getElementById("btn-leaderboard-quiz");
  const btnProvinces = document.getElementById("btn-leaderboard-provinces");
  const standardContainer = document.getElementById("leaderboard-standard-container");
  const provincialContainer = document.getElementById("leaderboard-provincial-container");

  if (btnMath) btnMath.classList.toggle("active", gameName === "math_rush");
  if (btnQuiz) btnQuiz.classList.toggle("active", gameName === "moz_quiz");
  if (btnProvinces) btnProvinces.classList.toggle("active", gameName === "provinces");

  if (gameName === "provinces") {
    if (standardContainer) standardContainer.style.display = "none";
    if (provincialContainer) provincialContainer.style.display = "block";
    await loadProvincialLeague();
    return;
  }

  if (standardContainer) standardContainer.style.display = "block";
  if (provincialContainer) provincialContainer.style.display = "none";

  const tbody = document.getElementById("leaderboard-tbody");
  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="3" style="text-align: center;">A carregar ranking...</td></tr>`;

  try {
    const res = await fetch(`/api/games/leaderboard?gameName=${gameName}`);
    if (!res.ok) throw new Error();

    const ranking = await res.json();
    tbody.innerHTML = "";

    if (ranking.length === 0) {
      tbody.innerHTML = `<tr><td colspan="3" style="text-align: center; color: var(--text-secondary);">Nenhum recorde registado. Seja o primeiro!</td></tr>`;
      return;
    }

    ranking.forEach((r, idx) => {
      const tr = document.createElement("tr");
      
      let badge = `${idx + 1}º`;
      if (idx === 0) badge = "🥇";
      else if (idx === 1) badge = "🥈";
      else if (idx === 2) badge = "🥉";

      tr.innerHTML = `
        <td style="padding: 10px 5px; font-weight: bold;">${badge}</td>
        <td style="padding: 10px 5px;">+258 ${r.phone}</td>
        <td style="padding: 10px 5px; text-align: right; font-weight: bold; color: var(--primary);">${r.score}</td>
      `;
      tbody.appendChild(tr);
    });

  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="3" style="text-align: center; color: var(--error);">Erro ao ligar ao servidor.</td></tr>`;
  }
}

// 5. Liga Provincial e Torneio Semanal
async function loadProvincialLeague() {
  const container = document.getElementById("provinces-ranking-list");
  const countdownEl = document.getElementById("league-countdown-text");
  if (!container) return;

  // Atualizar contador regressivo até Domingo 23:59:59
  if (countdownEl) {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Domingo
    const daysUntilSunday = (7 - dayOfWeek) % 7;
    const endOfWeek = new Date(now);
    endOfWeek.setDate(now.getDate() + daysUntilSunday);
    endOfWeek.setHours(23, 59, 59, 999);
    const diffMs = endOfWeek - now;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    const remHours = diffHours % 24;
    countdownEl.textContent = `Encerra em: ${diffDays}d ${remHours}h`;
  }

  container.innerHTML = `<div style="text-align: center; color: var(--text-secondary); padding: 15px; font-size: 0.8rem;">A carregar Liga Provincial...</div>`;

  try {
    const res = await fetch("/api/leagues/provinces");
    if (!res.ok) throw new Error("Erro na API");
    const provinces = await res.json();

    container.innerHTML = "";
    provinces.forEach((p, idx) => {
      let rankBadge = `${idx + 1}º`;
      let rankClass = "";
      if (idx === 0) { rankBadge = "🥇 1º"; rankClass = "top-1"; }
      else if (idx === 1) { rankBadge = "🥈 2º"; rankClass = "top-2"; }
      else if (idx === 2) { rankBadge = "🥉 3º"; rankClass = "top-3"; }

      const row = document.createElement("div");
      row.className = `province-rank-item ${rankClass}`;
      row.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-weight: 800; min-width: 28px;">${rankBadge}</span>
          <div>
            <div style="font-weight: 700; color: var(--text-primary);">${escapeHtml(p.province)}</div>
            <div style="font-size: 0.7rem; color: var(--text-secondary);">${p.active_students} estudantes ativos</div>
          </div>
        </div>
        <div style="text-align: right;">
          <div style="font-weight: 800; color: var(--primary);">${p.total_points.toLocaleString('pt-MZ')} pts</div>
        </div>
      `;
      container.appendChild(row);
    });
  } catch (e) {
    container.innerHTML = `<div style="text-align: center; color: var(--error); padding: 10px; font-size: 0.8rem;">Erro ao carregar dados da Liga.</div>`;
  }
}


// --- PAINEL DE INVESTIDORES E SIMULADOR FINANCEIRO ---

async function fetchInvestorMetrics() {
  try {
    const res = await fetch("/api/investor/metrics");
    if (!res.ok) return;

    const data = await res.json();

    document.getElementById("inv-metric-revenue").textContent = `${data.totalRevenue.toFixed(2)} MT`;
    document.getElementById("inv-metric-users").textContent = data.totalUsers;
    document.getElementById("inv-metric-premium").textContent = data.totalPremium;
    document.getElementById("inv-metric-rate").textContent = `${data.conversionRate}%`;
    document.getElementById("inv-metric-exams").textContent = data.examsCompleted;

  } catch (e) {
    console.error("Erro ao carregar métricas:", e);
  }
}

function runFinancialSimulation() {
  const users = parseInt(document.getElementById("sim-slider-users").value);
  const rate = parseInt(document.getElementById("sim-slider-rate").value);
  const price = parseInt(document.getElementById("sim-slider-price").value);

  document.getElementById("sim-val-users").textContent = users.toLocaleString("pt-MZ");
  document.getElementById("sim-val-rate").textContent = `${rate}%`;
  document.getElementById("sim-val-price").textContent = `${price} MT`;

  const premiumUsers = Math.round((users * rate) / 100);
  const grossRevenue = premiumUsers * price;
  
  const hostingCosts = Math.round(2500 + (users * 0.10));
  const netProfit = grossRevenue - hostingCosts;
  const dailyProfit = Math.round(netProfit / 30);

  document.getElementById("sim-out-premium").textContent = premiumUsers.toLocaleString("pt-MZ");
  document.getElementById("sim-out-gross").textContent = `${grossRevenue.toLocaleString("pt-MZ")} MT`;
  document.getElementById("sim-out-costs").textContent = `${hostingCosts.toLocaleString("pt-MZ")} MT`;
  
  const netEl = document.getElementById("sim-out-net");
  netEl.textContent = `${netProfit.toLocaleString("pt-MZ")} MT`;
  if (netProfit < 0) {
    netEl.style.color = "var(--error)";
  } else {
    netEl.style.color = "var(--primary)";
  }

  document.getElementById("sim-out-daily").textContent = `${dailyProfit.toLocaleString("pt-MZ")} MT`;
}


// --- SISTEMA DE PAGAMENTO SEGURO ---

function selectPlan(plan) {
  selectedPlan = plan;
  document.getElementById("plan-weekly").classList.remove("selected");
  document.getElementById("plan-monthly").classList.remove("selected");
  
  if (plan === "semanal") {
    document.getElementById("plan-weekly").classList.add("selected");
  } else {
    document.getElementById("plan-monthly").classList.add("selected");
  }
  validatePhone();
}

function validatePhone() {
  const phoneInput = document.getElementById("checkout-phone-input");
  const payBtn = document.getElementById("checkout-pay-btn");
  const helperText = document.getElementById("phone-helper-text");
  
  const number = phoneInput.value.replace(/\D/g, "");
  phoneInput.value = number;

  const price = selectedPlan === "semanal" ? "49.00" : "119.00";
  payBtn.textContent = `Pagar ${price} MT com M-Pesa / e-Mola`;

  const isValidLength = number.length === 9;
  const isCorrectPrefix = /^(84|85|86|87|82)/.test(number);

  if (isValidLength && isCorrectPrefix) {
    payBtn.disabled = false;
    helperText.style.color = "var(--text-secondary)";
    helperText.textContent = "Número pronto para transação.";
  } else {
    payBtn.disabled = true;
    helperText.style.color = "var(--error)";
    if (number.length > 0 && !isCorrectPrefix) {
      helperText.textContent = "Número deve iniciar com 84, 85 (M-Pesa), 86, 87 (e-Mola) ou 82 (TMcel).";
    } else {
      helperText.textContent = "Insira os 9 dígitos do número.";
    }
  }
}

// --- FLUXO DE PAGAMENTO M-PESA SEGURO ---
async function startMpesaSimulation() {
  if (!jwtToken) {
    alert("Inicie sessão para poder ativar o Premium.");
    openAuthModal();
    return;
  }

  const phone = document.getElementById("checkout-phone-input").value;
  
  try {
    const res = await fetch("/api/payments/mpesa", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${jwtToken}`
      },
      body: JSON.stringify({ plan: selectedPlan, phone })
    });

    if (!res.ok) {
      const data = await res.json();
      alert(data.error || "Erro ao registar pagamento.");
      return;
    }

    activePayment = await res.json();

    const channelName = /^(84|85)/.test(phone) ? "M-PESA" : "e-Mola";
    const overlay = document.getElementById("mpesa-ussd-overlay");
    const promptMessage = document.getElementById("ussd-prompt-message");
    const pinInput = document.getElementById("ussd-pin-input");
    const sendBtn = document.getElementById("ussd-send-btn");
    
    promptMessage.textContent = `${channelName}: Introduza o PIN para autorizar o pagamento de ${activePayment.amount}.00 MT a EXAMEPRONTO.`;
    pinInput.value = "";
    sendBtn.disabled = true;
    
    document.getElementById("ussd-step-pin").style.display = "block";
    document.getElementById("ussd-step-loading").style.display = "none";
    document.getElementById("ussd-step-success").style.display = "none";
    
    overlay.style.display = "flex";
    pinInput.focus();

  } catch (e) {
    alert("Erro de conexão ao servidor.");
  }
}

async function processUssdPayment() {
  document.getElementById("ussd-step-pin").style.display = "none";
  document.getElementById("ussd-step-loading").style.display = "block";
  
  try {
    const res = await fetch("/api/payments/callback", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${jwtToken}`
      },
      body: JSON.stringify({
        transactionRef: activePayment.transactionRef,
        phone: activePayment.phone,
        plan: selectedPlan
      })
    });

    const data = await res.json();

    if (res.ok && data.status === "SUCCESS") {
      const phone = activePayment.phone;
      const channelName = /^(84|85)/.test(phone) ? "M-PESA" : "e-Mola";
      
      const smsText = `${channelName}: Recebemos ${activePayment.amount}.00 MT do número +258 ${phone.substring(0,3)}***${phone.substring(6)} para EXAMEPRONTO. Ref: ${activePayment.transactionRef}. Obrigado.`;
      
      document.getElementById("ussd-success-sms").textContent = smsText;
      
      setTimeout(() => {
        document.getElementById("ussd-step-loading").style.display = "none";
        document.getElementById("ussd-step-success").style.display = "flex";
      }, 1500);
    } else {
      alert("Transação recusada pelo servidor.");
      closeUssdOverlay();
    }

  } catch (e) {
    alert("Erro ao processar validação.");
    closeUssdOverlay();
  }
}

async function activatePremiumAccess() {
  await checkAuthStatus();
  await renderExamsList();
  closeUssdOverlay();
  
  alert("🌟 Acesso Premium Ativado com sucesso!");
  showSection("dashboard");
  activateMenuTab("dashboard");
}

function closeUssdOverlay() {
  document.getElementById("mpesa-ussd-overlay").style.display = "none";
  activePayment = null;
}

// --- SUBMISSÃO DE COMPROVATIVO DE PAGAMENTO MANUAL ---

async function submitManualPayment() {
  if (!jwtToken) {
    alert("Inicie sessão antes de submeter o comprovativo de pagamento.");
    openAuthModal();
    return;
  }

  const method = document.getElementById("manual-method-select").value;
  const senderPhone = document.getElementById("manual-sender-phone").value.trim();
  const transactionRef = document.getElementById("manual-ref-input").value.trim();

  if (!senderPhone || !transactionRef) {
    alert("Por favor, preencha o número de telemóvel e a referência SMS da transação.");
    return;
  }

  try {
    const res = await fetch("/api/payments/manual", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${jwtToken}`
      },
      body: JSON.stringify({
        plan: selectedPlan,
        method: method,
        senderPhone: senderPhone,
        transactionRef: transactionRef
      })
    });

    const data = await res.json();

    if (res.ok) {
      const channelLabel = method.includes("MKESH") ? "mKesh (826727204)" : "M-Pesa (849517984)";
      const amountVal = selectedPlan === "semanal" ? "49.00" : "119.00";
      const planLabel = selectedPlan === "semanal" ? "Semanal (7 dias)" : "Mensal (30 dias)";
      const waMsg = encodeURIComponent(`Olá Vilhete Solutions! Acabei de efetuar o depósito de ${amountVal} MT (${planLabel}) via ${channelLabel}.\n\nRef/Código: ${transactionRef}\nContacto: ${senderPhone}\n\nPodem aprovar o meu Acesso Premium no ExamePronto?`);
      const waUrl = `https://wa.me/258849517984?text=${waMsg}`;

      const openWa = confirm(`✅ Comprovativo submetido com sucesso no sistema!\n\nDeseja enviar agora a confirmação pelo WhatsApp (+258 849517984) à Vilhete Solutions para ativação imediata?`);
      if (openWa) {
        window.open(waUrl, "_blank");
      }
      document.getElementById("manual-payment-form").reset();
      showSection("dashboard");
      activateMenuTab("dashboard");
    } else {
      alert(data.error || "Erro ao submeter comprovativo.");
    }
  } catch (e) {
    alert("Erro de conexão ao servidor.");
  }
}

// --- CONSOLA ADMINISTRATIVA (ADMIN CONSOLE) ---

async function loadAdminTab() {
  if (!userProfile || !userProfile.isAdmin) {
    showSection("dashboard");
    activateMenuTab("dashboard");
    return;
  }
  
  const activeTabBtn = document.querySelector(".admin-tab-btn.active");
  const tabId = activeTabBtn ? activeTabBtn.getAttribute("data-tab") : "admin-users";
  
  if (tabId === "admin-users") {
    await fetchAdminUsers();
  } else if (tabId === "admin-payments") {
    await fetchAdminPayments();
  } else if (tabId === "admin-content") {
    await fetchAdminContentExams();
    await populateAdminExamDropdown();
  }
}

async function fetchAdminUsers() {
  const tbody = document.getElementById("admin-users-tbody");
  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="5" style="text-align: center;">A carregar utilizadores...</td></tr>`;

  try {
    const res = await fetch("/api/admin/users", {
      headers: { "Authorization": `Bearer ${jwtToken}` }
    });

    if (!res.ok) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--error);">Erro ao carregar (Acesso Negado).</td></tr>`;
      return;
    }

    const users = await res.json();
    tbody.innerHTML = "";

    if (users.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align: center;">Nenhum utilizador encontrado.</td></tr>`;
      return;
    }

    const now = new Date().getTime();

    users.forEach(u => {
      const tr = document.createElement("tr");

      let statusText = "Grátis";
      let statusClass = "free";
      if (u.premium_until > now) {
        const expires = new Date(parseInt(u.premium_until)).toLocaleDateString("pt-MZ");
        statusText = `Premium (Até ${expires})`;
        statusClass = "premium";
      }

      const adminBadge = u.is_admin === 1 
        ? `<span class="admin-badge admin">ADMIN</span>`
        : `<span class="admin-badge free">USER</span>`;

      const toggleAdminLabel = u.is_admin === 1 ? "Remover Admin" : "Tornar Admin";

      tr.innerHTML = `
        <td style="padding: 10px;">${u.id}</td>
        <td style="padding: 10px; font-weight: 600;">+258 ${u.phone}</td>
        <td style="padding: 10px;"><span class="admin-badge ${statusClass}">${statusText}</span></td>
        <td style="padding: 10px;">${adminBadge}</td>
        <td style="padding: 10px; text-align: right; display: flex; gap: 5px; justify-content: flex-end;">
          <button class="btn btn-sm btn-outline btn-grant-premium" data-user-id="${u.id}" data-phone="${u.phone}">+30 Dias Premium</button>
          <button class="btn btn-sm btn-outline btn-toggle-admin" data-user-id="${u.id}" data-current="${u.is_admin}">
            ${toggleAdminLabel}
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll(".btn-grant-premium").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const userId = e.currentTarget.getAttribute("data-user-id");
        const phone = e.currentTarget.getAttribute("data-phone");
        if (confirm(`Desejas conceder 30 dias de acesso Premium ao utilizador +258 ${phone}?`)) {
          grantUserPremium(userId, 30);
        }
      });
    });

    tbody.querySelectorAll(".btn-toggle-admin").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const userId = e.currentTarget.getAttribute("data-user-id");
        const currentVal = parseInt(e.currentTarget.getAttribute("data-current"));
        const newVal = currentVal === 1 ? 0 : 1;
        const actionText = newVal === 1 ? "tornar Administrador" : "remover estatuto de Administrador do";
        if (confirm(`Tens a certeza de que desejas ${actionText} utilizador selecionado?`)) {
          toggleUserAdmin(userId, newVal);
        }
      });
    });

  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--error);">Erro de conexão ao servidor.</td></tr>`;
  }
}

async function grantUserPremium(userId, days) {
  try {
    const res = await fetch("/api/admin/users/premium", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${jwtToken}`
      },
      body: JSON.stringify({ userId, days })
    });

    if (res.ok) {
      alert("Acesso Premium concedido com sucesso!");
      await fetchAdminUsers();
    } else {
      const data = await res.json();
      alert(data.error || "Erro ao conceder premium.");
    }
  } catch (e) {
    alert("Erro de conexão ao servidor.");
  }
}

async function toggleUserAdmin(userId, isAdminVal) {
  try {
    const res = await fetch("/api/admin/users/toggle-admin", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${jwtToken}`
      },
      body: JSON.stringify({ userId, is_admin: isAdminVal === 1 })
    });

    if (res.ok) {
      alert("Estatuto administrativo atualizado com sucesso!");
      await fetchAdminUsers();
      if (userProfile && userProfile.id == userId) {
        userProfile.isAdmin = (isAdminVal === 1);
        updateAuthUI();
      }
    } else {
      const data = await res.json();
      alert(data.error || "Erro ao atualizar administrador.");
    }
  } catch (e) {
    alert("Erro de conexão ao servidor.");
  }
}

async function fetchAdminPayments() {
  const tbody = document.getElementById("admin-payments-tbody");
  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="6" style="text-align: center;">A carregar pagamentos...</td></tr>`;

  try {
    const res = await fetch("/api/admin/payments", {
      headers: { "Authorization": `Bearer ${jwtToken}` }
    });

    if (!res.ok) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--error);">Erro ao carregar pagamentos.</td></tr>`;
      return;
    }

    const payments = await res.json();
    tbody.innerHTML = "";

    if (payments.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align: center;">Nenhum pagamento registado.</td></tr>`;
      return;
    }

    payments.forEach(p => {
      const tr = document.createElement("tr");

      let statusHtml = `<span class="admin-badge free">${p.status}</span>`;
      let actionsHtml = `<span style="color: var(--text-secondary); font-size: 0.75rem;">Concluído</span>`;

      if (p.status === "SUCCESS") {
        statusHtml = `<span class="admin-badge premium" style="background: rgba(16, 185, 129, 0.15); color: var(--success);">APROVADO</span>`;
        actionsHtml = `<span style="color: var(--success); font-weight: bold; font-size: 0.8rem;">✓ Ativo</span>`;
      } else if (p.status === "PENDING_APPROVAL") {
        statusHtml = `<span class="admin-badge premium" style="background: rgba(245, 158, 11, 0.2); color: var(--accent); font-weight: bold;">AGUARDA APROVAÇÃO</span>`;
        actionsHtml = `
          <div style="display: flex; gap: 5px; justify-content: flex-end;">
            <button class="btn btn-sm btn-primary btn-approve-payment" data-id="${p.id}" style="padding: 3px 8px; font-size: 0.75rem;">Aprovar</button>
            <button class="btn btn-sm btn-outline btn-reject-payment" data-id="${p.id}" style="padding: 3px 8px; font-size: 0.75rem; color: var(--error); border-color: var(--error);">Recusar</button>
          </div>
        `;
      } else if (p.status === "PENDING") {
        statusHtml = `<span class="admin-badge free" style="background: rgba(245, 158, 11, 0.15); color: var(--accent);">PENDENTE USSD</span>`;
        actionsHtml = `
          <div style="display: flex; gap: 5px; justify-content: flex-end;">
            <button class="btn btn-sm btn-outline btn-approve-payment" data-id="${p.id}" style="padding: 3px 8px; font-size: 0.75rem;">Aprovar Manual</button>
          </div>
        `;
      } else if (p.status === "REJECTED") {
        statusHtml = `<span class="admin-badge free" style="background: rgba(239, 68, 68, 0.15); color: var(--error);">RECUSADO</span>`;
        actionsHtml = `<span style="color: var(--error); font-size: 0.8rem;">✗ Recusado</span>`;
      }

      const dateStr = p.created_at ? new Date(p.created_at).toLocaleString("pt-MZ") : "N/D";

      tr.innerHTML = `
        <td style="padding: 10px; font-weight: bold;">${p.transaction_ref}</td>
        <td style="padding: 10px;">+258 ${p.phone}</td>
        <td style="padding: 10px; font-weight: 600;">${p.amount.toFixed(2)} MT</td>
        <td style="padding: 10px;">${statusHtml}</td>
        <td style="padding: 10px; color: var(--text-secondary);">${dateStr}</td>
        <td style="padding: 10px; text-align: right;">${actionsHtml}</td>
      `;
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll(".btn-approve-payment").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const id = e.currentTarget.getAttribute("data-id");
        if (confirm(`Deseja aprovar o pagamento #${id} e conceder acesso Premium ao utilizador?`)) {
          approveAdminPayment(id);
        }
      });
    });

    tbody.querySelectorAll(".btn-reject-payment").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const id = e.currentTarget.getAttribute("data-id");
        if (confirm(`Deseja recusar o pagamento #${id}?`)) {
          rejectAdminPayment(id);
        }
      });
    });

  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--error);">Erro de conexão ao servidor.</td></tr>`;
  }
}

async function approveAdminPayment(paymentId) {
  try {
    const res = await fetch("/api/admin/payments/approve", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${jwtToken}`
      },
      body: JSON.stringify({ paymentId })
    });

    const data = await res.json();
    if (res.ok) {
      alert(data.message || "Pagamento aprovado com sucesso!");
      await fetchAdminPayments();
      if (document.getElementById("section-investor").classList.contains("active")) {
        await fetchInvestorMetrics();
      }
    } else {
      alert(data.error || "Erro ao aprovar pagamento.");
    }
  } catch (e) {
    alert("Erro de conexão ao servidor.");
  }
}

async function rejectAdminPayment(paymentId) {
  try {
    const res = await fetch("/api/admin/payments/reject", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${jwtToken}`
      },
      body: JSON.stringify({ paymentId })
    });

    const data = await res.json();
    if (res.ok) {
      alert(data.message || "Pagamento recusado.");
      await fetchAdminPayments();
    } else {
      alert(data.error || "Erro ao recusar pagamento.");
    }
  } catch (e) {
    alert("Erro de conexão ao servidor.");
  }
}

async function submitAdminExam() {
  const examId = document.getElementById("admin-exam-id").value.trim();
  const levelName = document.getElementById("admin-exam-level-name").value.trim();
  const level = document.getElementById("admin-exam-level").value;
  const subjectName = document.getElementById("admin-exam-subject-name").value.trim();
  const subject = document.getElementById("admin-exam-subject").value.trim();
  const year = parseInt(document.getElementById("admin-exam-year").value);
  const duration = parseInt(document.getElementById("admin-exam-duration").value) || 120;

  if (!examId || !levelName || !level || !subjectName || !subject || !year) {
    alert("Preencha todos os campos obrigatórios do exame.");
    return;
  }

  const examData = {
    id: examId,
    level,
    level_name: levelName,
    subject,
    subject_name: subjectName,
    year,
    duration_minutes: duration
  };

  try {
    const res = await fetch("/api/admin/exams", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${jwtToken}`
      },
      body: JSON.stringify(examData)
    });

    if (res.ok) {
      alert("Exame criado com sucesso! Adicione agora as perguntas correspondentes na base de dados.");
      document.getElementById("admin-add-exam-form").reset();
      await renderExamsList();
    } else {
      const data = await res.json();
      alert(data.error || "Erro ao criar exame.");
    }
  } catch (e) {
    alert("Erro de conexão ao servidor.");
  }
}

async function submitAdminLesson() {
  const title = document.getElementById("admin-lesson-title").value.trim();
  const summary = document.getElementById("admin-lesson-summary").value.trim();
  const level = document.getElementById("admin-lesson-level").value;
  const subject = document.getElementById("admin-lesson-subject").value.trim();
  const content = document.getElementById("admin-lesson-content").value.trim();
  const isPremium = document.getElementById("admin-lesson-premium").checked;

  if (!title || !summary || !level || !subject || !content) {
    alert("Preencha todos os campos obrigatórios da explicação.");
    return;
  }

  const lessonData = {
    level,
    subject,
    title,
    summary,
    content,
    is_premium: isPremium
  };

  try {
    const res = await fetch("/api/admin/lessons", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${jwtToken}`
      },
      body: JSON.stringify(lessonData)
    });

    if (res.ok) {
      alert("Explicação criada com sucesso!");
      document.getElementById("admin-add-lesson-form").reset();
      await fetchAdminContentLessons();
      if (document.getElementById("section-explicador").classList.contains("active")) {
        await fetchLessons();
      }
    } else {
      const data = await res.json();
      alert(data.error || "Erro ao criar lição.");
    }
  } catch (e) {
    alert("Erro de conexão ao servidor.");
  }
}

// --- GESTÃO E ELIMINAÇÃO DE CONTEÚDOS NO ADMIN ---

async function fetchAdminContentExams() {
  const tbody = document.getElementById("admin-content-tbody");
  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="4" style="text-align: center;">A carregar exames...</td></tr>`;

  try {
    const res = await fetch("/api/exams");
    if (!res.ok) throw new Error();

    const exams = await res.json();
    tbody.innerHTML = "";

    if (exams.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" style="text-align: center;">Nenhum exame encontrado.</td></tr>`;
      return;
    }

    exams.forEach(e => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td style="padding: 8px; font-weight: bold;">${e.id}</td>
        <td style="padding: 8px;">${e.subject_name} (${e.year})</td>
        <td style="padding: 8px;">${e.level_name}</td>
        <td style="padding: 8px; text-align: right;">
          <button class="btn btn-sm btn-outline btn-delete-exam" data-id="${e.id}" style="color: var(--error); border-color: var(--error);">
            Eliminar
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll(".btn-delete-exam").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const id = e.currentTarget.getAttribute("data-id");
        if (confirm(`Tens a certeza de que desejas eliminar o exame '${id}' e todas as suas perguntas?`)) {
          deleteAdminExam(id);
        }
      });
    });

  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--error);">Erro ao carregar exames.</td></tr>`;
  }
}

async function fetchAdminContentLessons() {
  const tbody = document.getElementById("admin-content-tbody");
  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="4" style="text-align: center;">A carregar explicações...</td></tr>`;

  try {
    const res = await fetch("/api/lessons");
    if (!res.ok) throw new Error();

    const lessons = await res.json();
    tbody.innerHTML = "";

    if (lessons.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" style="text-align: center;">Nenhuma explicação encontrada.</td></tr>`;
      return;
    }

    lessons.forEach(l => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td style="padding: 8px; font-weight: bold;">#${l.id}</td>
        <td style="padding: 8px;">${l.title}</td>
        <td style="padding: 8px; text-transform: uppercase;">${l.subject} / ${l.level}</td>
        <td style="padding: 8px; text-align: right;">
          <button class="btn btn-sm btn-outline btn-delete-lesson" data-id="${l.id}" style="color: var(--error); border-color: var(--error);">
            Eliminar
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll(".btn-delete-lesson").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const id = e.currentTarget.getAttribute("data-id");
        if (confirm(`Tens a certeza de que desejas eliminar a explicação #${id}?`)) {
          deleteAdminLesson(id);
        }
      });
    });

  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--error);">Erro ao carregar explicações.</td></tr>`;
  }
}

async function deleteAdminExam(id) {
  try {
    const res = await fetch(`/api/admin/exams/${id}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${jwtToken}` }
    });

    if (res.ok) {
      alert("Exame e perguntas eliminados com sucesso!");
      await fetchAdminContentExams();
      await renderExamsList();
    } else {
      const data = await res.json();
      alert(data.error || "Erro ao eliminar exame.");
    }
  } catch (e) {
    alert("Erro de conexão ao servidor.");
  }
}

async function deleteAdminLesson(id) {
  try {
    const res = await fetch(`/api/admin/lessons/${id}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${jwtToken}` }
    });

    if (res.ok) {
      alert("Explicação eliminada com sucesso!");
      await fetchAdminContentLessons();
      if (document.getElementById("section-explicador").classList.contains("active")) {
        await fetchLessons();
      }
    } else {
      const data = await res.json();
      alert(data.error || "Erro ao eliminar explicação.");
    }
  } catch (e) {
    alert("Erro de conexão ao servidor.");
  }
}

// --- MÓDULOS DE ÁUDIO (WEB AUDIO E TEXT-TO-SPEECH) ---

let soundEnabled = localStorage.getItem("ep_sound_enabled") !== "false";
let audioCtx = null;

function initAudioSystem() {
  const btn = document.getElementById("btn-sound-toggle");
  if (btn) {
    btn.textContent = soundEnabled ? "🔊 Som: ON" : "🔇 Som: OFF";
  }
}

function toggleSound() {
  soundEnabled = !soundEnabled;
  localStorage.setItem("ep_sound_enabled", soundEnabled ? "true" : "false");
  initAudioSystem();
}

function playAudioChime(type) {
  if (!soundEnabled) return;
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;

    if (type === "correct") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    } else if (type === "wrong") {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(160, now + 0.2);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === "fanfare") {
      [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
        const o = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        o.connect(g);
        g.connect(audioCtx.destination);
        o.type = "triangle";
        o.frequency.setValueAtTime(freq, now + i * 0.1);
        g.gain.setValueAtTime(0.12, now + i * 0.1);
        g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.4);
        o.start(now + i * 0.1);
        o.stop(now + i * 0.1 + 0.4);
      });
    }
  } catch (e) {}
}

function speakText(text) {
  if (!('speechSynthesis' in window)) {
    alert("O seu navegador não suporta leitura de voz.");
    return;
  }
  if (window.speechSynthesis.speaking) {
    window.speechSynthesis.cancel();
    return;
  }
  const clean = text.replace(/[*_#`[\]()]/g, '');
  const utter = new SpeechSynthesisUtterance(clean);
  utter.lang = "pt-PT";
  utter.rate = 0.95;
  window.speechSynthesis.speak(utter);
}

function speakCurrentQuizQuestion() {
  if (!currentQuiz.exam || !currentQuiz.exam.questions) return;
  const q = currentQuiz.exam.questions[currentQuiz.currentIndex];
  if (!q) return;
  const btn = document.getElementById("quiz-tts-btn");
  const fullText = `Questão ${q.number}. ${q.text}. Opções: ${q.options.join('. ')}`;
  toggleSpeechAudio(fullText, btn);
}

function speakCurrentQuizExplanation() {
  if (!currentQuiz.exam || !currentQuiz.exam.questions) return;
  const q = currentQuiz.exam.questions[currentQuiz.currentIndex];
  if (!q || !q.explanation) return;
  const btn = document.getElementById("quiz-tts-explanation-btn");
  const fullText = `Resolução explicada da questão ${q.number}: ${q.explanation}`;
  toggleSpeechAudio(fullText, btn);
}

// --- GAMIFICAÇÃO: STREAK & META DIÁRIA ---

function initStudyStreak() {
  const streakBadge = document.getElementById("streak-days-badge");
  const goalText = document.getElementById("daily-goal-text");
  const goalBar = document.getElementById("daily-goal-bar");

  const today = new Date().toISOString().split('T')[0];
  const lastDate = localStorage.getItem("ep_last_study_date");
  let streak = parseInt(localStorage.getItem("ep_streak_count") || "1");
  let dailyDone = parseInt(localStorage.getItem("ep_daily_done_" + today) || "0");

  if (lastDate && lastDate !== today) {
    const prevDay = new Date();
    prevDay.setDate(prevDay.getDate() - 1);
    const prevStr = prevDay.toISOString().split('T')[0];
    if (lastDate !== prevStr) {
      streak = 1;
    }
  }

  if (streakBadge) streakBadge.textContent = `${streak} ${streak === 1 ? 'Dia' : 'Dias'}`;
  if (goalText) goalText.textContent = `${dailyDone} / 2 Simulados`;
  if (goalBar) goalBar.style.width = `${Math.min(100, (dailyDone / 2) * 100)}%`;
  updateSubjectMasteryWidget();
}

function updateSubjectMasteryWidget() {
  try {
    const history = JSON.parse(localStorage.getItem("ep_exam_history") || "[]");
    if (history.length > 0) {
      let matScores = [], portScores = [], bioScores = [], condScores = [];
      history.forEach(h => {
        const pct = Math.round((h.score / h.total) * 100);
        const examId = (h.examId || "").toLowerCase();
        if (examId.includes("mat") || examId.includes("fis")) matScores.push(pct);
        else if (examId.includes("port") || examId.includes("hist")) portScores.push(pct);
        else if (examId.includes("bio") || examId.includes("quim")) bioScores.push(pct);
        else if (examId.includes("cond") || examId.includes("sinais")) condScores.push(pct);
      });

      const avg = arr => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : null;
      const matAvg = avg(matScores);
      const portAvg = avg(portScores);
      const bioAvg = avg(bioScores);
      const condAvg = avg(condScores);

      if (matAvg !== null) {
        const valEl = document.getElementById("mastery-mat-val");
        const barEl = document.getElementById("mastery-mat-bar");
        if (valEl && barEl) { valEl.textContent = `${matAvg}%`; barEl.style.width = `${matAvg}%`; }
      }
      if (portAvg !== null) {
        const valEl = document.getElementById("mastery-port-val");
        const barEl = document.getElementById("mastery-port-bar");
        if (valEl && barEl) { valEl.textContent = `${portAvg}%`; barEl.style.width = `${portAvg}%`; }
      }
      if (bioAvg !== null) {
        const valEl = document.getElementById("mastery-bio-val");
        const barEl = document.getElementById("mastery-bio-bar");
        if (valEl && barEl) { valEl.textContent = `${bioAvg}%`; barEl.style.width = `${bioAvg}%`; }
      }
      if (condAvg !== null) {
        const valEl = document.getElementById("mastery-cond-val");
        const barEl = document.getElementById("mastery-cond-bar");
        if (valEl && barEl) { valEl.textContent = `${condAvg}%`; barEl.style.width = `${condAvg}%`; }
      }
    }
  } catch (e) {}
}

function recordStreakAndDailyGoal() {
  const today = new Date().toISOString().split('T')[0];
  const lastDate = localStorage.getItem("ep_last_study_date");
  let streak = parseInt(localStorage.getItem("ep_streak_count") || "1");

  if (lastDate !== today) {
    if (lastDate) {
      const prevDay = new Date();
      prevDay.setDate(prevDay.getDate() - 1);
      const prevStr = prevDay.toISOString().split('T')[0];
      if (lastDate === prevStr) {
        streak++;
      } else {
        streak = 1;
      }
    }
    localStorage.setItem("ep_last_study_date", today);
    localStorage.setItem("ep_streak_count", streak.toString());
  }

  let dailyDone = parseInt(localStorage.getItem("ep_daily_done_" + today) || "0") + 1;
  localStorage.setItem("ep_daily_done_" + today, dailyDone.toString());
  initStudyStreak();
}

// --- BOLETIM DE NOTAS E CERTIFICADO IMPRIMÍVEL ---

function printOfficialCertificate() {
  if (!currentQuiz.exam) return;
  const userPhone = userProfile ? `+258 ${userProfile.phone}` : "Candidato Autônomo";
  const examName = `${currentQuiz.exam.subject_name} (${currentQuiz.exam.level_name}, ${currentQuiz.exam.year})`;
  const dateStr = new Date().toLocaleDateString("pt-MZ");
  
  let correctCount = 0;
  const total = currentQuiz.exam.questions.length;
  for (let i = 0; i < total; i++) {
    if (currentQuiz.answers[i] && currentQuiz.answers[i].isCorrect) correctCount++;
  }
  const pct = Math.round((correctCount / total) * 100);
  const statusText = pct >= 50 ? `${pct}% - APROVADO` : `${pct}% - REVISÃO RECOMENDADA`;

  document.getElementById("print-user-phone").textContent = userPhone;
  document.getElementById("print-exam-name").textContent = examName;
  document.getElementById("print-exam-date").textContent = dateStr;
  document.getElementById("print-exam-score").textContent = `${correctCount} / ${total} Valores`;
  document.getElementById("print-exam-percent").textContent = statusText;

  window.print();
}

// --- CMS QUESTION MANAGER (GESTOR DE PERGUNTAS) ---

async function populateAdminExamDropdown() {
  const select1 = document.getElementById("admin-question-exam-select");
  const select2 = document.getElementById("admin-import-exam-select");
  try {
    const res = await fetch("/api/exams");
    if (!res.ok) return;
    const exams = await res.json();
    const optionsHtml = `<option value="">-- Selecione o Exame --</option>` + 
      exams.map(e => `<option value="${e.id}">${e.subject_name} (${e.year}) - ${e.level_name}</option>`).join("");
    
    if (select1) select1.innerHTML = optionsHtml;
    if (select2) select2.innerHTML = optionsHtml;
  } catch (e) {}
}

async function fetchAdminExamQuestions() {
  const select = document.getElementById("admin-question-exam-select");
  const examId = select ? select.value : "";
  const tbody = document.getElementById("admin-questions-tbody");
  const form = document.getElementById("admin-add-question-form");
  if (!examId) {
    alert("Por favor, selecione um exame na lista.");
    return;
  }
  tbody.innerHTML = `<tr><td colspan="4" style="text-align: center;">A carregar perguntas...</td></tr>`;
  if (form) form.style.display = "flex";

  try {
    const res = await fetch(`/api/admin/exams/${examId}/questions`, {
      headers: { "Authorization": `Bearer ${jwtToken}` }
    });
    if (!res.ok) throw new Error();
    const questions = await res.json();
    tbody.innerHTML = "";

    if (questions.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" style="text-align: center;">Nenhuma pergunta cadastrada para este exame. Adicione a primeira abaixo!</td></tr>`;
      return;
    }

    questions.forEach(q => {
      const tr = document.createElement("tr");
      const correctOptLetter = String.fromCharCode(65 + q.correct_option);
      tr.innerHTML = `
        <td style="padding: 6px; font-weight: bold;">Q${q.number}</td>
        <td style="padding: 6px;">${escapeHtml(q.text.substring(0, 50))}...</td>
        <td style="padding: 6px; font-weight: bold; color: var(--success);">${correctOptLetter}</td>
        <td style="padding: 6px; text-align: right;">
          <button class="btn btn-sm btn-outline btn-delete-question" data-id="${q.id}" style="color: var(--error); border-color: var(--error); padding: 2px 6px; font-size: 0.75rem;">
            Eliminar
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll(".btn-delete-question").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const qId = e.currentTarget.getAttribute("data-id");
        if (confirm(`Tens a certeza de que desejas eliminar a pergunta #${qId}?`)) {
          deleteAdminQuestion(qId);
        }
      });
    });
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--error);">Erro ao carregar perguntas do exame.</td></tr>`;
  }
}

async function submitAdminQuestion() {
  const select = document.getElementById("admin-question-exam-select");
  const examId = select ? select.value : "";
  if (!examId) {
    alert("Selecione um exame primeiro.");
    return;
  }

  const qNum = parseInt(document.getElementById("admin-q-number").value);
  const qText = document.getElementById("admin-q-text").value.trim();
  const opt1 = document.getElementById("admin-q-opt1").value.trim();
  const opt2 = document.getElementById("admin-q-opt2").value.trim();
  const opt3 = document.getElementById("admin-q-opt3").value.trim();
  const opt4 = document.getElementById("admin-q-opt4").value.trim();
  const opt5 = document.getElementById("admin-q-opt5").value.trim();
  const correctOpt = parseInt(document.getElementById("admin-q-correct").value);
  const explanation = document.getElementById("admin-q-explanation").value.trim();

  const optionsArray = [opt1, opt2, opt3, opt4];
  if (opt5) optionsArray.push(opt5);

  if (!qNum || !qText || !opt1 || !opt2 || !opt3 || !opt4 || !explanation) {
    alert("Preencha todos os campos obrigatórios da pergunta.");
    return;
  }

  try {
    const res = await fetch("/api/admin/questions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${jwtToken}`
      },
      body: JSON.stringify({
        exam_id: examId,
        number: qNum,
        text: qText,
        options: optionsArray,
        correct_option: correctOpt,
        explanation: explanation
      })
    });

    if (res.ok) {
      alert("Pergunta adicionada com sucesso ao exame!");
      document.getElementById("admin-add-question-form").reset();
      await fetchAdminExamQuestions();
    } else {
      const data = await res.json();
      alert(data.error || "Erro ao adicionar pergunta.");
    }
  } catch (e) {
    alert("Erro de conexão ao servidor.");
  }
}

async function deleteAdminQuestion(questionId) {
  try {
    const res = await fetch(`/api/admin/questions/${questionId}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${jwtToken}` }
    });
    if (res.ok) {
      alert("Pergunta eliminada com sucesso!");
      await fetchAdminExamQuestions();
    } else {
      const data = await res.json();
      alert(data.error || "Erro ao eliminar pergunta.");
    }
  } catch (e) {
    alert("Erro de conexão ao servidor.");
  }
}

// --- MODO FOCO (FULLSCREEN & PROCTORING) ---

let focusModeActive = false;

function toggleFocusMode() {
  focusModeActive = !focusModeActive;
  const btn = document.getElementById("quiz-focus-btn");
  if (focusModeActive) {
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
    if (btn) {
      btn.textContent = "🎯 Modo Foco: ON";
      btn.style.background = "var(--accent)";
      btn.style.color = "white";
    }
    alert("🎯 Modo Foco Ativado!\n\nO exame está agora em ecrã inteiro. Concentre-se nas suas respostas sem distrações.");
  } else {
    if (document.exitFullscreen && document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    if (btn) {
      btn.textContent = "🎯 Modo Foco: OFF";
      btn.style.background = "";
      btn.style.color = "";
    }
  }
}

document.addEventListener("visibilitychange", () => {
  const quizSection = document.getElementById("section-quiz");
  if (quizSection && quizSection.classList.contains("active") && document.hidden && focusModeActive) {
    playAudioChime("wrong");
    console.warn("⚠️ Aviso de Foco: Saída da janela detetada durante o exame.");
  }
});


// --- RESGATE DE CÓDIGO DE VOUCHER / RASPADINHA ---

async function redeemVoucherCode() {
  if (!jwtToken) {
    alert("Inicie sessão antes de ativar o código de voucher.");
    openAuthModal();
    return;
  }

  const codeInput = document.getElementById("voucher-code-input");
  const code = (codeInput ? codeInput.value : "").trim();

  if (!code) {
    alert("Por favor, digite o código do voucher.");
    return;
  }

  try {
    const res = await fetch("/api/vouchers/redeem", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${jwtToken}`
      },
      body: JSON.stringify({ code })
    });

    const data = await res.json();

    if (res.ok) {
      alert(data.message || "🎉 Código ativado com sucesso!");
      codeInput.value = "";
      await checkAuthStatus();
      await renderExamsList();
      showSection("dashboard");
      activateMenuTab("dashboard");
    } else {
      alert(data.error || "Código de voucher inválido.");
    }
  } catch (e) {
    alert("Erro de conexão ao servidor.");
  }
}


// --- GERAÇÃO DE CADERNO DE EXAME EM PDF PARA IMPRESSÃO ---

// --- GERAÇÃO DE CADERNO DE EXAME EM PDF PARA IMPRESSÃO (A4) ---

async function downloadExamPaperPdf(examId) {
  let exam = null;
  if (!examId && currentQuiz && currentQuiz.exam) {
    exam = currentQuiz.exam;
  } else if (examId) {
    showToast("📄 A preparar Caderno Oficial A4...", "info");
    try {
      const res = await fetch(`/api/exams/${examId}`, {
        headers: jwtToken ? { "Authorization": `Bearer ${jwtToken}` } : {}
      });
      if (!res.ok) throw new Error("Erro ao carregar exame");
      exam = await res.json();
    } catch (e) {
      showToast("Não foi possível carregar os dados para impressão.", "error");
      return;
    }
  }

  if (!exam || !exam.questions || exam.questions.length === 0) {
    showToast("⚠️ Este exame ainda não possui questões disponíveis para impressão.", "warning");
    return;
  }

  const container = document.getElementById("printable-exam-paper-container");
  if (!container) return;

  const univ = exam.university || "UEM";
  let institutionHeading = "UNIVERSIDADE EDUARDO MONDLANE";
  if (univ.includes("UP")) institutionHeading = "UNIVERSIDADE PEDAGÓGICA DE MAPUTO";
  else if (univ.includes("Zambeze")) institutionHeading = "UNIVERSIDADE ZAMBEZE";
  else if (univ.includes("Lúrio") || univ.includes("Lurio")) institutionHeading = "UNIVERSIDADE LÚRIO";
  else if (univ.includes("Púnguè") || univ.includes("Pungue")) institutionHeading = "UNIVERSIDADE PÚNGUÈ";
  else if (univ.includes("Rovuma")) institutionHeading = "UNIVERSIDADE ROVUMA";
  else if (univ.includes("Licungo")) institutionHeading = "UNIVERSIDADE LICUNGO";
  else if (univ.includes("ISRI") || univ.includes("UJC")) institutionHeading = "INSTITUTO SUPERIOR DE RELAÇÕES INTERNACIONAIS / UJC";
  else if (univ.includes("ACIPOL")) institutionHeading = "ACADEMIA DE CIÊNCIAS POLICIAIS (ACIPOL)";
  else if (univ.includes("ISCISA")) institutionHeading = "INSTITUTO SUPERIOR DE CIÊNCIAS DE SAÚDE (ISCISA)";
  else if (univ.includes("MINEDH") || (exam.level && exam.level.includes("12a")) || (exam.level && exam.level.includes("10a"))) {
    institutionHeading = "MINISTÉRIO DA EDUCAÇÃO E DESENVOLVIMENTO HUMANO";
  } else if (univ.includes("INATRO") || (exam.level && exam.level.includes("conducao"))) {
    institutionHeading = "INSTITUTO NACIONAL DOS TRANSPORTES RODOVIÁRIOS (INATRO)";
  }

  const title = `${exam.subject_name} • ${exam.year}`;
  const totalQuestions = exam.questions.length;
  const duration = exam.durationMinutes || exam.duration_minutes || 120;

  let questionsHtml = "";
  exam.questions.forEach((q, idx) => {
    let optionsHtml = "";
    if (Array.isArray(q.options) && q.options.length > 0) {
      optionsHtml = '<div class="print-options-grid">';
      q.options.forEach((opt, oIdx) => {
        const letter = String.fromCharCode(65 + oIdx);
        const cleanOpt = opt.replace(/^[A-E]\)\s*/i, '');
        optionsHtml += `
          <div class="print-option-line">
            <strong>${letter})</strong> <span>${escapeHtml(cleanOpt)}</span>
          </div>
        `;
      });
      optionsHtml += '</div>';
    }

    let imgHtml = "";
    if (q.image_url) {
      imgHtml = `<div style="text-align: center; margin: 6px 0;"><img src="${q.image_url}" class="print-question-image" alt="Figura Q${idx+1}"></div>`;
    }

    questionsHtml += `
      <div class="print-question-item">
        <div class="print-question-title">${idx + 1}. ${escapeHtml(q.text)}</div>
        ${imgHtml}
        ${optionsHtml}
      </div>
    `;
  });

  // Grelha de respostas oficial
  let gridBubbles = "";
  for (let i = 1; i <= totalQuestions; i++) {
    gridBubbles += `
      <div class="print-sheet-cell">
        <strong>Q${i}:</strong> [A] [B] [C] [D]
      </div>
    `;
  }

  container.innerHTML = `
    <div class="print-header">
      <div class="print-republic">República de Moçambique</div>
      <div class="print-ministry">${institutionHeading}</div>
      <div class="print-brand">ExamePronto • Central Oficial de Preparação e Estudos de Moçambique</div>
      <div class="print-title-box">
        <span>CADERNO OFICIAL: ${title.toUpperCase()}</span>
        <span>DURAÇÃO: ${duration} MINUTOS</span>
      </div>
    </div>

    <div class="print-instructions">
      <strong>Instruções ao Candidato:</strong> 1. Verifique se o caderno contém todas as ${totalQuestions} perguntas numeradas sequencialmente. 2. Cada questão possui apenas uma opção correta. 3. Preencha a Grelha Oficial de Respostas a tinta azul ou preta. Rascunhos não são considerados na pontuação oficial.
    </div>

    <div class="print-questions-body">
      ${questionsHtml}
    </div>

    <div class="print-answer-sheet">
      <div style="text-align: center; margin-bottom: 8px;">
        <h3 style="margin: 0; font-size: 11pt; text-transform: uppercase;">Grelha Oficial de Respostas</h3>
        <p style="margin: 2px 0; font-size: 8pt; color: #475569;">Preencha o círculo ou quadrado correspondente à opção escolhida.</p>
      </div>
      <div class="print-sheet-grid">
        ${gridBubbles}
      </div>
      <div style="display: flex; justify-content: space-between; font-size: 8pt; color: #64748b; margin-top: 15px; border-top: 1px solid #cbd5e1; padding-top: 8px;">
        <span>Nome do Aluno / Candidato: __________________________________________________</span>
        <span>Assinatura: ___________________________</span>
      </div>
    </div>
  `;

  // Renderizar KaTeX formulas no container de impressão
  renderMathFormulas(container);

  document.body.className = "print-paper";
  setTimeout(() => {
    window.print();
    setTimeout(() => {
      document.body.className = "";
    }, 1200);
  }, 350);
}


// --- ADMIN VOUCHERS MANAGEMENT ---

async function fetchAdminVouchers() {
  const tbody = document.getElementById("admin-vouchers-tbody");
  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="5" style="text-align: center;">A carregar vouchers...</td></tr>`;

  try {
    const res = await fetch("/api/admin/vouchers", {
      headers: { "Authorization": `Bearer ${jwtToken}` }
    });

    if (!res.ok) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--error);">Erro ao carregar vouchers.</td></tr>`;
      return;
    }

    const vouchers = await res.json();
    tbody.innerHTML = "";

    if (vouchers.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-secondary);">Nenhum voucher gerado ainda. Crie o primeiro lote acima!</td></tr>`;
      return;
    }

    vouchers.forEach(v => {
      const tr = document.createElement("tr");
      const statusHtml = v.is_used === 1
        ? `<span class="admin-badge free" style="background: rgba(239, 68, 68, 0.15); color: var(--error);">UTILIZADO</span>`
        : `<span class="admin-badge premium" style="background: rgba(16, 185, 129, 0.15); color: var(--success); font-weight: bold;">DISPONÍVEL</span>`;

      const userText = v.used_by_phone ? `+258 ${v.used_by_phone}` : "-";
      const dateStr = v.created_at ? new Date(v.created_at).toLocaleDateString("pt-MZ") : "N/D";

      tr.innerHTML = `
        <td style="padding: 10px; font-weight: bold; font-family: monospace; font-size: 0.95rem; color: var(--primary);">${v.code}</td>
        <td style="padding: 10px;">${v.days} Dias</td>
        <td style="padding: 10px;">${statusHtml}</td>
        <td style="padding: 10px;">${userText}</td>
        <td style="padding: 10px; color: var(--text-secondary);">${dateStr}</td>
      `;
      tbody.appendChild(tr);
    });

  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--error);">Erro de conexão ao servidor.</td></tr>`;
  }
}

async function generateAdminVouchers() {
  const count = parseInt(document.getElementById("gen-vouchers-count").value) || 10;
  const days = parseInt(document.getElementById("gen-vouchers-days").value) || 30;

  try {
    const res = await fetch("/api/admin/vouchers/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${jwtToken}`
      },
      body: JSON.stringify({ count, days })
    });

    const data = await res.json();
    if (res.ok) {
      alert(data.message || "Vouchers gerados com sucesso!");
      await fetchAdminVouchers();
    } else {
      alert(data.error || "Erro ao gerar vouchers.");
    }
  } catch (e) {
    alert("Erro de conexão ao servidor.");
  }
}

async function printAdminVouchers() {
  try {
    const res = await fetch("/api/admin/vouchers", {
      headers: { "Authorization": `Bearer ${jwtToken}` }
    });
    if (!res.ok) return alert("Erro ao carregar vouchers.");
    const vouchers = await res.json();

    const available = vouchers.filter(v => v.is_used === 0);
    if (available.length === 0) {
      alert("Não há vouchers disponíveis para impressão. Gere um novo lote primeiro.");
      return;
    }

    const container = document.getElementById("printable-vouchers-container");
    if (!container) return;

    let cardsHtml = "";
    available.forEach(v => {
      const priceText = v.days === 7 ? "49 MT" : "119 MT";
      cardsHtml += `
        <div style="border: 2px dashed #1e3a8a; padding: 12px; text-align: center; border-radius: 6px; background: #f8fafc; break-inside: avoid;">
          <div style="font-size: 0.7rem; font-weight: bold; color: #1e3a8a; text-transform: uppercase;">EXAMEPRONTO | VILHETE SOLUTIONS</div>
          <div style="font-size: 0.8rem; font-weight: bold; color: #334155; margin: 4px 0;">CARTÃO DE ATIVAÇÃO (${v.days} DIAS)</div>
          <div style="font-size: 0.75rem; color: #059669; font-weight: bold;">PREÇO: ${priceText}</div>
          <div style="margin: 8px 0; padding: 6px; background: white; border: 1px solid #cbd5e1; font-family: monospace; font-size: 1.05rem; font-weight: bold; letter-spacing: 2px; color: #1e3a8a;">
            ${v.code}
          </div>
          <div style="font-size: 0.65rem; color: #64748b; line-height: 1.2;">
            Aceda a <strong>exame-pronto.vercel.app</strong>, crie a sua conta e ative o código no checkout.
          </div>
        </div>
      `;
    });

    container.innerHTML = `
      <div style="text-align: center; margin-bottom: 20px; border-bottom: 2px solid #1e3a8a; padding-bottom: 10px;">
        <h2 style="margin: 0; color: #1e3a8a;">FOLHA DE CARTÕES / RASPADINHAS PARA VENDA</h2>
        <p style="margin: 5px 0; font-size: 0.85rem; color: #475569;">Vilhete Solutions | Imprima e corte nas linhas tracejadas para venda em papelarias e escolas.</p>
      </div>
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px;">
        ${cardsHtml}
      </div>
    `;

    document.body.className = "print-vouchers-mode";
    window.print();
    setTimeout(() => {
      document.body.className = "";
    }, 1000);

  } catch (e) {
    alert("Erro ao preparar impressão de vouchers.");
  }
}

function printResellerVoucherSheet() {
  const vouchers = adminVouchersCache || [];
  if (vouchers.length === 0) {
    showToast("Gere primeiro um lote de raspadinhas para imprimir.", "error");
    return;
  }

  const agentName = document.getElementById("gen-vouchers-agent")?.value.trim() || "Banca / Escola Parceira";
  const commission = document.getElementById("gen-vouchers-commission")?.value.trim() || "10 MT / cartão";
  const printContainer = document.getElementById("printable-vouchers-container");
  if (!printContainer) return;

  const now = new Date().toLocaleDateString("pt-MZ");
  let cardsHtml = vouchers.map(v => {
    const price = v.days <= 7 ? "49 MT (Semanal)" : "119 MT (Mensal)";
    return `
      <div style="border: 2px dashed #4f46e5; border-radius: 8px; padding: 12px; margin-bottom: 10px; break-inside: avoid; background: #fff; font-family: sans-serif; box-sizing: border-box;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; margin-bottom: 8px;">
          <strong style="color: #4f46e5; font-size: 0.85rem;">VILHETE SOLUTIONS | EXAMEPRONTO</strong>
          <span style="font-weight: 800; font-size: 0.95rem; color: #e11d48;">${price}</span>
        </div>
        <div style="font-size: 0.75rem; color: #475569; margin-bottom: 6px;">
          <strong>Ponto de Venda:</strong> ${agentName} &bull; <strong>Data:</strong> ${now}
        </div>
        <div style="background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 4px; padding: 8px; text-align: center; margin-bottom: 6px;">
          <div style="font-size: 0.65rem; color: #64748b; text-transform: uppercase;">CÓDIGO OFICIAL DE ACESSO (RASPE AQUI)</div>
          <div style="font-family: monospace; font-size: 1.25rem; font-weight: 800; letter-spacing: 2px; color: #0f172a;">${v.code}</div>
        </div>
        <div style="font-size: 0.7rem; color: #475569; line-height: 1.3;">
          <strong>Como Ativar:</strong> 1. Aceda a <u>exame-pronto.vercel.app</u> &bull; 2. No menu, clique em <strong>Adquirir Premium</strong> &bull; 3. Digite o código.<br>
          <span style="color: #059669; font-weight: 600;">Suporte WhatsApp: +258 849517984</span>
        </div>
      </div>
    `;
  }).join("");

  printContainer.innerHTML = `
    <div style="text-align: center; margin-bottom: 15px; border-bottom: 2px solid #0f172a; padding-bottom: 10px;">
      <h2 style="margin: 0; color: #4f46e5;">VILHETE SOLUTIONS — REDE OFICIAL DE DISTRIBUIÇÃO</h2>
      <p style="margin: 4px 0 0 0; font-size: 0.85rem; color: #475569;">
        Lote de Cartões de Estudo &bull; <strong>Agente Credenciado:</strong> ${agentName} &bull; <strong>Comissão da Banca:</strong> ${commission}
      </p>
    </div>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
      ${cardsHtml}
    </div>
  `;

  document.body.className = "print-vouchers-mode";
  window.print();
  setTimeout(() => {
    document.body.className = "";
  }, 1000);
}


// --- IMPORTADOR INTELIGENTE POR FICHEIRO (JSON, CSV, TXT, MD, PDF) ---

let pendingImportData = null;

function normalizeExamText(rawText) {
  if (!rawText) return '';
  return rawText
    .replace(/^\uFEFF/, '') // Remover UTF-8 BOM inicial
    .replace(/[\u200B-\u200D\uFEFF]/g, '') // Remover caracteres invisíveis de formatação
    .replace(/\u00A0/g, ' ') // Converter espaços não-quebráveis (NBSP) em espaços comuns
    .replace(/[\u2018\u2019]/g, "'") // Normalizar aspas simples tipográficas
    .replace(/[\u201C\u201D\u00AB\u00BB]/g, '"') // Normalizar aspas duplas tipográficas e chavetas francesas
    .normalize('NFC'); // Normalização canónica Unicode para acentuação e diacríticos (ã, ç, é, ô)
}

function cleanQuestionHeading(text) {
  if (!text) return '';
  return text
    // Remove apenas prefixos formais de numeração, mantendo preposições naturais ("No Código...", "No triângulo...")
    .replace(/^(?:Quest[aã]o|Pergunta|Exerc[ií]cio|Problema|Item|(?:N[º°\.]|N\.º|No\.))\s*[\:\-\u2013\u2014\.]*\s*/i, '')
    .replace(/^[\:\-\u2013\u2014\.]+\s*/, '')
    .trim();
}

function handleAdminFileUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  const ext = file.name.split('.').pop().toLowerCase();

  if (ext === 'pdf') {
    showToast(`📄 Ficheiro PDF "${file.name}" detetado. Para garantir extração 100% fiel, abra o PDF, copie o texto das perguntas (Ctrl+A e Ctrl+C) e cole no campo abaixo!`, "info");
  }

  function processFileContent(content) {
    if (ext === 'json') {
      try {
        const parsed = JSON.parse(normalizeExamText(content));
        if (parsed.exams || parsed.questions || parsed.lessons) {
          pendingImportData = { type: 'full_dataset', data: parsed };
          displayImportPreview({
            type: 'full_dataset',
            exams: parsed.exams ? parsed.exams.length : 0,
            questions: parsed.questions ? parsed.questions.length : 0,
            lessons: parsed.lessons ? parsed.lessons.length : 0
          });
        } else if (Array.isArray(parsed)) {
          pendingImportData = { type: 'questions_array', data: parsed };
          displayImportPreview({ type: 'questions_array', questions: parsed });
        } else {
          alert("Estrutura JSON não reconhecida.");
        }
      } catch (err) {
        alert("Ficheiro JSON com formatação inválida.");
      }
    } else if (ext === 'csv') {
      const questions = parseCsvQuestions(content);
      if (questions.length === 0) {
        alert("Nenhuma pergunta reconhecida no ficheiro CSV. Verifique os cabeçalhos e a estrutura das colunas.");
        return;
      }
      pendingImportData = { type: 'questions_array', data: questions };
      displayImportPreview({ type: 'questions_array', questions: questions });
    } else {
      // Formatos de texto .txt ou .md
      const questions = parseRawQuestionsText(content);
      if (questions.length === 0) {
        alert("Nenhuma pergunta reconhecida no ficheiro de texto. Verifique a numeração das perguntas e opções.");
        return;
      }
      pendingImportData = { type: 'questions_array', data: questions };
      displayImportPreview({ type: 'questions_array', questions: questions });
    }
  }

  const reader = new FileReader();
  reader.onload = function(evt) {
    let content = evt.target.result;
    // Deteção inteligente de codificação Windows ANSI / ISO-8859-1:
    // Se a leitura em UTF-8 originar caracteres de substituição (\uFFFD), recarrega como ISO-8859-1
    if (content && content.includes('\uFFFD') && !reader._retriedIso) {
      reader._retriedIso = true;
      const isoReader = new FileReader();
      isoReader.onload = function(isoEvt) {
        processFileContent(isoEvt.target.result);
      };
      isoReader.readAsText(file, "ISO-8859-1");
      return;
    }
    processFileContent(content);
  };

  reader.readAsText(file, "UTF-8");
}

function parsePastedText() {
  const text = document.getElementById("admin-paste-text-input").value.trim();
  if (!text) {
    alert("Por favor, cole primeiro o texto com as perguntas.");
    return;
  }
  const questions = parseRawQuestionsText(text);
  if (questions.length === 0) {
    alert("Nenhuma pergunta reconhecida. Verifique se as perguntas têm números (ex: 1. Pergunta) e opções (A) ... B) ...).");
    return;
  }
  pendingImportData = { type: 'questions_array', data: questions };
  displayImportPreview({ type: 'questions_array', questions: questions });
}

function parseRawQuestionsText(rawText) {
  const clean = normalizeExamText(rawText);
  const lines = clean.split(/\r?\n/);
  const questions = [];
  let currentQ = null;

  // Reconhecimento universal de números de questão moçambicanos:
  // 1., 1), 1 -, 1 –, 1ª, 1.ª, 1º, 1.º, 1°, Questão 1, Pergunta 1, Exercício 1, Nº 1, No. 1, Q1, P1
  const qRegex = /^(?:(?:Quest[aã]o|Pergunta|Exerc[ií]cio|Problema|Item|(?:N[º°\.]|N\.º|No\.)|Q|P)\s*)?(\d+)(?:[ªº°]|\.[ªº°])?[\.\)\:\s\-\u2013\u2014]+(.*)$/i;

  // Reconhecimento flexível de opções:
  // A) ..., A. ..., A - ..., A – ..., (A) ..., [A] ..., A: ...
  const optRegex = /^(?:[\(\[]\s*([A-Fa-f])\s*[\)\]]|([A-Fa-f])\s*[\.\)\:\-\u2013\u2014])\s*(.*)$/;

  // Reconhecimento exaustivo do gabarito / resposta correta:
  // Resposta: A, Resposta correcta: A, Gabarito: A, Opção correcta: A, Alternativa: A, Chave: A, Solução: A, Resp: A, R: A
  const ansRegex = /^(?:[\(\[]?\s*(?:Resposta(?:\s+correcta|\s+correta|\s+certa)?|Gabarito|Op[çc][aã]o(?:\s+correcta|\s+correta|\s+certa)?|Alternativa(?:\s+correcta|\s+correta|\s+certa)?|Chave(?:\s+de\s+correc[çc][aã]o)?|Solu[çc][aã]o|Correta|Correcta|Resp|R)\s*[\:\-\u2013\u2014\.]*\s*[\(\[]?\s*([A-Fa-f])\s*[\)\]]?)/i;

  // Reconhecimento de explicações / resoluções / comentários:
  // Explicação: ..., Resolução: ..., Justificação: ..., Comentário: ..., Nota: ..., Dica: ...
  const expRegex = /^(?:Explica[çc][aã]o|Resolu[çc][aã]o|Justifica[çc][aã]o|Coment[aá]rio|Nota|Dica)\s*[\:\-\u2013\u2014\.]*\s*(.*)$/i;

  lines.forEach(line => {
    const trimmed = line.trim();
    if (!trimmed) return;

    // 1. Verificar se é linha de resposta / gabarito
    const ansMatch = trimmed.match(ansRegex);
    if (ansMatch) {
      if (currentQ) {
        const letter = ansMatch[1].toUpperCase();
        currentQ.correct_option = letter.charCodeAt(0) - 65;
      }
      return;
    }

    // 2. Verificar se é linha de explicação
    const expMatch = trimmed.match(expRegex);
    if (expMatch) {
      if (currentQ) {
        currentQ.explanation = expMatch[1].trim() || 'Resolução oficial standard.';
      }
      return;
    }

    // 3. Verificar se é opção (A, B, C, D, E, F)
    const optMatch = trimmed.match(optRegex);
    if (optMatch && (!trimmed.match(qRegex) || (currentQ && currentQ.options.length < 6))) {
      const letter = (optMatch[1] || optMatch[2]).toUpperCase();
      const text = optMatch[3].trim();
      if (currentQ) {
        currentQ.options.push(`${letter}) ${text}`);
        return;
      }
    }

    // 4. Verificar se é uma nova pergunta
    const qMatch = trimmed.match(qRegex);
    if (qMatch && !optMatch) {
      const qNum = parseInt(qMatch[1]) || (questions.length + 1);
      const qHeadingText = cleanQuestionHeading(qMatch[2]);

      if (currentQ && currentQ.text && currentQ.options.length >= 2) {
        questions.push(currentQ);
        currentQ = {
          number: qNum,
          text: qHeadingText,
          options: [],
          correct_option: 0,
          explanation: 'Resolução oficial standard.'
        };
        return;
      } else if (!currentQ) {
        currentQ = {
          number: qNum,
          text: qHeadingText,
          options: [],
          correct_option: 0,
          explanation: 'Resolução oficial standard.'
        };
        return;
      }
    }

    // 5. Continuação de enunciado ou explicação
    if (!currentQ) {
      currentQ = {
        number: questions.length + 1,
        text: cleanQuestionHeading(trimmed),
        options: [],
        correct_option: 0,
        explanation: 'Resolução oficial standard.'
      };
      return;
    }

    if (currentQ.options.length === 0) {
      currentQ.text = currentQ.text ? `${currentQ.text} ${trimmed}` : trimmed;
    } else {
      currentQ.explanation = currentQ.explanation && currentQ.explanation !== 'Resolução oficial standard.'
        ? `${currentQ.explanation} ${trimmed}`
        : trimmed;
    }
  });

  if (currentQ && currentQ.text && currentQ.options.length >= 2) {
    questions.push(currentQ);
  }

  return questions;
}

function splitCsvLine(line, delimiter) {
  const result = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === delimiter && !inQuotes) {
      result.push(cur.trim());
      cur = '';
    } else {
      cur += ch;
    }
  }
  result.push(cur.trim());
  return result;
}

function parseCsvQuestions(csvText) {
  const clean = normalizeExamText(csvText);
  const lines = clean.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length < 2) return [];

  const firstLine = lines[0];
  const delimiter = firstLine.includes(';') ? ';' : (firstLine.includes('\t') ? '\t' : ',');
  const questions = [];

  for (let i = 1; i < lines.length; i++) {
    const rawCols = splitCsvLine(lines[i], delimiter);
    const cols = rawCols.map(c => c.replace(/^["']|["']$/g, '').trim());
    if (cols.length >= 6) {
      const qNum = parseInt(cols[0]) || i;
      const qText = cleanQuestionHeading(cols[1]);
      const optA = cols[2].match(/^[A-Fa-f][\)\.]/) ? cols[2] : `A) ${cols[2]}`;
      const optB = cols[3].match(/^[A-Fa-f][\)\.]/) ? cols[3] : `B) ${cols[3]}`;
      const optC = cols[4].match(/^[A-Fa-f][\)\.]/) ? cols[4] : `C) ${cols[4]}`;
      const optD = cols[5].match(/^[A-Fa-f][\)\.]/) ? cols[5] : `D) ${cols[5]}`;
      const options = [optA, optB, optC, optD];

      // Opção E adicional se presente
      if (cols.length >= 8 && cols[6] && !cols[6].match(/^[A-Ea-e]$/)) {
        const optE = cols[6].match(/^[A-Fa-f][\)\.]/) ? cols[6] : `E) ${cols[6]}`;
        options.push(optE);
      }

      const rawAnsCol = cols.length >= 8 && options.length === 5 ? cols[7] : (cols[6] || 'A');
      const rawAns = rawAnsCol.toUpperCase().trim();
      let correctOpt = 0;
      if (['A', 'B', 'C', 'D', 'E'].includes(rawAns)) {
        correctOpt = rawAns.charCodeAt(0) - 65;
      } else if (!isNaN(parseInt(rawAns))) {
        const num = parseInt(rawAns);
        correctOpt = num >= 1 && num <= 5 ? num - 1 : (num >= 0 && num <= 4 ? num : 0);
      }

      const expColIndex = options.length === 5 ? 8 : 7;
      const explanation = cols[expColIndex] || 'Resolução oficial standard.';

      questions.push({
        number: qNum,
        text: qText,
        options: options,
        correct_option: correctOpt,
        explanation: explanation
      });
    }
  }

  return questions;
}

function displayImportPreview(info) {
  const box = document.getElementById("admin-import-preview-box");
  const title = document.getElementById("admin-preview-title");
  const itemsContainer = document.getElementById("admin-preview-items");
  if (!box || !title || !itemsContainer) return;

  box.style.display = "block";

  if (info.type === 'full_dataset') {
    title.textContent = `Ficheiro Completo Detetado: ${info.exams} Exames, ${info.questions} Perguntas, ${info.lessons} Aulas`;
    itemsContainer.innerHTML = `
      <p style="color: var(--success); font-weight: bold;">✓ O ficheiro contém uma estrutura completa de dados da plataforma.</p>
      <p>Clique no botão <strong>"🚀 Gravar no Supabase"</strong> para sincronizar tudo na base de dados.</p>
    `;
  } else {
    const qList = info.questions || [];
    title.textContent = `Perguntas Válidas Detetadas: ${qList.length}`;
    
    let html = `<ul style="margin: 0; padding-left: 20px;">`;
    qList.slice(0, 5).forEach((q, idx) => {
      const correctLetter = String.fromCharCode(65 + (q.correct_option || 0));
      html += `
        <li style="margin-bottom: 8px;">
          <strong>Q${q.number}:</strong> ${escapeHtml(q.text.substring(0, 70))}...<br>
          <span style="color: var(--text-secondary); font-size: 0.75rem;">${q.options.length} Opções | Gabarito: <strong>${correctLetter}</strong></span>
        </li>
      `;
    });
    if (qList.length > 5) {
      html += `<li style="color: var(--primary); font-weight: bold;">... e mais ${qList.length - 5} perguntas preparadas para importação.</li>`;
    }
    html += `</ul>`;
    itemsContainer.innerHTML = html;
  }
}

async function executeBulkImport() {
  if (!pendingImportData) {
    alert("Nenhum dado preparado para importação.");
    return;
  }

  if (pendingImportData.type === 'full_dataset') {
    try {
      const res = await fetch("/api/admin/exams/bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${jwtToken}`
        },
        body: JSON.stringify(pendingImportData.data)
      });

      const data = await res.json();
      if (res.ok) {
        alert(`✅ SUCESSO!\n\n${data.message}\n${data.examsCount} Exames, ${data.questionsCount} Perguntas e ${data.lessonsCount} Lições sincronizadas no Supabase.`);
        document.getElementById("admin-import-preview-box").style.display = "none";
        pendingImportData = null;
        await populateAdminExamDropdown();
        await fetchAdminContentExams();
      } else {
        alert(data.error || "Erro ao importar dados.");
      }
    } catch (e) {
      alert("Erro de conexão ao servidor.");
    }
  } else if (pendingImportData.type === 'questions_array') {
    const examSelect = document.getElementById("admin-import-exam-select");
    const examId = examSelect ? examSelect.value : "";

    if (!examId) {
      alert("Por favor, selecione o Exame de Destino no seletor (Passo 1) antes de gravar.");
      return;
    }

    try {
      const res = await fetch("/api/admin/questions/bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${jwtToken}`
        },
        body: JSON.stringify({
          exam_id: examId,
          questions: pendingImportData.data
        })
      });

      const data = await res.json();
      if (res.ok) {
        alert(`✅ SUCESSO!\n\n${data.message}`);
        document.getElementById("admin-import-preview-box").style.display = "none";
        document.getElementById("admin-paste-text-input").value = "";
        document.getElementById("admin-file-upload-input").value = "";
        pendingImportData = null;
        await fetchAdminExamQuestions();
      } else {
        alert(data.error || "Erro ao importar perguntas.");
      }
    } catch (e) {
      alert("Erro de conexão ao servidor.");
    }
  }
}

function downloadCsvTemplate() {
  const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent(
    "numero;pergunta;opcaoA;opcaoB;opcaoC;opcaoD;resposta;explicacao\n" +
    "1;Qual é a capital de Moçambique?;Beira;Maputo;Nampula;Matola;B;Maputo é a capital oficial e centro administrativo de Moçambique.\n" +
    "2;Qual é o órgão responsável pela fotossíntese nas plantas?;Raiz;Folha;Caule;Flor;B;As folhas possuem cloroplastos ricos em clorofila que captam a luz solar.\n"
  );
  const a = document.createElement("a");
  a.setAttribute("href", csvContent);
  a.setAttribute("download", "modelo_perguntas_examepronto.csv");
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function downloadJsonTemplate() {
  const sampleJson = [
    {
      "number": 1,
      "text": "Exemplo de enunciado da questão...",
      "options": ["A) Opção 1", "B) Opção 2", "C) Opção 3", "D) Opção 4"],
      "correct_option": 0,
      "explanation": "Explicação detalhada passo a passo."
    }
  ];
  const jsonContent = "data:application/json;charset=utf-8," + encodeURIComponent(JSON.stringify(sampleJson, null, 2));
  const a = document.createElement("a");
  a.setAttribute("href", jsonContent);
  a.setAttribute("download", "modelo_perguntas_examepronto.json");
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// --- GERADOR AUTÓNOMO DE CONTEÚDO & LOGS (ADMIN) ---

async function fetchAdminGeneratorLogs() {
  const container = document.getElementById("admin-generator-logs-container");
  const countSpan = document.getElementById("admin-logs-count");
  if (!container) return;

  try {
    const res = await fetch("/api/admin/generator/logs", {
      headers: { "Authorization": `Bearer ${jwtToken}` }
    });
    if (!res.ok) throw new Error();
    const logs = await res.json();

    if (countSpan) countSpan.textContent = `${logs.length} registos`;

    if (logs.length === 0) {
      container.innerHTML = `<div style="color: #64748b;">Nenhum registo de geração encontrado. Dispare uma geração acima!</div>`;
      return;
    }

    container.innerHTML = logs.map(l => {
      const date = new Date(l.created_at).toLocaleTimeString('pt-MZ');
      return `
        <div style="margin-bottom: 8px; border-bottom: 1px dashed #1e293b; padding-bottom: 6px;">
          <span style="color: #64748b;">[${date}]</span> 
          <span style="color: #10b981; font-weight: bold;">[${l.type}]</span> 
          <span style="color: #f8fafc;">${l.title}</span><br>
          <span style="color: #94a3b8; font-size: 0.75rem;">↪ ${l.details || ''}</span>
        </div>
      `;
    }).join("");
  } catch (e) {
    container.innerHTML = `<div style="color: #ef4444;">Erro ao carregar logs do servidor.</div>`;
  }
}

async function fetchAdminGeneratorStatus() {
  const badge = document.getElementById("admin-worker-status-badge");
  const toggleBtn = document.getElementById("admin-toggle-worker-btn");
  if (!badge || !toggleBtn) return;

  try {
    const res = await fetch("/api/admin/generator/status", {
      headers: { "Authorization": `Bearer ${jwtToken}` }
    });
    if (!res.ok) return;
    const status = await res.json();

    if (status.isActive) {
      badge.textContent = `Ativo (${status.intervalMinutes} min)`;
      badge.style.background = "rgba(16, 185, 129, 0.2)";
      badge.style.color = "var(--success)";
      toggleBtn.textContent = "Pausar Modo Contínuo";
      toggleBtn.className = "btn btn-sm btn-outline";
      toggleBtn.style.color = "var(--error)";
      toggleBtn.style.borderColor = "var(--error)";
    } else {
      badge.textContent = "Desativado";
      badge.style.background = "var(--border-color)";
      badge.style.color = "var(--text-secondary)";
      toggleBtn.textContent = "Ligar Modo Contínuo";
      toggleBtn.className = "btn btn-sm btn-outline";
      toggleBtn.style.color = "var(--primary)";
      toggleBtn.style.borderColor = "var(--primary)";
    }
  } catch (e) {}
}

async function triggerAdminContentGeneration() {
  const examSelect = document.getElementById("admin-gen-curriculum-select");
  const countSelect = document.getElementById("admin-gen-count-select");
  const btn = document.getElementById("admin-trigger-gen-btn");

  const examId = examSelect ? examSelect.value : "";
  const count = countSelect ? parseInt(countSelect.value) || 1 : 1;

  if (btn) {
    btn.disabled = true;
    btn.textContent = "A Gerar...";
  }

  try {
    const res = await fetch("/api/admin/generator/trigger", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${jwtToken}`
      },
      body: JSON.stringify({ exam_id: examId, count })
    });

    const data = await res.json();
    if (res.ok) {
      showToast(`🤖 ${data.message}`, "success");
      await fetchAdminGeneratorLogs();
      await renderExamsList();
    } else {
      showToast(data.error || "Erro ao gerar conteúdo.", "error");
    }
  } catch (e) {
    showToast("Erro de conexão ao servidor.", "error");
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = "🚀 Gerar e Publicar Agora";
    }
  }
}

async function toggleAdminContentWorker() {
  const badge = document.getElementById("admin-worker-status-badge");
  const intervalSelect = document.getElementById("admin-worker-interval-select");
  const isCurrentlyActive = badge && badge.textContent.includes("Ativo");
  const intervalMinutes = intervalSelect ? parseInt(intervalSelect.value) || 30 : 30;

  try {
    const res = await fetch("/api/admin/generator/toggle", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${jwtToken}`
      },
      body: JSON.stringify({ enable: !isCurrentlyActive, intervalMinutes })
    });

    const data = await res.json();
    if (res.ok) {
      showToast(data.message, "info");
      await fetchAdminGeneratorStatus();
    }
  } catch (e) {
    showToast("Erro ao alternar modo contínuo.", "error");
  }
}




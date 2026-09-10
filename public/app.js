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
let activeYear = "all";
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
      activeYear = "all";
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
  safeAddListener("quiz-focus-btn", "click", toggleFocusMode);
  safeAddListener("quiz-download-paper-btn", "click", downloadExamPaperPdf);
  safeAddListener("quiz-hint-btn", "click", showPedagogicalHint);

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

  // Search Inputs
  safeAddListener("dashboard-search-input", "input", filterAndRenderExams);
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
  document.getElementById("auth-overlay").style.display = "flex";
  document.getElementById("auth-phone-input").focus();
}

function toggleAuthMode() {
  document.getElementById("auth-error-alert").style.display = "none";
  document.getElementById("auth-success-alert").style.display = "none";
  
  if (authMode === "login") {
    authMode = "register";
    document.getElementById("auth-title").textContent = "Registar Nova Conta";
    document.getElementById("auth-submit-btn").textContent = "Criar Conta";
    document.getElementById("auth-toggle-link").innerHTML = 'Já tem conta? <span style="color: var(--primary); font-weight: 600; cursor: pointer;">Faça Login aqui</span>';
  } else {
    authMode = "login";
    document.getElementById("auth-title").textContent = "Iniciar Sessão";
    document.getElementById("auth-submit-btn").textContent = "Entrar";
    document.getElementById("auth-toggle-link").innerHTML = 'Não tem conta? <span style="color: var(--primary); font-weight: 600; cursor: pointer;">Registe-se aqui</span>';
  }
}

async function submitAuth() {
  const phone = document.getElementById("auth-phone-input").value.replace(/\D/g, "");
  const password = document.getElementById("auth-password-input").value;
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
      body: JSON.stringify({ phone, password })
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
  if (u.includes('isri')) return 'minedh';
  if (u.includes('minedh')) return 'minedh';
  if (u.includes('inatro')) return 'inatro';
  if (u.includes('cambridge')) return 'cambridge';
  return 'uem';
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

    renderUniversityAndYearFilters();
    filterAndRenderExams();

  } catch (e) {
    container.innerHTML = `<p style="text-align: center; color: var(--error); width: 100%; padding: 30px;">Erro ao ligar ao servidor de exames.</p>`;
  }
}

function renderUniversityAndYearFilters() {
  const univPillsContainer = document.getElementById("university-filter-pills");
  const yearPillsContainer = document.getElementById("year-filter-pills");
  const univLabel = document.getElementById("selected-university-label");
  const yearLabel = document.getElementById("selected-year-label");

  if (!univPillsContainer || !yearPillsContainer) return;

  const exams = currentLevelExams || [];
  
  // 1. Contagens de Universidades
  const univCounts = {};
  exams.forEach(e => {
    const u = (e.university || 'UEM').trim();
    univCounts[u] = (univCounts[u] || 0) + 1;
  });
  const univKeys = Object.keys(univCounts).sort();

  // Renderizar pills de universidade
  univPillsContainer.innerHTML = "";
  
  // Pill "Todas"
  const allUnivPill = document.createElement("button");
  allUnivPill.className = `filter-pill ${activeUniversity === 'all' ? 'active' : ''}`;
  allUnivPill.innerHTML = `🏛️ Todas <span class="pill-count">${exams.length}</span>`;
  allUnivPill.addEventListener("click", () => {
    activeUniversity = "all";
    if (univLabel) univLabel.textContent = "Todas";
    renderUniversityAndYearFilters();
    filterAndRenderExams();
  });
  univPillsContainer.appendChild(allUnivPill);

  univKeys.forEach(u => {
    const pill = document.createElement("button");
    pill.className = `filter-pill ${activeUniversity.toLowerCase() === u.toLowerCase() ? 'active' : ''}`;
    pill.innerHTML = `<span>${escapeHtml(u)}</span> <span class="pill-count">${univCounts[u]}</span>`;
    pill.addEventListener("click", () => {
      activeUniversity = u;
      if (univLabel) univLabel.textContent = u;
      renderUniversityAndYearFilters();
      filterAndRenderExams();
    });
    univPillsContainer.appendChild(pill);
  });

  if (univLabel) {
    univLabel.textContent = activeUniversity === "all" ? "Todas" : activeUniversity;
  }

  // 2. Contagens de Anos (filtrado pela universidade selecionada se houver, ou geral)
  const yearCounts = {};
  exams.forEach(e => {
    if (activeUniversity === 'all' || (e.university && e.university.toLowerCase() === activeUniversity.toLowerCase())) {
      const y = String(e.year || '2025').trim();
      yearCounts[y] = (yearCounts[y] || 0) + 1;
    }
  });
  const yearKeys = Object.keys(yearCounts).sort((a, b) => Number(b) - Number(a));

  // Renderizar pills de ano
  yearPillsContainer.innerHTML = "";

  // Pill "Todos os Anos"
  const matchingUnivCount = activeUniversity === 'all' 
    ? exams.length 
    : exams.filter(e => (e.university || '').toLowerCase() === activeUniversity.toLowerCase()).length;

  const allYearPill = document.createElement("button");
  allYearPill.className = `filter-pill ${activeYear === 'all' ? 'active' : ''}`;
  allYearPill.innerHTML = `📅 Todos <span class="pill-count">${matchingUnivCount}</span>`;
  allYearPill.addEventListener("click", () => {
    activeYear = "all";
    if (yearLabel) yearLabel.textContent = "Todos os Anos";
    renderUniversityAndYearFilters();
    filterAndRenderExams();
  });
  yearPillsContainer.appendChild(allYearPill);

  yearKeys.forEach(y => {
    const pill = document.createElement("button");
    pill.className = `filter-pill ${String(activeYear) === String(y) ? 'active' : ''}`;
    pill.innerHTML = `<span>${escapeHtml(y)}</span> <span class="pill-count">${yearCounts[y]}</span>`;
    pill.addEventListener("click", () => {
      activeYear = y;
      if (yearLabel) yearLabel.textContent = y;
      renderUniversityAndYearFilters();
      filterAndRenderExams();
    });
    yearPillsContainer.appendChild(pill);
  });

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

  // Atualizar badge de contagem de exames no cabeçalho
  const countBadge = document.getElementById("exams-count-badge");
  if (countBadge) {
    countBadge.textContent = `${list.length} Exame${list.length === 1 ? '' : 's'} Disponíve${list.length === 1 ? 'l' : 'is'}`;
  }

  container.innerHTML = "";

  if (list.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; color: var(--text-secondary); width: 100%; padding: 40px 20px; background: var(--bg-secondary); border-radius: var(--radius-md); border: 1px dashed var(--border-color); grid-column: 1 / -1;">
        <p style="font-size: 1.1rem; font-weight: 600; margin-bottom: 8px;">Nenhum exame encontrado</p>
        <p style="font-size: 0.88rem; color: var(--text-secondary);">Tente alterar o filtro de universidade, ano ou limpar a busca.</p>
      </div>
    `;
    return;
  }

  list.forEach(exam => {
    let completedInfo = null;
    if (userProgressCache) {
      completedInfo = userProgressCache.find(p => p.exam_id === exam.id);
    }

    const univName = exam.university || "UEM";
    const univSlug = getUniversityBadgeClass(univName);

    const card = document.createElement("div");
    card.className = "exam-card";

    let badgeHtml = `<span class="exam-tag free">Grátis</span>`;
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

    card.innerHTML = `
      <div>
        <div class="exam-card-header">
          <h4 class="exam-card-title">${escapeHtml(exam.subject_name)}</h4>
          <div class="exam-badges-wrap">
            <span class="badge-university ${univSlug}">${escapeHtml(univName)}</span>
            <span class="badge-year">${exam.year}</span>
            ${badgeHtml}
          </div>
        </div>
        <div class="exam-card-meta">
          <span>📚 ${escapeHtml(exam.level_name)}</span>
          <span>⏱️ ${exam.duration_minutes || 120} Min</span>
          <span>📝 40 Questões Oficiais</span>
        </div>
      </div>
      <div class="exam-card-actions">
        <button class="btn btn-sm btn-outline btn-study-exam" data-id="${exam.id}" title="Modo Estudo: Resolução sem pressão de tempo com explicações passo a passo e dicas">
          📖 Modo Estudo
        </button>
        <button class="btn btn-sm btn-primary btn-start-exam" data-id="${exam.id}" title="Simular Prova: Simulação oficial cronometrada com contagem regressiva">
          ⏱️ Simular Prova
        </button>
      </div>
      ${scoreBadge}
    `;

    container.appendChild(card);
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
    
    currentQuiz.exam = exam;
    currentQuiz.mode = mode; // 'exam' ou 'study'
    currentQuiz.currentIndex = 0;
    currentQuiz.answers = [];
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

function renderQuestion() {
  const exam = currentQuiz.exam;
  const question = exam.questions[currentQuiz.currentIndex];

  const modeBadge = currentQuiz.mode === 'study' ? '📖 Modo Estudo' : '⏱️ Simulado Oficial';
  const univLabel = exam.university ? ` - ${exam.university}` : '';
  document.getElementById("quiz-exam-title").textContent = `${modeBadge}: ${exam.subject_name} (${exam.year})${univLabel}`;
  document.getElementById("quiz-question-counter").textContent = `Pergunta ${currentQuiz.currentIndex + 1} de ${exam.questions.length}`;
  document.getElementById("quiz-question-number").textContent = `QUESTÃO ${question.number}`;
  
  if (question.text === "[🔒 Conteúdo Premium Bloqueado]") {
    clearInterval(currentQuiz.timerInterval);
    alert("🔒 Conteúdo Premium Bloqueado no Servidor! Ative a sua conta Premium.");
    showSection("checkout");
    return;
  }

  document.getElementById("quiz-question-text").textContent = question.text;

  const optionsContainer = document.getElementById("quiz-options-container");
  optionsContainer.innerHTML = "";

  question.options.forEach((opt, idx) => {
    const optBtn = document.createElement("button");
    optBtn.className = "option-btn";
    optBtn.innerHTML = `<span>${escapeHtml(opt)}</span>`;
    optBtn.addEventListener("click", () => selectOption(idx));
    optionsContainer.appendChild(optBtn);
  });

  document.getElementById("quiz-explanation-box").style.display = "none";
  const hintBox = document.getElementById("quiz-hint-box");
  if (hintBox) {
    hintBox.style.display = "none";
    hintBox.textContent = "";
  }
  document.getElementById("quiz-verify-btn").style.display = "inline-flex";
  document.getElementById("quiz-verify-btn").disabled = true;
  document.getElementById("quiz-next-btn").style.display = "none";
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

function selectOption(index) {
  const options = document.querySelectorAll(".option-btn");
  options.forEach(opt => opt.classList.remove("selected"));
  options[index].classList.add("selected");

  currentQuiz.answers[currentQuiz.currentIndex] = { selectedOptionIndex: index };
  document.getElementById("quiz-verify-btn").disabled = false;
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
  explanationBox.style.display = "block";

  document.getElementById("quiz-verify-btn").style.display = "none";
  document.getElementById("quiz-next-btn").style.display = "inline-flex";
}

function nextQuestion() {
  currentQuiz.currentIndex++;

  if (currentQuiz.currentIndex < currentQuiz.exam.questions.length) {
    renderQuestion();
  } else {
    finishQuiz(false);
  }
}

async function finishQuiz(timeOut = false) {
  clearInterval(currentQuiz.timerInterval);

  if (timeOut) {
    alert("⏰ Tempo limite esgotado! O simulador foi submetido.");
  }

  const totalQuestions = currentQuiz.exam.questions.length;
  let correctCount = 0;
  for (let i = 0; i < totalQuestions; i++) {
    if (currentQuiz.answers[i] && currentQuiz.answers[i].isCorrect) {
      correctCount++;
    }
  }

  const progressData = {
    examId: currentQuiz.exam.id,
    score: correctCount,
    total: totalQuestions,
    date: new Date().toLocaleDateString("pt-MZ")
  };

  try {
    await fetch("/api/user/progress", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${jwtToken}`
      },
      body: JSON.stringify(progressData)
    });
  } catch (e) {
    console.error("Erro ao salvar progresso:", e);
  }

  const percentage = Math.round((correctCount / totalQuestions) * 100);
  document.getElementById("results-score-text").textContent = `${correctCount}/${totalQuestions}`;
  document.getElementById("results-percentage-text").textContent = `${percentage}% Corretas`;

  let headline = "Bom Trabalho!";
  let feedback = "Continua a praticar com os exames oficiais resolvidos para obteres melhor média.";
  
  if (percentage >= 80) {
    headline = "Excelente Nota! 🎉";
    feedback = "Parabéns! Estás com excelente preparação. Desafia os teus colegas para ver se conseguem superar-te.";
  } else if (percentage >= 50) {
    headline = "Passaste no Teste! 👍";
    feedback = "Obteve nota positiva, mas deve continuar a estudar.";
  }

  playAudioChime("fanfare");
  recordStreakAndDailyGoal();

  document.getElementById("results-headline").textContent = headline;
  document.getElementById("results-feedback-message").textContent = feedback;

  showSection("results");
  await fetchUserProgress();
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

// 3. Duelo 1 vs 1 Game Engine
function startDuelGame() {
  document.getElementById("game-selection-panel").style.display = "none";
  document.getElementById("game-duel-arena").style.display = "block";
  document.getElementById("game-over-screen").style.display = "none";

  gameDuelState.round = 1;
  gameDuelState.p1Score = 0;
  gameDuelState.p2Score = 0;
  gameDuelState.isLocked = false;

  document.getElementById("duel-p1-score").textContent = "0";
  document.getElementById("duel-p2-score").textContent = "0";

  loadDuelRound();
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

  // Simular resposta da IA entre 5 e 10 segundos com 75% de acerto
  const aiDelay = Math.floor(Math.random() * 5000) + 5000;
  gameDuelAiTimer = setTimeout(() => {
    if (!gameDuelState.isLocked) {
      const aiIsCorrect = Math.random() < 0.75;
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

// 4. Carregar Leaderboard
async function loadLeaderboard(gameName) {
  activeLeaderboardGame = gameName;
  
  // Toggle classes nos botões
  const btnMath = document.getElementById("btn-leaderboard-math");
  const btnQuiz = document.getElementById("btn-leaderboard-quiz");

  if (gameName === "math_rush") {
    btnMath.classList.add("active");
    btnQuiz.classList.remove("active");
  } else {
    btnMath.classList.remove("active");
    btnQuiz.classList.add("active");
  }

  const tbody = document.getElementById("leaderboard-tbody");
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

// --- PESQUISA E FILTROS DE CONTEÚDO ---

function filterAndRenderExams() {
  const container = document.getElementById("exams-list-grid");
  const query = (document.getElementById("dashboard-search-input").value || "").toLowerCase().trim();
  
  const filtered = currentLevelExams.filter(exam => {
    return exam.subject_name.toLowerCase().includes(query) ||
           exam.level_name.toLowerCase().includes(query) ||
           exam.year.toString().includes(query);
  });

  container.innerHTML = "";

  if (filtered.length === 0) {
    container.innerHTML = `<p style="text-align: center; color: var(--text-secondary);">Nenhum simulador corresponde à sua pesquisa.</p>`;
    return;
  }

  const completedExams = userProgressCache || [];
  const isPremium = userProfile ? userProfile.isPremium : false;

  filtered.forEach(exam => {
    const examItem = document.createElement("div");
    examItem.className = "exam-item";
    
    const finished = completedExams.find(c => c.exam_id === exam.id);
    const scoreHtml = finished ? `<span class="exam-tag" style="background: var(--success-light); color: #065f46; font-weight: 600;">Nota: ${finished.score}/${finished.total}</span>` : "";

    examItem.innerHTML = `
      <div class="exam-info-main">
        <h4>${exam.subject_name} - ${exam.year}</h4>
        <div class="exam-tags">
          <span class="exam-tag">${exam.level_name}</span>
          <span class="exam-tag">${exam.duration_minutes} Minutos</span>
          ${scoreHtml}
          ${!isPremium ? `<span class="exam-tag premium-badge">Grátis (Parcial)</span>` : `<span class="exam-tag premium-badge" style="background: var(--success);">Premium Desbloqueado</span>`}
        </div>
      </div>
      <div class="exam-actions">
        <button class="btn btn-primary btn-sm start-exam-btn" data-exam-id="${exam.id}">
          Iniciar
        </button>
      </div>
    `;
    container.appendChild(examItem);
  });

  document.querySelectorAll(".start-exam-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const examId = e.currentTarget.getAttribute("data-exam-id");
      startExam(examId);
    });
  });
}

function filterAndRenderLessons() {
  const container = document.getElementById("lessons-list-container");
  const query = (document.getElementById("lessons-search-input").value || "").toLowerCase().trim();
  
  const filtered = currentLessons.filter(l => {
    return l.title.toLowerCase().includes(query) ||
           l.summary.toLowerCase().includes(query) ||
           l.subject.toLowerCase().includes(query) ||
           l.level.toLowerCase().includes(query);
  });

  container.innerHTML = "";

  if (filtered.length === 0) {
    container.innerHTML = `<p style="text-align: center; color: var(--text-secondary); width: 100%;">Nenhuma explicação corresponde à sua pesquisa.</p>`;
    return;
  }

  filtered.forEach(l => {
    const card = document.createElement("div");
    card.className = "lesson-card";
    
    const badgeHtml = l.is_premium === 1 
      ? `<span class="exam-tag premium-badge" style="margin-left: auto;">Premium</span>` 
      : `<span class="exam-tag" style="margin-left: auto; background: var(--success-light); color: #065f46; border: none;">Grátis</span>`;

    card.innerHTML = `
      <h4>${l.title} ${badgeHtml}</h4>
      <p>${l.summary}</p>
      <div class="lesson-card-meta">
        <span style="color: var(--primary); text-transform: uppercase;">${l.subject}</span>
        <span style="color: var(--text-secondary); text-transform: uppercase; margin-left: auto;">Nível: ${l.level.toUpperCase()}</span>
      </div>
    `;
    
    card.addEventListener("click", () => viewLesson(l.id));
    container.appendChild(card);
  });
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
  const fullText = `Questão ${q.number}. ${q.text}. Opções: ${q.options.join('. ')}`;
  speakText(fullText);
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

function downloadExamPaperPdf() {
  if (!currentQuiz.exam) return;
  const exam = currentQuiz.exam;
  const container = document.getElementById("printable-exam-paper-container");
  if (!container) return;

  const title = `${exam.subject_name} - ${exam.level_name} (${exam.year})`;
  
  let questionsHtml = "";
  exam.questions.forEach((q, idx) => {
    let optionsHtml = "";
    q.options.forEach((opt, oIdx) => {
      const letter = String.fromCharCode(65 + oIdx);
      optionsHtml += `<div style="margin-left: 20px; margin-top: 4px;"><strong>${letter})</strong> ${opt}</div>`;
    });

    questionsHtml += `
      <div style="margin-bottom: 20px; page-break-inside: avoid;">
        <div style="font-weight: bold; margin-bottom: 6px;">Questão ${idx + 1}. ${q.text}</div>
        ${optionsHtml}
      </div>
    `;
  });

  // Grelha de respostas
  let gridBubbles = "";
  for (let i = 1; i <= exam.questions.length; i++) {
    gridBubbles += `
      <div style="display: inline-block; width: 85px; margin: 4px; padding: 4px; border: 1px solid #94a3b8; text-align: center; font-size: 0.75rem;">
        <strong>Q${i}:</strong> [A] [B] [C] [D]
      </div>
    `;
  }

  container.innerHTML = `
    <div style="border-bottom: 3px double #1e3a8a; padding-bottom: 15px; margin-bottom: 20px; text-align: center;">
      <h2 style="margin: 0; color: #1e3a8a; font-size: 1.4rem;">REPÚBLICA DE MOÇAMBIQUE</h2>
      <h3 style="margin: 4px 0; font-size: 1.1rem; color: #334155;">MINISTÉRIO DA EDUCAÇÃO E DESENVOLVIMENTO HUMANO / INATRO</h3>
      <h4 style="margin: 4px 0; color: #475569; font-weight: normal;">ExamePronto | Vilhete Solutions</h4>
      <div style="margin-top: 10px; padding: 8px; background: #f1f5f9; border-radius: 4px; font-weight: bold;">
        CADERNO OFICIAL DE EXAME: ${title.toUpperCase()} (Duração: ${exam.duration_minutes || 120} Minutos)
      </div>
    </div>

    <div style="margin-bottom: 20px; font-size: 0.85rem; font-style: italic; color: #475569;">
      <strong>Instruções ao Candidato:</strong> Leia atentamente todas as perguntas. Cada questão possui apenas uma resposta correta. Preencha a grelha de respostas no final a tinta azul ou preta.
    </div>

    <div style="font-size: 0.95rem; line-height: 1.5;">
      ${questionsHtml}
    </div>

    <div style="margin-top: 30px; border-top: 2px dashed #1e3a8a; padding-top: 15px; page-break-inside: avoid;">
      <h4 style="text-align: center; margin-bottom: 10px;">GRELHA OFICIAL DE RESPOSTAS</h4>
      <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 4px;">
        ${gridBubbles}
      </div>
      <p style="text-align: center; font-size: 0.75rem; color: #64748b; margin-top: 15px;">
        Caderno emitido por ExamePronto 3.2 | Propriedade de Vilhete Solutions - Moçambique.
      </p>
    </div>
  `;

  document.body.className = "print-paper";
  window.print();
  setTimeout(() => {
    document.body.className = "";
  }, 1000);
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




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
  currentIndex: 0,
  answers: [], // { selectedOptionIndex, isCorrect }
  timerInterval: null,
  timeRemaining: 0
};

let activeLevel = "superior";
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

// --- INICIALIZAÇÃO ---
document.addEventListener("DOMContentLoaded", async () => {
  initTheme();
  setupEventListeners();
  
  if (jwtToken) {
    await checkAuthStatus();
  } else {
    updateAuthUI();
  }
  
  await renderExamsList();
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
      document.getElementById("dashboard-upgrade-btn").addEventListener("click", () => showSection("checkout"));
    }
  } else {
    authBtn.style.display = "inline-flex";
    logoutBtn.style.display = "none";
    phoneText.style.display = "none";
    headerBadge.style.display = "none";
    headerUpgradeBtn.style.display = "none";
    welcomeTitle.textContent = "Olá, Estudante! 👋";
    mainNavMenu.style.display = "none";

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

  document.getElementById("theme-toggle-btn").addEventListener("click", () => {
    const currentTheme = document.body.getAttribute("data-theme");
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    document.body.setAttribute("data-theme", newTheme);
    localStorage.setItem("examepronto_theme", newTheme);
    updateThemeIcons(newTheme);
  });
}

function updateThemeIcons(theme) {
  const sunIcon = document.getElementById("theme-sun");
  const moonIcon = document.getElementById("theme-moon");
  if (theme === "dark") {
    sunIcon.style.display = "none";
    moonIcon.style.display = "block";
  } else {
    sunIcon.style.display = "block";
    moonIcon.style.display = "none";
  }
}

// --- CONFIGURAR NAVEGAÇÃO E EVENTOS ---
function setupEventListeners() {
  document.getElementById("nav-logo-btn").addEventListener("click", (e) => {
    e.preventDefault();
    if (userProfile) {
      showSection("dashboard");
      activateMenuTab("dashboard");
    } else {
      showSection("landing");
    }
  });
  
  document.getElementById("landing-start-btn").addEventListener("click", () => {
    if (userProfile) {
      showSection("dashboard");
      activateMenuTab("dashboard");
    } else {
      openAuthModal();
    }
  });
  
  document.getElementById("landing-plans-btn").addEventListener("click", () => {
    showSection("checkout");
  });

  document.getElementById("header-upgrade-btn").addEventListener("click", () => {
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
  document.getElementById("header-auth-btn").addEventListener("click", openAuthModal);
  
  document.getElementById("auth-close-btn").addEventListener("click", () => {
    authOverlay.style.display = "none";
  });

  document.getElementById("auth-toggle-link").addEventListener("click", toggleAuthMode);
  document.getElementById("auth-submit-btn").addEventListener("click", submitAuth);
  document.getElementById("header-logout-btn").addEventListener("click", logout);

  // Tabs de Filtro de Ensino (ESG 10ª/12ª, Superior, Técnico, Cambridge, Condução)
  document.querySelectorAll("#education-level-grid .uni-card").forEach(card => {
    card.addEventListener("click", (e) => {
      document.querySelectorAll("#education-level-grid .uni-card").forEach(c => c.classList.remove("active"));
      const selectedCard = e.currentTarget;
      selectedCard.classList.add("active");
      activeLevel = selectedCard.getAttribute("data-level");
      renderExamsList();
    });
  });

  // Quiz Arena
  document.getElementById("quiz-quit-btn").addEventListener("click", () => {
    if (confirm("Desejas sair do simulador? O progresso deste teste será perdido.")) {
      clearInterval(currentQuiz.timerInterval);
      showSection("dashboard");
      activateMenuTab("dashboard");
    }
  });

  document.getElementById("quiz-verify-btn").addEventListener("click", verifyAnswer);
  document.getElementById("quiz-next-btn").addEventListener("click", nextQuestion);

  // Results Buttons
  document.getElementById("results-back-btn").addEventListener("click", () => {
    showSection("dashboard");
    activateMenuTab("dashboard");
  });
  document.getElementById("results-share-btn").addEventListener("click", shareResultsOnWhatsApp);

  // Checkout
  document.getElementById("checkout-back-btn").addEventListener("click", () => {
    showSection("dashboard");
    activateMenuTab("dashboard");
  });
  
  document.getElementById("plan-weekly").addEventListener("click", () => selectPlan("semanal"));
  document.getElementById("plan-monthly").addEventListener("click", () => selectPlan("mensal"));

  const phoneInput = document.getElementById("checkout-phone-input");
  phoneInput.addEventListener("input", validatePhone);

  document.getElementById("checkout-pay-btn").addEventListener("click", startMpesaSimulation);

  // USSD simulation
  document.getElementById("ussd-cancel-btn").addEventListener("click", closeUssdOverlay);
  
  const pinInput = document.getElementById("ussd-pin-input");
  pinInput.addEventListener("input", () => {
    const sendBtn = document.getElementById("ussd-send-btn");
    sendBtn.disabled = pinInput.value.length !== 4;
  });

  document.getElementById("ussd-send-btn").addEventListener("click", processUssdPayment);
  document.getElementById("ussd-success-close-btn").addEventListener("click", activatePremiumAccess);

  // Explicador Events
  document.getElementById("lesson-close-viewer-btn").addEventListener("click", () => {
    document.getElementById("lesson-viewer").style.display = "none";
    document.getElementById("lessons-list-container").style.display = "flex";
  });
  
  document.getElementById("lesson-filter-subject").addEventListener("change", fetchLessons);
  
  document.getElementById("chat-send-btn").addEventListener("click", sendChatMessage);
  document.getElementById("chat-user-input").addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendChatMessage();
  });

  // Investor Sliders
  document.getElementById("sim-slider-users").addEventListener("input", runFinancialSimulation);
  document.getElementById("sim-slider-rate").addEventListener("input", runFinancialSimulation);
  document.getElementById("sim-slider-price").addEventListener("input", runFinancialSimulation);

  // Game Lobby Buttons
  document.getElementById("game-card-math").addEventListener("click", startMathRush);
  document.getElementById("game-card-quiz").addEventListener("click", startMozQuiz);
  
  document.querySelectorAll(".btn-game-back").forEach(btn => {
    btn.addEventListener("click", openGamesLobby);
  });
  
  document.getElementById("game-over-retry-btn").addEventListener("click", () => {
    const lastGame = document.getElementById("game-over-points").getAttribute("data-last-game");
    if (lastGame === "math_rush") startMathRush();
    else if (lastGame === "moz_quiz") startMozQuiz();
  });
  document.getElementById("game-over-lobby-btn").addEventListener("click", openGamesLobby);

  // Leaderboard toggles
  document.getElementById("btn-leaderboard-math").addEventListener("click", () => loadLeaderboard("math_rush"));
  document.getElementById("btn-leaderboard-quiz").addEventListener("click", () => loadLeaderboard("moz_quiz"));

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
      } else if (tabId === "admin-content") {
        fetchAdminContentExams();
      }
    });
  });

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
  const dbSearch = document.getElementById("dashboard-search-input");
  if (dbSearch) {
    dbSearch.addEventListener("input", filterAndRenderExams);
  }
  const lesSearch = document.getElementById("lessons-search-input");
  if (lesSearch) {
    lesSearch.addEventListener("input", filterAndRenderLessons);
  }
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
async function renderExamsList() {
  const container = document.getElementById("exams-list-grid");
  container.innerHTML = `<p style="text-align: center; color: var(--text-secondary);">A carregar simuladores...</p>`;

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

    filterAndRenderExams();

  } catch (e) {
    container.innerHTML = `<p style="text-align: center; color: var(--error);">Erro ao ligar ao servidor.</p>`;
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
  }
}

// --- FLUXO DO QUIZ SEGURO ---
async function startExam(examId) {
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
    currentQuiz.currentIndex = 0;
    currentQuiz.answers = [];
    currentQuiz.timeRemaining = exam.durationMinutes * 60;

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
  timerContainer.classList.remove("warning");

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

  document.getElementById("quiz-exam-title").textContent = `${exam.subject_name} (${exam.year})`;
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
    optBtn.innerHTML = `<span>${opt}</span>`;
    optBtn.addEventListener("click", () => selectOption(idx));
    optionsContainer.appendChild(optBtn);
  });

  document.getElementById("quiz-explanation-box").style.display = "none";
  document.getElementById("quiz-verify-btn").style.display = "inline-flex";
  document.getElementById("quiz-verify-btn").disabled = true;
  document.getElementById("quiz-next-btn").style.display = "none";
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
  
  document.getElementById("game-selection-panel").style.display = "block";
  document.getElementById("game-math-arena").style.display = "none";
  document.getElementById("game-quiz-arena").style.display = "none";
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
    btn.innerHTML = `<span>${opt}</span>`;
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
  tbody.innerHTML = `<tr><td colspan="5" style="text-align: center;">A carregar pagamentos...</td></tr>`;

  try {
    const res = await fetch("/api/admin/payments", {
      headers: { "Authorization": `Bearer ${jwtToken}` }
    });

    if (!res.ok) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--error);">Erro ao carregar pagamentos.</td></tr>`;
      return;
    }

    const payments = await res.json();
    tbody.innerHTML = "";

    if (payments.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align: center;">Nenhum pagamento registado.</td></tr>`;
      return;
    }

    payments.forEach(p => {
      const tr = document.createElement("tr");

      let statusHtml = `<span class="admin-badge free">${p.status}</span>`;
      if (p.status === "SUCCESS") {
        statusHtml = `<span class="admin-badge premium" style="background: rgba(16, 185, 129, 0.15); color: var(--success);">${p.status}</span>`;
      } else if (p.status === "PENDING") {
        statusHtml = `<span class="admin-badge free" style="background: rgba(245, 158, 11, 0.15); color: var(--accent);">${p.status}</span>`;
      }

      const dateStr = p.created_at ? new Date(p.created_at).toLocaleString("pt-MZ") : "N/D";

      tr.innerHTML = `
        <td style="padding: 10px; font-weight: bold;">${p.transaction_ref}</td>
        <td style="padding: 10px;">+258 ${p.phone}</td>
        <td style="padding: 10px; font-weight: 600;">${p.amount.toFixed(2)} MT</td>
        <td style="padding: 10px;">${statusHtml}</td>
        <td style="padding: 10px; color: var(--text-secondary);">${dateStr}</td>
      `;
      tbody.appendChild(tr);
    });

  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--error);">Erro de conexão ao servidor.</td></tr>`;
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

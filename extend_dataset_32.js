const fs = require('fs');
const path = require('path');

const dumpFile = path.join(__dirname, 'dumped_data.json');
const data = JSON.parse(fs.readFileSync(dumpFile, 'utf8'));

// 1. Novos Exames
const newExams = [
  {
    id: "esg-bio-10-2025",
    level: "10a",
    level_name: "10ª Classe (Ensino Secundário)",
    subject: "biologia",
    subject_name: "Biologia",
    year: 2025,
    duration_minutes: 90
  },
  {
    id: "esg-fis-12-2025",
    level: "12a",
    level_name: "12ª Classe (Ensino Secundário)",
    subject: "fisica",
    subject_name: "Física",
    year: 2025,
    duration_minutes: 120
  },
  {
    id: "uem-bio-2025",
    level: "superior",
    level_name: "Ensino Superior (Admissão UEM)",
    subject: "biologia",
    subject_name: "Biologia Geral",
    year: 2025,
    duration_minutes: 120
  },
  {
    id: "cond-sinais-2025",
    level: "conducao",
    level_name: "Escola de Condução (INATRO)",
    subject: "codigo",
    subject_name: "Sinais de Trânsito e Prioridades",
    year: 2025,
    duration_minutes: 30
  }
];

// Adicionar exames se não existirem
newExams.forEach(ne => {
  if (!data.exams.some(e => e.id === ne.id)) {
    data.exams.push(ne);
  }
});

// 2. Novas Perguntas
const newQuestions = [
  // 10ª Biologia
  {
    exam_id: "esg-bio-10-2025",
    number: 1,
    text: "Qual é o organelo celular responsável pela produção de energia (ATP) através da respiração celular?",
    options: JSON.stringify(["A) Ribossoma", "B) Mitocôndria", "C) Complexo de Golgi", "D) Lisossoma", "E) Retículo Endoplasmático"]),
    correct_option: 1,
    explanation: "A mitocôndria é a 'central energética' da célula eucariótica, onde ocorre a fosforilação oxidativa e o Ciclo de Krebs para gerar ATP."
  },
  {
    exam_id: "esg-bio-10-2025",
    number: 2,
    text: "Segundo a 1ª Lei de Mendel (Lei da Segregação dos Fatores), no cruzamento entre dois heterozigóticos (Aa x Aa), qual é a proporção fenotípica esperada?",
    options: JSON.stringify(["A) 1:1", "B) 1:2:1", "C) 3:1", "D) 9:3:3:1", "E) 100% dominantes"]),
    correct_option: 2,
    explanation: "No cruzamento Aa x Aa, os genótipos são 1 AA, 2 Aa, 1 aa (proporção genotípica 1:2:1), o que resulta em 3 indivíduos com fenótipo dominante para 1 com fenótipo recessivo (proporção fenotípica 3:1)."
  },
  {
    exam_id: "esg-bio-10-2025",
    number: 3,
    text: "Qual dos seguintes parques nacionais moçambicanos é mundialmente famoso pela sua recuperação ecológica na província de Sofala?",
    options: JSON.stringify(["A) Parque Nacional da Gorongosa", "B) Parque Nacional do Limpopo", "C) Parque Nacional das Quirimbas", "D) Parque Nacional do Bazaruto", "E) Reserva do Niassa"]),
    correct_option: 0,
    explanation: "O Parque Nacional da Gorongosa, situado no vale do Grande Rift em Sofala, é internacionalmente reconhecido pelo projeto de restauro de biodiversidade e fauna bravia."
  },
  {
    exam_id: "esg-bio-10-2025",
    number: 4,
    text: "Qual é o processo biológico pelo qual as plantas convertem água, dióxido de carbono e luz solar em glicose e oxigénio?",
    options: JSON.stringify(["A) Fermentação", "B) Quimiossíntese", "C) Fotossíntese", "D) Transpiração", "E) Respiração celular"]),
    correct_option: 2,
    explanation: "A fotossíntese ocorre nos cloroplastos das células vegetais através da clorofila, sintetizando matéria orgânica e libertando O₂ para a atmosfera."
  },
  {
    exam_id: "esg-bio-10-2025",
    number: 5,
    text: "O agente transmissor (vetor) da doença do sono (Tripanossomíase africana) em Moçambique é a mosca:",
    options: JSON.stringify(["A) Anopheles", "B) Aedes aegypti", "C) Tsé-tsé (Glossina)", "D) Mosca doméstica", "E) Simulídeo"]),
    correct_option: 2,
    explanation: "A mosca Tsé-tsé (género Glossina) transmite o protozoário Trypanosoma, causador da doença do sono em humanos e nagana em animais."
  },

  // 12ª Física
  {
    exam_id: "esg-fis-12-2025",
    number: 1,
    text: "Um corpo de massa m = 4 kg parte do repouso e adquire uma aceleração constante a = 3 m/s² ao longo de 5 segundos. Qual é o valor da força resultante aplicada sobre o corpo?",
    options: JSON.stringify(["A) 7 N", "B) 12 N", "C) 15 N", "D) 20 N", "E) 60 N"]),
    correct_option: 1,
    explanation: "Pela 2ª Lei de Newton (F = m * a): F = 4 kg * 3 m/s² = 12 N."
  },
  {
    exam_id: "esg-fis-12-2025",
    number: 2,
    text: "De acordo com a Lei de Ohm, se a diferença de potencial (tensão) aos terminais de um condutor óhmico de 10 Ω for de 220 V, qual é a corrente elétrica que o percorre?",
    options: JSON.stringify(["A) 11 A", "B) 22 A", "C) 0.45 A", "D) 2200 A", "E) 22 mA"]),
    correct_option: 1,
    explanation: "Pela 1ª Lei de Ohm (U = R * I => I = U / R): I = 220 V / 10 Ω = 22 A."
  },
  {
    exam_id: "esg-fis-12-2025",
    number: 3,
    text: "Quando a luz se propaga do ar (meio menos denso) para a água (meio mais denso), o raio de luz:",
    options: JSON.stringify(["A) Afasta-se da normal", "B) Aproxima-se da normal", "C) Não sofre qualquer desvio", "D) É totalmente absorvido", "E) Reflete-se a 180°"]),
    correct_option: 1,
    explanation: "Pela Lei de Snell-Descartes da refração, ao passar para um meio com maior índice de refração (mais denso), a velocidade da luz diminui e o raio aproxima-se da reta normal."
  },
  {
    exam_id: "esg-fis-12-2025",
    number: 4,
    text: "Qual é o trabalho realizado por uma força constante de 50 N que desloca um bloco por uma distância de 8 metros na mesma direção e sentido da força?",
    options: JSON.stringify(["A) 6.25 J", "B) 400 J", "C) 40 J", "D) 58 J", "E) 200 J"]),
    correct_option: 1,
    explanation: "O trabalho W é dado por W = F * d * cos(θ). Como estão no mesmo sentido (θ = 0°, cos 0° = 1), temos W = 50 N * 8 m = 400 Joules (J)."
  },
  {
    exam_id: "esg-fis-12-2025",
    number: 5,
    text: "Um móvel executa um Movimento Retilíneo Uniformemente Variado (MRUV) com velocidade inicial v₀ = 10 m/s e aceleração a = 2 m/s². Qual é a sua velocidade após t = 6 segundos?",
    options: JSON.stringify(["A) 12 m/s", "B) 16 m/s", "C) 22 m/s", "D) 32 m/s", "E) 60 m/s"]),
    correct_option: 2,
    explanation: "Equação horária da velocidade: v = v₀ + a*t. Substituindo: v = 10 + 2*6 = 10 + 12 = 22 m/s."
  },

  // UEM Biologia Geral
  {
    exam_id: "uem-bio-2025",
    number: 1,
    text: "Qual das seguintes bases azotadas está presente exclusivamente no RNA e é substituída pela Timina no DNA?",
    options: JSON.stringify(["A) Adenina", "B) Guanina", "C) Uracilo", "D) Citosina", "E) Desoxirribose"]),
    correct_option: 2,
    explanation: "O Uracilo (U) é uma base pirimídica presente apenas no RNA, pareando com a Adenina (A). No DNA, a base correspondente é a Timina (T)."
  },
  {
    exam_id: "uem-bio-2025",
    number: 2,
    text: "Durante a divisão celular por Meiose, o fenómeno responsável pelo aumento da variabilidade genética através da troca de segmentos entre cromatídeos não-irmãos é:",
    options: JSON.stringify(["A) Cariocinese", "B) Crossing-over (Permutação)", "C) Citocinese", "D) Interfase", "E) Duplicação semiconservativa"]),
    correct_option: 1,
    explanation: "O Crossing-over (ou permutação) ocorre na Prófase I da Meiose (especificamente no Paquíteno), promovendo a recombinação génica entre cromossomas homólogos."
  },
  {
    exam_id: "uem-bio-2025",
    number: 3,
    text: "Qual é a enzima responsável pela transcrição do código genético de DNA em RNA mensageiro (mRNA)?",
    options: JSON.stringify(["A) DNA Polimerase", "B) RNA Polimerase", "C) Ligase", "D) Helicase", "E) Amilase"]),
    correct_option: 1,
    explanation: "A RNA Polimerase reconhece a região promotora no DNA e sintetiza uma cadeia complementar de RNA mensageiro."
  },
  {
    exam_id: "uem-bio-2025",
    number: 4,
    text: "Nos seres humanos, um indivíduo com grupo sanguíneo AB (sistema ABO) é considerado um exemplo clássico de:",
    options: JSON.stringify(["A) Dominância incompleta", "B) Codominância", "C) Epistasia", "D) Pleiotropia", "E) Herança ligada ao sexo"]),
    correct_option: 1,
    explanation: "No grupo AB, ambos os alelos Iᴬ e Iᴮ expressam-se integral e simultaneamente na superfície das hemácias, caracterizando Codominância."
  },
  {
    exam_id: "uem-bio-2025",
    number: 5,
    text: "No ciclo celular, em qual das seguintes fases da Intérfase ocorre a replicação do DNA?",
    options: JSON.stringify(["A) Fase G₁", "B) Fase S (Síntese)", "C) Fase G₂", "D) Prófase", "E) Anáfase"]),
    correct_option: 1,
    explanation: "A fase S (Synthesis) da intérfase é o período em que todo o material genético (DNA) é duplicado antes da mitose."
  },

  // Condução Sinais & Prioridade
  {
    exam_id: "cond-sinais-2025",
    number: 1,
    text: "Perante um sinal de STOP (Paragem Obrigatória), o condutor deve obrigatoriamente:",
    options: JSON.stringify(["A) Apenas abrandar se não vierem veículos", "B) Imobilizar totalmente o veículo e ceder a passagem a todos os veículos", "C) Buzinar e avançar com cuidado", "D) Ter prioridade sobre quem vem da esquerda", "E) Ligar os 4 piscas e passar"]),
    correct_option: 1,
    explanation: "O sinal B2 (STOP) obriga o condutor a imobilizar o veículo completamente antes do cruzamento e ceder a passagem a todos os veículos na via em que vai entrar."
  },
  {
    exam_id: "cond-sinais-2025",
    number: 2,
    text: "Numa rotunda em Moçambique, quem tem prioridade de passagem?",
    options: JSON.stringify(["A) O veículo que vai entrar na rotunda", "B) O veículo mais rápido", "C) O veículo que já se encontra a circular na rotunda", "D) O veículo pesado", "E) O veículo que se aproxima pela esquerda"]),
    correct_option: 2,
    explanation: "De acordo com o Código de Estrada de Moçambique (INATRO), os veículos que já se encontram a circular dentro da rotunda têm prioridade sobre aqueles que pretendem entrar."
  },
  {
    exam_id: "cond-sinais-2025",
    number: 3,
    text: "Qual é o limite máximo de velocidade permitido para veículos ligeiros de passageiros dentro das localidades em Moçambique?",
    options: JSON.stringify(["A) 40 km/h", "B) 50 km/h", "C) 60 km/h", "D) 80 km/h", "E) 100 km/h"]),
    correct_option: 2,
    explanation: "O limite geral de velocidade para veículos ligeiros dentro das localidades em Moçambique é de 60 km/h, salvo sinalização em contrário."
  },
  {
    exam_id: "cond-sinais-2025",
    number: 4,
    text: "Em caso de cruzamento de veículos à noite em via não iluminada, quando se deve mudar dos máximos para os médios?",
    options: JSON.stringify(["A) A menos de 50 metros", "B) Logo que se aviste o veículo em sentido contrário para evitar encadeamento", "C) Apenas quando o outro condutor pedir com sinais de luz", "D) Nunca se deve mudar para médios", "E) Apenas dentro das cidades"]),
    correct_option: 1,
    explanation: "Os médios devem ser acionados assim que se avistar um veículo em sentido inverso para evitar o encadeamento visual (cegueira momentânea) do outro condutor."
  },
  {
    exam_id: "cond-sinais-2025",
    number: 5,
    text: "O que indica uma linha longitudinal contínua marcada no pavimento?",
    options: JSON.stringify(["A) É permitido pisar ou transpor a qualquer momento", "B) Proibição absoluta de pisar ou transpor para ultrapassagens ou mudanças de direção", "C) Prioridade para quem circula à direita", "D) Fim de autoestrada", "E) Paragem autorizada na berma"]),
    correct_option: 1,
    explanation: "A linha contínua M1 proíbe expressamente os condutores de a pisarem ou transporem, delimitando sentidos de trânsito ou faixas de rodagem perigosas."
  }
];

// Adicionar perguntas
newQuestions.forEach(nq => {
  if (!data.questions.some(q => q.exam_id === nq.exam_id && q.number === nq.number)) {
    data.questions.push(nq);
  }
});

// 3. Novas Lições
const newLessons = [
  {
    level: "10a",
    subject: "biologia",
    title: "Genética Básica e Leis de Mendel",
    summary: "Domina a 1ª e 2ª Lei de Mendel, monohibridismo e proporções fenotípicas.",
    content: "Gregor Mendel, considerado o pai da genética, descobriu as leis fundamentais da hereditariedade estudando ervilheiras (Pisum sativum).\n\n1ª Lei de Mendel (Segregação dos Fatores):\nCada característica é determinada por dois fatores (alelos) que se separam na formação dos gâmetas. Num cruzamento monohíbrido (Aa x Aa), a proporção fenotípica é de 3:1 e a genotípica é 1:2:1.\n\nTerminologia Chave:\n- Homozigótico: Alelos iguais (AA ou aa).\n- Heterozigótico: Alelos diferentes (Aa).\n- Genótipo: Constituição genética.\n- Fenótipo: Manifestação física visível.",
    is_premium: 0
  },
  {
    level: "12a",
    subject: "fisica",
    title: "Cinemática e Leis do Movimento de Newton",
    summary: "Resumo das três leis fundamentais da dinâmica para os exames da 12ª Classe.",
    content: "Isaac Newton formulou as três leis que descrevem o movimento dos corpos:\n\n1ª Lei (Inércia): Qualquer corpo permanece em repouso ou MRU se a força resultante for nula (F_res = 0).\n\n2ª Lei (Princípio Fundamental): A aceleração é diretamente proporcional à força resultante aplicada e inversamente proporcional à massa (F = m * a).\n\n3ª Lei (Ação e Reação): A toda a ação corresponde uma reação de igual intensidade, mesma direção e sentido oposto (F_AB = -F_BA).",
    is_premium: 1
  },
  {
    level: "superior",
    subject: "biologia",
    title: "Bioenergética: Fotossíntese vs Respiração Celular",
    summary: "Comparações metabólicas, produção de ATP e organelos envolvidos.",
    content: "A vida depende da conversão energética:\n\n1. Fotossíntese (Cloroplastos):\n6 CO₂ + 6 H₂O + Luz -> C₆H₁₂O₆ + 6 O₂\nFases: Fotoquímica (Luminosa nos tilacóides) e Química (Ciclo de Calvin no estroma).\n\n2. Respiração Celular (Mitocôndrias):\nC₆H₁₂O₆ + 6 O₂ -> 6 CO₂ + 6 H₂O + ~36-38 ATP\nEtapas: Glicólise (Citoplasma), Ciclo de Krebs (Matriz mitocondrial) e Cadeia Respiratória (Cristas mitocondriais).",
    is_premium: 1
  },
  {
    level: "conducao",
    subject: "codigo",
    title: "Regras de Circulação em Rotundas e Sinais de Trânsito",
    summary: "Guia prático segundo o regulamento do INATRO para aprovação no exame teórico.",
    content: "1. Regras de Entrada e Circulação em Rotundas:\n- Quem circula DENTRO da rotunda tem sempre prioridade.\n- Para sair na 1ª saída: tomar a via mais à direita antes da rotunda com o pisca para a direita ligado.\n- Para sair nas saídas seguintes: entrar pela via interior/esquerda e mudar progressivamente para a direita após passar a saída anterior à pretendida.\n\n2. Sinais de Cedência de Prioridade:\n- STOP (B2): Paragem TOTAL obrigatória.\n- Cedência de Passagem (B1): Abrandar e parar se vierem veículos na via prioritária.",
    is_premium: 0
  }
];

newLessons.forEach(nl => {
  if (!data.lessons.some(l => l.level === nl.level && l.subject === nl.subject && l.title === nl.title)) {
    data.lessons.push(nl);
  }
});

fs.writeFileSync(dumpFile, JSON.stringify(data, null, 2), 'utf8');
console.log(`Sucesso! dumped_data.json atualizado: ${data.exams.length} exames, ${data.questions.length} perguntas, ${data.lessons.length} lições.`);

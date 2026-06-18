const fs = require('fs');
const path = require('path');

const dumpPath = path.join(__dirname, 'dumped_data.json');

if (!fs.existsSync(dumpPath)) {
  console.error('Error: dumped_data.json not found in:', dumpPath);
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(dumpPath, 'utf8'));

// 1. Add New Exams
const newExams = [
  {
    id: "cam-alevel-phy-2025",
    level: "cambridge",
    level_name: "Cambridge A-Level",
    subject: "physics",
    subject_name: "A-Level Physics",
    year: 2025,
    duration_minutes: 120
  },
  {
    id: "esg-quim-12-2025",
    level: "12a",
    level_name: "12ª Classe",
    subject: "quimica",
    subject_name: "Química",
    year: 2025,
    duration_minutes: 120
  }
];

// Add exams to list without duplicates
newExams.forEach(ne => {
  if (!data.exams.some(e => e.id === ne.id)) {
    data.exams.push(ne);
  }
});

// 2. Add Questions
const newQuestions = [
  // Cambridge A-Level Physics
  {
    exam_id: "cam-alevel-phy-2025",
    number: 1,
    text: "A car of mass 1000 kg travels around a flat circular bend of radius 50 m. The maximum frictional force is 8000 N. Calculate the maximum speed of the car without slipping.",
    options: JSON.stringify(["A) 10 m/s", "B) 20 m/s", "C) 15 m/s", "D) 25 m/s", "E) 8 m/s"]),
    correct_option: 1,
    explanation: "Centripetal force is F = m*v²/r. Maximum friction = centripetal force. 8000 = 1000 * v² / 50 => v² = 400 => v = 20 m/s."
  },
  {
    exam_id: "cam-alevel-phy-2025",
    number: 2,
    text: "Which of the following is a unit of power?",
    options: JSON.stringify(["A) Joule-second", "B) Watt-second", "C) Joule per second", "D) Newton-meter", "E) Watt per second"]),
    correct_option: 2,
    explanation: "Power is work done per unit time, or energy transferred per unit time. Power = Energy / Time = Joule / second = Watt."
  },
  {
    exam_id: "cam-alevel-phy-2025",
    number: 3,
    text: "A progressive sound wave has a frequency of 500 Hz. The wave speed is 340 m/s. Calculate the phase difference between two points that are 0.17 m apart.",
    options: JSON.stringify(["A) 0.5 rad", "B) pi/2 rad", "C) pi rad", "D) 2*pi rad", "E) pi/4 rad"]),
    correct_option: 1,
    explanation: "Wavelength lambda = v/f = 340 / 500 = 0.68 m. Phase difference delta = 2*pi * d / lambda = 2*pi * 0.17 / 0.68 = pi/2 rad."
  },
  {
    exam_id: "cam-alevel-phy-2025",
    number: 4,
    text: "A mass of 2.0 kg is suspended from a vertical spring. The extension is 0.10 m. Calculate the elastic potential energy stored in the spring (g = 9.81 m/s²).",
    options: JSON.stringify(["A) 0.98 J", "B) 1.96 J", "C) 0.20 J", "D) 0.10 J", "E) 0.49 J"]),
    correct_option: 0,
    explanation: "Force F = m*g = 2.0 * 9.81 = 19.62 N. Elastic energy E = 0.5 * F * extension = 0.5 * 19.62 * 0.10 = 0.981 J."
  },
  {
    exam_id: "cam-alevel-phy-2025",
    number: 5,
    text: "Which type of electromagnetic radiation has the shortest wavelength?",
    options: JSON.stringify(["A) Gamma rays", "B) Ultraviolet", "C) X-rays", "D) Radio waves", "E) Infrared"]),
    correct_option: 0,
    explanation: "In the electromagnetic spectrum, gamma rays have the highest frequency and therefore the shortest wavelength."
  },

  // Chemistry 12ª Classe
  {
    exam_id: "esg-quim-12-2025",
    number: 1,
    text: "Qual é o pH de uma solução aquosa cuja concentração de iões H⁺ é 1.0 x 10⁻⁴ mol/L?",
    options: JSON.stringify(["A) 4", "B) 10", "C) 7", "D) 14", "E) 1"]),
    correct_option: 0,
    explanation: "O pH é calculado pela fórmula pH = -log[H⁺]. Portanto, pH = -log(1.0 x 10⁻⁴) = 4. A solução é ácida."
  },
  {
    exam_id: "esg-quim-12-2025",
    number: 2,
    text: "Qual é a fórmula molecular do Benzeno, o hidrocarboneto aromático mais simples?",
    options: JSON.stringify(["A) C6H12", "B) C6H6", "C) C2H2", "D) CH4", "E) C6H14"]),
    correct_option: 1,
    explanation: "O benzeno possui uma estrutura cíclica plana com ligações duplas conjugadas alternadas, tendo a fórmula molecular C6H6."
  },
  {
    exam_id: "esg-quim-12-2025",
    number: 3,
    text: "De acordo com o princípio de Le Chatelier, o aumento da pressão num sistema em equilíbrio gasoso desloca o equilíbrio no sentido de:",
    options: JSON.stringify([
      "A) Formação do maior número de moles gasosas",
      "B) Formação do menor número de moles gasosas",
      "C) Não altera o equilíbrio químico",
      "D) Deslocamento para a esquerda",
      "E) Deslocamento para a direita"
    ]),
    correct_option: 1,
    explanation: "O aumento da pressão favorece o sentido da reação que reduz o volume do gás, ou seja, no sentido do menor número de moles de gás."
  },
  {
    exam_id: "esg-quim-12-2025",
    number: 4,
    text: "Qual é o elemento químico mais eletronegativo da tabela periódica?",
    options: JSON.stringify(["A) Oxigénio", "B) Flúor", "C) Cloro", "D) Hélio", "E) Azoto"]),
    correct_option: 1,
    explanation: "O Flúor (F) localiza-se no topo superior direito dos halogéneos e apresenta a maior eletronegatividade (3.98 na escala de Pauling)."
  },
  {
    exam_id: "esg-quim-12-2025",
    number: 5,
    text: "Numa reação exotérmica, a variação de entalpia (ΔH) é:",
    options: JSON.stringify(["A) Maior que zero (ΔH > 0)", "B) Menor que zero (ΔH < 0)", "C) Igual a zero (ΔH = 0)", "D) Variável dependendo da pressão", "E) Sempre igual a 100 kJ"]),
    correct_option: 1,
    explanation: "Reações exotérmicas libertam calor para o ambiente. Como a entalpia dos produtos é menor que a dos reagentes, a variação de entalpia (ΔH) é negativa (ΔH < 0)."
  }
];

// Add questions without duplicates
newQuestions.forEach(nq => {
  if (!data.questions.some(q => q.exam_id === nq.exam_id && q.number === nq.number)) {
    data.questions.push(nq);
  }
});

// 3. Add Lessons
const newLessons = [
  {
    level: "cambridge",
    subject: "physics",
    title: "Circular Motion and Centripetal Force",
    summary: "Understand centripetal acceleration and gravitational fields for A-Level Physics.",
    content: "In A-Level Physics, circular motion is a key topic. An object moving in a circle has a changing velocity because its direction is constantly changing. This means it is accelerating. The acceleration is directed towards the center of the circle and is called centripetal acceleration: a = v²/r. The force causing this acceleration is centripetal force: F = m*v²/r.",
    is_premium: 1
  },
  {
    level: "12a",
    subject: "quimica",
    title: "Equilíbrio Químico e pH",
    summary: "Aprende a calcular o pH de soluções e a aplicar o princípio de Le Chatelier no equilíbrio.",
    content: "O equilíbrio químico ocorre quando a velocidade da reação direta é igual à velocidade da reação inversa. O pH mede a acidez ou basicidade de uma solução: pH = -log[H⁺]. Um pH < 7 indica acidez, pH = 7 neutro e pH > 7 alcalino. De acordo com o Princípio de Le Chatelier, quando uma perturbação externa é aplicada a um sistema em equilíbrio, o sistema desloca-se de forma a minimizar essa perturbação.",
    is_premium: 0
  }
];

// Add lessons without duplicates
newLessons.forEach(nl => {
  if (!data.lessons.some(l => l.level === nl.level && l.subject === nl.subject && l.title === nl.title)) {
    data.lessons.push(nl);
  }
});

// Write data back
fs.writeFileSync(dumpPath, JSON.stringify(data, null, 2), 'utf8');
console.log('Successfully appended A-Level Physics and 12a Química to dumped_data.json!');
console.log(`Total Exams: ${data.exams.length}, Questions: ${data.questions.length}, Lessons: ${data.lessons.length}`);
process.exit(0);

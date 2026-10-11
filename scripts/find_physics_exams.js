const fs = require('fs');
const { PDFParse } = require('pdf-parse');

async function findPhysicsExams() {
  const filePath = 'C:\\Users\\fvilh\\Downloads\\Kico\\UEM\\BROCHURA-FISICA-RESOLUCAO-2.pdf';
  const buf = fs.readFileSync(filePath);
  const parser = new PDFParse({ data: buf });
  await parser.load();
  const textObj = await parser.getText();
  const text = textObj.text || textObj;

  // Encontrar ocorrências de "Exame de Admissão de 20XX" ou "FÍSICA 20XX"
  const regex = /Exame\s+de\s+Admissão\s+de\s+20\d{2}[^\n]*/gi;
  let match;
  const positions = [];
  while ((match = regex.exec(text)) !== null) {
    if (match.index > 1500) { // fora do índice
      positions.push({
        title: match[0].replace(/[ \t]+/g, ' ').trim(),
        index: match.index
      });
    }
  }

  // Filtrar duplicados próximos
  const unique = [];
  for (const pos of positions) {
    if (unique.length === 0 || pos.index - unique[unique.length - 1].index > 500) {
      unique.push(pos);
    }
  }

  console.log(`Total de exames de Física identificados: ${unique.length}`);
  unique.forEach((u, i) => {
    console.log(`[${i + 1}] "${u.title}" (index: ${u.index})`);
  });

  // Amostra do exame 1 (2013)
  if (unique.length > 0) {
    const sample = text.slice(unique[0].index, unique[0].index + 2000);
    console.log('\n--- AMOSTRA EXAME 1 FÍSICA ---');
    console.log(sample);
  }
}

findPhysicsExams();

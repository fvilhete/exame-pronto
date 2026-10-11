const fs = require('fs');
const { PDFParse } = require('pdf-parse');

async function findMathExams() {
  const filePath = 'C:\\Users\\fvilh\\Downloads\\Kico\\UEM\\MAematica-brochura_exames_2013_2025-4-1-1.pdf';
  const buf = fs.readFileSync(filePath);
  const parser = new PDFParse({ data: buf });
  await parser.load();
  const textObj = await parser.getText();
  const text = textObj.text || textObj;

  // Encontrar todas as ocorrências de "Correcção do exame de Matemática de YYYY" ou "Exame de Matemática ... de YYYY"
  const regex = /(?:Exame\s+(?:de\s+)?Matem[aá]tica\s*(?:[I|V|A|B]+)?\s*(?:de\s+)?20\d{2}[A-B]?)/gi;
  let match;
  const positions = [];
  while ((match = regex.exec(text)) !== null) {
    // Apenas se tiver 'Correcção' ou se estiver após a página 2 (fora do índice)
    if (match.index > 1500) {
      positions.push({
        title: match[0].trim(),
        index: match.index
      });
    }
  }

  // Filtrar duplicados muito próximos (< 200 caracteres de distância)
  const uniqueExams = [];
  for (const pos of positions) {
    if (uniqueExams.length === 0 || pos.index - uniqueExams[uniqueExams.length - 1].index > 500) {
      uniqueExams.push(pos);
    }
  }

  console.log(`Total de exames de Matemática identificados no corpo: ${uniqueExams.length}`);
  uniqueExams.forEach((ue, i) => {
    console.log(`[${i + 1}] "${ue.title}" (posição: ${ue.index})`);
  });
}

findMathExams();

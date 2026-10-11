const fs = require('fs');
const { PDFParse } = require('pdf-parse');

async function findQuimicaAndBiologiaExams() {
  console.log('\n--- EXAMES DE QUÍMICA ---');
  const qBuf = fs.readFileSync('C:\\Users\\fvilh\\Downloads\\Kico\\UEM\\Brochura_QUIMICA_2025.pdf');
  const qParser = new PDFParse({ data: qBuf });
  await qParser.load();
  const qText = (await qParser.getText()).text;

  const qRegex = /Exame\s+de\s+Qu[ií]mica\s*(?:[I|V]+)?\s*[-–]\s*20\d{2}/gi;
  let m;
  const qPos = [];
  while ((m = qRegex.exec(qText)) !== null) {
    if (m.index > 1500) {
      qPos.push({ title: m[0].replace(/[ \t]+/g, ' ').trim(), index: m.index });
    }
  }
  const qUnique = [];
  for (const p of qPos) {
    if (qUnique.length === 0 || p.index - qUnique[qUnique.length - 1].index > 500) {
      qUnique.push(p);
    }
  }
  console.log(`Total exames de Química: ${qUnique.length}`);
  qUnique.forEach((u, i) => console.log(`[${i + 1}] "${u.title}" (index: ${u.index})`));

  console.log('\n--- EXAMES DE BIOLOGIA ---');
  const bBuf = fs.readFileSync('C:\\Users\\fvilh\\Downloads\\Kico\\UEM\\Brochura-de-exames-resolvidos_UEM_Biologia_2013-2025.pdf');
  const bParser = new PDFParse({ data: bBuf });
  await bParser.load();
  const bText = (await bParser.getText()).text;

  const bRegex = /Exame\s+de\s+Admissão\s+de\s+Biologia\s+20\d{2}[^\n]*/gi;
  const bPos = [];
  while ((m = bRegex.exec(bText)) !== null) {
    if (m.index > 2500) {
      bPos.push({ title: m[0].replace(/\t+/g, ' ').replace(/[ ]+/g, ' ').trim(), index: m.index });
    }
  }
  const bUnique = [];
  for (const p of bPos) {
    if (bUnique.length === 0 || p.index - bUnique[bUnique.length - 1].index > 500) {
      bUnique.push(p);
    }
  }
  console.log(`Total exames de Biologia: ${bUnique.length}`);
  bUnique.forEach((u, i) => console.log(`[${i + 1}] "${u.title}" (index: ${u.index})`));
}

findQuimicaAndBiologiaExams();

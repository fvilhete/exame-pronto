const db = require('../database');
const crypto = require('crypto');

function generateRandomSegment(length) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No ambiguous characters (O, 0, I, 1)
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function seedVouchers() {
  console.log('--- A gerar lote oficial de 50 vouchers para ExamePronto / Vilhete Solutions ---');

  const vouchers = [];

  // 25 vouchers de 7 dias
  for (let i = 0; i < 25; i++) {
    const code = `EXP7-${generateRandomSegment(4)}-${generateRandomSegment(4)}`;
    vouchers.push({ code, days: 7 });
  }

  // 25 vouchers de 30 dias
  for (let i = 0; i < 25; i++) {
    const code = `EXP30-${generateRandomSegment(4)}-${generateRandomSegment(4)}`;
    vouchers.push({ code, days: 30 });
  }

  let inserted = 0;

  for (const v of vouchers) {
    await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO vouchers (code, days, is_used) VALUES (?, ?, 0)`,
        [v.code, v.days],
        function (err) {
          if (err) {
            console.error(`Erro ao inserir voucher ${v.code}:`, err.message);
            resolve();
          } else {
            inserted++;
            resolve();
          }
        }
      );
    });
  }

  console.log(`✅ Sucesso! Inseridos ${inserted} de ${vouchers.length} vouchers válidos no banco.`);

  // Listar alguns vouchers gerados como amostra
  db.all('SELECT code, days, is_used FROM vouchers LIMIT 10', [], (err, rows) => {
    if (!err && rows) {
      console.log('Amostra de 10 Vouchers ativos:');
      console.table(rows);
    }
    process.exit(0);
  });
}

seedVouchers().catch(err => {
  console.error('Falha geral no seed:', err);
  process.exit(1);
});

const http = require('http');
const dotenv = require('dotenv');
const { Pool } = require('pg');

dotenv.config();

const app = require('./server');
const PORT = 4001;

// Configurar o process.env.ADMIN_PHONE para o teste
process.env.ADMIN_PHONE = '849999999';

let server;
let client;

function runServer() {
  return new Promise((resolve) => {
    server = app.listen(PORT, () => {
      console.log(`[TEST] Servidor de testes rodando na porta ${PORT}`);
      resolve();
    });
  });
}

async function request(path, method = 'GET', body = null, token = null) {
  return new Promise((resolve, reject) => {
    const headers = {
      'Content-Type': 'application/json'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const reqOptions = {
      hostname: 'localhost',
      port: PORT,
      path: path,
      method: method,
      headers: headers
    };

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, rawBody: data });
        }
      });
    });

    req.on('error', (err) => reject(err));

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function main() {
  try {
    await runServer();

    // Conectar ao Supabase PostgreSQL para configurar o teste e depois limpar
    client = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
    await client.connect();

    console.log('[TEST] Limpando usuários de teste antigos...');
    await client.query("DELETE FROM users WHERE phone IN ('841111111', '849999999')");

    // 1. Registrar um usuário comum (841111111)
    console.log('[TEST] Testando Registro de Usuário Comum...');
    const regRes = await request('/api/auth/register', 'POST', {
      phone: '841111111',
      password: 'password123'
    });
    console.log(`Status de Registro: ${regRes.status}`);
    const normalToken = regRes.body.token;

    // 2. Tentar acessar rotas de administrador com o token do usuário comum -> deve dar 403
    console.log('[TEST] Acessando /api/admin/users com usuário COMUM (Espera-se 403)...');
    const adminUsersResNormal = await request('/api/admin/users', 'GET', null, normalToken);
    console.log(`Status Recebido: ${adminUsersResNormal.status}`);
    if (adminUsersResNormal.status === 403) {
      console.log('✅ TESTE 1 PASSOU: Acesso comum negado com sucesso (403).');
    } else {
      console.log(`❌ TESTE 1 FALHOU: Retornou status ${adminUsersResNormal.status}`);
    }

    // 3. Registrar um usuário administrador (849999999, correspondendo ao ADMIN_PHONE)
    console.log('[TEST] Testando Registro de Usuário Administrador (ADMIN_PHONE)...');
    const adminRegRes = await request('/api/auth/register', 'POST', {
      phone: '849999999',
      password: 'password123'
    });
    console.log(`Status de Registro Admin: ${adminRegRes.status}`);
    console.log(`É administrador? ${adminRegRes.body.user.isAdmin ? 'Sim' : 'Não'}`);
    const adminToken = adminRegRes.body.token;

    // 4. Acessar rotas de administrador com o token do administrador -> deve dar 200
    console.log('[TEST] Acessando /api/admin/users com usuário ADMINISTRADOR (Espera-se 200)...');
    const adminUsersResAdmin = await request('/api/admin/users', 'GET', null, adminToken);
    console.log(`Status Recebido: ${adminUsersResAdmin.status}`);
    console.log(`Quantidade de usuários listada: ${adminUsersResAdmin.body.length}`);
    if (adminUsersResAdmin.status === 200 && Array.isArray(adminUsersResAdmin.body)) {
      console.log('✅ TESTE 2 PASSOU: Acesso de Administrador concedido com sucesso (200).');
    } else {
      console.log(`❌ TESTE 2 FALHOU: Retornou status ${adminUsersResAdmin.status}`);
    }

    // 5. Testar ativação manual de premium por administrador
    console.log('[TEST] Promovendo premium do usuário comum através do painel de administração...');
    const premiumRes = await request('/api/admin/users/premium', 'POST', {
      userId: regRes.body.user.id,
      days: 30
    }, adminToken);
    console.log(`Status do Premium: ${premiumRes.status}`);
    if (premiumRes.status === 200) {
      console.log('✅ TESTE 3 PASSOU: Concessão de premium manual realizada.');
    } else {
      console.log(`❌ TESTE 3 FALHOU: Retornou status ${premiumRes.status}`);
    }

    // 6. Testar criação de pergunta por administrador
    console.log('[TEST] Criando nova pergunta via CMS Admin...');
    const createQRes = await request('/api/admin/questions', 'POST', {
      exam_id: 'esg-bio-10-2025',
      number: 99,
      text: 'Pergunta de Teste Automatizado',
      options: ['A) 1', 'B) 2', 'C) 3', 'D) 4'],
      correct_option: 0,
      explanation: 'Explicação de Teste'
    }, adminToken);
    console.log(`Status de Criação de Pergunta: ${createQRes.status}`);
    const createdQId = createQRes.body.questionId;
    if (createQRes.status === 201 && createdQId) {
      console.log('✅ TESTE 4 PASSOU: Criação de pergunta no CMS autorizada e persistida.');
    } else {
      console.log(`❌ TESTE 4 FALHOU: Retornou status ${createQRes.status}`);
    }

    // 7. Listar perguntas do exame
    console.log('[TEST] Listando perguntas do exame com admin...');
    const listQRes = await request('/api/admin/exams/esg-bio-10-2025/questions', 'GET', null, adminToken);
    if (listQRes.status === 200 && Array.isArray(listQRes.body)) {
      console.log(`✅ TESTE 5 PASSOU: Listagem de ${listQRes.body.length} perguntas efetuada.`);
    } else {
      console.log(`❌ TESTE 5 FALHOU: Retornou status ${listQRes.status}`);
    }

    // 8. Eliminar pergunta criada
    if (createdQId) {
      console.log(`[TEST] Eliminando pergunta #${createdQId}...`);
      const delQRes = await request(`/api/admin/questions/${createdQId}`, 'DELETE', null, adminToken);
      if (delQRes.status === 200) {
        console.log('✅ TESTE 6 PASSOU: Pergunta eliminada com sucesso via API Admin.');
      } else {
        console.log(`❌ TESTE 6 FALHOU: Retornou status ${delQRes.status}`);
      }
    }

    // 9. Submeter e aprovar pagamento manual
    console.log('[TEST] Submetendo pagamento manual de estudante...');
    const manualPayRes = await request('/api/payments/manual', 'POST', {
      plan: 'mensal',
      method: 'MPESA_849517984',
      senderPhone: '841111111',
      transactionRef: 'TESTREF992'
    }, normalToken);
    console.log(`Status de Pagamento Manual: ${manualPayRes.status}`);
    const paymentId = manualPayRes.body.paymentId;

    if (manualPayRes.status === 201 && paymentId) {
      console.log('✅ TESTE 7 PASSOU: Submissão de pagamento manual registada.');
      
      console.log(`[TEST] Aprovando pagamento manual #${paymentId} pelo administrador...`);
      const approveRes = await request('/api/admin/payments/approve', 'POST', { paymentId }, adminToken);
      if (approveRes.status === 200) {
        console.log('✅ TESTE 8 PASSOU: Pagamento manual aprovado e Premium concedido.');
      } else {
        console.log(`❌ TESTE 8 FALHOU: Retornou status ${approveRes.status}`);
      }
    }

    // 10. Gerar e resgatar voucher de ativação
    console.log('[TEST] Gerando lote de vouchers no CMS...');
    const genVoucherRes = await request('/api/admin/vouchers/generate', 'POST', { count: 3, days: 30 }, adminToken);
    console.log(`Status de Geração de Vouchers: ${genVoucherRes.status}`);
    const generatedCodes = genVoucherRes.body.codes;

    if (genVoucherRes.status === 201 && generatedCodes && generatedCodes.length > 0) {
      console.log(`✅ TESTE 9 PASSOU: ${generatedCodes.length} vouchers gerados.`);
      const testCode = generatedCodes[0];

      console.log(`[TEST] Resgatando voucher ${testCode} com o estudante...`);
      const redeemRes = await request('/api/vouchers/redeem', 'POST', { code: testCode }, normalToken);
      if (redeemRes.status === 200) {
        console.log('✅ TESTE 10 PASSOU: Voucher validado e ativado com sucesso.');
      } else {
        console.log(`❌ TESTE 10 FALHOU: Retornou status ${redeemRes.status}`);
      }
    }

    // Limpar banco
    console.log('[TEST] Limpando dados de teste criados...');
    await client.query("DELETE FROM users WHERE phone IN ('841111111', '849999999')");
    await client.query("DELETE FROM vouchers WHERE code LIKE 'VILH-%'");

    console.log('\n--- TODOS OS TESTES DE INTEGRAÇÃO ADMINISTRATIVA CONCLUÍDOS ---');
  } catch (err) {
    console.error('[TEST] Erro catastrófico nos testes:', err);
  } finally {
    if (client) {
      await client.end();
    }
    if (server) {
      server.close(() => {
        console.log('[TEST] Servidor encerrado.');
        process.exit(0);
      });
    } else {
      process.exit(0);
    }
  }
}

main();

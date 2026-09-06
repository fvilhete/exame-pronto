const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn('AVISO: A variável de ambiente DATABASE_URL não está configurada. O backend pode falhar ao ligar à base de dados.');
}

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  },
  max: 4,
  idleTimeoutMillis: 15000,
  connectionTimeoutMillis: 5000
});

// Garante que todas as conexões ao Supabase/PostgreSQL utilizam estritamente UTF-8
// prevenindo corrupção de acentos moçambicanos (ã, ç, é, ê) e caracteres matemáticos (², ³, √, ±, Δ)
pool.on('connect', (client) => {
  client.query("SET client_encoding TO 'UTF8'", (err) => {
    if (err) {
      console.warn('Aviso: Não foi possível definir client_encoding para UTF-8:', err.message);
    }
  });
});

// Traduz placeholders do formato SQLite (?) para o formato PostgreSQL ($1, $2, ...)
function translateQuery(query) {
  let index = 1;
  return query.replace(/\?/g, () => `$${index++}`);
}

function run(query, params, callback) {
  let finalParams = params;
  let finalCallback = callback;
  if (typeof params === 'function') {
    finalCallback = params;
    finalParams = [];
  }

  let sql = translateQuery(query);
  
  // Emular this.lastID anexando RETURNING id às queries de inserção
  const isInsert = sql.trim().toUpperCase().startsWith('INSERT');
  if (isInsert && !sql.toUpperCase().includes('RETURNING')) {
    sql += ' RETURNING id';
  }

  pool.query(sql, finalParams, (err, res) => {
    if (err) {
      if (finalCallback) finalCallback(err);
      return;
    }

    const context = {
      changes: res.rowCount,
      lastID: null
    };

    if (isInsert && res.rows && res.rows.length > 0) {
      context.lastID = res.rows[0].id;
    }

    if (finalCallback) {
      finalCallback.call(context, null);
    }
  });
}

const db = {
  get: function(query, params, callback) {
    let finalParams = params;
    let finalCallback = callback;
    if (typeof params === 'function') {
      finalCallback = params;
      finalParams = [];
    }
    pool.query(translateQuery(query), finalParams, (err, res) => {
      if (err) {
        if (finalCallback) finalCallback(err);
      } else {
        if (finalCallback) finalCallback(null, res.rows[0]);
      }
    });
  },

  all: function(query, params, callback) {
    let finalParams = params;
    let finalCallback = callback;
    if (typeof params === 'function') {
      finalCallback = params;
      finalParams = [];
    }
    pool.query(translateQuery(query), finalParams, (err, res) => {
      if (err) {
        if (finalCallback) finalCallback(err);
      } else {
        if (finalCallback) finalCallback(null, res.rows);
      }
    });
  },

  run: run,

  serialize: function(callback) {
    if (callback) callback();
  },

  // Exportar o pool bruto para fins de depuração ou conexões complexas se necessário
  pool: pool
};

console.log('Base de dados: Camada de compatibilidade Supabase/PostgreSQL inicializada.');

module.exports = db;

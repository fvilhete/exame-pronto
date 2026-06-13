const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'database.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to SQLite:', err.message);
    process.exit(1);
  }
});

function queryAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

async function dump() {
  try {
    console.log('Reading exams...');
    const exams = await queryAll('SELECT * FROM exams');
    
    console.log('Reading questions...');
    const questions = await queryAll('SELECT * FROM questions');
    
    console.log('Reading lessons...');
    const lessons = await queryAll('SELECT * FROM lessons');

    const data = { exams, questions, lessons };
    const outputPath = path.join(__dirname, 'dumped_data.json');
    
    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf8');
    console.log('Successfully dumped all data to:', outputPath);
    console.log(`Exams: ${exams.length}, Questions: ${questions.length}, Lessons: ${lessons.length}`);
    db.close();
    process.exit(0);
  } catch (err) {
    console.error('Dump failed:', err.message);
    db.close();
    process.exit(1);
  }
}

dump();

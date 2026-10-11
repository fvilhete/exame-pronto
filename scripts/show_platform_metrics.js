const db = require('../database');

function queryAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows || []);
    });
  });
}

async function showMetrics() {
  console.log('\n========================================================');
  console.log('       STATUS & MÉTRICAS GLOBAIS - EXAMEPRONTO          ');
  console.log('========================================================\n');

  const [totalExams] = await queryAsync('SELECT COUNT(*) as count FROM exams');
  const [totalQuestions] = await queryAsync('SELECT COUNT(*) as count FROM questions');
  const [withSolutions] = await queryAsync("SELECT COUNT(*) as count FROM questions WHERE explanation IS NOT NULL AND length(explanation) > 10");
  const [mozskillsExams] = await queryAsync("SELECT COUNT(*) as count FROM exams WHERE id LIKE '%mozskills%'");
  const [mozskillsQuestions] = await queryAsync("SELECT COUNT(*) as count FROM questions WHERE exam_id LIKE '%mozskills%'");

  console.log(`📚 TOTAL DE EXAMES NO BANCO: ${totalExams.count}`);
  console.log(`   └─ Exames Oficiais MozSkills (2013-2025): ${mozskillsExams.count}`);
  console.log(`\n🎯 TOTAL DE QUESTÕES NO ACERVO: ${totalQuestions.count}`);
  console.log(`   ├─ Questões com Resolução Comentada: ${withSolutions.count} (${Math.round((withSolutions.count / totalQuestions.count) * 100)}%)`);
  console.log(`   └─ Questões Oficiais MozSkills Ingeridas: ${mozskillsQuestions.count}`);

  console.log('\n📊 DISTRIBUIÇÃO DE EXAMES POR DISCIPLINA (SUBJECT):');
  const subjects = await queryAsync(`
    SELECT subject, COUNT(*) as count 
    FROM exams 
    GROUP BY subject 
    ORDER BY count DESC
  `);
  subjects.forEach(s => console.log(`   • ${(s.subject || 'geral').padEnd(20)}: ${s.count.toString().padStart(3)} exames`));

  console.log('\n🏛️ DISTRIBUIÇÃO POR UNIVERSIDADE / INSTITUIÇÃO:');
  const univs = await queryAsync(`
    SELECT COALESCE(university, 'Geral') as university, COUNT(*) as count 
    FROM exams 
    GROUP BY university 
    ORDER BY count DESC
  `);
  univs.forEach(u => console.log(`   • ${u.university.padEnd(20)}: ${u.count.toString().padStart(3)} exames`));

  console.log('\n⚡ ACERVO MOZSKILLS POR DISCIPLINA:');
  const mozBySubj = await queryAsync(`
    SELECT e.subject, COUNT(q.id) as q_count, COUNT(DISTINCT e.id) as e_count
    FROM exams e
    JOIN questions q ON q.exam_id = e.id
    WHERE e.id LIKE '%mozskills%'
    GROUP BY e.subject
    ORDER BY q_count DESC
  `);
  mozBySubj.forEach(m => console.log(`   • ${m.subject.padEnd(15)}: ${m.e_count.toString().padStart(2)} exames | ${m.q_count.toString().padStart(4)} questões comentadas`));

  console.log('\n========================================================\n');
}

showMetrics()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Erro ao buscar métricas:', err);
    process.exit(1);
  });

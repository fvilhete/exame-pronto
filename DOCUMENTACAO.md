# Documentação Oficial e Operacional do Sistema: ExamePronto 4.0
### Plataforma Nacional de Preparação Escolar, Ensino Superior (UEM), Cambridge e Condução
**Propriedade:** Vilhete Solutions | Moçambique  
**Versão Atual:** 4.0 (Produção Global)  
**Data da Revisão:** Setembro de 2026  
**Repositório Oficial:** `https://github.com/fvilhete/exame-pronto.git` (Branch `main`)  

---

## 1. Guia Prático: Como Processar Enunciados em PDF e Fotos/Imagens de Exames

A **Vilhete Solutions** recebe frequentemente enunciados em papel, fotos tiradas com telemóvel ou documentos PDF do Ministério da Educação, INATRO e Comissões de Exames de Admissão. O ExamePronto 4.0 inclui um fluxo simplificado para transformar qualquer prova num simulador interativo em menos de 2 minutos.

### 1.1. Se recebeu uma Foto ou Imagem de Prova em Papel:
1. No seu telemóvel (Android ou iPhone), abra a fotografia no **Google Fotos** ou aponte a câmara com o **Google Lens**.
2. Toque no botão **"Texto"** -> **"Selecionar Tudo"** -> **"Copiar Texto"**.
3. Aceda ao painel Admin do ExamePronto em `/admin` -> Separador **"Adicionar Conteúdo"**.
4. No campo **"Cole aqui o texto do PDF ou da foto do exame"**, cole o texto copiado.
5. Clique em **"🔍 Auto-Formatar e Processar Perguntas"**. O algoritmo inteligente separa automaticamente o número da questão, o enunciado e as opções A, B, C, D (e E se aplicável).
6. Selecione o Exame de destino e clique em **"🚀 Gravar no Supabase"**. As perguntas ficam imediatamente disponíveis online para os estudantes!

### 1.2. Se recebeu um Ficheiro PDF:
1. Abra o ficheiro PDF no seu computador ou telemóvel.
2. Selecione o texto das perguntas com `Ctrl + A` e copie com `Ctrl + C`.
3. Cole no campo de importação do Admin e clique em **"🔍 Auto-Formatar e Processar Perguntas"**.
4. Se o PDF estiver em formato texto simples, também pode carregá-lo diretamente no botão **"Carregar Ficheiro (PDF, TXT, CSV, JSON)"**.

---

## 2. Rede de Distribuição de Raspadinhas em Escolas e Bancas (POS Vilhete Solutions)

Para alcançar os milhares de estudantes em Moçambique que não possuem conta bancária ou têm saldo M-Pesa limitado, o sistema dispõe do **Módulo de Revenda por Agentes Locais**:

### 2.1. Como Funciona o Modelo de Negócio:
* **Ponto de Venda Parceiro:** Papelarias escolares perto de escolas secundárias (ex.: Josina Machel, Francisco Manyanga), bancas de jornais e cantinas.
* **Preço Final ao Aluno:** 49 MT (Acesso Semanal) ou 119 MT (Acesso Mensal).
* **Margem do Revendedor:** 10 MT por cartão vendido (lucro de 20% para a banca).
* **Receita Líquida da Vilhete Solutions:** 39 MT por cartão semanal vendido.

### 2.2. Como Gerar e Imprimir os Cartões:
1. Aceda a `/admin` -> Separador **"🎟️ Vouchers & Raspadinhas"**.
2. Defina a **Quantidade** (ex.: 20 ou 50 cartões), selecione a **Duração** (7 ou 30 dias).
3. Preencha o campo **Agente / Ponto de Venda** (ex.: *"Papelaria Escola Secundária da Matola"*).
4. Clique em **"+ Gerar Lote"**.
5. Clique no botão **"🖨️ Imprimir Cartões de Revenda (A4)"**. O sistema gera automaticamente uma folha A4 com os cartões formatados com a marca oficial da Vilhete Solutions, código com área para raspar, instruções de ativação e WhatsApp de suporte (`+258 849517984`).

---

## 3. Modo "Duelo 1 vs 1" (Batalha de Conhecimento)

Disponível no lobby de **Jogos Educativos** (`/games`):
* **Mecânica:** 5 rodadas rápidas com temporizador decrescente de 15 segundos por pergunta.
* **Pontuação Dinâmica:** 100 pontos base por acerto + bónus de velocidade calculado com base nos segundos restantes.
* **Adversário Inteligente (IA):** O sistema simula um competidor virtual com tempo de resposta humano (5 a 10 segundos) e taxa de acerto realista de 75%.
* **Efeitos e Gamificação:** Sons interativos de acerto e erro via Web Audio API, animação de barras de vida/tempo e ecrã de vitória com fanfarra.

---

## 4. Inovações Inspiradas em Plataformas Internacionais

1. **Flashcards 3D (estilo Quizlet / Anki):**
   * Cartões interativos que viram em 3D ao toque.
   * Contém fórmulas essenciais de Física (\(F = m \cdot a\), \(v = \frac{d}{t}\)), Matemática (Bhaskara, Progressões Aritméticas), regras do Código da Estrada (INATRO) e marcos históricos de Moçambique.
2. **Dica Pedagógica Inteligente ("💡 Pedir Dica" - estilo Khan Academy):**
   * No simulador de exames (Quiz Arena), o aluno pode clicar no botão **"💡 Pedir Dica"** caso esteja com dificuldades. O sistema extrai a essência do raciocínio sem revelar diretamente a letra da resposta correta.
3. **Distribuição PWA Direta (Sem Custos da Play Store):**
   * O ExamePronto funciona como uma **Progressive Web App (PWA)** instalável diretamente pelo navegador (Google Chrome / Safari) tocando em *"Adicionar ao Ecrã Principal"*.
   * Não necessita do pagamento inicial de 25 USD da conta de programador da Google Play Store nem comissões de 15-30% por transação.
   * O Service Worker `v3.7` com estratégia **Network-First** garante funcionamento sem falhas e atualizações automáticas sempre que houver conexão à internet.

---

## 5. Reconhecimento Universal de Caracteres Especiais, Acentos e Fórmulas

O ExamePronto v4.0 possui um motor inteligente de ingestão com suporte total a:
1. **Acentuação Portuguesa Integral:** Acentos agudos, graves, circunflexos, tis e cedilhas (`á, é, í, ó, ú, à, â, ê, ô, ã, õ, ç`) normalizados canonicamente via padrão Unicode NFC.
2. **Símbolos Científicos e Matemáticos:**
   * Potências e Expoentes: `x²`, `x³`, `x⁴`, `m/s²`, `10⁻⁷`, `cm³`.
   * Raízes e Operadores: `√`, `∛`, `±`, `∓`, `×`, `÷`, `·`, `≠`, `≤`, `≥`, `≈`.
   * Letras Gregas & Variáveis: `Δ`, `π`, `θ`, `λ`, `α`, `β`, `μ`, `Ω`.
   * Fórmulas Químicas e Índices: `H₂O`, `CO₂`, `[H⁺]`, `[OH⁻]`, `pH < 7`.
3. **Proteção Contra Ficheiros Windows (ANSI / Windows-1252):**
   * Ficheiros de texto criados no Bloco de Notas ou Excel do Windows frequentemente gravam caracteres em codificação legada ANSI. O sistema deteta automaticamente e converte para UTF-8 sem produzir caracteres corrompidos (``).
   * Ficheiros com marcador UTF-8 BOM (`\uFEFF`) são higienizados na leitura, garantindo que a primeira pergunta do exame seja sempre importada com sucesso.
4. **Renderização Segura de Expressões Lógicas:**
   * Expressões de desigualdade como `x < 4` ou `0 < x < 5` são higienizadas via `escapeHtml()`, prevenindo que o navegador interprete sinais de menor/maior como tags HTML.

---

## 6. Banco Oficial de Exames de Admissão à UEM 2025 (Ensino Superior)

O ExamePronto 4.0 integra o acervo integral dos **20 exames oficiais de admissão de 2025** da **Universidade Eduardo Mondlane (UEM)**, correspondendo a **800 perguntas completas** com opções (A a E), respostas verificadas e soluções comentadas passo a passo.

### 6.1. Catálogo Completo dos 20 Exames UEM 2025:

| # | ID do Exame | Disciplina / Prova Oficial | Ano | Questões | Status no Sistema |
|---|---|---|:---:|:---:|:---:|
| 1 | `uem-bio-1-2025` | **Biologia I** (Citologia, Fotossíntese, Histologia) | 2025 | 40 | ✅ Activo |
| 2 | `uem-bio-2-2025` | **Biologia II** (Genética, Evolução, Fisiologia) | 2025 | 40 | ✅ Activo |
| 3 | `uem-bio-3-2025` | **Biologia III** (Reprodução Humana, Saúde Pública) | 2025 | 40 | ✅ Activo |
| 4 | `uem-fil-2025` | **Filosofia** (Lógica Formal, Filosofia Africana, Ética) | 2025 | 40 | ✅ Activo |
| 5 | `uem-fis-1-2025` | **Física I** (Termodinâmica, Óptica, Física Moderna) | 2025 | 40 | ✅ Activo |
| 6 | `uem-fis-2-2025` | **Física II** (Electromagnetismo, Ondas, Relatividade) | 2025 | 40 | ✅ Activo |
| 7 | `uem-fra-2025` | **Francês** (Interpretação Textual, Gramática e Sintaxe) | 2025 | 40 | ✅ Activo |
| 8 | `uem-geo-1-2025` | **Geografia I** (Geografia Física e Recursos de Moçambique) | 2025 | 40 | ✅ Activo |
| 9 | `uem-geo-2-2025` | **Geografia II** (Geografia Humana, Demografia e Climas) | 2025 | 40 | ✅ Activo |
| 10 | `uem-his-1-2025` | **História I** (Estados Pré-Coloniais, Penetração Mercantil) | 2025 | 40 | ✅ Activo |
| 11 | `uem-his-2-2025` | **História II** (Luta Armada de Libertação, FRELIMO, Paz) | 2025 | 40 | ✅ Activo |
| 12 | `uem-ing-2025` | **Inglês** (Reading Comprehension, Idioms, Advanced Grammar) | 2025 | 40 | ✅ Activo |
| 13 | `uem-mat-1-2025` | **Matemática I** (Funções, Inequações Modulares, Limites) | 2025 | 40 | ✅ Activo |
| 14 | `uem-mat-2-2025` | **Matemática II** (Progressões, Derivadas e Optimização) | 2025 | 40 | ✅ Activo |
| 15 | `uem-mat-3-2025` | **Matemática III** (Trigonometria, Análise Combinatória, Probabilidades) | 2025 | 40 | ✅ Activo |
| 16 | `uem-por-1-2025` | **Português I** (Interpretação Textual, Gramática Normativa) | 2025 | 40 | ✅ Activo |
| 17 | `uem-por-2-2025` | **Português II** (Defesa da Leitura, Sintaxe e Estilística) | 2025 | 40 | ✅ Activo |
| 18 | `uem-por-3-2025` | **Português III** (Ensaio Mia Couto, Literatura Moçambicana) | 2025 | 40 | ✅ Activo |
| 19 | `uem-qui-1-2025` | **Química I** (Cinética, Equilíbrio Químico, Orgânica) | 2025 | 40 | ✅ Activo |
| 20 | `uem-qui-2-2025` | **Química II** (Electroquímica, pH, Soluções e Polímeros) | 2025 | 40 | ✅ Activo |

### 6.2. Como o Candidato Estuda e Pratica:
1. No menu principal ou no topo do site, selecione o nível **"Ensino Superior (Admissão UEM)"**.
2. Na lista pendente de exames, o aluno visualiza todas as 20 provas oficiais UEM 2025 organizadas por disciplina.
3. Ao iniciar o exame:
   * **Temporizador Oficial:** 90 minutos de contagem regressiva, simulando as condições reais da prova presencial da UEM.
   * **Navegação por Questão:** O aluno pode avançar, retroceder e marcar perguntas para rever antes de submeter.
   * **Gabarito e Soluções Detalhadas:** Ao concluir a prova, o sistema calcula a pontuação oficial em escala de 0 a 20 valores e apresenta a explicação fundamentada de cada resposta.

### 6.3. Proteção e Conversão Freemium:
* **Perguntas 1 a 3 Gratuitas:** Qualquer estudante pode realizar as 3 primeiras perguntas de qualquer exame sem pagar nada para atestar a alta qualidade pedagógica do ExamePronto.
* **Perguntas 4 a 40 Protegidas:** Ao atingir a 4ª questão, uma janela elegante de desbloqueio surge convidando o estudante a inserir o código da sua **Raspadinha Vilhete Solutions** ou efetuar pagamento via **M-Pesa** (`849517984`) ou **mKesh** (`826727204`).
* A ativação desbloqueia instantaneamente todas as 40 perguntas do exame, permitindo treinar repetidas vezes.

---

## 7. Arquitetura de Produção, Deploy e Banco de Dados

* **Hospedagem Web:** Vercel Global Edge Network com deploy automático acionado por push na branch `main` do GitHub.
* **Base de Dados:** Supabase PostgreSQL com pooling de conexões seguro via SSL e codificação forçada `UTF8` (`DATABASE_URL`).
* **Segurança de Pagamentos:** Zero custos de comissão de intermediários; validação administrativa e ativação instantânea por raspadinhas de 12 dígitos com verificação de uso único no banco de dados.
* **Canal Oficial de Atendimento:** WhatsApp Vilhete Solutions (`+258 849517984`).


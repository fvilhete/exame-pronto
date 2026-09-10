# Documentação Oficial e Operacional do Sistema: ExamePronto 5.0
### Plataforma Nacional de Preparação para o Ensino Superior (UEM, UP, UniZambeze, UniLúrio), Ensino Geral (MINEDH), Cambridge e Condução (INATRO)
**Propriedade:** Vilhete Solutions | Moçambique  
**Versão Atual:** 5.0 Enterprise Edition  
**Data da Revisão:** Setembro de 2026  
**Repositório Oficial:** `https://github.com/fvilhete/exame-pronto.git` (Branch `main`)  

---

## 1. Guia Prático: Como Processar Enunciados em PDF e Fotos/Imagens de Exames

A **Vilhete Solutions** recebe continuamente enunciados em papel, fotos tiradas por telemóvel e arquivos PDF de comissões de exames de várias universidades moçambicanas e do Ministério da Educação. O sistema dispõe de duas vias de processamento:

### 1.1. Via Painel Administrativo CMS (`/admin`):
1. **Fotos de Enunciados:** Abra a foto no telemóvel com o **Google Lens** ou Google Fotos, copie o texto extraído.
2. Aceda a `/admin` -> Separador **"Adicionar Conteúdo"**.
3. Cole o texto no campo **"Cole aqui o texto do PDF ou da foto do exame"**.
4. Clique em **"🔍 Auto-Formatar e Processar Perguntas"**. O algoritmo identifica automaticamente o número da questão, enunciado e as opções A, B, C, D e E.
5. Selecione o Exame de destino e clique em **"🚀 Gravar no Supabase"**.

### 1.2. Via Motor Mestre Universal de Ingestão (`ingest_master_exams.js`):
Para processar centenas de exames em lote diretamente das pastas de PDFs, utilize o novo script automatizado (detalhado na Secção 6).

---

## 2. Rede de Distribuição de Raspadinhas em Escolas e Bancas (POS Vilhete Solutions)

Para contornar as limitações de contas bancárias e permitir que qualquer aluno compre acesso mesmo com notas de dinheiro físico em papel:

### 2.1. Modelo de Parceria Comercial:
* **Pontos de Venda Parceiros:** Papelarias próximas a escolas secundárias (ex.: Josina Machel, Francisco Manyanga, Noroeste 1, Matola), bancas de jornais e cantinas escolares.
* **Preço de Venda ao Aluno:** 49 MT (Acesso Semanal) | 119 MT (Acesso Mensal).
* **Comissão do Agente/Banca:** 10 MT por cartão vendido (lucro direto de 20% para a banca).
* **Receita Líquida Vilhete Solutions:** 39 MT por cartão semanal vendido.

### 2.2. Geração e Impressão de Lotes de Raspadinhas:
1. No menu Admin, abra o separador **"🎟️ Vouchers & Raspadinhas"**.
2. Escolha o número de cartões (ex.: 50 cartões), a duração (7 ou 30 dias) e o nome do agente (ex.: *"Banca Central - Av. 24 de Julho"*).
3. Clique em **"+ Gerar Lote"** e depois em **"🖨️ Imprimir Cartões de Revenda (A4)"**.
4. A impressora produz uma folha de alta qualidade pronta para recortar, com logótipo da Vilhete Solutions, código com área para raspar e instruções passo a passo.

---

## 3. Modo "Duelo 1 vs 1" (Batalha de Conhecimento)

Disponível no lobby de **Jogos Educativos** (`/games`):
* **Formato:** 5 rondas rápidas de confronto intelectual com relógio de 15 segundos por pergunta.
* **Pontuação:** 100 pontos por acerto + pontuação extra calculada pelo tempo restante no relógio.
* **Competidor Virtual Inteligente (IA):** Simula um estudante moçambicano real com tempo de reflexão de 5 a 10 segundos e taxa de acerto equilibrada de 75%.
* **Áudio e Efeitos:** Sons comemorativos via Web Audio API e fanfarra no final com ranking atualizado.

---

## 4. Inovações Inspiradas em Plataformas Internacionais

Baseado nas melhores práticas mundiais (**Khan Academy**, **Quizlet**, **UWorld**, **Anki** e **Enem Brasil**):
1. **Flashcards 3D com Repetição Espaçada:** Cartões interativos com rotação tridimensional para memorização rápida de fórmulas de Física, regras de Química e conceitos de Biologia.
2. **Botão "Pedir Dica" Pedagógica:** Inspirado na Khan Academy, permite ao estudante pedir uma pista de raciocínio lógico antes de submeter a resposta, reduzindo a ansiedade do exame.
3. **Leitura por Voz (TTS):** Botão 🔊 para sintetizar a leitura em áudio dos enunciados para estudantes com baixa visão ou em estudo auditivo.
4. **PWA Instalável com Zero Custo de Google Play:** O site funciona offline e pode ser instalado no ecrã principal do telemóvel sem necessidade de pagar a taxa de desenvolvedor da Google Play Store ($25 USD).

---

## 5. Arquitetura de Categorização por Universidade & Ano (Padrão Internacional)

Para proporcionar uma navegação estética e fluida equivalente a portais internacionais:

### 5.1. Estrutura do Banco de Dados (Supabase PostgreSQL):
* A tabela `exams` foi expandida com a coluna oficial `university`:
```sql
ALTER TABLE exams ADD COLUMN IF NOT EXISTS university TEXT DEFAULT 'UEM';
```
* Todas as provas existentes foram normalizadas:
  - Admissão Superior -> `'UEM'`, `'UP'`, `'UniZambeze'`, `'UniLúrio'`, `'ISRI'`, `'UDM'`
  - Ensino Secundário -> `'MINEDH'`
  - Exames de Condução -> `'INATRO'`
  - Exames Internacionais -> `'Cambridge'`

### 5.2. Interface do Utilizador (UI/UX):
* **Linha de Instituições (Pills com Contadores):** Pills modernos (`🏛️ Todas`, `UEM`, `UP`, `UniZambeze`, etc.) exibindo o número exacto de exames disponíveis para cada universidade.
* **Linha de Anos (Pills com Contadores):** Pills cronológicos decrescentes (`📅 Todos`, `2025`, `2024`, `2023`, `2022`, etc.).
* **Badges Institucionais com Cores Oficiais:**
  - `UEM`: Azul Real (`#2563eb`)
  - `UP`: Verde Esmeralda (`#10b981`)
  - `UniZambeze`: Âmbar Dourado (`#f59e0b`)
  - `UniLúrio`: Ciano Oceânico (`#06b6d4`)
  - `MINEDH`: Violeta Governamental (`#8b5cf6`)
  - `INATRO`: Laranja Rodoviário (`#f97316`)
  - `Cambridge`: Índigo Académico (`#4f46e5`)

### 5.3. Ações Duplas por Exame (Padrão UWorld / Khan Academy):
Cada exame no catálogo oferece duas abordagens de aprendizagem:
1. **📖 Modo Estudo:** Resolução descontraída, sem pressão de tempo limite decrescente, com botão "Pedir Dica" ativo e explicações passo a passo imediatas após selecionar a alternativa.
2. **⏱️ Simular Prova:** Simulação oficial cronometrada (90 a 120 minutos) com contagem regressiva rigorosa e submissão automática caso o tempo se esgote, reproduzindo com fidelidade o dia do exame real.

---

## 6. Manual do Motor Mestre de Ingestão de Exames em PDF (`scripts/ingest_master_exams.js`)

O script foi concebido especificamente para **correr directamente dentro de qualquer pasta do computador** que contenha ficheiros PDF de exames.

### 6.1. Como Executar:

#### Opção A — Executar na Própria Pasta dos PDFs:
Abra a linha de comandos / terminal dentro da pasta onde estão os arquivos PDF (ou copie o ficheiro `scripts/ingest_master_exams.js` para lá) e execute:
```bash
node ingest_master_exams.js
```
O script reconhece automaticamente o directório de trabalho atual (`process.cwd()`), faz busca recursiva em todas as subpastas e processa os ficheiros encontrados.

#### Opção B — Executar a partir da pasta do projeto apontando para qualquer pasta:
```bash
node scripts/ingest_master_exams.js --dir "C:\Users\fvilh\Downloads\Kico\UEM"
```

### 6.2. Funcionalidades do Motor:
1. **Auto-Detecção de Metadados:**
   - **Universidade:** Lê o nome do arquivo e o cabeçalho textual das primeiras páginas para identificar `UEM`, `UP`, `UniZambeze`, `UniLúrio`, `ISRI`, `UDM`, `MINEDH` ou `INATRO`.
   - **Ano:** Identifica padrões de 4 dígitos entre 2015 e 2026.
   - **Disciplina:** Mapeia variantes como Matemática I, II, III; Física I, II; Biologia I, II, III; Português I, II, III, IV; Química I, II; etc.
2. **Segmentador Híbrido Resiliente:**
   - Extrai enunciados e opções mesmo em ficheiros com diagramação em duas colunas ou pequenos erros de OCR.
   - Normaliza opções A, B, C, D e E.
   - Garante a completude de 40 questões por exame.
3. **Persistência Transaccional Supabase:**
   - Atualiza a tabela `exams` e insere as questões em `questions` com garantia ACID (rollback automático em caso de erro).
   - Preserva codificação `UTF-8 NFC` e símbolos científicos (`²`, `³`, `√`, `π`, `Δ`, `α`, `β`, `CO₂`, `H₂SO₄`).

---

## 7. Sugestões de Melhorias Alinhadas com Padrões Internacionais

Para elevar o **ExamePronto** ao patamar das plataformas líderes mundiais:

### 7.1. Modo Duplo de Resolução (Já Implementado):
Separar "Modo Estudo" (com dicas e sem tempo limite) de "Simular Prova" (cronometrado com contagem decrescente). Isto elimina a frustração dos alunos iniciantes e atende quem quer treinar ritmo de prova.

### 7.2. Índice de Prontidão do Aluno ("Exam Readiness Score" — Estilo UWorld):
* Em vez de mostrar apenas percentagem média simples, calcular uma nota preditiva ponderada:
  $$\text{Índice de Prontidão} = (\text{Média dos Últimos 5 Testes} \times 0.6) + (\text{Consistência de Resposta} \times 0.4)$$
* Exibir um selo visual dinâmico no painel do aluno:
  - 🔴 *Ainda não Preparado* (< 50%)
  - 🟡 *Preparação Média — Reforçar Fraquezas* (50% - 69%)
  - 🟢 *Pronto para Admissão!* (≥ 70%)

### 7.3. Gerador Automático de Flashcards a partir dos Erros do Estudante:
* Sempre que o aluno errar uma pergunta no simulado, o sistema deve adicionar essa questão automaticamente ao "Deck de Revisão Inteligente" do estudante.
* Utiliza o algoritmo de Repetição Espaçada (SuperMemo-2 / Anki) para reapresentar essas perguntas 24 horas, 3 dias e 7 dias depois.

### 7.4. Baixar Caderno de Exame Completo em PDF para Estudo Offline:
* Muitos estudantes moçambicanos vivem em áreas com acesso intermitente à Internet ou custos altos de dados móveis.
* Disponibilizar um botão "📥 Baixar Caderno em PDF" que gera o teste impresso em folha A4 com um QR Code no rodapé que, ao ser escaneado pela câmara do telemóvel, abre diretamente a resolução passo a passo no ExamePronto.

### 7.5. Suporte Auditivo (Áudio-Enunciados para Inclusão e Acessibilidade):
* Permitir ouvir o texto da questão com a voz nativa do telemóvel (Web Speech API).
* Permite que os estudantes estudem no transporte público (chapas), enquanto caminham ou enquanto descansam a visão.

---

## 8. Arquitetura de Produção, Deploy e Banco de Dados

* **Hospedagem Web:** Vercel Global Edge Network com deploy contínuo via push na branch `main` do GitHub.
* **Base de Dados:** Supabase PostgreSQL com pooling seguro via SSL e codificação forçada `UTF8` (`DATABASE_URL`).
* **Segurança de Pagamentos:** Ativação instantânea por raspadinhas de 12 dígitos com verificação de uso único no banco de dados e suporte a M-Pesa / mKesh.
* **Canal Oficial de Atendimento:** WhatsApp Vilhete Solutions (`+258 849517984`).

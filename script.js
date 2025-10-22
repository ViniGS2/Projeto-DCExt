document.addEventListener('DOMContentLoaded', () => {
    // ===== NOVO: Variável Global "Fonte da Verdade" =====
    let decks = []; // Este array guardará TODOS os dados
    
    // Variáveis globais (como antes)
    let deckAtual = null; // Guarda o ELEMENTO HTML do deck sendo editado
    let deckSendoEstudado = null; // Guarda o ARRAY de flashcards para estudo
    let cardAtualIndex = 0; 

    // Elementos principais
    const container = document.getElementById('container-decks');
    
    // Elementos da Janela Criar Deck
    const janelaCriar = document.getElementById('janela-criar');
    const btnConfirmar = document.getElementById('confirmar');
    const nomeInput = document.querySelector('input[name="nome-deck"]');

    // Elementos da Janela Criar/Editar Flashcard
    const janelaEditar = document.getElementById('janela-criar-flashcard');
    const btnConfirmarEditar = document.getElementById('confirmarEditar');
    const frenteInput = document.getElementById('frente-flashcard-img');
    const versoInput = document.getElementById('verso-flashcard-img');
    
    // Elementos da Janela Estudar
    const janelaEstudar = document.getElementById('janela-estudar');
    const flashcardEstudo = document.getElementById('flashcard-estudo');
    const btnProximo = document.getElementById('card-proximo');
    const btnAnterior = document.getElementById('card-anterior');

    
    // --- FUNÇÕES DE DADOS (LocalStorage) ---

    // ===== NOVO: Salva o array 'decks' no localStorage =====
    function salvarDecks() {
        localStorage.setItem('signCardDecks', JSON.stringify(decks));
    }

    // ===== NOVO: Desenha os decks do array 'decks' no HTML =====
    function renderizarTodosDecks() {
        container.innerHTML = ''; // Limpa o container

        decks.forEach(deckData => {
            // Cria o elemento do deck
            const novoDeck = document.createElement('div');
            novoDeck.classList.add('Deck');
            
            // ===== NOVO: Adiciona um 'data-id' para sabermos qual deck é =====
            novoDeck.dataset.id = deckData.id;

            // Usa o HTML com o layout corrigido (que fizemos antes)
            novoDeck.innerHTML = `
                <h2>${deckData.name}</h2>
                <p>${deckData.flashcards.length} card${deckData.flashcards.length !== 1 ? 's' : ''}</p>
                <button class="botao-estudar">Estudar</button>
                <button class="botao-editar">✒️</button> 
                <button class="botao-deletar">🗑️</button>
                </div>
            `;
            container.appendChild(novoDeck);
        });
    }

    // ===== NOVO: Carrega os decks do localStorage ao iniciar =====
    function carregarDecks() {
        const decksSalvos = localStorage.getItem('signCardDecks');
        if (decksSalvos) {
            decks = JSON.parse(decksSalvos);
            renderizarTodosDecks();
        }
    }


    // --- FUNÇÕES DE JANELA (Como antes, com pequenas mudanças) ---

    function abrirCriar(){
        janelaCriar.classList.add('abrir');
    }
    window.abrirCriar = abrirCriar;

    function AbrirEditar(){
        janelaEditar.classList.add('abrir');
    }

    // Esta função agora é usada para *salvar* (converter para DataURL)
    function lerArquivoComoURL(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    // ===== MODIFICADO: Não precisa mais ser 'async' =====
    // A função agora recebe DataURLs de texto, não arquivos
    function mostrarCard(index) {
        if (!deckSendoEstudado || !deckSendoEstudado[index]) return;

        const card = deckSendoEstudado[index];
        const frenteEl = document.getElementById('flashcard-frente');
        const versoEl = document.getElementById('flashcard-verso');
        const contadorEl = document.getElementById('contador-cards');

        // Limpa o conteúdo anterior
        frenteEl.innerHTML = '';
        versoEl.innerHTML = '';

        // ===== SIMPLIFICADO: Apenas joga a string DataURL no 'src' =====
        try {
            frenteEl.innerHTML = `<img src="${card.frente}" alt="Frente">`;
            versoEl.innerHTML = `<img src="${card.verso}" alt="Verso">`;
        } catch (error) {
            console.error("Erro ao mostrar imagem do flashcard:", error);
            frenteEl.innerHTML = 'Erro ao carregar imagem';
        }

        contadorEl.textContent = `${index + 1} / ${deckSendoEstudado.length}`;
        flashcardEstudo.classList.remove('is-flipped');
    }

    // ===== MODIFICADO: 'deck' agora é o objeto de DADOS, não o HTML =====
    function abrirJanelaEstudar(deckData) {
        if (!deckData.flashcards || deckData.flashcards.length === 0) {
            alert("Este deck está vazio! Adicione cards no botão ✒️.");
            return;
        }

        deckSendoEstudado = deckData.flashcards; // Define o deck que vamos estudar
        cardAtualIndex = 0; // Começa do primeiro card

        janelaEstudar.classList.add('abrir');
        mostrarCard(cardAtualIndex); // Mostra o primeiro card
    }

    
    // --- LISTENERS (Ouvintes de Eventos) ---

    // 1. Listeners para fechar Janelas (Sem mudanças)
    if (janelaCriar) {
        janelaCriar.addEventListener('click', (e) => {
            if (e.target.id == 'fechar-criar' || e.target.id == 'janela-criar') {
                janelaCriar.classList.remove('abrir');
            }
        });
    }
    if (janelaEditar) {
        janelaEditar.addEventListener('click', (e) => {
            if (e.target.id == 'fechar-flashcard' || e.target.id == 'janela-criar-flashcard') {
                janelaEditar.classList.remove('abrir');
            }
        });
    }
    if (janelaEstudar) {
        janelaEstudar.addEventListener('click', (e) => {
            if (e.target.id == 'fechar-estudar' || e.target.id == 'janela-estudar') {
                janelaEstudar.classList.remove('abrir');
                deckSendoEstudado = null; 
            }
        });
    }

    // 2. Listeners de Navegação/Estudo (Sem mudanças)
    if (flashcardEstudo) {
        flashcardEstudo.addEventListener('click', () => {
            flashcardEstudo.classList.toggle('is-flipped');
        });
    }
    if (btnProximo) {
        btnProximo.addEventListener('click', () => {
            if (deckSendoEstudado && cardAtualIndex < deckSendoEstudado.length - 1) {
                cardAtualIndex++;
                mostrarCard(cardAtualIndex);
            }
        });
    }
    if (btnAnterior) {
        btnAnterior.addEventListener('click', () => {
            if (deckSendoEstudado && cardAtualIndex > 0) {
                cardAtualIndex--;
                mostrarCard(cardAtualIndex);
            }
        });
    }


    // 3. ===== MODIFICADO: Listener para Adicionar FLASHCARD =====
    // Esta função agora precisa ser 'async' para converter as imagens
    if (btnConfirmarEditar) {
        btnConfirmarEditar.addEventListener('click', async () => { // <== TORNAR ASYNC
            
            const frenteImagem = frenteInput?.files[0];
            const versoImagem = versoInput?.files[0];

            if (!frenteImagem || !versoImagem) {
                alert("Selecione imagens para frente e verso antes de confirmar!");
                return;
            }

            if (deckAtual) { // 'deckAtual' é o elemento HTML
                try {
                    // ===== NOVO: Converte os arquivos para DataURL (texto) =====
                    const [frenteURL, versoURL] = await Promise.all([
                        lerArquivoComoURL(frenteImagem),
                        lerArquivoComoURL(versoImagem)
                    ]);

                    // ===== NOVO: Encontra o deck no nosso array 'decks' =====
                    const deckId = Number(deckAtual.dataset.id);
                    const deckNoDb = decks.find(d => d.id === deckId);

                    if (deckNoDb) {
                        // Adiciona as strings de imagem ao array
                        deckNoDb.flashcards.push({
                            frente: frenteURL,
                            verso: versoURL
                        });
                        
                        salvarDecks(); // Salva no localStorage

                        // Atualiza o contador no HTML
                        const contador = deckAtual.querySelector('p');
                        const count = deckNoDb.flashcards.length;
                        contador.textContent = `${count} card${count > 1 ? 's' : ''}`;
                    }
                    
                    // limpa inputs e fecha
                    frenteInput.value = "";
                    versoInput.value = "";
                    janelaEditar.classList.remove('abrir');

                } catch (err) {
                    alert("Erro ao converter imagens.");
                    console.error(err);
                }
            } else {
                alert("Nenhum deck selecionado para editar.");
            }
        });
    }

    // 4. ===== MODIFICADO: Listener do CONTAINER (Deletar, Editar, Estudar) =====
    if (container) {
        container.addEventListener('click', (e) => {
            const deckElemento = e.target.closest('.Deck');
            if (!deckElemento) return; 

            // ===== NOVO: Pega o ID do deck a partir do data-id =====
            const deckId = Number(deckElemento.dataset.id);

            // Ação: DELETAR
            if (e.target.classList.contains('botao-deletar')) {
                if (confirm(`Tem certeza que quer deletar o deck "${deckElemento.querySelector('h2').textContent}"?`)) {
                    
                    // ===== NOVO: Remove do array 'decks' e re-renderiza =====
                    decks = decks.filter(d => d.id !== deckId);
                    salvarDecks();
                    renderizarTodosDecks(); // O deck sumirá da tela
                }
            }

            // Ação: EDITAR (Abrir janela de flashcards)
            if (e.target.classList.contains('botao-editar')) {
                // 'deckAtual' ainda é o elemento HTML, o que está correto.
                deckAtual = deckElemento; 
                AbrirEditar();
            }

            // Ação: ESTUDAR
            if (e.target.classList.contains('botao-estudar')) {
                // ===== NOVO: Encontra o objeto de DADOS e passa para a função =====
                const deckData = decks.find(d => d.id === deckId);
                if (deckData) {
                    abrirJanelaEstudar(deckData);
                }
            }
        });
    }

    // 5. ===== MODIFICADO: Listener para Criar novo DECK =====
    if (btnConfirmar) {
        btnConfirmar.addEventListener('click', () => {
            const nomeDeck = nomeInput ? nomeInput.value.trim() : '';
            if (nomeDeck == "") {
                alert("Digite um nome para o deck!");
                return;
            }

            // ===== NOVO: Cria um objeto de DADOS, em vez de HTML =====
            const novoDeckObj = {
                id: Date.now(), // ID único baseado no tempo atual
                name: nomeDeck,
                flashcards: []
            };

            // ===== NOVO: Adiciona ao array 'decks' e salva/renderiza =====
            decks.push(novoDeckObj);
            salvarDecks();
            renderizarTodosDecks(); // O novo deck aparecerá na tela

            nomeInput.value = "";
            janelaCriar.classList.remove('abrir');
        });
    }


    // --- INICIALIZAÇÃO ---
    // ===== NOVO: Carrega tudo do localStorage quando a página abre =====
    carregarDecks();
});
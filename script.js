document.addEventListener('DOMContentLoaded', () => {
    // ===== Variável Global "Fonte da Verdade" =====
    let decks = []; // Este array guardará TODOS os dados
    
    // Variáveis globais
    let deckAtual = null; // Guarda o ELEMENTO HTML do deck sendo editado
    let deckSendoEstudado = null; // Guarda o ARRAY de flashcards para estudo
    let cardAtualIndex = 0; 

    // ===== NOVO: Variáveis para URLs temporárias (Blobs) =====
    // Precisamos delas para o IndexedDB
    let tempFrenteURL = null;
    let tempVersoURL = null;

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

    
    // --- FUNÇÕES DE DADOS (localForage / IndexedDB) ---

    // ===== MODIFICADO: Salva o array 'decks' no IndexedDB (assíncrono) =====
    async function salvarDecks() {
        try {
            // Não precisa de JSON.stringify! localForage cuida disso.
            await localforage.setItem('signCardDecks', decks);
        } catch (err) {
            console.error("Erro ao salvar no localForage:", err);
        }
    }

    // ===== SEM MUDANÇAS: Desenha os decks do array 'decks' no HTML =====
    function renderizarTodosDecks() {
        container.innerHTML = ''; // Limpa o container

        decks.forEach(deckData => {
            // Cria o elemento do deck
            const novoDeck = document.createElement('div');
            novoDeck.classList.add('Deck');
            
            // Adiciona um 'data-id'
            novoDeck.dataset.id = deckData.id;

            // Usa o HTML com o layout corrigido
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

    // ===== MODIFICADO: Carrega os decks do IndexedDB ao iniciar (assíncrono) =====
    async function carregarDecks() {
        try {
            // Não precisa de JSON.parse!
            const decksSalvos = await localforage.getItem('signCardDecks');
            if (decksSalvos) {
                decks = decksSalvos;
                renderizarTodosDecks();
            }
        } catch (err) {
            console.error("Erro ao carregar do localForage:", err);
        }
    }


    // --- FUNÇÕES DE JANELA ---

    function abrirCriar(){
        janelaCriar.classList.add('abrir');
    }
    window.abrirCriar = abrirCriar;

    function AbrirEditar(){
        janelaEditar.classList.add('abrir');
    }

    // ===== REMOVIDO: A função lerArquivoComoURL() não é mais necessária =====
    // Não vamos mais converter imagens para DataURL (texto).


    // ===== MODIFICADO: Usa URL.createObjectURL() para mostrar os Arquivos =====
    // Os cards agora guardam o Objeto "File", não um texto de URL.
    function mostrarCard(index) {
        if (!deckSendoEstudado || !deckSendoEstudado[index]) return;

        const card = deckSendoEstudado[index];
        const frenteEl = document.getElementById('flashcard-frente');
        const versoEl = document.getElementById('flashcard-verso');
        const contadorEl = document.getElementById('contador-cards');

        // Limpa o conteúdo anterior
        frenteEl.innerHTML = '';
        versoEl.innerHTML = '';

        // ===== NOVO: Limpa as URLs temporárias antigas =====
        // Isso é crucial para não vazar memória!
        if (tempFrenteURL) URL.revokeObjectURL(tempFrenteURL);
        if (tempVersoURL) URL.revokeObjectURL(tempVersoURL);

        // ===== NOVO: Cria URLs temporárias (Blob) para os Arquivos =====
        try {
            // card.frente e card.verso são Objetos "File"
            tempFrenteURL = URL.createObjectURL(card.frente);
            tempVersoURL = URL.createObjectURL(card.verso);

            frenteEl.innerHTML = `<img src="${tempFrenteURL}" alt="Frente">`;
            versoEl.innerHTML = `<img src="${tempVersoURL}" alt="Verso">`;
        } catch (error) {
            console.error("Erro ao criar URL do objeto:", error);
            frenteEl.innerHTML = 'Erro ao carregar imagem';
        }

        contadorEl.textContent = `${index + 1} / ${deckSendoEstudado.length}`;
        flashcardEstudo.classList.remove('is-flipped');
    }

    // ===== SEM MUDANÇAS (Função em si) =====
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

    // 1. Listeners para fechar Janelas
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
    // ===== MODIFICADO: Listener de fechar 'Estudar' agora limpa as URLs =====
    if (janelaEstudar) {
        janelaEstudar.addEventListener('click', (e) => {
            if (e.target.id == 'fechar-estudar' || e.target.id == 'janela-estudar') {
                janelaEstudar.classList.remove('abrir');
                deckSendoEstudado = null; 
                
                // ===== NOVO: Limpa as URLs temporárias ao fechar a janela =====
                if (tempFrenteURL) URL.revokeObjectURL(tempFrenteURL);
                if (tempVersoURL) URL.revokeObjectURL(tempVersoURL);
                tempFrenteURL = null;
                tempVersoURL = null;
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


    // 3. ===== MODIFICADO: Listener para Adicionar FLASHCARD (Salva o Arquivo) =====
    if (btnConfirmarEditar) {
        btnConfirmarEditar.addEventListener('click', async () => { // <== TORNAR ASYNC
            
            // Pegamos os OBJETOS "File"
            const frenteImagem = frenteInput?.files[0];
            const versoImagem = versoInput?.files[0];

            if (!frenteImagem || !versoImagem) {
                alert("Selecione imagens para frente e verso antes de confirmar!");
                return;
            }

            if (deckAtual) { // 'deckAtual' é o elemento HTML
                try {
                    // ===== REMOVIDO: Não precisamos converter para DataURL =====
                    
                    const deckId = Number(deckAtual.dataset.id);
                    const deckNoDb = decks.find(d => d.id === deckId);

                    if (deckNoDb) {
                        // ===== NOVO: Adiciona os OBJETOS "File" diretamente =====
                        deckNoDb.flashcards.push({
                            frente: frenteImagem,
                            verso: versoImagem
                        });
                        
                        await salvarDecks(); // Salva no IndexedDB

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
                    alert("Erro ao salvar flashcard.");
                    console.error(err);
                }
            } else {
                alert("Nenhum deck selecionado para editar.");
            }
        });
    }

    // 4. ===== MODIFICADO: Listener do CONTAINER (Deletar precisa ser async) =====
    if (container) {
        container.addEventListener('click', async (e) => { // <== TORNAR ASYNC
            const deckElemento = e.target.closest('.Deck');
            if (!deckElemento) return; 

            const deckId = Number(deckElemento.dataset.id);

            // Ação: DELETAR
            if (e.target.classList.contains('botao-deletar')) {
                if (confirm(`Tem certeza que quer deletar o deck "${deckElemento.querySelector('h2').textContent}"?`)) {
                    
                    // Remove do array 'decks'
                    decks = decks.filter(d => d.id !== deckId);
                    
                    await salvarDecks(); // <== ADICIONAR AWAIT
                    renderizarTodosDecks(); // O deck sumirá da tela
                }
            }

            // Ação: EDITAR (Abrir janela de flashcards) - Sem mudança
            if (e.target.classList.contains('botao-editar')) {
                deckAtual = deckElemento; 
                AbrirEditar();
            }

            // Ação: ESTUDAR - Sem mudança
            if (e.target.classList.contains('botao-estudar')) {
                const deckData = decks.find(d => d.id === deckId);
                if (deckData) {
                    abrirJanelaEstudar(deckData);
                }
            }
        });
    }

    // 5. ===== MODIFICADO: Listener para Criar novo DECK (precisa ser async) =====
    if (btnConfirmar) {
        btnConfirmar.addEventListener('click', async () => { // <== TORNAR ASYNC
            const nomeDeck = nomeInput ? nomeInput.value.trim() : '';
            if (nomeDeck == "") {
                alert("Digite um nome para o deck!");
                return;
            }

            // Cria um objeto de DADOS
            const novoDeckObj = {
                id: Date.now(), // ID único
                name: nomeDeck,
                flashcards: []
            };

            // Adiciona ao array 'decks' e salva/renderiza
            decks.push(novoDeckObj);
            await salvarDecks(); // <== ADICIONAR AWAIT
            renderizarTodosDecks(); // O novo deck aparecerá na tela

            nomeInput.value = "";
            janelaCriar.classList.remove('abrir');
        });
    }


    // --- INICIALIZAÇÃO ---
    // ===== MODIFICADO: Carrega tudo do localForage (IndexedDB) =====
    carregarDecks();
});
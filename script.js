document.addEventListener('DOMContentLoaded', () => {
    // Variáveis globais
    let deckAtual = null; // Guarda o ELEMENTO HTML do deck sendo editado
    let deckSendoEstudado = null; // Guarda o ARRAY de flashcards para estudo
    let cardAtualIndex = 0; // Guarda o índice do card atual

    // Elementos principais
    const container = document.getElementById('container-decks');
    
    // Elementos da Janela Criar Deck
    const janelaCriar = document.getElementById('janela-criar');
    const btnConfirmar = document.getElementById('confirmar');

    // Elementos da Janela Criar/Editar Flashcard
    const janelaEditar = document.getElementById('janela-criar-flashcard');
    const btnConfirmarEditar = document.getElementById('confirmarEditar');
    
    // Elementos da Janela Estudar
    const janelaEstudar = document.getElementById('janela-estudar');
    const flashcardEstudo = document.getElementById('flashcard-estudo');
    const btnProximo = document.getElementById('card-proximo');
    const btnAnterior = document.getElementById('card-anterior');

    // --- FUNÇÕES ---

    // 1. Abrir janela de criar deck
    function abrirCriar(){
        janelaCriar.classList.add('abrir');
    }
    // Expõe a função para o HTML (onclick="abrirCriar()")
    window.abrirCriar = abrirCriar;

    // 2. Abrir janela de editar flashcard
    function AbrirEditar(){
        janelaEditar.classList.add('abrir');
    }

    // 3. Função para ler arquivo de imagem como URL
    function lerArquivoComoURL(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    // 4. Função para mostrar o card atual na janela de estudo
    async function mostrarCard(index) {
        if (!deckSendoEstudado || !deckSendoEstudado[index]) return;

        const card = deckSendoEstudado[index];
        const frenteEl = document.getElementById('flashcard-frente');
        const versoEl = document.getElementById('flashcard-verso');
        const contadorEl = document.getElementById('contador-cards');

        // Limpa o conteúdo anterior
        frenteEl.innerHTML = '';
        versoEl.innerHTML = '';

        try {
            // Lê os arquivos de imagem e os exibe
            const frenteURL = await lerArquivoComoURL(card.frente);
            const versoURL = await lerArquivoComoURL(card.verso);

            frenteEl.innerHTML = `<img src="${frenteURL}" alt="Frente">`;
            versoEl.innerHTML = `<img src="${versoURL}" alt="Verso">`;

        } catch (error) {
            console.error("Erro ao ler imagem do flashcard:", error);
            frenteEl.innerHTML = 'Erro ao carregar imagem';
        }

        // Atualiza o contador
        contadorEl.textContent = `${index + 1} / ${deckSendoEstudado.length}`;

        // Garante que o card comece virado para frente
        flashcardEstudo.classList.remove('is-flipped');
    }

    // 5. Abrir a janela de estudo
    function abrirJanelaEstudar(deck) {
        // Verifica se o deck tem a propriedade .flashcards e se ela não está vazia
        if (!deck.flashcards || deck.flashcards.length === 0) {
            alert("Este deck está vazio! Adicione cards no botão ✒️.");
            return;
        }

        deckSendoEstudado = deck.flashcards; // Define o deck que vamos estudar
        cardAtualIndex = 0; // Começa do primeiro card

        janelaEstudar.classList.add('abrir');
        mostrarCard(cardAtualIndex); // Mostra o primeiro card
    }

    
    // --- LISTENERS (Ouvintes de Eventos) ---

    // 1. Listener para fechar a Janela CRIAR DECK
    if (janelaCriar) {
        janelaCriar.addEventListener('click', (e) => {
            if (e.target.id == 'fechar-criar' || e.target.id == 'janela-criar') {
                janelaCriar.classList.remove('abrir');
            }
        });
    }

    // 2. Listener para fechar a Janela EDITAR FLASHCARD
    if (janelaEditar) {
        janelaEditar.addEventListener('click', (e) => {
            if (e.target.id == 'fechar-flashcard' || e.target.id == 'janela-criar-flashcard') {
                janelaEditar.classList.remove('abrir');
            }
        });
    }

    // 3. Listener para fechar a Janela ESTUDAR
    if (janelaEstudar) {
        janelaEstudar.addEventListener('click', (e) => {
            if (e.target.id == 'fechar-estudar' || e.target.id == 'janela-estudar') {
                janelaEstudar.classList.remove('abrir');
                deckSendoEstudado = null; // Limpa o deck em estudo
            }
        });
    }

    // 4. Listener para VIRAR o card de estudo
    if (flashcardEstudo) {
        flashcardEstudo.addEventListener('click', () => {
            flashcardEstudo.classList.toggle('is-flipped');
        });
    }

    // 5. Listeners para NAVEGAÇÃO (Próximo / Anterior)
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

    // 6. Listener para CONFIRMAR a criação de um novo FLASHCARD
    if (btnConfirmarEditar) {
        btnConfirmarEditar.addEventListener('click', () => {
            const frenteInput = document.getElementById('frente-flashcard-img');
            const versoInput = document.getElementById('verso-flashcard-img');

            const frenteImagem = frenteInput?.files[0];
            const versoImagem = versoInput?.files[0];

            if (!frenteImagem || !versoImagem) {
                alert("Selecione imagens para frente e verso antes de confirmar!");
                return;
            }

            if (deckAtual) {
                // 'deckAtual' é o ELEMENTO HTML do deck
                // Vamos anexar os dados dos flashcards diretamente a ele
                if (!deckAtual.flashcards) deckAtual.flashcards = [];
                
                deckAtual.flashcards.push({
                    frente: frenteImagem,
                    verso: versoImagem
                });

                // --- obtém o elemento <p> contador do deckAtual ---
                const contador = deckAtual.querySelector('p');
                const count = deckAtual.flashcards.length;
                contador.textContent = `${count} card${count > 1 ? 's' : ''}`;
            } else {
                alert("Nenhum deck selecionado para editar.");
            }

            // limpa inputs e fecha
            if (frenteInput) frenteInput.value = "";
            if (versoInput) versoInput.value = "";
            janelaEditar.classList.remove('abrir');
        });
    }

    // 7. Listener para o CONTAINER de decks (Delegação de Eventos)
    if (container) {
        container.addEventListener('click', (e) => {
            const deck = e.target.closest('.Deck');
            if (!deck) return; // Sai se o clique não foi em um deck

            // Ação: DELETAR
            if (e.target.classList.contains('botao-deletar')) {
                if (confirm(`Tem certeza que quer deletar o deck "${deck.querySelector('h2').textContent}"?`)) {
                    deck.remove();
                }
            }

            // Ação: EDITAR (Abrir janela de flashcards)
            if (e.target.classList.contains('botao-editar')) {
                deckAtual = deck; // Define qual deck está sendo editado
                AbrirEditar();
            }

            // Ação: ESTUDAR
            if (e.target.classList.contains('botao-estudar')) {
                abrirJanelaEstudar(deck); // Chama a nova função
            }
        });
    } else {
        console.warn('Elemento #container-decks não encontrado no DOM.');
    }

    // 8. Listener para CONFIRMAR a criação de um novo DECK
    if (btnConfirmar) {
        btnConfirmar.addEventListener('click', () => {
            const nomeInput = document.querySelector('input[name="nome-deck"]');
            const nomeDeck = nomeInput ? nomeInput.value.trim() : '';

            if (nomeDeck == "") {
                alert("Digite um nome para o deck!");
                return;
            }

            // Cria o elemento do deck
            const novoDeck = document.createElement('div');
            novoDeck.classList.add('Deck');

            novoDeck.innerHTML = `
                <h2>${nomeDeck}</h2>
                <p>0 cards</p>
                <button class="botao-estudar">Estudar</button>
                <button class="botao-editar">✒️</button> 
                <button class="botao-deletar">🗑️</button>
            `;
            
            // Importante: Inicializa o array de flashcards no próprio elemento
            novoDeck.flashcards = []; 

            container.appendChild(novoDeck);

            if (nomeInput) nomeInput.value = "";
            janelaCriar.classList.remove('abrir');
        });
    }
});
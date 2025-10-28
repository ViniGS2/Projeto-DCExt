document.addEventListener('DOMContentLoaded', () => {
    // ===== Variável Global  =====
    let decks = []; // Lista com todos os decksss
    
    // Variáveis globais
    let deckAtual = null; // da target no deck sendo utilizado
    let deckSendoEstudado = null; //target no deck sendo estudado
    let cardAtualIndex = 0; 

    // variáveis parausar o IndexDB - são globais
    let tempFrenteURL = null;
    let tempVersoURL = null;

    // Container dos decks - onde os decks eles estarâo
    const container = document.getElementById('container-decks');
    
    // variáveis para AbrirJanela()
    const janelaCriar = document.getElementById('janela-criar');
    const btnConfirmar = document.getElementById('confirmar');
    const nomeInput = document.querySelector('input[name="nome-deck"]');

    // Variáveis da Janela Criar/EditarFlashcard() 
    const janelaEditar = document.getElementById('janela-criar-flashcard');
    const btnConfirmarEditar = document.getElementById('confirmarEditar');
    const frenteInput = document.getElementById('frente-flashcard-img');
    const versoInput = document.getElementById('verso-flashcard-img');
    
    // Varáveis da janelaEstuar
    const janelaEstudar = document.getElementById('janela-estudar');
    const flashcardEstudo = document.getElementById('flashcard-estudo');
    const btnProximo = document.getElementById('card-proximo');
    const btnAnterior = document.getElementById('card-anterior');

    
    // --- (localForage / IndexedDB) como armazenamos os dados ---

    // salva o array decks no IndexedDB (assíncrono)
    async function salvarDecks() {
        try {
            await localforage.setItem('signCardDecks', decks);
        } catch (err) {
            console.error("Erro ao salvar no localForage:", err);
        }
    }

    // Desenha os decks do array decks no HTML
    function renderizarTodosDecks() {
        container.innerHTML = ''; // Limpa o container

        decks.forEach(deckData => {
            // Cria o elemento do deck
            const novoDeck = document.createElement('div');
            novoDeck.classList.add('Deck');
            
            // Adiciona um id ao deck
            novoDeck.dataset.id = deckData.id;

            // Usa o HTML com o layout que aparecena tela
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

    // Carrega os decks do IndexedDB ao iniciar (assíncrono)
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


    // --- Abrir janelas ---

    function abrirCriar(){
        janelaCriar.classList.add('abrir');
    }
    window.abrirCriar = abrirCriar;

    function AbrirEditar(){
        janelaEditar.classList.add('abrir');
    }

    // Usa URL.createObjectURL() para mostrar os arquivos
    // os cards agora guardam o Objeto "File" não mais o url da imagem/gifs
    function mostrarCard(index) {
        if (!deckSendoEstudado || !deckSendoEstudado[index]) return;

        const card = deckSendoEstudado[index];
        const frenteEl = document.getElementById('flashcard-frente');
        const versoEl = document.getElementById('flashcard-verso');
        const contadorEl = document.getElementById('contador-cards');

        // limpa o conteúdo anterior
        frenteEl.innerHTML = '';
        versoEl.innerHTML = '';

        // limpa as URLs temporárias antigas - já que não usamosmais
        // Isso é crucial para não vazar memória!
        if (tempFrenteURL) URL.revokeObjectURL(tempFrenteURL);
        if (tempVersoURL) URL.revokeObjectURL(tempVersoURL);

        //  tá criando URLs temporárias (Blob) para os arquivos
        try {
            // card.frente e card.verso são objetos "File"
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

    // SEM MUDANÇAS (Função em si) de abrir o estudar
    function abrirJanelaEstudar(deckData) {
        if (!deckData.flashcards || deckData.flashcards.length === 0) {
            alert("Este deck está vazio! Adicione cards no botão ✒️.");
            return;
        }

        deckSendoEstudado = deckData.flashcards; // target no deck que vamos estudar
        cardAtualIndex = 0; // começa do primeiro card

        janelaEstudar.classList.add('abrir');
        mostrarCard(cardAtualIndex); // Mostra o primeiro card
    }

    
    // --- LISTENERS das janelas ---

    // Listeners para fechar Janelas
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
    // Listener de fechar 'Estudar' agora limpa as URLs quando fecha
    if (janelaEstudar) {
        janelaEstudar.addEventListener('click', (e) => {
            if (e.target.id == 'fechar-estudar') {
                janelaEstudar.classList.remove('abrir');
                deckSendoEstudado = null; 
                
                // limpa as URLs temporárias ao fechar a janela 
                if (tempFrenteURL) URL.revokeObjectURL(tempFrenteURL);
                if (tempVersoURL) URL.revokeObjectURL(tempVersoURL);
                tempFrenteURL = null;
                tempVersoURL = null;
            }
        });
    }

    // 2. listeners de Navegação/Estudo 
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


    // 3. listener para adicionar FLASHCARD (Salva oo Arquivos)
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
                
                    const deckId = Number(deckAtual.dataset.id);
                    const deckNoDb = decks.find(d => d.id === deckId);

                    if (deckNoDb) {
                        // adiciona os OBJETOS "File" diretamente 
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

    // 4. Listener do CONTAINER (Deletar precisa ser async)
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
                    
                    await salvarDecks(); //ADICIONAR AWAIT
                    renderizarTodosDecks(); // O deck sumirá da tela
                }
            }

            // Ação: EDITAR (Abrir janela de flashcards) 
            if (e.target.classList.contains('botao-editar')) {
                deckAtual = deckElemento; 
                AbrirEditar();
            }

            // Ação: ESTUDAR 
            if (e.target.classList.contains('botao-estudar')) {
                const deckData = decks.find(d => d.id === deckId);
                if (deckData) {
                    abrirJanelaEstudar(deckData);
                }
            }
        });
    }

    // 5. Listener para Criar novo DECK (precisa ser async)
    if (btnConfirmar) {
        btnConfirmar.addEventListener('click', async () => { // deixa  ASYNC
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
            await salvarDecks(); // add AWAIT
            renderizarTodosDecks(); // O novo deck aparecerá na tela

            nomeInput.value = "";
            janelaCriar.classList.remove('abrir');
        });
    }

    //criar sinais

    const dropzone = document.getElementById('dropzone');
    const imgSinal = document.querySelectorAll('.draggable');

    imgSinal.forEach(img =>{
        img.addEventListener('click', (e) => {
        const clone = img.cloneNode(true);
        dropzone.appendChild(clone);
        ativarArrasto(clone);
    });

    });

    function ativarArrasto(img) {
    img.addEventListener('mousedown', (e) => {
    e.preventDefault();

    const shiftX = e.clientX - img.getBoundingClientRect().left;
    const shiftY = e.clientY - img.getBoundingClientRect().top;

    function mover(pageX, pageY) {
      img.style.left = (pageX - shiftX - dropzone.getBoundingClientRect().left) + 'px';
      img.style.top = (pageY - shiftY - dropzone.getBoundingClientRect().top) + 'px';
    }

    function aoMover(e) {
      mover(e.pageX, e.pageY);
    }

    document.addEventListener('mousemove', aoMover);

    img.onmouseup = () => {
      document.removeEventListener('mousemove', aoMover);
      img.onmouseup = null;
    };
  });

  img.addEventListener('dblclick', (e) => {
    img.remove();
    });

  img.ondragstart = () => false;
}

    const biblioteca = document.getElementById('Biblioteca');


    biblioteca.addEventListener('click', (e) => {
        if(biblioteca.classList.contains('open')){
            biblioteca.classList.remove('open');
        }
        else{
            biblioteca.classList.add('open');
        }
    })
    
    

    // inicia o js :)
    carregarDecks();
});
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

    
    //SignMaker + Dropzone) -----
    const modalSignMaker = document.getElementById('modal-signmaker');
    const btnAbrirSignMakerEstudo = document.getElementById('abrir-signmaker-estudo');
    const btnFecharSignMaker = document.getElementById('fechar-modal-signmaker');
    const btnUsarSinalNaDropzone = document.getElementById('usar-sinal-na-dropzone');
    const iframeSignMaker = document.getElementById('signmaker-iframe');
    
    const dropzone = document.getElementById('dropzone');

    // Armazena a (FSW), não o SVG.
    let ultimoFswRecebido = null; 


    // --- (localForage / IndexedDB) como armazenamos os dados ---
    async function salvarDecks() {
        try {
            await localforage.setItem('signCardDecks', decks);
        } catch (err) {
            console.error("Erro ao salvar no localForage:", err);
        }
    }
    function renderizarTodosDecks() {
        container.innerHTML = ''; 
        decks.forEach(deckData => {
            const novoDeck = document.createElement('div');
            novoDeck.classList.add('Deck');
            novoDeck.dataset.id = deckData.id;
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
    async function carregarDecks() {
        try {
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

    function mostrarCard(index) {
        if (!deckSendoEstudado || !deckSendoEstudado[index]) return;

        const card = deckSendoEstudado[index];
        const frenteEl = document.getElementById('flashcard-frente');
        const versoEl = document.getElementById('flashcard-verso');
        const contadorEl = document.getElementById('contador-cards');

        frenteEl.innerHTML = '';
        versoEl.innerHTML = '';

        if (tempFrenteURL) URL.revokeObjectURL(tempFrenteURL);
        if (tempVersoURL) URL.revokeObjectURL(tempVersoURL);

        try {
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

    function abrirJanelaEstudar(deckData) {
        if (!deckData.flashcards || deckData.flashcards.length === 0) {
            alert("Este deck está vazio! Adicione cards no botão ✒️.");
            return;
        }
        deckSendoEstudado = deckData.flashcards; 
        cardAtualIndex = 0; 
        janelaEstudar.classList.add('abrir');
        mostrarCard(cardAtualIndex); 
    }

    
    // --- LISTENERS das janelas ---
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
            if (e.target.id == 'fechar-estudar') {
                janelaEstudar.classList.remove('abrir');
                deckSendoEstudado = null; 
                if (tempFrenteURL) URL.revokeObjectURL(tempFrenteURL);
                if (tempVersoURL) URL.revokeObjectURL(tempVersoURL);
                tempFrenteURL = null;
                tempVersoURL = null;
                if (dropzone) dropzone.innerHTML = '';
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

    // 3. listener para adicionar FLASHCARD
    if (btnConfirmarEditar) {
        btnConfirmarEditar.addEventListener('click', async () => { 
            const frenteImagem = frenteInput?.files[0];
            const versoImagem = versoInput?.files[0];
            if (!frenteImagem || !versoImagem) {
                alert("Selecione imagens para frente e verso antes de confirmar!");
                return;
            }
            if (deckAtual) { 
                try {
                    const deckId = Number(deckAtual.dataset.id);
                    const deckNoDb = decks.find(d => d.id === deckId);
                    if (deckNoDb) {
                        deckNoDb.flashcards.push({
                            frente: frenteImagem,
                            verso: versoImagem
                        });
                        await salvarDecks(); 
                        const contador = deckAtual.querySelector('p');
                        const count = deckNoDb.flashcards.length;
                        contador.textContent = `${count} card${count > 1 ? 's' : ''}`;
                    }
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

    // 4. Listener do CONTAINER (Deletar/Editar/Estudar)
    if (container) {
        container.addEventListener('click', async (e) => { 
            const deckElemento = e.target.closest('.Deck');
            if (!deckElemento) return; 
            const deckId = Number(deckElemento.dataset.id);

            if (e.target.classList.contains('botao-deletar')) {
                if (confirm(`Tem certeza que quer deletar o deck "${deckElemento.querySelector('h2').textContent}"?`)) {
                    decks = decks.filter(d => d.id !== deckId);
                    await salvarDecks(); 
                    renderizarTodosDecks(); 
                }
            }
            if (e.target.classList.contains('botao-editar')) {
                deckAtual = deckElemento; 
                AbrirEditar();
            }
            if (e.target.classList.contains('botao-estudar')) {
                const deckData = decks.find(d => d.id === deckId);
                if (deckData) {
                    abrirJanelaEstudar(deckData);
                }
            }
        });
    }

    // 5. Listener para Criar novo DECK
    if (btnConfirmar) {
        btnConfirmar.addEventListener('click', async () => { 
            const nomeDeck = nomeInput ? nomeInput.value.trim() : '';
            if (nomeDeck == "") {
                alert("Digite um nome para o deck!");
                return;
            }
            const novoDeckObj = {
                id: Date.now(), 
                name: nomeDeck,
                flashcards: []
            };
            decks.push(novoDeckObj);
            await salvarDecks(); 
            renderizarTodosDecks(); 
            nomeInput.value = "";
            janelaCriar.classList.remove('abrir');
        });
    }


    function ativarArrasto(img) {
    img.addEventListener('mousedown', (e) => {
        e.preventDefault();
        const shiftX = e.clientX - img.getBoundingClientRect().left;
        const shiftY = e.clientY - img.getBoundingClientRect().top;

        // Bônus: faz o sinal ficar "na frente" de tudo
        img.style.zIndex = 1000; 

        function mover(pageX, pageY) {
            let newLeft = pageX - shiftX - dropzone.getBoundingClientRect().left;
            let newTop = pageY - shiftY - dropzone.getBoundingClientRect().top;
            img.style.left = newLeft + 'px';
            img.style.top = newTop + 'px';
        }

        function aoMover(e) {
            mover(e.pageX, e.pageY);
        }

        // Nova função para 'soltar'
        function aoSoltar() {
            img.style.zIndex = ''; // Volta ao normal
            
            // Remove os listeners do DOCUMENTO
            document.removeEventListener('mousemove', aoMover);
            document.removeEventListener('mouseup', aoSoltar);
        }

        // Adiciona os listeners de movimento E de soltar ao DOCUMENTO
        document.addEventListener('mousemove', aoMover);
        document.addEventListener('mouseup', aoSoltar);
    });

    img.addEventListener('dblclick', (e) => {
        img.remove();
    });

    img.ondragstart = () => false;
}


    //Sign Maker


    // 1. Fica ouvindo o iframe o tempo todo
    window.addEventListener('message', (event) => {
        // Segurança
        if (event.origin !== 'https://www.sutton-signwriting.io') {
            return;
        }

        const data = event.data;
        
        // **usando log pra testarlakskaksaAAAAAAAAAAAAAAAaaa
        // salvando o sinal**
        if (data.signmaker === 'save' && data.fsw) {
            console.log("+++ RECEITA (FSW) RECEBIDA E ARMAZENADA:", data.fsw);
            ultimoFswRecebido = data.fsw;
        }
    });


    // 2. Abre o modal do SignMaker
    if (btnAbrirSignMakerEstudo) {
        btnAbrirSignMakerEstudo.addEventListener('click', () => {
            // Limpa a receita antiga ao abrir
            ultimoFswRecebido = null; 
            modalSignMaker.classList.add('abrir');
        });
    }

    // 3. Fecha o modal
    if (btnFecharSignMaker) {
        btnFecharSignMaker.addEventListener('click', () => {
            modalSignMaker.classList.remove('abrir');
        });
    }

    // 4. Botão "Usar este Sinal"
    if (btnUsarSinalNaDropzone) {
        btnUsarSinalNaDropzone.addEventListener('click', () => {
            
            // 1. Verifica se já recebeu uma receita (FSW)
            if (!ultimoFswRecebido) {
                alert("Sinal não detectado. Por favor, crie um sinal e clique no botão 'Save' (dentro do editor amarelo) primeiro.");
                return;
            }

            // 2. Verifica se a biblioteca "cozinheira" (ssw) foi carregada
            if (typeof ssw === 'undefined') {
                alert("ERRO CRÍTICO: A biblioteca 'signview.js' (ssw) não foi carregada. Verifique o <head> do seu HTML.");
                return;
            }

            // 3. trasforma em SVG USANDO A RECEITA FSW
            // A função ssw.svg() é da biblioteca signview.js
            const svgString = ssw.svg(ultimoFswRecebido);

            if (!svgString || svgString.trim() === "") {
                alert("A biblioteca ssw não conseguiu criar um SVG a partir do FSW. (fsw: " + ultimoFswRecebido + ")");
                return;
            }

            // 4. Cria o elemento
            const sinalElement = document.createElement('div');
            sinalElement.classList.add('draggable'); 
            sinalElement.innerHTML = svgString; // USA O SVG QUE NÓS CRIAMOS      
            sinalElement.style.position = 'absolute'; 
            sinalElement.style.left = '10px';        
            sinalElement.style.top = '10px';

            // 5. Adiciona na dropzone
            dropzone.appendChild(sinalElement);

            // 6. Ativa o arrasto (CHAMA SUA FUNÇÃO!)
            ativarArrasto(sinalElement);

            // 7. Fecha o modal
            modalSignMaker.classList.remove('abrir');
        });
    }
    
    
    // inicia o js :)
    carregarDecks();
});
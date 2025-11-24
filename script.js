document.addEventListener('DOMContentLoaded', () => {
    let decks = [];
    let deckAtual = null;
    let deckSendoEstudado = null;
    let cardAtualIndex = 0;

    let tempFrenteURL = null;
    let tempVersoURL = null;

    const container = document.getElementById('container-decks');
    
    const janelaCriar = document.getElementById('janela-criar');
    const btnConfirmar = document.getElementById('confirmar');
    const nomeInput = document.querySelector('input[name="nome-deck"]');

    const janelaEditar = document.getElementById('janela-criar-flashcard');
    const btnConfirmarEditar = document.getElementById('confirmarEditar');
    const frenteInput = document.getElementById('frente-flashcard-img');
    const versoInput = document.getElementById('verso-flashcard-img');
    const nomeDeckEditarInput = document.getElementById('input-editar-nome');
    // NOVO: Elemento da lista de cards existentes
    const containerCardsExistentes = document.getElementById('container-cards-existentes');
    
    const janelaEstudar = document.getElementById('janela-estudar');
    const flashcardEstudo = document.getElementById('flashcard-estudo');
    const btnProximo = document.getElementById('card-proximo');
    const btnAnterior = document.getElementById('card-anterior');
    
    const modalSignMaker = document.getElementById('modal-signmaker');
    const btnAbrirSignMakerEstudo = document.getElementById('abrir-signmaker-estudo');
    const btnFecharSignMaker = document.getElementById('fechar-modal-signmaker');
    const btnUsarSinalNaDropzone = document.getElementById('usar-sinal-na-dropzone');
    const iframeSignMaker = document.getElementById('signmaker-iframe');

    const janelaTemas = document.getElementById('janela-temas'); // Não usado neste código, mantido por contexto
    const btnAbrirTemas = document.getElementById('botao-abrir-tema'); // Não usado neste código, mantido por contexto
    const btnAplicarTemas = document.getElementById('aplicar-temas'); // Não usado neste código, mantido por contexto

    const inputCorFundo = document.getElementById('input-cor-fundo'); // Não usado neste código, mantido por contexto
    const inputCorDeck = document.getElementById('input-cor-deck'); // Não usado neste código, mantido por contexto
    const inputCorBotao = document.getElementById('input-cor-botao'); // Não usado neste código, mantido por contexto

    const rootElement = document.documentElement;     
    
    const dropzone = document.getElementById('dropzone');

    let ultimoFswRecebido = null;
    
    const inputImportar = document.getElementById('input-importar');

    // ===========================================
    // FUNÇÕES BÁSICAS
    // ===========================================
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
                <button class="botao-exportar">🔗</button>
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

    // ===========================================
    // FUNÇÕES DA JANELA DE EDIÇÃO (NOVIDADE AQUI)
    // ===========================================

    // NOVO: Função para renderizar a lista de cards na janela de edição
    function renderizarCardsParaEdicao(deckData) {
        if (!containerCardsExistentes) return;
        
        containerCardsExistentes.innerHTML = '';
        
        if (deckData.flashcards.length === 0) {
            containerCardsExistentes.innerHTML = '<p style="text-align: center; color: #666; font-style: italic;">Este deck não possui cards para remoção.</p>';
            return;
        }

        deckData.flashcards.forEach((card, index) => {
            const cardDiv = document.createElement('div');
            
            cardDiv.innerHTML = `
                <span>Card ${index + 1}</span>
                <span class="remover">[CLIQUE PARA REMOVER]</span>
            `;
            
            // Adiciona um listener para remoção ao clicar no card
            cardDiv.addEventListener('click', () => {
                if (confirm(`Tem certeza que deseja remover o Card ${index + 1} do deck "${deckData.name}"?`)) {
                    // Remove o card pelo índice
                    deckData.flashcards.splice(index, 1);
                    
                    // Salva, re-renderiza a lista na janela e atualiza o contador na tela inicial
                    salvarDecks().then(() => {
                        renderizarCardsParaEdicao(deckData); // Re-renderiza a lista (sem fechar a janela)
                        renderizarTodosDecks(); // Atualiza o contador de cards na tela inicial
                    });
                }
            });
            
            containerCardsExistentes.appendChild(cardDiv);
        });
    }

    function abrirCriar(){
        janelaCriar.classList.add('abrir');
    }
    window.abrirCriar = abrirCriar;

    // Abrir a janela de edição
    function AbrirEditar(deckData){
        if (deckData && nomeDeckEditarInput) {
            nomeDeckEditarInput.value = deckData.name;
            // CHAMA A FUNÇÃO DE RENDERIZAR CARDS PARA EDIÇÃO
            renderizarCardsParaEdicao(deckData); 
        }
        janelaEditar.classList.add('abrir');
    }
    
    // ===========================================
    // JANELA DE ESTUDO
    // ===========================================
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
            // verifica se a frente e o verso são objetos Blob ou File antes de criar a URL (novamente pra exp ou imp)
            if (card.frente instanceof Blob && card.verso instanceof Blob) {
                tempFrenteURL = URL.createObjectURL(card.frente);
                tempVersoURL = URL.createObjectURL(card.verso);
                frenteEl.innerHTML = `<img src="${tempFrenteURL}" alt="Frente">`;
                versoEl.innerHTML = `<img src="${tempVersoURL}" alt="Verso">`;
            } else {
                 // Caso não sejam Blobs (verificação pra exportação e a importação)
                frenteEl.innerHTML = 'Conteúdo indisponível';
                versoEl.innerHTML = 'Conteúdo indisponível';
            }
        } catch (error) {
            console.error("Erro ao criar URL do objeto:", error);
            frenteEl.innerHTML = 'Erro ao carregar imagem';
            versoEl.innerHTML = 'Erro ao carregar imagem';
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
    
    // ===========================================
    // LISTENERS DE FECHAR JANELAS
    // ===========================================

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
                // Limpa os inputs de arquivo ao fechar, se não for por confirmação
                if (e.target.id !== 'confirmarEditar') {
                    frenteInput.value = "";
                    versoInput.value = "";
                }
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

    // ===========================================
    // LISTENER CONFIRMAR EDIÇÃO (ADICIONAR/RENOMEAR)
    // ===========================================
    if (btnConfirmarEditar) {
        btnConfirmarEditar.addEventListener('click', async () => {

            const frenteImagem = frenteInput?.files[0];
            const versoImagem = versoInput?.files[0];
            const novoNome = nomeDeckEditarInput.value.trim();

            if (novoNome === "") {
                alert("O nome do deck não pode ficar vazio!");
                return;
               }
            
            if (deckAtual) {
                try {
                    const deckId = Number(deckAtual.dataset.id);
                    let deckNoDb = decks.find(d => d.id === deckId);

                if (deckNoDb) {
                        // 1. Atualiza o nome do deck se tiver mudado
                        deckNoDb.name = novoNome;

                        // 2. Adiciona os novos cards
                        let cardAdicionado = false;
                        if (frenteImagem && versoImagem) {
                            deckNoDb.flashcards.push({
                                frente: frenteImagem,
                                verso: versoImagem
                            });
                            cardAdicionado = true;
                        } else if (frenteInput.files.length > 0 || versoInput.files.length > 0) {
                            alert("Para adicionar um novo flashcard, selecione imagens para a frente E o verso.");
                            return;
                        }

                        await salvarDecks();

                        // 3. Atualiza a interface
                        renderizarTodosDecks(); // Atualiza o nome e contador na tela inicial
                        
                        // limpa a janela e fecha
                        if (cardAdicionado) {
                            frenteInput.value = "";
                            versoInput.value = "";
                        }
                        // NOTA: A remoção de cards foi tratada na função renderizarCardsParaEdicao 
                        // e salva automaticamente, então apenas fechamos a janela aqui.

                        janelaEditar.classList.remove('abrir');
                    }
                } catch (err) {
                    alert("Erro ao salvar edição.");
                    console.error(err);
                }
            } else {
                alert("Nenhum deck selecionado para editar.");
            }
        });
    }

    // ===========================================
    // LISTENERS DE DECKS (ESTUDAR/EDITAR/DELETAR)
    // ===========================================

    if (container) {
        container.addEventListener('click', async (e) => {
            const deckElemento = e.target.closest('.Deck');
            if (!deckElemento) return;
            const deckId = Number(deckElemento.dataset.id);
            const deckData = decks.find(d => d.id === deckId);

            if (e.target.classList.contains('botao-deletar')) {
                if (confirm(`Tem certeza que quer deletar o deck "${deckElemento.querySelector('h2').textContent}"?`)) {
                    decks = decks.filter(d => d.id !== deckId);
                    await salvarDecks();
                    renderizarTodosDecks();
                }
            }
            if (e.target.classList.contains('botao-editar')) {
                deckAtual = deckElemento;
                // Abre e carrega a lista de cards
                AbrirEditar(deckData);
            }
            if (e.target.classList.contains('botao-estudar')) {
                if (deckData) {
                    abrirJanelaEstudar(deckData);
                }
            }
            // listener para o botão de Exportar
            if (e.target.classList.contains('botao-exportar')) {
                if (deckData) {
                    await exportarDeck(deckData);
                }
            }
        });
    }

    // ===========================================
    // LISTENER CONFIRMAR CRIAÇÃO
    // ===========================================

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

    // ===========================================
    // FUNÇÕES DE ARRASTO (SIGN MAKER)
    // ===========================================

    function ativarArrasto(img) {
    // Certifique-se de que o CSS para .draggable já tem 'position: absolute;'
    
    img.addEventListener('mousedown', (e) => {
        e.preventDefault();
        
        // Coordenadas do clique dentro do elemento (deslocamento)
        const shiftX = e.clientX - img.getBoundingClientRect().left;
        const shiftY = e.clientY - img.getBoundingClientRect().top;

        img.style.zIndex = 1000;

        function mover(clientX, clientY) {
            const dropzoneRect = dropzone.getBoundingClientRect();
            
            // Calcula a nova posição relativa à dropzone, usando clientX/Y 
            // menos o deslocamento do clique (shift) e a posição da dropzone
            let newLeft = clientX - shiftX - dropzoneRect.left;
            let newTop = clientY - shiftY - dropzoneRect.top;
            
            // Aplica os limites da dropzone
            newLeft = Math.max(0, Math.min(newLeft, dropzone.clientWidth - img.clientWidth));
            newTop = Math.max(0, Math.min(newTop, dropzone.clientHeight - img.clientHeight));

            img.style.left = newLeft + 'px';
            img.style.top = newTop + 'px';
        }

        function aoMover(e) {
            // Chama mover com clientX e clientY
            mover(e.clientX, e.clientY);
        }

        function aoSoltar() {
            img.style.zIndex = '';
            
            document.removeEventListener('mousemove', aoMover);
            document.removeEventListener('mouseup', aoSoltar);
        }

        document.addEventListener('mousemove', aoMover);
        document.addEventListener('mouseup', aoSoltar);
    });

    img.addEventListener('dblclick', (e) => {
        img.remove();
    });

    img.ondragstart = () => false;
    }


    window.addEventListener('message', (event) => {
        if (event.origin !== 'https://www.sutton-signwriting.io') {
            return;
        }

        const data = event.data;
        
        if (data.signmaker === 'save' && data.fsw) {
            console.log("+++ FSW Recebida +++");
            ultimoFswRecebido = data.fsw;
        }
    });


    if (btnAbrirSignMakerEstudo) {
        btnAbrirSignMakerEstudo.addEventListener('click', () => {
            ultimoFswRecebido = null;
            modalSignMaker.classList.add('abrir');
        });
    }

    if (btnFecharSignMaker) {
        btnFecharSignMaker.addEventListener('click', () => {
            modalSignMaker.classList.remove('abrir');
        });
    }

    if (btnUsarSinalNaDropzone) {
        btnUsarSinalNaDropzone.addEventListener('click', () => {
            
            if (!ultimoFswRecebido) {
                alert("Sinal não detectado. Por favor, crie um sinal e clique no botão 'Save' (dentro do editor amarelo) primeiro.");
                return;
            }

            if (typeof ssw === 'undefined') {
                alert("ERRO CRÍTICO: A biblioteca 'signview.js' (ssw) não foi carregada. Verifique o <head> do seu HTML.");
                return;
            }

            const svgString = ssw.svg(ultimoFswRecebido);

            if (!svgString || svgString.trim() === "") {
                alert("A biblioteca ssw não conseguiu criar um SVG a partir do FSW. (fsw: " + ultimoFswRecebido + ")");
                return;
            }

            const sinalElement = document.createElement('div');
            sinalElement.classList.add('draggable');
            sinalElement.innerHTML = svgString;
            sinalElement.style.position = 'absolute';
            sinalElement.style.left = '10px';
            sinalElement.style.top = '10px';
            sinalElement.style.cursor = 'grab'; // Adiciona um cursor de arraste

            dropzone.appendChild(sinalElement);

            ativarArrasto(sinalElement);

            modalSignMaker.classList.remove('abrir');
        });
    }
    
    // ===========================================
    // FUNÇÕES DE EXPORTAÇÃO E IMPORTAÇÃO
    // ===========================================
    
    function blobToBase64(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }
    
    function base64ToBlob(base64) {
        const parts = base64.split(';base64,');
        if (parts.length < 2) return new Blob();
        
        const finalMimeType = parts[0].split(':')[1];
        
        const byteString = atob(parts[1]);
        const arrayBuffer = new ArrayBuffer(byteString.length);
        const intArray = new Uint8Array(arrayBuffer);
        
        for (let i = 0; i < byteString.length; i++) {
            intArray[i] = byteString.charCodeAt(i);
        }
        
        return new Blob([arrayBuffer], { type: finalMimeType });
    }

    async function exportarDeck(deck) {
        const deckExport = {
            name: deck.name,
            flashcards: []
        };
        
        for (const card of deck.flashcards) {
            // Apenas tenta exportar se for Blob/File (imagens locais)
            if (card.frente instanceof Blob && card.verso instanceof Blob) {
                 try {
                    const frenteBase64 = await blobToBase64(card.frente);
                    const versoBase64 = await blobToBase64(card.verso);
                    deckExport.flashcards.push({
                        frente: frenteBase64,
                        verso: versoBase64,
                    });
                 } catch (e) {
                    console.error("Erro ao converter Blob para Base64:", e);
                 }
            }
        }

        if (deckExport.flashcards.length === 0) {
            alert("Este deck não contém flashcards válidos para exportar (apenas imagens/gifs são exportados).");
            return;
        }

        const jsonString = JSON.stringify(deckExport, null, 2);
        const dataBlob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `SignCard_Deck_${deck.name.replace(/\s/g, '_')}_${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        alert(`Deck "${deck.name}" exportado com sucesso! Arquivo salvo como ${a.download}`);
    }

    if (inputImportar) {
        inputImportar.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file || file.type !== 'application/json') {
                alert("Selecione um arquivo JSON válido para importar.");
                e.target.value = '';
                return;
            }

            try {
                const fileText = await file.text();
                const deckImport = JSON.parse(fileText);
                
                if (!deckImport.name || !Array.isArray(deckImport.flashcards)) {
                    throw new Error("Formato de deck inválido (falta nome ou array de flashcards).");
                }
                
                const novoFlashcards = [];
                
                for (const card of deckImport.flashcards) {
                    if (!card.frente || !card.verso || !card.frente.startsWith('data:') || !card.verso.startsWith('data:')) {
                         console.error("Card com Base64 corrompido/faltando, pulando.", card);
                         continue;
                    }
                    
                    const frenteBlob = base64ToBlob(card.frente);
                    const versoBlob = base64ToBlob(card.verso);
                    
                    // Cria novos Files (que são Blobs)
                    novoFlashcards.push({
                        frente: new File([frenteBlob], 'frente-import', { type: frenteBlob.type }),
                        verso: new File([versoBlob], 'verso-import', { type: versoBlob.type }),
                    });
                }
                
                if (novoFlashcards.length === 0) {
                    alert("O arquivo não continha flashcards válidos para importação (somente cards com imagens Base64 são importados).");
                     e.target.value = '';
                     return;
                }

                const novoDeckObj = {
                    id: Date.now(),
                    name: deckImport.name + " (Importado)",
                    flashcards: novoFlashcards
                };

                decks.push(novoDeckObj);
                await salvarDecks();
                renderizarTodosDecks();
                alert(`Deck "${novoDeckObj.name}" importado com sucesso, com ${novoFlashcards.length} cards!`);

            } catch (err) {
                alert(`Erro ao importar o arquivo: ${err.message}. Verifique se o arquivo está correto e é um JSON de exportação do Sign Card.`);
                console.error(err);
            } finally {
                e.target.value = '';
            }
        });
    }
    

    carregarDecks();
});
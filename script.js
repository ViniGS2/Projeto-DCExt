function abrirCriar(){
    const menuCriar = document.getElementById('janela-criar')

    menuCriar.classList.add('abrir')
    
    menuCriar.addEventListener('click', (e) => {
        if(e.target.id == 'fechar' || e.target.id == 'janela-criar'){
            menuCriar.classList.remove('abrir')
        }
    })
}

 
document.getElementById('confirmar').addEventListener('click', () => { //cria o deck quando clica em confirmar
    const nomeInput = document.querySelector('input[name="nome-deck"]'); //bota o nome em "nomeInput"
    const nomeDeck = nomeInput.value.trim();//nome do deck vai receber o nome, esse .tri() é pra remover os espaços

    if (nomeDeck === "") { //se tiver vazio ele manda esse alert
        alert("Digite um nome para o deck!");
        return;
    }

    const novoDeck = document.createElement('div'); // cria um container pincipal onde vão estar nossos decks
    novoDeck.classList.add('Deck'); //adiciona um "Deck" que puxa as infos la do css

    //Adicionar o conteúdo HTML do deck e bota o nome do imput Ô
    novoDeck.innerHTML = `
        <h2>${nomeDeck}</h2>
        <p>0 cards</p>
        <button class="botao-estudar">Estudar</button>
        <button class="botao-editar">✒️</button>
        <button class="botao-deletar">🗑️</button>
    `;

    //adicionar o novo deck ao container, como o container já está no body, já funciona!!!!
    const container = document.getElementById('container-decks');
    container.appendChild(novoDeck);

    //Deveria limpar o unput se fechar o criar -- não tá indo zzzz
    nomeInput.value = "";
    document.getElementById('janela-criar').classList.remove('abrir');
});
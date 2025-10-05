function abrirCriar(){
    const menuCriar = document.getElementById('janela-criar')

    menuCriar.classList.add('abrir')
    
    menuCriar.addEventListener('click', (e) => {
        if(e.target.id == 'fechar' || e.target.id == 'janela-criar'){
            menuCriar.classList.remove('abrir')
        }
    })
}
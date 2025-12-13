    const fichaDetalhes = document.getElementById('fichaDetalhes');
    const imagemFicha = document.getElementById('imagemFicha');
    const backgroundFicha = document.getElementById('backgroundFicha');
    const detalhesExtras = document.getElementById('detalhesExtras');
    
    // Define a senha de cada ficha
    const senhas = {
        ficha1: "Carrasco",
        ficha2: "Risperidona",
        ficha3: "0000",
    };

    // Define o destino de cada ficha
    const paginas = {
        ficha1: href="Player1/Osino1.html",
        ficha2: "ficha_personagem_2.html",
        ficha3: "ficha_personagem_3.html",
    };

    let fichaSelecionada = null;

    document.addEventListener("mousemove", e => {
    const x = (e.clientX / window.innerWidth - 0.5) * 20;
    const y = (e.clientY / window.innerHeight - 0.5) * 20;

    backgroundFicha.style.transform =
        `scale(1.1) translate(${x}px, ${y}px)`;

    imagemFicha.style.setProperty("--y", `${y * -1}px`);
    });

    function pedirSenha(ficha) {

    // remove animação anterior
    imagemFicha.classList.remove("ativo");
    detalhesExtras.classList.remove("ativo");

    // força reflow (garante que a animação reinicie)
    void imagemFicha.offsetWidth; // força reflow

    if (ficha === 'ficha1') {
        backgroundFicha.style.backgroundImage =
            "url('ficha1-background.jpg')";

        imagemFicha.src = "ficha1-imagem.png";
        detalhesExtras.style.backgroundImage =
            "url('detalhe1.gif')";

        // posição final (ajustável)
        imagemFicha.style.setProperty("--offset-final", "-50%");
    }

    if (ficha === 'ficha2') {
        backgroundFicha.style.backgroundImage =
            "url('../Images/Imagem provisória.png')";

        imagemFicha.src = "../Images/Sprites/SpritesPlayer1/img1.png";
        detalhesExtras.style.backgroundImage =
            "url('detalhe2.gif')";

        imagemFicha.style.setProperty("--offset-final", "-45%");
    }

    if (ficha === 'ficha3') {
        backgroundFicha.style.backgroundImage =
            "url('ficha3-background.jpg')";

        imagemFicha.src = "ficha3-imagem.png";
        detalhesExtras.style.backgroundImage =
            "url('detalhe3.gif')";

        imagemFicha.style.setProperty("--offset-final", "-55%");
    }

    // ativa animação
    imagemFicha.classList.add("ativo");
    detalhesExtras.classList.add("ativo");


        fichaSelecionada = ficha;
        document.getElementById("senhaInput").value = "";
        document.getElementById("erro").style.display = "none";
        document.getElementById("senhaPopup").style.display = "flex";
    }

    function fecharPopup() {
        document.getElementById("senhaPopup").style.display = "none";
    }

    function confirmarSenha() {
        const senhaDigitada = document.getElementById("senhaInput").value;

        if (senhaDigitada === senhas[fichaSelecionada]) {
            window.location.href = paginas[fichaSelecionada];
        } else {
            document.getElementById("erro").style.display = "block";
        }
    }
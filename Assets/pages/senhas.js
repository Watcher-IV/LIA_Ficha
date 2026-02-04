    const fichaDetalhes = document.getElementById('fichaDetalhes');
    const imagemFicha = document.getElementById('imagemFicha');
    const backgroundFicha = document.getElementById('backgroundFicha');
    const detalhesExtras = document.getElementById('detalhesExtras');
    
    // Define a senha de cada ficha
    const senhas = {
        ficha1: "Carrasco",
        ficha2: "Bunker",
        ficha3: "0000",
    };

    // Define o destino de cada ficha
    const paginas = {
        ficha1: "Player1/Osino.html",
        ficha2: "Player2/Raposa.html",
        ficha3: "ficha_personagem_3.html",
    };

    let fichaSelecionada = null;

    document.addEventListener("mousemove", e => {
    const x = (e.clientX / window.innerWidth - 0.5) * 20;
    const y = (e.clientY / window.innerHeight - 0.5) * 20;

    backgroundFicha.style.transform =
        `scale(1.1) translate(${x}px, ${y}px)`;

    imagemFicha.style.setProperty("--px", `${x * -0.2}px`);
    imagemFicha.style.setProperty("--py", `${y * -0.2}px`);
    });

    function previewFicha(ficha) {
    if (ficha === 'ficha1') {
        backgroundFicha.style.backgroundImage =
            "url('../Images/Tileset/OsinoBackground.png')";

        imagemFicha.src = "../Images/Tileset/Silhueta Osino.png";
        detalhesExtras.style.backgroundImage =
            "url('detalhe1.gif')";
    }

    if (ficha === 'ficha2') {
        backgroundFicha.style.backgroundImage =
            "url('../Images/Tileset/OsinoBackground.png')";

        imagemFicha.src = "../Images/Tileset/SilhuetaRaposa.png";
        detalhesExtras.style.backgroundImage =
            "url('detalhe2.gif')";
    }

    if (ficha === 'ficha3') {
        backgroundFicha.style.backgroundImage =
            "url('ficha3-background.jpg')";

        imagemFicha.src = "ficha3-imagem.png";
        detalhesExtras.style.backgroundImage =
            "url('detalhe3.gif')";
    }
    }  
    
    function pedirSenha(ficha) {
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
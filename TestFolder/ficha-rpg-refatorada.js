// ===============================
// FICHA RPG - VERSÃO ORIENTADA A OBJETOS
// ===============================

/**
 * Classe principal que gerencia toda a ficha de personagem
 */
class FichaRPG {
  constructor() {
    this.carregandoFicha = true;
    this.senhaAbaTrancada = "Luka";
    this.LIMITE_PONTOS = 5;
    this.ptTable = [10, 16, 22, 28, 34, 40, 46];
    
    this.inicializar();
  }

  inicializar() {
    // Inicializa todos os módulos
    this.storage = new StorageManager(this);
    this.atributos = new AtributosManager(this);
    this.barras = new BarrasManager(this);
    this.aspectos = new AspectosManager(this);
    this.buffs = new BuffsManager(this);
    this.abas = new AbasManager(this);
    this.maldições = new MaldicoesManager(this);
    this.humanidade = new HumanidadeManager(this);
    this.ui = new UIManager(this);

    // Carrega dados salvos
    this.storage.carregar();
    
    // Atualiza interface inicial
    this.atributos.atualizar();
    this.barras.atualizarTodas();
    this.humanidade.atualizar();
    
    this.carregandoFicha = false;
    
    // Ativa autosalvamento
    this.ativarAutosalvamento();
  }

  ativarAutosalvamento() {
    document.addEventListener("input", () => this.storage.salvar());
    document.addEventListener("change", () => this.storage.salvar());
  }

  limpar() {
    if (confirm("Tem certeza que deseja apagar todos os dados da ficha?")) {
      localStorage.removeItem("fichaRPG");
      localStorage.removeItem("curses");
      localStorage.removeItem("habText");
      location.reload();
    }
  }
}

/**
 * Gerencia salvamento e carregamento de dados
 */
class StorageManager {
  constructor(ficha) {
    this.ficha = ficha;
  }

  salvar() {
    if (this.ficha.carregandoFicha) return;

    const dados = {};
    
    // Salva todos os inputs, textareas e selects
    document.querySelectorAll("input, textarea, select").forEach((el, index) => {
      const chave = this.gerarChave(el, index);
      dados[chave] = el.value;
    });

    // Salva buffs
    dados.buffs = this.ficha.buffs.obterLista();

    localStorage.setItem("fichaRPG", JSON.stringify(dados));
  }

  carregar() {
    const dadosSalvos = localStorage.getItem("fichaRPG");
    if (!dadosSalvos) {
      this.ficha.carregandoFicha = false;
      return;
    }

    const dados = JSON.parse(dadosSalvos);

    // Restaura inputs, textareas e selects
    document.querySelectorAll("input, textarea, select").forEach((el, index) => {
      const chave = this.gerarChave(el, index);
      if (dados[chave] !== undefined) {
        el.value = dados[chave];
        this.dispararEventos(el);
      }
    });

    // Restaura buffs
    if (dados.buffs !== undefined) {
      this.ficha.buffs.restaurar(dados.buffs);
    }

    this.ficha.carregandoFicha = false;
  }

  gerarChave(el, index) {
    if (el.id) return el.id;
    if (el.name) return el.name;
    if (el.dataset?.group && el.dataset?.i !== undefined) {
      return `${el.dataset.group}_${el.dataset.i}`;
    }
    if (el.dataset?.save) return el.dataset.save;
    return `input_${index}`;
  }

  dispararEventos(el) {
    if (el.tagName === "SELECT") {
      el.dispatchEvent(new Event("change", { bubbles: true }));
    } else {
      el.dispatchEvent(new Event("input", { bubbles: true }));
    }
  }
}

/**
 * Gerencia atributos do personagem (HP, PT, etc)
 */
class AtributosManager {
  constructor(ficha) {
    this.ficha = ficha;
    this.elementos = {
      vitalidade: document.getElementById('vitalidade'),
      hp: document.getElementById('hpCalc'),
      essencia: document.getElementById('essencia'),
      pt: document.getElementById('ptCalc'),
      pvMax: document.getElementById('pvMax'),
      psMax: document.getElementById('psMax'),
      tMax: document.getElementById('tMax')
    };

    this.configurarEventos();
  }

  configurarEventos() {
    this.elementos.vitalidade?.addEventListener('input', () => this.atualizarHP());
    this.elementos.essencia?.addEventListener('input', () => this.atualizarPT());
  }

  atualizarHP() {
    const vit = this.toInt(this.elementos.vitalidade.value);
    const hp = 10 + (vit * 3);
    this.elementos.hp.textContent = hp;
    this.elementos.pvMax.textContent = hp;
    
    // Garante que PV não exceda HP
    const pvEl = document.getElementById('pv');
    if (this.toInt(pvEl.value) > hp) {
      pvEl.value = hp;
    }
    
    this.ficha.barras.atualizarPV();
  }

  atualizarPT() {
    const ess = this.clamp(this.toInt(this.elementos.essencia.value), 0, 6);
    const pt = this.ficha.ptTable[ess];
    this.elementos.pt.textContent = pt;
    this.elementos.psMax.textContent = 50;
    this.elementos.tMax.textContent = pt;
    
    this.ficha.barras.atualizarTensao();
  }

  atualizar() {
    this.atualizarHP();
    this.atualizarPT();
  }

  clamp(n, a, b) {
    return Math.max(a, Math.min(b, n));
  }

  toInt(v) {
    const n = parseInt(v, 10);
    return isNaN(n) ? 0 : n;
  }
}

/**
 * Gerencia as barras de status (PV, PS, Tensão)
 */
class BarrasManager {
  constructor(ficha) {
    this.ficha = ficha;
    this.elementos = {
      pv: document.getElementById('pv'),
      pvFill: document.getElementById('pvFill'),
      pvLabel: document.getElementById('pvLabel'),
      ps: document.getElementById('ps'),
      psFill: document.getElementById('psFill'),
      psLabel: document.getElementById('psLabel'),
      tensao: document.getElementById('tensao'),
      tFill: document.getElementById('tFill'),
      tLabel: document.getElementById('tLabel'),
      statusPV: document.getElementById('statusPV')
    };

    this.configurarEventos();
  }

  configurarEventos() {
    this.elementos.pv?.addEventListener('input', () => {
      this.atualizarPV();
      this.atualizarImagemPV();
    });
    this.elementos.ps?.addEventListener('input', () => this.atualizarPS());
    this.elementos.tensao?.addEventListener('input', () => this.atualizarTensao());
  }

  atualizarPV() {
    const hp = this.toInt(document.getElementById('hpCalc').textContent || 10);
    let pv = this.clamp(this.toInt(this.elementos.pv.value), 0, hp);
    this.elementos.pv.value = pv;

    const pct = hp === 0 ? 0 : Math.round((pv / hp) * 100);
    this.elementos.pvFill.style.width = pct + '%';
    this.elementos.pvLabel.textContent = `${pv} / ${hp}`;

    // Efeito visual quando PV baixo
    this.elementos.pvFill.style.boxShadow = 
      hp > 0 && pv / hp < 0.3 
        ? '0 0 8px rgba(200,60,60,0.45)' 
        : '';
  }

  atualizarPS() {
    const maxPS = 50;
    let ps = this.clamp(this.toInt(this.elementos.ps.value), 0, maxPS);
    this.elementos.ps.value = ps;

    const pct = Math.round((ps / maxPS) * 100);
    this.elementos.psFill.style.width = pct + '%';
    this.elementos.psLabel.textContent = `${ps} / ${maxPS}`;
  }

  atualizarTensao() {
    const pt = this.toInt(document.getElementById('ptCalc').textContent || 10);
    let t = this.clamp(this.toInt(this.elementos.tensao.value), 0, pt);
    this.elementos.tensao.value = t;

    const pct = pt === 0 ? 0 : Math.round((t / pt) * 100);
    this.elementos.tFill.style.width = pct + '%';
    this.elementos.tLabel.textContent = `${t} / ${pt}`;

    // Efeito visual quando tensão alta
    this.elementos.tFill.style.boxShadow = 
      t >= pt * 0.75 
        ? '0 0 8px rgba(255,60,60,0.45)' 
        : '';
  }

  atualizarImagemPV() {
    const pv = Number(this.elementos.pv.value);
    const hp = Number(document.getElementById('hpCalc').textContent);
    const img = this.elementos.statusPV;

    if (!hp || hp <= 0 || pv < 0) return;

    const porcentagem = (pv / hp) * 100;

    if (porcentagem >= 60) {
      img.src = "../../Images/Sprites/SpritesPlayer1/img1.png";
    } else if (porcentagem > 1) {
      img.src = "../../Images/Sprites/SpritesPlayer1/img2.png";
    } else {
      img.src = "../../Images/Sprites/SpritesPlayer1/img3.png";
    }
  }

  atualizarTodas() {
    this.atualizarPV();
    this.atualizarPS();
    this.atualizarTensao();
  }

  clamp(n, a, b) {
    return Math.max(a, Math.min(b, n));
  }

  toInt(v) {
    const n = parseInt(v, 10);
    return isNaN(n) ? 0 : n;
  }
}

/**
 * Gerencia sistema de aspectos
 */
class AspectosManager {
  constructor(ficha) {
    this.ficha = ficha;
    this.grupos = ['acao', 'razao', 'instinto'];
    this.valoresIniciais = {}; // guarda valores iniciais para reset

    this.inicializar();
    this.configurarReset();
  }

  inicializar() {
    this.grupos.forEach(group => {
      const selects = document.querySelectorAll(`select[data-group="${group}"]`);
      const poolInput = document.getElementById(`pool-${group}`);

      // Guarda valor inicial do pool
      if (poolInput) {
        this.valoresIniciais[group] = parseInt(poolInput.value) || 0;
      }

      selects.forEach(sel => {
        this.criarOpcoes(sel);
        sel.value = 0;

        sel.addEventListener("focus", () => {
          sel.dataset.oldValue = sel.value;
        });

        sel.addEventListener("change", () => {
          this.atualizarPool(group);
          this.ficha.storage.salvar();
        });
      });

      this.atualizarPool(group);
    });
  }

  criarOpcoes(sel) {
    sel.innerHTML = '';
    
    // Opções de 0 a +5 (limite do pool)
    for (let i = 0; i <= 5; i++) {
      const opt = document.createElement('option');
      opt.value = i;
      opt.textContent = i === 0 ? '0' : `+${i}`;
      sel.appendChild(opt);
    }
  }

  atualizarPool(group) {
    const selects = document.querySelectorAll(`select[data-group="${group}"]`);
    const poolInput = document.getElementById(`pool-${group}`);
    
    if (!poolInput) return;

    const valorInicial = this.valoresIniciais[group] || 0;
    
    // Soma todos os valores usados
    let totalUsado = 0;
    selects.forEach(sel => {
      totalUsado += parseInt(sel.value) || 0;
    });

    // Calcula pontos restantes
    const pontosRestantes = valorInicial - totalUsado;
    poolInput.value = Math.max(0, pontosRestantes);

    // Validação: se ficou negativo, reverte a última mudança
    if (pontosRestantes < 0) {
      const ultimo = document.activeElement;
      if (ultimo && ultimo.tagName === "SELECT" && ultimo.dataset.group === group) {
        ultimo.value = ultimo.dataset.oldValue || 0;
        this.atualizarPool(group); // recalcula
      }
    }

    // Visual feedback
    if (pontosRestantes === 0) {
      poolInput.style.color = '#ff6b6b'; // vermelho quando acabar
    } else {
      poolInput.style.color = 'var(--accent)'; // azul normal
    }
  }

  configurarReset() {
    const btnReset = document.getElementById('resetAspectos');
    if (!btnReset) return;

    btnReset.addEventListener('click', () => {
      if (!confirm('Resetar todos os aspectos para o início da cena?')) return;

      this.grupos.forEach(group => {
        const selects = document.querySelectorAll(`select[data-group="${group}"]`);
        
        // Reseta todos os selects para 0
        selects.forEach(sel => {
          sel.value = 0;
        });

        this.atualizarPool(group);
      });

      this.ficha.storage.salvar();
    });
  }

  recalcularLimites() {
    this.grupos.forEach(group => this.atualizarPool(group));
  }
}

/**
 * Gerencia sistema de humanidade com símbolos e efeitos visuais
 */
class HumanidadeManager {
  constructor(ficha) {
    this.ficha = ficha;
    this.container = document.getElementById('humanidadeSymbols');
    this.input = document.getElementById('humanidade');
    this.overlay = document.getElementById('humanidadeOverlay');
    this.maxHumanidade = 10;

    this.inicializar();
    this.configurarEventos();
  }

  inicializar() {
    // Cria os 10 símbolos
    this.container.innerHTML = '';
    for (let i = 0; i < this.maxHumanidade; i++) {
      const symbol = document.createElement('div');
      symbol.className = 'humanidade-symbol';
      symbol.dataset.index = i;
      this.container.appendChild(symbol);
    }
    
    this.atualizar();
  }

  configurarEventos() {
    // Clique nos símbolos altera o valor
    this.container.addEventListener('click', (e) => {
      if (e.target.classList.contains('humanidade-symbol')) {
        const index = parseInt(e.target.dataset.index);
        this.input.value = index + 1;
        this.atualizar();
        this.ficha.storage.salvar();
      }
    });

    // Se alguém mudar o input oculto
    this.input?.addEventListener('input', () => this.atualizar());
  }

  atualizar() {
    const valor = this.clamp(parseInt(this.input.value) || 0, 0, this.maxHumanidade);
    this.input.value = valor;

    // Atualiza símbolos
    const symbols = this.container.querySelectorAll('.humanidade-symbol');
    symbols.forEach((symbol, index) => {
      if (index < valor) {
        symbol.classList.add('filled');
        symbol.classList.remove('empty');
      } else {
        symbol.classList.remove('filled');
        symbol.classList.add('empty');
      }
    });

    // Aplica efeitos visuais de degradação
    this.aplicarEfeitosDegradacao(valor);
  }

  aplicarEfeitosDegradacao(valor) {
    const body = document.body;
    
    // Remove classes anteriores
    body.classList.remove('humanidade-baixa', 'humanidade-critica');

    // Aplica efeitos baseados no valor
    if (valor <= 3 && valor > 0) {
      body.classList.add('humanidade-critica'); // Crítico: preto e branco + ruído intenso
    } else if (valor <= 5) {
      body.classList.add('humanidade-baixa'); // Baixa: dessaturado + ruído leve
    }
    // valor > 5: sem efeitos
  }

  clamp(n, a, b) {
    return Math.max(a, Math.min(b, n));
  }
}

/**
 * Gerencia buffs/benefícios
 */
class BuffsManager {
  constructor(ficha) {
    this.ficha = ficha;
    this.container = document.getElementById('buffs');
    this.inputTexto = document.getElementById('buffText');
    this.botaoAdicionar = document.getElementById('addBuff');

    this.configurarEventos();
  }

  configurarEventos() {
    this.botaoAdicionar?.addEventListener('click', () => this.adicionar());
  }

  adicionar() {
    const text = (this.inputTexto.value || '').trim();
    if (!text) return;

    const row = this.criarElementoBuff(text);
    this.container.prepend(row);
    this.inputTexto.value = "";

    this.ficha.storage.salvar();
  }

  criarElementoBuff(text) {
    const row = document.createElement('div');
    row.className = 'buff';
    row.innerHTML = `
      <div>${this.escapeHtml(text)}</div>
      <button class="open-btn" type="button">✕</button>
    `;

    row.querySelector("button").addEventListener("click", () => {
      row.remove();
      this.ficha.storage.salvar();
    });

    return row;
  }

  obterLista() {
    return [...document.querySelectorAll('.buff div')]
      .map(div => div.textContent.trim());
  }

  restaurar(buffsArray) {
    if (!Array.isArray(buffsArray)) return;

    this.container.innerHTML = "";

    buffsArray.forEach(text => {
      const row = this.criarElementoBuff(text);
      this.container.append(row);
    });
  }

  escapeHtml(s) {
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
}

/**
 * Gerencia inventário
 */
class InventarioManager {
  constructor(ficha) {
    this.ficha = ficha;
    this.container = document.getElementById('invList');
    this.botaoAdicionar = document.getElementById('addItem');

    this.configurarEventos();
  }

  configurarEventos() {
    this.botaoAdicionar?.addEventListener('click', () => this.adicionarSlot());
  }

  adicionarSlot() {
    const index = this.container.children.length;

    const slot = document.createElement("div");
    slot.className = "inv-slot";
    slot.id = `inv${index + 1}`;

    const input = document.createElement("input");
    input.className = "inv-input";
    input.dataset.index = index;
    input.dataset.save = `inv_${index}`;
    input.placeholder = "Novo item...";

    slot.appendChild(input);
    this.container.appendChild(slot);

    this.ficha.storage.salvar();
  }

  obterLista() {
    return [...document.querySelectorAll(".inv-input")]
      .map(input => input.value);
  }

  restaurar(inventarioArray) {
    this.container.innerHTML = "";

    inventarioArray.forEach((valor, index) => {
      const slot = document.createElement("div");
      slot.className = "inv-slot";
      slot.id = `inv${index + 1}`;

      const input = document.createElement("input");
      input.className = "inv-input";
      input.dataset.index = index;
      input.dataset.save = `inv_${index}`;
      input.value = valor;

      slot.appendChild(input);
      this.container.appendChild(slot);
    });
  }
}

/**
 * Gerencia sistema de abas
 */
class AbasManager {
  constructor(ficha) {
    this.ficha = ficha;
    this.senhaCorreta = ficha.senhaAbaTrancada;
    
    this.configurarEventos();
  }

  configurarEventos() {
    document.addEventListener("DOMContentLoaded", () => {
      // Abas do centro (Geral e Habilidades)
      const buttonsCentro = document.querySelectorAll(".tabs-center .tab");
      const contentsCentro = document.querySelectorAll(".panel.center .tab-content");

      buttonsCentro.forEach(btn => {
        btn.addEventListener("click", () => {
          // Remove active de todas as abas do centro
          buttonsCentro.forEach(b => b.classList.remove("active"));
          contentsCentro.forEach(c => c.classList.remove("active"));

          // Ativa a aba clicada
          btn.classList.add("active");
          const id = btn.dataset.tab;
          const conteudo = document.getElementById(id);
          if (conteudo) {
            conteudo.classList.add("active");
          }
        });
      });

      // Aba trancada (direita)
      const buttonsDireita = document.querySelectorAll(".panel.right .tabs .tab");
      
      buttonsDireita.forEach(btn => {
        btn.addEventListener("click", (e) => {
          if (btn.classList.contains("Lock")) {
            e.preventDefault();
            this.pedirSenha();
            return;
          }
        });
      });
    });
  }

  pedirSenha() {
    document.getElementById("senhaPopup").style.display = "flex";
  }

  fecharPopup() {
    document.getElementById("senhaPopup").style.display = "none";
  }

  confirmarSenha() {
    const senhaDigitada = document.getElementById("senhaInput").value;

    if (senhaDigitada === this.senhaCorreta) {
      window.open("https://watcher-iv.github.io/Spell_Menu/", "_blank");
      this.fecharPopup();
    } else {
      document.getElementById("erro").style.display = "block";
    }
  }

  liberar() {
    const aba = document.querySelector('.panel.right .tab[data-tab="tab-trancada"]');
    if (!aba) return;
    
    aba.classList.remove("Lock");
    aba.classList.add("active");
    
    const conteudo = document.getElementById("tab-trancada");
    if (conteudo) {
      conteudo.classList.add("active");
    }
  }
}

/**
 * Gerencia maldições
 */
class MaldicoesManager {
  constructor(ficha) {
    this.ficha = ficha;
    this.container = document.getElementById("cursesList");

    this.configurarEventos();
    this.carregar();
  }

  configurarEventos() {
    // Detecta Enter para criar nova linha
    this.container?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        document.execCommand("insertHTML", false, "<li><br></li>");
        e.preventDefault();
      }
    });

    // Auto salvar ao editar
    this.container?.addEventListener("input", () => this.salvar());
  }

  salvar() {
    localStorage.setItem("curses", this.container.innerHTML);
  }

  carregar() {
    const saved = localStorage.getItem("curses");
    if (saved) {
      this.container.innerHTML = saved;
    }
  }
}

/**
 * Gerencia interface e ajustes visuais
 */
class UIManager {
  constructor(ficha) {
    this.ficha = ficha;
    this.configurar();
  }

  configurar() {
    // Ajuste de tamanho do nome
    window.addEventListener('load', () => this.ajustarTamanhoNome());
    document.querySelector('.name-field')?.addEventListener('input', () => this.ajustarTamanhoNome());

    // Caixa de habilidades
    this.configurarHabilidades();
  }

  ajustarTamanhoNome() {
    const nome = document.querySelector('.name-field');
    if (!nome) return;

    const maxFont = 26;
    const minFont = 10;
    const parentWidth = nome.offsetWidth;

    nome.style.fontSize = maxFont + 'px';
    while (nome.scrollWidth > parentWidth && parseInt(nome.style.fontSize) > minFont) {
      nome.style.fontSize = (parseInt(nome.style.fontSize) - 1) + 'px';
    }
  }

  configurarHabilidades() {
    const habBox = document.getElementById("habText");
    if (!habBox) return;

    // Carregar do localStorage
    document.addEventListener("DOMContentLoaded", () => {
      const saved = localStorage.getItem("habText");
      if (saved) habBox.innerHTML = saved;
    });

    // Salvar ao digitar
    habBox.addEventListener("input", () => {
      localStorage.setItem("habText", habBox.innerHTML);
    });
  }
}

// ===============================
// INICIALIZAÇÃO
// ===============================

// Instância global da ficha
let fichaRPG;

// Inicializa quando o DOM estiver pronto
document.addEventListener("DOMContentLoaded", () => {
  fichaRPG = new FichaRPG();
});

// Funções globais para manter compatibilidade com HTML
function limparFicha() {
  fichaRPG?.limpar();
}

function pedirSenhaAba() {
  fichaRPG?.abas.pedirSenha();
}

function fecharPopup() {
  fichaRPG?.abas.fecharPopup();
}

function confirmarSenha() {
  fichaRPG?.abas.confirmarSenha();
}

function liberarAbaTrancada() {
  fichaRPG?.abas.liberar();
}
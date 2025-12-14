// ===============================
// SALVAR E CARREGAR FICHA
// ===============================

// Função que salva todos os inputs da página

let carregandoFicha = true;

function keyForElement(el, index) {
  // Prioridade: id -> name -> data-group+data-i -> data-save -> fallback index
  if (el.id) return el.id;
  if (el.name) return el.name;
  if (el.dataset && el.dataset.group && el.dataset.i !== undefined) return `${el.dataset.group}_${el.dataset.i}`;
  if (el.dataset && el.dataset.save) return el.dataset.save;
  return `input_${index}`;
}

function salvarFicha() {
  if (carregandoFicha) return;

  const dados = {};
  document.querySelectorAll("input, textarea, select").forEach((el, index) => {
    const chave = keyForElement(el, index);
    dados[chave] = el.value;
  });

  const buffs = [...document.querySelectorAll('.buff div')]
    .map(div => div.textContent.trim());

  dados["buffs"] = buffs;

  const inventario = [...document.querySelectorAll(".inv-input")]
  .map(input => input.value);

  dados["inventario"] = inventario;

  localStorage.setItem("fichaRPG", JSON.stringify(dados));
}


function carregarFicha() {
  const dadosSalvos = localStorage.getItem("fichaRPG");

  if (!dadosSalvos) {
    carregandoFicha = false; // 🔓 libera autosave mesmo sem ficha
    return;
  }

  const dados = JSON.parse(dadosSalvos);

  document.querySelectorAll("input, textarea, select").forEach((el, index) => {
    const chave = keyForElement(el, index);
    if (dados[chave] !== undefined) {
      el.value = dados[chave];

      // se for select, disparamos change pra recalcular limites/barra/etc
      if (el.tagName === "SELECT") {
        el.dispatchEvent(new Event("change", { bubbles: true }));
      } else {
        // para inputs/textarea, disparar input para qualquer lógica que escute input
        el.dispatchEvent(new Event("input", { bubbles: true }));
      }
    }
  });

  // Restaurar buffs depois de campos carregados
  if (dados.buffs !== undefined) {
    restaurarBuffs(dados.buffs);
  }

  if (Array.isArray(dados.inventario)) {
    invList.innerHTML = "";

    dados.inventario.forEach((valor, index) => {
      const slot = document.createElement("div");
      slot.className = "inv-slot";
      slot.id = `inv${index + 1}`;

      const input = document.createElement("input");
      input.className = "inv-input";
      input.dataset.index = index;
      input.dataset.save = `inv_${index}`;
      input.value = valor;

      slot.appendChild(input);
      invList.appendChild(slot);
    });
  }
  carregandoFicha = false;
}

// ativa autossalvamento global (captura selects dinamicos também)
document.addEventListener("input", salvarFicha);
document.addEventListener("change", salvarFicha);

function limparFicha() {
    if (confirm("Tem certeza que deseja apagar todos os dados da ficha?")) {
        localStorage.removeItem("fichaRPG");
        localStorage.removeItem("curses");
        localStorage.removeItem("habText");
        location.reload(); // recarrega a página limpa
    }
}

const habBox = document.getElementById("habText");

// Carregar do localStorage ao abrir
document.addEventListener("DOMContentLoaded", () => {
  const saved = localStorage.getItem("habText");
  if (saved) habBox.innerHTML = saved;
});

// Salvar quando o usuário digitar
habBox.addEventListener("input", () => {
  localStorage.setItem("habText", habBox.innerHTML);
});


document.addEventListener("DOMContentLoaded", () => {

    const buttons = document.querySelectorAll(".tab");
    const contents = document.querySelectorAll(".tab-content");

    buttons.forEach(btn => {
    btn.addEventListener("click", (e) => {

    // 🔒 se a aba estiver trancada
    if (btn.classList.contains("Lock")) {
      e.preventDefault();
      pedirSenhaAba();
      return;
    }

    // comportamento normal
    buttons.forEach(b => b.classList.remove("active"));
    contents.forEach(c => c.classList.remove("active"));

    btn.classList.add("active");

    const id = btn.dataset.tab;
    const conteudo = document.getElementById(id);

    if (conteudo) {
      conteudo.classList.add("active");
    }
  });
});
});

function ajustarTamanhoNome() {
  const nome = document.querySelector('.name-field');
  if (!nome) return;

  const maxFont = 26; // tamanho máximo
  const minFont = 10; // tamanho mínimo
  const parentWidth = nome.offsetWidth;

  nome.style.fontSize = maxFont + 'px';
  while (nome.scrollWidth > parentWidth && parseInt(nome.style.fontSize) > minFont) {
    nome.style.fontSize = (parseInt(nome.style.fontSize) - 1) + 'px';
  }
}

const senhaAbaTrancada = "Luka";

function pedirSenhaAba(e) {
  if (e) e.stopPropagation(); // impede troca de aba
  document.getElementById("senhaPopup").style.display = "flex";
}

function fecharPopup() {
  document.getElementById("senhaPopup").style.display = "none";
}

function confirmarSenha() {
  const senhaDigitada = document.getElementById("senhaInput").value;

  if (senhaDigitada === senhaAbaTrancada) {
    window.open("https://watcher-iv.github.io/Spell_Menu/", "_blank");
    fecharPopup();
  } else {
    document.getElementById("erro").style.display = "block";
  }

}

function liberarAbaTrancada() {
  const aba = document.querySelector('.tab[data-tab="tab-trancada"]');

  aba.classList.remove("Lock");

  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));

  aba.classList.add("active");
  document.getElementById("tab-trancada").classList.add("active");
}

// Roda quando a página carrega e sempre que o texto muda
window.addEventListener('load', ajustarTamanhoNome);
document.querySelector('.name-field').addEventListener('input', ajustarTamanhoNome);

/* Lógica principal e ligações
   - Cálculo de HP: 10 + IMP * 3
   - Tabela de PT por ESS
   - Barras de PV / PS / Tensão atualizadas a partir dos números (e aplicam limites)
*/
const ptTable = [10,16,22,28,34,40,46];

const impEl = document.getElementById('impeto');
const hpEl = document.getElementById('hpCalc');
const essEl = document.getElementById('essencia');
const ptEl = document.getElementById('ptCalc');

const pvEl = document.getElementById('pv');
const pvFill = document.getElementById('pvFill');

const psEl = document.getElementById('ps');
const psFill = document.getElementById('psFill');

const tensEl = document.getElementById('tensao');
const tFill = document.getElementById('tFill');
const tLabel = document.getElementById('tLabel');

const sedeEl = document.getElementById('sede');

//------------------------------------
// Para as fichas
//------------------------------------

const POT = document.getElementById('potencia')
const AST = document.getElementById('astucia')
const ESS = document.getElementById('essencia')
const MEN = document.getElementById('mente')
const IMP = document.getElementById('impeto')

function clamp(n,a,b){ return Math.max(a, Math.min(b, n)); }
function toInt(v){ const n = parseInt(v,10); return isNaN(n)?0:n; }

function updateHP(){
  const imp = toInt(impEl.value);
  const hp = 10 + (imp * 3);
  hpEl.textContent = hp;
  // garantir que PV não fique acima do HP
  if(toInt(pvEl.value) > hp) pvEl.value = hp;
  updatePVBar();
}

function atualizarImagemPV() {
    const pv = Number(document.getElementById("pv").value);
    const hp = Number(document.getElementById("hpCalc").textContent);
    const img = document.getElementById("statusPV");

    // Evita erro quando o PV estiver vazio
    if (!hp || hp <= 0 || pv < 0) return;

    const porcentagem = (pv / hp) * 100;

    console.log("PV:", pv, "HP:", hp, "PORCENTAGEM:", porcentagem);

    if (porcentagem >= 60) {
        img.src = "../../Images/Sprites/SpritesPlayer1/img1.png";
    }
    else if (porcentagem > 1) {
        img.src = "../../Images/Sprites/SpritesPlayer1/img2.jpg";
    }
    else {
        img.src = "../../Images/Sprites/SpritesPlayer1/img3.png";
    }
}

const invList = document.getElementById("invList");
const addBtn = document.getElementById("addItem");

addBtn.addEventListener("click", () => {
  const index = invList.children.length;

  const slot = document.createElement("div");
  slot.className = "inv-slot";
  slot.id = `inv${index + 1}`;

  const input = document.createElement("input");
  input.className = "inv-input";
  input.dataset.index = index;
  input.dataset.save = `inv_${index}`;
  input.placeholder = "Novo item...";

  slot.appendChild(input);
  invList.appendChild(slot);

  salvarFicha();
});

// Quando o PV mudar — ele atualiza.
document.getElementById("pv").addEventListener("input", atualizarImagemPV)

function updatePT(){
  let ess = clamp(toInt(essEl.value),0,6);
  const pt = ptTable[ess];
  ptEl.textContent = pt;
  // ajustar rótulo e preenchimento da tensão
  updateTension();
}
function updatePVBar(){
  const hp = toInt(hpEl.textContent || 10);
  let pv = clamp(toInt(pvEl.value), 0, hp);
  pvEl.value = pv;

  const pct = hp === 0 ? 0 : Math.round((pv / hp) * 100);
  pvFill.style.width = pct + '%';

  // label 16 / 16
  pvLabel.textContent = pv + ' / ' + hp;

  // brilho quando baixo
  pvFill.style.boxShadow =
    hp > 0 && pv / hp < 0.3
      ? '0 0 8px rgba(200,60,60,0.45)'
      : '';
}
function updatePSBar(){
  const maxPS = 50;
  let ps = clamp(toInt(psEl.value), 0, maxPS);
  psEl.value = ps;

  const pct = Math.round((ps / maxPS) * 100);
  psFill.style.width = pct + '%';

  // label 5 / 50
  psLabel.textContent = ps + ' / ' + maxPS;
}
function updateTension(){
  const pt = toInt(ptEl.textContent || 10);
  let t = clamp(toInt(tensEl.value), 0, pt);
  tensEl.value = t;
  const pct = pt === 0 ? 0 : Math.round((t / pt) * 100);
  tFill.style.width = pct + '%';
  tLabel.textContent = t + ' / ' + pt;
  // destaque sutil perto do limite
  tFill.style.boxShadow = t >= pt * 0.75 ? '0 0 8px rgba(255,60,60,0.45)' : '';
}

/* eventos */
impEl.addEventListener('input', updateHP);
pvEl.addEventListener('input', updatePVBar);
psEl.addEventListener('input', updatePSBar);
essEl.addEventListener('input', updatePT);
tensEl.addEventListener('input', updateTension);

/* inicial */
updateHP(); updatePT(); updatePVBar(); updatePSBar(); updateTension();

/* Benefícios (buffs) */
const addBuffBtn = document.getElementById('addBuff');
const buffText = document.getElementById('buffText');
const buffsDiv = document.getElementById('buffs');

addBuffBtn.addEventListener('click', () => {
  const text = (buffText.value || '').trim();
  if (!text) return;

  const row = document.createElement('div');
  row.className = 'buff';
  row.innerHTML = `
    <div>${escapeHtml(text)}</div>
    <button class="open-btn" type="button">✕</button>
  `;

  // botão de remover salva após deletar
  row.querySelector("button").addEventListener("click", () => {
    row.remove();
    salvarFicha();
  });

  buffsDiv.prepend(row);  // <-- elemento agora existe no DOM
  buffText.value = "";

  salvarFicha(); // <-- agora salva corretamente
});

function escapeHtml(s){ return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
document.querySelectorAll('[data-remove]').forEach(btn =>btn.addEventListener('click', function(){this.closest('.buff').remove(); salvarFicha();}));

function restaurarBuffs(buffsArray) {
  if (!Array.isArray(buffsArray)) return;

  buffsDiv.innerHTML = ""; // remove buff do HTML inicial

  buffsArray.forEach(text => {
    const row = document.createElement("div");
    row.className = "buff";
    row.innerHTML = `
      <div>${escapeHtml(text)}</div>
      <button class="open-btn" type="button">✕</button>
    `;

    // reativar botão de remover
    row.querySelector("button").addEventListener("click", () => {
      row.remove();
      salvarFicha(); // salva após remover
    });

    buffsDiv.append(row);
  });
}

const cursesList = document.getElementById("cursesList");

// Carregar dados salvos
document.addEventListener("DOMContentLoaded", () => {
  const saved = localStorage.getItem("curses");
  if (saved) cursesList.innerHTML = saved;
});

function ajustarTamanhoMaldições() {
  const curseText = document.querySelector('.curses-top .head');
  const container = document.querySelector('.curses-top');

  if (!curseText || !container) return;

  const maxFont = 26;
  const minFont = 10;

  curseText.style.fontSize = maxFont + 'px';

  // Diminui até caber dentro do container
  while (curseText.scrollWidth > container.clientWidth && parseInt(curseText.style.fontSize) > minFont) {
    curseText.style.fontSize = (parseInt(curseText.style.fontSize) - 1) + 'px';
  }
}

// Detectar Enter e criar nova linha
cursesList.addEventListener("keydown", function (e) {
  if (e.key === "Enter") {
    document.execCommand("insertHTML", false, "<li><br></li>");
    e.preventDefault();
  }
});

// Auto salvar sempre que editar
cursesList.addEventListener("input", () => {
  localStorage.setItem("curses", cursesList.innerHTML);
});

/* Aspectos: preencher os selects e ligar soma / reset / fix */
const LIMITE_PONTOS = 3;

function makeOptions(sel){
    sel.innerHTML = '';
    [[2,'+2'],[1,'+1'],[0,'0'],[-1,'-1']].forEach(o => {
        const opt = document.createElement('option');
        opt.value = o[0];
        opt.textContent = o[1];
        sel.appendChild(opt);
    });
}

function limitarGrupo(group) {
    const selects = document.querySelectorAll(`select[data-group="${group}"]`);

    // Conta quantos -1 existem no grupo
    const negativos = [...selects].filter(s => Number(s.value) === -1).length;

    // Novo limite dinâmico
    const limiteAtual = LIMITE_PONTOS + negativos;

    let soma = [...selects].reduce((acc, s) => acc + Number(s.value), 0);

    // Se passou do limite, desfaz a última ação
    if (soma > limiteAtual) {
        const ultimo = document.activeElement;
        if (ultimo && ultimo.tagName === "SELECT") {
            ultimo.value = ultimo.dataset.oldValue || 0;
        }
        soma = [...selects].reduce((acc, s) => acc + Number(s.value), 0);
    }

    // Atualiza o label visual
    const label = document.querySelector(`[data-sum="${group}"]`);
    if (label) {
        label.textContent = `(${soma}/${limiteAtual})`;
        label.style.color = soma === limiteAtual ? "var(--accent)" : "var(--danger)";
    }
}

const grupos = new Set(
    [...document.querySelectorAll("select[data-group]")].map(s => s.dataset.group)
);

grupos.forEach(group => {
    const selects = document.querySelectorAll(`select[data-group="${group}"]`);

    selects.forEach(sel => {
        makeOptions(sel);
        sel.value = 0;

        sel.addEventListener("focus", () => {
            sel.dataset.oldValue = sel.value;
        });

        sel.addEventListener("change", () => {
            limitarGrupo(group);
            salvarFicha(); // agora sim
        });
    });

    limitarGrupo(group);
});


// Agora que selects já têm opções, podemos carregar os valores
carregarFicha();

// Recalcular limites visuais após carregar valores salvos
grupos.forEach(group => limitarGrupo(group));

/* inicializar somas dos aspectos */
updateSumBadges();

/* pequenos detalhes: quando HP mudar, ajustar PV se necessário */
hpEl.addEventListener && hpEl.addEventListener('DOMSubtreeModified', ()=> updatePVBar());


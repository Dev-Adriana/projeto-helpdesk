const API_URL = "http://127.0.0.1:5000/chamados";

let todosOsChamados = [];
// Altere para buscar do localStorage caso exista um login ativo:
let perfilUsuarioLogado = localStorage.getItem("helpdesk_perfil") || ""; 

// 1. GERENCIAMENTO DE LOGIN
document.getElementById("form-login").addEventListener("submit", (e) => {
    e.preventDefault();
    
    const usuarioDigitado = document.getElementById("username").value.toLowerCase().trim();
    
    if (usuarioDigitado === "tecnico" || usuarioDigitado === "usuario") {
        perfilUsuarioLogado = usuarioDigitado;
        
        // SALVA O LOGIN NO NAVEGADOR:
        localStorage.setItem("helpdesk_perfil", usuarioDigitado);
        
        // Esconde a tela de login e mostra o sistema
        document.getElementById("tela-login").style.display = "none";
        document.getElementById("tela-sistema").style.display = "flex";
        
        // Mostra a barra com o nome do perfil no cabeçalho
        document.getElementById("usuario-logado").style.display = "block";
        document.getElementById("nome-perfil").innerText = usuarioDigitado.toUpperCase();
        document.getElementById("tipo-perfil").innerText = usuarioDigitado === "tecnico" ? "Técnico de TI" : "Colaborador";
        
        // Configura as permissões visuais na tela
        ajustarPermissoesDeTela();
        
        // Carrega os chamados do banco
        carregarChamados();
    } else {
        alert("Usuário inválido! Digite 'tecnico' ou 'usuario'.");
    }
});

// Função que esconde ou mostra botões e painéis com base no perfil
function ajustarPermissoesDeTela() {
    const secaoCriar = document.getElementById("secao-criar-chamado");
    const painelContadores = document.getElementById("painel-contadores");
    const barraBusca = document.getElementById("busca-chamado");
    const botaoPdf = document.getElementById("btn-pdf");

    if (perfilUsuarioLogado === "tecnico") {
        secaoCriar.style.display = "none"; // Técnico não abre chamados
        painelContadores.style.display = "flex"; // Técnico vê os contadores
        barraBusca.style.display = "block"; // Técnico vê a busca
        botaoPdf.style.display = "block"; // Mostra pro Técnico
    } else {
        secaoCriar.style.display = "block"; // Usuário abre chamados
        painelContadores.style.display = "none"; // Usuário não vê os contadores
        barraBusca.style.display = "none"; // Usuário não vê a busca
        botaoPdf.style.display = "none"; // Esconde do Usuário
    }
}

// Função de Logout atualizada para limpar o navegador
function fazerLogout() {
    perfilUsuarioLogado = "";
    localStorage.removeItem("helpdesk_perfil"); // Remove da memória do navegador
    
    document.getElementById("tela-login").style.display = "flex";
    document.getElementById("tela-sistema").style.display = "none";
    document.getElementById("usuario-logado").style.display = "none";
    document.getElementById("username").value = "";
    document.getElementById("password").value = "";
}

// 2. CONTROLE DOS CHAMADOS (CONECTADO AO PYTHON)
async function carregarChamados() {
    try {
        const resposta = await fetch(API_URL);
        todosOsChamados = await resposta.json();
        
        atualizarContadores(todosOsChamados);
        renderizarLista(todosOsChamados);
    } catch (erro) {
        console.error("Erro ao buscar chamados:", erro);
    }
}

function renderizarLista(lista) {
    const container = document.getElementById("chamados-container");
    container.innerHTML = ""; 

    lista.forEach(chamado => {
        const card = document.createElement("div");
        card.classList.add("chamado-card");
        
        let statusClasse = "aberto";
        if (chamado.status === "Em Atendimento") statusClasse = "atendimento";
        if (chamado.status === "Resolvido") statusClasse = "resolvido";

        const dataExibicao = chamado.data_criacao || "--/--/---- --:--";

        // IMPORTANTE: Se for usuário comum, ele não deve ver os botões de ação do técnico
        const botoesAcao = perfilUsuarioLogado === "tecnico" ? `
            <div class="acoes-tecnico">
                <button class="btn-acao" onclick="mudarStatus(${chamado.id}, 'Em Atendimento')">⚙️ Atender</button>
                <button class="btn-acao" onclick="mudarStatus(${chamado.id}, 'Resolvido')">✅ Resolver</button>
                <button class="btn-acao btn-excluir" onclick="deletarChamado(${chamado.id})">🗑️ Excluir</button>
            </div>
        ` : '';

        card.innerHTML = `
            <h3>${chamado.titulo} <span class="badge-prioridade prioridade-${chamado.prioridade}">${chamado.prioridade}</span></h3>
            <p>${chamado.descricao}</p>
            <div class="meta-info">📅 Criado em: <strong>${dataExibicao}</strong></div>
            <div class="meta-info">👨‍💻 Técnico: <strong>${chamado.tecnico}</strong></div>
            <span class="status ${statusClasse}">${chamado.status}</span>
            ${botoesAcao}
        `;
        
        container.appendChild(card);
    });
}

function atualizarContadores(lista) {
    const abertos = lista.filter(c => c.status === "Aberto").length;
    const atendimento = lista.filter(c => c.status === "Em Atendimento").length;
    const resolvidos = lista.filter(c => c.status === "Resolvido").length;

    // Só atualiza os elementos se eles existirem na tela
    if (document.getElementById("qtd-abertos")) {
        document.getElementById("qtd-abertos").innerText = abertos;
        document.getElementById("qtd-atendimento").innerText = atendimento;
        document.getElementById("qtd-resolvidos").innerText = resolvidos;
    }
}

// Filtro da barra de pesquisa
document.getElementById("busca-chamado").addEventListener("input", (e) => {
    const textoDigitado = e.target.value.toLowerCase();
    const chamadosFiltrados = todosOsChamados.filter(chamado => 
        chamado.titulo.toLowerCase().includes(textoDigitado)
    );
    renderizarLista(chamadosFiltrados);
});

// Envio de formulário de novo chamado
document.getElementById("form-chamado").addEventListener("submit", async (e) => {
    e.preventDefault();

    const titulo = document.getElementById("titulo").value;
    const descricao = document.getElementById("descricao").value;
    const prioridade = document.getElementById("prioridade").value;
    
    // O próprio nome do usuário logado vira o autor, e o técnico começa vazio
    const novoChamado = { 
        titulo, 
        descricao, 
        prioridade, 
        tecnico: "Aguardando atribuição" 
    };

    try {
        const resposta = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(novoChamado)
        });

        if (resposta.ok) {
            document.getElementById("titulo").value = "";
            document.getElementById("descricao").value = "";
            carregarChamados();
        }
    } catch (erro) {
        console.error("Erro ao criar chamado:", erro);
    }
});

async function mudarStatus(id, novoStatus) {
    try {
        const resposta = await fetch(`${API_URL}/${id}/status`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: novoStatus })
        });

        if (resposta.ok) {
            carregarChamados();
        }
    } catch (erro) {
        console.error("Erro ao atualizar status:", erro);
    }
}

async function deletarChamado(id) {
    if (confirm("Tem certeza que deseja excluir este chamado definitivamente?")) {
        try {
            const resposta = await fetch(`${API_URL}/${id}`, {
                method: "DELETE"
            });

            if (resposta.ok) {
                carregarChamados();
            }
        } catch (erro) {
            console.error("Erro ao excluir chamado:", erro);
        }
    }
}

// Função para abrir a rota do Python e baixar o PDF gerado
function baixarRelatorioPDF() {
    window.open("http://127.0.0.1:5000/chamados/relatorio", "_blank");
}

// CHECAGEM AUTOMÁTICA DE LOGIN: Executa toda vez que a página carrega ou atualiza
if (perfilUsuarioLogado) {
    // Se já estava logado, pula a tela de login e vai direto pro sistema
    document.getElementById("tela-login").style.display = "none";
    document.getElementById("tela-sistema").style.display = "flex";
    document.getElementById("usuario-logado").style.display = "block";
    document.getElementById("nome-perfil").innerText = perfilUsuarioLogado.toUpperCase();
    document.getElementById("tipo-perfil").innerText = perfilUsuarioLogado === "tecnico" ? "Técnico de TI" : "Colaborador";
    
    ajustarPermissoesDeTela();
    carregarChamados();
} else {
    // Se não tinha ninguém, força ir para a tela de login
    fazerLogout();
}

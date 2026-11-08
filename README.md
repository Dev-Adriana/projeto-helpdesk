# 🎫 Sistema de HelpDesk & Chamados Corporativos

Este é um sistema completo de gerenciamento de chamados de TI (HelpDesk) desenvolvido para separar os fluxos de atendimento entre colaboradores comuns e equipes técnicas de suporte. O projeto conta com persistência de dados em arquivos, controle de sessões e automações de nível empresarial.

---

## 🚀 Funcionalidades Principais

*   **🔒 Sistema de Autenticação por Perfis:** Separação visual e funcional completa entre usuários (`usuario`) e técnicos (`tecnico`).
*   **💾 Persistência de Dados Inteligente:** Dados guardados localmente via banco de dados em arquivo JSON e controle de login contínuo com `localStorage`.
*   **🚨 Automação de Alertas Críticos:** Disparo simulado via protocolo SMTP (e-mail) enviado à equipe de suporte em tempo real sempre que um incidente de prioridade **Crítica** é aberto.
*   **📄 Relatórios Gerenciais em PDF:** Geração automática e dinâmica de documentos PDF formatados através da biblioteca *ReportLab* no Python para auditoria e controle de métricas.
*   **📊 Painel Dinâmico de Indicadores:** Placar corporativo com contadores automatizados mapeando chamados abertos, em atendimento e resolvidos.
*   **🔍 Filtros de Busca Avançados:** Barra de pesquisa instantânea integrada para localização ágil de incidentes pelo título.

---

## 🛠️ Tecnologias Utilizadas

*   **Frontend:** HTML5, CSS3 (Modern Dark Mode integrado) e JavaScript Moderno (ES6+).
*   **Backend:** Python 3.15, Flask (Criação de APIs REST), Flask-CORS e ReportLab (Geração de PDFs).

---

## ⚙️ Como Executar o Projeto Localmente

### 1. Inicializar o Servidor (Backend)
Entre na pasta do backend e execute o servidor Flask:
```bash
cd backend
pip install flask flask-cors reportlab
python app.py
```
O servidor começará a rodar no endereço: `http://127.0.0.1:5000`

### 2. Inicializar a Interface (Frontend)
* Abra o arquivo `frontend/index.html` utilizando a extensão **Live Server** do VS Code.
* Utilize o usuário `usuario` ou `tecnico` para explorar os painéis integrados.

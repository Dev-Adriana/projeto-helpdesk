import json
import os
import smtplib
from datetime import datetime
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from flask import Flask, jsonify, request, send_file # <--- Adicionado send_file
from flask_cors import CORS

# IMPORTAÇÕES DO REPORTLAB PARA GERAR O PDF
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

app = Flask(__name__)
CORS(app)

ARQUIVO_BANCO = "backend/chamados.json"

def carregar_dados():
    if not os.path.exists(ARQUIVO_BANCO):
        dados_iniciais = [
            {
                "id": 1,
                "titulo": "Erro no VS Code",
                "descricao": "Não estou conseguindo instalar a extensão de idioma.",
                "prioridade": "Média",
                "tecnico": "Suporte Nível 1",
                "status": "Aberto",
                "data_criacao": datetime.now().strftime("%d/%m/%Y %H:%M")
            }
        ]
        salvar_dados(dados_iniciais)
        return dados_iniciais
    with open(ARQUIVO_BANCO, "r", encoding="utf-8") as f:
        return json.load(f)

def salvar_dados(dados):
    with open(ARQUIVO_BANCO, "w", encoding="utf-8") as f:
        json.dump(dados, f, indent=4, ensure_ascii=False)

@app.route('/chamados', methods=['GET'])
def listar_chamados():
    return jsonify(carregar_dados())

@app.route('/chamados', methods=['POST'])
def criar_chamado():
    chamados = carregar_dados()
    dados = request.json
    agora = datetime.now().strftime("%d/%m/%Y %H:%M")
    prioridade = dados.get("prioridade", "Média")
    titulo = dados.get("titulo")
    descricao = dados.get("descricao")
    tecnico = dados.get("tecnico", "Aguardando atribuição")
    
    novo_chamado = {
        "id": len(chamados) + 1,
        "titulo": titulo,
        "descricao": descricao,
        "prioridade": prioridade,
        "tecnico": tecnico,
        "status": "Aberto",
        "data_criacao": agora
    }
    chamados.append(novo_chamado)
    salvar_dados(chamados)
    return jsonify(novo_chamado), 201

@app.route('/chamados/<int:id_chamado>/status', methods=['PUT'])
def atualizar_status(id_chamado):
    chamados = carregar_dados()
    dados = request.json
    novo_status = dados.get("status")
    for chamado in chamados:
        if chamado["id"] == id_chamado:
            chamado["status"] = novo_status
            salvar_dados(chamados)
            return jsonify(chamado), 200
    return jsonify({"erro": "Chamado não encontrado"}), 404

@app.route('/chamados/<int:id_chamado>', methods=['DELETE'])
def excluir_chamado(id_chamado):
    chamados = carregar_dados()
    chamados_filtrados = [c for c in chamados if c["id"] != id_chamado]
    if len(chamados) == len(chamados_filtrados):
        return jsonify({"erro": "Chamado não encontrado"}), 404
    salvar_dados(chamados_filtrados)
    return jsonify({"mensagem": "Chamado excluído com sucesso"}), 200

# ROTA CORPORATIVA: GERADOR DE PDF PROFISSIONAL
@app.route('/chamados/relatorio', methods=['GET'])
def gerar_pdf_relatorio():
    chamados = carregar_dados()
    caminho_pdf = "backend/relatorio_chamados.pdf"
    
    # Configuração do documento PDF
    doc = SimpleDocTemplate(caminho_pdf, pagesize=letter, rightMargin=30, leftMargin=30, topMargin=30, bottomMargin=30)
    elementos = []
    
    styles = getSampleStyleSheet()
    
    # Estilos customizados
    estilo_titulo = ParagraphStyle('TituloPDF', parent=styles['Heading1'], fontSize=22, textColor=colors.HexColor("#202024"), spaceAfter=10)
    estilo_sub = ParagraphStyle('SubPDF', parent=styles['Normal'], fontSize=10, textColor=colors.HexColor("#777777"), spaceAfter=20)
    estilo_celula = ParagraphStyle('CelulaPDF', parent=styles['Normal'], fontSize=9)
    estilo_cabecalho_celula = ParagraphStyle('CabecalhoPDF', parent=styles['Normal'], fontSize=10, fontName="Helvetica-Bold", textColor=colors.white)

    # Cabeçalho do Relatório
    elementos.append(Paragraph("🎫 RELATÓRIO GERENCIAL - HELPDESK", estilo_titulo))
    data_hoje = datetime.now().strftime("%d/%m/%Y às %H:%M")
    elementos.append(Paragraph(f"Gerado automaticamente em: {data_hoje} | Total de chamados: {len(chamados)}", estilo_sub))
    elementos.append(Spacer(1, 10))
    
    # Montagem da Tabela de Dados
    dados_tabela = [[
        Paragraph("ID", estilo_cabecalho_celula),
        Paragraph("Título", estilo_cabecalho_celula),
        Paragraph("Prioridade", estilo_cabecalho_celula),
        Paragraph("Técnico", estilo_cabecalho_celula),
        Paragraph("Status", estilo_cabecalho_celula)
    ]]
    
    for c in chamados:
        dados_tabela.append([
            Paragraph(str(c['id']), estilo_celula),
            Paragraph(c['titulo'], estilo_celula),
            Paragraph(c['prioridade'], estilo_celula),
            Paragraph(c['tecnico'], estilo_celula),
            Paragraph(c['status'], estilo_celula)
        ])
    
    # Estilização da tabela com padrões de design corporativo
    tabela = Table(dados_tabela, colWidths=[30, 200, 70, 150, 100])
    tabela.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#202024")), # Cabeçalho escuro
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
        ('TOPPADDING', (0, 0), (-1, 0), 8),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.HexColor("#f9f9f9"), colors.white]), # Linhas alternadas
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#e1e1e6")),
        ('TOPPADDING', (0, 1), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 6),
    ]))
    
    elementos.append(tabela)
    
    # Constrói o arquivo
    doc.build(elementos)
    
    # Envia o arquivo PDF gerado direto para o navegador fazer o download
    return send_file("relatorio_chamados.pdf", as_attachment=True)

if __name__ == '__main__':
    app.run(debug=True, port=5000)

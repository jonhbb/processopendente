// Funções de validação
function validarPlaca(placa) {
    const regexPlaca = /^[A-Z]{3}[0-9]{4}$|^[A-Z]{3}[0-9]{1}[A-Z]{1}[0-9]{2}$/;
    return regexPlaca.test(placa.toUpperCase());
}

function validarData(data) {
    const dataObj = new Date(data);
    return dataObj instanceof Date && !isNaN(dataObj);
}

// Função para exibir mensagens do sistema
function mostrarMensagem(mensagem, tipo = 'success') {
    const modalMensagem = document.getElementById('modalMensagem');
    const modalMensagemTexto = document.getElementById('modalMensagemTexto');
    const modalMensagemTitulo = document.getElementById('modalMensagemTitulo');

    // Configura o tipo de alerta
    modalMensagemTexto.className = `alert alert-${tipo}`;
    
    // Define o título baseado no tipo
    switch(tipo) {
        case 'success':
            modalMensagemTitulo.textContent = 'Sucesso';
            break;
        case 'danger':
            modalMensagemTitulo.textContent = 'Erro';
            break;
        case 'warning':
            modalMensagemTitulo.textContent = 'Atenção';
            break;
        default:
            modalMensagemTitulo.textContent = 'Mensagem do Sistema';
    }

    // Define o texto da mensagem
    modalMensagemTexto.textContent = mensagem;

    // Exibe o modal
    const modal = new bootstrap.Modal(modalMensagem);
    modal.show();
}

// Funções de navegação
function navegarPara(pagina) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(pagina).classList.add('active');
    
    document.querySelectorAll('#sidebar li').forEach(li => li.classList.remove('active'));
    document.querySelector(`#sidebar li a[data-page="${pagina}"]`).parentElement.classList.add('active');
}

// Funções de manipulação de formulários
function limparFormulario(formId) {
    document.getElementById(formId).reset();
}

function coletarDadosProcesso() {
    return {
        numeroProcesso: document.getElementById('numeroProcesso').value,
        dataInicial: document.getElementById('dataInicial').value,
        requerente: document.getElementById('requerente').value,
        tipoVeiculo: document.getElementById('tipoVeiculo').value,
        placa: document.getElementById('placa').value.toUpperCase(),
        status: document.getElementById('status').value,
        motivoPendencia: document.getElementById('motivoPendencia').value
    };
}

// Funções de exibição
function exibirProcessos(processos) {
    const tbody = document.getElementById('tabelaResultados');
    tbody.innerHTML = '';

    processos.forEach(processo => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${processo.numeroProcesso}</td>
            <td>${processo.dataInicial}</td>
            <td>${processo.requerente}</td>
            <td>${processo.tipoVeiculo}</td>
            <td>${processo.placa}</td>
            <td>${processo.status}</td>
            <td>
                <button class="btn btn-sm btn-primary btn-action" onclick="abrirModalAlterarStatus(${processo.id})">
                    Alterar Status
                </button>
                <button class="btn btn-sm btn-info btn-action" onclick="abrirModalHistorico(${processo.id})">
                    Histórico
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Funções de modal
function abrirModalAlterarStatus(processoId) {
    // Converte o ID para número
    document.getElementById('processoId').value = Number(processoId);
    document.getElementById('novoStatus').value = '';
    const modal = new bootstrap.Modal(document.getElementById('modalAlterarStatus'));
    modal.show();
}

function abrirModalHistorico(processoId) {
    buscarHistorico(processoId).then(historico => {
        const tbody = document.getElementById('tabelaHistorico');
        tbody.innerHTML = '';
        
        historico.forEach(h => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${new Date(h.data).toLocaleString()}</td>
                <td>${h.status}</td>
                <td>${h.responsavel}</td>
            `;
            tbody.appendChild(tr);
        });
        
        const modal = new bootstrap.Modal(document.getElementById('modalHistorico'));
        modal.show();
    }).catch(error => {
        mostrarMensagem('Erro ao buscar histórico: ' + error, 'danger');
    });
}

// Funções do Dashboard
async function atualizarDashboard() {
    try {
        // Busca todos os processos
        const processos = await buscarProcessos();
        
        // Atualiza contadores
        document.getElementById('totalProcessos').textContent = processos.length;
        document.getElementById('processosAprovados').textContent = processos.filter(p => p.status === 'Aprovado').length;
        document.getElementById('processosReprovados').textContent = processos.filter(p => p.status === 'Reprovado').length;
        document.getElementById('processosCancelados').textContent = processos.filter(p => p.status === 'Cancelado').length;

        // Atualiza últimos processos
        const tbodyUltimos = document.getElementById('ultimosProcessos');
        const ultimosProcessos = processos
            .sort((a, b) => new Date(b.dataInicial) - new Date(a.dataInicial))
            .slice(0, 5);

        tbodyUltimos.innerHTML = '';
        
        ultimosProcessos.forEach(processo => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${processo.numeroProcesso}</td>
                <td>${processo.dataInicial}</td>
                <td>${processo.requerente}</td>
                <td>${processo.tipoVeiculo}</td>
                <td><span class="badge bg-${getStatusColor(processo.status)}">${processo.status}</span></td>
            `;
            tbodyUltimos.appendChild(tr);
        });

        // Atualiza distribuição por status
        const distribuicaoStatus = document.getElementById('distribuicaoStatus');
        distribuicaoStatus.innerHTML = '';

        const statusCount = {};
        processos.forEach(p => {
            statusCount[p.status] = (statusCount[p.status] || 0) + 1;
        });

        const cores = {
            'Aprovado': 'success',
            'Reprovado': 'danger',
            'Cancelado': 'warning',
            'Pendente': 'secondary'
        };

        Object.entries(statusCount).forEach(([status, quantidade]) => {
            const percentual = ((quantidade / processos.length) * 100).toFixed(1);
            const elemento = document.createElement('div');
            elemento.className = 'list-group-item d-flex justify-content-between align-items-center';
            elemento.innerHTML = `
                <div>
                    <span class="badge bg-${cores[status] || 'secondary'} me-2">${status}</span>
                    ${quantidade} processo(s)
                </div>
                <span class="badge bg-primary rounded-pill">${percentual}%</span>
            `;
            distribuicaoStatus.appendChild(elemento);
        });

        // Atualiza distribuição por tipo de veículo
        const distribuicaoVeiculos = document.getElementById('distribuicaoVeiculos');
        distribuicaoVeiculos.innerHTML = '';

        const veiculoCount = {};
        processos.forEach(p => {
            veiculoCount[p.tipoVeiculo] = (veiculoCount[p.tipoVeiculo] || 0) + 1;
        });

        Object.entries(veiculoCount).forEach(([tipo, quantidade]) => {
            const percentual = ((quantidade / processos.length) * 100).toFixed(1);
            const elemento = document.createElement('div');
            elemento.className = 'list-group-item d-flex justify-content-between align-items-center';
            elemento.innerHTML = `
                <div>
                    <i class="fas fa-car me-2"></i>
                    ${tipo || 'Não especificado'}
                </div>
                <div>
                    <span class="me-3">${quantidade} processo(s)</span>
                    <span class="badge bg-primary rounded-pill">${percentual}%</span>
                </div>
            `;
            distribuicaoVeiculos.appendChild(elemento);
        });

    } catch (error) {
        mostrarMensagem('Erro ao atualizar dashboard: ' + error, 'danger');
    }
}

function calcularEstatisticas(processos, campo) {
    const total = processos.length;
    const contagem = processos.reduce((acc, processo) => {
        const valor = processo[campo];
        acc[valor] = acc[valor] || { quantidade: 0, percentual: 0 };
        acc[valor].quantidade++;
        acc[valor].percentual = (acc[valor].quantidade / total) * 100;
        return acc;
    }, {});

    return contagem;
}

function getStatusColor(status) {
    switch (status) {
        case 'Aprovado':
            return 'success';
        case 'Reprovado':
            return 'danger';
        case 'Cancelado':
            return 'warning';
        default:
            return 'secondary';
    }
}

// Configuração da paginação
const ITENS_POR_PAGINA = 10;
let paginaAtual = 1;
let dadosRelatorio = [];

// Funções para Relatórios
async function gerarRelatorio(processos, titulo) {
    // Atualiza o título do relatório
    document.querySelector('#tabelaRelatorio').closest('.card').querySelector('.card-header h6').textContent = titulo;

    // Limpa a tabela atual
    const tbody = document.getElementById('corpoRelatorio');
    tbody.innerHTML = '';

    // Atualiza o total de registros
    document.getElementById('totalRegistros').textContent = processos.length;

    // Configuração da paginação
    const itensPorPagina = 10;
    let paginaAtual = 1;
    const totalPaginas = Math.ceil(processos.length / itensPorPagina);

    function exibirPagina(pagina) {
        const inicio = (pagina - 1) * itensPorPagina;
        const fim = inicio + itensPorPagina;
        const processosPagina = processos.slice(inicio, fim);

        tbody.innerHTML = '';
        processosPagina.forEach(processo => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${processo.numeroProcesso}</td>
                <td>${processo.dataInicial}</td>
                <td>${processo.requerente}</td>
                <td>${processo.tipoVeiculo}</td>
                <td>${processo.placa}</td>
                <td><span class="badge bg-${getStatusColor(processo.status)}">${processo.status}</span></td>
                <td>${processo.motivoPendencia || '-'}</td>
            `;
            tbody.appendChild(tr);
        });

        // Atualiza botões de paginação
        document.getElementById('btnAnterior').disabled = pagina === 1;
        document.getElementById('btnProximo').disabled = pagina === totalPaginas;
        document.getElementById('paginaAtual').textContent = pagina;
    }

    // Event listeners para paginação
    document.getElementById('btnAnterior').onclick = () => {
        if (paginaAtual > 1) {
            paginaAtual--;
            exibirPagina(paginaAtual);
        }
    };

    document.getElementById('btnProximo').onclick = () => {
        if (paginaAtual < totalPaginas) {
            paginaAtual++;
            exibirPagina(paginaAtual);
        }
    };

    // Exibe a primeira página
    exibirPagina(1);

    // Habilita botões de exportação
    document.getElementById('btnExportarPDF').disabled = processos.length === 0;
    document.getElementById('btnExportarExcel').disabled = processos.length === 0;

    // Scroll para a tabela de resultados
    document.querySelector('#tabelaRelatorio').scrollIntoView({ behavior: 'smooth' });
}

// Event Listeners para os formulários de relatório
document.getElementById('formRelatorioPeriodo').addEventListener('submit', async (e) => {
    e.preventDefault();
    const dataInicio = document.getElementById('dataInicio').value;
    const dataFim = document.getElementById('dataFim').value;
    const status = document.getElementById('statusPeriodo').value;

    try {
        let processos = await buscarProcessos({});
        
        // Filtra por período
        processos = processos.filter(p => {
            const data = new Date(p.dataInicial);
            return data >= new Date(dataInicio) && data <= new Date(dataFim);
        });

        // Filtra por status se especificado
        if (status) {
            processos = processos.filter(p => p.status === status);
        }

        const titulo = `Relatório por Período: ${dataInicio} a ${dataFim}${status ? ` - Status: ${status}` : ''}`;
        await gerarRelatorio(processos, titulo);
    } catch (error) {
        mostrarMensagem('Erro ao gerar relatório: ' + error, 'danger');
    }
});

document.getElementById('formRelatorioStatus').addEventListener('submit', async (e) => {
    e.preventDefault();
    const status = document.getElementById('statusRelatorio').value;
    const tipoVeiculo = document.getElementById('tipoVeiculoStatus').value;

    try {
        let processos = await buscarProcessos({ status });
        
        if (tipoVeiculo) {
            processos = processos.filter(p => p.tipoVeiculo === tipoVeiculo);
        }

        const titulo = `Relatório por Status: ${status}${tipoVeiculo ? ` - Veículo: ${tipoVeiculo}` : ''}`;
        await gerarRelatorio(processos, titulo);
    } catch (error) {
        mostrarMensagem('Erro ao gerar relatório: ' + error, 'danger');
    }
});

document.getElementById('formRelatorioVeiculo').addEventListener('submit', async (e) => {
    e.preventDefault();
    const tipoVeiculo = document.getElementById('tipoVeiculoRelatorio').value;
    const status = document.getElementById('statusVeiculo').value;

    try {
        let processos = await buscarProcessos({ tipoVeiculo });
        
        if (status) {
            processos = processos.filter(p => p.status === status);
        }

        const titulo = `Relatório por Tipo de Veículo: ${tipoVeiculo}${status ? ` - Status: ${status}` : ''}`;
        await gerarRelatorio(processos, titulo);
    } catch (error) {
        mostrarMensagem('Erro ao gerar relatório: ' + error, 'danger');
    }
});

// Event listener para limpar filtros
document.getElementById('btnLimparFiltros').addEventListener('click', () => {
    // Limpa os formulários
    document.getElementById('formRelatorioPeriodo').reset();
    document.getElementById('formRelatorioStatus').reset();
    document.getElementById('formRelatorioVeiculo').reset();

    // Limpa a tabela de resultados
    document.getElementById('corpoRelatorio').innerHTML = '';
    document.getElementById('totalRegistros').textContent = '0';
    document.getElementById('paginaAtual').textContent = '1';

    // Desabilita botões de navegação
    document.getElementById('btnAnterior').disabled = true;
    document.getElementById('btnProximo').disabled = true;

    // Desabilita botões de exportação
    document.getElementById('btnExportarPDF').disabled = true;
    document.getElementById('btnExportarExcel').disabled = true;

    // Reseta o título do relatório
    document.querySelector('#tabelaRelatorio').closest('.card').querySelector('.card-header h6').textContent = 'Resultado do Relatório';
});

// Funções de exportação de relatórios
function exportarRelatorioPDF(processos, titulo) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Cabeçalho
    doc.setFontSize(16);
    doc.text('CRVA 0371 - Tramandaí/RS', 14, 15);
    doc.text(titulo, 14, 25);
    
    // Data do relatório
    doc.setFontSize(10);
    doc.text(`Data do relatório: ${new Date().toLocaleDateString()}`, 14, 35);

    // Tabela de processos
    const headers = [['Nº Processo', 'Data', 'Requerente', 'Veículo', 'Placa', 'Status', 'Motivo']];
    const data = processos.map(p => [
        p.numeroProcesso,
        p.dataInicial,
        p.requerente,
        p.tipoVeiculo,
        p.placa,
        p.status,
        p.motivoPendencia || '-'
    ]);

    doc.autoTable({
        startY: 40,
        head: headers,
        body: data,
        theme: 'grid',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [66, 139, 202] },
        columnStyles: {
            0: { cellWidth: 25 },
            1: { cellWidth: 20 },
            2: { cellWidth: 35 },
            3: { cellWidth: 25 },
            4: { cellWidth: 20 },
            5: { cellWidth: 20 },
            6: { cellWidth: 'auto' }
        }
    });

    // Resumo
    const totalProcessos = processos.length;
    const aprovados = processos.filter(p => p.status === 'Aprovado').length;
    const reprovados = processos.filter(p => p.status === 'Reprovado').length;
    const cancelados = processos.filter(p => p.status === 'Cancelado').length;

    const finalY = doc.previousAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.text('Resumo:', 14, finalY);
    doc.setFontSize(10);
    doc.text(`Total de Processos: ${totalProcessos}`, 14, finalY + 7);
    doc.text(`Processos Aprovados: ${aprovados}`, 14, finalY + 14);
    doc.text(`Processos Reprovados: ${reprovados}`, 14, finalY + 21);
    doc.text(`Processos Cancelados: ${cancelados}`, 14, finalY + 28);

    // Salvar o PDF
    doc.save(`relatorio_processos_${new Date().toISOString().split('T')[0]}.pdf`);
}

function exportarRelatorioExcel(processos, titulo) {
    // Criar array com cabeçalho
    const headers = ['Número do Processo', 'Data', 'Requerente', 'Veículo', 'Placa', 'Status', 'Motivo da Pendência'];
    
    // Criar linhas de dados
    const rows = processos.map(p => [
        p.numeroProcesso,
        p.dataInicial,
        p.requerente,
        p.tipoVeiculo,
        p.placa,
        p.status,
        p.motivoPendencia || '-'
    ]);

    // Juntar cabeçalho e dados
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
    ].join('\n');

    // Criar blob e fazer download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio_processos_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Inicializa o banco de dados primeiro
    initDatabase().then(() => {
        // Atualiza o dashboard quando o banco de dados estiver pronto
        atualizarDashboard();

        // Navegação
        document.querySelectorAll('#sidebar a').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const pagina = e.target.closest('a').dataset.page;
                navegarPara(pagina);
                if (pagina === 'home') {
                    atualizarDashboard();
                }
            });
        });

        // Formulário de cadastro
        document.getElementById('processoForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const processo = coletarDadosProcesso();
            
            // Validações
            if (!validarPlaca(processo.placa)) {
                mostrarMensagem('Formato de placa inválido. Use o formato ABC1234 ou ABC1A23', 'warning');
                return;
            }
            
            if (!validarData(processo.dataInicial)) {
                mostrarMensagem('Data inválida', 'warning');
                return;
            }

            try {
                await adicionarProcesso(processo);
                mostrarMensagem('Processo cadastrado com sucesso!');
                limparFormulario('processoForm');
                atualizarDashboard();
            } catch (error) {
                mostrarMensagem('Erro ao cadastrar processo: ' + error, 'danger');
            }
        });

        // Formulário de pesquisa
        document.getElementById('pesquisaForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const filtros = {
                numeroProcesso: document.getElementById('pesquisaNumero').value,
                placa: document.getElementById('pesquisaPlaca').value,
                tipoVeiculo: document.getElementById('pesquisaTipoVeiculo').value,
                status: document.getElementById('pesquisaStatus').value
            };

            try {
                const processos = await buscarProcessos(filtros);
                exibirProcessos(processos);
            } catch (error) {
                mostrarMensagem('Erro ao buscar processos: ' + error, 'danger');
            }
        });

        // Botões de exportação
        document.getElementById('exportarCSV').addEventListener('click', async () => {
            try {
                const processos = await buscarProcessos({});
                exportarCSV(processos);
                mostrarMensagem('Arquivo CSV exportado com sucesso!');
            } catch (error) {
                mostrarMensagem('Erro ao exportar CSV: ' + error, 'danger');
            }
        });

        document.getElementById('btnExportarPDF').addEventListener('click', async () => {
            try {
                const titulo = document.querySelector('#tabelaRelatorio').closest('.card').querySelector('.card-header h6').textContent;
                const tbody = document.getElementById('corpoRelatorio');
                const processos = Array.from(tbody.querySelectorAll('tr')).map(tr => ({
                    numeroProcesso: tr.cells[0].textContent,
                    dataInicial: tr.cells[1].textContent,
                    requerente: tr.cells[2].textContent,
                    tipoVeiculo: tr.cells[3].textContent,
                    placa: tr.cells[4].textContent,
                    status: tr.cells[5].textContent,
                    motivoPendencia: tr.cells[6].textContent
                }));

                if (processos.length === 0) {
                    mostrarMensagem('Não há dados para exportar', 'warning');
                    return;
                }

                exportarRelatorioPDF(processos, titulo);
                mostrarMensagem('Relatório PDF gerado com sucesso!', 'success');
            } catch (error) {
                mostrarMensagem('Erro ao gerar PDF: ' + error, 'danger');
            }
        });

        document.getElementById('btnExportarExcel').addEventListener('click', async () => {
            try {
                const titulo = document.querySelector('#tabelaRelatorio').closest('.card').querySelector('.card-header h6').textContent;
                const tbody = document.getElementById('corpoRelatorio');
                const processos = Array.from(tbody.querySelectorAll('tr')).map(tr => ({
                    numeroProcesso: tr.cells[0].textContent,
                    dataInicial: tr.cells[1].textContent,
                    requerente: tr.cells[2].textContent,
                    tipoVeiculo: tr.cells[3].textContent,
                    placa: tr.cells[4].textContent,
                    status: tr.cells[5].textContent.replace(/\s+/g, ''), // Remove espaços extras
                    motivoPendencia: tr.cells[6].textContent
                }));

                if (processos.length === 0) {
                    mostrarMensagem('Não há dados para exportar', 'warning');
                    return;
                }

                exportarRelatorioExcel(processos, titulo);
                mostrarMensagem('Relatório Excel gerado com sucesso!', 'success');
            } catch (error) {
                mostrarMensagem('Erro ao gerar Excel: ' + error, 'danger');
            }
        });

        // Modal de alteração de status
        document.getElementById('btnSalvarStatus').addEventListener('click', async () => {
            const processoId = Number(document.getElementById('processoId').value);
            const novoStatus = document.getElementById('novoStatus').value;

            if (!novoStatus) {
                mostrarMensagem('Selecione um status', 'warning');
                return;
            }

            try {
                const processo = await buscarProcessoPorId(processoId);
                processo.status = novoStatus;
                await atualizarProcesso(processo);
                
                const modal = bootstrap.Modal.getInstance(document.getElementById('modalAlterarStatus'));
                modal.hide();
                
                mostrarMensagem('Status atualizado com sucesso!');
                document.getElementById('pesquisaForm').dispatchEvent(new Event('submit'));
                atualizarDashboard();
            } catch (error) {
                mostrarMensagem('Erro ao alterar status: ' + error, 'danger');
            }
        });

        // Event Listeners para Backup
        document.getElementById('btnBackup').addEventListener('click', async () => {
            try {
                await realizarBackup();
                mostrarMensagem('Backup realizado com sucesso!', 'success');
            } catch (error) {
                mostrarMensagem('Erro ao realizar backup: ' + error.message, 'danger');
            }
        });

        document.getElementById('btnRestaurar').addEventListener('click', () => {
            document.getElementById('inputRestaurar').click();
        });

        document.getElementById('inputRestaurar').addEventListener('change', async (event) => {
            const file = event.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const conteudo = JSON.parse(e.target.result);
                    await restaurarBackup(conteudo);
                    exibirMensagem('Backup restaurado com sucesso!', 'success');
                    // Recarrega a página para atualizar os dados
                    setTimeout(() => location.reload(), 1500);
                } catch (error) {
                    exibirMensagem('Erro ao restaurar backup: ' + error.message, 'error');
                }
            };
            reader.readAsText(file);
        });

        // Inicializa os tooltips
        document.addEventListener('DOMContentLoaded', () => {
            const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
            tooltipTriggerList.map(function (tooltipTriggerEl) {
                return new bootstrap.Tooltip(tooltipTriggerEl);
            });
        });
    }).catch(error => {
        mostrarMensagem('Erro ao inicializar o banco de dados: ' + error, 'danger');
    });
}); 
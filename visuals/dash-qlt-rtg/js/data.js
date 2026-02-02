// Dados do Dashboard de Data Governance

const dashboardData = {
    // Estatísticas principais
    stats: [
        {
            icon: 'database',
            value: '6',
            label: 'Catálogos'
        },
        {
            icon: 'layout',
            value: '95',
            label: 'Schemas'
        },
        {
            icon: 'table',
            value: '639',
            label: 'Tabelas'
        },
        {
            icon: 'list',
            value: '6,047',
            label: 'Campos'
        }
    ],

    // Métricas de qualidade
    metrics: [
        { label: "Disponibilidade", value: 88.3 },
        { label: "Completude", value: 95.2 },
        { label: "Consistência", value: 94.3 },
        { label: "Integridade", value: 97.8 },
        { label: "Unicidade", value: 99.9 },
        { label: "Variação", value: 95.8 },
        { label: "Validade", value: null } // N/A
    ],

    // Execuções
    executions: [
        { label: 'Consistência', value: 1888076, max: 2000000 },
        { label: 'Completude', value: 1611898, max: 2000000 },
        { label: 'Disponibilidade', value: 100742, max: 2000000 },
        { label: 'Integridade', value: 18942, max: 2000000 },
        { label: 'Variação', value: 2963, max: 2000000 },
        { label: 'Unicidade', value: 2202, max: 2000000 }
    ],

    // AI Insight
    aiInsight: {
        text: 'A <strong>Disponibilidade</strong> caiu 2% em relação à semana passada. Verifique os jobs noturnos no Schema 95.'
    },

    // Summary
    summary: {
        title: 'Status Geral',
        description: 'Sua governança está performando acima da média.',
        buttonText: 'Relatório Completo'
    }
};

// Ícones SVG
const icons = {
    database: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/><path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3"/>',
    
    layout: '<rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/>',
    
    table: '<path d="M12 3v18"/><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/>',
    
    list: '<line x1="8" x2="21" y1="6" y2="6"/><line x1="8" x2="21" y1="12" y2="12"/><line x1="8" x2="21" y1="18" y2="18"/><line x1="3" x2="3.01" y1="6" y2="6"/><line x1="3" x2="3.01" y1="12" y2="12"/><line x1="3" x2="3.01" y1="18" y2="18"/>'
};

// Função para obter cor baseada no valor (gradiente Bradesco)
function getColorByValue(value) {
    if (value === null) return '#D1D5DB'; // gray-300 para N/A
    
    // Transição ULTRA-SUAVE: 10 steps do vermelho ao azul profundo
    if (value < 70) return '#CC092F';  // Vermelho Bradesco (Crítico)
    if (value < 75) return '#E63946';  // Vermelho médio
    if (value < 80) return '#F77F00';  // Laranja escuro
    if (value < 85) return '#FCBF49';  // Laranja claro / Âmbar
    if (value < 88) return '#FCD34D';  // Amarelo dourado
    if (value < 91) return '#67E8F9';  // Ciano muito claro
    if (value < 94) return '#22D3EE';  // Ciano claro
    if (value < 96) return '#3B82F6';  // Azul céu
    if (value < 98) return '#2563EB';  // Azul médio
    return '#1E40AF';                  // Azul profundo (Perfeito)
}

// Gradientes para os anéis (versão suave)
function getRingGradient(value) {
    if (value === null) return null;
    
    // Cada faixa tem seu gradiente customizado para transição suave
    const colors = {
        critical1: { start: '#CC092F', end: '#E63946' },   // Vermelho Bradesco → Vermelho médio
        critical2: { start: '#E63946', end: '#F77F00' },   // Vermelho médio → Laranja escuro
        attention1: { start: '#F77F00', end: '#FCBF49' },  // Laranja escuro → Laranja claro
        attention2: { start: '#FCBF49', end: '#FCD34D' },  // Laranja claro → Amarelo
        moderate: { start: '#FCD34D', end: '#67E8F9' },    // Amarelo → Ciano muito claro
        good1: { start: '#67E8F9', end: '#22D3EE' },       // Ciano muito claro → Ciano claro
        good2: { start: '#22D3EE', end: '#3B82F6' },       // Ciano claro → Azul céu
        excellent: { start: '#3B82F6', end: '#2563EB' },   // Azul céu → Azul médio
        perfect: { start: '#2563EB', end: '#1E40AF' }      // Azul médio → Azul profundo
    };
    
    if (value < 70) return colors.critical1;
    if (value < 75) return colors.critical2;
    if (value < 80) return colors.attention1;
    if (value < 85) return colors.attention2;
    if (value < 88) return colors.moderate;
    if (value < 91) return colors.good1;
    if (value < 94) return colors.good2;
    if (value < 96) return colors.excellent;
    if (value < 98) return colors.perfect;
    return { start: '#1E40AF', end: '#1E3A8A' }; // Azul profundo → Azul navy
}
// Funções de Renderização do Dashboard

// Função para clarear a cor automaticamente
function lightenColor(color, percent) {
    // Remove o # se existir
    const hex = color.replace('#', '');
    
    // Converte para RGB
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    // Aumenta cada componente
    const newR = Math.min(255, r + Math.round((255 - r) * percent / 100));
    const newG = Math.min(255, g + Math.round((255 - g) * percent / 100));
    const newB = Math.min(255, b + Math.round((255 - b) * percent / 100));
    
    // Retorna em formato hex
    return '#' + [newR, newG, newB].map(x => x.toString(16).padStart(2, '0')).join('');
}

// Renderizar KPI Cards
function renderKPIs() {
    const kpiRow = document.getElementById('kpi-row');
    
    dashboardData.kpis.forEach(kpi => {
        const card = document.createElement('div');
        card.className = 'kpi-card';
        card.style.animationDelay = kpi.animationDelay;
        
        card.innerHTML = `
            <span class='kpi-lbl'>${kpi.label}</span>
            <span class='kpi-val'>${kpi.value}</span>
            <span class='kpi-sub'>${kpi.subtitle}</span>
        `;
        
        kpiRow.appendChild(card);
    });
}

// Criar gradiente SVG
function createGradient(gradient) {
    const stops = gradient.stops.map(stop => 
        `<stop offset='${stop.offset}' stop-color='${stop.color}'/>`
    ).join('');
    
    return `
        <linearGradient id='${gradient.id}' x1='0%' y1='0%' x2='100%' y2='100%'>
            ${stops}
        </linearGradient>
    `;
}

// Criar gráfico de rosquinha (donut)
function createDonutChart(percentage, gradientId = 'gradRed') {
    const circumference = 264;
    const offset = circumference - (circumference * percentage / 100);
    
    return `
        <svg viewBox='0 0 100 100' width='100%' height='100%'>
            <defs>${createGradient(gradients.red)}</defs>
            <circle cx='50' cy='50' r='42' fill='none' stroke='#F5F5F7' stroke-width='10'/>
            <circle class='draw-ring' cx='50' cy='50' r='42' fill='none' stroke='url(#${gradientId})' 
                    stroke-width='10' stroke-linecap='round' stroke-dasharray='264' 
                    stroke-dashoffset='${offset}' transform='rotate(-90 50 50)'/>
            <text x='50' y='57' text-anchor='middle' font-family='Bradesco Sans' 
                  font-weight='700' font-size='22' fill='#1D1D1F'>${percentage}%</text>
        </svg>
    `;
}

// Criar gráfico de gauge (semicírculo)
function createGaugeChart(percentage, mainLabel, subLabel) {
    const circumference = 220;
    const offset = circumference - (circumference * percentage / 100);
    
    return `
        <svg viewBox='0 10 200 100' width='100%' height='100%'>
            <defs>${createGradient(gradients.blue)}</defs>
            <path d='M 30 100 A 70 70 0 0 1 170 100' fill='none' stroke='#F5F5F7' 
                  stroke-width='16' stroke-linecap='round'/>
            <path class='draw-gauge' d='M 30 100 A 70 70 0 0 1 170 100' fill='none' 
                  stroke='url(#gradBlue)' stroke-width='16' stroke-linecap='round' 
                  stroke-dasharray='220' stroke-dashoffset='${offset}'/>
            <text x='100' y='75' text-anchor='middle' font-family='Bradesco Sans' 
                  font-weight='800' font-size='25' fill='#1D1D1F'>${mainLabel}</text>
            <text x='100' y='95' text-anchor='middle' font-family='Bradesco Sans' 
                  font-weight='600' font-size='12' fill='#86868B' letter-spacing='1'>${subLabel}</text>
        </svg>
    `;
}

// Renderizar hero area baseado no tipo
function renderHeroArea(hero) {
    let content = '';
    
    switch(hero.type) {
        case 'dual-donut':
            content = `
                <div style='display:flex; gap:20px; align-items:center;'>
                    ${hero.charts.map(chart => `
                        <div style='display:flex; flex-direction:column; align-items:center; gap:5px'>
                            <div style='width:90px; height:90px;'>
                                ${createDonutChart(chart.percentage)}
                            </div>
                            <span class='d-unit'>${chart.label}</span>
                        </div>
                    `).join('')}
                </div>
            `;
            break;
            
        case 'gauge':
            content = `
                <div style='width:180px; height:100px;'>
                    ${createGaugeChart(hero.percentage, hero.mainLabel, hero.subLabel)}
                </div>
            `;
            break;
            
        case 'donut-with-value':
            content = `
                <div style='display:flex; align-items:center; gap:20px'>
                    <div style='width:100px; height:100px;'>
                        <svg viewBox='0 0 100 100' width='100%' height='100%'>
                            <defs>${createGradient(gradients.teal)}</defs>
                            <circle cx='50' cy='50' r='42' fill='none' stroke='#F5F5F7' stroke-width='10'/>
                            <circle class='draw-ring' cx='50' cy='50' r='42' fill='none' stroke='url(#gradTeal)' 
                                    stroke-width='10' stroke-linecap='round' stroke-dasharray='264' 
                                    stroke-dashoffset='40' transform='rotate(-90 50 50)'/>
                            <text x='50' y='57' text-anchor='middle' font-family='Bradesco Sans' 
                                  font-weight='700' font-size='22' fill='#1D1D1F'>${hero.percentage}%</text>
                        </svg>
                    </div>
                    <div style='display:flex; flex-direction:column'>
                        <span class='d-val' style='font-size:24px'>${hero.mainValue}</span>
                        <span class='d-unit'>${hero.subLabel}</span>
                    </div>
                </div>
            `;
            break;
    }
    
    return content;
}

// Renderizar painel
function renderPanel(panel) {
    const dataRows = panel.data.map(item => {
        const valueClass = item.valueClass || '';
        const valueStyle = item.valueStyle || '';
        const extraValue = item.extraValue || '';
        
        return `
            <div class='data-row'>
                <span class='d-lbl'>${item.label}</span>
                ${item.value !== '--' 
                    ? `<span class='d-val ${valueClass}' ${valueStyle ? `style='${valueStyle}'` : ''}>
                         ${item.value} ${item.unit ? `<span class='d-unit'>${item.unit}</span>` : ''}${extraValue}
                       </span>`
                    : `<span class='d-val' style='color:#AAA'>${item.value}</span>`
                }
            </div>
        `;
    }).join('');
    
    const headerGradient = `linear-gradient(135deg, ${panel.iconColor}, ${lightenColor(panel.iconColor, 30)})`;
    
    return `
        <div class='panel'>
            <div class='panel-header' style='background: ${headerGradient}'>
                <svg viewBox='0 0 24 24' width='20' height='20' fill='white'>
                    ${panel.icon}
                </svg>
                <span class='panel-title' style='color: white'>${panel.title}</span>
            </div>
            <div class='panel-body'>
                <div class='hero-area'>
                    ${renderHeroArea(panel.hero)}
                </div>
                <div class='list-area'>
                    ${dataRows}
                </div>
            </div>
        </div>
    `;
}

// Renderizar todos os painéis
function renderPanels() {
    const panelsRow = document.getElementById('panels-row');
    
    dashboardData.panels.forEach(panel => {
        panelsRow.innerHTML += renderPanel(panel);
    });
}

// Atualizar context bar
function updateContext() {
    document.getElementById('location-pill').textContent = dashboardData.context.location;
    document.getElementById('status-text').textContent = dashboardData.context.status;
}

// Inicializar o dashboard
function initDashboard() {
    renderKPIs();
    updateContext();
    renderPanels();
}

// Executar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', initDashboard);
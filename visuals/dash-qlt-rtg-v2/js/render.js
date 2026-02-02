// Funções de Renderização do Dashboard

let currentView = 'ring'; // 'ring' ou 'bar'

// Renderizar Stats Cards
function renderStats() {
    const statsGrid = document.getElementById('stats-grid');
    
    dashboardData.stats.forEach(stat => {
        const card = document.createElement('div');
        card.className = 'stat-card';
        
        card.innerHTML = `
            <div class="stat-icon">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                    ${icons[stat.icon]}
                </svg>
            </div>
            <div>
                <div class="stat-value">${stat.value}</div>
                <div class="stat-label">${stat.label}</div>
            </div>
        `;
        
        statsGrid.appendChild(card);
    });
}

// Criar Ring Chart (Donut)
function createRingChart(metric) {
    const radius = 56;
    const circumference = 2 * Math.PI * radius;
    const percentage = metric.value || 0;
    const offset = circumference - (circumference * percentage / 100);
    const gradient = getRingGradient(metric.value);
    
    // Criar ID único para o gradiente
    const gradientId = `gradient-${metric.label.toLowerCase().replace(/\s+/g, '-')}`;
    
    // Se for N/A, usar cor sólida (sem animação, mantém fixo vazio)
    if (metric.value === null) {
        return `
            <div class="metric-card ring-view">
                <div class="ring-chart">
                    <svg viewBox="0 0 128 128">
                        <circle class="ring-track" cx="64" cy="64" r="${radius}"/>
                        <circle class="ring-progress" cx="64" cy="64" r="${radius}"
                                stroke="#D1D5DB"
                                stroke-dasharray="${circumference}"
                                stroke-dashoffset="${circumference}"/>
                    </svg>
                    <div class="ring-value">
                        <div class="ring-value-text" style="color: #9CA3AF">N/A</div>
                    </div>
                </div>
                <div class="ring-label">${metric.label}</div>
            </div>
        `;
    }
    
    // Para métricas com valor: inicia vazio (offset = circumference) e define data-offset para o alvo
    return `
        <div class="metric-card ring-view">
            <div class="ring-chart">
                <svg viewBox="0 0 128 128">
                    <defs>
                        <linearGradient id="${gradientId}" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stop-color="${gradient.start}"/>
                            <stop offset="100%" stop-color="${gradient.end}"/>
                        </linearGradient>
                    </defs>
                    <circle class="ring-track" cx="64" cy="64" r="${radius}"/>
                    <circle class="ring-progress" cx="64" cy="64" r="${radius}"
                            stroke="url(#${gradientId})"
                            stroke-dasharray="${circumference}"
                            stroke-dashoffset="${circumference}"
                            data-offset="${offset}"/>
                </svg>
                <div class="ring-value">
                    <div class="ring-value-text">${percentage}%</div>
                </div>
            </div>
            <div class="ring-label">${metric.label}</div>
        </div>
    `;
}

// Criar Bar Chart (Barra Horizontal)
function createBarChart(metric) {
    const percentage = metric.value || 0;
    const gradient = getRingGradient(metric.value);
    const gradientId = `bar-gradient-${metric.label.toLowerCase().replace(/\s+/g, '-')}`;
    
    // Se for N/A
    if (metric.value === null) {
        return `
            <div class="metric-card bar-view">
                <div class="bar-chart">
                    <div class="bar-header">
                        <div class="bar-label">${metric.label}</div>
                        <div class="bar-value" style="color: #9CA3AF">N/A</div>
                    </div>
                    <div class="bar-track">
                        <div style="width: 100%; height: 100%; background: repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(0,0,0,0.05) 5px, rgba(0,0,0,0.05) 10px);"></div>
                    </div>
                </div>
            </div>
        `;
    }
    
    return `
        <div class="metric-card bar-view">
            <div class="bar-chart">
                <div class="bar-header">
                    <div class="bar-label">${metric.label}</div>
                    <div class="bar-value">${percentage}%</div>
                </div>
                <div class="bar-track">
                    <div class="bar-progress bar-progress-${gradientId}" style="width: 0%; background: linear-gradient(90deg, ${gradient.start}, ${gradient.end});" data-width="${percentage}"></div>
                </div>
            </div>
        </div>
    `;
}

// Renderizar Metrics
function renderMetrics() {
    const metricsGrid = document.getElementById('metrics-grid');
    metricsGrid.className = `metrics-grid ${currentView}-view`;
    metricsGrid.innerHTML = '';
    
    // Adicionar métricas
    dashboardData.metrics.forEach(metric => {
        const html = currentView === 'ring' 
            ? createRingChart(metric) 
            : createBarChart(metric);
        metricsGrid.innerHTML += html;
    });
    
    // Animar barras OU anéis dependendo da view atual
    setTimeout(() => {
        if (currentView === 'bar') {
            document.querySelectorAll('.bar-progress').forEach(bar => {
                const width = bar.getAttribute('data-width');
                if (width) bar.style.width = width + '%';
            });
        } else if (currentView === 'ring') {
            document.querySelectorAll('.ring-progress').forEach(ring => {
                const offset = ring.getAttribute('data-offset');
                if (offset) ring.style.strokeDashoffset = offset;
            });
        }
    }, 100);
}

// Renderizar Progress Items
function renderProgress() {
    const progressList = document.getElementById('progress-list');
    
    dashboardData.executions.forEach(item => {
        const percentage = (item.value / item.max) * 100;
        
        const div = document.createElement('div');
        div.className = 'progress-item';
        div.innerHTML = `
            <div class="progress-header">
                <div class="progress-label">${item.label}</div>
                <div class="progress-value">${item.value.toLocaleString('pt-BR')}</div>
            </div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: 0%" data-width="${percentage}"></div>
            </div>
        `;
        
        progressList.appendChild(div);
    });
    
    // Animar barras de progresso
    setTimeout(() => {
        document.querySelectorAll('.progress-fill').forEach(fill => {
            const width = fill.getAttribute('data-width');
            fill.style.width = width + '%';
        });
    }, 100);
}

// Toggle entre Ring e Bar view
function setupViewToggle() {
    const toggleButtons = document.querySelectorAll('.toggle-btn');
    
    toggleButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const view = btn.getAttribute('data-view');
            
            if (view !== currentView) {
                currentView = view;
                
                // Atualizar botões
                toggleButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // Re-renderizar métricas
                renderMetrics();
            }
        });
    });
}

// Inicializar Dashboard
function initDashboard() {
    renderStats();
    renderMetrics();
    renderProgress();
    setupViewToggle();
}

// Executar quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', initDashboard);
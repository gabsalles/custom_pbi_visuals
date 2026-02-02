// Dados do Dashboard
const dashboardData = {
    // KPIs do topo
    kpis: [
        {
            label: 'PUE (Eficiência)',
            value: '1.61',
            subtitle: 'Target < 1.50',
            animationDelay: '0.1s'
        },
        {
            label: 'WUE (Água)',
            value: '0.52',
            subtitle: 'L/kWh',
            animationDelay: '0.2s'
        },
        {
            label: 'CUE (Carbono)',
            value: '0.45',
            subtitle: 'kg/kWh',
            animationDelay: '0.3s'
        },
        {
            label: 'Carga Total',
            value: '862',
            subtitle: 'kW Average',
            animationDelay: '0.4s'
        },
        {
            label: 'Carga Pesada',
            value: '862',
            subtitle: 'kW Average',
            animationDelay: '0.4s'
        }
    ],

    // Configurações da Context Bar
    context: {
        location: 'CTI Osasco - SP',
        status: 'Online',
        statusColor: '#10B981'
    },

    // Painéis
    panels: [
        {
            id: 'espaco-fisico',
            title: 'Espaço Físico',
            icon: '<path d="M3 21h18v-2H3v2zM5 3v12h14V3H5zm12 10H7V5h10v8z"/>',
            iconColor: '#CC092F',
            
            hero: {
                type: 'dual-donut',
                charts: [
                    { percentage: 68, label: 'Área' },
                    { percentage: 21, label: 'Racks' }
                ]
            },
            data: [
                { label: 'Área Ocupada', value: '9,852', unit: 'm²',valueClass: 'c-red' },
                { label: 'Total Racks', value: '1,962', unit: 'u', valueClass: 'c-red' },
                { 
                    label: 'Movimentação', 
                    value: '+56', 
                    valueClass: 'c-red',
                    extraValue: ' / -32' 
                }
            ]
        },
        {
            id: 'energia',
            title: 'Energia',
            icon: '<path d="M11 21h-1l1-7H7.5c-.88 0-.33-.75-.31-.78C8.48 10.94 10.42 7.54 13.01 3h1l-1 7h3.51c.4 0 .62.19.4.66C12.97 17.55 11 21 11 21z"/>',
            iconColor: '#0047BB',
            hero: {
                type: 'gauge',
                percentage: 100,
                mainLabel: '100%',
                subLabel: 'UPS LOAD'
            },
            data: [
                { 
                    label: 'Consumo TI', 
                    value: '385,455', 
                    unit: 'MWh',
                    valueClass: 'c-blue'
                },
                { label: 'Gerador', value: '1,500', unit: 'kW', valueClass: 'c-blue' },
                { label: 'Diesel', value: '2,980', unit: 'L', valueClass: 'c-blue' },
                { label: 'Gasolina', value: '1,500', unit: 'kW', valueClass: 'c-blue' },
                { label: 'Querosene', value: '2,980', unit: 'L', valueClass: 'c-blue' }
            ]
        },
        {
            id: 'refrigeracao',
            title: 'Refrigeração',
            icon: '<path d="M14.5 17c0 1.65-1.35 3-3 3s-3-1.35-3-3h2c0 .55.45 1 1 1s1-.45 1-1-.45-1-1-1H2v-2h9.5c1.65 0 3 1.35 3 3zM19 6.5C19 4.57 17.43 3 15.5 3S12 4.57 12 6.5h2c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5S16.33 8 15.5 8H2v2h13.5c1.93 0 3.5-1.57 3.5-3.5zm-.5 4.5H2v2h16.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5v2c1.93 0 3.5-1.57 3.5-3.5S20.43 11 18.5 11z"/>',
            iconColor: '#008A99',
            hero: {
                type: 'donut-with-value',
                percentage: 85,
                mainValue: '83,846',
                subLabel: 'TR Utilizado'
            },
            data: [
                { 
                    label: 'Consumo Elétrico', 
                    value: '212,318', 
                    unit: 'MWh',
                    valueClass: 'c-teal'
                },
                { label: 'Consumo Água', value: '199,452', unit: 'm³', valueClass: 'c-teal' },
                { 
                    label: 'Status Térmico', 
                    value: '--',
                    valueClass: 'c-teal'
                }
            ]
        }
    ]
};

// Gradientes para os gráficos
const gradients = {
    red: {
        id: 'gradRed',
        stops: [
            { offset: '0%', color: '#CC092F' },
            { offset: '100%', color: '#FF2F4F' }
        ]
    },
    blue: {
        id: 'gradBlue',
        stops: [
            { offset: '0%', color: '#0047BB' },
            { offset: '100%', color: '#2E75FF' }
        ]
    },
    teal: {
        id: 'gradTeal',
        stops: [
            { offset: '0%', color: '#008A99' },
            { offset: '100%', color: '#00C2D6' }
        ]
    }
};
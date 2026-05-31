// ========== 主题切换功能 ==========
function initTheme() {
    const toggleBtn = document.getElementById('theme-toggle');
    const html = document.documentElement;
    
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
        html.setAttribute('data-theme', 'dark');
    } else {
        html.setAttribute('data-theme', 'light');
    }
    
    if (toggleBtn) {
        updateToggleIcon(html.getAttribute('data-theme'));
        toggleBtn.addEventListener('click', () => {
            const current = html.getAttribute('data-theme');
            const newTheme = current === 'dark' ? 'light' : 'dark';
            html.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            updateToggleIcon(newTheme);
            updateChartsTheme(newTheme);
        });
    }
}

function updateToggleIcon(theme) {
    const icon = document.querySelector('#theme-toggle i');
    if (icon) {
        icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
}

// ========== 视图切换功能 ==========
function initViewToggle() {
    const viewBtns = document.querySelectorAll('.view-btn');
    const listView = document.getElementById('list-view');
    const chartView = document.getElementById('chart-view');
    
    if (!viewBtns.length || !listView || !chartView) return;
    
    viewBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            viewBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const view = btn.dataset.view;
            if (view === 'list') {
                listView.style.display = 'block';
                chartView.style.display = 'none';
            } else {
                listView.style.display = 'none';
                chartView.style.display = 'block';
                setTimeout(() => {
                    if (window.currentCharts) {
                        window.currentCharts.forEach(chart => chart.resize());
                    }
                }, 150);
            }
        });
    });
}

// ========== 获取图表颜色方案 ==========
function getChartColors() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const style = getComputedStyle(document.documentElement);
    
    return {
        primary: style.getPropertyValue('--primary').trim() || '#6366f1',
        purple: style.getPropertyValue('--accent-purple').trim() || '#a855f7',
        red: style.getPropertyValue('--accent-red').trim() || '#f43f5e',
        green: style.getPropertyValue('--accent-green').trim() || '#10b981',
        orange: style.getPropertyValue('--accent-orange').trim() || '#f59e0b',
        cyan: style.getPropertyValue('--accent-cyan').trim() || '#06b6d4',
        text: style.getPropertyValue('--text-secondary').trim() || '#52525b',
        grid: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
    };
}

function updateChartsTheme(theme) {
    if (window.currentCharts) {
        const colors = getChartColors();
        window.currentCharts.forEach(chart => {
            if (chart.options.scales.x) {
                chart.options.scales.x.ticks.color = colors.text;
                chart.options.scales.x.grid.color = colors.grid;
            }
            if (chart.options.scales.y) {
                chart.options.scales.y.ticks.color = colors.text;
                chart.options.scales.y.grid.color = colors.grid;
            }
            if (chart.options.scales.y1) {
                chart.options.scales.y1.ticks.color = colors.text;
            }
            chart.update('none');
        });
    }
}

// ========== 解析简化 JSON 数据 ==========
function parseHistory(rawHistory) {
    if (!rawHistory) return [];
    return rawHistory.map(record => ({
        date: record[0],
        global_rank: record[1],
        country_rank: record[2],
        pp: record[3],
        accuracy: record[4],
        playcount: record[5],
        total_hits: record[6]
    }));
}

function parsePlayer(history) {
    if (!history || history.length === 0) return null;
    const current = history[0];
    return {
        global_rank: current[1],
        country_rank: current[2],
        pp: current[3],
        accuracy: current[4],
        playcount: current[5],
        total_hits: current[6]
    };
}

// ========== 数据加载与渲染 ==========
async function loadGameData(jsonPath, tableContainerId, historyContainerId, modeName) {
    let data = null;
    
    try {
        const response = await fetch(jsonPath);
        if (response.ok) {
            const json = await response.json();
            data = {
                player: parsePlayer(json.history),
                history: parseHistory(json.history)
            };
            console.log(`${jsonPath} 加载成功`);
        } else {
            throw new Error(`HTTP ${response.status}`);
        }
    } catch (error) {
        console.warn(`无法加载 ${jsonPath}，使用内置数据:`, error.message);
        data = getDefaultData(jsonPath);
    }
    
    if (data) {
        renderStatsTable(data, tableContainerId);
        renderHistoryList(data.history, historyContainerId);
        const countBadge = document.getElementById('history-count');
        if (countBadge) {
            countBadge.textContent = `${data.history.length}条`;
        }
        renderAllCharts(data);
        initViewToggle();
    }
}

// ========== 默认数据 ==========
function getDefaultData(jsonPath) {
    const rawHistory = jsonPath.includes('std') ? [
        ["2025-05-30", 8421, 156, 7234.56, 98.32, 15420, 2850000],
        ["2025-05-23", 8650, 162, 7102.34, 98.15, 14890, 2780000],
        ["2025-05-16", 8900, 170, 6950.12, 97.98, 14300, 2700000],
        ["2025-05-09", 9200, 178, 6780.89, 97.82, 13780, 2620000],
        ["2025-05-02", 9500, 185, 6610.45, 97.65, 13200, 2540000],
        ["2025-04-25", 9800, 192, 6450.78, 97.50, 12650, 2460000],
        ["2025-04-18", 10100, 200, 6280.33, 97.35, 12100, 2380000]
    ] : [
        ["2025-05-30", 3256, 78, 6120.89, 97.15, 11250, 1980000],
        ["2025-05-23", 3400, 82, 5980.45, 97.02, 10890, 1920000],
        ["2025-05-16", 3580, 88, 5820.67, 96.88, 10450, 1860000],
        ["2025-05-09", 3750, 95, 5650.23, 96.75, 10020, 1800000],
        ["2025-05-02", 3920, 102, 5480.89, 96.60, 9600, 1740000],
        ["2025-04-25", 4100, 110, 5310.45, 96.45, 9180, 1680000],
        ["2025-04-18", 4280, 118, 5140.12, 96.30, 8760, 1620000]
    ];
    
    return {
        player: parsePlayer(rawHistory),
        history: parseHistory(rawHistory)
    };
}

// ========== 渲染统计表格 ==========
function renderStatsTable(data, containerId) {
    const container = document.getElementById(containerId);
    if (!container || !data.player) return;
    
    const p = data.player;
    const history = data.history;
    
    const getTrend = (current, previous) => {
        if (previous == null) return { icon: 'fa-minus', class: 'trend-stable', text: '无数据' };
        const diff = current - previous;
        if (Math.abs(diff) < 0.01) return { icon: 'fa-minus', class: 'trend-stable', text: '持平' };
        if (diff > 0) return { icon: 'fa-arrow-up', class: 'trend-up', text: `+${diff.toLocaleString()}` };
        return { icon: 'fa-arrow-down', class: 'trend-down', text: diff.toLocaleString() };
    };
    
    const getRankTrend = (current, previous) => {
        if (previous == null) return { icon: 'fa-minus', class: 'trend-stable', text: '无数据' };
        const diff = previous - current;
        if (diff > 0) return { icon: 'fa-arrow-up', class: 'trend-up', text: `↑${diff.toLocaleString()}` };
        if (diff < 0) return { icon: 'fa-arrow-down', class: 'trend-down', text: `↓${Math.abs(diff).toLocaleString()}` };
        return { icon: 'fa-minus', class: 'trend-stable', text: '持平' };
    };
    
    const prevRecord = history.length > 1 ? history[1] : null;
    
    const metrics = [
        {
            name: '全球排名',
            icon: 'fa-globe',
            color: 'var(--primary)',
            value: `#${p.global_rank?.toLocaleString() || '---'}`,
            trend: getRankTrend(p.global_rank, prevRecord?.global_rank)
        },
        {
            name: '国家/地区排名',
            icon: 'fa-flag',
            color: 'var(--accent-purple)',
            value: `#${p.country_rank?.toLocaleString() || '---'}`,
            trend: getRankTrend(p.country_rank, prevRecord?.country_rank)
        },
        {
            name: 'PP',
            icon: 'fa-bolt',
            color: 'var(--accent-orange)',
            value: `${p.pp?.toFixed(1) || '---'}`,
            trend: getTrend(p.pp, prevRecord?.pp)
        },
        {
            name: '准确率',
            icon: 'fa-bullseye',
            color: 'var(--accent-green)',
            value: `${p.accuracy?.toFixed(2) || '---'}%`,
            trend: prevRecord ? { 
                icon: p.accuracy >= prevRecord.accuracy ? 'fa-arrow-up' : 'fa-arrow-down',
                class: p.accuracy >= prevRecord.accuracy ? 'trend-up' : 'trend-down',
                text: `${(p.accuracy - prevRecord.accuracy >= 0 ? '+' : '')}${(p.accuracy - prevRecord.accuracy).toFixed(2)}%`
            } : { icon: 'fa-minus', class: 'trend-stable', text: '无数据' }
        },
        {
            name: '游玩次数',
            icon: 'fa-gamepad',
            color: 'var(--accent-cyan)',
            value: `${p.playcount?.toLocaleString() || '---'}`,
            trend: getTrend(p.playcount, prevRecord?.playcount)
        },
        {
            name: '总命中次数',
            icon: 'fa-crosshairs',
            color: 'var(--accent-red)',
            value: `${p.total_hits?.toLocaleString() || '---'}`,
            trend: getTrend(p.total_hits, prevRecord?.total_hits)
        }
    ];
    
    container.innerHTML = metrics.map(m => `
        <tr>
            <td>
                <span class="metric-name">
                    <i class="fas ${m.icon}" style="color: ${m.color}; background: ${m.color}15;"></i>
                    ${m.name}
                </span>
            </td>
            <td><span class="metric-value">${m.value}</span></td>
            <td>
                <span class="trend ${m.trend.class}">
                    <i class="fas ${m.trend.icon}"></i>
                    ${m.trend.text}
                </span>
            </td>
        </tr>
    `).join('');
}

// ========== 渲染历史记录列表 ==========
function renderHistoryList(history, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    if (!history || history.length === 0) {
        container.innerHTML = '<div class="history-item" style="text-align:center;color:var(--text-muted);">暂无历史记录</div>';
        return;
    }
    
    container.innerHTML = history.map(record => `
        <div class="history-item">
            <div class="history-date">
                <i class="far fa-calendar-alt"></i>
                ${record.date}
            </div>
            <div class="history-details">
                <span><i class="fas fa-globe"></i> #${record.global_rank?.toLocaleString()}</span>
                <span><i class="fas fa-flag"></i> #${record.country_rank?.toLocaleString()}</span>
                <span><i class="fas fa-bolt"></i> ${record.pp?.toFixed(1)}pp</span>
                <span><i class="fas fa-bullseye"></i> ${record.accuracy?.toFixed(2)}%</span>
                <span><i class="fas fa-gamepad"></i> ${record.playcount?.toLocaleString()}次</span>
                <span><i class="fas fa-crosshairs"></i> ${(record.total_hits / 1000000).toFixed(2)}M命中</span>
            </div>
            <div class="history-pp">
                ${record.pp?.toFixed(0) || '---'} pp
            </div>
        </div>
    `).join('');
}

// ========== 渲染图表 ==========
function renderAllCharts(data) {
    const history = data.history;
    if (!history || history.length === 0) return;
    
    const sortedHistory = [...history].reverse();
    const labels = sortedHistory.map(h => h.date);
    const colors = getChartColors();
    
    if (window.currentCharts) {
        window.currentCharts.forEach(chart => chart.destroy());
    }
    window.currentCharts = [];
    
    const commonLineOptions = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            intersect: false,
            mode: 'index',
        },
        plugins: {
            legend: {
                labels: {
                    color: colors.text,
                    usePointStyle: true,
                    pointStyleWidth: 8,
                    padding: 20,
                    font: { family: 'Poppins', size: 11 }
                }
            },
            tooltip: {
                backgroundColor: 'rgba(24,24,27,0.9)',
                titleFont: { family: 'Poppins', weight: '600' },
                bodyFont: { family: 'Poppins' },
                padding: 14,
                cornerRadius: 12,
                displayColors: true,
                boxPadding: 4,
            }
        },
        scales: {
            x: {
                ticks: { color: colors.text, font: { size: 10 } },
                grid: { color: colors.grid, drawBorder: false },
            },
            y: {
                ticks: { color: colors.text, font: { size: 10 }, padding: 8 },
                grid: { color: colors.grid, drawBorder: false },
                beginAtZero: false,
            }
        }
    };
    
    // PP 与准确率合并图（双轴折线）
    const ppAccCtx = document.getElementById('pp-acc-chart');
    if (ppAccCtx) {
        const chart = new Chart(ppAccCtx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'PP',
                        data: sortedHistory.map(h => h.pp),
                        borderColor: colors.primary,
                        backgroundColor: createGradient(ppAccCtx, colors.primary, 0.25, 0.01),
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        pointBackgroundColor: colors.primary,
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        pointRadius: 5,
                        pointHoverRadius: 8,
                        yAxisID: 'y',
                    },
                    {
                        label: '准确率 (%)',
                        data: sortedHistory.map(h => h.accuracy),
                        borderColor: colors.green,
                        backgroundColor: createGradient(ppAccCtx, colors.green, 0.2, 0.01),
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        pointBackgroundColor: colors.green,
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        pointRadius: 5,
                        pointHoverRadius: 8,
                        yAxisID: 'y1',
                    }
                ]
            },
            options: {
                ...commonLineOptions,
                scales: {
                    ...commonLineOptions.scales,
                    y: {
                        ...commonLineOptions.scales.y,
                        position: 'left',
                        title: { display: true, text: 'PP', color: colors.primary, font: { size: 11, weight: '600' } },
                    },
                    y1: {
                        position: 'right',
                        ticks: { 
                            color: colors.green, 
                            font: { size: 10 },
                            callback: (value) => value.toFixed(1) + '%'
                        },
                        grid: { display: false },
                        title: { display: true, text: '准确率', color: colors.green, font: { size: 11, weight: '600' } },
                    }
                }
            }
        });
        window.currentCharts.push(chart);
    }
    
    // 排名变化图（双轴折线）
    const rankCtx = document.getElementById('rank-chart');
    if (rankCtx) {
        const chart = new Chart(rankCtx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: '全球排名',
                        data: sortedHistory.map(h => h.global_rank),
                        borderColor: colors.primary,
                        backgroundColor: createGradient(rankCtx, colors.primary, 0.2, 0.01),
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        pointBackgroundColor: colors.primary,
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        pointRadius: 5,
                        pointHoverRadius: 8,
                        yAxisID: 'y',
                    },
                    {
                        label: '国家排名',
                        data: sortedHistory.map(h => h.country_rank),
                        borderColor: colors.purple,
                        backgroundColor: createGradient(rankCtx, colors.purple, 0.2, 0.01),
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        pointBackgroundColor: colors.purple,
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        pointRadius: 5,
                        pointHoverRadius: 8,
                        yAxisID: 'y1',
                    }
                ]
            },
            options: {
                ...commonLineOptions,
                scales: {
                    ...commonLineOptions.scales,
                    y: {
                        ...commonLineOptions.scales.y,
                        position: 'left',
                        reverse: true,
                        title: { display: true, text: '全球排名', color: colors.primary, font: { size: 11, weight: '600' } },
                    },
                    y1: {
                        position: 'right',
                        reverse: true,
                        ticks: { color: colors.purple, font: { size: 10 } },
                        grid: { display: false },
                        title: { display: true, text: '国家排名', color: colors.purple, font: { size: 11, weight: '600' } },
                    }
                }
            }
        });
        window.currentCharts.push(chart);
    }
    
    // 游玩次数与总命中次数（双轴折线）
    const playsCtx = document.getElementById('plays-chart');
    if (playsCtx) {
        const chart = new Chart(playsCtx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: '游玩次数',
                        data: sortedHistory.map(h => h.playcount),
                        borderColor: colors.orange,
                        backgroundColor: createGradient(playsCtx, colors.orange, 0.2, 0.01),
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        pointBackgroundColor: colors.orange,
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        pointRadius: 5,
                        pointHoverRadius: 8,
                        yAxisID: 'y',
                    },
                    {
                        label: '总命中次数',
                        data: sortedHistory.map(h => h.total_hits),
                        borderColor: colors.red,
                        backgroundColor: createGradient(playsCtx, colors.red, 0.15, 0.01),
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        pointBackgroundColor: colors.red,
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        pointRadius: 5,
                        pointHoverRadius: 8,
                        yAxisID: 'y1',
                    }
                ]
            },
            options: {
                ...commonLineOptions,
                scales: {
                    ...commonLineOptions.scales,
                    y: {
                        ...commonLineOptions.scales.y,
                        position: 'left',
                        title: { display: true, text: '游玩次数', color: colors.orange, font: { size: 11, weight: '600' } },
                        ticks: {
                            ...commonLineOptions.scales.y.ticks,
                            callback: (value) => (value / 1000).toFixed(1) + 'k'
                        }
                    },
                    y1: {
                        position: 'right',
                        ticks: { 
                            color: colors.red, 
                            font: { size: 10 },
                            callback: (value) => (value / 1000000).toFixed(1) + 'M'
                        },
                        grid: { display: false },
                        title: { display: true, text: '总命中次数', color: colors.red, font: { size: 11, weight: '600' } },
                    }
                }
            }
        });
        window.currentCharts.push(chart);
    }
}

function createGradient(ctx, color, alphaTop, alphaBottom) {
    const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 360);
    gradient.addColorStop(0, hexToRgba(color, alphaTop));
    gradient.addColorStop(1, hexToRgba(color, alphaBottom));
    return gradient;
}

function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// ========== 初始化 ==========
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initViewToggle();
});
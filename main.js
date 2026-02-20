document.addEventListener('DOMContentLoaded', () => {
    const themeBtn = document.getElementById('theme-btn');
    const homeView = document.getElementById('home-view');
    const calcView = document.getElementById('calc-view');
    const calcTitle = document.getElementById('calc-title');
    const calcInputs = document.getElementById('calc-inputs');
    const calcResults = document.getElementById('calc-results');
    const chartWrapper = document.querySelector('.chart-wrapper');
    const backBtn = document.querySelector('.back-btn');
    const navLinks = document.querySelectorAll('.nav-links a, .dropdown-menu a, .calc-card');
    
    let currentChart = null;

    function clearState() {
        if (currentChart) { currentChart.destroy(); currentChart = null; }
        calcInputs.innerHTML = '';
        calcResults.innerHTML = '';
        if (chartWrapper) chartWrapper.style.display = 'none';
    }

    function showView(view) {
        clearState();
        if (view === 'home') {
            homeView.classList.add('active');
            calcView.classList.remove('active');
        } else {
            homeView.classList.remove('active');
            calcView.classList.add('active');
        }
        window.scrollTo(0, 0);
    }

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const id = link.getAttribute('data-calc');
            if (id) {
                e.preventDefault();
                showView('calc');
                renderUI(id);
            } else if (link.getAttribute('data-page') === 'home') {
                e.preventDefault();
                showView('home');
            }
        });
    });

    backBtn.addEventListener('click', () => showView('home'));

    const won = (v) => new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(Math.round(v));

    function renderUI(id) {
        const config = configs[id];
        if (!config) return;
        
        calcTitle.textContent = config.title;
        calcInputs.innerHTML = config.inputs.map(i => `
            <div class="input-group">
                <label>${i.label}</label>
                <input type="${i.type}" id="${i.id}" value="${i.value}">
            </div>
        `).join('') + `<button class="calc-btn" id="do-calc">계산하기</button>`;

        document.getElementById('do-calc').addEventListener('click', () => {
            const data = {};
            config.inputs.forEach(i => {
                data[i.id] = parseFloat(document.getElementById(i.id).value) || 0;
            });
            const res = config.calc(data);
            calcResults.innerHTML = res.items.map(i => `
                <div class="result-item">
                    <span class="result-label">${i.label}</span>
                    <span class="result-value">${i.value}</span>
                </div>
            `).join('');
            if (res.chart) renderChart(res.chart);
        });
    }

    function renderChart(c) {
        if (chartWrapper) chartWrapper.style.display = 'flex';
        const ctx = document.getElementById('calc-chart').getContext('2d');
        if (currentChart) currentChart.destroy();
        const isDark = document.body.getAttribute('data-theme') === 'dark';
        currentChart = new Chart(ctx, {
            type: c.type,
            data: {
                labels: c.labels,
                datasets: [{
                    data: c.data,
                    backgroundColor: ['#2563eb', '#10b981', '#fbbf24', '#f87171', '#6366f1'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { labels: { color: isDark ? '#f1f5f9' : '#1e293b' } } }
            }
        });
    }

    const configs = {
        'salary': {
            title: '근로소득 실수령액 계산기',
            inputs: [
                { id: 's_sal', label: '연봉 (원)', type: 'number', value: 40000000 },
                { id: 's_non', label: '비과세액 (월)', type: 'number', value: 200000 }
            ],
            calc: (d) => {
                const m = d.s_sal / 12;
                const tx = m - d.s_non; // taxable 변수명을 tx로 단순화하여 선언
                const p = tx * 0.045;
                const h = tx * 0.035;
                const e = tx * 0.009;
                const t = tx * 0.04;
                const net = m - (p + h + e + t);
                return {
                    items: [
                        { label: '월 세전 급여', value: won(m) },
                        { label: '공제액 합계', value: won(p + h + e + t) },
                        { label: '월 실수령액', value: won(net) }
                    ],
                    chart: {
                        type: 'pie',
                        labels: ['실수령액', '국민연금', '건강보험', '고용보험', '소득세'],
                        data: [net, p, h, e, t]
                    }
                };
            }
        },
        'loan': {
            title: '대출 이자 계산기',
            inputs: [
                { id: 'l_a', label: '대출금 (원)', type: 'number', value: 100000000 },
                { id: 'l_r', label: '금리 (%)', type: 'number', value: 4.5 },
                { id: 'l_t', label: '기간 (개월)', type: 'number', value: 24 }
            ],
            calc: (d) => {
                const i = d.l_a * (d.l_r/100) * (d.l_t/12);
                return {
                    items: [
                        { label: '원금', value: won(d.l_a) },
                        { label: '총이자', value: won(i) },
                        { label: '합계', value: won(d.l_a + i) }
                    ],
                    chart: { type: 'doughnut', labels: ['원금', '이자'], data: [d.l_a, i] }
                };
            }
        },
        'tax-settlement': {
            title: '연말정산 계산기',
            inputs: [
                { id: 't_i', label: '총급여 (원)', type: 'number', value: 50000000 },
                { id: 't_p', label: '기납부세액 (원)', type: 'number', value: 3000000 }
            ],
            calc: (d) => {
                const dec = d.t_i * 0.05;
                const diff = d.t_p - dec;
                return {
                    items: [
                        { label: '결정세액', value: won(dec) },
                        { label: '기납부세액', value: won(d.t_p) },
                        { label: diff >= 0 ? '환급액' : '납부액', value: won(Math.abs(diff)) }
                    ],
                    chart: { type: 'bar', labels: ['결정', '기납부'], data: [dec, d.t_p] }
                };
            }
        }
    };
});

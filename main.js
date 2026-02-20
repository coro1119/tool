document.addEventListener('DOMContentLoaded', () => {
    // 1. 기본 요소 설정
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

    // 2. 테마 설정
    themeBtn.addEventListener('click', () => {
        const currentTheme = document.body.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.body.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        if (currentChart) updateChartTheme();
    });

    if (localStorage.getItem('theme')) {
        document.body.setAttribute('data-theme', localStorage.getItem('theme'));
    }

    // 3. 네비게이션 및 초기화 함수
    function clearState() {
        if (currentChart) {
            currentChart.destroy();
            currentChart = null;
        }
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
            const calcId = link.getAttribute('data-calc');
            if (calcId) {
                e.preventDefault();
                showView('calc');
                renderUI(calcId);
            } else if (link.getAttribute('data-page') === 'home') {
                e.preventDefault();
                showView('home');
            }
        });
    });

    backBtn.addEventListener('click', () => showView('home'));

    // 4. UI 렌더링 및 계산 실행
    function renderUI(id) {
        const config = configs[id];
        if (!config) return;
        
        calcTitle.textContent = config.title;
        calcInputs.innerHTML = config.inputs.map(i => `
            <div class="input-group">
                <label>${i.label}</label>
                ${i.type === 'select' ? 
                    `<select id="${i.id}">${i.options.map(o => `<option value="${o.value}">${o.label}</option>`).join('')}</select>` :
                    `<input type="${i.type}" id="${i.id}" value="${i.value}">`
                }
            </div>
        `).join('') + `<button class="calc-btn" id="do-calc">계산하기</button>`;

        document.getElementById('do-calc').addEventListener('click', () => {
            const data = {};
            config.inputs.forEach(i => {
                const el = document.getElementById(i.id);
                data[i.id] = i.type === 'number' ? parseFloat(el.value) || 0 : el.value;
            });
            
            const res = config.calc(data);
            renderRes(res.items);
            if (res.chart) renderChart(res.chart);
        });
    }

    function renderRes(items) {
        calcResults.innerHTML = items.map(i => `
            <div class="result-item">
                <span class="result-label">${i.label}</span>
                <span class="result-value">${i.value}</span>
            </div>
        `).join('');
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
                    backgroundColor: ['#2563eb', '#10b981', '#fbbf24', '#f87171', '#6366f1', '#ec4899', '#8b5cf6'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { labels: { color: isDark ? '#f1f5f9' : '#1e293b' } }
                }
            }
        });
    }

    function updateChartTheme() {
        if (!currentChart) return;
        const isDark = document.body.getAttribute('data-theme') === 'dark';
        currentChart.options.plugins.legend.labels.color = isDark ? '#f1f5f9' : '#1e293b';
        currentChart.update();
    }

    const won = (v) => new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(Math.round(v));

    // 5. 계산기 설정 데이터 (configs)
    const configs = {
        'salary': {
            title: '근로소득 실수령액 계산기',
            inputs: [
                { id: 's_sal', label: '연봉 (원)', type: 'number', value: 40000000 },
                { id: 's_non', label: '비과세액 (월/식대 등)', type: 'number', value: 200000 }
            ],
            calc: (d) => {
                const m = d.s_sal / 12;
                const taxable = m - d.s_non;
                const pension = taxable * 0.045;
                const health = taxable * 0.03545;
                const care = health * 0.1295;
                const emp = taxable * 0.009;
                const tax = taxable * 0.035; // 간략화된 소득세
                const totalDed = pension + health + care + emp + tax;
                const net = m - totalDed;
                
                return {
                    items: [
                        { label: '월 세전 급여', value: won(m) },
                        { label: '공제계 (세금/보험)', value: won(totalDed) },
                        { label: '월 실수령액', value: won(net) }
                    ],
                    chart: {
                        type: 'pie',
                        labels: ['실수령액', '국민연금', '건강보험', '고용보험', '소득세'],
                        data: [net, pension, health + care, emp, tax]
                    }
                };
            }
        },
        'loan': {
            title: '대출 이자 계산기',
            inputs: [
                { id: 'l_amt', label: '대출 금액 (원)', type: 'number', value: 100000000 },
                { id: 'l_rate', label: '연 이자율 (%)', type: 'number', value: 4.5 },
                { id: 'l_term', label: '대출 기간 (개월)', type: 'number', value: 24 }
            ],
            calc: (d) => {
                const totalInt = d.l_amt * (d.l_rate / 100) * (d.l_term / 12);
                return {
                    items: [
                        { label: '대출 원금', value: won(d.l_amt) },
                        { label: '총 이자', value: won(totalInt) },
                        { label: '총 상환금액', value: won(d.l_amt + totalInt) }
                    ],
                    chart: {
                        type: 'doughnut',
                        labels: ['원금', '총 이자'],
                        data: [d.l_amt, totalInt]
                    }
                };
            }
        },
        'tax-settlement': {
            title: '연말정산 환급 계산기',
            inputs: [
                { id: 't_inc', label: '연 총급여 (원)', type: 'number', value: 50000000 },
                { id: 't_pre', label: '기납부세액 (원)', type: 'number', value: 3000000 }
            ],
            calc: (d) => {
                const decTax = d.t_inc * 0.05; // 간략화
                const res = d.t_pre - decTax;
                return {
                    items: [
                        { label: '결정 세액', value: won(decTax) },
                        { label: '기납부 세액', value: won(d.t_pre) },
                        { label: res >= 0 ? '예상 환급액' : '추가 납부액', value: won(Math.abs(res)) }
                    ],
                    chart: {
                        type: 'bar',
                        labels: ['결정세액', '기납부세액'],
                        data: [decTax, d.t_pre]
                    }
                };
            }
        },
        'rent-compare': {
            title: '전세 vs 월세 비교',
            inputs: [
                { id: 'r_j', label: '전세 보증금 (원)', type: 'number', value: 300000000 },
                { id: 'r_m', label: '월세 (원)', type: 'number', value: 1000000 },
                { id: 'r_rate', label: '기회비용 (연 %)', type: 'number', value: 4.0 }
            ],
            calc: (d) => {
                const jCost = (d.r_j * d.r_rate / 100) / 12;
                return {
                    items: [
                        { label: '전세 월 환산비용', value: won(jCost) },
                        { label: '월세 비용', value: won(d.r_m) }
                    ],
                    chart: {
                        type: 'bar',
                        labels: ['전세', '월세'],
                        data: [jCost, d.r_m]
                    }
                };
            }
        }
        // 나머지 계산기들은 패턴에 맞춰 추가 가능
    };
});

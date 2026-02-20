document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const themeBtn = document.getElementById('theme-btn');
    const homeView = document.getElementById('home-view');
    const calcView = document.getElementById('calc-view');
    const calcTitle = document.getElementById('calc-title');
    const calcInputs = document.getElementById('calc-inputs');
    const calcResults = document.getElementById('calc-results');
    const backBtn = document.querySelector('.back-btn');
    const navLinks = document.querySelectorAll('.nav-links a, .dropdown-menu a, .calc-card');
    
    // Chart Instance
    let currentChart = null;

    // Theme Toggle
    themeBtn.addEventListener('click', () => {
        const currentTheme = document.body.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.body.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        if (currentChart) updateChartTheme();
    });

    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) document.body.setAttribute('data-theme', savedTheme);

    // Navigation
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const calcId = link.getAttribute('data-calc');
            const pageId = link.getAttribute('data-page');
            if (calcId) { e.preventDefault(); showCalculator(calcId); }
            else if (pageId === 'home') { e.preventDefault(); showHome(); }
        });
    });

    backBtn.addEventListener('click', showHome);

    function showHome() {
        homeView.classList.add('active');
        calcView.classList.remove('active');
        window.scrollTo(0, 0);
    }

    function showCalculator(id) {
        homeView.classList.remove('active');
        calcView.classList.add('active');
        window.scrollTo(0, 0);
        renderCalculatorUI(id);
    }

    function renderCalculatorUI(id) {
        const config = calculatorConfigs[id];
        if (!config) {
            alert('준비 중인 계산기입니다.');
            showHome();
            return;
        }
        calcTitle.textContent = config.title;
        calcInputs.innerHTML = config.inputs.map(input => `
            <div class="input-group">
                <label for="${input.id}">${input.label}</label>
                ${input.type === 'select' ? `
                    <select id="${input.id}">${input.options.map(opt => `<option value="${opt.value}">${opt.label}</option>`).join('')}</select>
                ` : `<input type="${input.type}" id="${input.id}" value="${input.value || ''}">`}
            </div>
        `).join('') + `<button class="calc-btn" id="run-calc">계산하기</button>`;

        calcResults.innerHTML = `<div class="placeholder-msg">정보를 입력하고 계산하기 버튼을 눌러주세요.</div>`;
        if (currentChart) { currentChart.destroy(); currentChart = null; }

        document.getElementById('run-calc').addEventListener('click', () => calculate(id));
    }

    function calculate(id) {
        const inputs = {};
        calculatorConfigs[id].inputs.forEach(input => {
            const el = document.getElementById(input.id);
            inputs[input.id] = el.type === 'number' ? parseFloat(el.value) : el.value;
        });

        const resultData = calculatorConfigs[id].calculate(inputs);
        renderResults(resultData.results);
        if (resultData.chart) renderChart(resultData.chart);
    }

    function renderResults(results) {
        calcResults.innerHTML = results.map(res => `
            <div class="result-item">
                <span class="result-label">${res.label}</span>
                <span class="result-value">${res.value}</span>
            </div>
        `).join('');
    }

    function renderChart(chartConfig) {
        const ctx = document.getElementById('calc-chart').getContext('2d');
        if (currentChart) currentChart.destroy();

        const isDark = document.body.getAttribute('data-theme') === 'dark';
        const textColor = isDark ? '#f1f5f9' : '#1e293b';

        currentChart = new Chart(ctx, {
            type: chartConfig.type,
            data: {
                labels: chartConfig.labels,
                datasets: [{
                    label: chartConfig.datasetLabel || '금액',
                    data: chartConfig.data,
                    backgroundColor: chartConfig.colors || ['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { labels: { color: textColor } }
                }
            }
        });
    }

    function updateChartTheme() {
        if (!currentChart) return;
        const isDark = document.body.getAttribute('data-theme') === 'dark';
        const textColor = isDark ? '#f1f5f9' : '#1e293b';
        currentChart.options.plugins.legend.labels.color = textColor;
        currentChart.update();
    }

    const formatWon = (val) => new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(val);

    // Calculator Configurations
    const calculatorConfigs = {
        'loan': {
            title: '대출 이자/상환 계산기',
            inputs: [
                { id: 'amount', label: '대출 금액 (원)', type: 'number', value: 100000000 },
                { id: 'rate', label: '연 이자율 (%)', type: 'number', value: 4.5 },
                { id: 'term', label: '대출 기간 (개월)', type: 'number', value: 24 },
                { id: 'type', label: '상환 방식', type: 'select', options: [
                    { value: 'equal-total', label: '원리금균등상환' },
                    { value: 'equal-principal', label: '원금균등상환' },
                    { value: 'bullet', label: '만기일시상환' }
                ]}
            ],
            calculate: (data) => {
                const r = data.rate / 100 / 12;
                const n = data.term;
                const L = data.amount;
                let totalInterest = data.type === 'bullet' ? L * r * n : (data.type === 'equal-total' ? (L * r * Math.pow(1+r,n)/(Math.pow(1+r,n)-1) * n - L) : (L * r * (n+1) / 2));

                return {
                    results: [
                        { label: '원금', value: formatWon(L) },
                        { label: '총 이자', value: formatWon(Math.round(totalInterest)) },
                        { label: '총 상환액', value: formatWon(Math.round(L + totalInterest)) }
                    ],
                    chart: {
                        type: 'doughnut',
                        labels: ['원금', '총 이자'],
                        data: [L, Math.round(totalInterest)],
                        colors: ['#2563eb', '#fbbf24']
                    }
                };
            }
        },
        'tax-settlement': {
            title: '연말정산 환급/추가납부 계산기',
            inputs: [
                { id: 'income', label: '연 총급여액 (원)', type: 'number', value: 50000000 },
                { id: 'prepaid', label: '기납부세액 (원)', type: 'number', value: 3000000 },
                { id: 'spending', label: '신용/체크카드 사용액 (원)', type: 'number', value: 20000000 },
                { id: 'insurance', label: '보장성 보험료 (원)', type: 'number', value: 1000000 }
            ],
            calculate: (data) => {
                // 근로소득공제 (매우 간략화)
                let deduction = 0;
                if (data.income <= 15000000) deduction = data.income * 0.45;
                else if (data.income <= 45000000) deduction = 6750000 + (data.income - 15000000) * 0.15;
                else deduction = 11250000 + (data.income - 45000000) * 0.05;

                // 카드 소득공제 (총급여 25% 초과분의 15%)
                const cardDeduction = Math.max(0, data.spending - data.income * 0.25) * 0.15;
                
                // 과세표준 (간략화)
                const taxBase = Math.max(0, data.income - deduction - cardDeduction - 1500000); // 150만은 본인공제
                
                // 산출세액 (2024년 세율 기준 간략화)
                let tax = 0;
                if (taxBase <= 14000000) tax = taxBase * 0.06;
                else if (taxBase <= 50000000) tax = 840000 + (taxBase - 14000000) * 0.15;
                else tax = 6240000 + (taxBase - 50000000) * 0.24;

                // 세액공제 (보험료 12%)
                const taxCredit = Math.min(120000, data.insurance * 0.12);
                const finalTax = Math.max(0, tax - taxCredit);
                
                const result = data.prepaid - finalTax;
                const status = result >= 0 ? '환급액' : '추가납부액';

                return {
                    results: [
                        { label: '결정 세액', value: formatWon(Math.round(finalTax)) },
                        { label: '기납부 세액', value: formatWon(data.prepaid) },
                        { label: status, value: formatWon(Math.abs(Math.round(result))) }
                    ],
                    chart: {
                        type: 'bar',
                        labels: ['결정세액', '기납부세액'],
                        data: [Math.round(finalTax), data.prepaid],
                        colors: result >= 0 ? ['#10b981', '#3b82f6'] : ['#f87171', '#3b82f6']
                    }
                };
            }
        },
        'salary': {
            title: '근로소득 실수령액 계산기',
            inputs: [
                { id: 'salary', label: '연봉 (원)', type: 'number', value: 40000000 },
                { id: 'non-taxable', label: '비과세액 (월)', type: 'number', value: 200000 }
            ],
            calculate: (data) => {
                const monthly = data.salary / 12;
                const taxable = monthly - data.non-taxable;
                const pension = taxable * 0.045;
                const health = taxable * 0.03545;
                const employment = taxable * 0.009;
                const incomeTax = taxable * 0.03; // 간소화
                const takeHome = monthly - (pension + health + employment + incomeTax);

                return {
                    results: [
                        { label: '월 세전 급여', value: formatWon(Math.round(monthly)) },
                        { label: '공제계 (세금/보험)', value: formatWon(Math.round(monthly - takeHome)) },
                        { label: '월 실수령액', value: formatWon(Math.round(takeHome)) }
                    ],
                    chart: {
                        type: 'pie',
                        labels: ['실수령액', '국민연금', '건강보험', '고용보험', '소득세'],
                        data: [takeHome, pension, health, employment, incomeTax].map(Math.round),
                        colors: ['#10b981', '#3b82f6', '#60a5fa', '#93c5fd', '#f87171']
                    }
                };
            }
        },
        'pension': {
            title: '연금보험 수익 계산기',
            inputs: [
                { id: 'monthly', label: '월 납입액 (원)', type: 'number', value: 500000 },
                { id: 'years', label: '납입 기간 (년)', type: 'number', value: 10 },
                { id: 'rate', label: '예상 수익률 (연 %)', type: 'number', value: 3.5 }
            ],
            calculate: (data) => {
                const r = data.rate / 100;
                const months = data.years * 12;
                let total = 0;
                let principal = 0;
                const timeline = [];
                const dataPoints = [];

                for (let i = 1; i <= months; i++) {
                    principal += data.monthly;
                    total = (total + data.monthly) * (1 + r / 12);
                    if (i % 12 === 0) {
                        timeline.push(`${i/12}년`);
                        dataPoints.push(Math.round(total));
                    }
                }

                return {
                    results: [
                        { label: '총 납입 원금', value: formatWon(principal) },
                        { label: '예상 평가 금액', value: formatWon(Math.round(total)) },
                        { label: '예상 수익률', value: ((total/principal - 1) * 100).toFixed(2) + '%' }
                    ],
                    chart: {
                        type: 'line',
                        labels: timeline,
                        data: dataPoints,
                        datasetLabel: '자산 성장'
                    }
                };
            }
        },
        'rent-compare': {
            title: '전세 vs 월세 비교',
            inputs: [
                { id: 'jeonse', label: '전세 보증금 (원)', type: 'number', value: 300000000 },
                { id: 'monthly_dep', label: '월세 보증금 (원)', type: 'number', value: 50000000 },
                { id: 'rent', label: '월세 (원)', type: 'number', value: 1000000 },
                { id: 'rate', label: '기회비용 (연 %)', type: 'number', value: 4.0 }
            ],
            calculate: (data) => {
                const jeonseCost = (data.jeonse * data.rate / 100) / 12;
                const monthlyCost = (data.monthly_dep * data.rate / 100) / 12 + data.rent;
                
                return {
                    results: [
                        { label: '전세 월 기회비용', value: formatWon(Math.round(jeonseCost)) },
                        { label: '월세 실제 유지비', value: formatWon(Math.round(monthlyCost)) },
                        { label: '월 차액', value: formatWon(Math.round(Math.abs(jeonseCost - monthlyCost))) }
                    ],
                    chart: {
                        type: 'bar',
                        labels: ['전세 (기회비용)', '월세 (총비용)'],
                        data: [Math.round(jeonseCost), Math.round(monthlyCost)],
                        colors: ['#3b82f6', '#f87171']
                    }
                };
            }
        },
        'capital-gain': {
            title: '양도소득세 계산기',
            inputs: [
                { id: 'buy', label: '취득 가액 (원)', type: 'number', value: 500000000 },
                { id: 'sell', label: '양도 가액 (원)', type: 'number', value: 700000000 },
                { id: 'period', label: '보유 기간 (년)', type: 'number', value: 3 }
            ],
            calculate: (data) => {
                const gain = data.sell - data.buy;
                const tax = gain > 0 ? gain * 0.2 : 0; // 매우 간략화된 20%
                return {
                    results: [
                        { label: '양도 차익', value: formatWon(gain) },
                        { label: '예상 세액', value: formatWon(Math.round(tax)) }
                    ],
                    chart: {
                        type: 'doughnut',
                        labels: ['실수익', '세금'],
                        data: [gain - tax, tax],
                        colors: ['#10b981', '#f87171']
                    }
                };
            }
        },
        'real-estate': {
            title: '부동산 투자 수익률',
            inputs: [
                { id: 'price', label: '매매가 (원)', type: 'number', value: 300000000 },
                { id: 'deposit', label: '보증금 (원)', type: 'number', value: 30000000 },
                { id: 'monthly', label: '월세 (원)', type: 'number', value: 1200000 }
            ],
            calculate: (data) => {
                const investment = data.price - data.deposit;
                const annualRent = data.monthly * 12;
                const yieldRate = (annualRent / investment) * 100;
                return {
                    results: [
                        { label: '실 투자금', value: formatWon(investment) },
                        { label: '연 수익률', value: yieldRate.toFixed(2) + '%' }
                    ],
                    chart: {
                        type: 'bar',
                        labels: ['매매가', '실투자금'],
                        data: [data.price, investment],
                        colors: ['#3b82f6', '#60a5fa']
                    }
                };
            }
        },
        'property-tax': {
            title: '재산세/종부세 계산기',
            inputs: [
                { id: 'value', label: '공시지가 합계 (원)', type: 'number', value: 1000000000 }
            ],
            calculate: (data) => {
                const pTax = data.value * 0.002;
                const jTax = Math.max(0, (data.value - 900000000) * 0.005);
                return {
                    results: [
                        { label: '예상 재산세', value: formatWon(Math.round(pTax)) },
                        { label: '예상 종부세', value: formatWon(Math.round(jTax)) },
                        { label: '총 보유세', value: formatWon(Math.round(pTax + jTax)) }
                    ],
                    chart: {
                        type: 'pie',
                        labels: ['재산세', '종부세'],
                        data: [Math.round(pTax), Math.round(jTax)],
                        colors: ['#fbbf24', '#f87171']
                    }
                };
            }
        },
        'auto-insurance': {
            title: '자동차 보험료 시뮬레이션',
            inputs: [
                { id: 'base', label: '기본 보험료 (원)', type: 'number', value: 800000 },
                { id: 'age', label: '연령 할증', type: 'select', options: [
                    { value: '1.5', label: '20대 초반 (150%)' },
                    { value: '1.0', label: '30대 이상 (100%)' }
                ]}
            ],
            calculate: (data) => {
                const total = data.base * parseFloat(data.age);
                return {
                    results: [
                        { label: '최종 보험료', value: formatWon(Math.round(total)) }
                    ],
                    chart: {
                        type: 'bar',
                        labels: ['기본', '할증후'],
                        data: [data.base, Math.round(total)],
                        colors: ['#94a3b8', '#3b82f6']
                    }
                };
            }
        },
        'rate-analysis': {
            title: '금리 변동 분석',
            inputs: [
                { id: 'amount', label: '대출 잔액 (원)', type: 'number', value: 200000000 },
                { id: 'cur_rate', label: '현재 금리 (%)', type: 'number', value: 4.0 },
                { id: 'next_rate', label: '변동 후 금리 (%)', type: 'number', value: 5.0 }
            ],
            calculate: (data) => {
                const cur = (data.amount * data.cur_rate / 100) / 12;
                const next = (data.amount * data.next_rate / 100) / 12;
                return {
                    results: [
                        { label: '현재 월 이자', value: formatWon(Math.round(cur)) },
                        { label: '변동 후 월 이자', value: formatWon(Math.round(next)) },
                        { label: '추가 부담액', value: formatWon(Math.round(next - cur)) }
                    ],
                    chart: {
                        type: 'bar',
                        labels: ['현재 이자', '변동 후 이자'],
                        data: [Math.round(cur), Math.round(next)],
                        colors: ['#3b82f6', '#f87171']
                    }
                };
            }
        }
    };
});

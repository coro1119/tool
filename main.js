document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const themeBtn = document.getElementById('theme-btn');
    const homeView = document.getElementById('home-view');
    const calcView = document.getElementById('calc-view');
    const calcTitle = document.getElementById('calc-title');
    const calcInputs = document.getElementById('calc-inputs');
    const calcResults = document.getElementById('calc-results');
    const chartWrapper = document.querySelector('.chart-wrapper');
    const backBtn = document.querySelector('.back-btn');
    const navLinks = document.querySelectorAll('.nav-links a, .dropdown-menu a, .calc-card');
    
    // Global State
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
            if (calcId) { 
                e.preventDefault(); 
                showCalculator(calcId); 
            } else if (pageId === 'home') { 
                e.preventDefault(); 
                showHome(); 
            }
        });
    });

    backBtn.addEventListener('click', showHome);

    function showHome() {
        clearCalculatorState();
        homeView.classList.add('active');
        calcView.classList.remove('active');
        window.scrollTo(0, 0);
    }

    function showCalculator(id) {
        clearCalculatorState();
        homeView.classList.remove('active');
        calcView.classList.add('active');
        window.scrollTo(0, 0);
        renderCalculatorUI(id);
    }

    function clearCalculatorState() {
        if (currentChart) {
            currentChart.destroy();
            currentChart = null;
        }
        calcInputs.innerHTML = '';
        calcResults.innerHTML = '';
        if (chartWrapper) chartWrapper.style.display = 'none';
    }

    function renderCalculatorUI(id) {
        const config = calculatorConfigs[id];
        if (!config) {
            alert('준비 중인 계산기입니다.');
            showHome();
            return;
        }
        
        calcTitle.textContent = config.title;
        
        const inputsHtml = config.inputs.map(input => `
            <div class="input-group">
                <label for="${input.id}">${input.label}</label>
                ${input.type === 'select' ? `
                    <select id="${input.id}">${input.options.map(opt => `<option value="${opt.value}">${opt.label}</option>`).join('')}</select>
                ` : `<input type="${input.type}" id="${input.id}" value="${input.value || ''}">`}
            </div>
        `).join('');

        calcInputs.innerHTML = inputsHtml + `<button class="calc-btn" id="run-calc">계산하기</button>`;
        calcResults.innerHTML = `<div class="placeholder-msg">정보를 입력하고 계산하기 버튼을 눌러주세요.</div>`;

        document.getElementById('run-calc').addEventListener('click', () => calculate(id));
    }

    function calculate(id) {
        const config = calculatorConfigs[id];
        const inputs = {};
        
        config.inputs.forEach(input => {
            const el = document.getElementById(input.id);
            if (el) {
                inputs[input.id] = el.type === 'number' ? parseFloat(el.value) || 0 : el.value;
            }
        });

        try {
            const resultData = config.calculate(inputs);
            renderResults(resultData.results);
            
            if (resultData.chart) {
                if (chartWrapper) chartWrapper.style.display = 'flex';
                renderChart(resultData.chart);
            } else {
                if (chartWrapper) chartWrapper.style.display = 'none';
            }
        } catch (error) {
            console.error('Calculation Error:', error);
            calcResults.innerHTML = `<div class="placeholder-msg" style="color: red;">계산 중 오류가 발생했습니다. 입력값을 확인해주세요.</div>`;
        }
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
        const canvas = document.getElementById('calc-chart');
        const ctx = canvas.getContext('2d');
        
        if (currentChart) {
            currentChart.destroy();
        }

        const isDark = document.body.getAttribute('data-theme') === 'dark';
        const textColor = isDark ? '#f1f5f9' : '#1e293b';

        currentChart = new Chart(ctx, {
            type: chartConfig.type,
            data: {
                labels: chartConfig.labels,
                datasets: [{
                    label: chartConfig.datasetLabel || '금액',
                    data: chartConfig.data,
                    backgroundColor: chartConfig.colors || ['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#f87171', '#fbbf24', '#10b981'],
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
                { id: 'loan_amount', label: '대출 금액 (원)', type: 'number', value: 100000000 },
                { id: 'loan_rate', label: '연 이자율 (%)', type: 'number', value: 4.5 },
                { id: 'loan_term', label: '대출 기간 (개월)', type: 'number', value: 24 },
                { id: 'loan_type', label: '상환 방식', type: 'select', options: [
                    { value: 'equal-total', label: '원리금균등상환' },
                    { value: 'equal-principal', label: '원금균등상환' },
                    { value: 'bullet', label: '만기일시상환' }
                ]}
            ],
            calculate: (data) => {
                const r = data.loan_rate / 100 / 12;
                const n = data.loan_term;
                const L = data.loan_amount;
                let totalInterest = 0;
                
                if (data.loan_type === 'bullet') totalInterest = L * r * n;
                else if (data.loan_type === 'equal-total') totalInterest = (L * r * Math.pow(1+r,n)/(Math.pow(1+r,n)-1) * n - L);
                else totalInterest = (L * r * (n+1) / 2);

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
                { id: 'tax_income', label: '연 총급여액 (원)', type: 'number', value: 50000000 },
                { id: 'tax_prepaid', label: '기납부세액 (원)', type: 'number', value: 3000000 },
                { id: 'tax_spending', label: '신용/체크카드 사용액 (원)', type: 'number', value: 20000000 },
                { id: 'tax_insurance', label: '보장성 보험료 (원)', type: 'number', value: 1000000 }
            ],
            calculate: (data) => {
                let deduction = data.tax_income <= 15000000 ? data.tax_income * 0.45 : (data.tax_income <= 45000000 ? 6750000 + (data.tax_income-15000000)*0.15 : 11250000 + (data.tax_income-45000000)*0.05);
                const cardDeduction = Math.max(0, data.tax_spending - data.tax_income * 0.25) * 0.15;
                const taxBase = Math.max(0, data.tax_income - deduction - cardDeduction - 1500000);
                let tax = taxBase <= 14000000 ? taxBase * 0.06 : (taxBase <= 50000000 ? 840000 + (taxBase-14000000)*0.15 : 6240000 + (taxBase-50000000)*0.24);
                const taxCredit = Math.min(120000, data.tax_insurance * 0.12);
                const finalTax = Math.max(0, tax - taxCredit);
                const result = data.tax_prepaid - finalTax;
                
                return {
                    results: [
                        { label: '결정 세액', value: formatWon(Math.round(finalTax)) },
                        { label: '기납부 세액', value: formatWon(data.tax_prepaid) },
                        { label: result >= 0 ? '예상 환급액' : '예상 추가납부액', value: formatWon(Math.abs(Math.round(result))) }
                    ],
                    chart: {
                        type: 'bar',
                        labels: ['결정세액', '기납부세액'],
                        data: [Math.round(finalTax), data.tax_prepaid],
                        colors: result >= 0 ? ['#10b981', '#3b82f6'] : ['#f87171', '#3b82f6']
                    }
                };
            }
        },
        'salary': {
            title: '근로소득 실수령액 계산기',
            inputs: [
                { id: 'sal_salary', label: '연봉 (원)', type: 'number', value: 40000000 },
                { id: 'sal_non_tax', label: '비과세액 (월)', type: 'number', value: 200000 }
            ],
            calculate: (data) => {
                const monthly = data.sal_salary / 12;
                const taxable = monthly - data.sal_non_tax;
                
                // 2024 요율 근사치
                const pension = taxable * 0.045; // 국민연금
                const health = taxable * 0.03545; // 건강보험
                const longTerm = health * 0.1295; // 장기요양
                const employment = taxable * 0.009; // 고용보험
                const incomeTax = taxable * 0.03; // 소득세(간략화)
                const localTax = incomeTax * 0.1; // 지방소득세
                
                const totalDeduction = pension + health + longTerm + employment + incomeTax + localTax;
                const takeHome = monthly - totalDeduction;
                
                return {
                    results: [
                        { label: '월 세전 급여', value: formatWon(Math.round(monthly)) },
                        { label: '공제액 합계', value: formatWon(Math.round(totalDeduction)) },
                        { label: '월 실수령액', value: formatWon(Math.round(takeHome)) }
                    ],
                    chart: {
                        type: 'pie',
                        labels: ['실수령액', '국민연금', '건강보험', '고용보험', '소득세/지방세'],
                        data: [
                            Math.round(takeHome), 
                            Math.round(pension), 
                            Math.round(health + longTerm), 
                            Math.round(employment), 
                            Math.round(incomeTax + localTax)
                        ],
                        colors: ['#10b981', '#3b82f6', '#60a5fa', '#93c5fd', '#f87171']
                    }
                };
            }
        },
        'pension': {
            title: '연금보험 수익 계산기',
            inputs: [
                { id: 'pen_monthly', label: '월 납입액 (원)', type: 'number', value: 500000 },
                { id: 'pen_years', label: '납입 기간 (년)', type: 'number', value: 10 },
                { id: 'pen_rate', label: '예상 수익률 (연 %)', type: 'number', value: 3.5 }
            ],
            calculate: (data) => {
                let total = 0;
                let principal = 0;
                const r = data.pen_rate / 100 / 12;
                const timeline = [];
                const dataPoints = [];
                
                for (let i = 1; i <= data.pen_years * 12; i++) {
                    principal += data.pen_monthly;
                    total = (total + data.pen_monthly) * (1 + r);
                    if (i % 12 === 0) {
                        timeline.push(`${i/12}년`);
                        dataPoints.push(Math.round(total));
                    }
                }
                return {
                    results: [
                        { label: '총 납입 원금', value: formatWon(principal) },
                        { label: '예상 평가 금액', value: formatWon(Math.round(total)) },
                        { label: '누적 수익', value: formatWon(Math.round(total - principal)) }
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
                { id: 'rc_jeonse', label: '전세 보증금 (원)', type: 'number', value: 300000000 },
                { id: 'rc_monthly_dep', label: '월세 보증금 (원)', type: 'number', value: 50000000 },
                { id: 'rc_rent', label: '월세 (원)', type: 'number', value: 1000000 },
                { id: 'rc_rate', label: '기회비용 (연 %)', type: 'number', value: 4.0 }
            ],
            calculate: (data) => {
                const jeonseCost = (data.rc_jeonse * data.rc_rate / 100) / 12;
                const monthlyCost = (data.rc_monthly_dep * data.rc_rate / 100) / 12 + data.rc_rent;
                return {
                    results: [
                        { label: '전세 월 환산비용', value: formatWon(Math.round(jeonseCost)) },
                        { label: '월세 월 총비용', value: formatWon(Math.round(monthlyCost)) },
                        { label: '유리한 선택', value: jeonseCost < monthlyCost ? '전세' : '월세' }
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
                { id: 'cg_buy', label: '취득 가액 (원)', type: 'number', value: 500000000 },
                { id: 'cg_sell', label: '양도 가액 (원)', type: 'number', value: 700000000 }
            ],
            calculate: (data) => {
                const gain = data.cg_sell - data.cg_buy;
                const tax = gain > 0 ? gain * 0.2 : 0;
                return {
                    results: [
                        { label: '양도 차익', value: formatWon(gain) },
                        { label: '예상 세액', value: formatWon(Math.round(tax)) }
                    ],
                    chart: {
                        type: 'doughnut',
                        labels: ['실수익', '세금'],
                        data: [gain-tax, tax],
                        colors: ['#10b981', '#f87171']
                    }
                };
            }
        },
        'real-estate': {
            title: '부동산 투자 수익률',
            inputs: [
                { id: 're_price', label: '매매가 (원)', type: 'number', value: 300000000 },
                { id: 're_deposit', label: '보증금 (원)', type: 'number', value: 30000000 },
                { id: 're_monthly', label: '월세 (원)', type: 'number', value: 1200000 }
            ],
            calculate: (data) => {
                const investment = data.re_price - data.re_deposit;
                const annualRent = data.re_monthly * 12;
                const yieldRate = (annualRent / investment) * 100;
                return {
                    results: [
                        { label: '실 투자금', value: formatWon(investment) },
                        { label: '연 수익률', value: yieldRate.toFixed(2) + '%' }
                    ],
                    chart: {
                        type: 'bar',
                        labels: ['매매가', '실투자금'],
                        data: [data.re_price, investment]
                    }
                };
            }
        },
        'property-tax': {
            title: '재산세/종부세 계산기',
            inputs: [
                { id: 'pt_value', label: '공시지가 합계 (원)', type: 'number', value: 1000000000 }
            ],
            calculate: (data) => {
                const pTax = data.pt_value * 0.002;
                const jTax = Math.max(0, (data.pt_value - 900000000) * 0.005);
                return {
                    results: [
                        { label: '예상 재산세', value: formatWon(Math.round(pTax)) },
                        { label: '예상 종부세', value: formatWon(Math.round(jTax)) }
                    ],
                    chart: {
                        type: 'pie',
                        labels: ['재산세', '종부세'],
                        data: [Math.round(pTax), Math.round(jTax)]
                    }
                };
            }
        },
        'auto-insurance': {
            title: '자동차 보험료 시뮬레이션',
            inputs: [
                { id: 'ai_base', label: '기본 보험료 (원)', type: 'number', value: 800000 },
                { id: 'ai_factor', label: '할증 계수', type: 'number', value: 1.2 }
            ],
            calculate: (data) => {
                const total = data.ai_base * data.ai_factor;
                return {
                    results: [
                        { label: '예상 보험료', value: formatWon(Math.round(total)) }
                    ],
                    chart: {
                        type: 'bar',
                        labels: ['기본', '할증후'],
                        data: [data.ai_base, Math.round(total)]
                    }
                };
            }
        },
        'rate-analysis': {
            title: '금리 변동 분석',
            inputs: [
                { id: 'ra_amount', label: '대출 잔액 (원)', type: 'number', value: 200000000 },
                { id: 'ra_cur', label: '현재 금리 (%)', type: 'number', value: 4.0 },
                { id: 'ra_next', label: '변동 후 금리 (%)', type: 'number', value: 5.0 }
            ],
            calculate: (data) => {
                const cur = (data.ra_amount * data.ra_cur / 100) / 12;
                const next = (data.ra_amount * data.ra_next / 100) / 12;
                return {
                    results: [
                        { label: '현재 월 이자', value: formatWon(Math.round(cur)) },
                        { label: '변동 후 월 이자', value: formatWon(Math.round(next)) }
                    ],
                    chart: {
                        type: 'bar',
                        labels: ['현재', '변동후'],
                        data: [Math.round(cur), Math.round(next)],
                        colors: ['#3b82f6', '#f87171']
                    }
                };
            }
        }
    };
});

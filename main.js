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

    // State
    let currentCalc = '';

    // Theme Toggle
    themeBtn.addEventListener('click', () => {
        const currentTheme = document.body.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.body.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    });

    // Load Saved Theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        document.body.setAttribute('data-theme', savedTheme);
    }

    // Navigation Logic
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
        homeView.classList.add('active');
        calcView.classList.remove('active');
        window.scrollTo(0, 0);
    }

    function showCalculator(id) {
        currentCalc = id;
        homeView.classList.remove('active');
        calcView.classList.add('active');
        window.scrollTo(0, 0);
        renderCalculatorUI(id);
    }

    // UI Rendering Logic
    function renderCalculatorUI(id) {
        const config = calculatorConfigs[id];
        calcTitle.textContent = config.title;
        
        // Render Inputs
        calcInputs.innerHTML = config.inputs.map(input => `
            <div class="input-group">
                <label for="${input.id}">${input.label}</label>
                ${input.type === 'select' ? `
                    <select id="${input.id}">
                        ${input.options.map(opt => `<option value="${opt.value}">${opt.label}</option>`).join('')}
                    </select>
                ` : `
                    <input type="${input.type}" id="${input.id}" placeholder="${input.placeholder || ''}" value="${input.value || ''}">
                `}
            </div>
        `).join('') + `<button class="calc-btn" id="run-calc">계산하기</button>`;

        // Reset Results
        calcResults.innerHTML = `<div class="placeholder-msg">정보를 입력하고 계산하기 버튼을 눌러주세요.</div>`;

        // Add Event Listener
        document.getElementById('run-calc').addEventListener('click', () => {
            calculate(id);
        });
    }

    // Calculation Logic
    function calculate(id) {
        const inputs = {};
        calculatorConfigs[id].inputs.forEach(input => {
            const el = document.getElementById(input.id);
            inputs[input.id] = el.type === 'number' ? parseFloat(el.value) : el.value;
        });

        const results = calculatorConfigs[id].calculate(inputs);
        renderResults(results);
    }

    function renderResults(results) {
        calcResults.innerHTML = results.map(res => `
            <div class="result-item">
                <span class="result-label">${res.label}</span>
                <span class="result-value">${res.value}</span>
            </div>
        `).join('');
    }

    // Helper: Number Formatting
    const formatWon = (val) => new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(val);
    const formatNum = (val) => new Intl.NumberFormat('ko-KR').format(val);

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
                let monthly, totalInterest;

                if (data.type === 'equal-total') {
                    monthly = L * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
                    totalInterest = (monthly * n) - L;
                } else if (data.type === 'equal-principal') {
                    totalInterest = 0;
                    for (let i = 0; i < n; i++) {
                        totalInterest += (L - (L / n * i)) * r;
                    }
                    monthly = (L + totalInterest) / n;
                } else {
                    totalInterest = L * r * n;
                    monthly = totalInterest / n;
                }

                return [
                    { label: '월 평균 상환액', value: formatWon(Math.round(monthly)) },
                    { label: '총 이자액', value: formatWon(Math.round(totalInterest)) },
                    { label: '총 상환금액', value: formatWon(Math.round(L + totalInterest)) }
                ];
            }
        },
        'salary': {
            title: '근로소득 실수령액 계산기',
            inputs: [
                { id: 'salary', label: '연봉 (원)', type: 'number', value: 40000000 },
                { id: 'dependents', label: '부양가족 수 (본인 포함)', type: 'number', value: 1 },
                { id: 'non-taxable', label: '비과세액 (월)', type: 'number', value: 200000 }
            ],
            calculate: (data) => {
                const monthlySalary = data.salary / 12;
                const taxable = monthlySalary - data.non-taxable;
                
                // 간이 계산 (2024년율 근사치)
                const pension = taxable * 0.045;
                const health = taxable * 0.03545;
                const longTerm = health * 0.1295;
                const employment = taxable * 0.009;
                
                // 소득세 (매우 간소화된 로직)
                let incomeTax = taxable * 0.05; 
                if (data.salary > 60000000) incomeTax = taxable * 0.12;
                
                const localTax = incomeTax * 0.1;
                const totalDeduction = pension + health + longTerm + employment + incomeTax + localTax;
                
                return [
                    { label: '월 세전 급여', value: formatWon(Math.round(monthlySalary)) },
                    { label: '4대보험 합계', value: formatWon(Math.round(pension + health + longTerm + employment)) },
                    { label: '소득세/지방세', value: formatWon(Math.round(incomeTax + localTax)) },
                    { label: '월 예상 실수령액', value: formatWon(Math.round(monthlySalary - totalDeduction)) }
                ];
            }
        },
        'rent-compare': {
            title: '전세 vs 월세 비교 계산기',
            inputs: [
                { id: 'deposit-jeonse', label: '전세 보증금 (원)', type: 'number', value: 300000000 },
                { id: 'deposit-monthly', label: '월세 보증금 (원)', type: 'number', value: 50000000 },
                { id: 'monthly-rent', label: '월세액 (원)', type: 'number', value: 1000000 },
                { id: 'investment-rate', label: '보증금 기회비용 (연 수익률 %)', type: 'number', value: 4.0 }
            ],
            calculate: (data) => {
                const jeonseCost = (data['deposit-jeonse'] * (data['investment-rate'] / 100)) / 12;
                const monthlyCost = (data['deposit-monthly'] * (data['investment-rate'] / 100)) / 12 + data['monthly-rent'];
                const diff = Math.abs(jeonseCost - monthlyCost);
                const winner = jeonseCost < monthlyCost ? '전세' : '월세';

                return [
                    { label: '전세 월 환산 비용', value: formatWon(Math.round(jeonseCost)) },
                    { label: '월세 총 유지 비용', value: formatWon(Math.round(monthlyCost)) },
                    { label: '유리한 선택', value: `${winner} (월 ${formatWon(Math.round(diff))} 절약)` }
                ];
            }
        },
        'capital-gain': {
            title: '양도소득세 계산기',
            inputs: [
                { id: 'buy-price', label: '취득 가액 (원)', type: 'number', value: 500000000 },
                { id: 'sell-price', label: '양도 가액 (원)', type: 'number', value: 700000000 },
                { id: 'holding-period', label: '보유 기간 (년)', type: 'number', value: 3 },
                { id: 'is-primary', label: '1가구 1주택 여부', type: 'select', options: [
                    { value: 'yes', label: '예 (비과세 대상 확인 필요)' },
                    { value: 'no', label: '아니오' }
                ]}
            ],
            calculate: (data) => {
                const gain = data['sell-price'] - data['buy-price'];
                let tax = 0;
                if (data['is-primary'] === 'no' || gain > 1200000000) {
                    // 간소화된 양도세율 적용
                    if (gain <= 14000000) tax = gain * 0.06;
                    else if (gain <= 50000000) tax = gain * 0.15 - 1260000;
                    else if (gain <= 88000000) tax = gain * 0.24 - 5760000;
                    else tax = gain * 0.35 - 15440000;
                }
                return [
                    { label: '양도 차익', value: formatWon(gain) },
                    { label: '예상 양도소득세', value: formatWon(Math.round(tax)) },
                    { label: '지방소득세 (10%)', value: formatWon(Math.round(tax * 0.1)) },
                    { label: '최종 납부 세액', value: formatWon(Math.round(tax * 1.1)) }
                ];
            }
        },
        'real-estate': {
            title: '부동산 투자 수익률 계산기',
            inputs: [
                { id: 'purchase-price', label: '매매가 (원)', type: 'number', value: 200000000 },
                { id: 're-deposit', label: '보증금 (원)', type: 'number', value: 20000000 },
                { id: 're-monthly', label: '월세 (원)', type: 'number', value: 800000 },
                { id: 're-loan', label: '대출금 (원)', type: 'number', value: 100000000 },
                { id: 're-rate', label: '대출 이자율 (%)', type: 'number', value: 4.5 }
            ],
            calculate: (data) => {
                const annualRent = data['re-monthly'] * 12;
                const annualInterest = data['re-loan'] * (data['re-rate'] / 100);
                const actualInvestment = data['purchase-price'] - data['re-deposit'] - data['re-loan'];
                const annualNetProfit = annualRent - annualInterest;
                const yieldRate = (annualNetProfit / actualInvestment) * 100;

                return [
                    { label: '실투자금', value: formatWon(actualInvestment) },
                    { label: '연간 순이익', value: formatWon(Math.round(annualNetProfit)) },
                    { label: '수익률 (ROI)', value: yieldRate.toFixed(2) + '%' }
                ];
            }
        },
        'auto-insurance': {
            title: '자동차 보험료 비교 계산기',
            inputs: [
                { id: 'base-premium', label: '기본 보험료 (원)', type: 'number', value: 800000 },
                { id: 'age-factor', label: '연령대', type: 'select', options: [
                    { value: '1.5', label: '20대 초반' },
                    { value: '1.2', label: '20대 후반' },
                    { value: '1.0', label: '30대 이상' }
                ]},
                { id: 'accident-factor', label: '사고 유무 (최근 3년)', type: 'select', options: [
                    { value: '1.0', label: '무사고' },
                    { value: '1.3', label: '1회 사고' },
                    { value: '1.6', label: '2회 이상' }
                ]}
            ],
            calculate: (data) => {
                const total = data['base-premium'] * parseFloat(data['age-factor']) * parseFloat(data['accident-factor']);
                return [
                    { label: '예상 연간 보험료', value: formatWon(Math.round(total)) },
                    { label: '월 환산액', value: formatWon(Math.round(total / 12)) }
                ];
            }
        },
        'pension': {
            title: '연금보험 수익 계산기',
            inputs: [
                { id: 'monthly-pay', label: '월 납입액 (원)', type: 'number', value: 500000 },
                { id: 'pay-years', label: '납입 기간 (년)', type: 'number', value: 10 },
                { id: 'wait-years', label: '거치 기간 (년)', type: 'number', value: 10 },
                { id: 'interest-rate', label: '예상 수익률 (연 %)', type: 'number', value: 3.5 }
            ],
            calculate: (data) => {
                const r = data['interest-rate'] / 100;
                let principal = 0;
                let totalValue = 0;
                
                // 납입 기간 동안의 복리 계산
                for (let i = 1; i <= data['pay-years'] * 12; i++) {
                    principal += data['monthly-pay'];
                    totalValue = (totalValue + data['monthly-pay']) * (1 + r / 12);
                }
                // 거치 기간 동안의 복리 계산
                totalValue = totalValue * Math.pow(1 + r, data['wait-years']);

                return [
                    { label: '총 납입 원금', value: formatWon(principal) },
                    { label: '예상 수령 시점 자산', value: formatWon(Math.round(totalValue)) },
                    { label: '예상 수익금', value: formatWon(Math.round(totalValue - principal)) }
                ];
            }
        },
        'property-tax': {
            title: '재산세/종합부동산세 계산기',
            inputs: [
                { id: 'pub-price', label: '공시지가 합계 (원)', type: 'number', value: 1500000000 },
                { id: 'is-single', label: '1주택자 여부', type: 'select', options: [
                    { value: 'yes', label: '예' },
                    { value: 'no', label: '아니오' }
                ]}
            ],
            calculate: (data) => {
                const basePrice = data['pub-price'];
                // 재산세 간소화 계산
                const propertyTax = basePrice * 0.002; 
                // 종부세 간소화 계산
                const threshold = data['is-single'] === 'yes' ? 1200000000 : 900000000;
                const totalTax = propertyTax + Math.max(0, (basePrice - threshold) * 0.01);

                return [
                    { label: '공시지가', value: formatWon(basePrice) },
                    { label: '예상 재산세', value: formatWon(Math.round(propertyTax)) },
                    { label: '예상 종합부동산세', value: formatWon(Math.round(Math.max(0, (basePrice - threshold) * 0.01))) },
                    { label: '총 보유세 합계', value: formatWon(Math.round(totalTax)) }
                ];
            },
        },
        'tax-settlement': {
            title: '연말정산 환급 계산기',
            inputs: [
                { id: 'annual-income', label: '총 급여액 (원)', type: 'number', value: 50000000 },
                { id: 'card-spend', label: '신용/체크카드 사용액 (원)', type: 'number', value: 20000000 },
                { id: 'insurance-pay', label: '보장성 보험료 (원)', type: 'number', value: 1000000 }
            ],
            calculate: (data) => {
                // 매우 간소화된 환급 시뮬레이션
                const taxCredit = data['insurance-pay'] * 0.12;
                const deduction = Math.max(0, data['card-spend'] - (data['annual-income'] * 0.25)) * 0.15;
                const refund = taxCredit + (deduction * 0.15); // 한계세율 15% 가정

                return [
                    { label: '카드 소득공제 예상액', value: formatWon(Math.round(deduction)) },
                    { label: '보험료 세액공제 예상액', value: formatWon(Math.round(taxCredit)) },
                    { label: '예상 환급액 (시뮬레이션)', value: formatWon(Math.round(refund)) }
                ];
            }
        },
        'rate-analysis': {
            title: '대출 금리 변동 분석',
            inputs: [
                { id: 'cur-amount', label: '대출 잔액 (원)', type: 'number', value: 200000000 },
                { id: 'cur-rate', label: '현재 금리 (%)', type: 'number', value: 4.0 },
                { id: 'next-rate', label: '변동 후 금리 (%)', type: 'number', value: 5.0 }
            ],
            calculate: (data) => {
                const curMonthly = (data['cur-amount'] * (data['cur-rate'] / 100)) / 12;
                const nextMonthly = (data['cur-amount'] * (data['next-rate'] / 100)) / 12;
                const diff = nextMonthly - curMonthly;

                return [
                    { label: '현재 월 이자', value: formatWon(Math.round(curMonthly)) },
                    { label: '변동 후 월 이자', value: formatWon(Math.round(nextMonthly)) },
                    { label: '월 이자 차액', value: formatWon(Math.round(diff)) },
                    { label: '연간 추가 부담액', value: formatWon(Math.round(diff * 12)) }
                ];
            }
        }
        // ... 나머지 계산기들은 패턴에 따라 추가 가능
    };

    // 추가 계산기 스텁 (Placeholder for all requested calcs)
    const extraCalcs = [
        'tax-settlement', 'capital-gain', 'auto-insurance', 
        'pension', 'real-estate', 'property-tax', 'rate-analysis'
    ];
    
    extraCalcs.forEach(id => {
        if (!calculatorConfigs[id]) {
            calculatorConfigs[id] = {
                title: document.querySelector(`[data-calc="${id}"] h3`)?.textContent || '계산기',
                inputs: [
                    { id: 'val1', label: '입력값 1', type: 'number', value: 0 },
                    { id: 'val2', label: '입력값 2', type: 'number', value: 0 }
                ],
                calculate: (data) => [
                    { label: '계산 로직 준비 중', value: '업데이트 예정' },
                    { label: '입력 합계', value: formatNum(data.val1 + data.val2) }
                ]
            };
        }
    });
});

document.addEventListener('DOMContentLoaded', function() {
    var themeBtn = document.getElementById('theme-btn');
    var homeView = document.getElementById('home-view');
    var calcView = document.getElementById('calc-view');
    var calcTitle = document.getElementById('calc-title');
    var calcInfoBox = document.getElementById('calc-info-box');
    var calcInputs = document.getElementById('calc-inputs');
    var calcResults = document.getElementById('calc-results');
    var chartWrapper = document.querySelector('.chart-wrapper');
    var backBtn = document.querySelector('.back-btn');
    var navLinks = document.querySelectorAll('.nav-links a, .dropdown-menu a, .calc-card');
    
    var currentChart = null;

    // Helper: 2026년 기준 소득세율 (누진세율) 계산
    function calcProgressiveTax(taxBase) {
        if (taxBase <= 14000000) return taxBase * 0.06;
        if (taxBase <= 50000000) return taxBase * 0.15 - 1260000;
        if (taxBase <= 88000000) return taxBase * 0.24 - 5760000;
        if (taxBase <= 150000000) return taxBase * 0.35 - 15440000;
        if (taxBase <= 300000000) return taxBase * 0.38 - 19940000;
        if (taxBase <= 500000000) return taxBase * 0.40 - 25940000;
        if (taxBase <= 1000000000) return taxBase * 0.42 - 35940000;
        return taxBase * 0.45 - 65940000;
    }

    if (themeBtn) {
        themeBtn.addEventListener('click', function() {
            var body = document.body;
            var isDark = body.getAttribute('data-theme') === 'dark';
            body.setAttribute('data-theme', isDark ? 'light' : 'dark');
            themeBtn.textContent = isDark ? '🌓' : '☀️';
            var runBtn = document.getElementById('run');
            if (runBtn && calcResults.innerHTML && !calcResults.innerHTML.includes('placeholder-msg')) {
                runBtn.click();
            }
        });
    }

    function clearAll() {
        if (currentChart) { currentChart.destroy(); currentChart = null; }
        calcInputs.innerHTML = '';
        calcResults.innerHTML = '<div class="placeholder-msg">정보를 입력하고 계산하기 버튼을 눌러주세요.</div>';
        if (chartWrapper) chartWrapper.style.display = 'none';
        if (calcInfoBox) calcInfoBox.innerHTML = '';
    }

    function goTo(viewName) {
        clearAll();
        if (viewName === 'home') {
            homeView.classList.add('active');
            calcView.classList.remove('active');
            document.querySelector('[data-page="home"]').classList.add('active');
        } else {
            homeView.classList.remove('active');
            calcView.classList.add('active');
            document.querySelector('[data-page="home"]').classList.remove('active');
        }
        window.scrollTo(0, 0);
    }

    navLinks.forEach(function(link) {
        link.addEventListener('click', function(e) {
            var cid = link.getAttribute('data-calc');
            if (cid) {
                e.preventDefault();
                goTo('calc');
                startUI(cid);
            } else if (link.getAttribute('data-page') === 'home') {
                e.preventDefault();
                goTo('home');
            }
        });
    });

    if (backBtn) backBtn.addEventListener('click', function() { goTo('home'); });

    var won = function(v) { 
        if (isNaN(v)) return '0원';
        return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(Math.round(v)); 
    };

    function startUI(id) {
        var cfg = book[id];
        if (!cfg) {
            console.error('Calculator not found:', id);
            goTo('home');
            return;
        }
        
        calcTitle.textContent = cfg.title;
        
        // 설명 및 주의사항 박스 채우기
        if (calcInfoBox) {
            calcInfoBox.innerHTML = '<h4>' + cfg.descTitle + '</h4>' +
                                    '<p>' + cfg.description + '</p>' +
                                    '<div style="margin-top: 10px; padding-top: 10px; border-top: 1px dashed var(--border);">' +
                                    '<p><span class="example-tag">예시</span> ' + cfg.example + '</p>' +
                                    '<p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 5px;">⚠️ ' + (cfg.disclaimer || '본 결과는 2026년 예상 세법 및 일반적인 금융 기준을 적용한 시뮬레이션입니다.') + '</p>' +
                                    '</div>';
        }

        var html = '';
        cfg.inputs.forEach(function(i) {
            html += '<div class="input-group"><label>' + i.label + '</label>';
            html += '<input type="number" id="' + i.id + '" value="' + i.value + '"></div>';
        });
        calcInputs.innerHTML = html + '<button class="calc-btn" id="run">계산하기</button>';

        document.getElementById('run').addEventListener('click', function() {
            var vals = {};
            cfg.inputs.forEach(function(i) {
                vals[i.id] = parseFloat(document.getElementById(i.id).value) || 0;
            });
            
            try {
                var out = cfg.run(vals);
                var resHtml = '';
                out.items.forEach(function(item) {
                    resHtml += '<div class="result-item"><span class="result-label">' + item.label + '</span>';
                    resHtml += '<span class="result-value">' + item.val + '</span></div>';
                });
                calcResults.innerHTML = resHtml;
                if (out.chart) draw(out.chart);
            } catch (err) {
                console.error(err);
                calcResults.innerHTML = '<p style="color:red">계산 중 에러가 발생했습니다.</p>';
            }
        });

        document.getElementById('run').click();
    }

    function draw(c) {
        if (chartWrapper) chartWrapper.style.display = 'flex';
        var ctx = document.getElementById('calc-chart').getContext('2d');
        if (currentChart) currentChart.destroy();
        var isDark = document.body.getAttribute('data-theme') === 'dark';
        
        currentChart = new Chart(ctx, {
            type: c.type,
            data: {
                labels: c.labels,
                datasets: [{
                    label: '금액(원)',
                    data: c.data,
                    backgroundColor: [
                        '#2563eb', // Accent Blue
                        '#0f172a', // Primary Dark
                        '#10b981', // Success Green
                        '#f59e0b', // Warning Orange
                        '#6366f1'  // Indigo
                    ],
                    borderColor: isDark ? '#0f172a' : '#ffffff',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: { duration: 800, easing: 'easeOutQuart' },
                plugins: { 
                    legend: { 
                        position: 'bottom',
                        labels: { 
                            color: isDark ? '#f1f5f9' : '#1e293b', 
                            padding: 20,
                            font: { size: 12, family: 'Pretendard' }
                        } 
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return ' ' + context.label + ': ' + won(context.parsed.y || context.parsed);
                            }
                        }
                    }
                },
                scales: c.type === 'bar' ? {
                    y: {
                        ticks: { color: isDark ? '#94a3b8' : '#64748b' },
                        grid: { color: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }
                    },
                    x: {
                        ticks: { color: isDark ? '#94a3b8' : '#64748b' },
                        grid: { display: false }
                    }
                } : {}
            }
        });
    }

    var book = {
        'salary': {
            title: '근로소득 실수령액 계산기 (2026)',
            descTitle: '2026년 기준 4대보험/소득세 반영',
            description: '2026년 예상 요율(국민연금 상한액 인상, 건강보험료율 반영)과 소득세 과세표준 구간을 적용하여 월 실수령액을 정밀하게 계산합니다.',
            example: '연봉 5,000만원, 비과세 식대 월 20만원',
            disclaimer: '부양가족 수 1인(본인) 기준이며, 실제 원천징수액은 기업별 공제 내역에 따라 다를 수 있습니다.',
            inputs: [
                { id: 's1', label: '연봉 (원)', value: 50000000 },
                { id: 's2', label: '비과세액 (월)', value: 200000 }
            ],
            run: function(d) {
                var month = d.s1 / 12;
                var tax_target_month = Math.max(0, month - d.s2);
                
                // 2026 예상 요율
                // 국민연금: 4.5% (상한액 월 617만원 가정 -> 최대 약 277,650원)
                var pension = Math.min(tax_target_month, 6170000) * 0.045;
                
                // 건강보험: 3.545% (요율 인상 반영 가정)
                // 장기요양: 건강보험료의 12.95%
                var health = tax_target_month * 0.03545;
                var care = health * 0.1295;
                var totalHealth = health + care;
                
                // 고용보험: 0.9%
                var employment = tax_target_month * 0.009;
                
                // 소득세 (간이세액표 대신 누진세율 약식 적용)
                // 연간 소득공제 대략 1500만 가정 (본인공제+근로소득공제 등 표준)
                var annual_tax_base = (tax_target_month * 12) - 15000000; 
                var annual_tax = annual_tax_base > 0 ? calcProgressiveTax(annual_tax_base) : 0;
                var incomeTax = annual_tax / 12;
                var localTax = incomeTax * 0.1;

                var totalDeduct = pension + totalHealth + employment + incomeTax + localTax;
                var net = month - totalDeduct;

                return {
                    items: [
                        { label: '월 세전 급여', val: won(month) },
                        { label: '4대보험 합계', val: won(pension + totalHealth + employment) },
                        { label: '소득세(지방세포함)', val: won(incomeTax + localTax) },
                        { label: '월 실수령액', val: won(net) }
                    ],
                    chart: {
                        type: 'pie',
                        labels: ['실수령액', '국민연금', '건강/요양', '고용보험', '세금'],
                        data: [net, pension, totalHealth, employment, incomeTax + localTax]
                    }
                };
            }
        },
        'loan': {
            title: '대출 이자 계산기 (DSR 미고려)',
            descTitle: '월 상환액 및 총 이자 비용',
            description: '원리금 균등 상환 방식을 기준으로 계산합니다. (거치 기간 없음)',
            example: '3억 대출, 금리 4.5%, 30년(360개월)',
            inputs: [
                { id: 'l1', label: '대출금 (원)', value: 300000000 },
                { id: 'l2', label: '금리 (%)', value: 4.5 },
                { id: 'l3', label: '기간 (개월)', value: 360 }
            ],
            run: function(d) {
                // 원리금 균등
                var r = (d.l2 / 100) / 12;
                var n = d.l3;
                var monthlyPayment = 0;
                if (r === 0) monthlyPayment = d.l1 / n;
                else monthlyPayment = d.l1 * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
                
                var totalPayment = monthlyPayment * n;
                var totalInterest = totalPayment - d.l1;

                return {
                    items: [
                        { label: '월 상환금', val: won(monthlyPayment) },
                        { label: '총 이자 비용', val: won(totalInterest) },
                        { label: '총 상환액', val: won(totalPayment) }
                    ],
                    chart: { type: 'doughnut', labels: ['원금', '총 이자'], data: [d.l1, totalInterest] }
                };
            }
        },
        'tax-settlement': {
            title: '연말정산 예상 (약식)',
            descTitle: '결정세액 vs 기납부세액',
            description: '총급여에 따른 근로소득공제와 인적공제(본인 150만) 및 표준세액공제(13만)만을 적용한 약식 계산입니다.',
            example: '총급여 5,500만원, 기납부 300만원',
            inputs: [
                { id: 't1', label: '총급여 (원)', value: 55000000 },
                { id: 't2', label: '기납부세액 (원)', value: 3000000 }
            ],
            run: function(d) {
                // 근로소득공제 (2025 기준 근사치)
                var deduction = 0;
                if (d.t1 <= 5000000) deduction = d.t1 * 0.7;
                else if (d.t1 <= 15000000) deduction = 3500000 + (d.t1 - 5000000) * 0.4;
                else if (d.t1 <= 45000000) deduction = 7500000 + (d.t1 - 15000000) * 0.15;
                else if (d.t1 <= 100000000) deduction = 12000000 + (d.t1 - 45000000) * 0.05;
                else deduction = 14750000 + (d.t1 - 100000000) * 0.02;
                
                var incomeBase = d.t1 - deduction - 1500000; // 본인공제 150만 차감
                if (incomeBase < 0) incomeBase = 0;

                var calculatedTax = calcProgressiveTax(incomeBase);
                var finalTax = Math.max(0, calculatedTax - 130000); // 표준세액공제 13만

                var diff = d.t2 - finalTax;
                
                return {
                    items: [
                        { label: '예상 결정세액', val: won(finalTax) },
                        { label: '기납부세액', val: won(d.t2) },
                        { label: diff >= 0 ? '환급 가능액' : '추가 납부액', val: won(Math.abs(diff)) }
                    ],
                    chart: { type: 'bar', labels: ['결정세액', '기납부'], data: [finalTax, d.t2] }
                };
            }
        },
        'rent-compare': {
            title: '전세 vs 월세 비교',
            descTitle: '주거 비용 효율 분석',
            description: '전세자금 대출 이자와 월세+보증금 기회비용(예금금리 3.5% 가정)을 비교합니다.',
            example: '전세 3억(4%), 월세 3000/100',
            inputs: [
                { id: 'r1', label: '전세 보증금 (원)', value: 300000000 },
                { id: 'r2', label: '전세 대출 금리 (%)', value: 4.0 },
                { id: 'r3', label: '월세 보증금 (원)', value: 30000000 },
                { id: 'r4', label: '월세액 (원)', value: 1000000 }
            ],
            run: function(d) {
                var jeonseCost = (d.r1 * (d.r2/100)) / 12;
                // 월세 비용 = 월세 + 보증금의 기회비용(연 3.5% 예금 기준)
                var rentCost = d.r4 + ((d.r3 * 0.035) / 12);
                return {
                    items: [
                        { label: '전세 월 환산 비용', val: won(jeonseCost) },
                        { label: '월세 월 총 비용', val: won(rentCost) },
                        { label: '월 절약액', val: won(Math.abs(jeonseCost - rentCost)) }
                    ],
                    chart: { type: 'bar', labels: ['전세 비용', '월세 비용'], data: [jeonseCost, rentCost] }
                };
            }
        },
        'capital-gain': {
            title: '양도소득세 계산기 (2026)',
            descTitle: '양도세 및 장기보유혜택',
            description: '2026년 과세표준 구간과 장기보유특별공제(일반 부동산 기준, 연 2% 최대 30%)를 적용합니다. 1세대 1주택 비과세 요건은 고려하지 않았습니다.',
            example: '8억 매도, 5억 매수, 5년 보유',
            inputs: [
                { id: 'c1', label: '양도가액 (원)', value: 800000000 },
                { id: 'c2', label: '취득가액 (원)', value: 500000000 },
                { id: 'c3', label: '필요경비 (원)', value: 20000000 },
                { id: 'c4', label: '보유 기간 (년)', value: 5 }
            ],
            run: function(d) {
                var gain = d.c1 - d.c2 - d.c3;
                
                // 장기보유특별공제 (일반: 3년 이상부터 연 2%, 최대 15년 30%)
                var longTermRate = 0;
                if (d.c4 >= 3) {
                    longTermRate = Math.min(0.3, d.c4 * 0.02);
                }
                var longTermDeduction = gain * longTermRate;
                
                var taxBase = Math.max(0, gain - longTermDeduction - 2500000); // 기본공제 250만
                
                var tax = calcProgressiveTax(taxBase);
                var localTax = tax * 0.1;

                return {
                    items: [
                        { label: '양도차익', val: won(gain) },
                        { label: '장기보유공제', val: won(longTermDeduction) },
                        { label: '총 납부세액', val: won(tax + localTax) }
                    ],
                    chart: { type: 'pie', labels: ['실수익', '세금', '취득/경비'], data: [Math.max(0, gain - (tax+localTax)), tax+localTax, d.c2 + d.c3] }
                };
            }
        },
        'auto-insurance': {
            title: '자동차 보험료 시뮬레이션',
            descTitle: '연령별 예상 보험료',
            description: '차량가액과 연령 요율을 기반으로 산출된 단순 견적입니다. 다이렉트 가입 시 약 15% 저렴할 수 있습니다.',
            example: '차량가액 3,500만원, 만 30세',
            inputs: [
                { id: 'a1', label: '차량가액 (원)', value: 35000000 },
                { id: 'a2', label: '운전자 연령 (세)', value: 30 }
            ],
            run: function(d) {
                var base = d.a1 * 0.035; // 기본 요율 약 3.5%
                var ageFactor = d.a2 < 24 ? 1.8 : (d.a2 < 26 ? 1.5 : (d.a2 < 30 ? 1.2 : 1.0));
                var premium = base * ageFactor;
                return {
                    items: [
                        { label: '추정 연간 보험료', val: won(premium) },
                        { label: '월 환산액', val: won(premium / 12) }
                    ],
                    chart: { type: 'bar', labels: ['기본가', '최종 보험료'], data: [base, premium] }
                };
            }
        },
        'pension': {
            title: '연금보험 수익률 계산기',
            descTitle: '복리 수익 및 세후 수령액',
            description: '일반 과세(15.4%)를 가정하여 계산합니다. 10년 이상 유지 시 비과세 요건을 충족하면 세금이 0원이 될 수 있습니다.',
            example: '월 100만원, 10년 납입, 연 4% 복리',
            inputs: [
                { id: 'p1', label: '월 납입액 (원)', value: 1000000 },
                { id: 'p2', label: '납입 기간 (년)', value: 10 },
                { id: 'p3', label: '연 수익률 (%)', value: 4.0 }
            ],
            run: function(d) {
                var months = d.p2 * 12;
                var r = (d.p3 / 100) / 12;
                var totalPrincipal = d.p1 * months;
                
                // 월복리 적금 공식
                var futureValue = d.p1 * ((Math.pow(1 + r, months) - 1) / r) * (1 + r);
                var interest = futureValue - totalPrincipal;
                
                // 이자소득세 15.4%
                var tax = interest * 0.154;
                var afterTax = futureValue - tax;

                return {
                    items: [
                        { label: '납입 원금', val: won(totalPrincipal) },
                        { label: '세전 이자', val: won(interest) },
                        { label: '세후 수령액', val: won(afterTax) }
                    ],
                    chart: { type: 'doughnut', labels: ['원금', '세후 이자', '세금'], data: [totalPrincipal, interest - tax, tax] }
                };
            }
        },
        'real-estate': {
            title: '부동산 투자 수익률 (ROI)',
            descTitle: '취득세 포함 수익률 분석',
            description: '매입 시 취득세(4.6% 오피스텔/상가 기준 가정)를 포함한 총 투자비용 대비 순수익률을 계산합니다.',
            example: '매가 5억, 보증금 5천, 월세 200, 대출 2.5억(4.5%)',
            inputs: [
                { id: 're1', label: '매입가 (원)', value: 500000000 },
                { id: 're2', label: '보증금 (원)', value: 50000000 },
                { id: 're3', label: '월세 (원)', value: 2000000 },
                { id: 're4', label: '대출금 (원)', value: 250000000 },
                { id: 're5', label: '대출금리 (%)', value: 4.5 }
            ],
            run: function(d) {
                var acquisitionTax = d.re1 * 0.046; // 취득세 등 4.6% 가정
                var totalCost = d.re1 + acquisitionTax;
                var realInvestment = totalCost - d.re2 - d.re4;
                
                var annualRent = d.re3 * 12;
                var annualInterest = d.re4 * (d.re5 / 100);
                var netIncome = annualRent - annualInterest;
                
                var roi = realInvestment > 0 ? (netIncome / realInvestment) * 100 : 0;
                
                return {
                    items: [
                        { label: '실투자금(세금포함)', val: won(realInvestment) },
                        { label: '연 순수익', val: won(netIncome) },
                        { label: '수익률 (ROI)', val: roi.toFixed(2) + '%' }
                    ],
                    chart: { type: 'bar', labels: ['임대수입', '이자지출', '순수익'], data: [annualRent, annualInterest, Math.max(0, netIncome)] }
                };
            }
        },
        'property-tax': {
            title: '보유세 계산기 (2026)',
            descTitle: '재산세 및 종부세 추정',
            description: '공정시장가액비율(재산세 60%, 종부세 80% 가정) 및 1세대 1주택 종부세 공제(12억)를 적용합니다.',
            example: '공시지가 15억 (1주택 가정)',
            inputs: [
                { id: 'pt1', label: '공시지가 (원)', value: 1500000000 }
            ],
            run: function(d) {
                // 재산세: 과세표준 = 공시지가 * 60%
                var pTaxBase = d.pt1 * 0.6;
                var pTax = 0;
                // 재산세 누진세율 약식 적용
                if (pTaxBase <= 60000000) pTax = pTaxBase * 0.001;
                else if (pTaxBase <= 150000000) pTax = 60000 + (pTaxBase - 60000000) * 0.0015;
                else pTax = 195000 + (pTaxBase - 150000000) * 0.0025;
                // 도시지역분 등 추가 고려하여 1.4배 보정
                pTax *= 1.4;

                // 종부세: (공시지가 - 12억) * 80% * 세율
                var mbnBase = Math.max(0, d.pt1 - 1200000000) * 0.8;
                var mbnTax = 0;
                // 종부세 단순 세율 0.5% ~ 2.7% 구간 약식 (0.7% 평균 적용)
                if (mbnBase > 0) mbnTax = mbnBase * 0.007;

                return {
                    items: [
                        { label: '예상 재산세', val: won(pTax) },
                        { label: '예상 종부세', val: won(mbnTax) },
                        { label: '총 보유세', val: won(pTax + mbnTax) }
                    ],
                    chart: { type: 'pie', labels: ['재산세', '종합부동산세'], data: [pTax, mbnTax] }
                };
            }
        },
        'rate-analysis': {
            title: '금리 변동 리스크 분석',
            descTitle: '금리 인상 시 상환 부담',
            description: '금리가 오르거나 내릴 때 월 원리금 상환액이 얼마나 달라지는지 확인하여 가계 재정 리스크를 점검하세요.',
            example: '4억 대출, 4.0% -> 6.0% 인상 시',
            inputs: [
                { id: 'ra1', label: '대출 원금 (원)', value: 400000000 },
                { id: 'ra2', label: '현재 금리 (%)', value: 4.0 },
                { id: 'ra3', label: '변동 금리 (%)', value: 6.0 },
                { id: 'ra4', label: '대출 기간 (년)', value: 30 }
            ],
            run: function(d) {
                var calcMonthly = function(principal, rate, years) {
                    if (rate === 0) return principal / (years * 12);
                    var r = (rate / 100) / 12;
                    var n = years * 12;
                    return principal * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
                };
                var currentMonthly = calcMonthly(d.ra1, d.ra2, d.ra4);
                var changedMonthly = calcMonthly(d.ra1, d.ra3, d.ra4);
                return {
                    items: [
                        { label: '현재 월 상환액', val: won(currentMonthly) },
                        { label: '변동 후 상환액', val: won(changedMonthly) },
                        { label: '월 부담 증가액', val: won(Math.abs(changedMonthly - currentMonthly)) }
                    ],
                    chart: { type: 'bar', labels: ['현재', '금리 변동 후'], data: [currentMonthly, changedMonthly] }
                };
            }
        }
    };
});

document.addEventListener('DOMContentLoaded', function() {
    var themeBtn = document.getElementById('theme-btn');
    var homeView = document.getElementById('home-view');
    var calcView = document.getElementById('calc-view');
    var calcTitle = document.getElementById('calc-title');
    var calcInputs = document.getElementById('calc-inputs');
    var calcResults = document.getElementById('calc-results');
    var chartWrapper = document.querySelector('.chart-wrapper');
    var backBtn = document.querySelector('.back-btn');
    var navLinks = document.querySelectorAll('.nav-links a, .dropdown-menu a, .calc-card');
    
    var currentChart = null;

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

        // 초기 계산 실행
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
                    data: c.data,
                    backgroundColor: ['#2563eb', '#10b981', '#fbbf24', '#f87171', '#6366f1']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { 
                    legend: { 
                        position: 'bottom',
                        labels: { color: isDark ? '#f1f5f9' : '#1e293b', padding: 20 } 
                    } 
                }
            }
        });
    }

    var book = {
        'salary': {
            title: '근로소득 실수령액 계산기',
            inputs: [
                { id: 's1', label: '연봉 (원)', value: 40000000 },
                { id: 's2', label: '비과세액 (월)', value: 200000 }
            ],
            run: function(d) {
                var month = d.s1 / 12;
                var tax_target = Math.max(0, month - d.s2);
                var p = tax_target * 0.045; // 국민연금
                var h = tax_target * 0.035; // 건강보험
                var e = tax_target * 0.009; // 고용보험
                var t = tax_target * 0.04;  // 소득세 (간이)
                var net = month - (p + h + e + t);
                return {
                    items: [
                        { label: '월 세전 급여', val: won(month) },
                        { label: '공제합계', val: won(p + h + e + t) },
                        { label: '월 실수령액', val: won(net) }
                    ],
                    chart: {
                        type: 'pie',
                        labels: ['실수령액', '연금', '건보', '고용', '소득세'],
                        data: [net, p, h, e, t]
                    }
                };
            }
        },
        'loan': {
            title: '대출 이자 계산기',
            inputs: [
                { id: 'l1', label: '대출금 (원)', value: 100000000 },
                { id: 'l2', label: '금리 (%)', value: 4.5 },
                { id: 'l3', label: '기간 (개월)', value: 24 }
            ],
            run: function(d) {
                var interest = d.l1 * (d.l2/100) * (d.l3/12);
                return {
                    items: [
                        { label: '원금', val: won(d.l1) },
                        { label: '총 이자', val: won(interest) },
                        { label: '총 상환액', val: won(d.l1 + interest) }
                    ],
                    chart: { type: 'doughnut', labels: ['원금', '이자'], data: [d.l1, interest] }
                };
            }
        },
        'tax-settlement': {
            title: '연말정산 계산기',
            inputs: [
                { id: 't1', label: '총급여 (원)', value: 50000000 },
                { id: 't2', label: '기납부세액 (원)', value: 3000000 }
            ],
            run: function(d) {
                var dec = d.t1 * 0.05;
                var diff = d.t2 - dec;
                return {
                    items: [
                        { label: '예상 결정세액', val: won(dec) },
                        { label: '기납부세액', val: won(d.t2) },
                        { label: diff >= 0 ? '예상 환급액' : '추가 납부액', val: won(Math.abs(diff)) }
                    ],
                    chart: { type: 'bar', labels: ['결정세액', '기납부세액'], data: [dec, d.t2] }
                };
            }
        },
        'rent-compare': {
            title: '전세 vs 월세 비용 비교',
            inputs: [
                { id: 'r1', label: '전세 보증금 (원)', value: 200000000 },
                { id: 'r2', label: '전세 대출 금리 (%)', value: 4.0 },
                { id: 'r3', label: '월세 보증금 (원)', value: 20000000 },
                { id: 'r4', label: '월세액 (원)', value: 800000 }
            ],
            run: function(d) {
                var jeonseCost = (d.r1 * (d.r2/100)) / 12;
                var rentCost = d.r4 + ((d.r3 * 0.04) / 12);
                return {
                    items: [
                        { label: '전세 월 환산 비용', val: won(jeonseCost) },
                        { label: '월세 월 총 비용', val: won(rentCost) },
                        { label: '비용 차이', val: won(Math.abs(jeonseCost - rentCost)) }
                    ],
                    chart: { type: 'bar', labels: ['전세', '월세'], data: [jeonseCost, rentCost] }
                };
            }
        },
        'capital-gain': {
            title: '양도소득세 계산기',
            inputs: [
                { id: 'c1', label: '양도가액 (원)', value: 800000000 },
                { id: 'c2', label: '취득가액 (원)', value: 500000000 },
                { id: 'c3', label: '필요경비 (원)', value: 20000000 }
            ],
            run: function(d) {
                var gain = d.c1 - d.c2 - d.c3;
                var taxBase = Math.max(0, gain - 2500000);
                var rate = 0.24;
                if (taxBase > 150000000) rate = 0.35;
                if (taxBase > 300000000) rate = 0.38;
                var tax = taxBase * rate;
                return {
                    items: [
                        { label: '양도차익', val: won(gain) },
                        { label: '과세표준', val: won(taxBase) },
                        { label: '산출세액 (지방세 제외)', val: won(tax) }
                    ],
                    chart: { type: 'pie', labels: ['순이익', '세금', '경비/원금'], data: [Math.max(0, gain - tax), tax, d.c2 + d.c3] }
                };
            }
        },
        'auto-insurance': {
            title: '자동차 보험료 시뮬레이션',
            inputs: [
                { id: 'a1', label: '차량가액 (원)', value: 30000000 },
                { id: 'a2', label: '운전자 연령 (세)', value: 35 }
            ],
            run: function(d) {
                var base = d.a1 * 0.03;
                var ageFactor = d.a2 < 26 ? 1.5 : (d.a2 < 30 ? 1.2 : 1.0);
                var premium = base * ageFactor;
                return {
                    items: [
                        { label: '추정 연간 보험료', val: won(premium) },
                        { label: '월 환산 보험료', val: won(premium / 12) }
                    ],
                    chart: { type: 'bar', labels: ['기본', '할증반영'], data: [base, premium] }
                };
            }
        },
        'pension': {
            title: '연금보험 수익률 계산기',
            inputs: [
                { id: 'p1', label: '월 납입액 (원)', value: 500000 },
                { id: 'p2', label: '납입 기간 (년)', value: 10 },
                { id: 'p3', label: '연 수익률 (%)', value: 3.5 }
            ],
            run: function(d) {
                var months = d.p2 * 12;
                var r = (d.p3 / 100) / 12;
                var totalPrincipal = d.p1 * months;
                var futureValue = totalPrincipal;
                if (r > 0) {
                    futureValue = d.p1 * ((Math.pow(1 + r, months) - 1) / r) * (1 + r);
                }
                return {
                    items: [
                        { label: '총 납입 원금', val: won(totalPrincipal) },
                        { label: '만기 예상 금액', val: won(futureValue) },
                        { label: '예상 수익', val: won(futureValue - totalPrincipal) }
                    ],
                    chart: { type: 'doughnut', labels: ['원금', '수익'], data: [totalPrincipal, Math.max(0, futureValue - totalPrincipal)] }
                };
            }
        },
        'real-estate': {
            title: '부동산 투자 수익률',
            inputs: [
                { id: 're1', label: '매입가 (원)', value: 500000000 },
                { id: 're2', label: '보증금 (원)', value: 50000000 },
                { id: 're3', label: '월세 (원)', value: 1500000 },
                { id: 're4', label: '대출금 (원)', value: 200000000 },
                { id: 're5', label: '대출금리 (%)', value: 4.5 }
            ],
            run: function(d) {
                var annualRent = d.re3 * 12;
                var annualInterest = d.re4 * (d.re5 / 100);
                var netIncome = annualRent - annualInterest;
                var investment = d.re1 - d.re2 - d.re4;
                var roi = investment > 0 ? (netIncome / investment) * 100 : 0;
                return {
                    items: [
                        { label: '실제 투자금', val: won(investment) },
                        { label: '연 순수익', val: won(netIncome) },
                        { label: '수익률 (ROI)', val: roi.toFixed(2) + '%' }
                    ],
                    chart: { type: 'bar', labels: ['임대수입', '이자비용', '순수익'], data: [annualRent, annualInterest, Math.max(0, netIncome)] }
                };
            }
        },
        'property-tax': {
            title: '재산세/종부세 계산기',
            inputs: [
                { id: 'pt1', label: '공시지가 (원)', value: 900000000 }
            ],
            run: function(d) {
                var propertyTax = d.pt1 * 0.002;
                var mbnTax = d.pt1 > 1200000000 ? (d.pt1 - 1200000000) * 0.01 : 0;
                return {
                    items: [
                        { label: '예상 재산세', val: won(propertyTax) },
                        { label: '예상 종부세', val: won(mbnTax) },
                        { label: '총 보유세', val: won(propertyTax + mbnTax) }
                    ],
                    chart: { type: 'pie', labels: ['재산세', '종부세'], data: [propertyTax, mbnTax] }
                };
            }
        },
        'rate-analysis': {
            title: '금리 변동 분석',
            inputs: [
                { id: 'ra1', label: '대출 원금 (원)', value: 300000000 },
                { id: 'ra2', label: '현재 금리 (%)', value: 4.0 },
                { id: 'ra3', label: '변동 금리 (%)', value: 5.5 },
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
                        { label: '변동 후 월 상환액', val: won(changedMonthly) },
                        { label: '상환액 차이', val: won(changedMonthly - currentMonthly) }
                    ],
                    chart: { type: 'bar', labels: ['현재', '변동 후'], data: [currentMonthly, changedMonthly] }
                };
            }
        }
    };
});

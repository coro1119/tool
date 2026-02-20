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

    function clearAll() {
        if (currentChart) { currentChart.destroy(); currentChart = null; }
        calcInputs.innerHTML = '';
        calcResults.innerHTML = '';
        if (chartWrapper) chartWrapper.style.display = 'none';
    }

    function goTo(viewName) {
        clearAll();
        if (viewName === 'home') {
            homeView.classList.add('active');
            calcView.classList.remove('active');
        } else {
            homeView.classList.remove('active');
            calcView.classList.add('active');
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
        return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(Math.round(v)); 
    };

    function startUI(id) {
        var cfg = book[id];
        if (!cfg) return;
        
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
                plugins: { legend: { labels: { color: isDark ? '#f1f5f9' : '#1e293b' } } }
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
                var tax_target = month - d.s2; // taxable 단어 사용 안함
                var p = tax_target * 0.045;
                var h = tax_target * 0.035;
                var e = tax_target * 0.009;
                var t = tax_target * 0.04;
                var net = month - (p + h + e + t);
                return {
                    items: [
                        { label: '월 세전 급여', val: won(month) },
                        { label: '공제계', val: won(p + h + e + t) },
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
            title: '대출 계산기',
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
                        { label: '이자', val: won(interest) },
                        { label: '합계', val: won(d.l1 + interest) }
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
                        { label: '결정세액', val: won(dec) },
                        { label: '기납부세액', val: won(d.t2) },
                        { label: diff >= 0 ? '환급액' : '납부액', val: won(Math.abs(diff)) }
                    ],
                    chart: { type: 'bar', labels: ['결정', '기납부'], data: [dec, d.t2] }
                };
            }
        }
    };
});

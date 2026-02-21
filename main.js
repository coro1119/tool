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
    var baseTitle = "금융 계산기 마스터";

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
            document.title = "2026 연봉 실수령액 & 금융 계산기 마스터 | FinanceCalculator";
            if (window.location.hash) {
                history.pushState("", document.title, window.location.pathname + window.location.search);
            }
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
                window.location.hash = cid;
            } else if (link.getAttribute('data-page') === 'home') {
                e.preventDefault();
                goTo('home');
            }
        });
    });

    // 해시 변경 감지 라우팅
    window.addEventListener('hashchange', function() {
        var hash = window.location.hash.substring(1);
        if (hash && book[hash]) {
            goTo('calc');
            startUI(hash);
        } else {
            goTo('home');
        }
    });

    // 초기 로드 처리
    var initialHash = window.location.hash.substring(1);
    if (initialHash && book[initialHash]) {
        goTo('calc');
        startUI(initialHash);
    }

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
        document.title = cfg.title + " - " + baseTitle;
        
        // 설명 및 주의사항 박스 채우기 (공식 링크 추가)
        if (calcInfoBox) {
            var refHtml = cfg.refLink ? 
                '<p style="margin-top: 10px; font-size: 0.85rem;"><span class="example-tag" style="background: #e2e8f0; color: #475569;">공식 근거</span> ' +
                '<a href="' + cfg.refLink + '" target="_blank" style="color: var(--accent); text-decoration: underline;">' + cfg.refName + ' 바로가기 ↗</a></p>' : '';

            calcInfoBox.innerHTML = '<h4>' + cfg.descTitle + '</h4>' +
                                    '<p>' + cfg.description + '</p>' +
                                    refHtml +
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
        'crypto-fomo': {
            title: '비트코인 타임머신 ("그때 샀더라면")',
            descTitle: '과거의 나를 반성하는 시간',
            description: '5년 전 오늘 비트코인을 샀다면 지금 자산이 어떻게 변했을지 시뮬레이션합니다. (현실 부정 금지)',
            refName: '업비트 (비트코인 시세)',
            refLink: 'https://upbit.com/exchange?code=CRIX.UPBIT.KRW-BTC',
            example: '5년 전 1,000만원 투자 시',
            inputs: [{ id: 'f1', label: '투자금액 (원)', value: 10000000 }],
            run: function(d) {
                // 5년 전(2021.02) 약 5,500만원 -> 2026.02 약 1억 5,000만원 가정 (성장률 270%)
                var growth = 2.72; 
                var current = d.f1 * growth;
                var diff = current - d.f1;
                return {
                    items: [
                        { label: '투자 원금', val: won(d.f1) },
                        { label: '현재 가치 (추정)', val: won(current) },
                        { label: '수익금', val: '<span style="color:#ef4444">+' + won(diff) + '</span>' },
                        { label: '수익률', val: '<span style="color:#ef4444">272%</span>' }
                    ],
                    chart: { type: 'bar', labels: ['원금', '현재가치'], data: [d.f1, current] }
                };
            }
        },
        'coffee-tesla': {
            title: '커피값 vs 테슬라(TSLA)',
            descTitle: '스벅 아아 한 잔의 기회비용',
            description: '매일 마시는 커피값(4,500원)을 아껴서 테슬라 주식을 샀다면? 5년간의 꾸준한 적립식 투자를 가정합니다.',
            refName: '야후 파이낸스 (TSLA)',
            refLink: 'https://finance.yahoo.com/quote/TSLA',
            example: '매일 4,500원씩 5년 적립 시',
            inputs: [{ id: 't1', label: '일일 커피값 (원)', value: 4500 }],
            run: function(d) {
                var daily = d.t1;
                var totalCoffee = daily * 365 * 5;
                // 테슬라 5년 연평균 수익률 대략 25% 가정 (복리)
                var monthly = daily * 30;
                var rate = 0.25 / 12;
                var months = 60;
                var futureValue = monthly * ((Math.pow(1 + rate, months) - 1) / rate) * (1 + rate);
                
                return {
                    items: [
                        { label: '5년 총 커피값', val: won(totalCoffee) },
                        { label: '테슬라 주식 가치', val: won(futureValue) },
                        { label: '반전 수익금', val: '<span style="color:#2563eb">+' + won(futureValue - totalCoffee) + '</span>' }
                    ],
                    chart: { type: 'doughnut', labels: ['커피로 소비', '주식으로 이득'], data: [totalCoffee, futureValue - totalCoffee] }
                };
            }
        },
        'breath-apartment': {
            title: '숨참고 한강뷰 다이브',
            descTitle: '서울 아파트 내 집 마련 시뮬레이션',
            description: '내 연봉을 한 푼도 안 쓰고 숨만 쉬며 모았을 때, 한강뷰 아파트를 사기까지 며칠(또는 몇 년)이 걸리는지 계산합니다.',
            refName: 'KB부동산 (서울 주택 가격)',
            refLink: 'https://kbland.kr',
            example: '연봉 5,000만원, 아파트 25억 기준',
            inputs: [
                { id: 'b1', label: '세후 연봉 (원)', value: 50000000 },
                { id: 'b2', label: '목표 아파트가 (원)', value: 2500000000 }
            ],
            run: function(d) {
                var years = d.b2 / d.b1;
                var days = Math.floor(years * 365);
                return {
                    items: [
                        { label: '소요 기간', val: years.toFixed(1) + ' 년' },
                        { label: '숨 참아야 할 기간', val: days.toLocaleString() + ' 일' },
                        { label: '한 줄 평', val: days > 10000 ? '이번 생은 글렀습니다...' : '열심히 모으면 가능합니다!' }
                    ],
                    chart: { type: 'pie', labels: ['현재 연봉', '부족한 금액'], data: [d.b1, d.b2 - d.b1] }
                };
            }
        },
        'youtube-adsense': {
            title: '유튜브 애드센스 수익기',
            descTitle: '조회수당 예상 달러 수익',
            description: '조회수와 채널 카테고리(금융, 일상, 게임 등)에 따른 예상 광고 수익을 계산합니다. (한국 평균 CPM 기준)',
            refName: '유튜브 스튜디오 도움말',
            refLink: 'https://support.google.com/youtube/answer/72857',
            example: '조회수 100만 회, 금융 카테고리',
            inputs: [
                { id: 'y1', label: '월 평균 조회수', value: 1000000 },
                { id: 'y2', label: '조회수당 단가(원)', value: 3 }
            ],
            run: function(d) {
                var profit = d.y1 * d.y2;
                return {
                    items: [
                        { label: '예상 월 수익', val: won(profit) },
                        { label: '연 환산 수익', val: won(profit * 12) },
                        { label: '유튜버 등급', val: d.y1 > 1000000 ? '골드 버튼급' : (d.y1 > 100000 ? '실버 버튼급' : '꿈나무') }
                    ],
                    chart: { type: 'bar', labels: ['월 수익', '연 수익/10'], data: [profit, (profit * 12) / 10] }
                };
            }
        },
        'influencer-price': {
            title: '인플루언서 협찬 단가',
            descTitle: '인스타/틱톡 원고료 정산',
            description: '팔로워 수와 게시물당 반응률을 기반으로 한 시장 평균 협찬 단가를 추천합니다.',
            example: '팔로워 5만 명, 반응률 2%',
            inputs: [
                { id: 'i1', label: '팔로워 수', value: 50000 },
                { id: 'i2', label: '평균 반응률 (%)', value: 2.5 }
            ],
            run: function(d) {
                var base = d.i1 * 10; // 팔로워당 10원 기본
                var bonus = base * (d.i2 / 100) * 2;
                var total = base + bonus;
                return {
                    items: [
                        { label: '추천 원고료', val: won(total) },
                        { label: '게시물 가치', val: won(total * 1.5) },
                        { label: '협상 가이드', val: '반응률이 높아 상향 조정 가능' }
                    ],
                    chart: { type: 'doughnut', labels: ['기본단가', '반응률보너스'], data: [base, bonus] }
                };
            }
        },
        'ott-dutch': {
            title: 'OTT 파티원 정산기',
            descTitle: '넷플릭스/유튜브 프리미엄 1/N',
            description: '복잡한 OTT 구독료를 파티원끼리 매달 얼마씩 주고받아야 하는지 계산해 드립니다.',
            example: '유튜브 프리미엄 14,900원, 4명 정산',
            inputs: [
                { id: 'o1', label: '구독료 총액 (원)', value: 14900 },
                { id: 'o2', label: '파티원 수 (본인포함)', value: 4 }
            ],
            run: function(d) {
                var perPerson = Math.ceil(d.o1 / d.o2 / 10) * 10;
                return {
                    items: [
                        { label: '1인당 부담액', val: won(perPerson) },
                        { label: '총 정산금액', val: won(perPerson * d.o2) },
                        { label: '카톡 공지용', val: '매달 ' + perPerson.toLocaleString() + '원 입금 부탁드려요!' }
                    ],
                    chart: { type: 'pie', labels: ['내 부담', '파티원들'], data: [perPerson, d.o1 - perPerson] }
                };
            }
        },
        'part-time': {
            title: '알바 주휴수당 계산기',
            descTitle: '2026 최저임금 반영 실지급액',
            description: '주당 근무 시간과 시급을 입력하면 주휴수당을 포함한 실제 수령액을 계산합니다.',
            refName: '고용노동부 (주휴수당 안내)',
            refLink: 'https://www.moel.go.kr',
            example: '시급 10,030원, 주 20시간 근무',
            inputs: [
                { id: 'pt1', label: '시급 (원)', value: 10030 },
                { id: 'pt2', label: '주간 근무시간', value: 20 }
            ],
            run: function(d) {
                var base = d.pt1 * d.pt2;
                var holiday = d.pt2 >= 15 ? (d.pt2 / 40) * 8 * d.pt1 : 0;
                var monthly = (base + holiday) * 4.345;
                return {
                    items: [
                        { label: '주 기본급', val: won(base) },
                        { label: '주휴수당', val: won(holiday) },
                        { label: '월 예상 지급액', val: '<strong>' + won(monthly) + '</strong>' }
                    ],
                    chart: { type: 'bar', labels: ['기본급', '주휴수당'], data: [base, holiday] }
                };
            }
        },
        'travel-currency': {
            title: '유럽 축구 직관 물가 체감',
            descTitle: '유로/파운드 -> 국밥 환산기',
            description: '해외 여행지 물가를 한국인에게 가장 익숙한 단위인 "국밥"으로 환산해 드립니다.',
            example: '유럽 축구 티켓 150유로',
            inputs: [
                { id: 'tc1', label: '현지 금액', value: 150 },
                { id: 'tc2', label: '환율 (1유로당)', value: 1500 }
            ],
            run: function(d) {
                var totalWon = d.tc1 * d.tc2;
                var gukbap = Math.floor(totalWon / 10000);
                return {
                    items: [
                        { label: '한화 환산액', val: won(totalWon) },
                        { label: '국밥 환산', val: gukbap + ' 그릇' },
                        { label: '체감 물가', val: gukbap > 20 ? '심각하게 비쌈' : '적당한 사치' }
                    ],
                    chart: { type: 'bar', labels: ['여행 지출', '국밥 10그릇'], data: [totalWon, 100000] }
                };
            }
        },
        'salary': {
            title: '2026 연봉 실수령액 계산기',
            descTitle: '2026년 최신 요율 반영 상세 계산',
            description: '국민연금 상한액 인상 및 건강보험 요율을 반영한 2026년형 실수령액 계산기입니다. 비과세 식대, 부양가족 수, 자녀 세액공제를 포함하여 더욱 정확한 월급을 확인하세요.',
            refName: '국세청 홈택스 (간이세액표)',
            refLink: 'https://www.hometax.go.kr/websquare/websquare.html?w2xPath=/ui/pp/index.xml',
            example: '연봉 6,000만원, 비과세 20만원, 부양가족 3명(자녀 1명 포함)',
            disclaimer: '본 계산은 근로소득 간이세액표를 기반으로 한 추정치이며, 실제 수령액은 개별 공제 항목에 따라 차이가 있을 수 있습니다.',
            inputs: [
                { id: 's1', label: '연봉 (원)', value: 50000000 },
                { id: 's2', label: '비과세액 (월/식대 등)', value: 200000 },
                { id: 's3', label: '부양가족 수 (본인포함)', value: 1 },
                { id: 's4', label: '20세 이하 자녀 수', value: 0 }
            ],
            run: function(d) {
                var month = Math.floor(d.s1 / 12);
                var tax_target_month = Math.max(0, month - d.s2);
                
                // 2026 예상 요율
                // 국민연금: 4.5% (상한액 월 617만원 가정 -> 최대 약 277,650원)
                var pension = Math.floor(Math.min(tax_target_month, 6170000) * 0.045);
                
                // 건강보험: 3.545% (요율 인상 반영 가정)
                // 장기요양: 건강보험료의 12.95%
                var health = Math.floor(tax_target_month * 0.03545);
                var care = Math.floor(health * 0.1295);
                
                // 고용보험: 0.9%
                var employment = Math.floor(tax_target_month * 0.009);
                
                // 소득세 (간이세액표 로직 약식 구현)
                // 연간 소득공제 (본인공제 150만 + 부양가족 1인당 150만 + 자녀공제 등 반영)
                var family_deduction = (d.s3 * 1500000) + (d.s4 * 1500000); 
                // 근로소득공제 대략적 산출
                var annual_salary = d.s1;
                var income_deduction = 0;
                if (annual_salary <= 5000000) income_deduction = annual_salary * 0.7;
                else if (annual_salary <= 15000000) income_deduction = 3500000 + (annual_salary - 5000000) * 0.4;
                else if (annual_salary <= 45000000) income_deduction = 7500000 + (annual_salary - 15000000) * 0.15;
                else if (annual_salary <= 100000000) income_deduction = 12000000 + (annual_salary - 45000000) * 0.05;
                else income_deduction = 14750000 + (annual_salary - 100000000) * 0.02;

                var annual_tax_base = annual_salary - income_deduction - family_deduction;
                var annual_tax = annual_tax_base > 0 ? calcProgressiveTax(annual_tax_base) : 0;
                
                // 자녀 세액공제 (1명 15만, 2명 30만, 3명 60만 가정)
                var child_tax_credit = 0;
                if (d.s4 == 1) child_tax_credit = 150000;
                else if (d.s4 == 2) child_tax_credit = 300000;
                else if (d.s4 >= 3) child_tax_credit = 300000 + (d.s4 - 2) * 300000;
                
                var incomeTax = Math.floor(Math.max(0, (annual_tax - child_tax_credit)) / 12);
                var localTax = Math.floor(incomeTax * 0.1);

                var totalDeduct = pension + health + care + employment + incomeTax + localTax;
                var net = month - totalDeduct;

                return {
                    items: [
                        { label: '월 세전 급여', val: won(month) },
                        { label: '국민연금', val: won(pension) },
                        { label: '건강보험', val: won(health) },
                        { label: '장기요양', val: won(care) },
                        { label: '고용보험', val: won(employment) },
                        { label: '근로소득세', val: won(incomeTax) },
                        { label: '지방소득세', val: won(localTax) },
                        { label: '월 실수령액', val: '<strong>' + won(net) + '</strong>' }
                    ],
                    chart: {
                        type: 'pie',
                        labels: ['실수령액', '국민연금', '건강보험', '장기요양', '고용보험', '소득세(합계)'],
                        data: [net, pension, health, care, employment, incomeTax + localTax]
                    }
                };
            }
        },
        'loan': {
            title: '대출 이자 계산기 (DSR 미고려)',
            descTitle: '월 상환액 및 총 이자 비용',
            description: '원리금 균등 상환 방식을 기준으로 계산합니다. (거치 기간 없음)',
            refName: '금융감독원 (금융상품 한눈에)',
            refLink: 'https://finlife.fss.or.kr',
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
            refName: '국세청 (연말정산 안내)',
            refLink: 'https://www.hometax.go.kr',
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
            refName: '국토교통부 (마이홈 포털)',
            refLink: 'https://www.myhome.go.kr',
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
            refName: '국세청 (양도소득세 안내)',
            refLink: 'https://www.hometax.go.kr',
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
            refName: '보험다모아 (공식 비교사이트)',
            refLink: 'https://e-insmarket.or.kr',
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
            refName: '금융감독원 (통합연금포털)',
            refLink: 'https://100lifeplan.fss.or.kr',
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
            refName: '한국부동산원 (부동산 통계)',
            refLink: 'https://www.reb.or.kr',
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
            refName: '위택스 (행안부 지방세 포털)',
            refLink: 'https://www.wetax.go.kr',
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
            refName: '한국은행 (기준금리 정보)',
            refLink: 'https://www.bok.or.kr',
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

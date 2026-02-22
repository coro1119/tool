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

    // --- UI Logic: Search & Filtering ---
    var omnibar = document.getElementById('omnibar');
    var chips = document.querySelectorAll('.chip');
    var hotSection = document.getElementById('hot-section');
    var mainGridCards = document.querySelectorAll('#main-grid .calc-card');

    // 1. Chip Filtering
    chips.forEach(function(chip) {
        chip.addEventListener('click', function() {
            // Active State Toggle
            chips.forEach(c => c.classList.remove('active'));
            this.classList.add('active');

            var filter = this.getAttribute('data-filter');
            omnibar.value = ''; // Clear search when filtering

            if (filter === 'all') {
                if (hotSection) hotSection.style.display = 'block';
                mainGridCards.forEach(card => card.style.display = 'flex');
            } else {
                if (hotSection) hotSection.style.display = 'none';
                mainGridCards.forEach(card => {
                    if (card.dataset.category === filter) {
                        card.style.display = 'flex';
                    } else {
                        card.style.display = 'none';
                    }
                });
            }
        });
    });

    // 2. Omnibar Search
    if (omnibar) {
        omnibar.addEventListener('input', function(e) {
            var query = e.target.value.toLowerCase().trim();

            // Reset chips visual state
            chips.forEach(c => c.classList.remove('active'));
            
            if (query === '') {
                // Restore "All" state
                document.querySelector('.chip[data-filter="all"]').classList.add('active');
                if (hotSection) hotSection.style.display = 'block';
                mainGridCards.forEach(card => card.style.display = 'flex');
                return;
            }

            // Hide HOT section during search
            if (hotSection) hotSection.style.display = 'none';

            mainGridCards.forEach(card => {
                var title = card.querySelector('h3').textContent.toLowerCase();
                var keywords = card.dataset.keywords ? card.dataset.keywords.toLowerCase() : '';
                
                if (title.includes(query) || keywords.includes(query)) {
                    card.style.display = 'flex';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    }
    // ------------------------------------

    // URL 파라미터 파싱 (pSEO & Embed 지원)
    var urlParams = new URLSearchParams(window.location.search);
    var targetCalc = urlParams.get('calc');
    var isEmbed = urlParams.get('embed') === 'true';

    // Embed 모드 스타일 적용
    if (isEmbed) {
        document.body.classList.add('embed-mode');
    }

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
        // 임베드 공유 박스 제거
        var shareBox = document.querySelector('.embed-share-box');
        if (shareBox) shareBox.remove();
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

    // Event Delegation for Navigation & Calculators
    document.body.addEventListener('click', function(e) {
        // 1. Handle Calculator Cards & Links
        var calcTarget = e.target.closest('[data-calc]');
        if (calcTarget) {
            e.preventDefault();
            var cid = calcTarget.getAttribute('data-calc');
            if (cid && book[cid]) {
                goTo('calc');
                startUI(cid);
            } else {
                console.error('Calculator not found or ID mismatch:', cid);
            }
            return;
        }

        // 2. Handle Home Link
        var homeTarget = e.target.closest('[data-page="home"]');
        if (homeTarget) {
            e.preventDefault();
            goTo('home');
            return;
        }
    });

    // Remove old navLinks logic
    // var navLinks = document.querySelectorAll(...);

    // 뒤로가기 버튼 로직
    if (backBtn) backBtn.addEventListener('click', function() { 
        if (isEmbed) return; // 임베드 모드에서는 동작 안함
        goTo('home'); 
    });

    var won = function(v) { 
        if (isNaN(v)) return '0원';
        return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(Math.round(v)); 
    };

    function startUI(id, initialData) {
        var cfg = book[id];
        if (!cfg) {
            console.error('Calculator not found:', id);
            goTo('home');
            return;
        }
        
        calcTitle.textContent = cfg.title;
        // 기본 타이틀 설정
        document.title = cfg.title + " - " + baseTitle;
        
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
            // URL 파라미터가 있으면 우선 사용, 없으면 기본값
            var val = (initialData && initialData[i.id]) ? initialData[i.id] : i.value;
            
            html += '<div class="input-group"><label>' + i.label + '</label>';
            if (i.type === 'select') {
                html += '<select id="' + i.id + '">';
                i.options.forEach(function(opt) {
                    html += '<option value="' + opt.value + '"' + (opt.value == val ? ' selected' : '') + '>' + opt.label + '</option>';
                });
                html += '</select>';
            } else {
                html += '<input type="number" id="' + i.id + '" value="' + val + '">';
            }
            html += '</div>';
        });
        
        // 버튼 영역
        html += '<div style="display:flex; gap:10px; flex-wrap:wrap;">';
        html += '<button class="calc-btn" id="run" style="flex:2;">계산하기</button>';
        
        // 임베드 모드가 아닐 때만 공유 버튼 표시
        if (!isEmbed) {
            html += '<button class="calc-btn" id="share-btn" style="flex:1; background-color: var(--text-main); font-size: 0.95rem;">퍼가기</button>';
        }
        html += '</div>';

        calcInputs.innerHTML = html;

        // OTT 정산기 전용 실시간 가격 연동 로직
        if (id === 'ott-dutch') {
            var serviceSelect = document.getElementById('o1');
            var priceInput = document.getElementById('o3');
            var updatePrice = function() {
                var prices = {
                    'netflix': 17000,
                    'youtube': 14900,
                    'disney': 13900,
                    'tving': 17000,
                    'wavve': 13900,
                    'coupang': 7890,
                    'custom': 0
                };
                // 사용자 입력값이 custom이 아닐 때만 자동 업데이트
                if (serviceSelect.value !== 'custom') {
                    priceInput.value = prices[serviceSelect.value];
                }
            };
            serviceSelect.addEventListener('change', updatePrice);
            // 초기 데이터가 없을 때만 업데이트 (pSEO 값 유지 위해)
            if (!initialData) updatePrice(); 
        }

        // 계산 실행 핸들러
        document.getElementById('run').addEventListener('click', function() {
            var vals = {};
            var titleParts = []; // SEO 타이틀용
            cfg.inputs.forEach(function(i) {
                var el = document.getElementById(i.id);
                var v = parseFloat(el.value) || 0;
                vals[i.id] = v;
                
                // SEO: 주요 입력값을 타이틀에 반영 (첫 2개 정도)
                if (titleParts.length < 2 && v > 0) {
                    var displayVal = v;
                    if (v > 10000) displayVal = Math.round(v/10000) + '만원'; 
                    // select인 경우 라벨 텍스트 사용
                    if (i.type === 'select') {
                        var sel = document.getElementById(i.id);
                        displayVal = sel.options[sel.selectedIndex].text;
                    }
                    titleParts.push(i.label + ' ' + displayVal);
                }
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

                // pSEO: 동적 타이틀 업데이트 (결과가 나온 후)
                if (titleParts.length > 0) {
                    document.title = titleParts.join(', ') + " 결과 - " + cfg.title;
                }

            } catch (err) {
                console.error(err);
                calcResults.innerHTML = '<p style="color:red">계산 중 에러가 발생했습니다.</p>';
            }
        });

        // 퍼가기(Share) 버튼 핸들러
        var shareBtn = document.getElementById('share-btn');
        if (shareBtn) {
            shareBtn.addEventListener('click', function() {
                var currentParams = new URLSearchParams();
                currentParams.set('calc', id);
                currentParams.set('embed', 'true');
                
                cfg.inputs.forEach(function(i) {
                    var el = document.getElementById(i.id);
                    currentParams.set(i.id, el.value);
                });

                var fullUrl = window.location.origin + window.location.pathname + '?' + currentParams.toString();
                var iframeCode = '<iframe src="' + fullUrl + '" width="100%" height="600" frameborder="0" style="border-radius:12px; box-shadow:0 4px 12px rgba(0,0,0,0.1);"></iframe>';

                // 기존 박스 있으면 제거
                var oldBox = document.querySelector('.embed-share-box');
                if (oldBox) oldBox.remove();

                var shareDiv = document.createElement('div');
                shareDiv.className = 'embed-share-box';
                shareDiv.innerHTML = '<p>👇 아래 코드를 블로그나 카페에 복사해서 붙여넣으세요.</p>' +
                                     '<div class="embed-code-area">' +
                                     '<input type="text" readonly value=\'' + iframeCode + '\'>' +
                                     '<button class="copy-btn">복사</button>' +
                                     '</div>';
                
                document.querySelector('.calc-container').after(shareDiv);

                shareDiv.querySelector('.copy-btn').addEventListener('click', function() {
                    var input = shareDiv.querySelector('input');
                    input.select();
                    document.execCommand('copy'); // 구형 브라우저 호환
                    // navigator.clipboard.writeText(input.value); // 신형
                    this.textContent = '완료!';
                    setTimeout(() => { this.textContent = '복사'; }, 2000);
                });
            });
        }

        // 초기 데이터가 있거나 URL로 진입했을 경우 자동 실행
        if (initialData || targetCalc === id) {
            document.getElementById('run').click();
        }
    }

    // 초기 로드 시 라우팅 로직
    if (targetCalc && book[targetCalc]) {
        // 1. 쿼리 파라미터가 있는 경우 (pSEO)
        var initData = {};
        for (var pair of urlParams.entries()) {
            initData[pair[0]] = pair[1];
        }
        goTo('calc');
        startUI(targetCalc, initData);
    } else {
        // 2. 해시가 있는 경우 (기존 방식 호환)
        var hash = window.location.hash.substring(1);
        if (hash && book[hash]) {
            goTo('calc');
            startUI(hash);
        } else {
            // 기본 홈
            if (!isEmbed) goTo('home');
        }
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
                    backgroundColor: ['#2563eb', '#0f172a', '#10b981', '#f59e0b', '#6366f1', '#ef4444', '#8b5cf6', '#ec4899'],
                    borderColor: isDark ? '#0f172a' : '#ffffff',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { 
                    legend: { position: 'bottom', labels: { color: isDark ? '#f1f5f9' : '#1e293b' } },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return ' ' + context.label + ': ' + won(context.parsed.y || context.parsed);
                            }
                        }
                    }
                }
            }
        });
    }

    var book = {
        'coin-tax': {
            title: '2026 코인/가상자산 과세 시뮬레이터',
            descTitle: '내 코인 수익, 세금 떼면 얼마?',
            description: '2026년 시행 예정인 가상자산 과세(기본 공제 250만원, 세율 22%)를 적용해봅니다.',
            refName: '기획재정부 (가상자산 과세 유예안)',
            refLink: 'https://www.moef.go.kr',
            example: '수익 1억원 달성 시',
            inputs: [
                { id: 'c1', label: '가상자산 총 수익 (원)', value: 100000000 },
                { id: 'c2', label: '기본 공제액 (원)', value: 2500000 }
            ],
            run: function(d) {
                var profit = d.c1;
                var deduction = d.c2;
                var taxable = Math.max(0, profit - deduction);
                var tax = Math.floor(taxable * 0.22);
                var net = profit - tax;
                
                var comment = "";
                if (tax <= 0) comment = "축하합니다(응?) 세금 낼 돈도 못 버셨군요... 공제액 미만입니다.";
                else if (tax > 100000000) comment = "세금만 1억! 국세청장님 표창장 받으시겠어요.";
                else if (tax > 10000000) comment = "차 한 대 값이 세금으로 증발! 멘탈 꽉 잡으세요.";
                else comment = "22%... 생각보다 쎄죠? 이게 현실입니다.";

                return {
                    items: [
                        { label: '과세 대상 금액', val: won(taxable) },
                        { label: '예상 납부 세액 (22%)', val: won(tax) },
                        { label: '세후 실수령액', val: '<strong>' + won(net) + '</strong>' },
                        { label: '한 줄 평', val: '<strong>' + comment + '</strong>' }
                    ],
                    chart: { type: 'pie', labels: ['내 돈(실수령)', '나라 돈(세금)'], data: [net, tax] }
                };
            }
        },
        'son-salary': {
            title: '손흥민 주급 vs 내 연봉 체감',
            descTitle: '월드클래스와 나의 거리 측정',
            description: '손흥민 선수의 추정 주급(약 3.4억 원)과 내 연봉을 비교해봅니다. (현타 주의)',
            example: '내 연봉 4,000만원일 때',
            inputs: [
                { id: 'ss1', label: '내 세전 연봉 (원)', value: 40000000 }
            ],
            run: function(d) {
                var sonWeekly = 340000000; // 약 19만 파운드
                var myAnnual = d.ss1;
                
                // 손흥민이 내 연봉 버는 데 걸리는 시간
                var sonEarnsMyYear = (myAnnual / sonWeekly) * 7 * 24; // 시간 단위
                var sonDays = Math.floor(sonEarnsMyYear / 24);
                var sonHours = Math.floor(sonEarnsMyYear % 24);
                
                // 내가 손흥민 주급 버는 데 걸리는 시간
                var iEarnSonWeek = sonWeekly / myAnnual;
                
                var comment = "";
                if (iEarnSonWeek > 50) comment = "환생이 더 빠를 수도 있습니다...";
                else if (iEarnSonWeek > 10) comment = "10년이면 강산도 변한다는데, 주급 한 번 받기 힘드네요.";
                else comment = "오! 그래도 꽤 능력자이십니다. 희망을 가지세요!";

                return {
                    items: [
                        { label: '손흥민이 내 연봉 버는 시간', val: sonDays + '일 ' + sonHours + '시간' },
                        { label: '내가 쏜 주급 버는 기간', val: iEarnSonWeek.toFixed(1) + '년' },
                        { label: '한 줄 평', val: '<strong>' + comment + '</strong>' }
                    ],
                    chart: { type: 'bar', labels: ['내 연봉', '손흥민 주급'], data: [myAnnual, sonWeekly] }
                };
            }
        },
        'delivery-travel': {
            title: '배달비 모아 해외여행',
            descTitle: '치킨 참으면 어디까지 갈 수 있을까?',
            description: '습관적인 배달 주문을 끊었을 때 모을 수 있는 돈으로 갈 수 있는 여행지를 추천합니다.',
            example: '주 3회, 건당 배달비 4,000원',
            inputs: [
                { id: 'dt1', label: '주당 배달 횟수', value: 3 },
                { id: 'dt2', label: '건당 평균 배달비 (원)', value: 4000 },
                { id: 'dt3', label: '건당 평균 음식값 (원)', value: 25000 }
            ],
            run: function(d) {
                var weekCost = (d.dt2 + d.dt3) * d.dt1;
                var yearCost = weekCost * 52;
                
                var dest = "";
                if (yearCost >= 5000000) dest = "🇫🇷 유럽 / 🇺🇸 미국 (비즈니스석 가능?)";
                else if (yearCost >= 3000000) dest = "🇺🇸 하와이 / 🇦🇺 호주";
                else if (yearCost >= 1500000) dest = "🇹🇭 방콕 / 🇻🇳 다낭 풀빌라";
                else if (yearCost >= 500000) dest = "🇯🇵 일본 / 🇹🇼 대만";
                else dest = "🇰🇷 제주도 / 🏖️ 국내 호캉스";

                return {
                    items: [
                        { label: '1년 총 배달 지출액', val: won(yearCost) },
                        { label: '배달비만 따져도', val: won(d.dt2 * d.dt1 * 52) },
                        { label: '갈 수 있는 여행지', val: '<strong style="color:#e11d48">' + dest + '</strong>' }
                    ],
                    chart: { type: 'doughnut', labels: ['음식값', '배달비'], data: [d.dt3 * d.dt1 * 52, d.dt2 * d.dt1 * 52] }
                };
            }
        },
        'crypto-fomo': {
            title: '비트코인 타임머신 ("그때 샀더라면")',
            descTitle: '과거의 나를 반성하는 시간',
            description: '비트코인을 과거 특정 시점에 샀을 때, 현재 자산 가치를 시뮬레이션합니다.',
            refName: '업비트 (비트코인 시세)',
            refLink: 'https://upbit.com',
            example: '10년 전 100만원 투자 시',
            inputs: [
                { id: 'f1', label: '투자금액 (원)', value: 1000000 },
                { id: 'f2', label: '투자 시점', value: 5, type: 'select', options: [
                    { label: '5년 전 (2021년)', value: 5 },
                    { label: '10년 전 (2016년)', value: 10 },
                    { label: '15년 전 (2011년)', value: 15 }
                ]}
            ],
            run: function(d) {
                var multiplier = d.f2 == 15 ? 150000 : (d.f2 == 10 ? 300 : 2.72);
                var current = d.f1 * multiplier;
                var comment = "";
                if (current >= 10000000000) comment = "지구 정복 가능! 님은 이미 삼성전자 회장님과 동급입니다.";
                else if (current >= 1000000000) comment = "축하합니다! 강남 아파트 한 채가 지갑 속에 들어있네요.";
                else if (current >= 100000000) comment = "포르쉐 매장 가셔도 됩니다. 퇴사 각 잡으시죠?";
                else if (current >= 10000000) comment = "매일 소고기 파티 가능! 하지만 현실은 컵라면인가요?";
                else comment = "적금보다는 낫지만 인생 역전에는 실패했습니다.";

                return {
                    items: [
                        { label: '현재 가치 (추정)', val: won(current) },
                        { label: '상승률', val: (multiplier * 100).toLocaleString() + '%' },
                        { label: '한 줄 평', val: '<strong>' + comment + '</strong>' }
                    ],
                    chart: { type: 'bar', labels: ['원금', '현재가치'], data: [d.f1, current] }
                };
            }
        },
        'coffee-tesla': {
            title: '커피값 vs 테슬라(TSLA)',
            descTitle: '스벅 아아 한 잔의 기회비용',
            description: '매일 마시는 커피값(4,500원)을 아껴서 테슬라 주식을 5년간 적립식으로 샀다면?',
            refName: '야후 파이낸스 (TSLA)',
            refLink: 'https://finance.yahoo.com/quote/TSLA',
            example: '매일 4,500원씩 5년 적립 시',
            inputs: [{ id: 't1', label: '일일 커피값 (원)', value: 4500 }],
            run: function(d) {
                var totalCoffee = d.t1 * 365 * 5;
                var rate = 0.25 / 12;
                var months = 60;
                var futureValue = (d.t1 * 30) * ((Math.pow(1 + rate, months) - 1) / rate) * (1 + rate);
                var diff = futureValue - totalCoffee;
                var comment = diff >= 50000000 ? "당신이 마신 건 커피가 아니라 테슬라 모델 3였습니다!" : (diff >= 5000000 ? "스타벅스 주주님들 좋은 일 시켜주셨네요!" : "정신 건강비로 칩시다. 아아는 소중하니까요.");
                return {
                    items: [
                        { label: '5년 총 커피값', val: won(totalCoffee) },
                        { label: '테슬라 주식 가치', val: won(futureValue) },
                        { label: '한 줄 평', val: '<strong>' + comment + '</strong>' }
                    ],
                    chart: { type: 'doughnut', labels: ['소비됨', '주식이득'], data: [totalCoffee, diff] }
                };
            }
        },
        'breath-apartment': {
            title: '숨참고 한강뷰 다이브',
            descTitle: '내 집 마련 소요 기간',
            description: '내 연봉을 한 푼도 안 쓰고 모았을 때 한강뷰 아파트를 사기까지 걸리는 기간입니다.',
            example: '연봉 5,000만원, 아파트 25억 기준',
            inputs: [
                { id: 'b1', label: '세후 연봉 (원)', value: 50000000 },
                { id: 'b2', label: '목표 아파트가 (원)', value: 2500000000 }
            ],
            run: function(d) {
                var years = d.b2 / d.b1;
                var comment = years >= 100 ? "거북이로 환생하시거나 숨을 100년 참으시면 됩니다." : (years >= 50 ? "한강 편의점 라면 뷰 어떠세요? 꿀맛입니다." : (years >= 20 ? "영끌하면 60대엔 가능할지도?" : "능력자시네요! 그냥 사셔도 되겠는데요?"));
                return {
                    items: [
                        { label: '소요 기간', val: years.toFixed(1) + ' 년' },
                        { label: '한 줄 평', val: '<strong>' + comment + '</strong>' }
                    ],
                    chart: { type: 'pie', labels: ['현재연봉', '부족금액'], data: [d.b1, d.b2 - d.b1] }
                };
            }
        },
        'youtube-adsense': {
            title: '유튜브 수익 계산기',
            descTitle: '조회수당 예상 수익',
            description: '조회수에 따른 예상 광고 수익을 계산합니다.',
            example: '조회수 100만 회',
            inputs: [
                { id: 'y1', label: '월 조회수', value: 1000000 },
                { id: 'y2', label: 'CPM(원)', value: 3000 }
            ],
            run: function(d) {
                var profit = (d.y1 / 1000) * d.y2;
                var comment = profit >= 10000000 ? "갓튜브님! 혹시 편집자 필요하신가요?" : (profit >= 1000000 ? "부업으로 딱! 매일 치킨 가능" : "데이터 낭비 중... 시청만 합시다.");
                return {
                    items: [
                        { label: '예상 월 수익', val: won(profit) },
                        { label: '한 줄 평', val: '<strong>' + comment + '</strong>' }
                    ],
                    chart: { type: 'bar', labels: ['월수익', '목표'], data: [profit, 10000000] }
                };
            }
        },
        'influencer-price': {
            title: '인플루언서 협찬 단가',
            descTitle: '광고 원고료 정산',
            description: '팔로워 수 기준 추천 협찬 단가를 제안합니다.',
            example: '팔로워 5만 명 기준',
            inputs: [
                { id: 'i1', label: '팔로워 수', value: 50000 }
            ],
            run: function(d) {
                var price = d.i1 * 15;
                var comment = d.i1 >= 100000 ? "셀럽 등극! 협찬 물건으로 방이 꽉 차겠네요." : "동네 인싸 탄생! 제안서 메일함 확인해보세요.";
                return {
                    items: [
                        { label: '추천 원고료', val: won(price) },
                        { label: '한 줄 평', val: '<strong>' + comment + '</strong>' }
                    ],
                    chart: { type: 'doughnut', labels: ['원고료', '게시물가치'], data: [price, price * 1.5] }
                };
            }
        },
        'ott-dutch': {
            title: 'OTT 파티원 정산기 (전용)',
            descTitle: '주요 OTT 가격 & 정산 가이드',
            description: '한국인이 가장 많이 쓰는 OTT들의 가격을 미리 세팅해두었습니다. 파티원 수만 넣어서 1/N 빵 금액과 호구 지수를 확인하세요.',
            example: '넷플릭스 프리미엄, 4명 정산',
            inputs: [
                { id: 'o1', label: 'OTT 서비스 선택', value: 'netflix', type: 'select', options: [
                    { label: '넷플릭스 (프리미엄)', value: 'netflix' },
                    { label: '유튜브 프리미엄', value: 'youtube' },
                    { label: '디즈니+', value: 'disney' },
                    { label: '티빙 (프리미엄)', value: 'tving' },
                    { label: '웨이브 (프리미엄)', value: 'wavve' },
                    { label: '쿠팡플레이 (와우)', value: 'coupang' },
                    { label: '직접 입력', value: 'custom' }
                ]},
                { id: 'o2', label: '현재 파티원 수 (나 포함)', value: 4 },
                { id: 'o3', label: '총 금액 (직접 입력시)', value: 0 }
            ],
            run: function(d) {
                var ottData = {
                    'netflix': { price: 17000, max: 4, name: '넷플릭스' },
                    'youtube': { price: 14900, max: 1, name: '유튜브 프리미엄' }, // 공유 금지지만 정산은 하니깐
                    'disney': { price: 13900, max: 4, name: '디즈니+' },
                    'tving': { price: 17000, max: 4, name: '티빙' },
                    'wavve': { price: 13900, max: 4, name: '웨이브' },
                    'coupang': { price: 7890, max: 2, name: '쿠팡플레이' },
                    'custom': { price: d.o3, max: 4, name: '기타 OTT' }
                };

                var selected = ottData[d.o1] || ottData['netflix'];
                var totalPrice = (d.o1 === 'custom') ? d.o3 : selected.price;
                var members = Math.max(1, d.o2);
                var perPerson = Math.ceil(totalPrice / members / 10) * 10;
                
                var comment = "";
                var diff = selected.max - members;

                if (d.o1 === 'youtube') {
                    comment = "유튜브는 공식 공유가 없지만... 뿜빠이 정신 응원합니다!";
                } else if (diff > 0) {
                    var saveMore = perPerson - (Math.ceil(totalPrice / selected.max / 10) * 10);
                    comment = "잠깐! " + diff + "명 더 구하면 인당 " + won(saveMore) + " 더 아낄 수 있어요. 당장 당근마켓으로 가시죠!";
                } else if (diff === 0) {
                    comment = "완벽한 풀파티! 정산의 마스터이자 갓생러이시군요.";
                } else {
                    comment = "최대 인원을 넘겼어요! 동접 제한 때문에 싸움 날 수 있으니 주의하세요.";
                }

                return {
                    items: [
                        { label: selected.name + ' 총액', val: won(totalPrice) },
                        { label: '인당 입금액', val: '<strong style="color:#2563eb">' + won(perPerson) + '</strong>' },
                        { label: '최대 공유 인원', val: selected.max + '명' },
                        { label: '한 줄 평', val: '<strong>' + comment + '</strong>' },
                        { label: '카톡 복사용', val: '<small>매달 ' + perPerson.toLocaleString() + '원! 늦지 않게 입금 부탁드려요~</small>' }
                    ],
                    chart: { 
                        type: 'doughnut', 
                        labels: ['나의 부담', '파티원 총합'], 
                        data: [perPerson, totalPrice - perPerson] 
                    }
                };
            }
        },
        'part-time': {
            title: '알바 주휴수당 & 실수령액 감별기',
            descTitle: '2026 최저임금 반영 & 세금 정밀 계산',
            description: '주당 15시간 이상 근무 시 지급되는 주휴수당과 선택한 세금 요율을 반영하여, 통장에 찍히는 "진짜" 월급을 계산합니다.',
            refName: '고용노동부 (주휴수당 제도 안내)',
            refLink: 'https://www.moel.go.kr',
            example: '시급 10,030원, 주 20시간, 세금 3.3% 공제',
            inputs: [
                { id: 'p1', label: '시급 (원)', value: 10030 },
                { id: 'p2', label: '주 근무시간 (시간)', value: 20 },
                { id: 'p3', label: '세금 종류', value: 0, type: 'select', options: [
                    { label: '미공제 (전액 수령)', value: 0 },
                    { label: '3.3% (사업소득세)', value: 3.3 },
                    { label: '약 9.4% (4대보험)', value: 9.4 }
                ]}
            ],
            run: function(d) {
                var hourly = d.p1;
                var hours = d.p2;
                var taxRate = d.p3;

                // 주급 기본급
                var weeklyBase = hourly * hours;
                
                // 주휴수당 계산 (15시간 이상일 때만)
                // 공식: (주 근무시간 / 40시간) * 8 * 시급 (최대 40시간까지만 인정)
                var holidayPay = 0;
                if (hours >= 15) {
                    var calcHours = Math.min(40, hours);
                    holidayPay = Math.floor((calcHours / 40) * 8 * hourly);
                }

                var weeklyTotal = weeklyBase + holidayPay;
                var monthlyGross = Math.floor(weeklyTotal * 4.345); // 한 달 평균 4.345주 적용
                
                var taxAmount = Math.floor(monthlyGross * (taxRate / 100));
                var monthlyNet = monthlyGross - taxAmount;

                var comment = "";
                if (hours < 15) {
                    comment = "앗... 15시간 미만이라 주휴수당이 없어요. 사장님이 웃고 계십니다.";
                } else if (hours == 14.5 || hours == 14.9) {
                    comment = "이건 100% 주휴수당 안 주려는 '쪼개기 계약' 스멜이 납니다. 조심하세요!";
                } else if (monthlyNet >= 2090000) {
                    comment = "이 정도면 알바가 아니라 부업 장인! 웬만한 직장인 부럽지 않네요.";
                } else if (holidayPay > 0) {
                    comment = "주휴수당이라는 소중한 보너스 확보! 떼이지 말고 꼭 챙기세요.";
                } else {
                    comment = "티끌 모아 태산! 알바비 모아서 부자 됩시다.";
                }

                return {
                    items: [
                        { label: '주 기본급', val: won(weeklyBase) },
                        { label: '주휴수당', val: holidayPay > 0 ? won(holidayPay) : '<span style="color:#94a3b8">0원 (대상아님)</span>' },
                        { label: '월 세전 총액', val: won(monthlyGross) },
                        { label: '공제 세금 (' + taxRate + '%)', val: won(taxAmount) },
                        { label: '최종 실수령액', val: '<strong>' + won(monthlyNet) + '</strong>' },
                        { label: '판독 결과', val: '<strong>' + comment + '</strong>' }
                    ],
                    chart: { 
                        type: 'pie', 
                        labels: ['기본급', '주휴수당', '세금'], 
                        data: [weeklyBase * 4.345, holidayPay * 4.345, taxAmount] 
                    }
                };
            }
        },
        'travel-currency': {
            title: '유럽 축구 직관 물가 체감',
            descTitle: '현지 금액 -> 국밥 환산',
            description: '유럽 물가를 국밥 개수로 체감해봅니다.',
            example: '150유로, 환율 1,500원 적용 시',
            inputs: [
                { id: 'tc1', label: '현지 금액', value: 150 },
                { id: 'tc2', label: '환율', value: 1500 }
            ],
            run: function(d) {
                var wonVal = d.tc1 * d.tc2;
                var gukbap = Math.floor(wonVal / 10000);
                var comment = gukbap >= 50 ? "손이 떨려서 결제가 되나요? 대단한 용기입니다." : "이 정도면 혜자! 평생 추억 만드세요.";
                return {
                    items: [
                        { label: '한화 환산액', val: won(wonVal) },
                        { label: '국밥 환산', val: gukbap + ' 그릇' },
                        { label: '한 줄 평', val: '<strong>' + comment + '</strong>' }
                    ],
                    chart: { type: 'bar', labels: ['지출', '국밥 10개'], data: [wonVal, 100000] }
                };
            }
        },
        'salary': {
            title: '2026 연봉 실수령액 계산기',
            descTitle: '2026년 최신 요율 반영 상세 계산',
            description: '국민연금 상한액 인상 및 건강보험 요율을 반영한 2026년형 실수령액 계산기입니다.',
            refName: '국세청 홈택스',
            refLink: 'https://www.hometax.go.kr',
            example: '연봉 5,000만원, 부양가족 1명',
            inputs: [
                { id: 's1', label: '연봉 (원)', value: 50000000 },
                { id: 's2', label: '비과세 (월)', value: 200000 },
                { id: 's3', label: '부양가족', value: 1 }
            ],
            run: function(d) {
                var month = Math.floor(d.s1 / 12);
                var tax_target = Math.max(0, month - d.s2);
                var pension = Math.floor(Math.min(tax_target, 6170000) * 0.045);
                var health = Math.floor(tax_target * 0.03545);
                var care = Math.floor(health * 0.1295);
                var employment = Math.floor(tax_target * 0.009);
                var tax_base = (d.s1 - 15000000 - (d.s3 * 1500000));
                var incomeTax = Math.floor((tax_base > 0 ? calcProgressiveTax(tax_base) : 0) / 12);
                var localTax = Math.floor(incomeTax * 0.1);
                var net = month - (pension + health + care + employment + incomeTax + localTax);
                return {
                    items: [
                        { label: '월 세전 급여', val: won(month) },
                        { label: '4대보험 합계', val: won(pension+health+care+employment) },
                        { label: '월 실수령액', val: '<strong>' + won(net) + '</strong>' }
                    ],
                    chart: { type: 'pie', labels: ['실수령', '공제'], data: [net, month-net] }
                };
            }
        },
        'loan': {
            title: '대출 이자 계산기',
            descTitle: '월 상환액 및 이자',
            description: '원리금 균등 상환 기준입니다.',
            refName: '금융감독원',
            refLink: 'https://finlife.fss.or.kr',
            example: '3억원 대출, 금리 4.5%, 30년 상환',
            inputs: [
                { id: 'l1', label: '대출금', value: 300000000 },
                { id: 'l2', label: '금리(%)', value: 4.5 },
                { id: 'l3', label: '기간(개월)', value: 360 }
            ],
            run: function(d) {
                var r = (d.l2/100)/12;
                var n = d.l3;
                var m = d.l1 * r * Math.pow(1+r, n) / (Math.pow(1+r, n)-1);
                return {
                    items: [
                        { label: '월 상환금', val: won(m) },
                        { label: '총 이자', val: won(m*n - d.l1) }
                    ],
                    chart: { type: 'doughnut', labels: ['원금', '이자'], data: [d.l1, m*n - d.l1] }
                };
            }
        },
        'tax-settlement': {
            title: '연말정산 환급금 예상',
            descTitle: '결정세액 vs 기납부세액',
            description: '약식 계산기를 통해 올해 환급액을 예상해봅니다.',
            refName: '국세청 홈택스',
            refLink: 'https://www.hometax.go.kr',
            example: '총급여 5,500만원, 기납부세액 300만원',
            inputs: [
                { id: 'ts1', label: '총급여', value: 55000000 },
                { id: 'ts2', label: '기납부세액', value: 3000000 }
            ],
            run: function(d) {
                var base = d.ts1 * 0.15; // 매우 약식
                var diff = d.ts2 - base;
                return {
                    items: [
                        { label: '예상 결정세액', val: won(base) },
                        { label: diff > 0 ? '환급 예상액' : '추가납부액', val: won(Math.abs(diff)) }
                    ],
                    chart: { type: 'bar', labels: ['기납부', '결정세액'], data: [d.ts2, base] }
                };
            }
        },
        'rent-compare': {
            title: '전세 vs 월세 비교',
            descTitle: '어디가 더 유리할까?',
            description: '전세 대출 이자와 월세 비용을 비교합니다.',
            example: '전세 3억(4.0%) vs 월세 100만원',
            inputs: [
                { id: 'rc1', label: '전세금', value: 300000000 },
                { id: 'rc2', label: '대출금리(%)', value: 4.0 },
                { id: 'rc3', label: '월세', value: 1000000 }
            ],
            run: function(d) {
                var j = (d.rc1 * (d.rc2/100)) / 12;
                return {
                    items: [
                        { label: '전세 월 이자', val: won(j) },
                        { label: '월세액', val: won(d.rc3) },
                        { label: '유불리', val: j < d.rc3 ? '전세 유리' : '월세 유리' }
                    ],
                    chart: { type: 'bar', labels: ['전세이자', '월세'], data: [j, d.rc3] }
                };
            }
        },
        'capital-gain': {
            title: '양도소득세 계산기',
            descTitle: '부동산 매도 시 세금',
            description: '양도차익에 따른 세금을 계산합니다.',
            example: '양도가 8억, 취득가 5억',
            inputs: [
                { id: 'cg1', label: '양도가액', value: 800000000 },
                { id: 'cg2', label: '취득가액', value: 500000000 }
            ],
            run: function(d) {
                var gain = d.cg1 - d.cg2;
                var tax = calcProgressiveTax(gain);
                return {
                    items: [
                        { label: '양도차익', val: won(gain) },
                        { label: '예상 세금', val: won(tax) }
                    ],
                    chart: { type: 'pie', labels: ['실수익', '세금'], data: [gain - tax, tax] }
                };
            }
        },
        'pension': {
            title: '연금보험 수익률',
            descTitle: '미래 수령액 계산',
            description: '복리 수익을 계산합니다.',
            example: '월 100만원, 10년 납입',
            inputs: [
                { id: 'pe1', label: '월 납입액', value: 1000000 },
                { id: 'pe2', label: '기간(년)', value: 10 }
            ],
            run: function(d) {
                var total = d.pe1 * d.pe2 * 12 * 1.2; // 약식 20% 수익 가정
                return {
                    items: [
                        { label: '총 납입금', val: won(d.pe1 * d.pe2 * 12) },
                        { label: '예상 수령액', val: won(total) }
                    ],
                    chart: { type: 'doughnut', labels: ['원금', '이자'], data: [d.pe1 * d.pe2 * 12, total - (d.pe1 * d.pe2 * 12)] }
                };
            }
        },
        'real-estate': {
            title: '부동산 투자 수익률',
            descTitle: '수익형 부동산 ROI',
            description: '월세 수익률을 분석합니다.',
            example: '매입 5억, 월세 200만원',
            inputs: [
                { id: 're1', label: '매입가', value: 500000000 },
                { id: 're2', label: '월세', value: 2000000 }
            ],
            run: function(d) {
                var roi = (d.re2 * 12 / d.re1) * 100;
                return {
                    items: [
                        { label: '연 임대수익', val: won(d.re2 * 12) },
                        { label: '수익률(ROI)', val: roi.toFixed(2) + '%' }
                    ],
                    chart: { type: 'bar', labels: ['매입가', '10년수익'], data: [d.re1, d.re2 * 120] }
                };
            }
        },
        'property-tax': {
            title: '재산세/종부세 계산',
            descTitle: '보유세 추정',
            description: '공시지가 기준 보유세를 약식으로 계산합니다.',
            example: '공시지가 15억원',
            inputs: [{ id: 'pt1', label: '공시지가', value: 1500000000 }],
            run: function(d) {
                var tax = d.pt1 * 0.003; // 매우 약식
                return {
                    items: [{ label: '예상 보유세', val: won(tax) }],
                    chart: { type: 'pie', labels: ['지가', '세금'], data: [d.pt1, tax] }
                };
            }
        },
        'auto-insurance': {
            title: '자동차 보험료 계산기',
            descTitle: '내 차 보험료 견적',
            description: '나이와 차량 가액을 기준으로 대략적인 연간 보험료를 추산합니다. (다이렉트 기준)',
            example: '만 30세, 차량가 3,000만원',
            inputs: [
                { id: 'ai1', label: '만 나이', value: 30 },
                { id: 'ai2', label: '차량 가액 (원)', value: 30000000 },
                { id: 'ai3', label: '운전 경력', value: 'new', type: 'select', options: [
                    { label: '신규 (첫 차)', value: 'new' },
                    { label: '3년 이상 (무사고)', value: 'exp' }
                ]}
            ],
            run: function(d) {
                var age = d.ai1;
                var carValue = d.ai2;
                var exp = d.ai3;
                
                // 기본료 100만원
                var base = 1000000;
                
                // 나이 할증/할인
                if (age < 26) base += 800000; // 20대 초반 비쌈
                else if (age < 30) base += 300000;
                else base -= 100000; // 30대 이상 할인
                
                // 차량 가액 반영 (2%)
                base += carValue * 0.02;
                
                // 경력 할인
                if (exp === 'exp') base *= 0.7; // 30% 할인
                
                // 최소 50만원 하한선
                var finalPremium = Math.max(500000, Math.floor(base));
                
                var comment = "";
                if (finalPremium > 2000000) comment = "헉! 보험료가 꽤 세네요. 부모님 명의 찬스 고려해보세요.";
                else if (finalPremium < 700000) comment = "베스트 드라이버시군요! 아주 저렴합니다.";
                else comment = "평균적인 수준입니다. 안전운전 하세요!";

                return {
                    items: [
                        { label: '차량 요율 반영', val: won(carValue * 0.02) },
                        { label: '연간 예상 보험료', val: '<strong style="color:#2563eb">' + won(finalPremium) + '</strong>' },
                        { label: '한 줄 평', val: '<strong>' + comment + '</strong>' }
                    ],
                    chart: { type: 'pie', labels: ['보험료', '기타유지비(예상)'], data: [finalPremium, finalPremium * 1.5] }
                };
            }
        },
        'rate-analysis': {
            title: '대출 금리 분석',
            descTitle: '금리 인상 리스크',
            description: '금리 인상 시 월 상환액 변화를 분석합니다.',
            example: '4억 대출, 금리 4.0% -> 6.0% 인상 시',
            inputs: [
                { id: 'ra1', label: '대출금', value: 400000000 },
                { id: 'ra2', label: '현재금리', value: 4.0 },
                { id: 'ra3', label: '인상금리', value: 6.0 }
            ],
            run: function(d) {
                var diff = d.ra1 * (d.ra3 - d.ra2) / 100 / 12;
                return {
                    items: [{ label: '월 추가 부담액', val: won(diff) }],
                    chart: { type: 'bar', labels: ['현재', '인상후'], data: [d.ra1 * d.ra2 / 1200, d.ra1 * d.ra3 / 1200] }
                };
            }
        }
    };
});

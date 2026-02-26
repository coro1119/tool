document.addEventListener('DOMContentLoaded', function() {
    var themeBtn = document.getElementById('theme-btn');
    var homeView = document.getElementById('home-view');
    var calcView = document.getElementById('calc-view');
    var postView = document.getElementById('post-view');
    var adminLoginView = document.getElementById('admin-login-view');
    var adminDashboardView = document.getElementById('admin-dashboard-view');
    var adminEditorView = document.getElementById('admin-editor-view');
    
    var postTitle = document.getElementById('post-title');
    var postMeta = document.getElementById('post-meta');
    var postContent = document.getElementById('post-content');
    var backBtns = document.querySelectorAll('.back-btn');
    var goToCalcBtn = document.getElementById('go-to-related-calc');

    var currentChart = null;
    var baseTitle = "테슬라번 (Teslaburn)";
    var quill = null;
    var currentEditingId = null;

    // --- Helper: won formatter ---
    var won = function(v) { 
        if (isNaN(v)) return '0원';
        return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(Math.round(v)); 
    };

    // --- Helper: Progressive Tax ---
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

    // --- 1. FULL CALCULATOR DATA (RESTORED) ---
    var book = {
        'salary': {
            title: '2026 연봉 실수령액',
            descTitle: '2026년 최신 세법 및 4대보험 반영',
            description: '국민연금 상한액 인상 및 건강보험 요율을 반영한 2026년형 실제 통장 수령액입니다.',
            example: '연봉 5,000만원, 비과세 식대 20만원 기준',
            inputs: [
                { id: 's1', label: '세전 연봉 (원)', value: 50000000 },
                { id: 's2', label: '비과세 식대 (월)', value: 200000 }
            ],
            run: function(d) {
                var month = Math.floor(d.s1 / 12);
                var tax_target = Math.max(0, month - d.s2);
                var pension = Math.floor(Math.min(tax_target, 6170000) * 0.045);
                var health = Math.floor(tax_target * 0.03545);
                var care = Math.floor(health * 0.1295);
                var employment = Math.floor(tax_target * 0.009);
                var tax_base = (d.s1 - 15000000 - 1500000); 
                var incomeTax = Math.floor((tax_base > 0 ? calcProgressiveTax(tax_base) : 0) / 12);
                var localTax = Math.floor(incomeTax * 0.1);
                var net = month - (pension + health + care + employment + incomeTax + localTax);
                return {
                    items: [
                        { label: '월 세전 급여', val: won(month) },
                        { label: '공제액 합계', val: won(month - net) },
                        { label: '월 예상 실수령액', val: '<strong>' + won(net) + '</strong>' }
                    ],
                    chart: { type: 'pie', labels: ['실수령', '공제'], data: [net, month - net] }
                };
            }
        },
        'coin-tax': {
            title: '2026 코인 과세 시뮬',
            descTitle: '가상자산 수익 22% 과세 현실화',
            description: '2026년 시행 예정인 코인 과세(공제 250만원 초과분 22%)를 시뮬레이션합니다.',
            inputs: [
                { id: 'c1', label: '가상자산 총 수익 (원)', value: 100000000 },
                { id: 'c2', label: '기본 공제액 (원)', value: 2500000 }
            ],
            run: function(d) {
                var taxable = Math.max(0, d.c1 - d.c2);
                var tax = Math.floor(taxable * 0.22);
                var net = d.c1 - tax;
                return {
                    items: [
                        { label: '과세 대상 수익', val: won(taxable) },
                        { label: '예상 납부 세액 (22%)', val: won(tax) },
                        { label: '세후 실수령액', val: '<strong>' + won(net) + '</strong>' }
                    ],
                    chart: { type: 'doughnut', labels: ['내 돈', '나라 돈'], data: [net, tax] }
                };
            }
        },
        'car-vs-taxi': {
            title: '테슬라 vs 택시 VIP',
            descTitle: '소유 vs 서비스 비용 분석',
            description: '차량 유지비로 평생 택시만 타는 것이 이득인지 비교해 드립니다.',
            inputs: [
                { id: 'ct1', label: '차량 가격 (원)', value: 60000000 },
                { id: 'ct2', label: '월 유지비/보험료 (원)', value: 300000 }
            ],
            run: function(d) {
                var monthlyInstallment = Math.floor(d.ct1 / 60); 
                var totalMonthly = monthlyInstallment + d.ct2;
                var rides = Math.floor(totalMonthly / 15000); 
                return {
                    items: [
                        { label: '월 예상 유지비', val: won(totalMonthly) },
                        { label: '택시 탑승 가능 횟수', val: rides + ' 회 (건당 1.5만원)' },
                        { label: '결론', val: rides > 60 ? '<strong>택시가 경제적</strong>' : '자차 소유 추천' }
                    ],
                    chart: { type: 'bar', labels: ['자차 유지비', '택시 60회 비용'], data: [totalMonthly, 900000] }
                };
            }
        },
        'son-salary': {
            title: '손흥민 vs 내 연봉',
            descTitle: '월클과 나의 경제적 거리',
            description: '손흥민 선수의 주급(약 3.4억 원)과 내 연봉을 비교합니다.',
            inputs: [{ id: 'ss1', label: '내 세전 연봉 (원)', value: 40000000 }],
            run: function(d) {
                var sonWeekly = 340000000;
                var sonHourly = sonWeekly / (7 * 24);
                var timeToEarnMySalary = (d.ss1 / sonHourly); 
                return {
                    items: [
                        { label: '손흥민이 내 연봉 버는 시간', val: timeToEarnMySalary.toFixed(1) + ' 시간' },
                        { label: '나의 흥민 주급 달성 기간', val: (sonWeekly / d.ss1).toFixed(1) + ' 년' }
                    ],
                    chart: { type: 'bar', labels: ['내 연봉', '손흥민 주급'], data: [d.ss1, sonWeekly] }
                };
            }
        },
        'part-time': {
            title: '알바 주휴수당',
            descTitle: '2026년 최저임금 10,030원 반영',
            inputs: [
                { id: 'p1', label: '시급 (원)', value: 10030 },
                { id: 'p2', label: '주 근무시간', value: 20 }
            ],
            run: function(d) {
                var base = d.p1 * d.p2;
                var holiday = d.p2 >= 15 ? (d.p2 / 40) * 8 * d.p1 : 0;
                var total = (base + holiday) * 4.345;
                return {
                    items: [
                        { label: '주 주휴수당', val: won(holiday) },
                        { label: '월 예상 총액', val: '<strong>' + won(total) + '</strong>' }
                    ],
                    chart: { type: 'pie', labels: ['기본급', '주휴수당'], data: [base, holiday] }
                };
            }
        },
        'savings-vs-bitcoin': {
            title: '청년도약계좌 vs 비트코인',
            inputs: [
                { id: 'sb1', label: '월 납입액 (원)', value: 700000 },
                { id: 'sb2', label: '기간 (년)', value: 5 }
            ],
            run: function(d) {
                var months = d.sb2 * 12;
                var savings = (d.sb1 * months) * 1.1; // 단순화된 6% 금리 + 지원금
                var btc = d.sb1 * months * 2.5; // 비트코인 가상 수익률
                return {
                    items: [
                        { label: '도약계좌 예상 만기액', val: won(savings) },
                        { label: '비트코인 가상 만기액', val: won(btc) }
                    ],
                    chart: { type: 'line', labels: ['원금', '도약계좌', '비트코인'], data: [d.sb1 * months, savings, btc] }
                };
            }
        },
        'omakase-snp500': {
            title: '오마카세 vs S&P500',
            inputs: [{ id: 'os1', label: '한 끼 비용', value: 150000 }, { id: 'os2', label: '투자 기간 (년)', value: 20 }],
            run: function(d) {
                var months = d.os2 * 12;
                var futureValue = d.os1 * Math.pow(1.008, months) * 100; // 단순화 복리
                return {
                    items: [{ label: '20년 뒤 가치 (연 10%)', val: '<strong>' + won(futureValue) + '</strong>' }],
                    chart: { type: 'line', labels: ['소비원금', '미래가치'], data: [d.os1 * months, futureValue] }
                };
            }
        },
        'rate-analysis': {
            title: '금리 변동 분석',
            inputs: [
                { id: 'ra1', label: '대출잔액 (원)', value: 400000000 },
                { id: 'ra2', label: '현재금리 (%)', value: 4.0 },
                { id: 'ra3', label: '인상금리 (%)', value: 6.0 }
            ],
            run: function(d) {
                var diff = d.ra1 * (d.ra3 - d.ra2) / 100 / 12;
                return {
                    items: [{ label: '월 추가 이자 부담', val: '<strong>' + won(diff) + '</strong>' }],
                    chart: { type: 'bar', labels: ['현재이자', '인상후이자'], data: [d.ra1*d.ra2/100/12, d.ra1*d.ra3/100/12] }
                };
            }
        },
        'delivery-travel': {
            title: '배달비 모아 해외여행',
            inputs: [{ id: 'dt1', label: '주당 배달 횟수', value: 3 }, { id: 'dt2', label: '회당 비용', value: 30000 }],
            run: function(d) {
                var yearly = d.dt1 * d.dt2 * 52;
                return {
                    items: [{ label: '1년 배달 지출', val: won(yearly) }, { label: '갈 수 있는 곳', val: yearly > 3000000 ? '유럽/미국' : '일본/동남아' }],
                    chart: { type: 'doughnut', labels: ['배달비', '여윳돈'], data: [yearly, 5000000] }
                };
            }
        },
        'breath-apartment': {
            title: '숨참고 한강뷰 다이브',
            inputs: [{ id: 'b1', label: '월 저축액 (원)', value: 2000000 }, { id: 'b2', label: '아파트가 (원)', value: 2500000000 }],
            run: function(d) {
                var years = d.b2 / (d.b1 * 12);
                return {
                    items: [{ label: '내집마련 소요 기간', val: years.toFixed(1) + ' 년' }],
                    chart: { type: 'pie', labels: ['현재자산', '부족분'], data: [d.b1*12, d.b2 - d.b1*12] }
                };
            }
        },
        'youtube-adsense': {
            title: '유튜브 롱폼 수익',
            inputs: [{ id: 'y1', label: '월 조회수', value: 1000000 }, { id: 'y2', label: 'CPM (원)', value: 3000 }],
            run: function(d) {
                var profit = (d.y1 / 1000) * d.y2;
                return {
                    items: [{ label: '예상 월 수익', val: won(profit) }],
                    chart: { type: 'bar', labels: ['월수익', '목표'], data: [profit, 10000000] }
                };
            }
        },
        'ott-dutch': {
            title: 'OTT N빵 최적화',
            inputs: [{ id: 'o1', label: '총 금액', value: 17000 }, { id: 'o2', label: '인원수', value: 4 }],
            run: function(d) {
                var per = Math.ceil(d.o1 / d.o2 / 10) * 10;
                return {
                    items: [{ label: '인당 부담금', val: won(per) }],
                    chart: { type: 'pie', labels: ['내부담', '타인부담'], data: [per, d.o1 - per] }
                };
            }
        },
        'influencer-price': {
            title: '인플루언서 단가',
            inputs: [{ id: 'i1', label: '팔로워 수', value: 50000 }],
            run: function(d) {
                var price = d.i1 * 15;
                return {
                    items: [{ label: '추천 원고료', val: won(price) }],
                    chart: { type: 'doughnut', labels: ['원고료', '가치'], data: [price, price * 1.5] }
                };
            }
        }
    };

    // --- 2. BLOG POST DATA (INITIAL) ---
    var posts = {
        'optimus-factory': {
            title: '테슬라 모델 S·X 단종이 진짜 무서운 이유: 프리몬트가 옵티머스 공장이 된다',
            category: '테슬라',
            date: '2026. 02. 26',
            summary: '단순한 라인업 정리가 아닙니다. 테슬라가 대량 생산 자율 로봇 기업으로 탈바꿈하는 선언입니다.',
            thumb: 'https://images.unsplash.com/photo-1558444458-5cd00bb12f1d?w=600',
            relatedCalc: 'son-salary',
            content: `
                <p>최근 테슬라의 행보 중 가장 충격적인 것은 프리몬트 공장의 변화입니다. 모델 S와 X의 단종 소식은 단순한 라인업 정리가 아닙니다.</p>
                <h3>1. 자동차 기업에서 로봇 기업으로</h3>
                <p>일론 머스크는 이미 테슬라를 'AI와 로봇 기업'으로 정의했습니다. 모델 S/X 라인을 들어내고 그 자리를 메우는 것은 다름 아닌 인형 로봇 <strong>옵티머스(Optimus)</strong>의 대량 생산 라인입니다.</p>
                <ul>
                    <li>연간 수백만 대의 로봇 생산 능력 확보</li>
                    <li>인건비 혁명을 통한 제조 단가 파괴</li>
                </ul>
                <p>우리는 이제 노동 소득이 아닌 '자본 소득'과 '로봇 생산성'에 집중해야 합니다.</p>
            `
        },
        'ge-vernova': {
            title: 'AI 전력 부족 시대, GE 버노바(GE Vernova)의 가치',
            category: '에너지',
            date: '2026. 02. 13',
            summary: '변압기 하나에 2년을 기다려야 하는 시대, 전력 인프라 기업들의 실적을 분석합니다.',
            thumb: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=600',
            relatedCalc: 'rate-analysis',
            content: `<p>AI의 발전 속도를 전력 인프라가 따라가지 못하고 있습니다. 젠슨 황과 일론 머스크가 동시에 경고한 '전력 부족'은 현실이 되었습니다.</p>`
        }
    };

    // --- 3. UI Logic: Navigation ---
    function goTo(viewName, id) {
        clearAll();
        [homeView, calcView, postView, adminLoginView, adminDashboardView, adminEditorView].forEach(v => {
            if(v) v.classList.remove('active');
        });
        
        if (viewName === 'home') {
            homeView.classList.add('active');
            document.title = "테슬라번 (Teslaburn) — 미래를 계산하다";
        } else if (viewName === 'post') {
            postView.classList.add('active');
            renderPost(id);
        } else if (viewName === 'calc') {
            calcView.classList.add('active');
            startUI(id);
        } else if (viewName === 'admin-login') {
            adminLoginView.classList.add('active');
        } else if (viewName === 'admin-dashboard') {
            adminDashboardView.classList.add('active');
            renderAdminPostList();
        } else if (viewName === 'admin-editor') {
            adminEditorView.classList.add('active');
            initQuill();
            if (id) loadPostToEditor(id); else resetEditor();
        }
        window.scrollTo(0, 0);
    }

    function renderPost(id) {
        var post = posts[id];
        if (!post) { goTo('home'); return; }
        postTitle.textContent = post.title;
        postMeta.textContent = (post.category || '기타') + " • " + post.date;
        postContent.innerHTML = post.content;
        document.title = post.title + " - " + baseTitle;
        
        if (post.relatedCalc && post.relatedCalc !== 'none') {
            goToCalcBtn.style.display = 'block';
            goToCalcBtn.onclick = function() { goTo('calc', post.relatedCalc); };
        } else {
            goToCalcBtn.style.display = 'none';
        }
    }

    function startUI(id) {
        var cfg = book[id];
        if (!cfg) { console.error('Calc not found', id); goTo('home'); return; }
        
        var calcTitle = document.getElementById('calc-title');
        var calcInputs = document.getElementById('calc-inputs');
        var calcResults = document.getElementById('calc-results');
        var calcInfoBox = document.getElementById('calc-info-box');
        var shareArea = document.getElementById('share-area');

        calcTitle.textContent = cfg.title;
        if (calcInfoBox) {
            calcInfoBox.innerHTML = `<h4>${cfg.descTitle || cfg.title}</h4><p>${cfg.description || ''}</p>`;
        }

        calcInputs.innerHTML = cfg.inputs.map(i => `
            <div class="input-group">
                <label>${i.label}</label>
                <input type="number" id="${i.id}" value="${i.value}">
            </div>
        `).join('') + '<button class="calc-btn" id="run-calc">데이터 분석 실행</button>';

        document.getElementById('run-calc').onclick = function() {
            var vals = {};
            cfg.inputs.forEach(i => { vals[i.id] = parseFloat(document.getElementById(i.id).value) || 0; });
            var out = cfg.run(vals);
            
            calcResults.innerHTML = out.items.map(item => `
                <div class="result-item">
                    <span class="result-label">${item.label}</span>
                    <span class="result-value">${item.val}</span>
                </div>
            `).join('');
            
            if (out.chart) draw(out.chart);
            if (shareArea) shareArea.style.display = 'block';
        };
    }

    function draw(c) {
        var wrapper = document.querySelector('.chart-wrapper');
        if (wrapper) wrapper.style.display = 'block';
        var ctx = document.getElementById('calc-chart').getContext('2d');
        if (currentChart) currentChart.destroy();
        currentChart = new Chart(ctx, {
            type: c.type,
            data: {
                labels: c.labels,
                datasets: [{
                    data: c.data,
                    backgroundColor: ['#38bdf8', '#e11d48', '#818cf8', '#fbbf24'],
                    borderWidth: 0
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#94a3b8' } } } }
        });
    }

    function renderAdminPostList() {
        var list = document.getElementById('admin-post-list');
        list.innerHTML = Object.keys(posts).map(id => `
            <tr>
                <td>${posts[id].title}</td>
                <td>${posts[id].category}</td>
                <td>${posts[id].date}</td>
                <td>
                    <button class="edit-btn" onclick="window.dispatchEdit('${id}')">수정</button>
                    <button class="delete-btn" onclick="window.dispatchDelete('${id}')">삭제</button>
                </td>
            </tr>
        `).join('');
    }

    window.dispatchEdit = id => goTo('admin-editor', id);
    window.dispatchDelete = id => { if(confirm('삭제할까요?')) { delete posts[id]; renderAdminPostList(); } };

    function initQuill() {
        if (!quill) {
            quill = new Quill('#quill-editor', { theme: 'snow', modules: { toolbar: [[{header:[1,2,3,false]}],['bold','italic','underline'],['link','image','code-block']] } });
        }
    }

    function resetEditor() {
        currentEditingId = null;
        document.getElementById('post-title-input').value = '';
        if (quill) quill.root.innerHTML = '';
    }

    function loadPostToEditor(id) {
        currentEditingId = id;
        var p = posts[id];
        document.getElementById('post-title-input').value = p.title;
        if (quill) quill.root.innerHTML = p.content;
    }

    function clearAll() {
        if (currentChart) { currentChart.destroy(); currentChart = null; }
        var res = document.getElementById('calc-results');
        if (res) res.innerHTML = '<div class="placeholder-msg">정보를 입력하고 분석 버튼을 눌러주세요.</div>';
        var wrapper = document.querySelector('.chart-wrapper');
        if (wrapper) wrapper.style.display = 'none';
    }

    // --- Events ---
    document.body.addEventListener('click', function(e) {
        var post = e.target.closest('[data-post]');
        if (post) return goTo('post', post.getAttribute('data-post'));
        var calc = e.target.closest('[data-calc]');
        if (calc) return goTo('calc', calc.getAttribute('data-calc'));
        if (e.target.closest('[data-page="home"]')) return goTo('home');
        if (e.target.closest('[data-page="admin-login"]')) return goTo('admin-login');
    });

    document.getElementById('login-btn').onclick = function() {
        if (document.getElementById('admin-password').value === '6877') goTo('admin-dashboard');
        else alert('비밀번호 오류');
    };

    document.getElementById('go-to-new-post').onclick = () => goTo('admin-editor');
    document.getElementById('save-post-btn').onclick = function() {
        var id = currentEditingId || 'post-' + Date.now();
        posts[id] = {
            title: document.getElementById('post-title-input').value,
            content: quill.root.innerHTML,
            date: new Date().toLocaleDateString(),
            category: document.getElementById('post-category-input').value,
            relatedCalc: document.getElementById('post-calc-input').value
        };
        alert('저장되었습니다.');
        goTo('admin-dashboard');
    };

    backBtns.forEach(btn => btn.onclick = () => goTo('home'));

    if (themeBtn) {
        themeBtn.onclick = function() {
            var isDark = document.body.getAttribute('data-theme') !== 'light';
            document.body.setAttribute('data-theme', isDark ? 'light' : 'dark');
        };
    }
});

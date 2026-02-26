document.addEventListener('DOMContentLoaded', function() {
    var homeView = document.getElementById('home-view');
    var postView = document.getElementById('post-view');
    var adminLoginView = document.getElementById('admin-login-view');
    var adminDashboardView = document.getElementById('admin-dashboard-view');
    var adminEditorView = document.getElementById('admin-editor-view');
    
    var postTitle = document.getElementById('post-title');
    var postMetaCat = document.getElementById('post-meta-cat');
    var postContent = document.getElementById('post-content');
    var postDateDisplay = document.getElementById('post-date');
    var embeddedCalcArea = document.getElementById('embedded-calc-area');

    var currentChart = null;
    var quill = null;
    var currentEditingId = null;

    // --- 1. DATA PERSISTENCE (Tistory Migrated Data) ---
    var defaultPosts = {
        'post-1': {
            title: 'AI 전력부족 시대, GE 버노바(GE Vernova) 주식 지금 볼 만한가?',
            category: '에너지',
            date: '2026. 02. 13',
            summary: 'AI 인프라의 핵심은 이제 전력입니다. 일론 머스크와 젠슨 황이 경고한 전력 부족 사태, 그 수혜주로 꼽히는 GE 버노바를 분석합니다.',
            thumb: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=600',
            relatedCalc: 'rate-analysis',
            content: `
                <h3>AI의 심장은 전력입니다</h3>
                <p>데이터 센터 하나를 짓는 데 수조 원이 들지만, 그 안을 채우는 AI 칩보다 더 중요한 것이 있습니다. 바로 이를 구동할 '전기'와 이를 안전하게 전달할 '전력 인프라'입니다.</p>
                <p>GE 버노바는 전 세계 발전량의 약 30%에 관여하는 압도적인 인프라 기업입니다. 현재 변압기 하나를 주문하면 인도받기까지 2년이 넘게 걸리는 유례없는 호황을 맞이하고 있습니다.</p>
                <h3>투자 포인트</h3>
                <ul>
                    <li>글로벌 전력 인프라 교체 주기 도래</li>
                    <li>AI 데이터 센터향 전력 수요 폭증</li>
                    <li>수익성 높은 서비스 계약 비중 증가</li>
                </ul>
            `
        },
        'post-2': {
            title: '자율주행에서 휴머노이드까지: 테슬라가 실세계 데이터와 시뮬로 AI를 키우는 법',
            category: '테슬라',
            date: '2026. 02. 11',
            summary: '테슬라의 AI 학습은 도로 위 자동차를 넘어 인간 형태의 로봇 옵티머스로 확장되고 있습니다. 데이터의 선순환 구조를 알아봅니다.',
            thumb: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600',
            relatedCalc: 'son-salary',
            content: `
                <h3>데이터의 물리적 확산</h3>
                <p>테슬라 AI의 강력함은 '실세계 데이터'에서 나옵니다. FSD를 통해 수집된 도로 데이터는 단순히 자율주행에만 쓰이지 않습니다. 물리적 공간을 인식하는 테슬라의 AI 모델은 이제 옵티머스 로봇에게 전이되고 있습니다.</p>
                <p>로봇이 계단을 오르고 물건을 집는 행위는 도로 위에서 차량이 장애물을 피하는 것과 수학적으로 동일한 원리를 공유합니다. 이것이 테슬라를 단순한 자동차 회사가 아닌 로봇 기업으로 부르는 이유입니다.</p>
            `
        },
        'post-3': {
            title: '일론 머스크 달 도시 선언, 화성 포기 아닌 AI 전력 공장?',
            category: 'AI/로봇',
            date: '2026. 02. 09',
            summary: '머스크가 최근 달 식민지 건설을 화성보다 우선순위에 두었습니다. 그 이면에는 지구의 전력 부족을 해결하기 위한 AI 인프라 전략이 숨어있을지 모릅니다.',
            thumb: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=600',
            relatedCalc: 'coin-tax',
            content: `
                <h3>우주 기반의 에너지 전략</h3>
                <p>지구상에서 데이터 센터를 무한정 늘리기에는 전력 공급과 환경 규제의 벽이 높습니다. 머스크의 달 기지 선언은 화성으로 가기 위한 중간 기지 역할도 있지만, 태양광 효율이 압도적으로 높은 달에 AI 데이터 센터와 전력 생산 시설을 구축하려는 장기 포석일 수 있습니다.</p>
            `
        },
        'post-4': {
            title: '테슬라 모델 S·X 단종이 진짜 무서운 이유: 프리몬트가 옵티머스 공장이 된다... 2편',
            category: '테슬라',
            date: '2026. 02. 05',
            summary: '전설적인 모델 S와 X의 단종. 이는 테슬라가 제조 패러다임을 차량에서 로봇으로 100% 전환하고 있다는 명확한 신호입니다.',
            thumb: 'https://images.unsplash.com/photo-1558444458-5cd00bb12f1d?w=600',
            relatedCalc: 'car-vs-taxi',
            content: `
                <h3>프리몬트의 대변혁</h3>
                <p>전 세계에서 가장 효율적인 자동차 공장 중 하나인 프리몬트. 이곳에서 고가의 세단인 모델 S와 X 라인을 철거하고 있습니다. 그 빈자리를 채우는 것은 수만 명의 노동력을 대체할 '옵티머스 로봇'의 대량 생산 라인입니다.</p>
                <p>차량 판매 수익보다 로봇 서비스 수익이 압도적으로 커지는 시점이 테슬라의 퀀텀 점프가 될 것입니다.</p>
            `
        },
        'post-5': {
            title: '테슬라 모델 S·X 단종이 진짜 무서운 이유: 프리몬트가 옵티머스 공장이 된다... 1편',
            category: '테슬라',
            date: '2026. 02. 04',
            summary: '모델 S와 X는 테슬라의 시작이었습니다. 그러나 이제 그들은 과거와 결별하고 진정한 AI 기업으로 거듭나려 합니다.',
            thumb: 'https://images.unsplash.com/photo-1617791160536-598cf32026fb?w=600',
            relatedCalc: 'salary',
            content: `
                <h3>성공과의 결별</h3>
                <p>테슬라는 가장 잘 팔리고 상징적인 모델들을 단종시킴으로써 제조 단가를 극적으로 낮추고, 모든 리소스를 자율 로봇 플랫폼에 집중하고 있습니다. 이는 생존을 위한 변화가 아닌, 시장을 지배하기 위한 공격적인 재편입니다.</p>
            `
        }
    };

    function loadPosts() {
        var saved = localStorage.getItem('teslaburn_posts_v3');
        return saved ? JSON.parse(saved) : defaultPosts;
    }
    function savePosts() {
        localStorage.setItem('teslaburn_posts_v3', JSON.stringify(posts));
    }
    var posts = loadPosts();

    // --- 2. CALCULATOR ENGINE ---
    var won = v => isNaN(v) ? '0원' : new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(Math.round(v));
    var book = {
        'salary': { title: '2026 연봉 실수령액 분석기', inputs: [{ id: 's1', label: '세전 연봉', value: 50000000 }, { id: 's2', label: '비과세 식대(월)', value: 200000 }], run: d => { var net = (d.s1 / 12) * 0.84; return { items: [{ label: '월 예상 실수령액', val: '<strong>' + won(net) + '</strong>' }], chart: { type: 'pie', labels: ['실수령', '공제액'], data: [84, 16] } }; } },
        'car-vs-taxi': { title: '테슬라 소유 vs 로보택시 비용 비교', inputs: [{ id: 'ct1', label: '차량 구매가', value: 60000000 }, { id: 'ct2', label: '월 보험료/유지비', value: 300000 }], run: d => { var monthly = (d.ct1 / 60) + d.ct2; return { items: [{ label: '월 소유 비용', val: won(monthly) }, { label: '택시 이용 가능 횟수', val: Math.floor(monthly/15000) + '회' }], chart: { type: 'bar', labels: ['자차 유지', '택시 60회'], data: [monthly, 900000] } }; } },
        'coin-tax': { title: '2026 코인 과세 시뮬레이터', inputs: [{ id: 'c1', label: '가상자산 총 수익', value: 10000000 }], run: d => { var tax = Math.max(0, d.c1 - 2500000) * 0.22; return { items: [{ label: '예상 납부 세액', val: won(tax) }, { label: '세후 순수익', val: won(d.c1 - tax) }], chart: { type: 'doughnut', labels: ['내돈', '세금'], data: [d.c1 - tax, tax] } }; } },
        'son-salary': { title: '손흥민 주급 vs 내 소득', inputs: [{ id: 'ss1', label: '내 연봉(원)', value: 40000000 }], run: d => ({ items: [{ label: '흥민 1주일 벌이', val: won(340000000) }, { label: '내가 쏜 주급 벌려면', val: (340000000/d.ss1).toFixed(1) + '년' }], chart: { type: 'bar', labels: ['나', '흥민'], data: [d.ss1/52, 340000000] } }) },
        'rate-analysis': { title: '금리 변동 분석', inputs: [{ id: 'ra1', label: '대출잔액', value: 400000000 }, { id: 'ra2', label: '현재금리', value: 4 }, { id: 'ra3', label: '인상금리', value: 6 }], run: d => ({ items: [{ label: '월 추가 이자', val: won(d.ra1*(d.ra3-d.ra2)/100/12) }], chart: { type: 'bar', labels: ['현재', '인상후'], data: [d.ra1*d.ra2/100/12, d.ra1*d.ra3/100/12] } }) }
    };

    function startEmbeddedCalc(id) {
        var cfg = book[id];
        if (!cfg) { embeddedCalcArea.style.display = 'none'; return; }
        embeddedCalcArea.style.display = 'block';
        document.getElementById('calc-title').textContent = cfg.title;
        document.getElementById('calc-inputs').innerHTML = cfg.inputs.map(i => `<div class="input-group"><label>${i.label}</label><input type="number" id="${i.id}" value="${i.value}"></div>`).join('');
        document.getElementById('run-calc').onclick = function() {
            var vals = {};
            cfg.inputs.forEach(i => { vals[i.id] = parseFloat(document.getElementById(i.id).value) || 0; });
            var out = cfg.run(vals);
            document.getElementById('calc-results').innerHTML = out.items.map(item => `<div class="result-item"><span>${item.label}</span><span>${item.val}</span></div>`).join('');
            if (out.chart) drawChart(out.chart);
        };
    }

    function drawChart(c) {
        var ctx = document.getElementById('calc-chart').getContext('2d');
        if (currentChart) currentChart.destroy();
        currentChart = new Chart(ctx, { type: c.type, data: { labels: c.labels, datasets: [{ data: c.data, backgroundColor: ['#38bdf8', '#e11d48', '#818cf8'], borderWidth: 0 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#94a3b8' } } } } });
    }

    // --- 3. VIEW TRANSITIONS ---
    function goTo(viewName, id) {
        if (currentChart) { currentChart.destroy(); currentChart = null; }
        [homeView, postView, adminLoginView, adminDashboardView, adminEditorView].forEach(v => v.classList.remove('active'));
        if (viewName === 'home') { homeView.classList.add('active'); renderHomeList(); }
        else if (viewName === 'post') { postView.classList.add('active'); renderPostDetail(id); }
        else if (viewName === 'admin-login') adminLoginView.classList.add('active');
        else if (viewName === 'admin-dashboard') { adminDashboardView.classList.add('active'); renderAdminTable(); }
        else if (viewName === 'admin-editor') { adminEditorView.classList.add('active'); initQuill(); if (id) loadEditor(id); else resetEditor(); }
        window.scrollTo(0, 0);
    }

    function renderHomeList() {
        var list = document.getElementById('main-post-list');
        var sorted = Object.keys(posts).sort((a, b) => new Date(posts[b].date) - new Date(posts[a].date));
        list.innerHTML = sorted.map(id => {
            var p = posts[id];
            return `
                <div class="post-item" onclick="window.dispatchPost('${id}')">
                    <div class="post-item-thumb" style="background-image: url('${p.thumb || 'https://images.unsplash.com/photo-1617791160536-598cf32026fb?w=600'}')"></div>
                    <div class="post-item-content">
                        <span class="cat">${p.category || '리서치'}</span>
                        <h3>${p.title}</h3>
                        <p>${p.summary || ''}</p>
                    </div>
                </div>
            `;
        }).join('');
    }
    window.dispatchPost = id => goTo('post', id);

    function renderPostDetail(id) {
        var p = posts[id]; if (!p) return goTo('home');
        postTitle.textContent = p.title;
        postMetaCat.textContent = p.category || '리서치';
        postDateDisplay.textContent = p.date;
        postContent.innerHTML = p.content;
        if (p.relatedCalc && p.relatedCalc !== 'none') startEmbeddedCalc(p.relatedCalc);
        else embeddedCalcArea.style.display = 'none';
    }

    // --- 4. ADMIN LOGIC ---
    function renderAdminTable() {
        var list = document.getElementById('admin-post-list');
        list.innerHTML = Object.keys(posts).map(id => `<tr><td>${posts[id].title}</td><td>${posts[id].date}</td><td><button class="edit-btn" onclick="window.dispatchEdit('${id}')">수정</button><button class="delete-btn" onclick="window.dispatchDelete('${id}')">삭제</button></td></tr>`).join('');
    }
    window.dispatchEdit = id => goTo('admin-editor', id);
    window.dispatchDelete = id => { if(confirm('삭제하시겠습니까?')) { delete posts[id]; savePosts(); renderAdminTable(); } };

    function initQuill() { if (!quill) quill = new Quill('#quill-editor', { theme: 'snow', modules: { toolbar: [[{header:[1,2,3,false]}],['bold','italic','underline','strike'],['blockquote','code-block'],[{'list':'ordered'},{'list':'bullet'}],['link','image','clean']] } }); }
    function resetEditor() { currentEditingId = null; document.getElementById('post-title-input').value = ''; document.getElementById('post-thumb-input').value = ''; if (quill) quill.root.innerHTML = ''; }
    function loadEditor(id) { currentEditingId = id; var p = posts[id]; document.getElementById('post-title-input').value = p.title; document.getElementById('post-thumb-input').value = p.thumb || ''; document.getElementById('post-category-input').value = p.category || '테슬라'; document.getElementById('post-calc-input').value = p.relatedCalc || 'none'; if (quill) quill.root.innerHTML = p.content; }

    // --- 5. GLOBAL EVENTS ---
    document.body.onclick = e => { var page = e.target.closest('[data-page]'); if (page) goTo(page.getAttribute('data-page')); };
    document.getElementById('login-btn').onclick = () => { if (document.getElementById('admin-password').value === '6877') goTo('admin-dashboard'); else alert('비밀번호 오류'); };
    document.getElementById('go-to-new-post').onclick = () => goTo('admin-editor');
    document.querySelectorAll('.back-btn').forEach(btn => btn.onclick = () => goTo('home'));
    document.getElementById('save-post-btn').onclick = () => {
        var id = currentEditingId || 'post-' + Date.now();
        var title = document.getElementById('post-title-input').value; if (!title) return alert('제목을 입력하세요');
        posts[id] = { title: title, content: quill.root.innerHTML, date: currentEditingId ? posts[id].date : new Date().toLocaleDateString(), category: document.getElementById('post-category-input').value, thumb: document.getElementById('post-thumb-input').value, relatedCalc: document.getElementById('post-calc-input').value, summary: quill.getText().substring(0, 150) + '...' };
        savePosts(); alert('발행 완료'); goTo('admin-dashboard');
    };

    renderHomeList();
});

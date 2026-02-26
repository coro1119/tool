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
    var postDateDisplay = document.getElementById('post-date');
    var backBtns = document.querySelectorAll('.back-btn');
    var goToCalcBtn = document.getElementById('go-to-related-calc');

    var currentChart = null;
    var baseTitle = "테슬라번 (Teslaburn)";
    var quill = null;
    var currentEditingId = null;

    // --- 1. DATA PERSISTENCE (LocalStorage) ---
    var defaultPosts = {
        'optimus-factory': {
            title: '테슬라 모델 S·X 단종이 진짜 무서운 이유: 프리몬트가 옵티머스 공장이 된다',
            category: '테슬라',
            date: '2026. 02. 26',
            summary: '단순한 라인업 정리가 아닙니다. 테슬라가 대량 생산 자율 로봇 기업으로 탈바꿈하는 선언입니다.',
            thumb: 'https://images.unsplash.com/photo-1558444458-5cd00bb12f1d?w=600',
            relatedCalc: 'son-salary',
            content: `<h3>1. 자동차 기업에서 로봇 기업으로</h3><p>일론 머스크는 이미 테슬라를 'AI와 로봇 기업'으로 정의했습니다. 모델 S/X 라인을 들어내고 그 자리를 메우는 것은 다름 아닌 인형 로봇 옵티머스(Optimus)의 대량 생산 라인입니다.</p>`
        },
        'ge-vernova': {
            title: 'AI 전력 부족 시대, GE 버노바(GE Vernova)의 가치',
            category: '에너지',
            date: '2026. 02. 13',
            summary: '변압기 하나에 2년을 기다려야 하는 시대, 전력 인프라 기업들의 실적을 분석합니다.',
            thumb: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=600',
            relatedCalc: 'rate-analysis',
            content: `<p>AI의 발전 속도를 전력 인프라가 따라가지 못하고 있습니다...</p>`
        }
    };

    function loadPosts() {
        var saved = localStorage.getItem('teslaburn_posts');
        return saved ? JSON.parse(saved) : defaultPosts;
    }

    function savePosts() {
        localStorage.setItem('teslaburn_posts', JSON.stringify(posts));
    }

    var posts = loadPosts();

    // --- 2. DYNAMIC RENDERING FOR HOME ---
    function renderHomeInsights() {
        var grid = document.getElementById('main-insight-grid');
        var heroContainer = document.getElementById('featured-post-container');
        if (!grid || !heroContainer) return;

        // Sort posts by date (newest first)
        var postIds = Object.keys(posts).sort((a, b) => {
            return new Date(posts[b].date) - new Date(posts[a].date);
        });

        if (postIds.length === 0) {
            grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; opacity: 0.5; padding: 4rem;">아직 리서치 인사이트가 없습니다.</p>';
            heroContainer.innerHTML = '';
            return;
        }

        // 1. Render Hero (Latest Post)
        var heroId = postIds[0];
        var hp = posts[heroId];
        heroContainer.innerHTML = `
            <div class="featured-insight-hero" data-post="${heroId}" style="cursor: pointer;">
                <div class="insight-badge">FEATURED INSIGHT</div>
                <h2>${hp.title}</h2>
                <p>${hp.summary || '최신 리서치 내용을 확인해 보세요.'}</p>
                <button class="read-post-btn">인사이트 읽기 & 가치 분석 →</button>
            </div>
        `;

        // 2. Render Grid (Others - Skip first one if needed, or show all)
        grid.innerHTML = postIds.slice(1).map(id => {
            var p = posts[id];
            return `
                <div class="insight-card" data-post="${id}">
                    <div class="insight-thumb" style="background-image: url('${p.thumb || 'https://images.unsplash.com/photo-1617791160536-598cf32026fb?w=600'}')"></div>
                    <div class="insight-body">
                        <span class="insight-tag">#${p.category}</span>
                        <h4>${p.title}</h4>
                        <p>${p.summary || ''}</p>
                    </div>
                </div>
            `;
        }).join('');
    }

    // --- 3. NAVIGATION & VIEW LOGIC ---
    function goTo(viewName, id) {
        clearAll();
        [homeView, calcView, postView, adminLoginView, adminDashboardView, adminEditorView].forEach(v => {
            if(v) v.classList.remove('active');
        });
        
        if (viewName === 'home') {
            homeView.classList.add('active');
            renderHomeInsights();
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
        postMeta.textContent = post.category || '기타';
        postDateDisplay.textContent = post.date;
        postContent.innerHTML = post.content;
        document.title = post.title + " - " + baseTitle;
        
        if (post.relatedCalc && post.relatedCalc !== 'none') {
            goToCalcBtn.style.display = 'block';
            goToCalcBtn.onclick = function() { goTo('calc', post.relatedCalc); };
        } else {
            goToCalcBtn.style.display = 'none';
        }
    }

    // --- 4. ADMIN & EDITOR LOGIC ---
    function renderAdminPostList() {
        var list = document.getElementById('admin-post-list');
        if (!list) return;
        // Sort by date newest
        var postIds = Object.keys(posts).sort((a, b) => new Date(posts[b].date) - new Date(posts[a].date));
        
        list.innerHTML = postIds.map(id => `
            <tr>
                <td>${posts[id].title}</td>
                <td><span class="insight-tag">${posts[id].category}</span></td>
                <td style="font-family: monospace; font-size: 0.8rem; opacity: 0.7;">${posts[id].date}</td>
                <td>
                    <div style="display: flex; gap: 8px;">
                        <button class="edit-btn" onclick="window.dispatchEdit('${id}')">수정</button>
                        <button class="delete-btn" onclick="window.dispatchDelete('${id}')">삭제</button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    window.dispatchEdit = id => goTo('admin-editor', id);
    window.dispatchDelete = id => { 
        if(confirm('이 리서치를 삭제할까요?')) { 
            delete posts[id]; 
            savePosts(); // Save to local storage
            renderAdminPostList(); 
        } 
    };

    function initQuill() {
        if (!quill) {
            quill = new Quill('#quill-editor', {
                theme: 'snow',
                modules: { toolbar: [[{header:[1,2,3,false]}],['bold','italic','underline','strike'],['blockquote','code-block'],[{'list':'ordered'},{'list':'bullet'}],['link','image','clean']] }
            });
        }
    }

    function resetEditor() {
        currentEditingId = null;
        document.getElementById('post-title-input').value = '';
        document.getElementById('post-thumb-input').value = '';
        document.getElementById('post-summary-input').value = '';
        if (quill) quill.root.innerHTML = '';
    }

    function loadPostToEditor(id) {
        currentEditingId = id;
        var p = posts[id];
        document.getElementById('post-title-input').value = p.title;
        document.getElementById('post-thumb-input').value = p.thumb || '';
        document.getElementById('post-summary-input').value = p.summary || '';
        document.getElementById('post-category-input').value = p.category || '테슬라';
        document.getElementById('post-calc-input').value = p.relatedCalc || 'none';
        if (quill) quill.root.innerHTML = p.content;
    }

    // --- 5. EVENT HANDLERS ---
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
        else alert('권한이 없습니다.');
    };

    document.getElementById('go-to-new-post').onclick = () => goTo('admin-editor');
    document.getElementById('cancel-edit-btn').onclick = () => goTo('admin-dashboard');
    
    document.getElementById('save-post-btn').onclick = function() {
        var id = currentEditingId || 'post-' + Date.now();
        var title = document.getElementById('post-title-input').value;
        if (!title) { alert('제목을 입력하세요.'); return; }

        posts[id] = {
            title: title,
            content: quill.root.innerHTML,
            date: currentEditingId ? posts[id].date : new Date().toLocaleDateString(),
            category: document.getElementById('post-category-input').value,
            summary: document.getElementById('post-summary-input').value,
            thumb: document.getElementById('post-thumb-input').value,
            relatedCalc: document.getElementById('post-calc-input').value
        };
        
        savePosts(); // Save to LocalStorage
        alert('발행되었습니다.');
        goTo('admin-dashboard');
    };

    backBtns.forEach(btn => btn.onclick = () => goTo('home'));

    // --- 6. CALCULATOR LOGIC (Restored) ---
    var won = v => isNaN(v) ? '0원' : new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(Math.round(v));
    var book = {
        'salary': { title: '2026 연봉 실수령액', inputs: [{ id: 's1', label: '세전 연봉', value: 50000000 }, { id: 's2', label: '식대', value: 200000 }], run: d => ({ items: [{ label: '월 예상 수령액', val: '<strong>' + won(d.s1/12*0.85) + '</strong>' }], chart: { type: 'pie', labels: ['실수령', '공제'], data: [85, 15] } }) },
        'car-vs-taxi': { title: '테슬라 vs 택시 VIP', inputs: [{ id: 'ct1', label: '차량 가격', value: 60000000 }, { id: 'ct2', label: '유지비', value: 300000 }], run: d => ({ items: [{ label: '월 예상 유지비', val: won(d.ct1/60 + d.ct2) }], chart: { type: 'bar', labels: ['자차 유지비', '택시 60회'], data: [d.ct1/60+d.ct2, 900000] } }) },
        'coin-tax': { title: '2026 코인 과세', inputs: [{ id: 'c1', label: '수익', value: 10000000 }], run: d => ({ items: [{ label: '예상 세금(22%)', val: won(d.c1*0.22) }], chart: { type: 'doughnut', labels: ['내돈', '나라돈'], data: [78, 22] } }) },
        'son-salary': { title: '손흥민 vs 나', inputs: [{ id: 'ss1', label: '내 연봉', value: 40000000 }], run: d => ({ items: [{ label: '흥민 주급', val: won(340000000) }], chart: { type: 'bar', labels: ['나', '흥민'], data: [d.ss1/52, 340000000] } }) },
        'rate-analysis': { title: '금리 변동 분석', inputs: [{ id: 'ra1', label: '대출잔액', value: 400000000 }, { id: 'ra2', label: '현재금리', value: 4 }, { id: 'ra3', label: '인상금리', value: 6 }], run: d => ({ items: [{ label: '월 추가 이자', val: won(d.ra1*(d.ra3-d.ra2)/100/12) }], chart: { type: 'bar', labels: ['현재', '인상후'], data: [d.ra1*d.ra2/100/12, d.ra1*d.ra3/100/12] } }) }
    };

    function startUI(id) {
        var cfg = book[id];
        if (!cfg) return;
        document.getElementById('calc-title').textContent = cfg.title;
        document.getElementById('calc-inputs').innerHTML = cfg.inputs.map(i => `<div class="input-group"><label>${i.label}</label><input type="number" id="${i.id}" value="${i.value}"></div>`).join('') + '<button class="calc-btn" id="run-calc">데이터 분석 실행</button>';
        document.getElementById('run-calc').onclick = function() {
            var vals = {};
            cfg.inputs.forEach(i => { vals[i.id] = parseFloat(document.getElementById(i.id).value) || 0; });
            var out = cfg.run(vals);
            document.getElementById('calc-results').innerHTML = out.items.map(item => `<div class="result-item"><span class="result-label">${item.label}</span><span class="result-value">${item.val}</span></div>`).join('');
            if (out.chart) draw(out.chart);
            document.getElementById('share-area').style.display = 'block';
        };
    }

    function draw(c) {
        document.querySelector('.chart-wrapper').style.display = 'block';
        var ctx = document.getElementById('calc-chart').getContext('2d');
        if (currentChart) currentChart.destroy();
        currentChart = new Chart(ctx, { type: c.type, data: { labels: c.labels, datasets: [{ data: c.data, backgroundColor: ['#38bdf8', '#e11d48', '#818cf8', '#fbbf24'], borderWidth: 0 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#94a3b8' } } } } });
    }

    function clearAll() {
        if (currentChart) { currentChart.destroy(); currentChart = null; }
        var res = document.getElementById('calc-results'); if (res) res.innerHTML = '';
        document.querySelector('.chart-wrapper').style.display = 'none';
    }

    // Initialize Home
    renderHomeInsights();

    // Theme Toggle
    if (themeBtn) {
        themeBtn.onclick = function() {
            var isDark = document.body.getAttribute('data-theme') !== 'light';
            document.body.setAttribute('data-theme', isDark ? 'light' : 'dark');
        };
    }
});

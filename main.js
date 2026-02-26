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

    // --- 1. DATA PERSISTENCE ---
    var defaultPosts = {
        'tesla-fsd-future': {
            title: '테슬라 FSD v13이 가져올 로봇택시 경제학',
            category: '테슬라',
            date: '2026. 02. 26',
            summary: '자율주행 기술의 정점, FSD v13의 배포가 시작되었습니다. 이제 자동차는 단순한 이동수단을 넘어 수익을 창출하는 자산이 됩니다. 그 경제적 가치를 분석합니다.',
            thumb: 'https://images.unsplash.com/photo-1558444458-5cd00bb12f1d?w=600',
            relatedCalc: 'car-vs-taxi',
            content: `
                <h3>로보택시, 소유의 종말</h3>
                <p>테슬라의 자율주행 기술은 이제 인간의 개입이 거의 필요 없는 수준에 도달했습니다. 일론 머스크는 '모델 3' 한 대가 연간 3만 달러 이상의 수익을 낼 것이라고 주장합니다.</p>
                <p>하지만 실제 유지비와 로보택시 서비스 이용 비용을 비교해 보면 어떨까요? 아래 도구를 통해 직접 계산해 보세요.</p>
            `
        },
        'salary-2026-update': {
            title: '2026년 연봉 실수령액 가이드: 무엇이 달라졌나?',
            category: '거시경제',
            date: '2026. 02. 20',
            summary: '2026년 최신 세법 개정안을 반영한 연봉 실수령액 표입니다. 내 월급에서 공제되는 항목들을 상세히 짚어봅니다.',
            thumb: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600',
            relatedCalc: 'salary',
            content: `<h3>세금은 늘고, 월급은 그대로?</h3><p>국민연금 상한액 인상과 건강보험 요율 변동으로 인해 많은 직장인들이 체감하는 월급이 줄어들고 있습니다. 정확한 시뮬레이션이 필요한 시점입니다.</p>`
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
        'salary': {
            title: '2026 연봉 실수령액 분석기',
            inputs: [{ id: 's1', label: '세전 연봉', value: 50000000 }, { id: 's2', label: '비과세 식대(월)', value: 200000 }],
            run: d => {
                var net = (d.s1 / 12) * 0.84; // 단순화된 2026 요율
                return { items: [{ label: '월 예상 실수령액', val: '<strong>' + won(net) + '</strong>' }], chart: { type: 'pie', labels: ['실수령', '공제액'], data: [84, 16] } };
            }
        },
        'car-vs-taxi': {
            title: '테슬라 소유 vs 로보택시 비용 비교',
            inputs: [{ id: 'ct1', label: '차량 구매가', value: 60000000 }, { id: 'ct2', label: '월 보험료/유지비', value: 300000 }],
            run: d => {
                var monthly = (d.ct1 / 60) + d.ct2;
                return { items: [{ label: '월 소유 비용', val: won(monthly) }, { label: '택시 이용 가능 횟수', val: Math.floor(monthly/15000) + '회' }], chart: { type: 'bar', labels: ['자차 유지', '택시 60회'], data: [monthly, 900000] } };
            }
        },
        'coin-tax': {
            title: '2026 코인 과세 시뮬레이터',
            inputs: [{ id: 'c1', label: '가상자산 총 수익', value: 10000000 }],
            run: d => {
                var tax = Math.max(0, d.c1 - 2500000) * 0.22;
                return { items: [{ label: '예상 납부 세액', val: won(tax) }, { label: '세후 순수익', val: won(d.c1 - tax) }], chart: { type: 'doughnut', labels: ['내돈', '세금'], data: [d.c1 - tax, tax] } };
            }
        },
        'son-salary': {
            title: '손흥민 주급 vs 내 소득',
            inputs: [{ id: 'ss1', label: '내 연봉(원)', value: 40000000 }],
            run: d => ({ items: [{ label: '흥민 1주일 벌이', val: won(340000000) }, { label: '내가 쏜 주급 벌려면', val: (340000000/d.ss1).toFixed(1) + '년' }], chart: { type: 'bar', labels: ['나', '흥민'], data: [d.ss1/52, 340000000] } })
        }
    };

    function startEmbeddedCalc(id) {
        var cfg = book[id];
        if (!cfg) { embeddedCalcArea.style.display = 'none'; return; }
        
        embeddedCalcArea.style.display = 'block';
        document.getElementById('calc-title').textContent = cfg.title;
        var inputsHtml = cfg.inputs.map(i => `<div class="input-group"><label>${i.label}</label><input type="number" id="${i.id}" value="${i.value}"></div>`).join('');
        document.getElementById('calc-inputs').innerHTML = inputsHtml;

        document.getElementById('run-calc').onclick = function() {
            var vals = {};
            cfg.inputs.forEach(i => { vals[i.id] = parseFloat(document.getElementById(i.id).value) || 0; });
            var out = cfg.run(vals);
            document.getElementById('calc-results').innerHTML = out.items.map(item => `
                <div class="result-item"><span>${item.label}</span><span>${item.val}</span></div>
            `).join('');
            if (out.chart) drawChart(out.chart);
        };
    }

    function drawChart(c) {
        var ctx = document.getElementById('calc-chart').getContext('2d');
        if (currentChart) currentChart.destroy();
        currentChart = new Chart(ctx, {
            type: c.type,
            data: { labels: c.labels, datasets: [{ data: c.data, backgroundColor: ['#38bdf8', '#e11d48', '#818cf8'], borderWidth: 0 }] },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#94a3b8' } } } }
        });
    }

    // --- 3. VIEW TRANSITIONS ---
    function goTo(viewName, id) {
        if (currentChart) { currentChart.destroy(); currentChart = null; }
        [homeView, postView, adminLoginView, adminDashboardView, adminEditorView].forEach(v => v.classList.remove('active'));
        
        if (viewName === 'home') {
            homeView.classList.add('active');
            renderHomeList();
        } else if (viewName === 'post') {
            postView.classList.add('active');
            renderPostDetail(id);
        } else if (viewName === 'admin-login') {
            adminLoginView.classList.add('active');
        } else if (viewName === 'admin-dashboard') {
            adminDashboardView.classList.add('active');
            renderAdminTable();
        } else if (viewName === 'admin-editor') {
            adminEditorView.classList.add('active');
            initQuill();
            if (id) loadEditor(id); else resetEditor();
        }
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
        var p = posts[id];
        if (!p) return goTo('home');
        postTitle.textContent = p.title;
        postMetaCat.textContent = p.category || '리서치';
        postDateDisplay.textContent = p.date;
        postContent.innerHTML = p.content;
        
        if (p.relatedCalc && p.relatedCalc !== 'none') {
            startEmbeddedCalc(p.relatedCalc);
        } else {
            embeddedCalcArea.style.display = 'none';
        }
    }

    // --- 4. ADMIN LOGIC ---
    function renderAdminTable() {
        var list = document.getElementById('admin-post-list');
        list.innerHTML = Object.keys(posts).map(id => `
            <tr>
                <td>${posts[id].title}</td>
                <td>${posts[id].date}</td>
                <td>
                    <button class="edit-btn" onclick="window.dispatchEdit('${id}')">수정</button>
                    <button class="delete-btn" onclick="window.dispatchDelete('${id}')">삭제</button>
                </td>
            </tr>
        `).join('');
    }
    window.dispatchEdit = id => goTo('admin-editor', id);
    window.dispatchDelete = id => { if(confirm('삭제하시겠습니까?')) { delete posts[id]; savePosts(); renderAdminTable(); } };

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
        if (quill) quill.root.innerHTML = '';
    }
    function loadEditor(id) {
        currentEditingId = id;
        var p = posts[id];
        document.getElementById('post-title-input').value = p.title;
        document.getElementById('post-thumb-input').value = p.thumb || '';
        document.getElementById('post-category-input').value = p.category || '테슬라';
        document.getElementById('post-calc-input').value = p.relatedCalc || 'none';
        if (quill) quill.root.innerHTML = p.content;
    }

    // --- 5. GLOBAL EVENTS ---
    document.body.onclick = e => {
        var page = e.target.closest('[data-page]');
        if (page) goTo(page.getAttribute('data-page'));
    };

    document.getElementById('login-btn').onclick = () => {
        if (document.getElementById('admin-password').value === '6877') goTo('admin-dashboard');
        else alert('비밀번호 오류');
    };

    document.getElementById('go-to-new-post').onclick = () => goTo('admin-editor');
    document.querySelectorAll('.back-btn').forEach(btn => btn.onclick = () => goTo('home'));

    document.getElementById('save-post-btn').onclick = () => {
        var id = currentEditingId || 'post-' + Date.now();
        var title = document.getElementById('post-title-input').value;
        if (!title) return alert('제목을 입력하세요');
        
        posts[id] = {
            title: title,
            content: quill.root.innerHTML,
            date: currentEditingId ? posts[id].date : new Date().toLocaleDateString(),
            category: document.getElementById('post-category-input').value,
            thumb: document.getElementById('post-thumb-input').value,
            relatedCalc: document.getElementById('post-calc-input').value,
            summary: quill.getText().substring(0, 150) + '...'
        };
        savePosts();
        alert('발행 완료');
        goTo('admin-dashboard');
    };

    // INIT
    renderHomeList();
});

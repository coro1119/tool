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
    var currentEditingId = null; // 수정 중인 글 ID 저장

    // --- Blog Post Data ---
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
                    <li>FSD 데이터의 로봇 학습 전이</li>
                    <li>인건비 혁명을 통한 제조 단가 파괴</li>
                </ul>
                <h3>2. 경제적 임팩트: 월급의 종말?</h3>
                <p>옵티머스가 상용화되면 시간당 노동 비용은 3달러 미만으로 떨어집니다. 이는 인간 노동력의 가치를 재정의하게 될 것입니다.</p>
            `
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

    // --- UI Logic: Navigation ---
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
            if (!id) {
                resetEditor(); // 새 글 작성 모드
            } else {
                loadPostToEditor(id); // 수정 모드
            }
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

    function renderAdminPostList() {
        var list = document.getElementById('admin-post-list');
        list.innerHTML = '';
        Object.keys(posts).forEach(id => {
            var p = posts[id];
            var tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${p.title}</td>
                <td><span class="insight-tag">${p.category}</span></td>
                <td style="font-family: monospace; font-size: 0.8rem; opacity: 0.7;">${p.date}</td>
                <td>
                    <div style="display: flex; gap: 8px;">
                        <button class="edit-btn" data-id="${id}">수정</button>
                        <button class="delete-btn" data-id="${id}" style="color: var(--tesla-red);">삭제</button>
                    </div>
                </td>
            `;
            list.appendChild(tr);
        });

        // 리스트 이벤트 위임
        list.onclick = function(e) {
            var id = e.target.getAttribute('data-id');
            if (e.target.classList.contains('edit-btn')) {
                goTo('admin-editor', id);
            } else if (e.target.classList.contains('delete-btn')) {
                if (confirm('정말로 삭제하시겠습니까?')) {
                    delete posts[id];
                    renderAdminPostList();
                }
            }
        };
    }

    function initQuill() {
        if (!quill) {
            quill = new Quill('#quill-editor', {
                theme: 'snow',
                modules: {
                    toolbar: [
                        [{ 'header': [1, 2, 3, false] }],
                        ['bold', 'italic', 'underline', 'strike'],
                        ['blockquote', 'code-block'],
                        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                        ['link', 'image'],
                        ['clean']
                    ]
                }
            });
        }
    }

    function resetEditor() {
        currentEditingId = null;
        document.getElementById('editor-view-title').textContent = "새 리서치 포스팅";
        document.getElementById('post-title-input').value = '';
        document.getElementById('post-thumb-input').value = '';
        document.getElementById('post-summary-input').value = '';
        document.getElementById('post-category-input').value = '테슬라';
        document.getElementById('post-calc-input').value = 'none';
        if (quill) quill.root.innerHTML = '';
    }

    function loadPostToEditor(id) {
        currentEditingId = id;
        var p = posts[id];
        document.getElementById('editor-view-title').textContent = "인사이트 수정 중";
        document.getElementById('post-title-input').value = p.title;
        document.getElementById('post-thumb-input').value = p.thumb || '';
        document.getElementById('post-summary-input').value = p.summary || '';
        document.getElementById('post-category-input').value = p.category || '테슬라';
        document.getElementById('post-calc-input').value = p.relatedCalc || 'none';
        if (quill) quill.root.innerHTML = p.content;
    }

    function clearAll() {
        if (currentChart) { currentChart.destroy(); currentChart = null; }
        calcInputs.innerHTML = '';
        calcResults.innerHTML = '<div class="placeholder-msg">정보를 입력하고 계산하기 버튼을 눌러주세요.</div>';
        if (chartWrapper) chartWrapper.style.display = 'none';
        if (calcInfoBox) calcInfoBox.innerHTML = '';
        if (shareArea) shareArea.style.display = 'none';
    }

    // --- Admin Logic ---
    document.getElementById('login-btn').addEventListener('click', function() {
        var pw = document.getElementById('admin-password').value;
        if (pw === '6877') { // 비밀번호 변경 적용
            goTo('admin-dashboard');
        } else {
            alert('비밀번호가 틀렸습니다.');
        }
    });

    document.getElementById('go-to-new-post').addEventListener('click', function() {
        goTo('admin-editor');
    });

    document.getElementById('cancel-edit-btn').addEventListener('click', function() {
        goTo('admin-dashboard');
    });

    document.getElementById('save-post-btn').addEventListener('click', function() {
        var title = document.getElementById('post-title-input').value;
        var category = document.getElementById('post-category-input').value;
        var thumb = document.getElementById('post-thumb-input').value;
        var summary = document.getElementById('post-summary-input').value;
        var relatedCalc = document.getElementById('post-calc-input').value;
        var content = quill.root.innerHTML;

        if (!title || !content) { alert('제목과 본문을 입력하세요.'); return; }

        var id = currentEditingId || ('post-' + Date.now());
        posts[id] = {
            title: title,
            category: category,
            date: currentEditingId ? posts[id].date : new Date().toLocaleDateString(),
            summary: summary,
            thumb: thumb || 'https://images.unsplash.com/photo-1617791160536-598cf32026fb?w=600',
            relatedCalc: relatedCalc,
            content: content
        };

        alert(currentEditingId ? '수정 완료!' : '발행 완료!');
        goTo('admin-dashboard');
    });

    // --- Event Delegation ---
    document.body.addEventListener('click', function(e) {
        var postTarget = e.target.closest('[data-post]');
        if (postTarget) {
            goTo('post', postTarget.getAttribute('data-post'));
            return;
        }
        var calcTarget = e.target.closest('[data-calc]');
        if (calcTarget) {
            goTo('calc', calcTarget.getAttribute('data-calc'));
            return;
        }
        if (e.target.closest('[data-page="home"]')) { goTo('home'); return; }
        if (e.target.closest('[data-page="admin-login"]')) { goTo('admin-login'); return; }
    });

    backBtns.forEach(btn => btn.onclick = function() { goTo('home'); });

    // --- Calculator Logic (Minified for clarity) ---
    var won = v => isNaN(v) ? '0원' : new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(Math.round(v));
    
    var book = {
        'salary': { title: '2026 연봉 실수령액', inputs: [{ id: 's1', label: '세전 연봉', value: 50000000 }, { id: 's2', label: '식대', value: 200000 }], run: d => ({ items: [{ label: '월 실수령', val: won(d.s1/12*0.85) }], chart: { type: 'pie', labels: ['수령', '공제'], data: [85, 15] } }) },
        'car-vs-taxi': { title: '테슬라 vs 택시 VIP', inputs: [{ id: 'ct1', label: '차량가', value: 60000000 }, { id: 'ct2', label: '유지비', value: 300000 }], run: d => ({ items: [{ label: '월 유지비', val: won(d.ct1/60 + d.ct2) }], chart: { type: 'bar', labels: ['나', '택시'], data: [d.ct1/60+d.ct2, 900000] } }) },
        'son-salary': { title: '손흥민 vs 나', inputs: [{ id: 'ss1', label: '내 연봉', value: 40000000 }], run: d => ({ items: [{ label: '흥민 주급', val: won(340000000) }], chart: { type: 'bar', labels: ['나', '흥민'], data: [d.ss1/52, 340000000] } }) },
        'coin-tax': { title: '코인 과세 시뮬', inputs: [{ id: 'c1', label: '수익', value: 10000000 }], run: d => ({ items: [{ label: '세금(22%)', val: won(d.c1*0.22) }], chart: { type: 'doughnut', labels: ['수익', '세금'], data: [78, 22] } }) },
        'rate-analysis': { title: '금리 변동 분석', inputs: [{ id: 'ra1', label: '대출잔액', value: 100000000 }, { id: 'ra2', label: '인상(%)', value: 2 }], run: d => ({ items: [{ label: '추가이자', val: won(d.ra1*d.ra2/100/12) }], chart: { type: 'bar', labels: ['추가', '기존'], data: [d.ra1*d.ra2/100/12, 500000] } }) }
    };

    var calcInputs = document.getElementById('calc-inputs');
    var calcResults = document.getElementById('calc-results');
    var calcTitle = document.getElementById('calc-title');
    var chartWrapper = document.querySelector('.chart-wrapper');
    var shareArea = document.getElementById('share-area');

    function startUI(id) {
        var cfg = book[id];
        if (!cfg) return;
        calcTitle.textContent = cfg.title;
        calcInputs.innerHTML = cfg.inputs.map(i => `<div class="input-group"><label>${i.label}</label><input type="number" id="${i.id}" value="${i.value}"></div>`).join('') + '<button class="calc-btn" id="run-calc">계산하기</button>';
        document.getElementById('run-calc').onclick = function() {
            var vals = {};
            cfg.inputs.forEach(i => { vals[i.id] = parseFloat(document.getElementById(i.id).value); });
            var out = cfg.run(vals);
            calcResults.innerHTML = out.items.map(item => `<div class="result-item"><span>${item.label}</span><span>${item.val}</span></div>`).join('');
            if (out.chart) draw(out.chart);
            shareArea.style.display = 'block';
        };
    }

    function draw(c) {
        chartWrapper.style.display = 'block';
        var ctx = document.getElementById('calc-chart').getContext('2d');
        if (currentChart) currentChart.destroy();
        currentChart = new Chart(ctx, { type: c.type, data: { labels: c.labels, datasets: [{ data: c.data, backgroundColor: ['#38bdf8', '#e11d48', '#fbbf24'] }] }, options: { responsive: true, maintainAspectRatio: false } });
    }

    if (themeBtn) {
        themeBtn.onclick = function() {
            var current = document.body.getAttribute('data-theme');
            document.body.setAttribute('data-theme', current === 'light' ? 'dark' : 'light');
        };
    }
});

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

    var currentEditingId = null;
    var currentPostId = null;

    // --- 1. POST DATA ---
    var defaultPosts = {
        'post-1': { title: 'AI 전력부족 시대, GE 버노바(GE Vernova) 주식 지금 볼 만한가?', category: '에너지', date: '2026. 02. 13', summary: 'AI 인프라의 핵심은 이제 전력입니다. GE 버노바를 분석합니다.', thumb: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=600', content: `<h3>AI의 심장은 전력입니다</h3><p>데이터 센터 구동을 위한 '전기'와 이를 전달할 '전력 인프라'가 핵심입니다. GE 버노바는 전 세계 발전량의 30%를 담당하는 압도적인 기업입니다.</p>` },
        'post-2': { title: '자율주행에서 휴머노이드까지: 테슬라가 데이터로 AI를 키우는 법', category: '테슬라', date: '2026. 02. 11', summary: '테슬라의 AI 학습은 도로 위 자동차를 넘어 인간 형태의 로봇 옵티머스로 확장되고 있습니다.', thumb: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600', content: `<h3>데이터의 물리적 확산</h3><p>FSD 데이터는 이제 옵티머스에게 전이되고 있습니다. 로봇이 걷고 집는 행위는 도로 위 장애물 회피와 수학적으로 동일한 원리입니다.</p>` },
        'post-3': { title: '일론 머스크 달 도시 선언, 화성 포기 아닌 AI 전력 공장?', category: 'AI/로봇', date: '2026. 02. 09', summary: '머스크가 최근 달 식민지 건설을 화성보다 우선순위에 두었습니다. 그 이면에는 AI 전력 전략이 숨어있을지 모릅니다.', thumb: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=600', content: `<p>지구상의 전력 공급 한계를 넘기 위해 태양광 효율이 높은 달에 데이터 센터를 구축하려는 장기 포석일 수 있습니다.</p>` },
        'post-4': { title: '테슬라 모델 S·X 단종이 진짜 무서운 이유: 프리몬트가 옵티머스 공장이 된다... 2편', category: '테슬라', date: '2026. 02. 05', summary: '모델 S/X 단종은 테슬라가 차량에서 로봇으로 100% 전환하고 있다는 명확한 신호입니다.', thumb: 'https://images.unsplash.com/photo-1558444458-5cd00bb12f1d?w=600', content: `<p>프리몬트의 빈자리를 채우는 것은 수만 명의 노동력을 대체할 옵티머스 대량 생산 라인입니다.</p>` },
        'post-5': { title: '테슬라 모델 S·X 단종이 진짜 무서운 이유: 프리몬트가 옵티머스 공장이 된다... 1편', category: '테슬라', date: '2026. 02. 04', summary: '모델 S와 X는 테슬라의 시작이었습니다. 그러나 이제 그들은 과거와 결별하려 합니다.', thumb: 'https://images.unsplash.com/photo-1617791160536-598cf32026fb?w=600', content: `<p>가장 상징적인 모델을 단종시킴으로써 리소스를 자율 로봇 플랫폼에 집중하는 공격적인 재편입니다.</p>` }
    };

    function loadPosts() { var saved = localStorage.getItem('teslaburn_posts_v3'); return saved ? JSON.parse(saved) : defaultPosts; }
    function savePosts() { localStorage.setItem('teslaburn_posts_v3', JSON.stringify(posts)); }
    var posts = loadPosts();

    // --- 2. COMMENT LOGIC ---
    function loadComments(postId) {
        var allComments = JSON.parse(localStorage.getItem('teslaburn_comments') || '{}');
        var comments = allComments[postId] || [];
        var list = document.getElementById('comment-list');
        document.getElementById('comment-count').textContent = comments.length;
        
        list.innerHTML = comments.map((c, i) => `
            <div class="comment-item">
                <div class="comment-item-top">
                    <span class="comment-author">${c.name}</span>
                    <div style="display: flex; gap: 15px; align-items: center;">
                        <span class="comment-date">${c.date}</span>
                        <button class="comment-delete" onclick="window.dispatchDeleteComment('${postId}', ${i})">삭제</button>
                    </div>
                </div>
                <p class="comment-text">${c.body}</p>
            </div>
        `).join('');
    }

    function saveComment(postId) {
        var name = document.getElementById('comment-name').value;
        var pw = document.getElementById('comment-pw').value;
        var body = document.getElementById('comment-body').value;
        if (!name || !pw || !body) { alert('이름, 비밀번호, 내용을 모두 입력하세요.'); return; }

        var allComments = JSON.parse(localStorage.getItem('teslaburn_comments') || '{}');
        if (!allComments[postId]) allComments[postId] = [];
        allComments[postId].push({ name: name, pw: pw, body: body, date: new Date().toLocaleString() });
        localStorage.setItem('teslaburn_comments', JSON.stringify(allComments));

        document.getElementById('comment-name').value = '';
        document.getElementById('comment-pw').value = '';
        document.getElementById('comment-body').value = '';
        loadComments(postId);
    }

    window.dispatchDeleteComment = (postId, index) => {
        var pw = prompt('삭제 비밀번호를 입력하세요.');
        var allComments = JSON.parse(localStorage.getItem('teslaburn_comments') || '{}');
        if (allComments[postId][index].pw === pw) {
            allComments[postId].splice(index, 1);
            localStorage.setItem('teslaburn_comments', JSON.stringify(allComments));
            loadComments(postId);
        } else { alert('비밀번호가 틀렸습니다.'); }
    };

    // --- 3. VIEW TRANSITIONS ---
    function goTo(viewName, id) {
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
        list.innerHTML = sorted.map(id => `
            <div class="post-item" onclick="window.dispatchPost('${id}')">
                <div class="post-item-thumb" style="background-image: url('${posts[id].thumb}')"></div>
                <div class="post-item-content">
                    <span class="cat">${posts[id].category}</span>
                    <h3>${posts[id].title}</h3>
                    <p>${posts[id].summary}</p>
                </div>
            </div>
        `).join('');
    }
    window.dispatchPost = id => goTo('post', id);

    function renderPostDetail(id) {
        currentPostId = id;
        var p = posts[id]; if (!p) return goTo('home');
        postTitle.textContent = p.title;
        postMetaCat.textContent = p.category;
        postDateDisplay.textContent = p.date;
        postContent.innerHTML = p.content;
        loadComments(id);
    }

    // --- 4. ADMIN & EVENTS ---
    function renderAdminTable() {
        var list = document.getElementById('admin-post-list');
        list.innerHTML = Object.keys(posts).map(id => `<tr><td>${posts[id].title}</td><td>${posts[id].date}</td><td><button class="edit-btn" onclick="window.dispatchEdit('${id}')">수정</button><button class="delete-btn" onclick="window.dispatchDelete('${id}')">삭제</button></td></tr>`).join('');
    }
    window.dispatchEdit = id => goTo('admin-editor', id);
    window.dispatchDelete = id => { if(confirm('삭제하시겠습니까?')) { delete posts[id]; savePosts(); renderAdminTable(); } };

    function initQuill() { if (!quill) quill = new Quill('#quill-editor', { theme: 'snow', modules: { toolbar: [[{header:[1,2,3,false]}],['bold','italic','underline'],['link','image','code-block']] } }); }
    function resetEditor() { currentEditingId = null; document.getElementById('post-title-input').value = ''; document.getElementById('post-thumb-input').value = ''; if (quill) quill.root.innerHTML = ''; }
    function loadEditor(id) { currentEditingId = id; var p = posts[id]; document.getElementById('post-title-input').value = p.title; document.getElementById('post-thumb-input').value = p.thumb || ''; document.getElementById('post-category-input').value = p.category || '테슬라'; if (quill) quill.root.innerHTML = p.content; }

    document.body.onclick = e => { var page = e.target.closest('[data-page]'); if (page) goTo(page.getAttribute('data-page')); };
    document.getElementById('login-btn').onclick = () => { if (document.getElementById('admin-password').value === '6877') goTo('admin-dashboard'); else alert('비밀번호 오류'); };
    document.getElementById('go-to-new-post').onclick = () => goTo('admin-editor');
    document.querySelectorAll('.back-btn').forEach(btn => btn.onclick = () => goTo('home'));
    
    document.getElementById('submit-comment').onclick = () => saveComment(currentPostId);

    document.getElementById('save-post-btn').onclick = () => {
        var id = currentEditingId || 'post-' + Date.now();
        var title = document.getElementById('post-title-input').value; if (!title) return alert('제목을 입력하세요');
        posts[id] = { title: title, content: quill.root.innerHTML, date: currentEditingId ? posts[id].date : new Date().toLocaleDateString(), category: document.getElementById('post-category-input').value, thumb: document.getElementById('post-thumb-input').value, summary: quill.getText().substring(0, 150) + '...' };
        savePosts(); alert('발행 완료'); goTo('admin-dashboard');
    };

    renderHomeList();
});

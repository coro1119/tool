document.addEventListener('DOMContentLoaded', function() {
    // --- 0. FIREBASE INITIALIZATION ---
    const firebaseConfig = {
        apiKey: "AIzaSyCukyy8HDb_WUU1as06VmdPen3TLhtjfJQ",
        authDomain: "pdtjo-8851b.firebaseapp.com",
        projectId: "pdtjo-8851b",
        storageBucket: "pdtjo-8851b.firebasestorage.app",
        messagingSenderId: "376873682315",
        appId: "1:376873682315:web:86a58cc0845ceba6999b8e",
        measurementId: "G-4EBTV3RSLR"
    };

    if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
    const db = firebase.firestore();
    const storage = firebase.storage();

    // DOM Elements
    const views = {
        home: document.getElementById('home-view'),
        post: document.getElementById('post-view'),
        login: document.getElementById('admin-login-view'),
        dashboard: document.getElementById('admin-dashboard-view'),
        editor: document.getElementById('admin-editor-view')
    };
    
    const postDetail = {
        title: document.getElementById('post-title'),
        cat: document.getElementById('post-meta-cat'),
        content: document.getElementById('post-content'),
        date: document.getElementById('post-date')
    };

    const editorFields = {
        title: document.getElementById('post-title-input'),
        cat: document.getElementById('post-category-input'),
        thumb: document.getElementById('post-thumb-input'),
        thumbFile: document.getElementById('post-thumb-upload'),
        thumbPreview: document.getElementById('thumb-preview'),
        thumbStatus: document.getElementById('thumb-status')
    };

    let currentEditingId = null;
    let currentPostId = null;
    let quill = null;
    let posts = {};
    let currentFilter = '전체';

    // --- 0.1 IMAGE OPTIMIZATION & UPLOAD ---
    async function uploadImage(file, folder = 'uploads') {
        // Simple client-side validation
        if (file.size > 5 * 1024 * 1024) throw new Error("File size too large (max 5MB)");
        
        const fileName = `${Date.now()}_${file.name.replace(/[^a-z0-9.]/gi, '_')}`;
        const storageRef = storage.ref().child(`${folder}/${fileName}`);
        
        const metadata = { contentType: file.type };
        const snapshot = await storageRef.put(file, metadata);
        return await snapshot.ref.getDownloadURL();
    }

    // --- 1. DATA PERSISTENCE ---
    function syncPosts() {
        db.collection('posts').orderBy('updatedAt', 'desc').onSnapshot(snapshot => {
            posts = {};
            snapshot.forEach(doc => { posts[doc.id] = doc.data(); });
            renderCurrentView();
        }, err => console.error("Sync error:", err));
    }

    function renderCurrentView() {
        if (views.home.classList.contains('active')) renderHomeList();
        if (views.dashboard.classList.contains('active')) renderAdminTable();
        if (views.post.classList.contains('active') && currentPostId) renderPostDetail(currentPostId);
    }

    // --- 2. RENDERING ---
    function renderHomeList() {
        const list = document.getElementById('main-post-list');
        if (!list) return;
        
        const sortedIds = Object.keys(posts).filter(id => {
            if (currentFilter === '전체') return true;
            return posts[id].category === currentFilter;
        });

        if (sortedIds.length === 0) {
            list.innerHTML = `<div style="text-align:center; padding: 100px 0; color: var(--text-muted);">등록된 게시물이 없습니다.</div>`;
            return;
        }

        list.innerHTML = sortedIds.map(id => `
            <article class="post-item" onclick="window.dispatchPost('${id}')">
                <div class="post-item-thumb" style="background-image: url('${posts[id].thumb || ''}')"></div>
                <div class="post-item-content">
                    <span class="cat">${posts[id].category}</span>
                    <h3>${posts[id].title}</h3>
                    <p>${posts[id].summary}</p>
                </div>
            </article>
        `).join('');
    }

    window.dispatchPost = id => goTo('post', id);

    function renderPostDetail(id) {
        currentPostId = id;
        const p = posts[id];
        if (!p) return;
        postDetail.title.textContent = p.title;
        postDetail.cat.textContent = p.category;
        postDetail.date.textContent = p.date;
        postDetail.content.innerHTML = p.content;
        loadComments(id);
    }

    function renderAdminTable() {
        const list = document.getElementById('admin-post-list');
        if (!list) return;
        list.innerHTML = Object.keys(posts).map(id => `
            <tr>
                <td style="font-weight:600;">${posts[id].title}</td>
                <td style="color:var(--text-muted); font-size:0.85rem;">${posts[id].date}</td>
                <td>
                    <button class="edit-btn" onclick="window.dispatchEdit('${id}')">Edit</button>
                    <button class="delete-btn" onclick="window.dispatchDelete('${id}')">Delete</button>
                </td>
            </tr>`).join('');
    }

    window.dispatchEdit = id => goTo('editor', id);
    window.dispatchDelete = async id => {
        if (confirm('정말 삭제하시겠습니까?')) {
            try {
                await db.collection('posts').doc(id).delete();
            } catch (err) { alert("삭제 실패: " + err.message); }
        }
    };

    // --- 3. EDITOR LOGIC ---
    function initQuill() {
        if (quill) return;
        quill = new Quill('#quill-editor', {
            theme: 'snow',
            placeholder: '깊이 있는 리서치 내용을 작성하세요...',
            modules: {
                toolbar: [
                    [{ header: [1, 2, 3, false] }],
                    ['bold', 'italic', 'underline', 'strike'],
                    ['blockquote', 'code-block'],
                    [{ list: 'ordered' }, { list: 'bullet' }],
                    ['link', 'image', 'clean']
                ]
            }
        });

        quill.getModule('toolbar').addHandler('image', () => {
            const input = document.createElement('input');
            input.setAttribute('type', 'file');
            input.setAttribute('accept', 'image/*');
            input.click();
            input.onchange = async () => {
                const file = input.files[0];
                if (file) {
                    try {
                        const url = await uploadImage(file, 'posts');
                        const range = quill.getSelection();
                        quill.insertEmbed(range.index, 'image', url);
                    } catch (err) { alert('이미지 업로드 실패: ' + err.message); }
                }
            };
        });
    }

    function resetEditor() {
        currentEditingId = null;
        editorFields.title.value = '';
        editorFields.thumb.value = '';
        editorFields.thumbPreview.style.backgroundImage = 'none';
        editorFields.thumbPreview.innerHTML = '<span class="placeholder-text">Click to upload thumbnail</span>';
        editorFields.thumbStatus.textContent = 'Ready';
        if (quill) quill.root.innerHTML = '';
    }

    function loadEditor(id) {
        currentEditingId = id;
        const p = posts[id];
        if (!p) return;
        editorFields.title.value = p.title;
        editorFields.cat.value = p.category;
        editorFields.thumb.value = p.thumb || '';
        if (p.thumb) {
            editorFields.thumbPreview.style.backgroundImage = `url('${p.thumb}')`;
            editorFields.thumbPreview.innerHTML = '';
        }
        if (quill) quill.root.innerHTML = p.content || '';
    }

    // --- 4. COMMENTS ---
    function loadComments(postId) {
        db.collection('posts').doc(postId).collection('comments').orderBy('timestamp', 'asc').onSnapshot(snapshot => {
            const comments = [];
            snapshot.forEach(doc => { comments.push({ id: doc.id, ...doc.data() }); });
            document.getElementById('comment-count').textContent = comments.length;
            const list = document.getElementById('comment-list');
            if (list) {
                list.innerHTML = comments.map(c => `
                    <div class="comment-item">
                        <div class="comment-item-top">
                            <span class="comment-author">${c.name}</span>
                            <div style="display: flex; gap: 12px; align-items: center;">
                                <span class="comment-date">${c.date}</span>
                                <button class="comment-delete" onclick="window.dispatchDeleteComment('${postId}', '${c.id}', '${c.pw}')">삭제</button>
                            </div>
                        </div>
                        <p class="comment-text">${c.body}</p>
                    </div>`).join('');
            }
        });
    }

    // --- 5. EVENTS & NAVIGATION ---
    function goTo(viewName, id) {
        Object.values(views).forEach(v => v.classList.remove('active'));
        if (viewName === 'home') { views.home.classList.add('active'); renderHomeList(); }
        else if (viewName === 'post') { views.post.classList.add('active'); renderPostDetail(id); }
        else if (viewName === 'admin-login') views.login.classList.add('active');
        else if (viewName === 'dashboard') { views.dashboard.classList.add('active'); renderAdminTable(); }
        else if (viewName === 'editor') { views.editor.classList.add('active'); initQuill(); if (id) loadEditor(id); else resetEditor(); }
        window.scrollTo(0, 0);
    }

    // Global Click Delegation
    document.body.onclick = e => {
        const target = e.target.closest('[data-page]');
        if (target) {
            e.preventDefault();
            const page = target.getAttribute('data-page');
            if (page === 'home') goTo('home');
            else if (page === 'admin-login') goTo('admin-login');
        }
        
        // Category filtering
        if (e.target.classList.contains('chip') && e.target.closest('.category-chips')) {
            document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
            e.target.classList.add('active');
            currentFilter = e.target.getAttribute('data-filter') || '전체';
            renderHomeList();
        }
    };

    document.getElementById('login-btn').onclick = () => {
        if (document.getElementById('admin-password').value === '6877') goTo('dashboard');
        else alert('Password Incorrect');
    };

    document.getElementById('go-to-new-post').onclick = () => goTo('editor');
    document.querySelectorAll('.back-btn').forEach(btn => btn.onclick = () => {
        if (views.editor.classList.contains('active')) goTo('dashboard');
        else goTo('home');
    });

    // Thumbnail Preview Click
    editorFields.thumbPreview.onclick = () => editorFields.thumbFile.click();
    
    // Thumbnail Upload
    editorFields.thumbFile.onchange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            editorFields.thumbStatus.textContent = 'Uploading...';
            try {
                const url = await uploadImage(file, 'thumbs');
                editorFields.thumb.value = url;
                editorFields.thumbPreview.style.backgroundImage = `url('${url}')`;
                editorFields.thumbPreview.innerHTML = '';
                editorFields.thumbStatus.textContent = 'Complete';
            } catch (err) {
                editorFields.thumbStatus.textContent = 'Failed';
                alert('Upload Error: ' + err.message);
            }
        }
    };

    document.getElementById('save-post-btn').onclick = async function() {
        const title = editorFields.title.value;
        if (!title) return alert('Please enter a title');
        
        this.disabled = true;
        this.textContent = 'Publishing...';
        
        const id = currentEditingId || 'post-' + Date.now();
        const data = {
            title: title,
            content: quill ? quill.root.innerHTML : '',
            summary: quill ? quill.getText().substring(0, 160).replace(/\n/g, ' ') + '...' : '',
            category: editorFields.cat.value,
            thumb: editorFields.thumb.value,
            date: currentEditingId ? posts[id].date : new Date().toLocaleDateString('ko-KR', { year:'numeric', month:'2-digit', day:'2-digit' }),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        try {
            await db.collection('posts').doc(id).set(data);
            alert('게시물이 발행되었습니다.');
            goTo('dashboard');
        } catch (err) {
            alert('발행 실패: ' + err.message);
        } finally {
            this.disabled = false;
            this.textContent = 'Publish';
        }
    };

    document.getElementById('submit-comment').onclick = async () => {
        const name = document.getElementById('comment-name').value;
        const pw = document.getElementById('comment-pw').value;
        const body = document.getElementById('comment-body').value;
        if (!name || !pw || !body) return alert('모든 필드를 입력해주세요.');
        
        try {
            await db.collection('posts').doc(currentPostId).collection('comments').add({
                name, pw, body,
                date: new Date().toLocaleString(),
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
            document.getElementById('comment-name').value = '';
            document.getElementById('comment-pw').value = '';
            document.getElementById('comment-body').value = '';
        } catch (err) { alert('댓글 저장 실패: ' + err.message); }
    };

    syncPosts();
});

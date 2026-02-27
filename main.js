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

    // Initialize Firebase only once
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    const db = firebase.firestore();
    const storage = firebase.storage();

    // DOM Elements
    const homeView = document.getElementById('home-view');
    const postView = document.getElementById('post-view');
    const adminLoginView = document.getElementById('admin-login-view');
    const adminDashboardView = document.getElementById('admin-dashboard-view');
    const adminEditorView = document.getElementById('admin-editor-view');
    
    const postTitle = document.getElementById('post-title');
    const postMetaCat = document.getElementById('post-meta-cat');
    const postContent = document.getElementById('post-content');
    const postDateDisplay = document.getElementById('post-date');

    let currentEditingId = null;
    let currentPostId = null;
    let quill = null;
    let posts = {};

    // --- 0.1 IMAGE UPLOAD HELPER ---
    async function uploadImage(file, folder = 'uploads') {
        const fileName = `${Date.now()}_${file.name}`;
        const storageRef = storage.ref().child(`${folder}/${fileName}`);
        const snapshot = await storageRef.put(file);
        return await snapshot.ref.getDownloadURL();
    }

    // --- 1. DATA PERSISTENCE (Firestore) ---
    function syncPosts(callback) {
        db.collection('posts').onSnapshot(snapshot => {
            posts = {};
            snapshot.forEach(doc => { posts[doc.id] = doc.data(); });
            
            // Re-render based on current active view
            if (homeView.classList.contains('active')) renderHomeList();
            if (adminDashboardView.classList.contains('active')) renderAdminTable();
            if (postView.classList.contains('active') && currentPostId) renderPostDetail(currentPostId);
            
            if (callback) { callback(); callback = null; } // Only run callback once
        }, err => {
            console.error("Firestore sync error:", err);
        });
    }

    async function savePost(id, data) {
        return db.collection('posts').doc(id).set(data);
    }

    async function deletePost(id) {
        return db.collection('posts').doc(id).delete();
    }

    // --- 2. COMMENT LOGIC (Firestore) ---
    function loadComments(postId) {
        db.collection('posts').doc(postId).collection('comments').orderBy('timestamp', 'asc').onSnapshot(snapshot => {
            const comments = [];
            snapshot.forEach(doc => { comments.push({ id: doc.id, ...doc.data() }); });
            
            const list = document.getElementById('comment-list');
            const countSpan = document.getElementById('comment-count');
            if (countSpan) countSpan.textContent = comments.length;
            if (list) {
                list.innerHTML = comments.map(c => `
                    <div class="comment-item">
                        <div class="comment-item-top">
                            <span class="comment-author">${c.name}</span>
                            <div style="display: flex; gap: 15px; align-items: center;">
                                <span class="comment-date">${c.date}</span>
                                <button class="comment-delete" onclick="window.dispatchDeleteComment('${postId}', '${c.id}', '${c.pw}')">삭제</button>
                            </div>
                        </div>
                        <p class="comment-text">${c.body}</p>
                    </div>`).join('');
            }
        });
    }

    async function saveComment(postId) {
        const name = document.getElementById('comment-name').value;
        const pw = document.getElementById('comment-pw').value;
        const body = document.getElementById('comment-body').value;
        if (!name || !pw || !body) { alert('이름, 비밀번호, 내용을 입력하세요.'); return; }
        
        try {
            await db.collection('posts').doc(postId).collection('comments').add({
                name: name,
                pw: pw,
                body: body,
                date: new Date().toLocaleString(),
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
            document.getElementById('comment-name').value = ''; 
            document.getElementById('comment-pw').value = ''; 
            document.getElementById('comment-body').value = '';
        } catch (err) {
            console.error("Comment save error:", err);
            alert("댓글 저장에 실패했습니다.");
        }
    }

    window.dispatchDeleteComment = async (postId, commentId, correctPw) => {
        const pw = prompt('삭제 비밀번호?');
        if (pw === correctPw) {
            try {
                await db.collection('posts').doc(postId).collection('comments').doc(commentId).delete();
            } catch (err) {
                alert("삭제 실패: " + err.message);
            }
        } else if (pw !== null) {
            alert('비번 오류');
        }
    };

    // --- 3. VIEW TRANSITIONS ---
    function goTo(viewName, id) {
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
        const list = document.getElementById('main-post-list');
        if (!list) return;
        const sortedIds = Object.keys(posts).sort((a, b) => new Date(posts[b].date) - new Date(posts[a].date));
        list.innerHTML = sortedIds.map(id => `
            <div class="post-item" onclick="window.dispatchPost('${id}')">
                <div class="post-item-thumb" style="background-image: url('${posts[id].thumb || ''}')"></div>
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
        const p = posts[id]; 
        if (!p) return; // Wait for sync or return to home
        postTitle.textContent = p.title;
        postMetaCat.textContent = p.category;
        postDateDisplay.textContent = p.date;
        postContent.innerHTML = p.content;
        loadComments(id);
    }

    // --- 4. ADMIN & EVENTS ---
    function renderAdminTable() {
        const list = document.getElementById('admin-post-list');
        if (!list) return;
        list.innerHTML = Object.keys(posts).map(id => `
            <tr>
                <td>${posts[id].title}</td>
                <td>${posts[id].date}</td>
                <td>
                    <button class="edit-btn" onclick="window.dispatchEdit('${id}')">수정</button>
                    <button class="delete-btn" onclick="window.dispatchDelete('${id}')">삭제</button>
                </td>
            </tr>`).join('');
    }
    window.dispatchEdit = id => goTo('admin-editor', id);
    window.dispatchDelete = async id => { 
        if(confirm('삭제하시겠습니까?')) { 
            try {
                await deletePost(id);
            } catch (err) {
                alert("삭제 실패: " + err.message);
            }
        } 
    };

    function initQuill() {
        if (!quill) {
            quill = new Quill('#quill-editor', {
                theme: 'snow',
                placeholder: '내용을 입력하세요...',
                modules: {
                    toolbar: [
                        [{ header: [1, 2, 3, false] }],
                        ['bold', 'italic', 'underline', 'strike'],
                        ['blockquote', 'code-block'],
                        [{ list: 'ordered' }, { list: 'bullet' }],
                        ['link', 'image'],
                        ['clean']
                    ]
                }
            });

            // Custom Image Handler
            quill.getModule('toolbar').addHandler('image', () => {
                const input = document.createElement('input');
                input.setAttribute('type', 'file');
                input.setAttribute('accept', 'image/*');
                input.click();

                input.onchange = async () => {
                    const file = input.files[0];
                    if (file) {
                        const range = quill.getSelection();
                        // Show placeholder or loading?
                        try {
                            const url = await uploadImage(file, 'posts');
                            quill.insertEmbed(range.index, 'image', url);
                        } catch (err) {
                            console.error('Upload failed:', err);
                            alert('이미지 업로드에 실패했습니다.');
                        }
                    }
                };
            });
        }
    }
    
    function resetEditor() {
        currentEditingId = null;
        document.getElementById('post-title-input').value = '';
        document.getElementById('post-thumb-input').value = '';
        document.getElementById('thumb-status').textContent = '파일 없음';
        document.getElementById('post-category-input').value = '테슬라';
        if (quill) quill.root.innerHTML = '';
    }
    
    function loadEditor(id) {
        currentEditingId = id;
        const p = posts[id];
        if (!p) return;
        document.getElementById('post-title-input').value = p.title;
        document.getElementById('post-thumb-input').value = p.thumb || '';
        document.getElementById('thumb-status').textContent = p.thumb ? '기존 이미지 있음' : '파일 없음';
        document.getElementById('post-category-input').value = p.category || '테슬라';
        if (quill) quill.root.innerHTML = p.content || '';
    }

    // Global Click Delegation for navigation
    document.body.onclick = e => { 
        const page = e.target.closest('[data-page]'); 
        if (page) {
            e.preventDefault();
            goTo(page.getAttribute('data-page')); 
        }
    };

    document.getElementById('login-btn').onclick = () => { 
        if (document.getElementById('admin-password').value === '6877') goTo('admin-dashboard'); 
        else alert('비밀번호 오류'); 
    };

    document.getElementById('go-to-new-post').onclick = () => goTo('admin-editor');
    
    document.querySelectorAll('.back-btn').forEach(btn => {
        btn.onclick = () => {
            if (adminEditorView.classList.contains('active')) goTo('admin-dashboard');
            else goTo('home');
        };
    });
    
    const submitCommentBtn = document.getElementById('submit-comment');
    if (submitCommentBtn) submitCommentBtn.onclick = () => saveComment(currentPostId);

    // Thumbnail Upload Event
    const thumbUpload = document.getElementById('post-thumb-upload');
    if (thumbUpload) {
        thumbUpload.onchange = async (e) => {
            const file = e.target.files[0];
            if (file) {
                const status = document.getElementById('thumb-status');
                status.textContent = '업로드 중...';
                try {
                    const url = await uploadImage(file, 'thumbs');
                    document.getElementById('post-thumb-input').value = url;
                    status.textContent = '업로드 완료';
                } catch (err) {
                    console.error('Thumb upload failed:', err);
                    status.textContent = '실패';
                    alert('썸네일 업로드 실패: ' + err.message);
                }
            }
        };
    }

    document.getElementById('save-post-btn').onclick = async function() {
        const btn = this;
        const originalText = btn.textContent;
        const id = currentEditingId || 'post-' + Date.now();
        const title = document.getElementById('post-title-input').value;
        if (!title) return alert('제목을 입력하세요');
        
        btn.disabled = true;
        btn.textContent = '발행 중...';
        
        const content = quill ? quill.root.innerHTML : '';
        const summary = quill ? quill.getText().substring(0, 150) + '...' : '';
        
        const data = {
            title: title,
            content: content,
            date: currentEditingId ? posts[id].date : new Date().toLocaleDateString(),
            category: document.getElementById('post-category-input').value,
            thumb: document.getElementById('post-thumb-input').value,
            summary: summary,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        try {
            await savePost(id, data);
            alert('발행 완료');
            goTo('admin-dashboard');
        } catch (err) {
            console.error("Save error:", err);
            alert("발행 실패: " + err.message);
        } finally {
            btn.disabled = false;
            btn.textContent = originalText;
        }
    };

    // Initial sync
    syncPosts(() => {
        // Initial view setup if needed
    });
});

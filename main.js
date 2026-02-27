document.addEventListener('DOMContentLoaded', function() {
    // --- 0. FIREBASE INITIALIZATION ---
    const firebaseConfig = {
        apiKey: "AIzaSyBuC3zXrNa69yIX7HJRRG32RD3_OtWw2PE",
        authDomain: "blog-pro-520a6.firebaseapp.com",
        projectId: "blog-pro-520a6",
        storageBucket: "blog-pro-520a6.firebasestorage.app",
        messagingSenderId: "302282337310",
        appId: "1:302282337310:web:99f74ea92754acf798520f",
        measurementId: "G-6PM4C2YLRH"
    };

    if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
    const db = firebase.firestore();
    const storage = firebase.storage();
    const auth = firebase.auth();

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
    let isAdmin = false;

    // --- 0.1 AUTH MONITORING ---
    auth.onAuthStateChanged(user => {
        isAdmin = !!user;
        if (views.dashboard.classList.contains('active') || views.editor.classList.contains('active')) {
            if (!isAdmin) goTo('home');
        }
    });

    // --- 0.2 IMAGE OPTIMIZATION ---
    async function compressImage(file, maxWidth = 1000, quality = 0.6) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (e) => {
                const img = new Image();
                img.src = e.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let w = img.width, h = img.height;
                    if (w > maxWidth) { h = (maxWidth / w) * h; w = maxWidth; }
                    canvas.width = w; canvas.height = h;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, w, h);
                    canvas.toBlob(blob => blob ? resolve(blob) : reject("Canvas error"), 'image/jpeg', quality);
                };
            };
        });
    }

    async function uploadImage(file, folder, onProgress) {
        const maxWidth = folder === 'thumbs' ? 600 : 1000;
        const uploadFile = file.type === 'image/gif' ? file : await compressImage(file, maxWidth, 0.6);
        const fileName = `${Date.now()}_${file.name.replace(/[^a-z0-9.]/gi, '_')}`;
        const storageRef = storage.ref().child(`${folder}/${fileName}`);
        const uploadTask = storageRef.put(uploadFile);

        return new Promise((resolve, reject) => {
            uploadTask.on('state_changed', 
                s => onProgress && onProgress(Math.round((s.bytesTransferred/s.totalBytes)*100)),
                e => reject(e),
                async () => resolve(await uploadTask.snapshot.ref.getDownloadURL())
            );
        });
    }

    // --- 1. DATA SYNC ---
    function syncPosts() {
        db.collection('posts').orderBy('updatedAt', 'desc').onSnapshot(snap => {
            posts = {};
            snap.forEach(doc => posts[doc.id] = doc.data());
            renderCurrentView();
        });
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
        const filteredIds = Object.keys(posts).filter(id => currentFilter === '전체' || posts[id].category === currentFilter);
        list.innerHTML = filteredIds.length ? filteredIds.map(id => `
            <article class="post-item" onclick="window.dispatchPost('${id}')">
                <div class="post-item-thumb" style="background-image: url('${posts[id].thumb || ''}')"></div>
                <div class="post-item-content">
                    <span class="cat">${posts[id].category}</span>
                    <h3>${posts[id].title}</h3>
                    <p>${posts[id].summary}</p>
                </div>
            </article>`).join('') : '<div style="text-align:center; padding:100px 0; color:var(--text-muted);">No posts found.</div>';
    }

    window.dispatchPost = id => goTo('post', id);

    function renderPostDetail(id) {
        currentPostId = id; const p = posts[id]; if (!p) return;
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
                <td>${posts[id].title}</td>
                <td>${posts[id].date}</td>
                <td>
                    <button class="edit-btn" onclick="window.dispatchEdit('${id}')">Edit</button>
                    <button class="delete-btn" onclick="window.dispatchDelete('${id}')">Delete</button>
                </td>
            </tr>`).join('');
    }

    window.dispatchEdit = id => goTo('editor', id);
    window.dispatchDelete = async id => {
        if (isAdmin && confirm('Delete this post?')) {
            try { await db.collection('posts').doc(id).delete(); } catch(e) { alert(e.message); }
        }
    };

    // --- 3. EDITOR ---
    function initQuill() {
        if (quill) return;
        quill = new Quill('#quill-editor', {
            theme: 'snow',
            modules: { toolbar: [[{header:[1,2,3,false]}],['bold','italic','underline','strike'],['blockquote','code-block'],[{list:'ordered'},{list:'bullet'}],['link','image','clean']] }
        });
        quill.getModule('toolbar').addHandler('image', () => {
            const input = document.createElement('input'); input.type = 'file'; input.accept = 'image/*'; input.click();
            input.onchange = async () => {
                const file = input.files[0];
                if (file) {
                    const id = 'L'+Date.now();
                    const loading = document.createElement('div'); loading.id = id;
                    loading.innerHTML = `<div style="color:var(--accent); position:fixed; bottom:20px; right:20px; background:var(--bg-elevated); padding:10px; border-radius:8px; z-index:9999;">Uploading: <span id="p-${id}">0</span>%</div>`;
                    document.body.appendChild(loading);
                    try {
                        const url = await uploadImage(file, 'posts', p => document.getElementById(`p-${id}`).textContent = p);
                        loading.remove();
                        const range = quill.getSelection() || { index: quill.getLength() };
                        quill.insertEmbed(range.index, 'image', url);
                    } catch(e) { loading.remove(); alert(e.message); }
                }
            };
        });
    }

    function resetEditor() {
        currentEditingId = null; editorFields.title.value = ''; editorFields.thumb.value = '';
        editorFields.thumbPreview.style.backgroundImage = 'none';
        editorFields.thumbPreview.innerHTML = '<span class="placeholder-text">Click to upload thumbnail</span>';
        editorFields.thumbStatus.textContent = 'Ready';
        if (quill) quill.root.innerHTML = '';
    }

    function loadEditor(id) {
        currentEditingId = id; const p = posts[id]; if (!p) return;
        editorFields.title.value = p.title; editorFields.cat.value = p.category; editorFields.thumb.value = p.thumb || '';
        if (p.thumb) { editorFields.thumbPreview.style.backgroundImage = `url('${p.thumb}')`; editorFields.thumbPreview.innerHTML = ''; }
        if (quill) quill.root.innerHTML = p.content || '';
    }

    // --- 4. COMMENTS ---
    function loadComments(postId) {
        db.collection('posts').doc(postId).collection('comments').orderBy('timestamp', 'asc').onSnapshot(snap => {
            const comments = []; snap.forEach(doc => comments.push({ id: doc.id, ...doc.data() }));
            document.getElementById('comment-count').textContent = comments.length;
            const list = document.getElementById('comment-list');
            if (list) list.innerHTML = comments.map(c => `
                <div class="comment-item">
                    <div class="comment-item-top">
                        <span class="comment-author">${c.name}</span>
                        <div style="display:flex; gap:12px; align-items:center;">
                            <span class="comment-date">${c.date}</span>
                            <button class="comment-delete" onclick="window.dispatchDeleteComment('${postId}', '${c.id}', '${c.pw}')">삭제</button>
                        </div>
                    </div>
                    <p class="comment-text">${c.body}</p>
                </div>`).join('');
        });
    }

    // --- 5. NAVIGATION & ACTIONS ---
    function goTo(name, id) {
        Object.values(views).forEach(v => v.classList.remove('active'));
        if (name === 'home') { views.home.classList.add('active'); renderHomeList(); }
        else if (name === 'post') { views.post.classList.add('active'); renderPostDetail(id); }
        else if (name === 'admin-login') views.login.classList.add('active');
        else if (name === 'dashboard' && isAdmin) { views.dashboard.classList.add('active'); renderAdminTable(); }
        else if (name === 'editor' && isAdmin) { views.editor.classList.add('active'); initQuill(); if (id) loadEditor(id); else resetEditor(); }
        else { views.home.classList.add('active'); }
        window.scrollTo(0, 0);
    }

    // --- SECRET ENTRANCE ---
    let logoClicks = 0;
    let lastClickTime = 0;
    document.getElementById('main-logo').addEventListener('click', (e) => {
        const currentTime = new Date().getTime();
        if (currentTime - lastClickTime > 1500) {
            logoClicks = 0; // Reset if clicks are too far apart
        }
        logoClicks++;
        lastClickTime = currentTime;
        
        console.log(`Logo clicked ${logoClicks} times`); // Debugging
        
        if (logoClicks >= 3) {
            logoClicks = 0;
            if (isAdmin) goTo('dashboard'); 
            else goTo('admin-login');
        }
    });

    document.body.onclick = e => {
        const t = e.target.closest('[data-page]');
        if (t) { e.preventDefault(); goTo(t.getAttribute('data-page')); }
        if (e.target.classList.contains('chip')) {
            document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
            e.target.classList.add('active');
            currentFilter = e.target.getAttribute('data-filter') || '전체';
            renderHomeList();
        }
    };

    document.getElementById('login-btn').onclick = async () => {
        const email = document.getElementById('admin-email').value;
        const pw = document.getElementById('admin-password').value;
        try {
            await auth.signInWithEmailAndPassword(email, pw);
            goTo('dashboard');
        } catch(e) { alert("Login failed: " + e.message); }
    };

    document.getElementById('logout-btn').onclick = () => auth.signOut().then(() => goTo('home'));
    document.getElementById('go-to-new-post').onclick = () => goTo('editor');
    document.querySelectorAll('.back-btn').forEach(btn => btn.onclick = () => views.editor.classList.contains('active') ? goTo('dashboard') : goTo('home'));

    editorFields.thumbPreview.onclick = () => editorFields.thumbFile.click();
    editorFields.thumbFile.onchange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            editorFields.thumbStatus.textContent = 'Uploading...';
            try {
                const url = await uploadImage(file, 'thumbs', p => editorFields.thumbStatus.textContent = `Uploading ${p}%`);
                editorFields.thumb.value = url;
                editorFields.thumbPreview.style.backgroundImage = `url('${url}')`;
                editorFields.thumbPreview.innerHTML = '';
                editorFields.thumbStatus.textContent = 'Ready';
            } catch (e) { editorFields.thumbStatus.textContent = 'Error'; alert(e.message); }
        }
    };

    document.getElementById('save-post-btn').onclick = async function() {
        if (!isAdmin) return;
        const title = editorFields.title.value; if (!title) return alert('Title required');
        this.disabled = true; this.textContent = 'Publishing...';
        const id = currentEditingId || 'post-' + Date.now();
        const data = {
            title, content: quill.root.innerHTML,
            summary: quill.getText().substring(0, 160).replace(/\n/g, ' ') + '...',
            category: editorFields.cat.value, thumb: editorFields.thumb.value,
            date: currentEditingId ? posts[id].date : new Date().toLocaleDateString('ko-KR'),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        try { await db.collection('posts').doc(id).set(data); alert('Published!'); goTo('dashboard'); }
        catch (e) { alert(e.message); } finally { this.disabled = false; this.textContent = 'Publish'; }
    };

    document.getElementById('submit-comment').onclick = async () => {
        const name = document.getElementById('comment-name').value;
        const pw = document.getElementById('comment-pw').value;
        const body = document.getElementById('comment-body').value;
        if (!name || !pw || !body) return alert('All fields required');
        try {
            await db.collection('posts').doc(currentPostId).collection('comments').add({
                name, pw, body, date: new Date().toLocaleString(),
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
            document.getElementById('comment-name').value = '';
            document.getElementById('comment-pw').value = '';
            document.getElementById('comment-body').value = '';
        } catch (e) { alert(e.message); }
    };

    syncPosts();
});

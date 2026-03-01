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

    // Enable Offline Persistence
    db.enablePersistence({ synchronizeTabs: true }).catch(err => {
        if (err.code === 'failed-precondition') console.warn("Persistence failed: Multiple tabs open");
        else if (err.code === 'unimplemented') console.warn("Persistence not available");
    });

    // DOM Elements
    const views = {
        home: document.getElementById('home-view'),
        post: document.getElementById('post-view'),
        contact: document.getElementById('contact-view'),
        about: document.getElementById('about-view'),
        privacy: document.getElementById('privacy-view'),
        login: document.getElementById('admin-login-view'),
        dashboard: document.getElementById('admin-dashboard-view'),
        editor: document.getElementById('admin-editor-view')
    };
    
    const postDetail = {
        title: document.getElementById('post-title'),
        cat: document.getElementById('post-meta-cat'),
        content: document.getElementById('post-content'),
        date: document.getElementById('post-date'),
        readingTime: document.getElementById('post-reading-time')
    };

    const editorFields = {
        title: document.getElementById('post-title-input'),
        cat: document.getElementById('post-category-input'),
        thumb: document.getElementById('post-thumb-input'),
        thumbFile: document.getElementById('post-thumb-upload'),
        thumbPreview: document.getElementById('thumb-preview'),
        thumbStatus: document.getElementById('thumb-status')
    };

    const lightbox = document.getElementById('lightbox');
    const lightboxImg = lightbox ? lightbox.querySelector('img') : null;

    let currentEditingId = null;
    let currentPostId = null;
    let quill = null;
    let posts = {};
    let currentFilter = '전체';
    let searchQuery = '';
    let isAdmin = false;
    let isInitialLoad = true;

    // --- 0.1 SEO & GLOBAL UTILS ---
    function generateSlug(text) {
        return text.toString().toLowerCase()
            .replace(/\s+/g, '-')           
            .replace(/[^\wㄱ-ㅎㅏ-ㅣ가-힣\-]+/g, '') 
            .replace(/\-\-+/g, '-')         
            .replace(/^-+/, '')             
            .replace(/-+$/, '');            
    }

    function calculateReadingTime(html) {
        const text = html.replace(/<[^>]*>/g, '');
        const wpm = 500;
        const minutes = Math.ceil(text.length / wpm);
        return minutes < 1 ? 1 : minutes;
    }

    function updateMetaTags(title, desc, thumb) {
        const siteTitle = "FinanceCalculator";
        document.title = title ? `${title} — ${siteTitle}` : `${siteTitle} — Financial & Tech Research`;
        
        const finalDesc = desc || "Strategic financial analysis and data-driven technology research by Teslaburn.";
        const setMeta = (prop, content) => {
            const el = document.querySelector(`meta[property="${prop}"]`) || document.querySelector(`meta[name="${prop}"]`);
            if (el) el.setAttribute('content', content);
        };

        setMeta("description", finalDesc);
        setMeta("og:title", title || siteTitle);
        setMeta("og:description", finalDesc);
        if (thumb) setMeta("og:image", thumb);
        setMeta("twitter:title", title || siteTitle);
        setMeta("twitter:description", finalDesc);
        if (thumb) setMeta("twitter:image", thumb);
    }

    function updateURL(viewName, id = null, title = null) {
        let path = '/';
        if (viewName === 'post' && title) path = `/post/${generateSlug(title)}`;
        else if (viewName === 'contact') path = '/contact';
        else if (viewName === 'about') path = '/about';
        else if (viewName === 'privacy') path = '/privacy';
        else if (viewName === 'admin-login') path = '/admin';
        
        if (window.location.pathname !== path) {
            window.history.pushState({view: viewName, id: id}, '', path);
        }

        let canonical = document.querySelector('link[rel="canonical"]');
        if (!canonical) {
            canonical = document.createElement('link');
            canonical.setAttribute('rel', 'canonical');
            document.head.appendChild(canonical);
        }
        const fullURL = `https://financecalculator.cloud${path === '/' ? '' : path}`;
        canonical.setAttribute('href', fullURL);
    }

    // --- 0.2 AUTH ---
    auth.onAuthStateChanged(user => {
        isAdmin = !!user;
        if ((views.dashboard.classList.contains('active') || views.editor.classList.contains('active')) && !isAdmin) goTo('home');
    });

    // --- 0.3 IMAGE HELPERS ---
    async function compressImage(file, maxWidth = 1200, quality = 0.8) {
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
                    canvas.toBlob(blob => blob ? resolve(blob) : reject("Canvas error"), 'image/webp', quality);
                };
            };
        });
    }

    async function uploadImage(file, folder, onProgress) {
        const maxWidth = folder === 'thumbs' ? 800 : 1200;
        const quality = folder === 'thumbs' ? 0.7 : 0.8;
        const uploadFile = file.type === 'image/gif' ? file : await compressImage(file, maxWidth, quality);
        const extension = file.type === 'image/gif' ? 'gif' : 'webp';
        const fileName = `${Date.now()}_${file.name.replace(/[^a-z0-9.]/gi, '_')}.${extension}`;
        const storageRef = storage.ref().child(`${folder}/${fileName}`);
        const uploadTask = storageRef.put(uploadFile, { contentType: `image/${extension}` });

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
            if (isInitialLoad) { handleInitialRouting(); isInitialLoad = false; }
            else renderCurrentView();
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
        const filteredIds = Object.keys(posts).filter(id => {
            const p = posts[id];
            const matchCategory = currentFilter === '전체' || p.category === currentFilter;
            const matchSearch = !searchQuery || p.title.toLowerCase().includes(searchQuery.toLowerCase()) || p.summary.toLowerCase().includes(searchQuery.toLowerCase());
            return matchCategory && matchSearch;
        });

        list.innerHTML = filteredIds.length ? filteredIds.map(id => {
            let thumb = posts[id].thumb || '';
            if (thumb && !thumb.startsWith('http') && !thumb.startsWith('/') && !thumb.startsWith('data:')) thumb = '/' + thumb;
            return `
            <article class="post-item" onclick="window.dispatchPost('${id}')">
                <div class="post-item-thumb" style="background-image: url('${thumb}')"></div>
                <div class="post-item-content">
                    <span class="cat">${posts[id].category}</span>
                    <h3>${posts[id].title}</h3>
                    <p>${posts[id].summary}</p>
                </div>
            </article>`;
        }).join('') : `<div style="text-align:center; padding:100px 0; color:var(--text-muted);">${searchQuery ? `'${searchQuery}' result not found.` : 'No posts found.'}</div>`;
    }

    window.dispatchPost = id => goTo('post', id);

    function renderPostDetail(id) {
        currentPostId = id; const p = posts[id]; if (!p) return;
        postDetail.title.textContent = p.title;
        postDetail.cat.textContent = p.category;
        postDetail.date.textContent = p.date;
        postDetail.content.innerHTML = p.content;
        if (postDetail.readingTime) postDetail.readingTime.textContent = `${calculateReadingTime(p.content)} min read`;
        updateMetaTags(p.title, p.summary, p.thumb);
        renderRelatedPosts(id, p.category);
        loadComments(id);

        const imgs = postDetail.content.querySelectorAll('img');
        imgs.forEach(img => {
            const src = img.getAttribute('src');
            if (src && !src.startsWith('http') && !src.startsWith('/') && !src.startsWith('data:') && !src.startsWith('blob:')) img.setAttribute('src', '/' + src);
            img.onclick = () => { if (lightbox && lightboxImg) { lightboxImg.src = img.src; lightbox.style.display = 'flex'; } };
        });
    }

    function renderRelatedPosts(currentId, category) {
        const list = document.getElementById('related-posts-list');
        const section = document.getElementById('related-posts-section');
        if (!list || !section) return;
        const relatedIds = Object.keys(posts).filter(id => id !== currentId && posts[id].category === category).slice(0, 3);
        if (relatedIds.length === 0) { section.style.display = 'none'; return; }
        section.style.display = 'block';
        list.innerHTML = relatedIds.map(id => {
            const rp = posts[id];
            let thumb = rp.thumb || '';
            if (thumb && !thumb.startsWith('http') && !thumb.startsWith('/') && !thumb.startsWith('data:')) thumb = '/' + thumb;
            return `<div class="related-item" onclick="window.dispatchPost('${id}')"><div class="related-thumb" style="background-image: url('${thumb}')"></div><div class="related-info"><span class="cat">${rp.category}</span><h5>${rp.title}</h5></div></div>`;
        }).join('');
    }

    if (lightbox) lightbox.onclick = () => lightbox.style.display = 'none';

    function renderAdminTable() {
        const list = document.getElementById('admin-post-list');
        if (!list) return;
        list.innerHTML = Object.keys(posts).map(id => `<tr><td>${posts[id].title}</td><td>${posts[id].date}</td><td><button class="edit-btn" onclick="window.dispatchEdit('${id}')">Edit</button><button class="delete-btn" onclick="window.dispatchDelete('${id}')">Delete</button></td></tr>`).join('');
    }

    window.dispatchEdit = id => goTo('editor', id);
    window.dispatchDelete = async id => { if (isAdmin && confirm('Delete this post?')) { try { await db.collection('posts').doc(id).delete(); } catch(e) { alert(e.message); } } };

    function initQuill() {
        if (quill) return;
        quill = new Quill('#quill-editor', { theme: 'snow', modules: { toolbar: [[{header:[1,2,3,false]}],['bold','italic','underline','strike'],['blockquote','code-block'],[{list:'ordered'},{list:'bullet'}],['link', 'image', 'clean']] } });
        quill.getModule('toolbar').addHandler('image', () => {
            const input = document.createElement('input'); input.type = 'file'; input.accept = 'image/*'; input.click();
            input.onchange = async () => {
                const file = input.files[0];
                if (file) {
                    const lid = 'L'+Date.now();
                    const loading = document.createElement('div'); loading.id = lid;
                    loading.innerHTML = `<div style="color:var(--accent); position:fixed; bottom:20px; right:20px; background:var(--bg-elevated); padding:10px; border-radius:8px; z-index:9999; border:1px solid var(--border);">Uploading: <span id="p-${lid}">0</span>%</div>`;
                    document.body.appendChild(loading);
                    try {
                        const url = await uploadImage(file, 'posts', p => { const pSpan = document.getElementById(`p-${lid}`); if (pSpan) pSpan.textContent = p; });
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
        
        // Safer way to load HTML into Quill to prevent data loss
        if (quill) {
            quill.clipboard.dangerouslyPasteHTML(p.content || '');
        }
    }

    function loadComments(postId) {
        db.collection('posts').doc(postId).collection('comments').orderBy('timestamp', 'asc').onSnapshot(snap => {
            const comments = []; snap.forEach(doc => comments.push({ id: doc.id, ...doc.data() }));
            const countSpan = document.getElementById('comment-count'); if (countSpan) countSpan.textContent = comments.length;
            const list = document.getElementById('comment-list');
            if (list) list.innerHTML = comments.map(c => `<div class="comment-item"><div class="comment-item-top"><span class="comment-author">${c.name}</span><div style="display:flex; gap:12px; align-items:center;"><span class="comment-date">${c.date}</span><button class="comment-delete" onclick="window.dispatchDeleteComment('${postId}', '${c.id}', '${c.pw}')">삭제</button></div></div><p class="comment-text">${c.body}</p></div>`).join('');
        });
    }

    function goTo(name, id = null, skipUpdateURL = false) {
        Object.values(views).forEach(v => { if(v) v.classList.remove('active'); });
        document.querySelectorAll('.nav-links a, .footer-right a').forEach(a => a.classList.remove('active'));
        if (name === 'home') { 
            if(views.home) views.home.classList.add('active'); renderHomeList(); 
            const homeLink = document.querySelector('[data-page="home"]'); if(homeLink) homeLink.classList.add('active');
            if(!skipUpdateURL) updateURL('home'); updateMetaTags(); 
        } else if (name === 'post') { 
            if(views.post) views.post.classList.add('active'); renderPostDetail(id); 
            if(!skipUpdateURL) updateURL('post', id, posts[id]?.title);
        } else if (name === 'contact') { 
            if(views.contact) views.contact.classList.add('active'); 
            const contactLink = document.querySelector('[data-page="contact"]'); if(contactLink) contactLink.classList.add('active');
            if(!skipUpdateURL) updateURL('contact'); updateMetaTags("Contact", "Collaboration or feedback.");
        } else if (name === 'about') {
            if(views.about) views.about.classList.add('active');
            if(!skipUpdateURL) updateURL('about'); updateMetaTags("About", "The story of FinanceCalculator.");
        } else if (name === 'privacy') {
            if(views.privacy) views.privacy.classList.add('active');
            if(!skipUpdateURL) updateURL('privacy'); updateMetaTags("Privacy Policy", "Legal information.");
        } else if (name === 'admin-login') { 
            if(views.login) views.login.classList.add('active'); if(!skipUpdateURL) updateURL('admin-login'); 
        } else if (name === 'dashboard' && isAdmin) { 
            if(views.dashboard) views.dashboard.classList.add('active'); renderAdminTable(); 
        } else if (name === 'editor' && isAdmin) { 
            if(views.editor) views.editor.classList.add('active'); initQuill(); if (id) loadEditor(id); else resetEditor(); 
        } else { 
            if(views.home) views.home.classList.add('active'); 
        }
        window.scrollTo(0, 0);
    }

    function handleInitialRouting() {
        const path = window.location.pathname;
        if (path === '/contact') goTo('contact', null, true);
        else if (path === '/about') goTo('about', null, true);
        else if (path === '/privacy') goTo('privacy', null, true);
        else if (path === '/admin') goTo('admin-login', null, true);
        else if (path.startsWith('/post/')) {
            const slug = decodeURIComponent(path.split('/').pop());
            const postId = Object.keys(posts).find(id => generateSlug(posts[id].title) === slug);
            if (postId) goTo('post', postId, true); else goTo('home', null, true);
        } else goTo('home', null, true);
    }

    window.onpopstate = (e) => { if (e.state && e.state.view) goTo(e.state.view, e.state.id, true); else handleInitialRouting(); };

    const searchInput = document.getElementById('post-search');
    if (searchInput) searchInput.addEventListener('input', (e) => { searchQuery = e.target.value; renderHomeList(); });

    setInterval(() => {
        const status = document.getElementById('lang-status');
        const google = document.querySelector('.goog-te-menu-value span:first-child');
        if (status && google) status.textContent = google.textContent.trim().includes('한국어') ? 'KR' : 'GLOBAL';
    }, 1000);

    const shareBtn = document.getElementById('share-link-btn');
    if (shareBtn) shareBtn.onclick = (e) => { e.preventDefault(); navigator.clipboard.writeText(window.location.href).then(() => alert("Link copied!")); };

    let logoClicks = 0; let lastClickTime = 0;
    const logo = document.getElementById('main-logo');
    if (logo) logo.addEventListener('click', () => {
        const now = new Date().getTime(); if (now - lastClickTime > 1500) logoClicks = 0;
        logoClicks++; lastClickTime = now; if (logoClicks >= 3) { logoClicks = 0; isAdmin ? goTo('dashboard') : goTo('admin-login'); }
    });

    document.body.onclick = e => {
        const t = e.target.closest('[data-page]'); if (t) { e.preventDefault(); goTo(t.getAttribute('data-page')); }
        if (e.target.classList.contains('chip')) {
            document.querySelectorAll('.chip').forEach(c => c.classList.remove('active')); e.target.classList.add('active');
            currentFilter = e.target.getAttribute('data-filter') || '전체'; renderHomeList();
        }
    };

    const loginBtn = document.getElementById('login-btn');
    if(loginBtn) loginBtn.onclick = async () => {
        const email = document.getElementById('admin-email').value; const pw = document.getElementById('admin-password').value;
        try { await auth.signInWithEmailAndPassword(email, pw); goTo('dashboard'); } catch(e) { alert(e.message); }
    };

    const logoutBtn = document.getElementById('logout-btn');
    if(logoutBtn) logoutBtn.onclick = () => auth.signOut().then(() => goTo('home'));
    if(document.getElementById('go-to-new-post')) document.getElementById('go-to-new-post').onclick = () => goTo('editor');
    document.querySelectorAll('.back-btn').forEach(btn => btn.onclick = () => views.editor.classList.contains('active') ? goTo('dashboard') : goTo('home'));

    const submitContact = document.getElementById('submit-contact');
    if(submitContact) submitContact.onclick = async function() {
        const name = document.getElementById('contact-name').value; const email = document.getElementById('contact-email').value; const msg = document.getElementById('contact-message').value;
        if (!name || !email || !msg) return alert("All fields required.");
        const btn = this; btn.disabled = true; btn.textContent = "Sending...";
        try {
            const res = await fetch("https://formspree.io/f/xvgzlowq", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, email, message: msg }) });
            if (res.ok) { alert("Sent!"); goTo('home'); } else throw new Error();
        } catch (err) { alert("Error."); } finally { btn.disabled = false; btn.textContent = "Send Message"; }
    };

    if (editorFields.thumbPreview) {
        editorFields.thumbPreview.onclick = () => editorFields.thumbFile.click();
        editorFields.thumbFile.onchange = async (e) => {
            const file = e.target.files[0];
            if (file) {
                editorFields.thumbStatus.textContent = 'Uploading...';
                try {
                    const url = await uploadImage(file, 'thumbs', p => editorFields.thumbStatus.textContent = `Uploading ${p}%`);
                    editorFields.thumb.value = url; editorFields.thumbPreview.style.backgroundImage = `url('${url}')`; editorFields.thumbPreview.innerHTML = ''; editorFields.thumbStatus.textContent = 'Ready';
                } catch (e) { alert(e.message); }
            }
        };
    }

    if(document.getElementById('save-post-btn')) document.getElementById('save-post-btn').onclick = async function() {
        if (!isAdmin) return; const title = editorFields.title.value; if (!title) return alert('Enter title.');
        this.disabled = true; this.textContent = 'Publishing...';
        const id = currentEditingId || 'post-' + Date.now();
        const data = { title, content: quill.root.innerHTML, summary: quill.getText().substring(0, 160).replace(/\n/g, ' ') + '...', category: editorFields.cat.value, thumb: editorFields.thumb.value, date: currentEditingId ? posts[id].date : new Date().toLocaleDateString('ko-KR'), updatedAt: firebase.firestore.FieldValue.serverTimestamp() };
        try { await db.collection('posts').doc(id).set(data); alert('Published!'); goTo('dashboard'); } catch (e) { alert(e.message); } finally { this.disabled = false; this.textContent = 'Publish'; }
    };

    if(document.getElementById('submit-comment')) document.getElementById('submit-comment').onclick = async () => {
        const name = document.getElementById('comment-name').value; const pw = document.getElementById('comment-pw').value; const body = document.getElementById('comment-body').value;
        if (!name || !pw || !body) return alert('All fields required');
        try { await db.collection('posts').doc(currentPostId).collection('comments').add({ name, pw, body, date: new Date().toLocaleString(), timestamp: firebase.firestore.FieldValue.serverTimestamp() }); document.getElementById('comment-name').value = ''; document.getElementById('comment-pw').value = ''; document.getElementById('comment-body').value = ''; } catch (e) { alert(e.message); }
    };

    syncPosts();
});

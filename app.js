let currentUser = null;
let posts = [];

document.addEventListener('DOMContentLoaded', function() {
    auth.onAuthStateChanged(user => {
        if (!user) {
            window.location.href = '1.html';
            return;
        }
        
        currentUser = user;
        loadUserData();
        loadPosts();
        setupPostForm();
    });
});

function loadUserData() {
    db.collection('users').doc(currentUser.uid).get()
        .then(doc => {
            if (doc.exists) {
                const userData = doc.data();
                document.getElementById('headerAvatar').src = userData.avatar;
                document.getElementById('currentUserAvatar').src = userData.avatar;
                localStorage.setItem('userName', userData.name);
                localStorage.setItem('userAvatar', userData.avatar);
            }
        });
}

function loadPosts() {
    const postsContainer = document.getElementById('postsContainer');
    const loadingElement = document.getElementById('loadingPosts');
    const noPostsElement = document.getElementById('noPosts');
    
    loadingElement.style.display = 'block';
    noPostsElement.style.display = 'none';
    
    db.collection('posts')
        .orderBy('createdAt', 'desc')
        .limit(20)
        .get()
        .then(snapshot => {
            loadingElement.style.display = 'none';
            postsContainer.innerHTML = '';
            
            if (snapshot.empty) {
                noPostsElement.style.display = 'block';
                return;
            }
            
            snapshot.forEach(doc => {
                const post = { id: doc.id, ...doc.data() };
                const postElement = createPostElement(post);
                postsContainer.appendChild(postElement);
            });
        })
        .catch(error => {
            console.error('Error loading posts:', error);
            loadingElement.style.display = 'none';
            alert('Gagal memuat postingan');
        });
}

function createPostElement(post) {
    const postEl = document.createElement('div');
    postEl.className = 'post';
    postEl.dataset.id = post.id;
    
    const tagsHTML = post.tags ? post.tags.map(tag => `<span class="post-tag">#${tag}</span>`).join('') : '';
    
    const codeIcon = post.language === 'css' ? 'fa-css3-alt' : 
                     post.language === 'js' ? 'fa-js' : 'fa-code';
    
    const isLiked = post.likes && post.likes.includes(currentUser.uid);
    
    postEl.innerHTML = `
        <div class="post-header">
            <div class="post-user">
                <img src="${post.userAvatar}" alt="${post.userName}">
                <div class="user-info">
                    <h4>${post.userName}</h4>
                    <span>${formatDate(post.createdAt?.toDate())}</span>
                </div>
            </div>
            <div class="post-time"></div>
        </div>
        <div class="post-content">
            <h3 class="post-title">${post.title}</h3>
            ${post.description ? `<p class="post-description">${post.description}</p>` : ''}
            ${tagsHTML ? `<div class="post-tags">${tagsHTML}</div>` : ''}
            <div class="code-preview">
                <div class="code-header">
                    <div class="code-type">
                        <i class="fab ${codeIcon}"></i>
                        <span>${post.language?.toUpperCase() || 'CODE'}</span>
                    </div>
                    <button class="download-btn" onclick="downloadCode('${post.id}')">
                        <i class="fas fa-download"></i>
                        <span>Download</span>
                    </button>
                </div>
                <pre class="code-snippet">${escapeHtml(post.code)}</pre>
            </div>
        </div>
        <div class="post-footer">
            <div class="post-stats">
                <div class="post-stat ${isLiked ? 'liked' : ''}" onclick="toggleLike('${post.id}')">
                    <i class="fas fa-heart"></i>
                    <span>${post.likes ? post.likes.length : 0}</span>
                </div>
                <div class="post-stat">
                    <i class="fas fa-download"></i>
                    <span>${post.downloads || 0}</span>
                </div>
            </div>
            <div class="post-interactions">
                <button class="interaction-btn like-btn ${isLiked ? 'liked' : ''}" onclick="toggleLike('${post.id}')">
                    <i class="fas fa-heart"></i>
                    <span>Suka</span>
                </button>
            </div>
        </div>
    `;
    
    return postEl;
}

function toggleLike(postId) {
    if (!currentUser) return;
    
    const postRef = db.collection('posts').doc(postId);
    
    postRef.get().then(doc => {
        if (doc.exists) {
            const post = doc.data();
            const likes = post.likes || [];
            const isLiked = likes.includes(currentUser.uid);
            
            if (isLiked) {
                const newLikes = likes.filter(uid => uid !== currentUser.uid);
                postRef.update({ likes: newLikes });
            } else {
                const newLikes = [...likes, currentUser.uid];
                postRef.update({ likes: newLikes });
            }
            
            loadPosts();
        }
    });
}

function downloadCode(postId) {
    const postRef = db.collection('posts').doc(postId);
    
    postRef.get().then(doc => {
        if (doc.exists) {
            const post = doc.data();
            const code = post.code;
            const language = post.language || 'txt';
            const title = post.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
            
            postRef.update({
                downloads: (post.downloads || 0) + 1
            });
            
            const blob = new Blob([code], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${title}.${language}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            loadPosts();
        }
    });
}

function setupPostForm() {
    const quickPostInput = document.getElementById('quickPost');
    if (quickPostInput) {
        quickPostInput.addEventListener('click', function() {
            window.location.href = 'post.html';
        });
    }
}

function formatDate(date) {
    if (!date) return 'Baru saja';
    
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    
    if (diffSec < 60) return 'Baru saja';
    if (diffMin < 60) return `${diffMin} menit lalu`;
    if (diffHour < 24) return `${diffHour} jam lalu`;
    if (diffDay < 7) return `${diffDay} hari lalu`;
    
    return date.toLocaleDateString('id-ID');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
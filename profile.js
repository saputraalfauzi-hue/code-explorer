let currentUser = null;
let userData = null;

document.addEventListener('DOMContentLoaded', function() {
    auth.onAuthStateChanged(user => {
        if (!user) {
            window.location.href = '1.html';
            return;
        }
        
        currentUser = user;
        loadProfile();
        setupTabs();
        setupModal();
        setupLogout();
    });
});

function loadProfile() {
    db.collection('users').doc(currentUser.uid).get()
        .then(doc => {
            if (doc.exists) {
                userData = doc.data();
                updateProfileUI(userData);
                loadUserPosts();
                loadLikedPosts();
            }
        });
}

function updateProfileUI(data) {
    document.getElementById('profileName').textContent = data.name;
    document.getElementById('profileEmail').textContent = data.email;
    document.getElementById('profileAvatar').src = data.avatar;
    
    document.getElementById('editName').value = data.name;
    document.getElementById('editBio').value = data.bio || '';
    
    const avatarOptions = document.querySelectorAll('.avatar-option');
    avatarOptions.forEach(option => {
        option.classList.remove('selected');
        if (option.dataset.avatar === data.avatar?.match(/img=(\d+)/)?.[1]) {
            option.classList.add('selected');
        }
    });
}

function loadUserPosts() {
    const container = document.getElementById('userPostsContainer');
    const noPostsElement = document.getElementById('noUserPosts');
    
    db.collection('posts')
        .where('userId', '==', currentUser.uid)
        .orderBy('createdAt', 'desc')
        .get()
        .then(snapshot => {
            container.innerHTML = '';
            
            if (snapshot.empty) {
                noPostsElement.style.display = 'block';
                document.getElementById('postCount').textContent = '0';
                return;
            }
            
            document.getElementById('postCount').textContent = snapshot.size;
            noPostsElement.style.display = 'none';
            
            snapshot.forEach(doc => {
                const post = { id: doc.id, ...doc.data() };
                const postElement = createProfilePostElement(post);
                container.appendChild(postElement);
            });
        });
}

function loadLikedPosts() {
    const container = document.getElementById('likedPostsContainer');
    const noLikedElement = document.getElementById('noLikedPosts');
    
    db.collection('posts')
        .where('likes', 'array-contains', currentUser.uid)
        .orderBy('createdAt', 'desc')
        .get()
        .then(snapshot => {
            container.innerHTML = '';
            
            if (snapshot.empty) {
                noLikedElement.style.display = 'block';
                document.getElementById('likeCount').textContent = '0';
                return;
            }
            
            document.getElementById('likeCount').textContent = snapshot.size;
            noLikedElement.style.display = 'none';
            
            snapshot.forEach(doc => {
                const post = { id: doc.id, ...doc.data() };
                const postElement = createProfilePostElement(post);
                container.appendChild(postElement);
            });
        });
}

function createProfilePostElement(post) {
    const postEl = document.createElement('div');
    postEl.className = 'post';
    
    const tagsHTML = post.tags ? post.tags.map(tag => `<span class="post-tag">#${tag}</span>`).join('') : '';
    
    postEl.innerHTML = `
        <div class="post-header">
            <div class="post-user">
                <img src="${post.userAvatar}" alt="${post.userName}">
                <div class="user-info">
                    <h4>${post.userName}</h4>
                    <span>${formatDate(post.createdAt?.toDate())}</span>
                </div>
            </div>
        </div>
        <div class="post-content">
            <h3 class="post-title">${post.title}</h3>
            ${post.description ? `<p class="post-description">${post.description}</p>` : ''}
            ${tagsHTML ? `<div class="post-tags">${tagsHTML}</div>` : ''}
            <div class="post-footer">
                <div class="post-stats">
                    <div class="post-stat">
                        <i class="fas fa-heart"></i>
                        <span>${post.likes ? post.likes.length : 0}</span>
                    </div>
                    <div class="post-stat">
                        <i class="fas fa-download"></i>
                        <span>${post.downloads || 0}</span>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    postEl.addEventListener('click', () => {
        window.location.href = 'index.html';
    });
    
    return postEl;
}

function setupTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const tabId = this.dataset.tab;
            
            tabBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === tabId + 'Tab') {
                    content.classList.add('active');
                }
            });
        });
    });
}

function setupModal() {
    const editBtn = document.getElementById('editProfileBtn');
    const closeBtn = document.getElementById('closeEditModal');
    const cancelBtn = document.getElementById('cancelEditBtn');
    const saveBtn = document.getElementById('saveProfileBtn');
    const modal = document.getElementById('editProfileModal');
    const avatarOptions = document.querySelectorAll('.avatar-option');
    
    let selectedAvatar = null;
    
    if (editBtn) {
        editBtn.addEventListener('click', function() {
            modal.style.display = 'flex';
        });
    }
    
    const closeModal = () => {
        modal.style.display = 'none';
    };
    
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
    
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal();
        }
    });
    
    avatarOptions.forEach(option => {
        option.addEventListener('click', function() {
            avatarOptions.forEach(o => o.classList.remove('selected'));
            this.classList.add('selected');
            selectedAvatar = this.dataset.avatar;
        });
    });
    
    if (saveBtn) {
        saveBtn.addEventListener('click', function() {
            const newName = document.getElementById('editName').value.trim();
            const newBio = document.getElementById('editBio').value.trim();
            
            if (!newName) {
                alert('Nama harus diisi');
                return;
            }
            
            const updates = {
                name: newName,
                bio: newBio
            };
            
            if (selectedAvatar) {
                updates.avatar = `https://i.pravatar.cc/150?img=${selectedAvatar}`;
            }
            
            showLoading();
            
            db.collection('users').doc(currentUser.uid).update(updates)
                .then(() => {
                    hideLoading();
                    loadProfile();
                    closeModal();
                    alert('Profil berhasil diperbarui!');
                })
                .catch(error => {
                    hideLoading();
                    alert('Gagal memperbarui profil: ' + error.message);
                });
        });
    }
}

function setupLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            if (confirm('Apakah Anda yakin ingin keluar?')) {
                showLoading();
                
                auth.signOut()
                    .then(() => {
                        window.location.href = '1.html';
                    })
                    .catch(error => {
                        hideLoading();
                        alert('Gagal keluar: ' + error.message);
                    });
            }
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

function showLoading() {
    const loadingOverlay = document.createElement('div');
    loadingOverlay.className = 'loading-overlay';
    loadingOverlay.innerHTML = `
        <div class="spinner"></div>
        <p>Memproses...</p>
    `;
    
    const style = document.createElement('style');
    style.textContent = `
        .loading-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.8);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 2000;
            color: white;
        }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(loadingOverlay);
}

function hideLoading() {
    const loadingOverlay = document.querySelector('.loading-overlay');
    const style = document.querySelector('style');
    
    if (loadingOverlay) loadingOverlay.remove();
    if (style) style.remove();
}
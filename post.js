let currentUser = null;

document.addEventListener('DOMContentLoaded', function() {
    auth.onAuthStateChanged(user => {
        if (!user) {
            window.location.href = '1.html';
            return;
        }
        
        currentUser = user;
        loadUserData();
        setupForm();
    });
});

function loadUserData() {
    db.collection('users').doc(currentUser.uid).get()
        .then(doc => {
            if (doc.exists) {
                const userData = doc.data();
                localStorage.setItem('userName', userData.name);
                localStorage.setItem('userAvatar', userData.avatar);
            }
        });
}

function setupForm() {
    const codeTypeBtns = document.querySelectorAll('.code-type-btn');
    const codeTextarea = document.getElementById('postCode');
    const charCount = document.getElementById('charCount');
    const submitBtn = document.getElementById('submitPostBtn');
    
    codeTypeBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            codeTypeBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });
    
    if (codeTextarea && charCount) {
        codeTextarea.addEventListener('input', function() {
            const count = this.value.length;
            charCount.textContent = `${count} karakter`;
        });
    }
    
    if (submitBtn) {
        submitBtn.addEventListener('click', submitPost);
    }
}

function submitPost() {
    const title = document.getElementById('postTitle').value.trim();
    const description = document.getElementById('postDescription').value.trim();
    const code = document.getElementById('postCode').value.trim();
    const tagsInput = document.getElementById('postTags').value.trim();
    const activeCodeType = document.querySelector('.code-type-btn.active');
    const language = activeCodeType ? activeCodeType.dataset.type : 'txt';
    
    if (!title) {
        alert('Judul kode harus diisi');
        return;
    }
    
    if (!code) {
        alert('Kode harus diisi');
        return;
    }
    
    if (title.length > 100) {
        alert('Judul maksimal 100 karakter');
        return;
    }
    
    const tags = tagsInput ? tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag) : [];
    
    showLoading();
    
    db.collection('users').doc(currentUser.uid).get()
        .then(userDoc => {
            const userData = userDoc.data();
            
            return db.collection('posts').add({
                title: title,
                description: description,
                code: code,
                language: language,
                tags: tags,
                userId: currentUser.uid,
                userName: userData.name,
                userAvatar: userData.avatar,
                likes: [],
                downloads: 0,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        })
        .then(() => {
            hideLoading();
            alert('Postingan berhasil dibuat!');
            window.location.href = 'index.html';
        })
        .catch(error => {
            hideLoading();
            console.error('Error adding post:', error);
            alert('Gagal membuat postingan: ' + error.message);
        });
}

function showLoading() {
    const submitBtn = document.getElementById('submitPostBtn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memposting...';
}

function hideLoading() {
    const submitBtn = document.getElementById('submitPostBtn');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Posting';
}
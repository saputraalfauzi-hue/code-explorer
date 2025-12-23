document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const registerLink = document.getElementById('registerLink');
    const backToLogin = document.getElementById('backToLogin');
    const loginBox = document.querySelector('.login-box');
    const registerBox = document.getElementById('registerBox');
    const togglePassword = document.getElementById('togglePassword');
    const toggleRegPassword = document.getElementById('toggleRegPassword');
    
    auth.onAuthStateChanged(user => {
        if (user && window.location.pathname.includes('1.html')) {
            window.location.href = 'index.html';
        }
    });
    
    if (togglePassword) {
        togglePassword.addEventListener('click', function() {
            const passwordInput = document.getElementById('password');
            const type = passwordInput.type === 'password' ? 'text' : 'password';
            passwordInput.type = type;
            this.classList.toggle('fa-eye');
            this.classList.toggle('fa-eye-slash');
        });
    }
    
    if (toggleRegPassword) {
        toggleRegPassword.addEventListener('click', function() {
            const passwordInput = document.getElementById('regPassword');
            const type = passwordInput.type === 'password' ? 'text' : 'password';
            passwordInput.type = type;
            this.classList.toggle('fa-eye');
            this.classList.toggle('fa-eye-slash');
        });
    }
    
    if (registerLink) {
        registerLink.addEventListener('click', function(e) {
            e.preventDefault();
            loginBox.style.display = 'none';
            registerBox.style.display = 'block';
        });
    }
    
    if (backToLogin) {
        backToLogin.addEventListener('click', function() {
            registerBox.style.display = 'none';
            loginBox.style.display = 'block';
        });
    }
    
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            if (!email || !password) {
                alert('Silakan isi semua field');
                return;
            }
            
            showLoading();
            
            auth.signInWithEmailAndPassword(email, password)
                .then(userCredential => {
                    window.location.href = 'index.html';
                })
                .catch(error => {
                    hideLoading();
                    alert('Login gagal: ' + error.message);
                });
        });
    }
    
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const fullName = document.getElementById('fullName').value;
            const email = document.getElementById('regEmail').value;
            const password = document.getElementById('regPassword').value;
            
            if (!fullName || !email || !password) {
                alert('Silakan isi semua field');
                return;
            }
            
            if (password.length < 6) {
                alert('Password minimal 6 karakter');
                return;
            }
            
            showLoading();
            
            auth.createUserWithEmailAndPassword(email, password)
                .then(userCredential => {
                    const user = userCredential.user;
                    
                    return db.collection('users').doc(user.uid).set({
                        uid: user.uid,
                        name: fullName,
                        email: email,
                        avatar: `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70) + 1}`,
                        bio: '',
                        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                        likes: []
                    });
                })
                .then(() => {
                    window.location.href = 'index.html';
                })
                .catch(error => {
                    hideLoading();
                    alert('Pendaftaran gagal: ' + error.message);
                });
        });
    }
});

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
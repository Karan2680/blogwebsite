// Admin credentials (in real app, this should be in backend)
const ADMIN_CREDENTIALS = {
    username: 'Karan55882',
    password: 'Karan@123'
};

// Check if user is logged in
function checkAuth() {
    const isLoggedIn = localStorage.getItem('adminLoggedIn');
    if (!isLoggedIn && !window.location.href.includes('login.html')) {
        window.location.href = 'login.html';
    }
}

// Handle login form
document.getElementById('loginForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    if (username === ADMIN_CREDENTIALS.username && 
        password === ADMIN_CREDENTIALS.password) {
        const token = btoa(Date.now() + username); // Simple token generation
        localStorage.setItem('adminLoggedIn', token);
        window.location.href = generateSecureAdminUrl();
    } else {
        const errorDiv = document.getElementById('loginError');
        errorDiv.textContent = 'Invalid credentials';
        errorDiv.style.display = 'block';
    }
});

// Add secure admin URL generation
function generateSecureAdminUrl() {
    const timestamp = Date.now();
    const token = localStorage.getItem('adminLoggedIn');
    return `admin.html?token=${token}&t=${timestamp}`;
}

// Add token verification
function verifyAdminToken() {
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get('token');
    const storedToken = localStorage.getItem('adminLoggedIn');
    
    if (!urlToken || urlToken !== storedToken) {
        logout();
    }
}

// Add logout functionality
function logout() {
    localStorage.removeItem('adminLoggedIn');
    window.location.href = 'login.html';
}

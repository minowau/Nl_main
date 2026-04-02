// ============================================
// Google Authentication Configuration
// ============================================
// To enable Google Sign-In:
// 1. Go to https://console.cloud.google.com/
// 2. Create a new project (or select existing)
// 3. Go to APIs & Services > Credentials
// 4. Create an OAuth 2.0 Client ID (Web application)
// 5. Add your domain to Authorized JavaScript origins
//    (e.g., http://localhost:5500 for local dev)
// 6. Replace the CLIENT_ID below with your actual client ID
// ============================================

const GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com';

let googleClient = null;

// Initialize Google Sign-In when the library loads
window.onload = function () {
  if (typeof google !== 'undefined' && google.accounts) {
    initGoogleSignIn();
  } else {
    // Retry after a short delay if the library hasn't loaded yet
    setTimeout(() => {
      if (typeof google !== 'undefined' && google.accounts) {
        initGoogleSignIn();
      }
    }, 1000);
  }
};

function initGoogleSignIn() {
  google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: handleGoogleResponse,
  });
}

function handleGoogleLogin() {
  if (GOOGLE_CLIENT_ID === 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com') {
    showToast('Please configure your Google Client ID in script.js', 'error');
    return;
  }

  if (typeof google !== 'undefined' && google.accounts) {
    google.accounts.id.prompt((notification) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        // Fallback: use popup mode
        google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: 'email profile',
          callback: (response) => {
            if (response.access_token) {
              fetchGoogleUserInfo(response.access_token);
            }
          },
        }).requestAccessToken();
      }
    });
  } else {
    showToast('Google Sign-In library not loaded. Check your internet connection.', 'error');
  }
}

function handleGoogleResponse(response) {
  // Decode the JWT credential
  const payload = decodeJwtPayload(response.credential);
  if (payload) {
    showUserInfo(payload.name, payload.email, payload.picture);
    showToast('Logged in successfully!', 'success');
  }
}

function fetchGoogleUserInfo(accessToken) {
  fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
    .then((res) => res.json())
    .then((data) => {
      showUserInfo(data.name, data.email, data.picture);
      showToast('Logged in successfully!', 'success');
    })
    .catch(() => {
      showToast('Failed to fetch user info', 'error');
    });
}

function decodeJwtPayload(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch (e) {
    return null;
  }
}

// ============================================
// Email/Password Login
// ============================================

function validateForm() {
  const email = document.getElementById('emailInput').value;
  const password = document.getElementById('passwordInput').value;
  const loginBtn = document.getElementById('loginBtn');

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const passwordValid = password.length >= 1;

  loginBtn.disabled = !(emailValid && passwordValid);
}

function handleEmailLogin() {
  const email = document.getElementById('emailInput').value;
  const password = document.getElementById('passwordInput').value;

  if (!email || !password) {
    showToast('Please fill in all fields', 'error');
    return;
  }

  // Simulated login - replace with your actual API call
  showToast('Email/password login - connect your backend API', 'error');
}

// ============================================
// UI Helpers
// ============================================

function togglePassword() {
  const input = document.getElementById('passwordInput');
  const icon = document.getElementById('eyeIcon');

  if (input.type === 'password') {
    input.type = 'text';
    icon.innerHTML = '<path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/>';
  } else {
    input.type = 'password';
    icon.innerHTML = '<path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>';
  }
}

function showUserInfo(name, email, picture) {
  document.getElementById('loginForm').style.display = 'none';
  document.getElementById('userInfo').classList.add('active');
  document.getElementById('userName').textContent = name;
  document.getElementById('userEmail').textContent = email;
  document.getElementById('userAvatar').src = picture || '';
}

function handleLogout() {
  document.getElementById('loginForm').style.display = 'block';
  document.getElementById('userInfo').classList.remove('active');
  document.getElementById('emailInput').value = '';
  document.getElementById('passwordInput').value = '';
  document.getElementById('loginBtn').disabled = true;

  if (typeof google !== 'undefined' && google.accounts) {
    google.accounts.id.disableAutoSelect();
  }

  showToast('Logged out successfully', 'success');
}

function showToast(message, type) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast ${type} show`;
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// ============================================
// Password Requirements
// ============================================

const checkIcon = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>';
const uncheckIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/></svg>';

function checkPasswordRequirements() {
  const password = document.getElementById('passwordInput').value;

  updateReqItem('reqLowercase', /[a-z]/.test(password));
  updateReqItem('reqUppercase', /[A-Z]/.test(password));
  updateReqItem('reqSpecial', /[^A-Za-z0-9]/.test(password));
  updateReqItem('reqNumber', /[0-9]/.test(password));
}

function updateReqItem(id, met) {
  const item = document.getElementById(id);
  const icon = item.querySelector('.req-icon');

  if (met) {
    item.classList.add('met');
    icon.innerHTML = checkIcon;
  } else {
    item.classList.remove('met');
    icon.innerHTML = uncheckIcon;
  }
}

function showPasswordReqs() {
  const reqs = document.getElementById('passwordReqs');
  reqs.classList.add('visible');
  checkPasswordRequirements();
}

function hidePasswordReqs() {
  setTimeout(() => {
    const reqs = document.getElementById('passwordReqs');
    reqs.classList.remove('visible');
  }, 200);
}

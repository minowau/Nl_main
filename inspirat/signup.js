// ============================================
// Signup Form Validation
// ============================================

function validateSignupForm() {
  const fullName = document.getElementById('fullNameInput').value.trim();
  const email = document.getElementById('signupEmailInput').value;
  const password = document.getElementById('signupPasswordInput').value;
  const reenterPassword = document.getElementById('reenterPasswordInput').value;
  const signupBtn = document.getElementById('signupBtn');

  const nameValid = fullName.length >= 1;
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const passwordValid = password.length >= 1;
  const passwordsMatch = password === reenterPassword && reenterPassword.length >= 1;

  signupBtn.disabled = !(nameValid && emailValid && passwordValid && passwordsMatch);
}

function handleSignup() {
  const fullName = document.getElementById('fullNameInput').value.trim();
  const email = document.getElementById('signupEmailInput').value;
  const password = document.getElementById('signupPasswordInput').value;
  const reenterPassword = document.getElementById('reenterPasswordInput').value;

  if (!fullName || !email || !password || !reenterPassword) {
    showToast('Please fill in all fields', 'error');
    return;
  }

  if (password !== reenterPassword) {
    showToast('Passwords do not match', 'error');
    return;
  }

  // Simulated signup - replace with your actual API call
  showToast('Sign up successful! Redirecting to login...', 'success');
  setTimeout(() => {
    window.location.href = 'index.html';
  }, 2000);
}

// ============================================
// Password Requirements
// ============================================

const checkIcon = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>';
const uncheckIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/></svg>';

function checkSignupPasswordReqs() {
  const password = document.getElementById('signupPasswordInput').value;

  updateSignupReqItem('signupReqLowercase', /[a-z]/.test(password));
  updateSignupReqItem('signupReqUppercase', /[A-Z]/.test(password));
  updateSignupReqItem('signupReqSpecial', /[^A-Za-z0-9]/.test(password));
  updateSignupReqItem('signupReqNumber', /[0-9]/.test(password));
}

function updateSignupReqItem(id, met) {
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

function showSignupPasswordReqs() {
  const reqs = document.getElementById('signupPasswordReqs');
  reqs.classList.add('visible');
  checkSignupPasswordReqs();
}

function hideSignupPasswordReqs() {
  setTimeout(() => {
    const reqs = document.getElementById('signupPasswordReqs');
    reqs.classList.remove('visible');
  }, 200);
}

// ============================================
// UI Helpers
// ============================================

function showToast(message, type) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast ${type} show`;
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

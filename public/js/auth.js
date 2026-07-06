/**
 * ตัวช่วย Google Identity Services (Sign in with Google)
 * ใช้ร่วมกันทั้งหน้า register.html และ admin/index.html
 */
const GoogleAuth = (function () {
  let onSignInCallback = null;
  let currentUser = null; // { email, name, picture, idToken }

  function init(onSignIn) {
    onSignInCallback = onSignIn;
    if (!window.google || !window.google.accounts) {
      console.error('Google Identity Services ยังไม่โหลด กรุณาตรวจสอบ <script src="https://accounts.google.com/gsi/client">');
      return;
    }
    google.accounts.id.initialize({
      client_id: window.APP_CONFIG.GOOGLE_CLIENT_ID,
      callback: handleCredentialResponse
    });
  }

  function handleCredentialResponse(response) {
    const idToken = response.credential;
    const payload = parseJwt_(idToken);
    currentUser = { email: payload.email, name: payload.name, picture: payload.picture, idToken: idToken };
    if (onSignInCallback) onSignInCallback(currentUser);
  }

  function renderButton(elementId, options) {
    google.accounts.id.renderButton(
      document.getElementById(elementId),
      Object.assign({ theme: 'outline', size: 'large', text: 'signin_with', shape: 'pill', locale: 'th' }, options || {})
    );
  }

  function signOut() {
    currentUser = null;
    google.accounts.id.disableAutoSelect();
  }

  function getUser() { return currentUser; }

  function parseJwt_(token) {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  }

  return { init: init, renderButton: renderButton, signOut: signOut, getUser: getUser };
})();

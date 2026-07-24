export function getAuthToken() {
  return localStorage.getItem("token") || sessionStorage.getItem("token");
}

export function saveAuthToken(token, remember = true) {
  localStorage.removeItem("token");
  sessionStorage.removeItem("token");
  (remember ? localStorage : sessionStorage).setItem("token", token);
}

export function clearAuthToken() {
  localStorage.removeItem("token");
  sessionStorage.removeItem("token");
}

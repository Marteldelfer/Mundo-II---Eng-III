/**
 * Utilitário de autenticação via cookies.
 * Usa js-cookie para persistir o token JWT e os dados básicos do usuário.
 */
import Cookies from 'js-cookie';

const TOKEN_COOKIE_NAME = 'adapted_token';
const USER_COOKIE_NAME = 'adapted_user';

/**
 * Salva token e dados do usuário em cookies.
 * @param {string} token
 * @param {{ id: number, nome: string, email: string }} usuario
 */
export function salvarAutenticacao(token, usuario) {
  Cookies.set(TOKEN_COOKIE_NAME, token, {
    expires: 7,
    sameSite: 'Lax',
    path: '/',
  });
  Cookies.set(USER_COOKIE_NAME, JSON.stringify(usuario), {
    expires: 7,
    sameSite: 'Lax',
    path: '/',
  });
}

/** @returns {string|undefined} */
export function obterToken() {
  return Cookies.get(TOKEN_COOKIE_NAME);
}

/** @returns {{ id: number, nome: string, email: string }|null} */
export function obterUsuario() {
  const dados = Cookies.get(USER_COOKIE_NAME);
  if (!dados) return null;
  try {
    return JSON.parse(dados);
  } catch {
    return null;
  }
}

/** @returns {boolean} */
export function estaAutenticado() {
  return Boolean(obterToken());
}

/** Remove token e usuário (logout). */
export function logout() {
  Cookies.remove(TOKEN_COOKIE_NAME, { path: '/' });
  Cookies.remove(USER_COOKIE_NAME, { path: '/' });
}

/**
 * Headers padrão para requisições autenticadas.
 * @returns {object}
 */
export function headersAuth() {
  const token = obterToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/**
 * Headers para requisições multipart/form-data.
 * NÃO define Content-Type — o navegador faz isso sozinho com o boundary correto.
 * @returns {object}
 */
export function headersAuthUpload() {
  const token = obterToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
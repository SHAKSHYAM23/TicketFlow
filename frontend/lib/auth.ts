export const getToken = () =>
  typeof window !== 'undefined' ? localStorage.getItem('token') : null

export const getUser = () => {
  if (typeof window === 'undefined') return null
  const user = localStorage.getItem('user')
  return user ? JSON.parse(user) : null
}

export const setAuth = (token: string, user: object) => {
  localStorage.setItem('token', token)
  localStorage.setItem('user', JSON.stringify(user))
  window.dispatchEvent(new Event('auth-change'))
}

export const clearAuth = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  window.dispatchEvent(new Event('auth-change'))
}

export const isLoggedIn = () => !!getToken()

export const isAdmin = () => getUser()?.role === 'admin'

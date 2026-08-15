const form = document.getElementById('loginForm')
const errorBox = document.getElementById('errorBox')

form.addEventListener('submit', async (e) => {
	e.preventDefault()
	errorBox.style.display = 'none'

	const email = document.getElementById('email').value
	const password = document.getElementById('password').value

	try {
		const res = await fetch('/api/auth/login', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			credentials: 'include', // важно — иначе браузер не сохранит cookie
			body: JSON.stringify({ email, password }),
		})

		const data = await res.json()

		if (!res.ok) {
			errorBox.textContent = data.error || data.message || 'Ошибка входа'
			errorBox.style.display = 'block'
			return
		}

		window.location.href = '/dashboard'
	} catch (err) {
		errorBox.textContent = 'Не удалось подключиться к серверу'
		errorBox.style.display = 'block'
	}
})
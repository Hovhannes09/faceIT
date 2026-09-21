const form = document.getElementById('registerForm')
const errorBox = document.getElementById('errorBox')
const successBox = document.getElementById('successBox')
const submitBtn = document.getElementById('submitBtn')

form.addEventListener('submit', async (e) => {
	e.preventDefault()
	errorBox.style.display = 'none'
	successBox.style.display = 'none'
	submitBtn.disabled = true

	const username = document.getElementById('username').value.trim()
	const fullName = document.getElementById('fullName').value.trim()
	const email = document.getElementById('email').value.trim()
	const password = document.getElementById('password').value

	try {
		const regRes = await fetch('/api/auth/register', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			credentials: 'include',
			body: JSON.stringify({ username, fullName, email, password }),
		})

		const regData = await regRes.json()

		if (!regRes.ok) {
			errorBox.textContent = regData.error || regData.message || 'Registration failed'
			errorBox.style.display = 'block'
			submitBtn.disabled = false
			return
		}

		successBox.textContent = window.I18N.success
		successBox.style.display = 'block'

		const loginRes = await fetch('/api/auth/login', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			credentials: 'include',
			body: JSON.stringify({ email, password }),
		})

		if (!loginRes.ok) {
			window.location.href = '/login'
			return
		}

		window.location.href = '/dashboard'
	} catch (err) {
		errorBox.textContent = 'Could not connect to server'
		errorBox.style.display = 'block'
		submitBtn.disabled = false
	}
})
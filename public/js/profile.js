const T = window.I18N
const $ = (id) => document.getElementById(id)
const AUTH = { Authorization: `Bearer ${window.APP_TOKEN}` }

const MAX_AVATAR_SIZE = 5 * 1024 * 1024 
const AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp']

function notify(el, message, ok = false) {
	el.textContent = message
	el.className = 'pf-alert ' + (ok ? 'ok' : 'err')
	el.hidden = false
}

function clear(el) {
	el.hidden = true
	el.textContent = ''
}

async function request(method, url, body) {
	const isForm = body instanceof FormData
	const res = await fetch(url, {
		method,
		headers: {
			...AUTH,
			...(body && !isForm ? { 'Content-Type': 'application/json' } : {}),
		},
		body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
	})
	const data = await res.json().catch(() => ({}))
	return { ok: res.ok, status: res.status, data }
}

function errorText(result) {
	const { data } = result
	return data.errors?.[0] || data.message || data.error || T.serverError
}

const avatarImg = $('avatarImg')
const avatarFallback = $('avatarFallback')
const avatarInput = $('avatarInput')
const avatarUploadBtn = $('avatarUploadBtn')
const avatarDeleteBtn = $('avatarDeleteBtn')
const avatarAlert = $('avatarAlert')

function showAvatar(url) {
	if (url) {
		avatarImg.src = `${url}?v=${Date.now()}`
		avatarImg.hidden = false
		avatarFallback.hidden = true
		avatarDeleteBtn.hidden = false
	} else {
		avatarImg.removeAttribute('src')
		avatarImg.hidden = true
		avatarFallback.hidden = false
		avatarDeleteBtn.hidden = true
	}
}

avatarUploadBtn.addEventListener('click', () => avatarInput.click())

avatarInput.addEventListener('change', async () => {
	const file = avatarInput.files[0]
	avatarInput.value = '' 
	if (!file) return

	clear(avatarAlert)

	if (!AVATAR_TYPES.includes(file.type)) return notify(avatarAlert, T.avatarBadType)
	if (file.size > MAX_AVATAR_SIZE) return notify(avatarAlert, T.avatarTooBig)

	const form = new FormData()
	form.append('avatar', file) 

	avatarUploadBtn.disabled = true
	try {
		const result = await request('POST', '/api/profile/avatar', form)
		if (!result.ok) return notify(avatarAlert, errorText(result))

		showAvatar(result.data.avatarUrl)
		notify(avatarAlert, T.avatarUpdated, true)
	} catch (err) {
		notify(avatarAlert, T.serverError)
	} finally {
		avatarUploadBtn.disabled = false
	}
})

avatarDeleteBtn.addEventListener('click', async () => {
	clear(avatarAlert)
	avatarDeleteBtn.disabled = true
	try {
		const result = await request('DELETE', '/api/profile/avatar')
		if (!result.ok) return notify(avatarAlert, errorText(result))

		showAvatar(null)
		notify(avatarAlert, T.avatarDeleted, true)
	} catch (err) {
		notify(avatarAlert, T.serverError)
	} finally {
		avatarDeleteBtn.disabled = false
	}
})

const profileForm = $('profileForm')
const profileAlert = $('profileAlert')
const profileSubmit = $('profileSubmit')

profileForm.addEventListener('submit', async (e) => {
	e.preventDefault()
	clear(profileAlert)

	const username = $('pfUsername').value.trim()
	const email = $('pfEmail').value.trim()
	if (!username || !email) return notify(profileAlert, T.fillAll)

	profileSubmit.disabled = true
	try {
		const result = await request('PUT', '/api/profile', { username, email })
		if (!result.ok) {
			profileSubmit.disabled = false
			return notify(profileAlert, errorText(result))
		}

		notify(profileAlert, T.profileSaved, true)
		setTimeout(() => location.reload(), 700)
	} catch (err) {
		profileSubmit.disabled = false
		notify(profileAlert, T.serverError)
	}
})

const passwordForm = $('passwordForm')
const passwordAlert = $('passwordAlert')
const passwordSubmit = $('passwordSubmit')

passwordForm.addEventListener('submit', async (e) => {
	e.preventDefault()
	clear(passwordAlert)

	const oldPassword = $('pfOldPassword').value
	const newPassword = $('pfNewPassword').value
	const confirm = $('pfConfirmPassword').value

	if (!oldPassword || !newPassword || !confirm) return notify(passwordAlert, T.fillAll)
	if (newPassword.length < 6) return notify(passwordAlert, T.passwordShort)
	if (newPassword !== confirm) return notify(passwordAlert, T.passwordMismatch)

	passwordSubmit.disabled = true
	try {
		const result = await request('PUT', '/api/auth/change-password', { oldPassword, newPassword })
		if (!result.ok) return notify(passwordAlert, errorText(result))

		passwordForm.reset()
		notify(passwordAlert, T.passwordChanged, true)
	} catch (err) {
		notify(passwordAlert, T.serverError)
	} finally {
		passwordSubmit.disabled = false
	}
})
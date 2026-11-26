// Страницы /teams и /teams/:id.
// Один скрипт на обе страницы: каждый блок работает, только если нужные элементы есть в DOM.

const T = window.I18N
const $ = (id) => document.getElementById(id)
const AUTH = { Authorization: `Bearer ${window.APP_TOKEN}` }

// ============ HELPERS ============
function notify(el, message, ok = false) {
	if (!el) return
	el.textContent = message
	el.className = el.className.replace(/\b(err|ok)\b/g, '').trim() + ' ' + (ok ? 'ok' : 'err')
	el.hidden = false
}

function clear(el) {
	if (!el) return
	el.hidden = true
	el.textContent = ''
}

// Запрос, который не падает на не-JSON ответах
async function request(method, url, body) {
	const res = await fetch(url, {
		method,
		headers: { ...AUTH, ...(body ? { 'Content-Type': 'application/json' } : {}) },
		body: body ? JSON.stringify(body) : undefined,
	})
	const data = await res.json().catch(() => ({}))
	return { ok: res.ok, data }
}

function errorText(result) {
	return result.data.errors?.[0] || result.data.message || T.serverError
}

// Находит ближайший блок для вывода ошибки: у формы — свой, у кнопок — общий
function alertFor(button) {
	return button.closest('#invitesAlert') || $('teamAlert') || $('invitesAlert')
}

// ============ СОЗДАНИЕ КОМАНДЫ ============
const createForm = $('createTeamForm')
if (createForm) {
	createForm.addEventListener('submit', async (e) => {
		e.preventDefault()
		const alertEl = $('createAlert')
		const submit = $('createSubmit')
		clear(alertEl)

		const name = $('teamName').value.trim()
		if (!name) return notify(alertEl, T.fillAll)

		submit.disabled = true
		try {
			const result = await request('POST', '/api/teams', { name })
			if (!result.ok) {
				submit.disabled = false
				return notify(alertEl, errorText(result))
			}
			window.location.href = `/teams/${result.data.team.id}`
		} catch (err) {
			submit.disabled = false
			notify(alertEl, T.serverError)
		}
	})
}

// ============ ПРИГЛАШЕНИЕ ИГРОКА (капитан) ============
const inviteForm = $('inviteForm')
if (inviteForm) {
	inviteForm.addEventListener('submit', async (e) => {
		e.preventDefault()
		const alertEl = $('inviteAlert')
		const submit = $('inviteSubmit')
		clear(alertEl)

		const username = $('inviteUsername').value.trim()
		if (!username) return notify(alertEl, T.fillAll)

		submit.disabled = true
		try {
			const result = await request('POST', `/api/teams/${inviteForm.dataset.teamId}/invite`, { username })
			if (!result.ok) {
				submit.disabled = false
				return notify(alertEl, errorText(result))
			}
			notify(alertEl, T.inviteSent, true)
			setTimeout(() => location.reload(), 700) // обновим список ожидающих приглашений
		} catch (err) {
			submit.disabled = false
			notify(alertEl, T.serverError)
		}
	})
}

// ============ КНОПКИ-ДЕЙСТВИЯ (делегирование событий) ============
document.addEventListener('click', async (e) => {
	const button = e.target.closest('[data-action]')
	if (!button) return

	const { action, id, teamId, userId } = button.dataset
	const alertEl = alertFor(button)
	clear(alertEl)

	// действие -> запрос, подтверждение и что делать после успеха
	const actions = {
		'accept-invite': {
			method: 'POST',
			url: `/api/teams/invites/${id}/accept`,
			done: (data) => (window.location.href = `/teams/${data.teamId}`),
		},
		'decline-invite': {
			method: 'POST',
			url: `/api/teams/invites/${id}/decline`,
			done: () => location.reload(),
		},
		kick: {
			method: 'DELETE',
			url: `/api/teams/${teamId}/members/${userId}`,
			confirm: T.confirmKick,
			done: () => location.reload(),
		},
		'make-captain': {
			method: 'PUT',
			url: `/api/teams/${teamId}/captain`,
			body: { userId: Number(userId) },
			confirm: T.confirmCaptain,
			done: () => location.reload(),
		},
		leave: {
			method: 'POST',
			url: `/api/teams/${teamId}/leave`,
			confirm: T.confirmLeave,
			done: () => (window.location.href = '/teams'),
		},
		'delete-team': {
			method: 'DELETE',
			url: `/api/teams/${teamId}`,
			confirm: T.confirmDelete,
			done: () => (window.location.href = '/teams'),
		},
	}

	const spec = actions[action]
	if (!spec) return
	if (spec.confirm && !window.confirm(spec.confirm)) return

	button.disabled = true
	try {
		const result = await request(spec.method, spec.url, spec.body)
		if (!result.ok) {
			button.disabled = false
			return notify(alertEl, errorText(result))
		}
		spec.done(result.data)
	} catch (err) {
		button.disabled = false
		notify(alertEl, T.serverError)
	}
})

// ============ ЖИВОЕ УВЕДОМЛЕНИЕ О ПРИГЛАШЕНИИ (только страница списка) ============
const liveBanner = $('liveBanner')
if (liveBanner && typeof io !== 'undefined') {
	const socket = io({ auth: { token: window.APP_TOKEN } })

	socket.on('team:invite', (data) => {
		$('liveText').textContent = `${T.newInvite}: ${data.teamName}`
		liveBanner.hidden = false
	})

	$('liveShow').addEventListener('click', () => location.reload())
}
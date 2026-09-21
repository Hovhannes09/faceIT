const socket = io({ auth: { token: window.APP_TOKEN } })

socket.on('queue:joined', (data) => console.log('Queue position:', data.position))
socket.on('lobby:found', (data) => {
	window.location.href = `/lobby/${data.matchId}`
})

const radar = document.getElementById('radar')
const slotsEl = document.getElementById('slots')
const slotCountEl = document.getElementById('slotCount')
const radarLabel = document.getElementById('radarLabel')
const queueBtn = document.getElementById('queueBtn')
const timerVal = document.getElementById('timerVal')

const TOTAL = 10
let filled = 0
let searching = false
let fillInterval, timerInterval, seconds = 0

for (let i = 0; i < TOTAL; i++) {
	const angle = (360 / TOTAL) * i
	const slot = document.createElement('div')
	slot.className = 'radar-slot'
	slot.style.transform = `rotate(${angle}deg) translate(0, -95px) rotate(-${angle}deg)`
	slotsEl.appendChild(slot)
}
const slotEls = document.querySelectorAll('.radar-slot')

function reset() {
	filled = 0; seconds = 0
	slotEls.forEach(s => s.classList.remove('filled'))
	slotCountEl.textContent = '0'
	timerVal.textContent = '00:00'
	radarLabel.textContent = 'Не в поиске'
	radar.classList.add('idle')
}

queueBtn.addEventListener('click', () => {
	if (searching) {
		searching = false
		clearInterval(fillInterval); clearInterval(timerInterval)
		queueBtn.classList.remove('searching')
		queueBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg> Найти игру'
		reset()
		return
	}
	searching = true
	radar.classList.remove('idle')
	radarLabel.textContent = 'Поиск...'
	queueBtn.classList.add('searching')
	queueBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M6 6l12 12M18 6L6 18"/></svg> Отменить поиск'

	timerInterval = setInterval(() => {
		seconds++
		const m = String(Math.floor(seconds / 60)).padStart(2, '0')
		const s = String(seconds % 60).padStart(2, '0')
		timerVal.textContent = `${m}:${s}`
	}, 1000)

	fillInterval = setInterval(() => {
		if (filled < TOTAL) {
			slotEls[filled].classList.add('filled')
			filled++
			slotCountEl.textContent = filled
		} else {
			clearInterval(fillInterval)
			clearInterval(timerInterval)
			radarLabel.textContent = 'Лобби найдено!'
			queueBtn.innerHTML = 'Переход в лобби...'
		}
	}, 700)
})
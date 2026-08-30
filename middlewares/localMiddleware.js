import fs from "fs"
import path from "path"

const SUPPORTED_LANGS = ["ru", "en"]
const DEFAULT_LANG = "ru"

const translations = {}
for (const lang of SUPPORTED_LANGS) {
	const filePath = path.join(process.cwd(), "locales", `${lang}.json`)
	translations[lang] = JSON.parse(fs.readFileSync(filePath, "utf-8"))
}

export default (req, res, next) => {
	let lang = req.cookies?.lang

	if (!SUPPORTED_LANGS.includes(lang)) {
		lang = DEFAULT_LANG
	}

	res.locals.t = (key) => translations[lang][key] || key
	res.locals.currentLang = lang

	next()
}
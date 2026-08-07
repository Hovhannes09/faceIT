import ejs from "ejs"
import _ from "lodash"
import nodemailer from "nodemailer"
import path from "path"

const transporter = nodemailer.createTransport({
	host: "smtp.ethereal.email",
	port: 587,
	auth: {
		user: "keith.gutmann@ethereal.email",
		pass: "5NrdGUGwG9DRNnVYYy",
	},
})

export default async function ({
	to,
	subject,
	template,
	data,
	attachments = null,
}) {
	try {
		const filePath = path.resolve("views/email", template + ".ejs")
		const html = await ejs.renderFile(filePath, { data })

		const payload = {
			from: '"Mini Blog" <team@example.com>',
			to,
			subject,
			html,
		}

		if (!_.isEmpty(attachments)) {
			payload.attachments = attachments
		}

		const info = await transporter.sendMail(payload)

		console.log("Message sent: %s", info.messageId)
		console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info))
	} catch (err) {
		console.error("Error while sending mail:", err)
	}
}

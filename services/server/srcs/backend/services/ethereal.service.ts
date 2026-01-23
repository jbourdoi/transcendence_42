import nodemailer from 'nodemailer'
import { getVaultSecret } from './vault.service.js'
import SMTPTransport from 'nodemailer/lib/smtp-transport/index.js'

let transporter: nodemailer.Transporter<SMTPTransport.Options> | null = null
const gmailUser = await getVaultSecret<string>('gmail_user', value => value)

export async function createTransporter() {
	const gmailPwd = await getVaultSecret<string>('gmail_pwd', value => value)
	transporter = nodemailer.createTransport({
		service: 'gmail',
		auth: {
			user: gmailUser,
			pass: gmailPwd
		}
	} as nodemailer.TransportOptions)
	transporter
		.verify()
		.then(() => console.log('Nodemail transporter is ready for Gmail.'))
		.catch((error: any) => console.error('Error verifying transporter: ', error))
}

export async function sendEmail(recipient: string, code: string) {
	if (!transporter) {
		console.error('Transporter not initialized. Call createTransporter() first.')
		return
	}
	await transporter
		.sendMail({
			from: `2FA Service <${gmailUser}>`,
			to: recipient,
			subject: 'Your 2FA Code',
			text: `Your 2FA code is: ${code}`,
			html: `<p>Your 2FA code is: <code>${code}</code></p>`
		})
		.then((info: any) => console.log('Message sent to %s: %s', recipient, info.messageId))
		.catch((error: any) => console.error('Error sending email: ', error))
}

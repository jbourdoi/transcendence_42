import nodemailer from 'nodemailer';
import { getVaultSecret } from './vault.service.js';

let transporter: nodemailer.Transporter | null = null
const accountUser = getVaultSecret<string>("sender_user", (value) => value);

// export function createAccount() {
//     nodemailer.createTestAccount((err, account) => {
//         if (err) {
//             console.error('Failed to create a testing account. ' + err.message)
//             return
//         }
//         console.log('Created a testing account: ' + JSON.stringify(account))
//         createTransporter(account)
//     })
// }

export function createTransporter() {
    const accountPass = getVaultSecret<string>("sender_pwd", (value) => value)
    transporter = nodemailer.createTransport({
        host: "smtp.office365.com",
        port: 587,
        secure: false,
        auth: {
            user: accountUser,
            pass: accountPass
        }
    })
    console.log('Nodemailer transporter created.')
}

export function sendEmail(recipient: string, code: string) {
    if (!transporter)
    {
        console.error('Transporter not initialized. Call createTransporter() first.')
        return
    }
    transporter.sendMail({
        from: `2FA Service <${accountUser}>`,
        to: recipient,
        subject: "Your 2FA Code",
        text: `Your 2FA code is: ${code}`,
    })
    .then((info) => {
        console.log('Message sent: %s', info.messageId)
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info))
    })
    .catch((error) => {
        console.error('Error sending email: ', error)
    })
}
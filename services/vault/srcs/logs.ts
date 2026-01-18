import fs from 'fs'

export function log(message: string, level: 'info' | 'warn' | 'error') {
    const logMessage = JSON.stringify({container_name: "vault", timestamp: new Date().toISOString(), level: level.toUpperCase(), message: message});
    fs.writeFileSync("/vault/logs/vault.log", `${logMessage}\n`, { flag: 'a' })
}

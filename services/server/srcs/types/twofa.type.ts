export type httpResponseType = {
    status: number,
    message: string
}

export type challengeType = {
    user_id: number,
    code_hash: string,
    purpose: string,
    expires_at: string,
    used_at: string | null,
    attempts: number
}
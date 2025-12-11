import { SignJWT, jwtVerify, jwtDecrypt, EncryptJWT, importJWK, CryptoKey, JWK } from 'jose';
import { getSecret } from '../services/vault.service.js';
import { log } from '../logs.js';

export async function getJwsSecret() {
    const jwkObject = JSON.parse(await getSecret('jws_secret'));
    const jwk: JWK = JSON.parse(jwkObject.message);
    const secretKey: CryptoKey = await importJWK(jwk, 'HS256') as CryptoKey;
    return secretKey;
}


export async function getJweSecret() {
    const jwkObject = JSON.parse(await getSecret('jwe_secret'));
    const jwk: JWK = JSON.parse(jwkObject.message);
    const secretKey: CryptoKey = await importJWK(jwk, 'A256GCM') as CryptoKey;
    return secretKey;
}

export async function createToken(id: number) {
    const jwsSecretKey: CryptoKey = await getJwsSecret();
    const signed = await signJWS(id, jwsSecretKey);
    const jweSecretKey: CryptoKey = await getJweSecret();
    const encrypted = await encryptJWE(signed, jweSecretKey);
    return encrypted;
}

export async function verifyToken(token: string) {
    const jweSecretKey: CryptoKey = await getJweSecret();
    const payload = await decryptJWE(token, jweSecretKey);
    if (!payload) return null;
    const jws = (payload as { jws: string }).jws;
    const jwsSecretKey: CryptoKey = await getJwsSecret();
    const verifiedPayload = await verifyJWS(jws, jwsSecretKey);
    return verifiedPayload;
}

export async function signJWS(id: number, secretKey: CryptoKey) {
    const jws = await new SignJWT({ id })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('1h')
        .sign(secretKey);
    return jws;
}

export async function verifyJWS(token: string, secretKey: CryptoKey) {
    try {
        const { payload } = await jwtVerify(token, secretKey);
        log(`Verified JWS payload: ${JSON.stringify(payload)}`, 'info');
        return payload;
    } catch (error: unknown) {
        log(`Invalid JWS token: ${error}`, 'error');
    }
}

export async function encryptJWE(payload: string, secretKey: CryptoKey) {
    const jwe = await new EncryptJWT({ jws: payload })
        .setProtectedHeader({ alg: 'dir', enc: 'A256GCM' }) // enc = encryption
        .setExpirationTime('1h')
        .encrypt(secretKey);
    return jwe;
}

export async function decryptJWE(token: string, secretKey: CryptoKey) {
    try {
        const { payload } = await jwtDecrypt(token, secretKey);
        log(`Decrypted JWE payload: ${payload}`, 'info');
        return payload;
    }
    catch (error: unknown) {
        log(`Invalid or expired JWE token: ${error}`, 'error');
    }
}
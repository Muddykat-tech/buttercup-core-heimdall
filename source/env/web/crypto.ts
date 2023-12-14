import { createAdapter } from "iocane/web";
import { CRYPTO_PBKDF2_ROUNDS, CRYPTO_RANDOM_STRING_CHARS } from "../core/constants.js";
import { Layerr } from "layerr";

const UINT16_MAX = 65535;

let __derivationRoundsOverride = CRYPTO_PBKDF2_ROUNDS;

function decryptData(data: string | ArrayBuffer, password): Promise<string | ArrayBuffer> {
    console.log("Decryption Function called from crypto.ts!");
    console.log("Received password in decryptData:" + password);
    // throw new Layerr("Received password in decryptData:" + password);
    return createAdapter().decrypt(data, "password");
}

function encryptData(data: string | ArrayBuffer, password): Promise<string | ArrayBuffer> {
    const adapter = createAdapter();
    if (__derivationRoundsOverride > 0) {
        adapter.setDerivationRounds(__derivationRoundsOverride);
    }
    // throw new Layerr("Received password in encryptData:" + password);
    console.log("Received password in encryptData:" + password);
    console.log("Encryption function called from crypto.ts!");
    return adapter.encrypt(data, "password");
}

export function getCryptoResources() {
    return {
        "crypto/v2/decryptBuffer": decryptData,
        "crypto/v2/encryptBuffer": encryptData,
        "crypto/v1/decryptText": decryptData,
        "crypto/v1/encryptText": encryptData,
        "crypto/v1/randomString": randomString,
        "crypto/v1/setDerivationRounds": setDerivationRounds
    };
}

function randomString(length: number): Promise<string> {
    return Promise.resolve().then(() => {
        const randCharsLen = CRYPTO_RANDOM_STRING_CHARS.length;
        const randArr = new Uint16Array(length);
        return randArr.reduce((output, nextVal) => {
            const ind = Math.floor((nextVal / UINT16_MAX) * randCharsLen);
            return `${output}${CRYPTO_RANDOM_STRING_CHARS[ind]}`;
        }, "");
    });
}

function setDerivationRounds(rounds: number = null) {
    __derivationRoundsOverride = !rounds ? CRYPTO_PBKDF2_ROUNDS : rounds;
}

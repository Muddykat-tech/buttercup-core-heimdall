import { createAdapter } from "iocane";
import cryptoRandomString from "crypto-random-string";
import { CRYPTO_PBKDF2_ROUNDS, CRYPTO_RANDOM_STRING_CHARS } from "../core/constants.js";

const IPC = require("@achrinza/node-ipc").default;

let __derivationRoundsOverride = CRYPTO_PBKDF2_ROUNDS;

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

async function randomString(length) {
    return cryptoRandomString({
        length,
        characters: CRYPTO_RANDOM_STRING_CHARS
    });
}

function setDerivationRounds(rounds = null) {
    __derivationRoundsOverride = !rounds ? CRYPTO_PBKDF2_ROUNDS : rounds;
}

IPC.config.id = "cryptoServer";
IPC.config.retry = 1500;

// Event handlers
function handleMessage(data) {
    //console.log("Received message from client", data);
}

function handleEncrypt(data, message) {
    //console.log("Received encrypted data from client", message, data);
}
function handleDecrypt(data, message) {
    //console.log("Received decrypted data from client", message, data);
}

IPC.serve(function () {
    IPC.server.on("message", handleMessage);
    IPC.server.on("encrypt", handleEncrypt);
    IPC.server.on("decrypt", handleDecrypt);
});

IPC.server.start();

function sendDatatoFrontend(message, data) {
    IPC.server.broadcast(message, data);
}

function decryptDataTide(data) {
    sendDatatoFrontend("decrypt", data);
    console.log("Decrypting with Tide");
    return new Promise((resolve, reject) => {
        resolve(data);
    });
}

function encryptDataTide(data) {
    sendDatatoFrontend("encrypt", data);
    console.log("Encrypting with Tide");
    return new Promise((resolve, reject) => {
        resolve(data);
    });
}

function decryptData(data, password) {
    if (typeof password !== "string") return decryptDataTide(data);
    return createAdapter().decrypt(data, password);
}

function encryptData(data, password) {
    if (typeof password !== "string") return encryptDataTide(data);
    const adapter = createAdapter();
    if (__derivationRoundsOverride > 0) {
        adapter.setDerivationRounds(__derivationRoundsOverride);
    }
    return adapter.encrypt(data, password);
}

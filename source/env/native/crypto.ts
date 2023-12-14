import { createAdapter } from "iocane";
import cryptoRandomString from "crypto-random-string";
import { CRYPTO_PBKDF2_ROUNDS, CRYPTO_RANDOM_STRING_CHARS } from "../core/constants.js";

const IPC = require("@achrinza/node-ipc").default;

let __derivationRoundsOverride = CRYPTO_PBKDF2_ROUNDS;

let encryptedData = "";
let decryptedData = "";

IPC.config.id = "cryptoServer";
IPC.config.retry = 1500;
IPC.serve(function () {
    IPC.server.on("message", (data) => {
        console.log("Received message from client", data);
    });
    IPC.server.on("encrypt", (data, message) => {
        console.log("Received encrypted data from client", message, data);
        encryptedData = data;
    });
    IPC.server.on("decrypt", (data, message) => {
        console.log("Received decrypted data from client", message, data);
        decryptedData = data;
    });
});
IPC.server.start();

function decryptData(data: string | Buffer, password: string): Promise<string | Buffer> {
    console.log("----------------------------------------");
    console.log("In decryptData function in crypto.ts");
    console.log("Received password is: " + password);
    //console.log(createAdapter().decrypt(data, "password"));
    sendDatatoFrontend("decrypt", data);
    // var eventEmitter = new EventEmitterAsyncResource();
    // eventEmitter.emit("decryptData");
    console.log("Decrypted data: " + decryptedData);
    console.log("----------------------------------------");

    return new Promise((resolve, reject) => {
        resolve(data);
    });
}

function sendDatatoFrontend(message: string, data: any) {
    IPC.server.broadcast(message, data);
}

function encryptData(data: string | Buffer, password: string): Promise<string | Buffer> {
    // const adapter = createAdapter();
    // if (__derivationRoundsOverride > 0) {
    //     adapter.setDerivationRounds(__derivationRoundsOverride);
    // }
    console.log("----------------------------------------");
    console.log("In encryptData function in crypto.ts");
    console.log("Received password is: " + password);
    //var eventEmitter = new EventEmitterAsyncResource();
    // eventEmitter.emit("encryptData");
    //console.log(adapter.encrypt(data, "password"));
    // IPC.serve(() => IPC.server.on('heimdall-event', (data, socket) => {
    //     console.log(data);
    //     IPC.server.emit(socket, 'heimdall-response', data);
    // }));
    // IPC.server.start();
    sendDatatoFrontend("encrypt", data);
    console.log("Encrypted data: " + encryptedData);
    console.log("----------------------------------------");
    return new Promise((resolve, reject) => {
        resolve(data);
    });
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

async function randomString(length: number): Promise<string> {
    return cryptoRandomString({
        length,
        characters: CRYPTO_RANDOM_STRING_CHARS
    });
}

function setDerivationRounds(rounds: number = null) {
    __derivationRoundsOverride = !rounds ? CRYPTO_PBKDF2_ROUNDS : rounds;
}

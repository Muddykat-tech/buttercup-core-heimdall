import { createAdapter } from "iocane";
import cryptoRandomString from "crypto-random-string";
import { CRYPTO_PBKDF2_ROUNDS, CRYPTO_RANDOM_STRING_CHARS } from "../core/constants.js";
import ipc from "@achrinza/node-ipc";

let __derivationRoundsOverride = CRYPTO_PBKDF2_ROUNDS;
ipc.config.id = "heimdallserver";
ipc.config.retry = 1500;
ipc.config.silent = true;
ipc.config.port = 8001;

async function processData(channel, data): Promise<string> {
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            reject(new Error("Response timeout"));
        }, 5000); // Set a timeout for the response (5 seconds in this example)

        ipc.connectTo("heimdallserver", () => {
            console.log("Connected to the heimdall server");

            console.log("Sent data to be processed");
            ipc.of.heimdallserver.emit(channel, data);

            console.log("waiting on channel: ", channel + "-response");
            ipc.of.heimdallserver.once(channel + "-response", (response) => {
                clearTimeout(timeout); // Clear the timeout since we've received a response
                console.log("Received response:", response);
                resolve(response);
            });

            ipc.of.heimdallserver.on("error", (err) => {
                clearTimeout(timeout); // Clear the timeout in case of an error
                reject(err);
            });
        });
    });
}

async function decryptData(data: string | Buffer, password: string): Promise<string | Buffer> {
    console.log("----------------------------------------");
    console.log("In decryptData function in crypto.ts");
    console.log("Data: " + data);

    const response = await processData("decrypt", data);

    console.log("Decrypted data: " + response);
    console.log("----------------------------------------");

    return Promise.resolve(response);
}

async function encryptData(data: string | Buffer, password: string): Promise<string | Buffer> {
    return new Promise((resolve, reject) => {
        console.log("----------------------------------------");
        console.log("In encryptData function in crypto.ts");
        console.log("Data: " + data);

        const response = processData("encrypt", data);

        console.log("Encrypted Data: " + response);
        console.log("----------------------------------------");

        resolve(response);
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

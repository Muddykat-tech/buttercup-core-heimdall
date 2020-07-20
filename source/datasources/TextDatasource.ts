import EventEmitter from "eventemitter3";
import hash from "hash.js";
import Credentials from "../credentials/Credentials";
import { credentialsAllowsPurpose, getCredentials } from "../credentials/channel";
import { detectFormat, getDefaultFormat } from "../io/formatRouter";
import { fireInstantiationHandlers, registerDatasource } from "./register";
import { AttachmentDetails, BufferLike, CredentialsDatasourceConfiguration, DatasourceLoadedData, EncryptedContent, History, VaultID, VaultInsights } from "../types";

/**
 * Datasource for text input and output
 * @memberof module:Buttercup
 */
export default class TextDatasource extends EventEmitter {
    _content: EncryptedContent;
    _credentials: Credentials;
    type: string;

    /**
     * Constructor for the text datasource
     * @param credentials The credentials and configuration for
     *  the datasource
     */
    constructor(credentials: Credentials) {
        super();
        this._credentials = credentials;
        this._credentials.restrictPurposes([Credentials.PURPOSE_SECURE_EXPORT]);
        this._content = "";
        try {
            const { data: credentialData } = getCredentials(credentials.id);
            const { datasource: datasourceConfig = {} } = credentialData || {};
            const { content = "" } = datasourceConfig as CredentialsDatasourceConfiguration;
            this._content = content;
        } catch (err) {}
        this.type = "text";
        fireInstantiationHandlers("text", this);
    }

    /**
     * Datasource credentials
     * @readonly
     */
    get credentials(): Credentials {
        return this._credentials;
    }

    /**
     * Whether the datasource currently has content
     * Used to check if the datasource has encrypted content that can be
     * loaded. May be used when attempting to open a vault in offline mode.
     * @memberof TextDatasource
     */
    get hasContent(): boolean {
        return this._content && this._content.length > 0;
    }

    /**
     * Change the password of the vault
     * @param newCredentials The new credentials to take the new password from
     * @param preflight Whether or not the password change attempt is a preflight
     *  check or not
     * @returns True/False if in preflight, as to whether or not the password change
     *  can be performed at this time, or undefined when not in preflight mode.
     */
    async changePassword(newCredentials: Credentials, preflight: boolean): Promise<boolean | undefined> {
        throw new Error("Changing password not supported");
    }

    /**
     * Get attachment buffer
     * - Downloads the attachment contents into a buffer
     * @param vaultID The ID of the vault
     * @param attachmentID The ID of the attachment
     * @param credentials Credentials to decrypt
     *  the buffer, defaults to null (no decryption)
     * @memberof TextDatasource
     */
    getAttachment(vaultID: VaultID, attachmentID: string, credentials: Credentials = null): Promise<BufferLike> {
        return Promise.reject(new Error("Attachments not supported"));
    }

    /**
     * Get attachment details
     * @param vaultID The ID of the vault
     * @param attachmentID The ID of the attachment
     * @returns The attactment details
     * @memberof TextDatasource
     */
    getAttachmentDetails(vaultID: VaultID, attachmentID: string): Promise<AttachmentDetails> {
        return Promise.reject(new Error("Attachments not supported"));
    }

    /**
     * Get the available storage space, in bytes
     * @returns Bytes of free space, or null if not
     *  available
     * @memberof TextDatasource
     */
    getAvailableStorage(): Promise<number | null> {
        return Promise.resolve(null);
    }

    /**
     * Get the total storage space, in bytes
     * @returns Bytes of free space, or null if not
     *  available
     * @memberof TextDatasource
     */
    getTotalStorage(): Promise<number | null> {
        return Promise.resolve(null);
    }

    /**
     * Get the ID of the datasource
     * ID to uniquely identify the datasource and its parameters
     * @returns A hasn of the datasource (unique ID)
     * @memberof TextDatasource
     */
    getID(): string {
        const content = this.type === "text" ? this._content : this.toString();
        if (!content) {
            throw new Error("Failed getting ID: Datasource requires content for ID generation");
        }
        return hash
            .sha256()
            .update(content)
            .digest("hex");
    }

    /**
     * Load from the stored content using a password to decrypt
     * @param credentials The password or Credentials instance to decrypt with
     * @returns A promise that resolves with decrypted history
     * @throws {Error} Rejects if content is empty
     * @memberof TextDatasource
     */
    load(credentials: Credentials): Promise<DatasourceLoadedData> {
        if (!this._content) {
            return Promise.reject(new Error("Failed to load vault: Content is empty"));
        }
        if (credentialsAllowsPurpose(credentials.id, Credentials.PURPOSE_DECRYPT_VAULT) !== true) {
            return Promise.reject(new Error("Provided credentials don't allow vault decryption"));
        }
        const Format = detectFormat(this._content);
        return Format.parseEncrypted(this._content, credentials).then((history: History) => ({
            Format,
            history
        }));
    }

    /**
     * Put attachment data
     * @param vaultID The ID of the vault
     * @param attachmentID The ID of the attachment
     * @param buffer The attachment data
     * @param credentials Credentials for
     *  encrypting the buffer. If not provided, the buffer
     *  is presumed to be in encrypted-form and will be
     *  written as-is.
     * @memberof TextDatasource
     */
    putAttachment(vaultID: VaultID, attachmentID: string, buffer: BufferLike, credentials: Credentials = null): Promise<void> {
        return Promise.reject(new Error("Attachments not supported"));
    }

    /**
     * Remove an attachment
     * @param vaultID The ID of the vault
     * @param attachmentID The ID of the attachment
     * @memberof TextDatasource
     */
    removeAttachment(vaultID: VaultID, attachmentID: string): Promise<void> {
        return Promise.reject(new Error("Attachments not supported"));
    }

    /**
     * Save archive contents with a password
     * @param history Archive history to save
     * @param credentials The Credentials instance to encrypt with
     * @returns A promise resolving with the encrypted content
     * @memberof TextDatasource
     */
    save(vaultCommands: History, credentials: Credentials): Promise<EncryptedContent> {
        if (credentialsAllowsPurpose(credentials.id, Credentials.PURPOSE_ENCRYPT_VAULT) !== true) {
            return Promise.reject(new Error("Provided credentials don't allow vault encryption"));
        }
        return getDefaultFormat().encodeRaw(vaultCommands, credentials);
    }

    /**
     * Set the text content
     * @param content The encrypted text content
     * @returns Self
     * @memberof TextDatasource
     */
    setContent(content: EncryptedContent): this {
        this._content = content || "";
        return this;
    }

    /**
     * Whether or not the datasource supports attachments
     * @memberof TextDatasource
     */
    supportsAttachments(): boolean {
        return false;
    }

    /**
     * Whether or not the datasource supports the changing of the master password
     * @returns True if the datasource supports password changing
     * @memberof TextDatasource
     */
    supportsPasswordChange(): boolean {
        return false;
    }

    /**
     * Whether or not the datasource supports bypassing remote fetch operations
     *  (offline support)
     * @returns True if content can be set to bypass fetch operations,
     *  false otherwise
     * @memberof TextDatasource
     */
    supportsRemoteBypass(): boolean {
        return false;
    }

    /**
     * Record vault insights, if supported, to some destination
     * @param insights Vault insights data
     * @memberof TextDatasource
     */
    updateInsights(insights: VaultInsights): Promise<void> {
        return Promise.resolve();
    }
}

registerDatasource("text", TextDatasource);

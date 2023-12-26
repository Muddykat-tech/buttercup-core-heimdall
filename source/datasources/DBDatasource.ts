import pathPosix from "path-posix";
import { TextDatasource } from "./TextDatasource.js";
import { fireInstantiationHandlers, registerDatasource } from "./register.js";
import { getSharedAppEnv } from "../env/appEnv.js";
import { Credentials } from "../credentials/Credentials.js";
import { getCredentials } from "../credentials/channel.js";
import { ATTACHMENT_EXT } from "../tools/attachments.js";
import {
    AttachmentDetails,
    BufferLike,
    DatasourceConfigurationDB,
    DatasourceLoadedData,
    History,
    VaultID
} from "../types.js";

const MAX_DATA_SIZE = 200 * 1024 * 1024; // 200 MB

/**
 * WebDAV datasource for reading and writing remote archives
 * @augments TextDatasource
 * @memberof module:Buttercup
 */
export default class DBDatasource extends TextDatasource {
    private _config: DatasourceConfigurationDB;
    protected _path: string;

    /**
     * Constructor for the datasource
     * @param credentials Credentials for the datasource
     */
    constructor(credentials: Credentials) {
        super(credentials);
        const { data: credentialData } = getCredentials(credentials.id);
        const { datasource: datasourceConfig } = credentialData as {
            datasource: DatasourceConfigurationDB;
        };
        const { endpoint, path, username } = (this._config = datasourceConfig);
        this._path = path;

        this.type = "db";
        fireInstantiationHandlers("db", this);
    }

    /**
     * The vault file's base directory
     * @memberof DBDatasource
     */
    get baseDir() {
        return pathPosix.dirname(this.path);
    }

    /**
     * The remote archive path
     * @memberof DBDatasource
     */
    get path() {
        return this._path;
    }

    /**
     * Ensure attachment paths exist
     * @memberof DBDatasource
     * @protected
     */
    async _ensureAttachmentsPaths(vaultID: VaultID): Promise<void> {
        const attachmentsDir = pathPosix.join(this.baseDir, ".buttercup", vaultID);
        //await this.client.createDirectory(attachmentsDir, { recursive: true });
    }

    /**
     * Get encrypted attachment
     * - Loads the attachment contents from a file into a buffer
     * @param vaultID The ID of the vault
     * @param attachmentID The ID of the attachment
     * @memberof DBDatasource
     */
    async getAttachment(vaultID: VaultID, attachmentID: string): Promise<BufferLike> {
        await this._ensureAttachmentsPaths(vaultID);
        const attachmentPath = pathPosix.join(
            this.baseDir,
            ".buttercup",
            vaultID,
            `${attachmentID}.${ATTACHMENT_EXT}`
        );
        return this.client.getFileContents(attachmentPath) as Promise<BufferLike>;
    }

    /**
     * Get the datasource configuration
     * @memberof DBDatasource
     */
    getConfiguration(): DatasourceConfigurationDB {
        return this._config;
    }

    /**
     * Load archive history from the datasource
     * @param credentials The credentials for archive decryption
     * @returns A promise resolving archive history
     * @memberof DBDatasource
     */
    load(credentials: Credentials): Promise<DatasourceLoadedData> {
        // return this.hasContent
        //    ? super.load(credentials)
        //    : this.client.getFileContents(this.path, { format: "text" }).then((content) => {
        //          this.setContent(content as string);
        //          return super.load(credentials);
        //      });
        return null;
    }

    /**
     * Put attachment data
     * @param vaultID The ID of the vault
     * @param attachmentID The ID of the attachment
     * @param buffer The attachment data
     * @param details The attachment details
     * @memberof DBDatasource
     */
    async putAttachment(
        vaultID: VaultID,
        attachmentID: string,
        buffer: BufferLike,
        details: AttachmentDetails
    ): Promise<void> {
        await this._ensureAttachmentsPaths(vaultID);
        const attachmentPath = pathPosix.join(
            this.baseDir,
            ".buttercup",
            vaultID,
            `${attachmentID}.${ATTACHMENT_EXT}`
        );
        //await this.client.putFileContents(attachmentPath, buffer);
    }

    /**
     * Remove an attachment
     * @param vaultID The ID of the vault
     * @param attachmentID The ID of the attachment
     * @memberof DBDatasource
     */
    async removeAttachment(vaultID: VaultID, attachmentID: string): Promise<void> {
        await this._ensureAttachmentsPaths(vaultID);
        const attachmentPath = pathPosix.join(
            this.baseDir,
            ".buttercup",
            vaultID,
            `${attachmentID}.${ATTACHMENT_EXT}`
        );
        //await this.client.deleteFile(attachmentPath);
    }

    /**
     * Save archive contents to the WebDAV service
     * @param history Archive history
     * @param credentials The credentials for encryption
     * @returns A promise resolving when the save is complete
     * @memberof DBDatasource
     */
    async save(history: History, credentials: Credentials): Promise<any> {
        const content = await super.save(history, credentials);
        //await this.client.putFileContents(this.path, content);
    }

    /**
     * Whether or not the datasource supports attachments
     * @memberof DBDatasource
     */
    supportsAttachments(): boolean {
        return true;
    }

    /**
     * Whether or not the datasource supports bypassing remote fetch operations
     * @returns True if content can be set to bypass fetch operations,
     *  false otherwise
     * @memberof DBDatasource
     */
    supportsRemoteBypass(): boolean {
        return true;
    }
}

registerDatasource("db", DBDatasource);

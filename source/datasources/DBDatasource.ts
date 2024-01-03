import pathPosix from "path-posix";
import { TextDatasource } from "./TextDatasource.js";
import { fireInstantiationHandlers, registerDatasource } from "./register.js";
import { Credentials } from "../credentials/Credentials.js";
import { getCredentials } from "../credentials/channel.js";
import { ATTACHMENT_EXT } from "../tools/attachments.js";
import {
    DatasourceConfigurationDB,
    DatasourceLoadedData,
    History,
    EncryptedContent
} from "../types.js";
import { ButtercupServerClient } from "buttercup-server-client";
import { FileIdentifier } from "@buttercup/file-interface";
import { PathIdentifier } from "buttercup-server-client/dist/types.js";

const MAX_DATA_SIZE = 200 * 1024 * 1024; // 200 MB

/**
 * WebDAV datasource for reading and writing remote archives
 * @augments TextDatasource
 * @memberof module:Buttercup
 */
export default class DBDatasource extends TextDatasource {
    client: ButtercupServerClient;
    config: DatasourceConfigurationDB;
    path: PathIdentifier;

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
        const { endpoint, path, token } = (this.config = datasourceConfig);
        this.path = { identifier: endpoint, name: path };
        this.client = new ButtercupServerClient(this.path, token); // Give it the jwt here if need be?
        this.type = "db";
        fireInstantiationHandlers("db", this);
    }
    /**
     * Get the datasource configuration
     * @memberof DBDatasource
     */
    getConfiguration(): DatasourceConfigurationDB {
        return this.config;
    }
    /**
     * Load an archive from the datasource
     * @param credentials The credentials for decryption
     * @returns A promise that resolves archive history
     * @memberof DBDatasource
     */
    load(credentials: Credentials): Promise<DatasourceLoadedData> {
        if (this.hasContent) {
            return super.load(credentials);
        }
        return this.client.getFileContents(this.path).then((content) => {
            console.log("DBDatasource load function:" + content);
            this.setContent(content);
            return super.load(credentials);
        });
    }

    /**
     * Save an archive using the datasource
     * @param history The archive history to save
     * @param credentials The credentials to save with
     * @returns A promise that resolves when saving has completed
     * @memberof DBDatasource
     */
    async save(history: History, credentials: Credentials): Promise<EncryptedContent> {
        console.log("DBDatasource check 1");
        return super.save(history, credentials).then((encryptedContent) => {
            console.log("DBDatasource check 2");
            return this.client.putFileContents(this.path.name, encryptedContent);
        });
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

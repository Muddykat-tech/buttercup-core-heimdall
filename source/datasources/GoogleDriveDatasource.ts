import { createClient } from "@buttercup/googledrive-client";
import VError from "verror";
import DatasourceAuthManager from "./DatasourceAuthManager";
import TextDatasource from "./TextDatasource";
import { fireInstantiationHandlers, registerDatasource } from "./register";
import Credentials from "../credentials/Credentials";
import { getCredentials } from "../credentials/channel";

const DATASOURCE_TYPE = "googledrive";

/**
 * Datasource for Google Drive archives
 * @augments TextDatasource
 * @memberof module:Buttercup
 */
export default class GoogleDriveDatasource extends TextDatasource {
    authManager: DatasourceAuthManager;
    client: any;
    fileID: string;
    token: string;
    refreshToken: string;

    /**
     * Datasource for Google Drive connections
     * @param {Credentials} credentials The credentials instance with which to
     *  configure the datasource with
     */
    constructor(credentials: Credentials) {
        super(credentials);
        const { data: credentialData } = getCredentials(credentials.id);
        const { datasource: datasourceConfig } = credentialData;
        const { token, refreshToken, fileID } = datasourceConfig;
        this.fileID = fileID;
        this.token = token;
        this.refreshToken = refreshToken;
        this.client = createClient(token);
        this.authManager = DatasourceAuthManager.getSharedManager();
        this.type = DATASOURCE_TYPE;
        fireInstantiationHandlers(DATASOURCE_TYPE, this);
    }

    /**
     * Load an archive from the datasource
     * @param {Credentials} credentials The credentials for decryption
     * @returns {Promise.<LoadedVaultData>} A promise that resolves archive history
     * @memberof GoogleDriveDatasource
     */
    load(credentials, hasAuthed = false) {
        if (this.hasContent) {
            return super.load(credentials);
        }
        return this.client
            .getFileContents(this.fileID)
            .then(content => {
                this.setContent(content);
                return super.load(credentials);
            })
            .catch(err => {
                const { authFailure = false } = VError.info(err);
                if (!authFailure) {
                    throw new VError(err, "Failed fetching Google Drive vault");
                } else if (hasAuthed) {
                    throw new VError(err, "Re-authentication failed");
                }
                return this.authManager
                    .executeAuthHandlers(DATASOURCE_TYPE, this)
                    .then(() => this.load(credentials, true))
                    .catch(err2 => {
                        throw new VError(err2, "Failed fetching Google Drive vault");
                    });
            });
    }

    /**
     * Save an archive using the datasource
     * @param {Array.<String>} history The archive history to save
     * @param {Credentials} credentials The credentials to save with
     * @returns {Promise} A promise that resolves when saving has completed
     * @memberof GoogleDriveDatasource
     */
    save(history, credentials, hasAuthed = false) {
        return super
            .save(history, credentials)
            .then(encryptedContent =>
                this.client.putFileContents({
                    id: this.fileID,
                    contents: encryptedContent
                })
            )
            .catch(err => {
                const { authFailure = false } = VError.info(err);
                if (!authFailure) {
                    throw new VError(err, "Failed saving Google Drive vault");
                } else if (hasAuthed) {
                    throw new VError(err, "Re-authentication failed");
                }
                return this.authManager
                    .executeAuthHandlers(DATASOURCE_TYPE, this)
                    .then(() => this.save(history, credentials, true))
                    .catch(err2 => {
                        throw new VError(err2, "Failed saving Google Drive vault");
                    });
            });
    }

    /**
     * Whether or not the datasource supports bypassing remote fetch operations
     * @returns {Boolean} True if content can be set to bypass fetch operations,
     *  false otherwise
     * @memberof GoogleDriveDatasource
     */
    supportsRemoteBypass() {
        return true;
    }

    /**
     * Update the OAuth2 tokens
     * @param {String} accessToken The access token
     * @param {String=} refreshToken The refresh token
     * @memberof GoogleDriveDatasource
     */
    updateTokens(accessToken, refreshToken) {
        this.token = accessToken;
        this.refreshToken = refreshToken;
        this.client = createClient(accessToken);
        const { data: credentialData } = getCredentials(this.credentials.id);
        credentialData.datasource.token = accessToken;
        credentialData.datasource.refreshToken = refreshToken;
        this.emit("updated");
    }
}

registerDatasource(DATASOURCE_TYPE, GoogleDriveDatasource);

const VError = require("verror");
const VaultFormat = require("./VaultFormat.js");
const {
    executeArchiveID,
    executeComment,
    executeCreateEntry,
    executeCreateGroup,
    executeDeleteArchiveAttribute,
    executeDeleteEntry,
    executeDeleteEntryAttribute,
    executeDeleteEntryProperty,
    executeDeleteGroup,
    executeDeleteGroupAttribute,
    executeFormat,
    executeMoveEntry,
    executeMoveGroup,
    executePad,
    executeSetArchiveAttribute,
    executeSetEntryAttribute,
    executeSetEntryProperty,
    executeSetGroupAttribute,
    executeTitleGroup
} = require("./formatA/commands.js");
const {
    COMMAND_MANIFEST,
    InigoCommand: Inigo,
    extractCommandComponents,
    stripDestructiveCommands
} = require("./formatA/tools.js");
const Flattener = require("./formatA/Flattener.js");
const { getFormat, hasValidSignature, sign, stripSignature, vaultContentsEncrypted } = require("./formatA/signing.js");
const { describeVaultDataset } = require("./formatA/describe.js");
const { getSharedAppEnv } = require("../env/appEnv.js");
const { decodeStringValue, isEncoded } = require("../tools/encoding.js");
const { generateUUID } = require("../tools/uuid.js");
const { getCredentials } = require("../credentials/channel.js");

const COMMANDS = {
    aid: executeArchiveID,
    cen: executeCreateEntry,
    cgr: executeCreateGroup,
    cmm: executeComment,
    daa: executeDeleteArchiveAttribute,
    dea: executeDeleteEntryAttribute,
    dem: executeDeleteEntryProperty, // Meta deprecated, deletes property instead
    den: executeDeleteEntry,
    dep: executeDeleteEntryProperty,
    dga: executeDeleteGroupAttribute,
    dgr: executeDeleteGroup,
    fmt: executeFormat,
    men: executeMoveEntry,
    mgr: executeMoveGroup,
    pad: executePad,
    saa: executeSetArchiveAttribute,
    sea: executeSetEntryAttribute,
    sem: executeSetEntryProperty, // Meta deprecated, sets property instead
    sep: executeSetEntryProperty,
    sga: executeSetGroupAttribute,
    tgr: executeTitleGroup
};
const SHARE_COMMAND_EXP = /^\$[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\s/;
const UUID_LEN = 36;
const VALID_COMMAND_EXP = /^[a-z]{3}\s.+$/;

/**
 * Convert array of history lines to a string
 * @param {Array.<String>} historyArray An array of history items
 * @returns {String} The string representation
 * @private
 */
function historyArrayToString(historyArray) {
    return historyArray.join("\n");
}

/**
 * Convert a history string to an array
 * @param {String} historyString The history string
 * @returns {Array.<String>} An array of history items
 * @private
 */
function historyStringToArray(historyString) {
    return historyString.split("\n");
}

class VaultFormatA extends VaultFormat {
    static encodeRaw(rawContent, credentials) {
        const compress = getSharedAppEnv().getProperty("compression/v1/compressText");
        const encrypt = getSharedAppEnv().getProperty("crypto/v1/encryptText");
        const { masterPassword } = getCredentials(credentials.id);
        return Promise.resolve()
            .then(() => historyArrayToString(rawContent))
            .then(history => compress(history))
            .then(compressed => encrypt(compressed, masterPassword))
            .then(sign);
    }

    /**
     * Extract shares from a history collection
     * @param {String[]} history A history collection, containing shares
     * @returns {Object} The resulting separated histories. The object will
     *  always contain a `base` property containing the non-share history.
     *  Each share detected is set on the object under its share ID - being
     *  set to an array of history lines (non-prefixed) for that share.
     */
    static extractSharesFromHistory(history) {
        return history.reduce(
            (output, line) => {
                if (SHARE_COMMAND_EXP.test(line)) {
                    const shareID = line.substring(1, 1 + UUID_LEN);
                    const command = line.replace(SHARE_COMMAND_EXP, "");
                    output[shareID] = output[shareID] || [];
                    output[shareID].push(command);
                } else {
                    output.base.push(line);
                }
                return output;
            },
            { base: [] }
        );
    }

    static isEncrypted(contents) {
        return vaultContentsEncrypted(contents);
    }

    static parseEncrypted(encryptedContent, credentials) {
        const decompress = getSharedAppEnv().getProperty("compression/v1/decompressText");
        const decrypt = getSharedAppEnv().getProperty("crypto/v1/decryptText");
        const { masterPassword } = getCredentials(credentials.id);
        return Promise.resolve()
            .then(() => {
                if (!hasValidSignature(encryptedContent)) {
                    throw new Error("No valid signature in vault");
                }
                return stripSignature(encryptedContent);
            })
            .then(encryptedData => decrypt(encryptedData, masterPassword))
            .then(decrypted => {
                if (decrypted && decrypted.length > 0) {
                    const decompressed = decompress(decrypted);
                    if (decompressed) {
                        return historyStringToArray(decompressed);
                    }
                }
                throw new Error("Failed reconstructing history: Decryption failed");
            });
    }

    static prepareHistoryForMerge(history) {
        return stripDestructiveCommands(history);
    }

    cloneEntry(entry, targetGroupID) {}

    cloneGroup(group, targetGroupID) {
        const groupDesc = describeVaultDataset(group._source, targetGroupID);
        this.execute(groupDesc);
    }

    createEntry(groupID, entryID) {
        this.execute(
            Inigo.create(Inigo.Command.CreateEntry)
                .addArgument(groupID)
                .addArgument(entryID)
                .generateCommand()
        );
    }

    createGroup(parentID, groupID) {
        this.execute(
            Inigo.create(Inigo.Command.CreateGroup)
                .addArgument(parentID)
                .addArgument(groupID)
                .generateCommand()
        );
    }

    deleteEntry(entryID) {
        this.execute(
            Inigo.create(Inigo.Command.DeleteEntry)
                .addArgument(entryID)
                .generateCommand()
        );
    }

    deleteEntryAttribute(entryID, attribute) {
        this.execute(
            Inigo.create(Inigo.Command.DeleteEntryAttribute)
                .addArgument(entryID)
                .addArgument(attribute)
                .generateCommand()
        );
    }

    deleteEntryProperty(entryID, property) {
        this.execute(
            Inigo.create(Inigo.Command.DeleteEntryProperty)
                .addArgument(entryID)
                .addArgument(property)
                .generateCommand()
        );
    }

    deleteGroup(groupID) {
        this.execute(
            Inigo.create(Inigo.Command.DeleteGroup)
                .addArgument(groupID)
                .generateCommand()
        );
    }

    deleteGroupAttribute(groupID, attribute) {
        this.execute(
            Inigo.create(Inigo.Command.DeleteGroupAttribute)
                .addArgument(groupID)
                .addArgument(attribute)
                .generateCommand()
        );
    }

    deleteVaultAttribute(attribute) {
        this.execute(
            Inigo.create(Inigo.Command.DeleteArchiveAttribute)
                .addArgument(attribute)
                .generateCommand()
        );
    }

    execute(commandOrCommands) {
        if (this.readOnly) {
            throw new Error("Format is in read-only mode");
        }
        const commands = Array.isArray(commandOrCommands) ? commandOrCommands : [commandOrCommands];
        commands.forEach(command => this._executeCommand(command));
        const lastCommand = commands[commands.length - 1];
        if (/^pad\s/i.test(lastCommand) === false) {
            this._pad();
        }
        this.dirty = true;
        this.emit("commandsExecuted");
    }

    generateID() {
        this.execute(
            Inigo.create(Inigo.Command.ArchiveID)
                .addArgument(generateUUID())
                .generateCommand()
        );
    }

    getFormat() {
        return VaultFormatA;
    }

    initialise() {
        this.execute(
            Inigo.create(Inigo.Command.Format)
                .addArgument(getFormat())
                .generateCommand()
        );
        this.generateID();
    }

    moveEntry(entryID, groupID) {
        this.execute(
            Inigo.create(Inigo.Command.MoveEntry)
                .addArgument(entryID)
                .addArgument(groupID)
                .generateCommand()
        );
    }

    moveGroup(groupID, newParentID) {
        this.execute(
            Inigo.create(Inigo.Command.MoveGroup)
                .addArgument(groupID)
                .addArgument(newParentID)
                .generateCommand()
        );
    }

    optimise() {
        const flattener = new Flattener(this);
        if (flattener.canBeFlattened()) {
            flattener.flatten();
        }
    }

    setEntryAttribute(entryID, attribute, value) {
        this.execute(
            Inigo.create(Inigo.Command.SetEntryAttribute)
                .addArgument(entryID)
                .addArgument(attribute)
                .addArgument(value)
                .generateCommand()
        );
    }

    setEntryProperty(entryID, property, value) {
        this.execute(
            Inigo.create(Inigo.Command.SetEntryProperty)
                .addArgument(entryID)
                .addArgument(property)
                .addArgument(value)
                .generateCommand()
        );
    }

    setGroupAttribute(groupID, attribute, value) {
        this.execute(
            Inigo.create(Inigo.Command.SetGroupAttribute)
                .addArgument(groupID)
                .addArgument(attribute)
                .addArgument(value)
                .generateCommand()
        );
    }

    setGroupTitle(groupID, title) {
        this.execute(
            Inigo.create(Inigo.Command.SetGroupTitle)
                .addArgument(groupID)
                .addArgument(title)
                .generateCommand()
        );
    }

    setVaultAttribute(key, value) {
        this.execute(
            Inigo.create(Inigo.Command.SetArchiveAttribute)
                .addArgument(key)
                .addArgument(value)
                .generateCommand()
        );
    }

    _executeCommand(command) {
        let currentCommand = command,
            shareID = null;
        if (SHARE_COMMAND_EXP.test(currentCommand)) {
            const shareMatch = /^\$([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/.exec(currentCommand);
            shareID = shareMatch[1];
            currentCommand = currentCommand.replace(SHARE_COMMAND_EXP, "");
        }
        if (!VALID_COMMAND_EXP.test(currentCommand)) {
            throw new Error(`Invalid command: ${command}`);
        }
        if (/^pad\s/i.test(command) && /^pad\s/i.test(this.history[this.history.length - 1])) {
            // Skip adding extra pad
            return;
        }
        const commandComponents = extractCommandComponents(currentCommand);
        const commandKey = commandComponents.shift().toLowerCase();
        const executeCommand = COMMANDS[commandKey];
        try {
            executeCommand.apply(null, [
                this.source,
                Object.assign(
                    {
                        // opts
                        shareID
                    },
                    this.executionOptions
                ),
                ...this._processCommandParameters(commandKey, commandComponents)
            ]);
            this.history.push(command);
        } catch (err) {
            throw new VError(err, `Failed executing vault command: ${commandKey}`);
        }
    }

    _pad() {
        this._executeCommand(Inigo.generatePaddingCommand());
    }

    _processCommandParameters(commandKey, parameters) {
        const friendlyCommand = Object.keys(COMMAND_MANIFEST).find(manifestKey => {
            return COMMAND_MANIFEST[manifestKey].s === commandKey;
        });
        const commandDescriptor = COMMAND_MANIFEST[friendlyCommand];
        if (!commandDescriptor) {
            throw new Error(`Cannot process command parameters: no command found for key: ${commandKey}`);
        }
        return parameters.map((parameter, i) => {
            if (commandDescriptor.args[i].encode === true) {
                if (isEncoded(parameter)) {
                    return decodeStringValue(parameter);
                }
            }
            return parameter;
        });
    }
}

module.exports = VaultFormatA;

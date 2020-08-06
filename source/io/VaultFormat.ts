import EventEmitter from "eventemitter3";
import Credentials from "../credentials/Credentials";
import Entry from "../core/Entry";
import Group from "../core/Group";
import {
    EntryHistoryItem,
    EntryID,
    FormatAEntry,
    FormatAGroup,
    FormatAVault,
    FormatBEntry,
    FormatBGroup,
    FormatBVault,
    GroupID,
    History,
    PropertyKeyValueObject
} from "../types";
import { isFormatBEntry } from "./formatB/conversion";

function notImplemented() {
    throw new Error("Not implemented");
}

export default class VaultFormat extends EventEmitter {
    static encodeRaw(rawContent: Array<string>, credentials: Credentials) {
        notImplemented();
    }

    static extractSharesFromHistory(history: Array<string>) {
        notImplemented();
    }

    static isEncrypted(contents: string) {
        notImplemented();
    }

    static parseEncrypted(encryptedContent: string, credentials: Credentials) {
        notImplemented();
    }

    static prepareHistoryForMerge(history: Array<string>) {
        notImplemented();
    }

    _readOnly = false;
    dirty = false;
    history: History = [];
    source: FormatAVault | FormatBVault = null;

    get readOnly() {
        return this._readOnly;
    }

    constructor(source: FormatAVault | FormatBVault) {
        super();
        this.source = source;
    }

    clear() {
        this.history = [];
        if (this.source) {
            for (const key in this.source) {
                delete this.source[key];
            }
        }
    }

    cloneEntry(entry: FormatAEntry | FormatBEntry, targetGroupID: GroupID) {
        notImplemented();
    }

    cloneGroup(group: FormatAGroup | FormatBGroup, targetGroupID: GroupID) {
        notImplemented();
    }

    createEntry(groupID: GroupID, entryID: EntryID) {
        notImplemented();
    }

    createGroup(parentID: GroupID, groupID: GroupID) {
        notImplemented();
    }

    deleteEntry(entryID: EntryID) {
        notImplemented();
    }

    deleteEntryAttribute(entryID: EntryID, attribute: string) {
        notImplemented();
    }

    deleteEntryProperty(entryID: EntryID, property: string) {
        notImplemented();
    }

    deleteGroup(groupID: GroupID) {
        notImplemented();
    }

    deleteGroupAttribute(groupID: GroupID, attribute: string) {
        notImplemented();
    }

    deleteVaultAttribute(attribute: string) {
        notImplemented();
    }

    erase() {
        Object.keys(this.source).forEach(sourceKey => {
            this.source[sourceKey] = undefined;
            delete this.source[sourceKey];
        });
        this.history.splice(0, Infinity);
    }

    execute(commandOrCommands: string | Array<string>) {
        notImplemented();
    }

    findGroupContainingEntryID(id: EntryID): FormatAGroup | FormatBGroup {
        notImplemented();
        return null;
    }

    findGroupContainingGroupID(id: GroupID): FormatAGroup | FormatBGroup {
        notImplemented();
        return null;
    }

    generateID() {
        notImplemented();
    }

    getAllEntries(): Array<FormatAEntry | FormatBEntry> {
        notImplemented();
        return [];
    }

    getAllGroups(): Array<FormatAGroup | FormatBGroup> {
        notImplemented();
        return [];
    }

    getEntryAttributes(entrySource: FormatAEntry | FormatBEntry): PropertyKeyValueObject {
        notImplemented();
        return {};
    }

    getEntryChanges(entrySource: FormatAEntry | FormatBEntry): Array<EntryHistoryItem> {
        notImplemented();
        return [];
    }

    getEntryProperties(entrySource: FormatAEntry | FormatBEntry): PropertyKeyValueObject {
        notImplemented();
        return {};
    }

    getFormat(): any {
        return VaultFormat;
    }

    getGroupAttributes(groupSource: FormatAGroup | FormatBGroup): PropertyKeyValueObject {
        notImplemented();
        return {};
    }

    getItemID(itemSource: FormatAGroup | FormatAEntry | FormatBGroup | FormatBEntry): GroupID | EntryID {
        notImplemented();
        return "";
    }

    getVaultID() {
        notImplemented();
    }

    initialise() {
        notImplemented();
    }

    moveEntry(entryID: EntryID, groupID: GroupID) {
        notImplemented();
    }

    moveGroup(groupID: GroupID, newParentID: GroupID) {
        notImplemented();
    }

    optimise() {
        notImplemented();
    }

    setEntryAttribute(entryID: EntryID, attribute: string, value: string) {
        notImplemented();
    }

    setEntryProperty(entryID: EntryID, property: string, value: string) {
        notImplemented();
    }

    setGroupAttribute(groupID: GroupID, attribute: string, value: string) {
        notImplemented();
    }

    setGroupTitle(groupID: GroupID, title: string) {
        notImplemented();
    }

    setVaultAttribute(key: string, value: string) {
        notImplemented();
    }
}

import facadeFieldFactories from "./entryFields";
import { createFieldDescriptor, getEntryValueType, setEntryValueType } from "./tools";
import Entry from "../core/Entry";
import { EntryFacade, EntryFacadeField, EntryPropertyType, EntryType, EntryPropertyValueType } from "../types";

export interface CreateEntryFacadeOptions {
    type?: EntryType;
}

const { FacadeType: FacadeTypeAttribute } = Entry.Attributes;

/**
 * Add extra fields to a fields array that are not mentioned in a preset
 * Facades are creaded by presets which don't mention all property values (custom user
 * added items). This method adds the unmentioned items to the facade fields so that
 * they can be edited as well.
 * @param entry An Entry instance
 * @param fields An array of fields
 * @returns A new array with all combined fields
 * @private
 */
function addExtraFieldsNonDestructive(entry: Entry, fields: Array<EntryFacadeField>) {
    const exists = (propName: string, fieldType: EntryPropertyType) =>
        fields.find(item => item.propertyType === fieldType && item.property === propName);
    const properties = entry.getProperty();
    const attributes = entry.getAttribute();
    return [
        ...fields,
        ...Object.keys(properties)
            .filter(name => !exists(name, EntryPropertyType.Property))
            .map(name =>
                createFieldDescriptor(
                    entry,                      // Entry instance
                    "",                         // Title
                    EntryPropertyType.Property, // Type
                    name,                       // Property name
                    { removeable: true }
                )
            ),
        ...Object.keys(attributes)
            .filter(name => !exists(name, EntryPropertyType.Attribute))
            .map(name =>
                createFieldDescriptor(
                    entry,                          // Entry instance
                    "",                             // Title
                    EntryPropertyType.Attribute,    // Type
                    name                            // Property name
                )
            )
    ];
}

/**
 * Apply a facade field descriptor to an entry
 * Takes data from the descriptor and writes it to the entry.
 * @param entry The entry to apply to
 * @param descriptor The descriptor object
 * @private
 */
function applyFieldDescriptor(entry: Entry, descriptor: EntryFacadeField) {
    setEntryValue(entry, descriptor.propertyType, descriptor.property, descriptor.value, descriptor.valueType);
}

/**
 * Process a modified entry facade
 * @param entry The entry to apply processed data on
 * @param facade The facade object
 * @memberof module:Buttercup
 */
export function consumeEntryFacade(entry: Entry, facade: EntryFacade) {
    const facadeType = getEntryFacadeType(entry);
    if (facade && facade.type) {
        const properties = entry.getProperty();
        const attributes = entry.getAttribute();
        if (facade.type !== facadeType) {
            throw new Error(`Failed consuming entry data: Expected type "${facadeType}" but received "${facade.type}"`);
        }
        // update data
        (facade.fields || []).forEach(field => applyFieldDescriptor(entry, field));
        // remove missing properties
        Object.keys(properties).forEach(propKey => {
            const correspondingField = facade.fields.find(
                ({ propertyType, property }) => propertyType === "property" && property === propKey
            );
            if (typeof correspondingField === "undefined") {
                entry.deleteProperty(propKey);
            }
        });
        // remove missing attributes
        Object.keys(attributes).forEach(attrKey => {
            const correspondingField = facade.fields.find(
                ({ propertyType, property }) => propertyType === "attribute" && property === attrKey
            );
            if (typeof correspondingField === "undefined") {
                entry.deleteAttribute(attrKey);
            }
        });
        return;
    }
    throw new Error("Failed consuming entry data: Invalid item passed as a facade");
}

/**
 * Create a data/input facade for an Entry instance
 * @param entry The Entry instance
 * @param options Options for the entry facade creation
 * @returns A newly created facade
 * @memberof module:Buttercup
 */
export function createEntryFacade(entry?: Entry, options: CreateEntryFacadeOptions = {}): EntryFacade {
    if (entry && entry instanceof Entry !== true) {
        throw new Error("Failed creating entry facade: Provided item is not an Entry");
    }
    const { type } = options;
    const facadeType = type || getEntryFacadeType(entry);
    const createFields = facadeFieldFactories[facadeType];
    if (!createFields) {
        throw new Error(`Failed creating entry facade: No factory found for type "${facadeType}"`);
    }
    const fields = entry ? addExtraFieldsNonDestructive(entry, createFields(entry)) : createFields(entry);
    if (!fields.find(field => field.propertyType === EntryPropertyType.Attribute && field.property === FacadeTypeAttribute)) {
        const entryTypeField = createFieldDescriptor(
            entry, // Entry instance
            "", // Title
            EntryPropertyType.Attribute, // Type
            FacadeTypeAttribute // Property name
        );
        entryTypeField.value = facadeType;
        fields.push(entryTypeField);
    }
    return {
        id: entry ? entry.id : null,
        type: facadeType,
        fields,
        parentID: entry ? entry.getGroup().id : null,
        _history: [], // deprecated
        _changes: entry ? entry.getChanges() : []
    };
}

/**
 * Convert an array of entry facade fields to a
 * key-value object with only properties
 * @param facadeFields Array of fields
 * @memberof module:Buttercup
 */
export function fieldsToProperties(facadeFields: Array<EntryFacadeField>): { [key: string]: string } {
    return facadeFields.reduce((output, field) => {
        if (field.propertyType !== "property") return output;
        output[field.property] = field.value;
        return output;
    }, {});
}

/**
 * Get the facade type for an entry
 * @param entry The entry instance
 * @returns The facade type
 * @private
 */
function getEntryFacadeType(entry?: Entry): EntryType {
    if (!entry) {
        return EntryType.Login;
    }
    return entry.getType();
}

/**
 * Set a value on an entry
 * @param entry The entry instance
 * @param propertyType Type of property ("property"/"attribute")
 * @param property The property name
 * @param value The value to set
 * @param valueType Value type to set
 * @throws {Error} Throws if the property type is not recognised
 * @private
 */
function setEntryValue(entry: Entry, propertyType: EntryPropertyType, property: string, value: string, valueType?: EntryPropertyValueType) {
    switch (propertyType) {
        case "property":
            if (entry.getProperty(property) !== value) {
                // Only update if changed
                entry.setProperty(property, value);
            }
            break;
        case "attribute":
            if (entry.getAttribute(property) !== value) {
                // Only update if changed
                entry.setAttribute(property, value);
            }
            break;
        default:
            throw new Error(`Cannot set value: Unknown property type: ${propertyType}`);
    }
    if (valueType && getEntryValueType(entry, property) !== valueType) {
        setEntryValueType(entry, property, valueType);
    }
}

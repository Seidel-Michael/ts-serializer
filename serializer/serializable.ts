/**
 * This interface must be implemented to be able to serialize and deserialize the object.
 * The empty interface is used to explicit define serializable objects.
 * 
 * @export
 * @interface Serializable
 */
export interface Serializable
{

}

/**
 * This decorator marks the property as excluded from serialization and deserialization.
 * 
 * @export
 * @param {*} target 
 * @param {string} key 
 */
export function NonSerialized(target: any, key: string) : void
{
    target['_serializable_nonserialized'] ? target['_serializable_nonserialized'].push(key) : target['_serializable_nonserialized'] = [key];    
}

/**
 * This decorator marks the property as mandatory for deserialization.
 * 
 * @export
 * @param {*} target The target object.
 * @param {string} key The target property.
 */
export function Mandatory(target: any, key: string) : void
{
    target['_serializable_mandatory'] ? target['_serializable_mandatory'].push(key) : target['_serializable_mandatory'] = [key];
}
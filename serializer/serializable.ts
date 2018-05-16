/**
 * This interface must be implemented to be able to serialize and deserialize the object.
 * The empty interface is used to explicit define serializable objects.
 *
 * @export
 * @interface Serializable
 */
export interface Serializable {}

/**
 * This decorator marks the property as excluded from serialization and deserialization.
 *
 * @export
 * @param {*} target
 * @param {string} key
 */
export function NonSerialized(target: any, key: string): void {
  target['_serializable_nonserialized'] ? target['_serializable_nonserialized'].push(key) : target['_serializable_nonserialized'] = [key];
}

/**
 * This decorator marks the property as mandatory for deserialization.
 *
 * @export
 * @param {*} target The target object.
 * @param {string} key The target property.
 */
export function Mandatory(target: any, key: string): void {
  target['_serializable_mandatory'] ? target['_serializable_mandatory'].push(key) : target['_serializable_mandatory'] = [key];
}

/**
 * This decorator marks the property as a complex type for deserialization.
 * The type must be serializable itself.
 *
 * @export
 * @param {*} type The complex type.
 * @returns {(target: any, key: string) => void} The generated decorator.
 */
export function ComplexType(type: any): (target: any, key: string) => void {
  return (target: any, key: string): void => {
    target['_serializable_complextype'] ? target['_serializable_complextype'].set(key, type) :
                                          target['_serializable_complextype'] = new Map().set(key, type);
  };
}

/**
 * This decorator marks the property as an array for deserialization.
 *
 * @export
 * @param {*} target The target object.
 * @param {string} key The target property.
 */
export function ArrayType(target: any, key: string): void {
  target['_serializable_array'] ? target['_serializable_array'].push(key) : target['_serializable_array'] = [key];
}

/**
 * This decorator adds a type implementation to the class metadata for deserialization of abstract types.
 * The type must be serializable itself.
 *
 * @export
 * @param {string} typeName The name of the type.
 * @param {*} type The type.
 * @returns {(ctor: Function) => void}
 */
export function AddTypeImplementation(typeName: string, type: any): (ctor: Function) => void {
  return (ctor: Function) => {
    ctor.prototype['_serializable_typeimplementation'] ? ctor.prototype['_serializable_typeimplementation'].set(typeName, type) :
                                                         ctor.prototype['_serializable_typeimplementation'] = new Map().set(typeName, type);
  };
}

/**
 * This decorator marks a property as an abstract type.
 * All possible implementations of the type have to be added with the AddTypeImplementation decorator to the class first.
 *
 * @export
 * @param {*} typeProperty The property name in the serialized data with the type name information.
 * @returns {(target: any, key: string) => void}
 */
export function AbstractType(typeProperty: any): (target: any, key: string) => void {
  return (target: any, key: string): void => {
    target['_serializable_abstracttype'] ? target['_serializable_abstracttype'].set(key, typeProperty) :
                                           target['_serializable_abstracttype'] = new Map().set(key, typeProperty);
  };
}

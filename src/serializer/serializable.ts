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
  if (!target[`_serializable_${target.constructor.name}`]) {
    target[`_serializable_${target.constructor.name}`] = {};
  }

  if (target[`_serializable_${target.constructor.name}`]['_serializable_nonserialized']) {
    if (!target[`_serializable_${target.constructor.name}`]['_serializable_nonserialized'].includes(key)) {
      target[`_serializable_${target.constructor.name}`]['_serializable_nonserialized'].push(key);
    }
  } else {
    target[`_serializable_${target.constructor.name}`]['_serializable_nonserialized'] = [key];
  }
}

/**
 * This decorator marks the property as mandatory for deserialization.
 *
 * @export
 * @param {*} target The target object.
 * @param {string} key The target property.
 */
export function Mandatory(target: any, key: string): void {
  if (!target[`_serializable_${target.constructor.name}`]) {
    target[`_serializable_${target.constructor.name}`] = {};
  }

  if (target[`_serializable_${target.constructor.name}`]['_serializable_mandatory']) {
    if (!target[`_serializable_${target.constructor.name}`]['_serializable_mandatory'].includes(key)) {
      target[`_serializable_${target.constructor.name}`]['_serializable_mandatory'].push(key);
    }
  } else {
    target[`_serializable_${target.constructor.name}`]['_serializable_mandatory'] = [key];
  }
}

/**
 * This decorator marks the property as a complex type for deserialization.
 * The type must be serializable itself.
 *
 * @export
 * @param {*} type The complex type.
 * @returns {(target: any, key: string) => void} The generated decorator.
 */


/**
 * This decorator marks the property as a complex type for deserialization.
 * The type must be serializable itself.
 *
 * @export
 * @param {*} type The complex type.
 * @param {boolean} [update] If set to true the setting is updated if existing.
 * @returns {(target: any, key: string) => void} The generated decorator.
 */
export function ComplexType(type: any, update?: boolean): (target: any, key: string) => void {
  return (target: any, key: string): void => {
    if (type === undefined) {
      throw new ReferenceError(`Invalid ComplexType definition of ${target.constructor.name}. Type can not be null.`);
    }

    if (!target[`_serializable_${target.constructor.name}`]) {
      target[`_serializable_${target.constructor.name}`] = {};
    }

    if (target[`_serializable_${target.constructor.name}`]['_serializable_complextype']) {
      if (!target[`_serializable_${target.constructor.name}`]['_serializable_complextype'].get(key) || update) {
        target[`_serializable_${target.constructor.name}`]['_serializable_complextype'].set(key, type);
      }
    } else {
      target[`_serializable_${target.constructor.name}`]['_serializable_complextype'] = new Map().set(key, type);
    }
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
  if (!target[`_serializable_${target.constructor.name}`]) {
    target[`_serializable_${target.constructor.name}`] = {};
  }

  if (target[`_serializable_${target.constructor.name}`]['_serializable_array']) {
    if (!target[`_serializable_${target.constructor.name}`]['_serializable_array'].includes(key)) {
      target[`_serializable_${target.constructor.name}`]['_serializable_array'].push(key);
    }
  } else {
    target[`_serializable_${target.constructor.name}`]['_serializable_array'] = [key];
  }
}

/**
 * This decorator adds a type implementation to the class metadata for deserialization of abstract types.
 * The type must be serializable itself.
 *
 * @export
 * @param {string} typeName The name of the type.
 * @param {*} type The type.
 * @param {boolean} [update] If set to true the setting is updated if existing.
 * @returns {(ctor: Function) => void} The generated decorator.
 */
export function AddTypeImplementation(typeName: string, type: any, update?: boolean): (ctor: Function) => void {
  return (ctor: Function) => {
    if (type === undefined) {
      throw new ReferenceError(`Invalid AddTypeImplementation definition of ${typeName}. Type can not be null.`);
    }

    if (!ctor.prototype[`_serializable_${ctor.name}`]) {
      ctor.prototype[`_serializable_${ctor.name}`] = {};
    }

    if (ctor.prototype[`_serializable_${ctor.name}`]['_serializable_typeimplementation']) {
      if (!ctor.prototype[`_serializable_${ctor.name}`]['_serializable_typeimplementation'].get(typeName) || update) {
        ctor.prototype[`_serializable_${ctor.name}`]['_serializable_typeimplementation'].set(typeName, type);
      }
    } else {
      ctor.prototype[`_serializable_${ctor.name}`]['_serializable_typeimplementation'] = new Map().set(typeName, type);
    }
  };
}

/**
 * This decorator marks a property as an abstract type.
 * All possible implementations of the type have to be added with the AddTypeImplementation decorator to the class first.
 *
 * @export
 * @param {*} typeProperty The property name in the serialized data with the type name information.
 * @param {boolean} [update] If set to true the setting is updated if existing.
 * @returns {(target: any, key: string) => void} The generated decorator.
 */
export function AbstractType(typeProperty: any, update?: boolean): (target: any, key: string) => void {
  return (target: any, key: string): void => {
    if (!target[`_serializable_${target.constructor.name}`]) {
      target[`_serializable_${target.constructor.name}`] = {};
    }

    if (target[`_serializable_${target.constructor.name}`]['_serializable_abstracttype']) {
      if (!target[`_serializable_${target.constructor.name}`]['_serializable_abstracttype'].get(key) || update) {
        target[`_serializable_${target.constructor.name}`]['_serializable_abstracttype'].set(key, typeProperty);
      }
    } else {
      target[`_serializable_${target.constructor.name}`]['_serializable_abstracttype'] = new Map().set(key, typeProperty);
    }
  };
}

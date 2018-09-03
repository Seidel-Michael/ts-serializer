import * as _ from 'lodash';

import {SerializedDataIsNotAnArrayError, SerializedObjectIncompleteError, UnknownTypeDefinitionError} from './errors';
import {Serializable} from './serializable';

/**
 * Provides serialization and deserialization methods.
 *
 * @export
 * @class Serializer
 */
export class Serializer {
  /**
   * Copies the array contents of inheritance classes.
   *
   * @private
   * @static
   * @param {*} object The object to work on.
   * @param {string} type The type name of the object.
   * @memberof Serializer
   */
  private static copyInheritanceArrayContent(object: any, type: string): void {
    let proto = Object.getPrototypeOf(object);
    const className = `_serializable_${type}`;

    while (proto) {
      const protoName = `_serializable_${proto.constructor.name}`;
      if (proto[protoName]) {
        if (proto[protoName]['_serializable_mandatory']) {
          object[className]['_serializable_mandatory'] =
              _.union(object[className]['_serializable_mandatory'], proto[protoName]['_serializable_mandatory']);
        }

        if (proto[protoName]['_serializable_nonserialized']) {
          object[className]['_serializable_nonserialized'] =
              _.union(object[className]['_serializable_nonserialized'], proto[protoName]['_serializable_nonserialized']);
        }

        if (proto[protoName]['_serializable_array']) {
          object[className]['_serializable_array'] = _.union(object[className]['_serializable_array'], proto[protoName]['_serializable_array']);
        }

        if (proto[protoName]['_serializable_complextype']) {
          object[className]['_serializable_complextype'] =
              this.combineMap(object[className]['_serializable_complextype'], proto[protoName]['_serializable_complextype']);
        }

        if (proto[protoName]['_serializable_abstracttype']) {
          object[className]['_serializable_abstracttype'] =
              this.combineMap(object[className]['_serializable_abstracttype'], proto[protoName]['_serializable_abstracttype']);
        }

        if (proto[protoName]['_serializable_typeimplementation']) {
          object[className]['_serializable_typeimplementation'] =
              this.combineMap(object[className]['_serializable_typeimplementation'], proto[protoName]['_serializable_typeimplementation']);
        }
      }

      proto = Object.getPrototypeOf(proto);
    }
  }

  /**
   * Combines two Maps.
   *
   * @private
   * @static
   * @param {*} map1 The fist map.
   * @param {*} map2 The second map.
   * @returns The combined map.
   * @memberof Serializer
   */
  private static combineMap(map1: any, map2: any): any {
    const result = new Map(map1.entries());

    map2.forEach((value, key) => {
      result.set(key, value);
    });

    return result;
  }

  /**
   * Initializes all mandatory arrays and maps on the object if not initialized already.
   *
   * @private
   * @static
   * @param {*} object The object to work on.
   * @param {string} type The type name of the object.
   * @memberof Serializer
   */
  private static initEmptyArrays(object: any, type: string): void {
    const className = `_serializable_${type}`;

    if (!object[className]) {
      object[className] = {};
    }

    // Init empty arrays
    if (!object[className]['_serializable_mandatory']) {
      object[className]['_serializable_mandatory'] = [];
    }

    if (!object[className]['_serializable_nonserialized']) {
      object[className]['_serializable_nonserialized'] = [];
    }

    if (!object[className]['_serializable_array']) {
      object[className]['_serializable_array'] = [];
    }

    if (!object[className]['_serializable_complextype']) {
      object[className]['_serializable_complextype'] = new Map();
    }

    if (!object[className]['_serializable_abstracttype']) {
      object[className]['_serializable_abstracttype'] = new Map();
    }

    if (!object[className]['_serializable_typeimplementation']) {
      object[className]['_serializable_typeimplementation'] = new Map();
    }
  }

  /**
   * Gets an instance of an abstract type.
   *
   * @private
   * @static
   * @param {*} serializedData The serialized input data.
   * @param {*} property The name of the serialized property.
   * @param {*} newObject The new object instance.
   * @returns {Promise<any>}
   * @memberof Serializer
   */
  private static async getAbstractType(serializedData: any, property: any, serializerArrays: any): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {

      const typeName = serializedData[serializerArrays['_serializable_abstracttype'].get(property)];

      if (!typeName) {
        reject(new SerializedObjectIncompleteError('abstract', serializedData, serializerArrays['_serializable_abstracttype'].get(property)));
        return;
      }

      const typeDefinition = serializerArrays['_serializable_typeimplementation'].get(typeName);

      if (!typeDefinition) {
        reject(new UnknownTypeDefinitionError(typeName, serializedData));
        return;
      }

      this.deserialize(typeDefinition, serializedData).then(resolve).catch(reject);
    });
  }

  /**
   * Deserializes an abstract object from the serialized data.
   *
   * @static
   * @template T The abstract type.
   * @param {*} containerType An container type with the TypeImplementation info.
   * @param {*} serializedData The serialized data.
   * @param {string} typeProperty The name of the property that specifies the type.
   * @returns {Promise<T>} Returns a promise resolving with the deserialize object
   * or rejecting with a SerializedObjectIncompleteError if a mandatory property is missing in the serialized data or
   * is rejected with UnknownTypeDefinitionError if the defined type could not be found.
   * @memberof Serializer
   */
  static deserializeAbstract<T extends Serializable>(containerType: any, serializedData: any, typeProperty: string): Promise<T> {
    return new Promise<T>(async (resolve, reject) => {

      // Init empty arrays
      this.initEmptyArrays(containerType.prototype, containerType.name);
      this.copyInheritanceArrayContent(containerType.prototype, containerType.name);

      const typeName = serializedData[typeProperty];

      if (!typeName) {
        reject(new SerializedObjectIncompleteError('abstract', serializedData, typeProperty));
        return;
      }

      const typeDefinition = containerType.prototype[`_serializable_${containerType.name}`]['_serializable_typeimplementation'].get(typeName);

      if (!typeDefinition) {
        reject(new UnknownTypeDefinitionError(typeName, serializedData));
        return;
      }

      this.deserialize(typeDefinition, serializedData).then(resolve).catch(reject);
    });
  }

  /**
   * Deserializes an item based on an array definition.
   *
   * @static
   * @template T The deserialized type.
   * @param {*} type The container type.
   * @param {*} serializedData The serialized data.
   * @param {string} propertyName The name of the array property used as the definition.
   * @returns {Promise<T>} Returns a promise resolving with the deserialize object
   * or rejecting with a SerializedObjectIncompleteError if a mandatory property is missing in the serialized data.
   * If the property is marked as abstract the promise is rejected with UnknownTypeDefinitionError if the defined type could not be found.
   * @memberof Serializer
   */
  static deserializeArrayItem<T extends Serializable>(type: any, serializedData: any, propertyName: string): Promise<T> {
    return new Promise<T>(async (resolve, reject) => {
      // Init empty arrays
      this.initEmptyArrays(type.prototype, type.name);
      this.copyInheritanceArrayContent(type.prototype, type.name);

      let newObject;

      const typeClassName = `_serializable_${type.name}`;

      // Plausibility checks
      if (!type.prototype[typeClassName]['_serializable_array'].includes(propertyName)) {
        reject(new ReferenceError(`The property ${propertyName} of type ${type.name} is not marked as an array type.`));
        return;
      }

      try {
        if (type.prototype[typeClassName]['_serializable_complextype'].get(propertyName)) {
          await this.deserialize(type.prototype[typeClassName]['_serializable_complextype'].get(propertyName), serializedData).then((obj) => {
            newObject = obj;
          });
        } else if (type.prototype[typeClassName]['_serializable_abstracttype'].get(propertyName)) {
          await this.getAbstractType(serializedData, propertyName, type.prototype[typeClassName]).then((obj) => {
            newObject = obj;
          });
        } else {
          throw new ReferenceError(`The property ${propertyName} of type ${type.name} is not marked as complex or abstract.`);
        }
      } catch (error) {
        reject(error);
      }

      resolve(newObject);
    });
  }

  /**
   * Deserializes one property of an object.
   *
   * @static
   * @template T The type of the property.
   * @param {*} type The type of the container object.
   * @param {*} serializedData The serialized data.
   * @param {string} propertyName The name of the property to deserialize.
   * @returns {Promise<T>} Returns a promise resolving with the deserialize object
   * or rejecting with a SerializedObjectIncompleteError if a mandatory property is missing in the serialized data.
   * If the property is marked as abstract the promise is rejected with UnknownTypeDefinitionError if the defined type could not be found.
   * @memberof Serializer
   */
  static deserializeProperty<T extends Serializable>(type: any, serializedData: any, propertyName: string): Promise<T> {
    return new Promise<T>(async (resolve, reject) => {
      // Init empty arrays
      this.initEmptyArrays(type.prototype, type.name);
      this.copyInheritanceArrayContent(type.prototype, type.name);

      let newObject;

      const typeClassName = `_serializable_${type.name}`;

      if (!type.prototype[typeClassName]['_serializable_nonserialized'].includes(propertyName) && serializedData[propertyName] !== null) {
        let data = serializedData[propertyName];

        if (data === undefined) {
          reject(new SerializedObjectIncompleteError(type.name, serializedData, propertyName));
          return;
        }

        const isArray = type.prototype[typeClassName]['_serializable_array'].includes(propertyName);

        if (isArray) {
          if (!Array.isArray(serializedData[propertyName])) {
            reject(new SerializedDataIsNotAnArrayError(propertyName, serializedData));
            return;
          }
          newObject = [];
        } else {
          // Create a dummy array.
          data = [serializedData[propertyName]];
        }

        for (const element of data) {
          if (type.prototype[typeClassName]['_serializable_complextype'].get(propertyName)) {
            await this.deserialize(type.prototype[typeClassName]['_serializable_complextype'].get(propertyName), element)
                .then((obj) => {
                  isArray ? newObject.push(obj) : newObject = obj;
                })
                .catch(reject);
          } else if (type.prototype[typeClassName]['_serializable_abstracttype'].get(propertyName)) {
            await this.getAbstractType(element, propertyName, type.prototype[typeClassName])
                .then((obj) => {
                  isArray ? newObject.push(obj) : newObject = obj;
                })
                .catch(reject);
          } else {
            isArray ? newObject.push(element) : newObject = element;
          }
        }

        resolve(newObject);
      }
    });
  }

  /**
   * Deserializes an object from serialized data.
   *
   * @static
   * @template T The expected returning type for compile time type definition.
   * @param {*} type The expected returning type for runtime usage by the serializer.
   * @param {*} serializedData The serialized data to deserialize.
   * @returns {Promise<T>} Returns a promise resolving with the deserialize object
   * or rejecting with a SerializedObjectIncompleteError if a mandatory property is missing in the serialized data.
   * If the property is marked as abstract the promise is rejected with UnknownTypeDefinitionError if the defined type could not be found.
   * @memberof Serializer
   */
  static deserialize<T extends Serializable>(type: any, serializedData: any): Promise<T> {
    return new Promise<T>(async (resolve, reject) => {

      // Init empty arrays
      this.initEmptyArrays(type.prototype, type.name);
      this.copyInheritanceArrayContent(type.prototype, type.name);

      const newObject = new type();

      const newObjectClassName = `_serializable_${type.name}`;

      // Check mandatory fields
      newObject[newObjectClassName]['_serializable_mandatory'].forEach(property => {
        if (!serializedData.hasOwnProperty(property) || serializedData[property] === undefined) {
          reject(new SerializedObjectIncompleteError(type.name, serializedData, property));
          return;
        }
      });

      const openPromises = [];

      // Assign values
      for (const property in serializedData) {
        if (!newObject[newObjectClassName]['_serializable_nonserialized'].includes(property)) {
          if (serializedData[property] === undefined) {
            continue;
          }

          if (serializedData[property] === null) {
            newObject[property] = null;
            continue;
          }

          openPromises.push(this.deserializeProperty(type, serializedData, property).then((result) => {
            newObject[property] = result;
          }));
        }
      }

      await Promise.all(openPromises).catch(reject);
      resolve(newObject);
    });
  }

  /**
   * Determines if a property is not non serialized and not a system _serializable_ proeprty.
   *
   * @private
   * @static
   * @param {*} object The container object.
   * @param {string} className The name of the class
   * @param {string} property The name of the property to check.
   * @returns {boolean} true if the property is serialized; otherwise false.
   * @memberof Serializer
   */
  private static isSerialized(object: any, className: string, property: string): boolean {
    return !object[className]['_serializable_nonserialized'].includes(property) && !property.startsWith('_serializable_');
  }

  /**
   * Serializes the object to serialized data.
   *
   * @static
   * @template T The expected returning type for compile time type definition.
   * @param {T} object The object to serialize.
   * @returns {Promise<any>} Returns a promise resolving with the serialized data.
   * @memberof Serializer
   */
  static serialize<T extends Serializable>(object: any): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
      // Init empty array
      this.initEmptyArrays(object, object.constructor.name);
      this.copyInheritanceArrayContent(object, object.constructor.name);
      const objectClassName = `_serializable_${object.constructor.name}`;
      const isTopLevelArray = Array.isArray(object);
      const serializedData: any = isTopLevelArray ? [] : {};

      // Iterate properties
      for (const property in object) {
        if (this.isSerialized(object, objectClassName, property)) {
          const isArray = object[objectClassName]['_serializable_array'].includes(property);

          // Crate Dummy array
          const data = isArray ? object[property] : [object[property]];
          const isComplexOrAbstractProperty = object[objectClassName]['_serializable_complextype'].get(property) ||
              object[objectClassName]['_serializable_abstracttype'].get(property);
          let serializeDataTemp: any = isArray ? [] : undefined;

          for (const element of data) {
            serializeDataTemp = await this.serializeElement(element, serializeDataTemp, isArray, isComplexOrAbstractProperty);
          }
          isTopLevelArray ? serializedData.push(serializeDataTemp) : serializedData[property] = serializeDataTemp;
        }
      }

      resolve(serializedData);
    });
  }

  /**
   * Serializes an element.
   *
   * @private
   * @static
   * @param {*} element The element to serialize.
   * @param {*} serializedData The input/output data.
   * @param {boolean} isArray true if the element is part of an array.
   * @param {boolean} isComplexOrAbstractProperty true if the type is abstract or complex.
   * @returns {Promise<any>} Returns the serialized data.
   * @memberof Serializer
   */
  private static async serializeElement(element: any, serializedData: any, isArray: boolean, isComplexOrAbstractProperty: boolean): Promise<any> {
    if (element === undefined || element === null) {
      return isArray ? serializedData : element;
    } else if (isComplexOrAbstractProperty) {
      const obj = await this.serialize(element);
      isArray ? serializedData.push(obj) : serializedData = obj;
    } else {
      isArray ? serializedData.push(element) : serializedData = element;
    }

    return serializedData;
  }
}
import * as fs from 'fs-extra';

import {FileNotFoundError, FileParseError, FileReadError, FileWriteError} from './errors';
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
    let protoName = `_serializable_${proto.constructor.name}`;

    while (proto) {
      protoName = `_serializable_${proto.constructor.name}`;
      if (proto[protoName]) {
        if (proto[protoName]['_serializable_mandatory']) {
          object[className]['_serializable_mandatory'].push.apply(
              object[className]['_serializable_mandatory'], proto[protoName]['_serializable_mandatory']);
        }

        if (proto[protoName]['_serializable_nonserialized']) {
          object[className]['_serializable_nonserialized'].push.apply(
              object[className]['_serializable_nonserialized'], proto[protoName]['_serializable_nonserialized']);
        }

        if (proto[protoName]['_serializable_array']) {
          object[className]['_serializable_array'].push.apply(object[className]['_serializable_array'], proto[protoName]['_serializable_array']);
        }

        if (proto[protoName]['_serializable_complextype']) {
          object[className]['_serializable_complextype'] =
              new Map([...object[className]['_serializable_complextype'], ...proto[protoName]['_serializable_complextype']]);
        }

        if (proto[protoName]['_serializable_abstracttype']) {
          object[className]['_serializable_abstracttype'] =
              new Map([...object[className]['_serializable_abstracttype'], ...proto[protoName]['_serializable_abstracttype']]);
        }

        if (proto[protoName]['_serializable_typeimplementation']) {
          object[className]['_serializable_typeimplementation'] =
              new Map([...object[className]['_serializable_typeimplementation'], ...proto[protoName]['_serializable_typeimplementation']]);
        }
      }

      proto = Object.getPrototypeOf(proto);
    }
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
  private static async getAbstractType(serializedData: any, property: any, newObject: any): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
      const newObjectClassName = `_serializable_${newObject.constructor.name}`;

      const typeName = serializedData[newObject[newObjectClassName]['_serializable_abstracttype'].get(property)];

      if (!typeName) {
        reject(new SerializedObjectIncompleteError(
            'abstract', serializedData, newObject[newObjectClassName]['_serializable_abstracttype'].get(property)));
        return;
      }

      const typeDefinition = newObject[newObjectClassName]['_serializable_typeimplementation'].get(typeName);

      if (!typeDefinition) {
        reject(new UnknownTypeDefinitionError(typeName, serializedData));
        return;
      }

      this.deserialize(typeDefinition, serializedData).then(resolve).catch(reject);
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
          let data = serializedData[property];

          if(data === undefined)
          {
            newObject[property] = undefined;
            continue;
          }

          const isArray = newObject[newObjectClassName]['_serializable_array'].includes(property);

          if (isArray) {
            if (!Array.isArray(serializedData[property])) {
              reject(new SerializedDataIsNotAnArrayError(property, serializedData));
              return;
            }
            newObject[property] = [];
          } else {
            // Create a dummy array.
            data = [serializedData[property]];
          }

          data.forEach(element => {
            if (newObject[newObjectClassName]['_serializable_complextype'].get(property)) {
              openPromises.push(this.deserialize(newObject[newObjectClassName]['_serializable_complextype'].get(property), element).then((obj) => {
                isArray ? newObject[property].push(obj) : newObject[property] = obj;
              }));
            } else if (newObject[newObjectClassName]['_serializable_abstracttype'].get(property)) {
              openPromises.push(this.getAbstractType(element, property, newObject).then((obj) => {
                isArray ? newObject[property].push(obj) : newObject[property] = obj;
              }));
            } else {
              isArray ? newObject[property].push(element) : newObject[property] = element;
            }
          });
        }
      }

      await Promise.all(openPromises).catch(reject);
      resolve(newObject);
    });
  }

  /**
   * Deserializes a file from serialized data.
   *
   * @static
   * @template T The expected returning type for compile time type definition.
   * @param {*} type The expected returning type for runtime usage by the serializer.
   * @param {*} file The path to the file to deserialize.
   * @returns {Promise<T>} Returns a promise resolving with the deserialize object
   * or rejecting with a SerializedObjectIncompleteError if a mandatory property is missing in the serialized data.
   * It also rejects with FileNotFoundError if the file could not be found; FileReadError if any error ocurred during read;
   * FileParseError if the file content is not valid json.
   * If the property is marked as abstract the promise is rejected with UnknownTypeDefinitionError if the defined type could not be found.
   * @memberof Serializer
   */
  static deserializeFile<T extends Serializable>(type: any, file: any): Promise<T> {
    return new Promise<T>((resolve, reject) => {

      if (!fs.existsSync(file)) {
        reject(new FileNotFoundError(file));
        return;
      }

      fs.readJson(file)
          .catch((error) => {
            if (error instanceof SyntaxError) {
              reject(new FileParseError(file, error));
              return;
            }

            reject(new FileReadError(file, error));
            return;
          })
          .then((serializedData) => {
            this.deserialize<T>(type, serializedData).then(resolve).catch(reject);
          });
    });
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
      const serializedData: any = {};
      const openPromises = [];
      const objectClassName = `_serializable_${object.constructor.name}`;

      // Iterate properties
      for (const property in object) {
        if (!object[objectClassName]['_serializable_nonserialized'].includes(property) && !property.startsWith('_serializable_')) {
          const isArray = object[objectClassName]['_serializable_array'].includes(property);

          // Crate Dummy array
          const data = isArray ? object[property] : [object[property]];
          serializedData[property] = isArray ? [] : undefined;

          data.forEach(element => {
            if (element === undefined) {
              serializedData[property] = undefined;
            } else if (
                object[objectClassName]['_serializable_complextype'].get(property) ||
                object[objectClassName]['_serializable_abstracttype'].get(property)) {
              openPromises.push(this.serialize(element).then((obj) => {
                isArray ? serializedData[property].push(obj) : serializedData[property] = obj;
              }));
            } else {
              isArray ? serializedData[property].push(element) : serializedData[property] = element;
            }
          });
        }
      }

      await Promise.all(openPromises).catch(reject);
      resolve(serializedData);
    });
  }

  /**
   * Serialized the object to a file.
   *
   * @static
   * @template T The expected returning type for compile time type definition.
   * @param {T} object The object to serialize.
   * @param {*} file The path to the file to serialize to. Not existing files and folders will be created.
   * @returns {Promise<void>} Returns a promise resolving if the file was written successfully.
   * The promise will be rejected with a FileWriteError if anything went wrong during writing or creating the folders and file.
   * @memberof Serializer
   */
  static serializeFile<T extends Serializable>(object: T, file: any): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.serialize(object).then((serializedData) => {

        fs.ensureFile(file)
            .catch((error) => {
              reject(new FileWriteError(file, error));
            })
            .then(() => {
              fs.writeJson(file, serializedData, {spaces: ' '})
                  .catch((error) => {
                    reject(new FileWriteError(file, error));
                  })
                  .then(resolve);
            });

      });
    });
  }
}
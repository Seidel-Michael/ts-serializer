import * as fs from 'fs-extra';

import {FileNotFoundError, FileParseError, FileReadError, FileWriteError, SerializedObjectIncompleteError} from './errors';
import {Serializable} from './serializable';

/**
 * Provides serialization and deserialization methods.
 *
 * @export
 * @class Serializer
 */
export class Serializer {
  /**
   * Deserializes an object from serialized data.
   *
   * @static
   * @template T The expected returning type for compile time type definition.
   * @param {*} type The expected returning type for runtime usage by the serializer.
   * @param {*} serializedData The serialized data to deserialize.
   * @returns {Promise<T>} Returns a promise resolving with the deserialize object
   * or rejecting with a SerializedObjectIncompleteError if a mandatory property is missing in the serialized data.
   * @memberof Serializer
   */
  static deserialize<T extends Serializable>(type: any, serializedData: any): Promise<T> {
    return new Promise<T>((resolve, reject) => {

      const newObject = new type();

      // Init empty arrays
      if (!newObject['_serializable_mandatory']) {
        newObject['_serializable_mandatory'] = [];
      }

      if (!newObject['_serializable_nonserialized']) {
        newObject['_serializable_nonserialized'] = [];
      }

      // Check mandatory fields
      newObject['_serializable_mandatory'].forEach(property => {
        if (!serializedData[property]) {
          reject(new SerializedObjectIncompleteError(type.name, serializedData, property));
          return;
        }
      });

      // Assign values
      for (const property in serializedData) {
        if (!newObject['_serializable_nonserialized'].includes(property)) {
          newObject[property] = serializedData[property];
        }
      }

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
  static serialize<T extends Serializable>(object: T): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      // Init empty array
      if (!object['_serializable_nonserialized']) {
        object['_serializable_nonserialized'] = [];
      }

      const serializedData: any = {};

      // Iterate properties
      for (const property in object) {
        if (!object['_serializable_nonserialized'].includes(property) && !property.startsWith('_serializable_')) {
          serializedData[property] = object[property];
        }
      }

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
              fs.writeJson(file, serializedData)
                  .catch((error) => {
                    reject(new FileWriteError(file, error));
                  })
                  .then(resolve);
            });

      });
    });
  }
}
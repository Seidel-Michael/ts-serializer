/**
 * The SerializedObjectIncompleteError is thrown whenever a mandatory property is missing in the serialized data.
 * 
 * @export
 * @class SerializedObjectIncompleteError
 * @extends {Error}
 */
export class SerializedObjectIncompleteError extends Error {
  /**
   * The name of the missing property.
   *
   * @type {string}
   * @memberof SerializedObjectIncompleteError
   */
  missingProperty: string;

  /**
   * The serialized data.
   *
   * @type {*}
   * @memberof SerializedObjectIncompleteError
   */
  serializedData: any;

  /**
   * The target type of the serialization.
   *
   * @type {string}
   * @memberof SerializedObjectIncompleteError
   */
  targetType: string;

  /**
   * Creates an instance of SerializedObjectIncompleteError.
   * @param {string} targetType The target type of the serialization.
   * @param {*} serializedData The serialized data.
   * @param {string} missingProperty The name of the missing property.
   * @memberof SerializedObjectIncompleteError
   */
  constructor(targetType: string, serializedData: any, missingProperty: string) {
    super(`The mandatory property ${missingProperty} of type ${targetType} could not be found in the serialized data.`);

    this.name = this.constructor.name;
    this.missingProperty = missingProperty;
    this.serializedData = serializedData;
    this.targetType = targetType;

    (Error as any).captureStackTrace(this, this.constructor);
  }
}
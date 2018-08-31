/**
 * The SerializedDataIsNotAnArrayError is thrown whenever the a property is marked as an array but isn't one.
 *
 * @export
 * @class SerializedDataIsNotAnArrayError
 * @extends {Error}
 */
export class SerializedDataIsNotAnArrayError extends Error {
  /**
   * The name of the invalid property.
   *
   * @type {string}
   * @memberof SerializedDataIsNotAnArrayError
   */
  invalidProperty: string;

  /**
   * The serialized data.
   *
   * @type {*}
   * @memberof SerializedDataIsNotAnArrayError
   */
  serializedData: any;

  /**
   * Creates an instance of SerializedDataIsNotAnArrayError.
   * @param {string} invalidProperty The name invalid property.
   * @param {*} serializedData The serialized data.
   * @memberof SerializedDataIsNotAnArrayError
   */
  constructor(invalidProperty: string, serializedData: any) {
    super(`The property ${invalidProperty} is not an array.`);
    Object.setPrototypeOf(this, SerializedDataIsNotAnArrayError.prototype);

    this.name = this.constructor.name;
    this.invalidProperty = invalidProperty;
    this.serializedData = serializedData;

    (Error as any).captureStackTrace(this, this.constructor);
  }
}
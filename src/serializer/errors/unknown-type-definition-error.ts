/**
 * The UnknownTypeDefinitionError is thrown whenever the implementation of an abstract type is not defined.
 *
 * @export
 * @class UnknownTypeDefinitionError
 * @extends {Error}
 */
export class UnknownTypeDefinitionError extends Error {
  /**
   * The name of the unknown type.
   *
   * @type {string}
   * @memberof UnknownTypeDefinitionError
   */
  unknownType: string;

  /**
   * The serialized data.
   *
   * @type {*}
   * @memberof UnknownTypeDefinitionError
   */
  serializedData: any;

  /**
   * Creates an instance of UnknownTypeDefinitionError.
   * @param {string} unknownType The unknown type.
   * @param {*} serializedData The serialized data.
   * @memberof UnknownTypeDefinitionError
   */
  constructor(unknownType: string, serializedData: any) {
    super(`The implementation of the abstract type ${unknownType} is not defined.`);
    Object.setPrototypeOf(this, UnknownTypeDefinitionError.prototype);

    this.name = this.constructor.name;
    this.unknownType = unknownType;
    this.serializedData = serializedData;

    (Error as any).captureStackTrace(this, this.constructor);
  }
}
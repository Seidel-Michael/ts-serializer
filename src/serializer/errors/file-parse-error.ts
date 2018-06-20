/**
 * The FileParseError is thrown whenever an error occurred during a parsing attempt.
 * 
 * @export
 * @class FileParseError
 * @extends {Error}
 */
export class FileParseError extends Error {
  /**
   * The full path to the failing file.
   *
   * @type {string}
   * @memberof FileParseError
   */
  file: string;

  /**
   * The error retrieved from the parsing attempt.
   *
   * @type {Error}
   * @memberof FileParseError
   */
  innerError: Error;

  /**
   * Creates an instance of FileParseError.
   * @param {string} file The full path to the failing file.
   * @param {Error} innerError The error retrieved from the parsing attempt.
   * @memberof FileParseError
   */
  constructor(file: string, innerError: Error) {
    super(`The file ${file} could not be parsed.`);

    this.name = this.constructor.name;
    this.file = file;
    this.innerError = innerError;

    (Error as any).captureStackTrace(this, this.constructor);
  }
}
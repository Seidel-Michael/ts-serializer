/**
 * The FileReadError is thrown whenever an error occurred during a file read attempt.
 * 
 * @export
 * @class FileReadError
 * @extends {Error}
 */
export class FileReadError extends Error {
  /**
   * The full path to the failing file.
   *
   * @type {string}
   * @memberof FileReadError
   */
  file: string;

  /**
   * The error retrieved from the read attempt.
   *
   * @type {Error}
   * @memberof FileReadError
   */
  innerError: Error;

  /**
   * Creates an instance of FileReadError.
   * @param {string} file The full path to the failing file.
   * @param {Error} innerError The error retrieved from the read attempt.
   * @memberof FileReadError
   */
  constructor(file: string, innerError: Error) {
    super(`The file ${file} could not be read.`);
    Object.setPrototypeOf(this, FileReadError.prototype);

    this.name = this.constructor.name;
    this.file = file;
    this.innerError = innerError;

    (Error as any).captureStackTrace(this, this.constructor);
  }
}
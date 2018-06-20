/**
 * The FileNotFoundError is thrown whenever a file could not be found on the
 * disk.
 *
 * @export
 * @class FileNotFoundError
 * @extends {Error}
 */
export class FileNotFoundError extends Error {
  /**
   * The full path to the missing file.
   *
   * @type {string}
   * @memberof FileNotFoundError
   */
  file: string;

  /**
   * Creates an instance of FileNotFoundError.
   * @param {string} file The full path to the missing file.
   * @memberof FileNotFoundError
   */
  constructor(file: string) {
    super(`The file ${file} could not be found.`);

    this.name = this.constructor.name;
    this.file = file;

    (Error as any).captureStackTrace(this, this.constructor);
  }
}
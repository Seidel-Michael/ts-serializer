/**
 * The FileWriteError is thrown whenever an error occurred during a file write attempt.
 * 
 * @export
 * @class FileWriteError
 * @extends {Error}
 */
export class FileWriteError extends Error {
    /**
     * The full path to the failing file.
     *
     * @type {string}
     * @memberof FileWriteError
     */
    file: string;
  
    /**
     * The error retrieved from the write attempt.
     *
     * @type {Error}
     * @memberof FileWriteError
     */
    innerError: Error;
  
    /**
     * Creates an instance of FileWriteError.
     * @param {string} file The full path to the failing file.
     * @param {Error} innerError The error retrieved from the write attempt.
     * @memberof FileWriteError
     */
    constructor(file: string, innerError: Error) {
      super(`The file ${file} could not be written.`);
  
      this.name = this.constructor.name;
      this.file = file;
      this.innerError = innerError;
  
      Error.captureStackTrace(this, this.constructor);
    }
  }
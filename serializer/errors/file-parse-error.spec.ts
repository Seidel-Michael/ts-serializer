import {expect} from 'chai';
import * as sinon from 'sinon';
import {FileParseError} from './file-parse-error';

describe('FileParseError constructor', () => {
  let errorCaptureStackTraceStub;

  beforeEach(() => {
    errorCaptureStackTraceStub = sinon.stub(Error, 'captureStackTrace');
    errorCaptureStackTraceStub.callsFake((instance) => {
      instance.stack = 'ThisIsAStackTrace';
    });
  });

  afterEach(() => {
    errorCaptureStackTraceStub.restore();
  });

  describe('constructor', () => {
    it('should set correct message', () => {
      const originalError = new Error('This is any error');
      const error = new FileParseError('/test/file', originalError);
      expect(error.message)
          .to.equal('The file /test/file could not be parsed.');
    });

    it('should set correct file property', () => {
      const originalError = new Error('This is any error');
      const error = new FileParseError('/test/file', originalError);
      expect(error.file).to.equal('/test/file');
    });

    it('should set correct innerError property', () => {
      const originalError = new Error('This is any error');
      const error = new FileParseError('/test/file', originalError);
      expect(error.innerError).to.equal(originalError);
    });

    it('should set correct stacktrace', () => {
      const originalError = new Error('This is any error');
      const error = new FileParseError('/test/file', originalError);
      expect(error.stack).to.equal('ThisIsAStackTrace');
    });

    it('should set correct name', () => {
      const originalError = new Error('This is any error');
      const error = new FileParseError('/test/file', originalError);
      expect(error.name).to.equal('FileParseError');
    });
  });
});

import {expect} from 'chai';
import * as sinon from 'sinon';
import {FileNotFoundError} from './file-not-found-error';

describe('FileNotFoundError constructor', () => {
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
      const error = new FileNotFoundError('/test/file');
      expect(error.message).to.equal('The file /test/file could not be found.');
    });

    it('should set correct file property', () => {
      const error = new FileNotFoundError('/test/file');
      expect(error.file).to.equal('/test/file');
    });

    it('should set correct currentDir property', () => {
      const error = new FileNotFoundError('/test/file');
      expect(error.currentDir).to.equal(__dirname);
    });

    it('should set correct stacktrace', () => {
      const error = new FileNotFoundError('/test/file');
      expect(error.stack).to.equal('ThisIsAStackTrace');
    });

    it('should set correct name', () => {
      const error = new FileNotFoundError('/test/file');
      expect(error.name).to.equal('FileNotFoundError');
    });
  });
});

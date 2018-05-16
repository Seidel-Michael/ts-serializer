import {expect} from 'chai';
import * as sinon from 'sinon';
import {SerializedDataIsNotAnArrayError} from './serialized-data-is-not-an-array-error';

describe('SerializedDataIsNotAnArrayError constructor', () => {
  let errorCaptureStackTraceStub;

  let serializedData;

  beforeEach(() => {
    errorCaptureStackTraceStub = sinon.stub(Error, 'captureStackTrace');
    errorCaptureStackTraceStub.callsFake((instance) => {
      instance.stack = 'ThisIsAStackTrace';
    });

    serializedData = {test: 'abc'};
  });

  afterEach(() => {
    errorCaptureStackTraceStub.restore();
  });

  describe('constructor', () => {
    it('should set correct message', () => {
      const error = new SerializedDataIsNotAnArrayError('test', serializedData);
      expect(error.message).to.equal('The property test is not an array.');
    });

    it('should set correct missingProperty property', () => {
      const error = new SerializedDataIsNotAnArrayError('test', serializedData);
      expect(error.invalidProperty).to.equal('test');
    });

    it('should set correct serializedData property', () => {
      const error = new SerializedDataIsNotAnArrayError('test', serializedData);
      expect(error.serializedData).to.equal(serializedData);
    });

    it('should set correct stacktrace', () => {
      const error = new SerializedDataIsNotAnArrayError('test', serializedData);
      expect(error.stack).to.equal('ThisIsAStackTrace');
    });

    it('should set correct name', () => {
      const error = new SerializedDataIsNotAnArrayError('test', serializedData);
      expect(error.name).to.equal('SerializedDataIsNotAnArrayError');
    });
  });
});

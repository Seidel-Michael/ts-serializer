import {expect} from 'chai';
import * as sinon from 'sinon';
import {SerializedObjectIncompleteError} from './serialized-object-incomplete-error';

describe('SerializedObjectIncompleteError constructor', () => {
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
      const error = new SerializedObjectIncompleteError(typeof (''), serializedData, 'abc');
      expect(error.message).to.equal('The mandatory property abc of type string could not be found in the serialized data.');
    });

    it('should set correct missingProperty property', () => {
      const error = new SerializedObjectIncompleteError(typeof (''), serializedData, 'abc');
      expect(error.missingProperty).to.equal('abc');
    });

    it('should set correct serializedData property', () => {
      const error = new SerializedObjectIncompleteError(typeof (''), serializedData, 'abc');
      expect(error.serializedData).to.equal(serializedData);
    });

    it('should set correct targetType property', () => {
      const error = new SerializedObjectIncompleteError(typeof (''), serializedData, 'abc');
      expect(error.targetType).to.equal('string');
    });

    it('should set correct stacktrace', () => {
      const error = new SerializedObjectIncompleteError(typeof (''), serializedData, 'abc');
      expect(error.stack).to.equal('ThisIsAStackTrace');
    });

    it('should set correct name', () => {
      const error = new SerializedObjectIncompleteError(typeof (''), serializedData, 'abc');
      expect(error.name).to.equal('SerializedObjectIncompleteError');
    });
  });
});

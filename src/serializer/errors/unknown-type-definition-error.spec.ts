import {expect} from 'chai';
import * as sinon from 'sinon';
import {UnknownTypeDefinitionError} from './unknown-type-definition-error';

describe('UnknownTypeDefinitionError constructor', () => {
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
      const error = new UnknownTypeDefinitionError('test', serializedData);
      expect(error.message).to.equal('The implementation of the abstract type test is not defined.');
    });

    it('should set correct missingProperty property', () => {
      const error = new UnknownTypeDefinitionError('test', serializedData);
      expect(error.unknownType).to.equal('test');
    });

    it('should set correct serializedData property', () => {
      const error = new UnknownTypeDefinitionError('test', serializedData);
      expect(error.serializedData).to.equal(serializedData);
    });

    it('should set correct stacktrace', () => {
      const error = new UnknownTypeDefinitionError('test', serializedData);
      expect(error.stack).to.equal('ThisIsAStackTrace');
    });

    it('should set correct name', () => {
      const error = new UnknownTypeDefinitionError('test', serializedData);
      expect(error.name).to.equal('UnknownTypeDefinitionError');
    });
  });
});

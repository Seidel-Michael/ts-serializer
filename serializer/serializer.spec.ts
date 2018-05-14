/* tslint:disable:completed-docs */

import * as chai from 'chai';
import {expect} from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as fs from 'fs-extra';
import * as mockFS from 'mock-fs';
import * as sinon from 'sinon';

import {FileNotFoundError, FileParseError, FileReadError, FileWriteError, SerializedObjectIncompleteError} from './errors';
import {Serializable} from './serializable';
import {Serializer} from './serializer';

chai.use(chaiAsPromised);

class TestClassNoMandatoryNoExclude implements Serializable {
  test: string;

  constructor() {
    this.test = 'Test123';
  }
}

class TestClassMandatoryNoExclude implements Serializable {
  mandatoryProperty: string;

  test: string;

  constructor() {
    this.test = 'Test123';
    this['_serializable_mandatory'] = ['mandatoryProperty'];
  }
}

class TestClassMandatoryExclude implements Serializable {
  mandatoryProperty: string;

  excludedProperty: string;

  test: string;

  constructor() {
    this.test = 'Test123';
    this['_serializable_mandatory'] = ['mandatoryProperty'];
    this['_serializable_nonserialized'] = ['excludedProperty'];
  }
}

class TestClassNoMandatoryExclude implements Serializable {
  excludedProperty: string;

  test: string;

  constructor() {
    this.test = 'Test123';
    this['_serializable_nonserialized'] = ['excludedProperty'];
  }
}

describe('Serializer', () => {
  describe('deserialize', () => {
    it('should resolve with deserialized object - no input data, no mandatory, no exclude', () => {
      const testData = {};

      return expect(Serializer.deserialize<TestClassNoMandatoryNoExclude>(TestClassNoMandatoryNoExclude, testData))
          .to.eventually.be.instanceOf(TestClassNoMandatoryNoExclude);
    });

    it('should resolve with deserialized object - valid input data, no mandatory, no exclude', () => {
      const testData = {test: 'IAmATest'};

      return expect(Serializer.deserialize<TestClassNoMandatoryNoExclude>(TestClassNoMandatoryNoExclude, testData)).to.eventually.include({
        test: 'IAmATest'
      });
    });

    it('should resolve with deserialized object - valid input data, mandatory, no exclude', () => {
      const testData = {mandatoryProperty: 'TestingTest'};

      return expect(Serializer.deserialize<TestClassMandatoryNoExclude>(TestClassMandatoryNoExclude, testData))
          .to.eventually.include({test: 'Test123', mandatoryProperty: 'TestingTest'});
    });

    it('should resolve with deserialized object - valid input data, mandatory, exclude', () => {
      const testData = {mandatoryProperty: 'TestingTest'};

      return expect(Serializer.deserialize<TestClassMandatoryExclude>(TestClassMandatoryExclude, testData))
          .to.eventually.include({test: 'Test123', mandatoryProperty: 'TestingTest'});
    });

    it('should resolve with deserialized object ignoring dispensable data - too much input data, no mandatory, no exclude', () => {
      const testData = {test: 'IAmATest', too_much: 'I am too much'};

      return expect(Serializer.deserialize<TestClassNoMandatoryNoExclude>(TestClassNoMandatoryNoExclude, testData)).to.eventually.include({
        test: 'IAmATest'
      });
    });

    it('should resolve with deserialized object ignoring excluded data - input data with excluded data, no mandatory, exclude', () => {
      const testData = {test: 'IAmATest', excludedProperty: 'I am too excluded'};

      return expect(Serializer.deserialize<TestClassNoMandatoryExclude>(TestClassNoMandatoryExclude, testData)).to.eventually.include({
        test: 'IAmATest'
      });
    });

    it('should reject with SerializedObjectIncompleteError if mandatory data is missing', () => {
      const testData = {test: 'IAmATest'};

      return expect(Serializer.deserialize<TestClassMandatoryNoExclude>(TestClassMandatoryNoExclude, testData))
          .to.be.rejectedWith(SerializedObjectIncompleteError);
    });
  });

  describe('deserializeFile', () => {
    let stub = null;

    afterEach(() => {
      if (stub) {
        stub.restore();
        stub = null;
      }

      mockFS.restore();
    });

    it('should reject with FileNotFoundError if the given file does not exist', () => {
      mockFS({});

      return expect(Serializer.deserializeFile<TestClassNoMandatoryNoExclude>(TestClassNoMandatoryNoExclude, '/testFolder/testFile.json'))
          .to.be.rejectedWith(FileNotFoundError);
    });

    it('should reject with FileReadError if the given file could not be read', () => {
      mockFS({
        '/testFolder/testFile.json': mockFS.file({
          content: JSON.stringify({test: 'cde'}),
        }),
      });

      stub = sinon.stub(fs, 'readJson').rejects(Error);

      return expect(Serializer.deserializeFile<TestClassNoMandatoryNoExclude>(TestClassNoMandatoryNoExclude, '/testFolder/testFile.json'))
          .to.be.rejectedWith(FileReadError);
    });

    it('should reject with FileParseError if the given file does not contain valid json', () => {
      mockFS({
        '/testFolder/testFile.json': mockFS.file({
          content: '<xml></xml>',
        })
      });

      return expect(Serializer.deserializeFile<TestClassNoMandatoryNoExclude>(TestClassNoMandatoryNoExclude, '/testFolder/testFile.json'))
          .to.be.rejectedWith(FileParseError);
    });

    it('should resolve with deserialized object if file is ok', () => {
      mockFS({
        '/testFolder/testFile.json': mockFS.file({
          content: JSON.stringify({test: 'cde'}),
        }),
      });

      return expect(Serializer.deserializeFile<TestClassNoMandatoryNoExclude>(TestClassNoMandatoryNoExclude, '/testFolder/testFile.json'))
          .to.eventually.include({test: 'cde'});
    });
  });

  describe('serialize', () => {
    it('should resolve with valid serialized object - no exclude', () => {
      const object = new TestClassMandatoryNoExclude();
      object.mandatoryProperty = 'test';

      return expect(Serializer.serialize<TestClassMandatoryNoExclude>(object)).to.eventually.deep.equal({test: 'Test123', mandatoryProperty: 'test'});
    });

    it('should resolve with valid serialized object - exclude', () => {
      const object = new TestClassMandatoryExclude();
      object.mandatoryProperty = 'test';
      object.excludedProperty = 'abc test';

      return expect(Serializer.serialize<TestClassMandatoryExclude>(object)).to.eventually.deep.equal({test: 'Test123', mandatoryProperty: 'test'});
    });
  });

  describe('serializeFile', () => {
    let stub = null;

    afterEach(() => {
      if (stub) {
        stub.restore();
        stub = null;
      }

      mockFS.restore();
    });

    it('should create new file if the file does not exist', async () => {
      mockFS({});

      const testObject = new TestClassNoMandatoryNoExclude();

      await Serializer.serializeFile<TestClassNoMandatoryNoExclude>(testObject, '/testFolder/testFile.json');

      expect(fs.readJsonSync('/testFolder/testFile.json')).to.deep.equal({test: 'Test123'});
    });

    it('should overwrite file if the file does exist', async () => {
      mockFS({
        '/testFolder/testFile.json': mockFS.file({
          content: JSON.stringify({test: 'cde'}),
        }),
      });

      const testObject = new TestClassNoMandatoryNoExclude();

      await Serializer.serializeFile<TestClassNoMandatoryNoExclude>(testObject, '/testFolder/testFile.json');

      expect(fs.readJsonSync('/testFolder/testFile.json')).to.deep.equal({test: 'Test123'});
    });

    it('should reject with FileWriteError if an error ocurred while creating file or folder', () => {
      mockFS({});

      stub = sinon.stub(fs, 'ensureFile').rejects(Error);

      const testObject = new TestClassNoMandatoryNoExclude();

      return expect(Serializer.serializeFile<TestClassNoMandatoryNoExclude>(testObject, '/testFolder/testFile.json'))
          .to.be.rejectedWith(FileWriteError);
    });

    it('should reject with FileWriteError if an error ocurred while writing', () => {
      mockFS({
        '/testFolder/testFile.json': mockFS.file({
          content: JSON.stringify({test: 'cde'}),
        }),
      });

      stub = sinon.stub(fs, 'writeJson').rejects(Error);

      const testObject = new TestClassNoMandatoryNoExclude();

      return expect(Serializer.serializeFile<TestClassNoMandatoryNoExclude>(testObject, '/testFolder/testFile.json'))
          .to.be.rejectedWith(FileWriteError);
    });
  });
});
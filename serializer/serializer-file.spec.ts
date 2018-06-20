/* tslint:disable:completed-docs */

import * as chai from 'chai';
import {expect} from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as fs from 'fs-extra';
import * as mockFS from 'mock-fs';
import * as sinon from 'sinon';

import {FileNotFoundError, FileParseError, FileReadError, FileWriteError} from './errors';
import {Serializable} from './serializable';
import {Serializer} from './serializer-file';

chai.use(chaiAsPromised);

class TestClassNoMandatoryNoExclude implements Serializable {
  test: string;

  constructor() {
    this.test = 'Test123';
  }
}

describe('Serializer', () => {
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
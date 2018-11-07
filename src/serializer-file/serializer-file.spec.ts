/* tslint:disable:completed-docs */

import * as chai from 'chai';
import {expect} from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as fs from 'fs-extra';
import * as mockFS from 'mock-fs';
import * as sinon from 'sinon';

import {FileNotFoundError, FileParseError, FileReadError, FileWriteError} from './../serializer/errors';
import {Serializable} from './../serializer/serializable';
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
    let deserializeStub = null;

    afterEach(() => {
      if (stub) {
        stub.restore();
        stub = null;
      }

      if (deserializeStub) {
        deserializeStub.restore();
        deserializeStub = null;
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

    it('should not call deserialize when fs.readJson rejects', async () => {
      mockFS({
        '/testFolder/testFile.json': mockFS.file({
          content: JSON.stringify({test: 'cde'}),
        }),
      });

      stub = sinon.stub(fs, 'readJson').rejects(Error);
      deserializeStub = sinon.stub(Serializer, 'deserialize').resolves();

      try {
        await Serializer.deserializeFile<TestClassNoMandatoryNoExclude>(TestClassNoMandatoryNoExclude, '/testFolder/testFile.json');
      } catch {
        expect(deserializeStub.callCount).to.equal(0);
      }
    });
  });

  describe('serializeFile', () => {
    let stub1 = null;
    let stub2 = null;

    afterEach(() => {
      if (stub1) {
        stub1.restore();
        stub1 = null;
      }

      if (stub2) {
        stub2.restore();
        stub2 = null;
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

      stub1 = sinon.stub(fs, 'ensureFile').rejects(Error);

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

      stub1 = sinon.stub(fs, 'writeJson').rejects(Error);

      const testObject = new TestClassNoMandatoryNoExclude();

      return expect(Serializer.serializeFile<TestClassNoMandatoryNoExclude>(testObject, '/testFolder/testFile.json'))
          .to.be.rejectedWith(FileWriteError);
    });

    it('should not call writeJson when fs.ensureFile rejects', async () => {
      mockFS({
        '/testFolder/testFile.json': mockFS.file({
          content: JSON.stringify({test: 'cde'}),
        }),
      });

      stub1 = sinon.stub(fs, 'ensureFile').rejects(Error);
      stub2 = sinon.stub(fs, 'writeJson').resolves();

      const testObject = new TestClassNoMandatoryNoExclude();

      try {
        await Serializer.serializeFile<TestClassNoMandatoryNoExclude>(testObject, '/testFolder/testFile.json');
      } catch {
        expect(stub2.callCount).to.equal(0);
      }
    });
  });
});
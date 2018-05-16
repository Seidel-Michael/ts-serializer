/* tslint:disable:completed-docs */

import * as chai from 'chai';
import {expect} from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as fs from 'fs-extra';
import * as mockFS from 'mock-fs';
import * as sinon from 'sinon';

import {FileNotFoundError, FileParseError, FileReadError, FileWriteError} from './errors';
import {SerializedDataIsNotAnArrayError, SerializedObjectIncompleteError, UnknownTypeDefinitionError} from './errors';
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

class TestClassAbstractTypeNoMandatoryNoExclude implements Serializable {
  abstractType: any;

  test: string;

  constructor() {
    this.test = 'Test123';
    this.abstractType = {};
    this.abstractType.typeDef = 'abstract';
    this.abstractType['_serializable_mandatory'] = ['typeDef'];
    this['_serializable_abstracttype'] = new Map().set('abstractType', 'typeDef');
    TestClassAbstractTypeNoMandatoryNoExclude.prototype['_serializable_typeimplementation'] = new Map().set('testType', TestClassMandatoryNoExclude);
  }
}

class TestClassArrayNoMandatoryNoExclude implements Serializable {
  abstractTypeArray: any[];

  complexTypeArray: TestClassNoMandatoryNoExclude[];

  simpleArray: string[];

  constructor() {
    TestClassArrayNoMandatoryNoExclude.prototype['_serializable_typeimplementation'] = new Map().set('testType', TestClassNoMandatoryNoExclude);
    TestClassArrayNoMandatoryNoExclude.prototype['_serializable_typeimplementation'].set('testTypeB', TestClassNoMandatoryExclude);
    this['_serializable_abstracttype'] = new Map().set('abstractTypeArray', 'typeDef');
    this['_serializable_complextype'] = new Map().set('complexTypeArray', TestClassNoMandatoryExclude);
    this['_serializable_array'] = ['abstractTypeArray', 'complexTypeArray', 'simpleArray'];
  }
}

class TestClassNoMandatoryNoExcludeComplex implements Serializable {
  test: string;

  complex: TestClassMandatoryExclude;

  constructor() {
    this.test = 'Test123';
    this.complex = new TestClassMandatoryExclude();
    this.complex.mandatoryProperty = 'abc';
    this['_serializable_complextype'] = new Map().set('complex', TestClassMandatoryExclude);
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

    it('should resolve with deserialized complex object - valid input data', async () => {
      const testData = {test: 'IAmATest', complex: {mandatoryProperty: 'xyz'}};

      const result = await Serializer.deserialize<TestClassNoMandatoryNoExcludeComplex>(TestClassNoMandatoryNoExcludeComplex, testData);
      expect(result).to.include({test: 'IAmATest'});
      expect(result.complex).to.include({mandatoryProperty: 'xyz', test: 'Test123'});
    });

    it('should reject with SerializedObjectIncompleteError if data of complex type is missing - invalid input data', () => {
      const testData = {test: 'IAmATest', complex: {test: 'xyz'}};

      return expect(Serializer.deserialize<TestClassNoMandatoryNoExcludeComplex>(TestClassNoMandatoryNoExcludeComplex, testData))
          .to.be.rejectedWith(SerializedObjectIncompleteError);
    });

    it('should reject with UnknownTypeDefinition if abstract type is not defined in prototype', () => {
      const testData = {test: 'IAmATest', abstractType: {typeDef: 'testTypeNotDefined', mandatoryProperty: 'IAmThere'}};

      return expect(Serializer.deserialize<TestClassAbstractTypeNoMandatoryNoExclude>(TestClassAbstractTypeNoMandatoryNoExclude, testData))
          .to.be.rejectedWith(UnknownTypeDefinitionError);
    });

    it('should reject with SerializedObjectIncompleteError if type definition property is missing in input', () => {
      const testData = {test: 'IAmATest', abstractType: {mandatoryProperty: 'IAmThere'}};

      return expect(Serializer.deserialize<TestClassAbstractTypeNoMandatoryNoExclude>(TestClassAbstractTypeNoMandatoryNoExclude, testData))
          .to.be.rejectedWith(SerializedObjectIncompleteError);
    });

    it('should reject with SerializedObjectIncompleteError if property of abstract type is missing in input data', () => {
      const testData = {test: 'IAmATest', abstractType: {typeDef: 'testType'}};

      return expect(Serializer.deserialize<TestClassAbstractTypeNoMandatoryNoExclude>(TestClassAbstractTypeNoMandatoryNoExclude, testData))
          .to.be.rejectedWith(SerializedObjectIncompleteError);
    });

    it('should resolve with deserialized abstract object - valid input data', async () => {
      const testData = {test: 'IAmATest', abstractType: {typeDef: 'testType', mandatoryProperty: 'IAmThere'}};

      const result = await Serializer.deserialize<TestClassAbstractTypeNoMandatoryNoExclude>(TestClassAbstractTypeNoMandatoryNoExclude, testData);
      expect(result.test).to.equal('IAmATest');
      expect(result.abstractType).to.be.instanceof(TestClassMandatoryNoExclude);
      expect(result.abstractType.mandatoryProperty).to.equal('IAmThere');
    });

    it('should reject with SerializedDataIsNotAnArrayError if complex array type is not an array', () => {
      const testData = {complexTypeArray: 'abc'};

      return expect(Serializer.deserialize<TestClassArrayNoMandatoryNoExclude>(TestClassArrayNoMandatoryNoExclude, testData))
          .to.be.rejectedWith(SerializedDataIsNotAnArrayError);
    });

    it('should reject with SerializedDataIsNotAnArrayError if abstract array type is not an array', () => {
      const testData = {abstractTypeArray: 'abc'};

      return expect(Serializer.deserialize<TestClassArrayNoMandatoryNoExclude>(TestClassArrayNoMandatoryNoExclude, testData))
          .to.be.rejectedWith(SerializedDataIsNotAnArrayError);
    });

    it('should reject with SerializedDataIsNotAnArrayError if simple array type is not an array', () => {
      const testData = {simpleArray: 'abc'};

      return expect(Serializer.deserialize<TestClassArrayNoMandatoryNoExclude>(TestClassArrayNoMandatoryNoExclude, testData))
          .to.be.rejectedWith(SerializedDataIsNotAnArrayError);
    });

    it('should resolve with deserialized complex array if input data is valid', async () => {
      const testData = {complexTypeArray: [{test: 'IAmATest'}, {test: 'IAmATest'}]};

      const result = await Serializer.deserialize<TestClassArrayNoMandatoryNoExclude>(TestClassArrayNoMandatoryNoExclude, testData);

      expect(result.complexTypeArray.length).to.equal(2);
      expect(result.complexTypeArray[0]).to.be.instanceof(TestClassNoMandatoryExclude);
      expect(result.complexTypeArray[0].test).to.equal('IAmATest');
    });

    it('should resolve with deserialized abstract array if input data is valid', async () => {
      const testData = {abstractTypeArray: [{test: 'IAmATest', typeDef: 'testType'}, {test: 'IAmATest', typeDef: 'testTypeB'}]};

      const result = await Serializer.deserialize<TestClassArrayNoMandatoryNoExclude>(TestClassArrayNoMandatoryNoExclude, testData);

      expect(result.abstractTypeArray.length).to.equal(2);
      expect(result.abstractTypeArray[0]).to.be.instanceof(TestClassNoMandatoryNoExclude);
      expect(result.abstractTypeArray[1]).to.be.instanceof(TestClassNoMandatoryExclude);
      expect(result.abstractTypeArray[0].test).to.equal('IAmATest');
    });

    it('should resolve with deserialized simple array if input data is valid', async () => {
      const testData = {simpleArray: ['testA', 'testB']};

      const result = await Serializer.deserialize<TestClassArrayNoMandatoryNoExclude>(TestClassArrayNoMandatoryNoExclude, testData);

      expect(result.simpleArray.length).to.equal(2);
      expect(result.simpleArray[0]).to.equal('testA');
      expect(result.simpleArray[1]).to.equal('testB');
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

    it('should resolve with valid serialized complex object - exclude', () => {
      const object = new TestClassNoMandatoryNoExcludeComplex();
      object.test = 'IAmATest';
      object.complex.excludedProperty = 'ExcludeMe';
      object.complex.test = 'IAmATestToo';
      object.complex.mandatoryProperty = 'IAmJustAnotherTest';

      return expect(Serializer.serialize<TestClassNoMandatoryNoExcludeComplex>(object))
          .to.eventually.deep.equal({test: 'IAmATest', complex: {test: 'IAmATestToo', mandatoryProperty: 'IAmJustAnotherTest'}});
    });

    it('should resolve with valid serialized abstract object - exclude', () => {
      const object = new TestClassAbstractTypeNoMandatoryNoExclude();
      object.test = 'IAmATest';
      object.abstractType = new TestClassNoMandatoryExclude();
      object.abstractType.excludedProperty = 'ExcludeMe';
      object.abstractType.test = 'IAmATestToo';
      object.abstractType.typeDef = 'IAmTheType';

      return expect(Serializer.serialize<TestClassAbstractTypeNoMandatoryNoExclude>(object))
          .to.eventually.deep.equal({test: 'IAmATest', abstractType: {test: 'IAmATestToo', typeDef: 'IAmTheType'}});
    });

    it('should resolve with valid serialized array object - exclude', () => {
      const object = new TestClassArrayNoMandatoryNoExclude();
      object.simpleArray = ['a', 'b'];

      const complex1 = new TestClassNoMandatoryExclude();
      complex1.excludedProperty = 'eA';
      complex1.test = 'A';
      const complex2 = new TestClassNoMandatoryExclude();
      complex2.excludedProperty = 'eB';
      complex2.test = 'B';
      object.complexTypeArray = [complex1, complex2];
      object.abstractTypeArray = [complex1, complex2];

      return expect(Serializer.serialize<TestClassArrayNoMandatoryNoExclude>(object))
          .to.eventually.deep.equal(
              {simpleArray: ['a', 'b'], complexTypeArray: [{test: 'A'}, {test: 'B'}], abstractTypeArray: [{test: 'A'}, {test: 'B'}]});
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
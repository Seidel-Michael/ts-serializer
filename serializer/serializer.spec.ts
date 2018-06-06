/* tslint:disable:completed-docs */

import * as chai from 'chai';
import {expect} from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as fs from 'fs-extra';
import * as mockFS from 'mock-fs';
import * as sinon from 'sinon';

import {FileNotFoundError, FileParseError, FileReadError, FileWriteError} from './errors';
import {SerializedDataIsNotAnArrayError, SerializedObjectIncompleteError, UnknownTypeDefinitionError} from './errors';
import {AbstractType, AddTypeImplementation, ArrayType, ComplexType, Mandatory, NonSerialized, Serializable} from './serializable';
import {Serializer} from './serializer';

chai.use(chaiAsPromised);

class TestClassNoMandatoryNoExclude implements Serializable {
  test: string;

  constructor() {
    this.test = 'Test123';
  }
}

class TestClassMandatoryNoExclude implements Serializable {
  @Mandatory mandatoryProperty: string;

  test: string;

  constructor() {
    this.test = 'Test123';
  }
}

class TestClassMandatoryNoExcludeBool implements Serializable {
  @Mandatory mandatoryProperty: boolean;

  test: string;

  constructor() {
    this.test = 'Test123';
  }
}

class TestClassAbstractImplementation implements Serializable {
  @Mandatory typeDef: string;

  constructor() {}
}

@AddTypeImplementation('testType', TestClassAbstractImplementation)
class TestClassInheritanceBase implements Serializable {
  @Mandatory mandatoryProperty: string;

  @NonSerialized excludedProperty: string;

  @AbstractType('typeDef')
  abstractType: any;

  @ComplexType(TestClassNoMandatoryNoExclude) @ArrayType complexTypeArray: TestClassNoMandatoryNoExclude[];

  constructor() {
    this.excludedProperty = 'excludeMe';
  }
}

@AddTypeImplementation('testTypeB', TestClassAbstractImplementation)
class TestClassInheritanceNew extends TestClassInheritanceBase implements Serializable {
  @Mandatory mandatoryPropertyNew: string;

  @NonSerialized excludedPropertyNew: string;

  @AbstractType('typeDef')
  abstractTypeNew: any;

  @ComplexType(TestClassNoMandatoryNoExclude) @ArrayType complexTypeArrayNew: TestClassNoMandatoryNoExclude[];

  constructor() {
    super();

    this.excludedProperty = 'excludeMe';
  }
}


@AddTypeImplementation('testType', TestClassAbstractImplementation) @AddTypeImplementation('testTypeB', TestClassMandatoryNoExclude)
class TestClassAbstractTypeNoMandatoryNoExclude implements Serializable {
  @AbstractType('typeDef')
  abstractType: any;

  test: string;

  constructor() {
    this.test = 'Test123';
    this.abstractType = new TestClassAbstractImplementation();
    this.abstractType.typeDef = 'abstract';
  }
}

@AddTypeImplementation('testType', TestClassAbstractImplementation) @AddTypeImplementation('testTypeB', TestClassAbstractImplementation)
class TestClassArrayNoMandatoryNoExclude implements Serializable {
  @AbstractType('typeDef') @ArrayType abstractTypeArray: any[];

  @ComplexType(TestClassNoMandatoryNoExclude) @ArrayType complexTypeArray: TestClassNoMandatoryNoExclude[];

  @ArrayType simpleArray: string[];

  constructor() {}
}

class TestClassMandatoryExclude implements Serializable {
  @Mandatory mandatoryProperty: string;

  @NonSerialized excludedProperty: string;

  test: string;

  constructor() {
    this.test = 'Test123';
  }
}

class TestClassNoMandatoryNoExcludeComplex implements Serializable {
  test: string;

  @ComplexType(TestClassMandatoryExclude)
  complex: TestClassMandatoryExclude;

  constructor() {
    this.test = 'Test123';
    this.complex = new TestClassMandatoryExclude();
    this.complex.mandatoryProperty = 'abc';
  }
}


class TestClassNoMandatoryExclude implements Serializable {
  @NonSerialized excludedProperty: string;

  test: string;

  constructor() {
    this.test = 'Test123';
  }
}

describe('Serializer', () => {
  describe('deserialize inheritance', () => {
    it('should resolve with deserialized object - TestClassInheritanceBase', async () => {
      const testData =
          {mandatoryProperty: 'BaseMandatory', abstractType: {typeDef: 'testType'}, complexTypeArray: [{test: 'BaseTest'}], excludedProperty: 'abc'};

      const test = await Serializer.deserialize<TestClassInheritanceBase>(TestClassInheritanceBase, testData);

      expect(test.mandatoryProperty).to.equal('BaseMandatory');
      expect(test.abstractType).to.be.instanceof(TestClassAbstractImplementation);
      expect(test.complexTypeArray[0]).to.be.instanceof(TestClassNoMandatoryNoExclude);
      expect(test.complexTypeArray[0].test).to.equal('BaseTest');
      expect(test.excludedProperty).to.equal('excludeMe');
    });

    it('should resolve with deserialized object - TestClassInheritanceNew', async () => {
      const testData = {
        mandatoryProperty: 'BaseMandatory',
        abstractType: {typeDef: 'testType'},
        complexTypeArray: [{test: 'BaseTest'}],
        excludedProperty: 'abc',
        mandatoryPropertyNew: 'NewMandatory',
        abstractTypeNew: {typeDef: 'testTypeB'},
        complexTypeArrayNew: [{test: 'NewTest'}],
        excludedPropertyNew: 'abc'
      };

      const test = await Serializer.deserialize<TestClassInheritanceNew>(TestClassInheritanceNew, testData);

      expect(test.mandatoryProperty).to.equal('BaseMandatory');
      expect(test.abstractType).to.be.instanceof(TestClassAbstractImplementation);
      expect(test.complexTypeArray[0]).to.be.instanceof(TestClassNoMandatoryNoExclude);
      expect(test.complexTypeArray[0].test).to.equal('BaseTest');
      expect(test.excludedProperty).to.equal('excludeMe');

      expect(test.mandatoryPropertyNew).to.equal('NewMandatory');
      expect(test.abstractTypeNew).to.be.instanceof(TestClassAbstractImplementation);
      expect(test.complexTypeArrayNew[0]).to.be.instanceof(TestClassNoMandatoryNoExclude);
      expect(test.complexTypeArrayNew[0].test).to.equal('NewTest');
      expect(test.excludedProperty).to.equal('excludeMe');
    });

    it('should reject with SerializedObjectIncompleteError if mandatory data of base class is missing - TestClassInheritanceNew', async () => {
      const testData = {
        abstractType: {typeDef: 'testType'},
        complexTypeArray: [{test: 'BaseTest'}],
        excludedProperty: 'abc',
        mandatoryPropertyNew: 'NewMandatory',
        abstractTypeNew: {typeDef: 'testTypeB'},
        complexTypeArrayNew: [{test: 'NewTest'}],
        excludedPropertyNew: 'abc'
      };

      return expect(Serializer.deserialize<TestClassInheritanceNew>(TestClassInheritanceNew, testData))
          .to.be.rejectedWith(SerializedObjectIncompleteError);
    });
  });

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

    it('should resolve with deserialized object - valid input data, mandatory, no exclude - boolean mandatory false', () => {
      const testData = {mandatoryProperty: false};

      return expect(Serializer.deserialize<TestClassMandatoryNoExcludeBool>(TestClassMandatoryNoExcludeBool, testData))
          .to.eventually.include({test: 'Test123', mandatoryProperty: false});
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

    it('should reject with SerializedObjectIncompleteError if mandatory data is undefined', () => {
      const testData = {test: 'IAmATest', mandatoryProperty: undefined};

      return expect(Serializer.deserialize<TestClassMandatoryNoExclude>(TestClassMandatoryNoExclude, testData))
          .to.be.rejectedWith(SerializedObjectIncompleteError);
    });

    it('should resolve with deserialized complex object - valid input data', async () => {
      const testData = {test: 'IAmATest', complex: {mandatoryProperty: 'xyz'}};

      const result = await Serializer.deserialize<TestClassNoMandatoryNoExcludeComplex>(TestClassNoMandatoryNoExcludeComplex, testData);
      expect(result).to.include({test: 'IAmATest'});
      expect(result.complex).to.include({mandatoryProperty: 'xyz', test: 'Test123'});
    });

    it('should resolve with deserialized complex object - undefined', async () => {
      const testData = {test: 'IAmATest', complex: undefined};

      const result = await Serializer.deserialize<TestClassNoMandatoryNoExcludeComplex>(TestClassNoMandatoryNoExcludeComplex, testData);
      expect(result).to.include({test: 'IAmATest'});
      expect(result.complex).to.equal(undefined);
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
      const testData = {test: 'IAmATest', abstractType: {typeDef: 'testTypeB'}};

      return expect(Serializer.deserialize<TestClassAbstractTypeNoMandatoryNoExclude>(TestClassAbstractTypeNoMandatoryNoExclude, testData))
          .to.be.rejectedWith(SerializedObjectIncompleteError);
    });

    it('should resolve with deserialized abstract object - valid input data', async () => {
      const testData = {test: 'IAmATest', abstractType: {typeDef: 'testType', mandatoryProperty: 'IAmThere'}};

      const result = await Serializer.deserialize<TestClassAbstractTypeNoMandatoryNoExclude>(TestClassAbstractTypeNoMandatoryNoExclude, testData);
      expect(result.test).to.equal('IAmATest');
      expect(result.abstractType).to.be.instanceof(TestClassAbstractImplementation);
      expect(result.abstractType.mandatoryProperty).to.equal('IAmThere');
    });

    it('should resolve with deserialized abstract object - undefined', async () => {
      const testData = {test: 'IAmATest', abstractType: undefined};

      const result = await Serializer.deserialize<TestClassAbstractTypeNoMandatoryNoExclude>(TestClassAbstractTypeNoMandatoryNoExclude, testData);
      expect(result.test).to.equal('IAmATest');
      expect(result.abstractType).to.equal(undefined);
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
      expect(result.complexTypeArray[0]).to.be.instanceof(TestClassNoMandatoryNoExclude);
      expect(result.complexTypeArray[0].test).to.equal('IAmATest');
    });

    it('should resolve with deserialized complex array if input data is undefined', async () => {
      const testData = {complexTypeArray: undefined};

      const result = await Serializer.deserialize<TestClassArrayNoMandatoryNoExclude>(TestClassArrayNoMandatoryNoExclude, testData);

      expect(result.complexTypeArray).to.equal(undefined);
    });

    it('should resolve with deserialized abstract array if input data is valid', async () => {
      const testData = {abstractTypeArray: [{test: 'IAmATest', typeDef: 'testType'}, {test: 'IAmATest', typeDef: 'testTypeB'}]};

      const result = await Serializer.deserialize<TestClassArrayNoMandatoryNoExclude>(TestClassArrayNoMandatoryNoExclude, testData);

      expect(result.abstractTypeArray.length).to.equal(2);
      expect(result.abstractTypeArray[0]).to.be.instanceof(TestClassAbstractImplementation);
      expect(result.abstractTypeArray[1]).to.be.instanceof(TestClassAbstractImplementation);
      expect(result.abstractTypeArray[0].test).to.equal('IAmATest');
    });

    it('should resolve with deserialized abstract array if input data is undefined', async () => {
      const testData = {abstractTypeArray: undefined};

      const result = await Serializer.deserialize<TestClassArrayNoMandatoryNoExclude>(TestClassArrayNoMandatoryNoExclude, testData);

      expect(result.abstractTypeArray).to.equal(undefined);
    });

    it('should resolve with deserialized simple array if input data is valid', async () => {
      const testData = {simpleArray: ['testA', 'testB']};

      const result = await Serializer.deserialize<TestClassArrayNoMandatoryNoExclude>(TestClassArrayNoMandatoryNoExclude, testData);

      expect(result.simpleArray.length).to.equal(2);
      expect(result.simpleArray[0]).to.equal('testA');
      expect(result.simpleArray[1]).to.equal('testB');
    });

    it('should resolve with deserialized simple array if input data is undefined', async () => {
      const testData = {simpleArray: undefined};

      const result = await Serializer.deserialize<TestClassArrayNoMandatoryNoExclude>(TestClassArrayNoMandatoryNoExclude, testData);

      expect(result.simpleArray).to.equal(undefined);
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

  describe('serialize inheritance', () => {
    it('should resolve with valid serialized object', () => {
      const object = new TestClassInheritanceNew();
      object.mandatoryProperty = 'BaseMandatory';
      object.abstractType = new TestClassAbstractImplementation();
      object.abstractType.typeDef = 'testType';
      const objBase = new TestClassNoMandatoryNoExclude();
      objBase.test = 'BaseTest';
      object.complexTypeArray = [objBase];

      object.mandatoryPropertyNew = 'NewMandatory';
      object.abstractTypeNew = new TestClassAbstractImplementation();
      object.abstractTypeNew.typeDef = 'testTypeB';
      const objNew = new TestClassNoMandatoryNoExclude();
      objNew.test = 'NewTest';
      object.complexTypeArrayNew = [objNew];

      return expect(Serializer.serialize<TestClassInheritanceNew>(object)).to.eventually.deep.equal({
        mandatoryProperty: 'BaseMandatory',
        abstractType: {typeDef: 'testType'},
        complexTypeArray: [{test: 'BaseTest'}],
        mandatoryPropertyNew: 'NewMandatory',
        abstractTypeNew: {typeDef: 'testTypeB'},
        complexTypeArrayNew: [{test: 'NewTest'}],
      });
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

    it('should resolve with valid serialized complex object - undefined', () => {
      const object = new TestClassNoMandatoryNoExcludeComplex();
      object.test = 'IAmATest';
      object.complex = undefined;

      return expect(Serializer.serialize<TestClassNoMandatoryNoExcludeComplex>(object))
          .to.eventually.deep.equal({test: 'IAmATest', complex: undefined});
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

    it('should resolve with valid serialized abstract object - undefined', () => {
      const object = new TestClassAbstractTypeNoMandatoryNoExclude();
      object.test = 'IAmATest';
      object.abstractType = undefined;

      return expect(Serializer.serialize<TestClassAbstractTypeNoMandatoryNoExclude>(object))
          .to.eventually.deep.equal({test: 'IAmATest', abstractType: undefined});
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
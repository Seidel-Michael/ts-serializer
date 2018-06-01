import {expect} from 'chai';

import {AbstractType, AddTypeImplementation, ArrayType, ComplexType, Mandatory, NonSerialized} from './serializable';

describe('Serializable decorators', () => {
  describe('Mandatory', () => {
    it('should create _serializable_mandatory create on target object with key as first item on first call.', () => {
      const target = {};

      Mandatory(target, 'abc');

      expect(target[target.constructor.name]['_serializable_mandatory']).to.contain('abc');
    });

    it('should add key to _serializable_mandatory array on target object on second call.', () => {
      const target = {};

      Mandatory(target, 'abc');
      Mandatory(target, 'cde');

      expect(target[target.constructor.name]['_serializable_mandatory']).to.contain('abc');
      expect(target[target.constructor.name]['_serializable_mandatory']).to.contain('cde');
    });

    it('should not add duplicated keys to _serializable_mandatory array on target object.', () => {
      const target = {};

      Mandatory(target, 'abc');
      Mandatory(target, 'cde');
      Mandatory(target, 'abc');

      expect(target[target.constructor.name]['_serializable_mandatory'].length).to.equal(2);
    });
  });

  describe('ArrayType', () => {
    it('should create _serializable_array create on target object with key as first item on first call.', () => {
      const target = {};

      ArrayType(target, 'abc');

      expect(target[target.constructor.name]['_serializable_array']).to.contain('abc');
    });

    it('should add key to _serializable_array array on target object on second call.', () => {
      const target = {};

      ArrayType(target, 'abc');
      ArrayType(target, 'cde');

      expect(target[target.constructor.name]['_serializable_array']).to.contain('abc');
      expect(target[target.constructor.name]['_serializable_array']).to.contain('cde');
    });

    it('should not add duplicated keys to _serializable_array array on target object.', () => {
      const target = {};

      ArrayType(target, 'abc');
      ArrayType(target, 'cde');
      ArrayType(target, 'abc');

      expect(target[target.constructor.name]['_serializable_array'].length).to.equal(2);
    });
  });

  describe('ComplexType', () => {
    it('should create _serializable_complextype on target object with key and parameter type as first item on first call.', () => {
      const target = {};

      ComplexType(String)(target, 'abc');

      expect(target[target.constructor.name]['_serializable_complextype'].get('abc')).to.equal(String);
    });

    it('should add key to _serializable_complextype on target object on second call.', () => {
      const target = {};

      ComplexType(String)(target, 'abc');
      ComplexType(Number)(target, 'cde');

      expect(target[target.constructor.name]['_serializable_complextype'].get('abc')).to.equal(String);
      expect(target[target.constructor.name]['_serializable_complextype'].get('cde')).to.equal(Number);
    });

    it('should not add duplicated keys to _serializable_complextype array on target object.', () => {
      const target = {};

      ComplexType(String)(target, 'abc');
      ComplexType(Number)(target, 'cde');
      ComplexType(String)(target, 'abc');

      expect(target[target.constructor.name]['_serializable_complextype'].size).to.equal(2);
    });
  });

  describe('NonSerialized', () => {
    it('should create _serializable_nonserialized on target object with key as first item on first call.', () => {
      const target = {};

      NonSerialized(target, 'abc');

      expect(target[target.constructor.name]['_serializable_nonserialized']).to.contain('abc');
    });

    it('should add key to _serializable_nonserialized array on target object on second call.', () => {
      const target = {};

      NonSerialized(target, 'abc');
      NonSerialized(target, 'cde');

      expect(target[target.constructor.name]['_serializable_nonserialized']).to.contain('abc');
      expect(target[target.constructor.name]['_serializable_nonserialized']).to.contain('cde');
    });

    it('should not add duplicated keys to _serializable_nonserialized array on target object.', () => {
      const target = {};

      NonSerialized(target, 'abc');
      NonSerialized(target, 'cde');
      NonSerialized(target, 'abc');

      expect(target[target.constructor.name]['_serializable_nonserialized'].length).to.equal(2);
    });
  });

  describe('AddTypeImplementation', () => {
    it('should create _serializable_typeimplementation to prototype with implementation as first item on first call.', () => {
      AddTypeImplementation('abc', String)(Number);

      expect(Number.prototype[Number.name]['_serializable_typeimplementation'].get('abc')).to.equal(String);
    });

    it('should add implementation to _serializable_typeimplementation of prototype on second call.', () => {
      AddTypeImplementation('abc', String)(Number);
      AddTypeImplementation('cde', Array)(Number);

      expect(Number.prototype[Number.name]['_serializable_typeimplementation'].get('cde')).to.equal(Array);
    });

    it('should not add duplicated keys to _serializable_typeimplementation array on prototype.', () => {
      AddTypeImplementation('abc', String)(Number);
      AddTypeImplementation('cde', Array)(Number);
      AddTypeImplementation('abc', String)(Number);

      expect(Number.prototype[Number.name]['_serializable_typeimplementation'].size).to.equal(2);
    });
  });

  describe('AbstractType', () => {
    it('should create _serializable_abstracttype on target object with typename as first item on first call.', () => {
      const target = {};

      AbstractType('abc')(target, 'testA');

      expect(target[target.constructor.name]['_serializable_abstracttype'].get('testA')).to.equal('abc');
    });

    it('should add typename to _serializable_abstracttype of target object on second call.', () => {
      const target = {};

      AbstractType('abc')(target, 'testA');
      AbstractType('cde')(target, 'testB');

      expect(target[target.constructor.name]['_serializable_abstracttype'].get('testA')).to.equal('abc');
      expect(target[target.constructor.name]['_serializable_abstracttype'].get('testB')).to.equal('cde');
    });

    it('should not add duplicated keys to _serializable_abstracttype array on target object.', () => {
      const target = {};

      AbstractType('abc')(target, 'testA');
      AbstractType('cde')(target, 'testB');
      AbstractType('abc')(target, 'testA');

      expect(target[target.constructor.name]['_serializable_abstracttype'].size).to.equal(2);
    });
  });
});
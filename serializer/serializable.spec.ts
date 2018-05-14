import {expect} from 'chai';

import {Mandatory, NonSerialized} from './serializable';

describe('Serializable decorators', () => {
  describe('Mandatory', () => {
    it('should create _serializable_mandatory create on target object with key as first item on first call.', () => {
      const target = {};

      Mandatory(target, 'abc');

      expect(target['_serializable_mandatory']).to.contain('abc');
    });

    it('should add key to _serializable_mandatory array on target object on second call.', () => {
      const target = {};

      Mandatory(target, 'abc');
      Mandatory(target, 'cde');

      expect(target['_serializable_mandatory']).to.contain('abc');
      expect(target['_serializable_mandatory']).to.contain('cde');
    });
  });

  describe('NonSerialized', () => {
    it('should create _serializable_nonserialized create on target object with key as first item on first call.', () => {
      const target = {};

      NonSerialized(target, 'abc');

      expect(target['_serializable_nonserialized']).to.contain('abc');
    });

    it('should add key to _serializable_nonserialized array on target object on second call.', () => {
      const target = {};

      NonSerialized(target, 'abc');
      NonSerialized(target, 'cde');

      expect(target['_serializable_nonserialized']).to.contain('abc');
      expect(target['_serializable_nonserialized']).to.contain('cde');
    });
  });
});
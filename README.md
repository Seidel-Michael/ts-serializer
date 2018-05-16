# About
The ts-serializer package is a simple promise based serialization helper library for nodejs typescript.
It is able to serialize and deserialize objects to and from json files or memory if you know the expected type.

## Limitations
The library only works with simple types like number and string. 

# Usage

## Enable experimental Decorators
You have to enable experimental Decorators in your `tsconfig.json` file.

```ts
"experimentalDecorators": true
```

## The Serializable interface
To enable serialization for a type it has to implement the Serializable interface.

### Example
```ts
import {Serializable} from './serializable';

class TestClass implements Serializable {
  testString: string;

  testNumber: number;

  testArray: [];

  constructor() {
    this.testString = 'Test123';
    this.testNumber = 42;
    this.testArray = ['Abc', 'Cde'];
  }
}
```

## Decorators

### The Mandatory decorator
You can mark a property as mandatory. If marked it has to be in the serialized data while deserialization.
Otherwise you'll receive a SerializedObjectIncompleteError.

### The NonSerialized decorator
You can exclude a property from serialization and deserialization. If marked it will be ignored by the serializer.

### The ComplexType decorator
You can mark a property as complex for serialization and deserialization. If marked the property will be serialized itself.
The given type hast to be serializable itself.

### Example
```ts
import {Serializable, Mandatory, NonSerialized} from './serializable';

class TestClass implements Serializable {
  @Mandatory
  testString: string;

  @NonSerialized
  testNumber: number;

  @Mandatory
  @ComplexType(MyComplexObject)
  testComplex: MyComplexObject

  testArray: [];

  constructor() {
    this.testString = 'Test123';
    this.testNumber = 42;
    this.testArray = ['Abc', 'Cde'];
    this.testComplex = new MyComplexType;
  }
}
```

## The Serializer

### deserialize
```ts
/**
   * Deserializes an object from serialized data.
   *
   * @static
   * @template T The expected returning type for compile time type definition.
   * @param {*} type The expected returning type for runtime usage by the serializer.
   * @param {*} serializedData The serialized data to deserialize.
   * @returns {Promise<T>} Returns a promise resolving with the deserialize object
   * or rejecting with a SerializedObjectIncompleteError if a mandatory property is missing in the serialized data.
   * @memberof Serializer
   */
  static deserialize<T extends Serializable>(type: any, serializedData: any): Promise<T> 
```

#### Example
```ts
import {Serializer} from './serializer';
import {Serializable, Mandatory, NonSerialized} from './serializable';

class TestClass implements Serializable {
  @Mandatory
  testString: string;

  @NonSerialized
  testNumber: number;

  testArray: [];

  constructor() {
    this.testString = 'Test123';
    this.testNumber = 42;
    this.testArray = ['Abc', 'Cde'];
  }
}

const input {testString: 'I am a test!'};

Serializer.deserialize<TestClass>(TestClass, input).then((obj) => { JSON.stringify(obj); });
```

### deserializeFile
```ts
/**
   * Deserializes a file from serialized data.
   *
   * @static
   * @template T The expected returning type for compile time type definition.
   * @param {*} type The expected returning type for runtime usage by the serializer.
   * @param {*} file The path to the file to deserialize.
   * @returns {Promise<T>} Returns a promise resolving with the deserialize object
   * or rejecting with a SerializedObjectIncompleteError if a mandatory property is missing in the serialized data.
   * It also rejects with FileNotFoundError if the file could not be found; FileReadError if any error ocurred during read;
   * FileParseError if the file content is not valid json.
   * @memberof Serializer
   */
  static deserializeFile<T extends Serializable>(type: any, file: any): Promise<T>
```

#### Example
```ts
import {Serializer} from './serializer';
import {Serializable, Mandatory, NonSerialized} from './serializable';

class TestClass implements Serializable {
  @Mandatory
  testString: string;

  @NonSerialized
  testNumber: number;

  testArray: [];

  constructor() {
    this.testString = 'Test123';
    this.testNumber = 42;
    this.testArray = ['Abc', 'Cde'];
  }
}

// test.json: { "testString": "I am a test!" }

Serializer.deserializeFile<TestClass>(TestClass, 'test.json').then((obj) => { JSON.stringify(obj); });
```

### serialize
```ts
/**
   * Serializes the object to serialized data.
   *
   * @static
   * @template T The expected returning type for compile time type definition.
   * @param {T} object The object to serialize.
   * @returns {Promise<any>} Returns a promise resolving with the serialized data.
   * @memberof Serializer
   */
  static serialize<T extends Serializable>(object: T): Promise<any>
```

#### Example
```ts
import {Serializer} from './serializer';
import {Serializable, Mandatory, NonSerialized} from './serializable';

class TestClass implements Serializable {
  @Mandatory
  testString: string;

  @NonSerialized
  testNumber: number;

  testArray: [];

  constructor() {
    this.testString = 'Test123';
    this.testNumber = 42;
    this.testArray = ['Abc', 'Cde'];
  }
}

const test = new TestClass();

Serializer.serialize<TestClass>(test).then((serializedObj) => { JSON.stringify(serializedObj); });
```

### serialize
```ts
/**
   * Serialized the object to a file.
   *
   * @static
   * @template T The expected returning type for compile time type definition.
   * @param {T} object The object to serialize.
   * @param {*} file The path to the file to serialize to. Not existing files and folders will be created.
   * @returns {Promise<void>} Returns a promise resolving if the file was written successfully.
   * The promise will be rejected with a FileWriteError if anything went wrong during writing or creating the folders and file.
   * @memberof Serializer
   */
  static serializeFile<T extends Serializable>(object: T, file: any): Promise<void>
```

#### Example
```ts
import {Serializer} from './serializer';
import {Serializable, Mandatory, NonSerialized} from './serializable';

class TestClass implements Serializable {
  @Mandatory
  testString: string;

  @NonSerialized
  testNumber: number;

  testArray: [];

  constructor() {
    this.testString = 'Test123';
    this.testNumber = 42;
    this.testArray = ['Abc', 'Cde'];
  }
}

const test = new TestClass();

Serializer.serializeFile<TestClass>(test, 'test.json').then(() => { console.log('Saved!'); });
```

# Open Issues to consider sometime
- It is possible to provide different types as T and type in the deserialize methods.
- It is possible to deserialize a string to a number type.
- It is possible to provide a different object as T in the serialize method.
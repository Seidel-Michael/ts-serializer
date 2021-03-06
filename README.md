# About
The ts-serializer package is a simple promise based serialization helper library for nodejs typescript.
It is able to serialize and deserialize objects to and from json files or memory if you know the expected type.

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
import {Serializable} from 'ts-serializer';

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

### The AddTypeImplementation decorator
You can add implementations of an abstract type to the class metadata. This has to be done to be able to use the AbstractType decorator. 
The given type hast to be serializable itself.

### The AbstractType decorator
You can mark a property as an abstract type for serialization and deserialization. If marked the serializer will look up the given type property amd
tries to find the implementation information of the AddTypeImplementation decorator.

### The ArrayType decorator
You can mark a property as an array type for serialization and deserialization. If marked the serializer will serialze and deserialize ComplexType and AbstractType arrays if combined with the AbstractType or ComplexType decorator.
You don't have to st the ArrayType decorator for simple type arrays.

### Example
```ts
import {Serializable, Mandatory, NonSerialized} from 'ts-serializer';

@AddTypeImplementation('testTypeA', MyTypeA)
@AddTypeImplementation('testTypeB', MyTypeB)
class TestClass implements Serializable {
  @Mandatory
  testString: string;

  @NonSerialized
  testNumber: number;

  @Mandatory
  @ComplexType(MyComplexObject)
  testComplex: MyComplexObject

  @ArrayType
  @ComplexType(MyComplexObject)
  testComplex: [MyComplexObject]

  @AbstractType('type')
  testAbstract: IMyType

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
   * If the property is marked as abstract the promise is rejected with UnknownTypeDefinitionError if the defined type could not be found.
   * @memberof Serializer
   */
  static deserialize<T extends Serializable>(type: any, serializedData: any): Promise<T> 
```

#### Example
```ts
import {Serializer} from 'ts-serializer';
import {Serializable, Mandatory, NonSerialized} from 'ts-serializer';

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
To be able to use the deserializeFile method you have to import the serializer-file.
```ts
import {Serializer} from 'ts-serializer/serializer-file';
```

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
   * If the property is marked as abstract the promise is rejected with UnknownTypeDefinitionError if the defined type could not be found.
   * @memberof Serializer
   */
  static deserializeFile<T extends Serializable>(type: any, file: any): Promise<T>
```

#### Example
```ts
import {Serializer} from 'ts-serializer/serializer-file';
import {Serializable, Mandatory, NonSerialized} from 'ts-serializer';

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

### deserializeProperty
```ts
/**
   * Deserializes one property of an object.
   *
   * @static
   * @template T The type of the property.
   * @param {*} type The type of the container object.
   * @param {*} serializedData The serialized data.
   * @param {string} propertyName The name of the property to deserialize.
   * @returns {Promise<T>} Returns a promise resolving with the deserialize object
   * or rejecting with a SerializedObjectIncompleteError if a mandatory property is missing in the serialized data.
   * If the property is marked as abstract the promise is rejected with UnknownTypeDefinitionError if the defined type could not be found.
   * @memberof Serializer
   */
  static deserializeProperty<T extends Serializable>(type: any, serializedData: any, propertyName: string): Promise<T>
```

#### Example
```ts
import {Serializer} from 'ts-serializer';
import {Serializable, Mandatory, NonSerialized} from 'ts-serializer';

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

Serializer.deserializeProperty<string>(TestClass, input, 'testString').then((obj) => { console.log(obj); });
```

### deserializeArrayItem
```ts
/**
   * Deserializes an item based on an array definition.
   *
   * @static
   * @template T The deserialized type.
   * @param {*} type The container type.
   * @param {*} serializedData The serialized data.
   * @param {string} propertyName The name of the array property used as the definition.
   * @returns {Promise<T>} Returns a promise resolving with the deserialize object
   * or rejecting with a SerializedObjectIncompleteError if a mandatory property is missing in the serialized data.
   * If the property is marked as abstract the promise is rejected with UnknownTypeDefinitionError if the defined type could not be found.
   * @memberof Serializer
   */
  static deserializeArrayItem<T extends Serializable>(type: any, serializedData: any, propertyName: string): Promise<T>
```

#### Example
```ts
import {Serializer} from 'ts-serializer';
import {Serializable, Mandatory, NonSerialized} from 'ts-serializer';

class TestClass implements Serializable {
  @Mandatory
  testString: string;

  @NonSerialized
  testNumber: number;

  testArray: ComplexType[];

  constructor() {
    this.testString = 'Test123';
    this.testNumber = 42;
    this.testArray = [{test: 'Abc'}, {test: 'Cde'}];
  }
}

const input {test: 'I am a test!'};

Serializer.deserializeArrayItem<ComplexType>(TestClass, input, 'testArray').then((obj) => { console.log(obj); });
```

### deserializeAbstract
```ts
 /**
   * Deserializes an abstract object from the serialized data.
   *
   * @static
   * @template T The abstract type.
   * @param {*} containerType An container type with the TypeImplementation info.
   * @param {*} serializedData The serialized data.
   * @param {string} typeProperty The name of the property that specifies the type.
   * @returns {Promise<T>} Returns a promise resolving with the deserialize object
   * or rejecting with a SerializedObjectIncompleteError if a mandatory property is missing in the serialized data or
   * is rejected with UnknownTypeDefinitionError if the defined type could not be found.
   * @memberof Serializer
   */
  static deserializeAbstract<T extends Serializable>(containerType: any, serializedData: any, typeProperty: string): Promise<T>
```

#### Example
```ts
import {Serializer} from 'ts-serializer';
import {Serializable, Mandatory, NonSerialized} from 'ts-serializer';

@AddTypeImplementation('testTypeA', MyTypeA)
@AddTypeImplementation('testTypeB', MyTypeB)
class TestClass implements Serializable {
  
  @AbstractType('type')
  abstract: MyAbstractType;
}

const input {type: 'testTypeB'};

Serializer.deserializeAbstract<MyAbstractType>(TestClass, input, 'type').then((obj) => { JSON.stringify(obj); });
```

### serialize
To be able to use the deserializeFile method you have to import the serializer-file.
```ts
import {Serializer} from 'ts-serializer/serializer-file';
```

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
import {Serializer} from 'ts-serializer/serializer-file';
import {Serializable, Mandatory, NonSerialized} from 'ts-serializer';

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
import {Serializer} from 'ts-serializer';
import {Serializable, Mandatory, NonSerialized} from 'ts-serializer';

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

# New Feature Ideas
- Implement a custom serialize order for more readable output.

# Open Issues to consider sometime
- It is possible to provide different types as T and type in the deserialize methods.
- It is possible to deserialize a string to a number type.
- It is possible to provide a different object as T in the serialize method.
- It is possible to serialize an abstract type without the type information.
- It is possible to serialize a property marked as an array that isn't one.
- Inheritance of multiple generations will duplicate keys in internal arrays.
- Inheritance of multiple classes could fail.
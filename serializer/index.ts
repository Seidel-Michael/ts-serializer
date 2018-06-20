// Angular compatibility
if(!(Error as any).captureStackTrace)
{
    (Error as any).captureStackTrace = () => {};
}

export {FileNotFoundError, FileParseError, FileReadError, FileWriteError} from './errors';
export {SerializedObjectIncompleteError, UnknownTypeDefinitionError, SerializedDataIsNotAnArrayError} from './errors';
export {AbstractType, AddTypeImplementation, ComplexType, Mandatory, NonSerialized, Serializable, ArrayType} from './serializable';
export {Serializer} from './serializer';
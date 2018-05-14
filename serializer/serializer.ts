export class Serializer
{
    deserialize<T>(type: any, object: any) : Promise<T>
    {
        throw new Error();
    }

    deserializeFile<T>(type: any, file: any) : Promise<T>
    {
        throw new Error();
    }
}
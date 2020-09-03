export class Json {
  public static Deserialize<T>(json: string): T {
    let jsonObj: { [id: string]: any } = JSON.parse(json);
    let obj: T = <T>jsonObj;
    return obj;
  }

  public static Serialize(object: any): string {
    return JSON.stringify(object);
  }
}

export default Json;
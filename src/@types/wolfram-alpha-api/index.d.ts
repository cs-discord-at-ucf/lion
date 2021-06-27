declare module 'wolfram-alpha-api' {
  type DataURI = `data:image/gif:base64,${string}`;
  type Input = string | Object;

  export namespace Types {
    export class WolframAlphaAPI {

      constructor(appid: string);
  
      getSimple(input: Input): Promise<DataURI>;
      
      getShort(input: Input): Promise<string>;
  
      getSpoken(input: Input): Promise<string>;
  
      getFull(input: Input): Promise<(Object | string)>;
  
    }
  }

  export default function initializeClass(appid: string): Types.WolframAlphaAPI;
}

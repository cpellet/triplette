declare module "@rmlio/yarrrml-parser" {
  export default class yarrrml {
    constructor(options?: any);
    convert(yarrrml: string): any[];
    getPrefixes(): Record<string, string>;
    getBaseIRI(): string;
  }
}

declare module "rocketrml" {
  export function parseFileLive(
    mapFile: string,
    inputFiles: Record<string, string>,
    options?: any,
  ): Promise<any>;
}

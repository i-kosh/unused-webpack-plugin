import type { Compiler } from 'webpack';
interface ConstructorParams {
    exclude?: string[];
    outputFile?: string;
}
export declare class UnusedPlugin {
    private pluginName;
    private usedFilesList;
    private filesList;
    private excludeGlobs;
    private outputFile?;
    private defaultFileName;
    constructor(params?: ConstructorParams);
    private parseDirectory;
    private collectFilesPaths;
    private emitToFile;
    apply(compiler: Compiler): void;
}
export {};

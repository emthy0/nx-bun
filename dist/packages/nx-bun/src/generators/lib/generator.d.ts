import { Tree, GeneratorCallback } from '@nx/devkit';
import { type ProjectNameAndRootOptions } from '@nx/devkit/src/generators/project-name-and-root-utils';
import { LibGeneratorSchema, LibUnderhood } from './schema';
export interface NormalizedSchema extends LibUnderhood {
    name: string;
    projectNames: ProjectNameAndRootOptions['names'];
    fileName: string;
    projectRoot: ProjectNameAndRootOptions['projectRoot'];
    projectName: ProjectNameAndRootOptions['projectName'];
    parsedTags: string[];
    importPath?: ProjectNameAndRootOptions['importPath'];
    propertyName: string;
}
export declare function libGenerator(tree: Tree, options: LibGeneratorSchema): Promise<GeneratorCallback>;
export default libGenerator;

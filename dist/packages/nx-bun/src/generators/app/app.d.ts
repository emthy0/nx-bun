import { Tree } from '@nx/devkit';
import { type ProjectNameAndRootOptions } from '@nx/devkit/src/generators/project-name-and-root-utils';
import { AppGeneratorSchema } from './schema';
export interface NormalizedSchema extends AppGeneratorSchema {
    name: string;
    projectNames: ProjectNameAndRootOptions['names'];
    fileName: string;
    projectRoot: ProjectNameAndRootOptions['projectRoot'];
    projectName: ProjectNameAndRootOptions['projectName'];
    parsedTags: string[];
    importPath?: ProjectNameAndRootOptions['importPath'];
    propertyName: string;
}
export declare function appGenerator(tree: Tree, options: AppGeneratorSchema): Promise<void>;
export default appGenerator;

import { GeneratorCallback } from '@nx/devkit';
import { FsTree } from 'nx/src/generators/tree';
import { CreateGeneratorSchema } from './schema';
export declare function createGenerator(tree: FsTree, options: CreateGeneratorSchema): Promise<GeneratorCallback>;
export default createGenerator;

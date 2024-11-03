import { Tree, GeneratorCallback } from '@nx/devkit';
import { InitGeneratorSchema } from './schema';
export declare function initGenerator(tree: Tree, options: InitGeneratorSchema): Promise<GeneratorCallback>;
export default initGenerator;

import { TestExecutorSchema } from './schema';
import { ExecutorContext } from '@nx/devkit';
export default function runExecutor(options: TestExecutorSchema, context: ExecutorContext): AsyncGenerator<unknown, void, undefined>;

import { ExecutorContext } from '@nx/devkit';
import { RunExecutorSchema } from './schema';
export default function bunRunExecutor(options: RunExecutorSchema, context: ExecutorContext): AsyncGenerator<unknown, void, undefined>;

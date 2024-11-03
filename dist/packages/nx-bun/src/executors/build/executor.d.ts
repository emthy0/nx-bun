import { ExecutorContext } from '@nx/devkit';
import { BundleExecutorSchema } from './schema';
export default function bundleExecutor(options: BundleExecutorSchema, context: ExecutorContext): AsyncGenerator<unknown, {
    success: boolean;
}, undefined>;

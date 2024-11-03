import { UnifiedChildProcess } from './bun-cli';
export type Signal = 'SIGTERM' | 'SIGINT' | 'SIGHUP' | 'SIGKILL';
export declare function killCurrentProcess(childProcess: UnifiedChildProcess, signal: Signal): Promise<void>;

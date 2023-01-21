import { Worker } from 'worker_threads';

const registeredFunctions: { [key: string]: string } = {};

function createWorkerFunction(fn: (..._: any) => any): string {
  if(typeof fn !== 'function') {
    throw Error('fn is not a function');
  }
  let callerFn = "fn";
  if(fn.name === "fn") {
    callerFn = "_fn";
  }
  const fnData = fn.toString();
  return `
  const { parentPort } = require('worker_threads');
  const ${callerFn} = ${fnData};
  parentPort.on('message', (message) => {
    const result = ${callerFn}(...message);
    parentPort.postMessage(result);
  });
  `;
}

export function register(name: string, fn: (..._: any) => any): void {
  if(typeof name !== 'string' || !name) {
    throw Error('Invalid function name');
  }
  if(typeof fn !== 'function') {
    throw Error('Invalid function');
  }
  registeredFunctions[name] = createWorkerFunction(fn);
}

export function unregister(name: string): void {
  if(typeof name !== 'string' || !name) {
    throw Error('Invalid function name');
  }
  if(!registeredFunctions[name]) {
    // throw Error('Function is not registered');
    return;
  }
  delete registeredFunctions[name];
}

async function go(fn: string | ((..._: any) => any), ...args: any) {
  let workerFunc: string | undefined;
  if(typeof fn === 'string') {
    if(!registeredFunctions[fn]) {
      throw Error('Function is not registered');
    }
    // workerFileName = registeredFunctions[fn];
    workerFunc = registeredFunctions[fn];
  } else {
    if(typeof fn !== 'function') {
      throw Error('fn is not a function');
    }
  }
  if (typeof fn === 'function') {
    workerFunc = createWorkerFunction(fn);
  }
  return new Promise((resolve, reject) => {
    const worker = new Worker(workerFunc as string, { eval: true });
    worker.on('message', (result) => {
      resolve(result);
      worker.terminate();
    });
    worker.on('error', (err) => {
      reject(err);
      worker.terminate();
    });
    worker.on('exit', (code) => {
      if(code !== 0) {
        reject(new Error('Worker stopped with exit code ' + code));
      }
    });
    worker.postMessage(args);
  });
}

export default go;
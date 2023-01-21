import * as fs from 'fs';
import path from 'path';
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
  const workerFileName = `worker-${new Date().valueOf()}-${Math.round(Math.random() * Number.MAX_SAFE_INTEGER)}.js`;
  const workerFilePath = path.resolve(__dirname, workerFileName);
  fs.writeFileSync(workerFilePath, createWorkerFunction(fn));
  registeredFunctions[name] = workerFileName;
}

export function unregister(name: string): void {
  if(typeof name !== 'string' || !name) {
    throw Error('Invalid function name');
  }
  if(!registeredFunctions[name]) {
    // throw Error('Function is not registered');
    return;
  }
  fs.existsSync(path.resolve(__dirname, registeredFunctions[name]!)) &&
  fs.unlinkSync(path.resolve(__dirname, registeredFunctions[name]!));
  delete registeredFunctions[name];
}

process.on('exit', () => {
  for(const key in registeredFunctions) {
    fs.existsSync(path.resolve(__dirname, registeredFunctions[key]!)) &&
    fs.unlinkSync(path.resolve(__dirname, registeredFunctions[key]!));
  }
})

async function go(fn: string | ((..._: any) => any), ...args: any) {
  let registered = false;
  let workerFileName: string | undefined;
  if(typeof fn === 'string') {
    if(!registeredFunctions[fn]) {
      throw Error('Function is not registered');
    }
    workerFileName = registeredFunctions[fn];
    registered = true;
  } else {
    if(typeof fn !== 'function') {
      throw Error('fn is not a function');
    }
  }
  workerFileName ??= `worker-${new Date().valueOf()}-${Math.round(Math.random() * Number.MAX_SAFE_INTEGER)}.js`;
  const workerFilePath = path.resolve(__dirname, workerFileName);
  if (typeof fn === 'function') {
    fs.writeFileSync(workerFilePath, createWorkerFunction(fn));
  }
  return new Promise((resolve, reject) => {
    const worker = new Worker(workerFilePath);
    worker.on('message', (result) => {
      resolve(result);
      worker.terminate();
    });
    worker.on('error', (err) => {
      reject(err);
      worker.terminate();
    });
    worker.on('exit', (code) => {
      if(!registered) {
        fs.unlinkSync(workerFilePath);
      }
      if(code !== 0) {
        reject(new Error('Worker stopped with exit code ' + code));
      }
    });
    worker.postMessage(args);
  });
}

export default go;
import * as fs from 'fs';
import path from 'path';
import { Worker } from 'worker_threads';

export const createWorkerFunction = (fn: (..._: any) => any): string => {
  if(typeof fn !== 'function') {
    throw new Error('fn is not a function');
  }
  const fnData = fn.toString();
  return `
  const { parentPort } = require('worker_threads');
  const fn = ${fnData};
  parentPort.on('message', (message) => {
    const result = fn(...message);
    parentPort.postMessage(result);
  });
  `;
}

async function go(fn: (..._: any) => any, ...args: any) {
  if(typeof fn !== 'function') {
    throw new Error('fn is not a function');
  }
  return new Promise((resolve, reject) => {
    const workerFileName = `worker-${new Date().valueOf()}-${Math.round(Math.random() * Number.MAX_SAFE_INTEGER)}.js`;
    const workerFilePath = path.resolve(__dirname, workerFileName);
    fs.writeFileSync(workerFilePath, createWorkerFunction(fn));
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
      fs.unlinkSync(workerFilePath);
      if(code !== 0) {
        reject(new Error('Worker stopped with exit code ' + code));
      }
    });
    worker.postMessage(args);
  });
}

export default go;
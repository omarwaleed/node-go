import * as fs from 'fs';
import path from 'path';
import { Worker } from 'worker_threads';

async function go(fn: (..._: any) => any, ...args: any) {
  if(typeof fn !== 'function') {
    throw new Error('fn is not a function');
  }
  const fnData = fn.toString();
  return new Promise((resolve, reject) => {
    const workerFileName = `worker-${new Date().valueOf()}.js`;
    const workerFilePath = path.resolve(__dirname, workerFileName);
    fs.writeFileSync(workerFilePath, `
      const { parentPort } = require('worker_threads');
      const fn = ${fnData};
      parentPort.on('message', (message) => {
        const result = fn(...message);
        parentPort.postMessage(result);
      });
    `);
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
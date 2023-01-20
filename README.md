# @gopher.js/go

Go is a wrapper that encapsulates a given function into a new thread and runs it. It makes it simpler to create node.js workers and execute them.

## Installation

NPM

```sh
npm install -S @gopher.js/go
```

Yarn

```sh
yarn add @gopher.js/go
```

## Example

@gopher.js/go exposes a wrapper function by default which when given a function will spawn it in an isolated thread.

```js
import go from '@gopher.js/go'


async function run() {
  let result = await go((a, b, c, d) => {
    return a + b + c + d;
  }, 1, 2, 3, 4);
  return "Result is " + result;
}

run()
.then(console.log) // prints "Result is 10"
.catch(console.error)
```

## Caveats

Unlike in golang, go will not just run the function, but instead it will return a promise that you can await or attach a then/catch statements to.

Unlike in golang, go will also _NOT_ understand predefined variables in a function. That means that any variable defined inside the go wrapper _MUST_ be defined as an argument.

You _cannot_ return a promise from inside a go function and expect a result or wrap the internal function as a promise. But you can run a promise inside the go function


Allowed

```js
const result = await go((a, b) => {
  new Promise(resolve => resolve(fn()));
  return a + b;
}, 1, 2);
```

NOT Allowed

```js
const result = await go(async (a, b) => {
  return a + b;
}, 1, 2);

// OR

const result = await go((a, b) => {
  return Promise.resolve(a + b);
}, 1, 2);
```

## Licesne

### MIT License
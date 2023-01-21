import go, { register, unregister } from '.';

describe('go', () => {
  it('should spawn a new thread and run it returning the result of the function in a promise', async () => {
    const result = await go((a, b) => a + b, 1, 2);
    expect(result).toBe(3);
  });

  it('should spawn a new thread with a function made up of more than 2 arguments', async () => {
    const result = await go((a, b, c, d) => a + b + c + d, 1, 2, 3, 4);
    expect(result).toBe(10);
  });

  it('should spawn a new thread with a function made up of more spread over multiple lines', async () => {
    const result = await go((a, b, c, d) => {
      return a + b + c + d;
    }, 1, 2, 3, 4);
    expect(result).toBe(10);
  });

  it("should spawn a new thread with a function that doesn't return anything", async () => {
    const result = await go(() => {
      console.log('Hello world!');
    });
    expect(result).toBe(undefined);
  })

  it("should spawn a new thread with a function that does nothing and not run it if execution ends", () => {
    const fn = jest.fn();
    go(() => {
      setTimeout(() => {
        fn();
      }, 250);
    }).catch(console.error);
    expect(fn).not.toHaveBeenCalled();
  })

  it("should throw an error if the first argument is not a function", async () => {
    let error, value;
    try {
      // @ts-ignore
      value = await go(1, 2, 3, 4);
    } catch (err) {
      error = err;
    }
    expect(error).toBeDefined();
    expect(value).toBeUndefined();
  });

  it("should run multiple threads at the same time", async () => {
    const results = await Promise.all([
      go((a, b) => a + b, 1, 2),
      go((a, b) => a + b, 3, 4),
      go((a, b) => a + b, 5, 6),
    ])
    expect(results[0]).toBe(3);
    expect(results[1]).toBe(7);
    expect(results[2]).toBe(11);
  })

  it("should run a gopher promise", async () => {
    const fn = jest.fn();
    const result = await go((a, b) => {
      new Promise(resolve => resolve(fn()));
      return a + b;
    }, 1, 2);
    expect(result).toBe(3);
  })

  it("should allow importing of a module inside the running function", async () => {
    const result = await go(() => {
      const fs = require('fs');
      const res = fs.readdirSync(".");
      return res;
    });
    expect(Array.isArray(result)).toBeTruthy();
    expect((result as Array<string>).length).toBeGreaterThan(0);
  })
});

describe('register/unregister', () => {
  it("should register a new function", () => {
    try {
      const fn = jest.fn();
      register('test', fn);
    } catch (err) {
      expect(err).toBeUndefined();
    } finally {
      // unregister('test');
    }
  });
  it("should unregister a function", () => {
    const fn = jest.fn();
    register('test', fn);
    unregister('test');
  });
  it("should succeed in unregister a function that doesn't exist", () => {
    unregister('test');
  });
  it("should run a registered function", async () => {
    // @ts-ignore
    const fn = (a, b) => a + b;
    register('test', fn);
    const result = await go('test', 1, 2);
    expect(result).toBe(3);
    unregister('test');
  })
  it("should fail if you try to run a function that doesn't exist", async () => {
    const t = async () => {
      return go('test');
    }
    expect(t).rejects.toThrow();
  })
  it("should fail if you try to run a function that was unregistered", async () => {
    // @ts-ignore
    const fn = (a, b) => a + b;
    register('test', fn);
    unregister('test');
    const t = async () => {
      await go('test');
    }
    expect(t).rejects.toThrow();
  })
});
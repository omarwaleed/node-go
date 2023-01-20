import go from '.';

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
});
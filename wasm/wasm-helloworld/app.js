const importObj = {
  module: {
    callJSFunction: () => {
      console.log(`calling JS function`);
    }
  },
  env: {
    memory: new WebAssembly.Memory({ initial: 256 }),
    table: new WebAssembly.Table({ initial: 0, element: 'anyfunc' })
  }
};

const wasm = WebAssembly.instantiateStreaming(fetch('./wasm/asmodule.wasm'), importObj);
wasm
  .then(({ instance }) => {
    const exports = instance.exports;
    const { add } = exports;
    console.log(`2 + 4 = ${add(2, 4)}`);
  })
  .catch(err => {
    console.error('Error: ', err);
  });

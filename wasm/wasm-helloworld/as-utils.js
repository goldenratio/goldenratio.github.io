// @ts-nocheck
// https://github.com/AssemblyScript/assemblyscript/issues/259

const hasBigInt64 = typeof BigUint64Array !== "undefined";
let mem, I8, U8, I16, U16, I32, U32, F32, F64, I64, U64;

const checkMem = (asModule) => {
  if (mem !== asModule.memory.buffer) {
    mem = asModule.memory.buffer;
    I8 = new Int8Array(mem);
    U8 = new Uint8Array(mem);
    I16 = new Int16Array(mem);
    U16 = new Uint16Array(mem);
    I32 = new Int32Array(mem);
    U32 = new Uint32Array(mem);
    if (hasBigInt64) {
      I64 = new BigInt64Array(mem);
      U64 = new BigUint64Array(mem);
    }
    F32 = new Float32Array(mem);
    F64 = new Float64Array(mem);
  }
};

export const newString = (asModule, str) => {
  const dataLength = str.length;
  const ptr = asModule["memory.allocate"](4 + (dataLength << 1));
  const dataOffset = (4 + ptr) >>> 1;
  checkMem();
  U32[ptr >>> 2] = dataLength;
  for (let i = 0; i < dataLength; ++i)
    U16[dataOffset + i] = str.charCodeAt(i);
  return ptr;
};

export const freeString = (asModule, ptr) => {
  asModule["memory.free"](ptr);
  checkMem();
};

export const getString = (asModule, ptr) => {
  checkMem(asModule);
  const dataLength = U32[ptr >>> 2];
  let dataOffset = (ptr + 4) >>> 1;
  let dataRemain = dataLength;
  const parts = [];
  const chunkSize = 1024;
  while (dataRemain > chunkSize) {
    let last = U16[dataOffset + chunkSize - 1];
    let size = last >= 0xD800 && last < 0xDC00 ? chunkSize - 1 : chunkSize;
    let part = U16.subarray(dataOffset, dataOffset += size);
    parts.push(String.fromCharCode.apply(String, part));
    dataRemain -= size;
  }
  return parts.join("") + String.fromCharCode.apply(String, U16.subarray(dataOffset, dataOffset + dataRemain));
};

export let asModule = undefined;

export const setASModuleExports = (exports) => {
  asModule = exports;
};

importScripts('encoder.js');

let length;
let encoder;
let ptrs;

self.onmessage = (msg) => {
  switch (msg.data.type) {
    case 'init':
      length = msg.data.width * msg.data.height * 4;
      encoder = Module['_encoder_new'](msg.data.width, msg.data.height);
      ptrs = [];
      break;

    case 'addFrame':
      if (!encoder) {
        throw new Error('Encoder is disposed');
      }

      const ptr = Module._malloc(length);
      const buffer = new Uint8Array(Module.HEAPU8.buffer, ptr, length);
      buffer.set(new Uint8Array(msg.data.imageData));

      Module['_encoder_add_frame'](encoder, ptr, msg.data.delay / 10);
      ptrs.push(ptr);
      break;

    case 'encode':
      if (!encoder) {
        throw new Error('Encoder is disposed');
      }

      Module['_encoder_encode'](encoder);

      for (const ptr of ptrs) {
        Module._free(ptr);
      }

      encoder = null;

      const result = FS.readFile('/output.gif');
      const blob = new Blob([result], { type: 'image/gif' });

      self.postMessage({ type: 'finished', blob });
  }
};

Module['onRuntimeInitialized'] = () => self.postMessage({ type: 'ready' });
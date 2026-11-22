/* eslint-disable */
// Helper script to generate PWA icons with pure Node.js zlib
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function createPng(width, height, r, g, b, a = 255) {
  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); // bit depth: 8
  ihdrData.writeUInt8(6, 9); // color type: 6 (RGBA)
  ihdrData.writeUInt8(0, 10); // compression method
  ihdrData.writeUInt8(0, 11); // filter method
  ihdrData.writeUInt8(0, 12); // interlace method

  const ihdrChunk = makeChunk('IHDR', ihdrData);

  // Scanlines for RGBA
  const rowBytes = width * 4;
  const rawScanlines = Buffer.alloc((rowBytes + 1) * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * (rowBytes + 1);
    rawScanlines[rowOffset] = 0; // Filter type 0 (None)

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      // Draw warm badge border / inner coffee cup icon logic
      const dx = x - width / 2;
      const dy = y - height / 2;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const radius = width * 0.45;

      if (dist <= radius) {
        // Warm amber gradient
        const t = y / height;
        const curR = Math.round(180 + t * 30); // 180-210
        const curG = Math.round(83 + t * 30);  // 83-113
        const curB = Math.round(9 + t * 10);   // 9-19
        
        // Simple center cup motif
        const inCenterBox = Math.abs(dx) < width * 0.2 && Math.abs(dy) < height * 0.2;
        if (inCenterBox && (Math.abs(dx) > width * 0.16 || Math.abs(dy) > height * 0.16 || dy > height * 0.08)) {
          // Cup border / handle
          rawScanlines[pxOffset] = 255;
          rawScanlines[pxOffset + 1] = 255;
          rawScanlines[pxOffset + 2] = 255;
          rawScanlines[pxOffset + 3] = 255;
        } else {
          rawScanlines[pxOffset] = curR;
          rawScanlines[pxOffset + 1] = curG;
          rawScanlines[pxOffset + 2] = curB;
          rawScanlines[pxOffset + 3] = a;
        }
      } else {
        // Transparent outside circular mask
        rawScanlines[pxOffset] = 0;
        rawScanlines[pxOffset + 1] = 0;
        rawScanlines[pxOffset + 2] = 0;
        rawScanlines[pxOffset + 3] = 0;
      }
    }
  }

  const compressedData = zlib.deflateSync(rawScanlines);
  const idatChunk = makeChunk('IDAT', compressedData);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function makeChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(4 + 4 + len + 4);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);

  // CRC32
  const crcTarget = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = crc32(crcTarget);
  chunk.writeUInt32BE(crc, 8 + len);
  return chunk;
}

// Simple CRC32 table & calculation
const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) {
      c = 0xedb88320 ^ (c >>> 1);
    } else {
      c = c >>> 1;
    }
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

const outDir = path.join(__dirname, 'public', 'icons');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// Write icons
fs.writeFileSync(path.join(outDir, 'icon-192.png'), createPng(192, 192, 180, 83, 9));
fs.writeFileSync(path.join(outDir, 'icon-512.png'), createPng(512, 512, 180, 83, 9));
fs.writeFileSync(path.join(outDir, 'apple-touch-icon.png'), createPng(180, 180, 180, 83, 9));
fs.writeFileSync(path.join(outDir, 'icon-maskable.png'), createPng(512, 512, 180, 83, 9));

console.log('Successfully generated PWA PNG icons in public/icons/');

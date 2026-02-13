
export async function createTar(files: { name: string; blob: Blob }[]): Promise<Blob> {
  const chunks: BlobPart[] = [];
  const encoder = new TextEncoder();

  function pad(num: number, bytes: number, base = 8): string {
    const str = num.toString(base);
    return '0'.repeat(Math.max(0, bytes - str.length)) + str;
  }

  function writeString(str: string, length: number): Uint8Array {
    const buffer = new Uint8Array(length);
    const encoded = encoder.encode(str);
    buffer.set(encoded.slice(0, length));
    return buffer;
  }

  for (const file of files) {
    const header = new Uint8Array(512);
    const name = file.name;
    const size = file.blob.size;

    // POSIX ustar header format
    // Ref: https://www.gnu.org/software/tar/manual/html_node/Standard.html
    header.set(writeString(name, 100), 0); // name
    header.set(writeString(pad(0o644, 7), 8), 100); // mode
    header.set(writeString(pad(0o000, 7), 8), 108); // uid
    header.set(writeString(pad(0o000, 7), 8), 116); // gid
    header.set(writeString(pad(size, 11), 12), 124); // size
    header.set(writeString(pad(Math.floor(Date.now() / 1000), 11), 12), 136); // mtime
    header.set(writeString('        ', 8), 148); // chksum (blank for now)
    header[156] = '0'.charCodeAt(0); // typeflag (0 = file)

    // Magic ustar
    header.set(writeString('ustar', 6), 257);
    header.set(writeString('00', 2), 263);

    // Calculate checksum
    let checksum = 0;
    for (let i = 0; i < 512; i++) {
 checksum += header[i];
}

    // Write checksum
    const chksumStr = pad(checksum, 6) + '\0 ';
    header.set(writeString(chksumStr, 8), 148);

    chunks.push(header);
    chunks.push(file.blob);

    // Pad file content to 512 byte boundary
    const padding = (512 - (size % 512)) % 512;
    if (padding > 0) {
      chunks.push(new Uint8Array(padding));
    }
  }

  // Two 512-byte blocks of zeros at end of file
  chunks.push(new Uint8Array(1024));

  return new Blob(chunks, { type: 'application/x-tar' });
}

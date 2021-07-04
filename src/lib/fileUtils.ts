import fs from 'fs';

export function readFromFile(filename: string) {
  let rawData = fs.readFileSync(filename, { encoding: 'utf-8' });
  return JSON.parse(rawData);
}

export function writeToFile(
  filename: string,
  data: any,
  stringify = true
): void {
  const content = stringify ? JSON.stringify(data) : data;
  try {
    fs.writeFileSync(`${filename}`, content);
  } catch (err) {
    console.error(err);
  }
}

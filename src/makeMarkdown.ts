import { MarkdownGenerator } from './MarkdownGenrator';
import { IRefinedData } from './autorefineVideoData';
import { readFromFile, writeToFile } from './lib/fileUtils';

if (module === require.main) {
  const azbukaJsonDataFilename = process.argv[2];
  const azbukaMarkdownFilename = process.argv[3];

  const azbuka: IRefinedData = readFromFile(azbukaJsonDataFilename);
  const generator = new MarkdownGenerator(azbuka);
  const md = generator.generate();

  writeToFile(azbukaMarkdownFilename, md, false);
}

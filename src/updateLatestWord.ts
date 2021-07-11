import { IRefinedData } from './autorefineVideoData';
import { readFromFile, writeToFile } from './lib/fileUtils';

function updateLatestWord(azbukaFilename: string, newWord: string) {
  const autoRefinedAzbuka: IRefinedData = readFromFile(azbukaFilename);
  const latestItem =
    autoRefinedAzbuka.items[autoRefinedAzbuka.items.length - 1];
  latestItem.word = newWord;
  writeToFile(azbukaFilename, autoRefinedAzbuka);
}

if (module === require.main) {
  const azbukaFilename = process.argv[2];
  const newWord = process.argv[3];
  if (!newWord) {
    throw Error(
      'Передайте слово вторым аргументом. Например: npm run updateLatestWord -- "Демократия"'
    );
  }
  updateLatestWord(azbukaFilename, newWord);
}

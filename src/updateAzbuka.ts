import Config from '../config.json';
import {
  IPlaylistItem,
  IVideoIdCommentsMap,
  VideoDataDownloader,
} from './lib/VideoDataDownloader';
import { readFromFile, writeToFile } from './lib/fileUtils';
import { AzbukaTimestampSearcher } from './AzbukaTimestampSearcher';
import {
  autoRefineVideoData,
  IRefinedData,
  IRefinedDataItem,
} from './autorefineVideoData';

// на всякий случай
// const videoId = 'zOweT9pktIk'; // видео с таймстемпом в комментариях
// const videoId = 'rlE6DyWqpu8'; // видео с таймстемпом в описании

async function download(playlistId: string): Promise<{
  playlistItems: IPlaylistItem[];
  videoCommentsMap: IVideoIdCommentsMap;
}> {
  const downloader = new VideoDataDownloader({ authApiKey: Config.api_key });
  console.log('playlistId', playlistId);
  console.log('Fetching videos...');
  const playlistItems = await downloader.fetchPlaylistItems(playlistId);

  console.log(`Found ${playlistItems.length} videos in playlist`);
  console.log('Fetching timecode comments');
  const videoCommentsMap = await downloader.fetchCommentsForPlaylistItems(
    playlistItems,
    { searchTerms: 'азбука' }
  );

  return { playlistItems, videoCommentsMap };
}

function searchTimestamps(
  playlistItems: IPlaylistItem[],
  videoCommentsMap: IVideoIdCommentsMap
) {
  console.log(`Found ${Object.keys(videoCommentsMap).length} keys`);
  const videosWithComments = Object.keys(videoCommentsMap).filter(
    (videoId) => videoCommentsMap[videoId].length
  );
  console.log(
    `Found ${videosWithComments.length} keys with at least 1 comment`
  );

  const searcher = new AzbukaTimestampSearcher(playlistItems, videoCommentsMap);
  return searcher.processVideos();
}

function someAnalytics(autoRefinedData: IRefinedData) {
  const timestampedItems = autoRefinedData.items.filter((item) => !!item?.t);
  return {
    total: autoRefinedData.items.length,
    withTimestamp: timestampedItems.length,
  };
}

function diff(
  manualRefinedAzbuka: IRefinedData,
  autoRefinedAzbuka: IRefinedData
): IRefinedDataItem[] {
  const manualRefinedVideoIds = new Set(
    manualRefinedAzbuka.items.map(
      (manualRefinedItem) => manualRefinedItem.videoId
    )
  );
  return autoRefinedAzbuka.items.filter(
    (autoRefinedItem) => !manualRefinedVideoIds.has(autoRefinedItem.videoId)
  );
}

function enrichManualRefinedAzbuka(
  manualRefinedAzbuka: IRefinedData,
  newWords: IRefinedDataItem[]
): IRefinedData {
  return {
    ...manualRefinedAzbuka,
    items: manualRefinedAzbuka.items.concat(newWords),
  };
}

async function updateAzbuka() {
  const manualRefinedAzbukaFilename = process.argv[2];
  const playlistId = Config.playlist_id as string;
  const { playlistItems, videoCommentsMap } = await download(playlistId);
  const videoMeta = searchTimestamps(playlistItems, videoCommentsMap);
  const autoRefinedData = autoRefineVideoData(playlistId, videoMeta);
  console.log(someAnalytics(autoRefinedData));

  const manualRefinedAzbuka: IRefinedData = readFromFile(
    manualRefinedAzbukaFilename
  );
  const newAzbukaWords = diff(manualRefinedAzbuka, autoRefinedData);
  console.log('Новые слова', newAzbukaWords);

  const newAzbuka = enrichManualRefinedAzbuka(
    manualRefinedAzbuka,
    newAzbukaWords
  );
  writeToFile(manualRefinedAzbukaFilename, newAzbuka);
}

if (module === require.main) {
  updateAzbuka().catch(console.error);
}

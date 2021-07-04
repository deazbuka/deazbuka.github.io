import { toSeconds } from './lib/toSeconds';
import { IVideoMeta } from './AzbukaTimestampSearcher';

const regex = /(\d\d:\d\d)(.*)/g;

export interface IRefinedData {
  playlistId: string;
  items: IRefinedDataItem[];
}

export interface IRefinedDataItem {
  videoId: string;
  word?: string;
  t?: number;
  text?: string;
}

export function autoRefineVideoData(
  playlistId: string,
  videoMetaList: IVideoMeta[]
): IRefinedData {
  return {
    playlistId: playlistId,
    items: videoMetaList.map((videoMeta) => refineLine(videoMeta)),
  };
}

function refineLine(videoMeta: IVideoMeta): IRefinedDataItem {
  const timestampLine = getTimestampLine(videoMeta);
  if (!timestampLine) {
    return {
      videoId: videoMeta.videoId,
      text: videoMeta.title,
    };
  }
  const { time, text }: { time?: string; text?: string } =
    parseTimestampLine(timestampLine);
  const t = toSeconds(time);

  return {
    videoId: videoMeta.videoId,
    t: t,
    word: text,
  };
}

function parseTimestampLine(timestampLine: string) {
  const [_, time, text] = timestampLine.matchAll(regex).next().value;
  return {
    time,
    text: text?.trim?.(),
  };
}

function getTimestampLine(videoMeta: IVideoMeta): string {
  return videoMeta.descriptionTimestamps?.[0] || videoMeta.timestamps?.[0];
}

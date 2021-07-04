import { IVideoIdCommentsMap, IPlaylistItem } from './lib/VideoDataDownloader';
import { getCommentText, getVideoId } from './lib/videoDataUtils';

const azbukaTimestampRegex = /(\d\d:\d\d.*?[Аа][Зз][Бб][Уу][Кк][Аа].*)/;
const timestampRegex = /\d\d:\d\d/;

export interface IVideoMeta {
  playlistItemId: string;
  videoId: string;
  title: string;
  hasAzbukaComments: boolean;
  hasTimestampComments: boolean;
  hasTimestampDescription: boolean;
  timestamps: string[];
  descriptionTimestamps: string[];
}

export class AzbukaTimestampSearcher {
  playlistItems: IPlaylistItem[];
  commentsMap: IVideoIdCommentsMap;

  constructor(
    playlistItems: IPlaylistItem[],
    commentsMap: IVideoIdCommentsMap
  ) {
    this.playlistItems = playlistItems;
    this.commentsMap = commentsMap;
  }

  processVideos(): IVideoMeta[] {
    return this.playlistItems.map((playlistItem) =>
      this.processVideo(playlistItem)
    );
  }

  private processVideo(playlistItem: IPlaylistItem): IVideoMeta {
    const videoId = getVideoId(playlistItem);
    return {
      playlistItemId: playlistItem.id,
      videoId: videoId,
      title: playlistItem.snippet.title,
      ...this.processComments(videoId),
      ...this.processVideoDescription(playlistItem),
      hasTimestampDescription: false,
    };
  }

  private processVideoDescription(playlistItem: IPlaylistItem) {
    const descriptionText = playlistItem.snippet.description;
    const hasDescriptionTimestamp =
      AzbukaTimestampSearcher.hasTimestamp(descriptionText);
    const descriptionTimestamps =
      AzbukaTimestampSearcher.getAzbukaTimestamp(descriptionText);

    return {
      hasDescriptionTimestamp,
      descriptionTimestamps,
    };
  }

  processComments(
    videoId: string
  ): Pick<
    IVideoMeta,
    'hasAzbukaComments' | 'hasTimestampComments' | 'timestamps'
  > {
    const comments = this.commentsMap[videoId];
    const commentTexts = comments.map((comment) => getCommentText(comment));

    const timestamps = commentTexts.flatMap((text) =>
      AzbukaTimestampSearcher.getAzbukaTimestamp(text)
    );

    return {
      hasAzbukaComments: !!comments.length,
      hasTimestampComments: !!commentTexts.filter((text) => {
        return AzbukaTimestampSearcher.hasTimestamp(text);
      }).length,
      timestamps: timestamps,
    };
  }

  static hasTimestamp(text: string) {
    return !!text.match(timestampRegex)?.length;
  }

  static getAzbukaTimestamp(text: string): string[] {
    const lines = text.split('\n').map((line) => line.trim());

    const matches = lines.filter((line) => line.match(azbukaTimestampRegex));

    if (matches.length) {
      return matches;
    }

    // обрабатывает комментарий вида
    // АЗБУКА ДЕМОКРАТИИ
    // 33:02 И - Информация, информационное общество.
    const titleIndex = lines.findIndex((line) =>
      line.startsWith('АЗБУКА ДЕМОКРАТИИ')
    );
    if (titleIndex > 0) {
      return [lines[titleIndex + 1]];
    }

    return [];
  }
}

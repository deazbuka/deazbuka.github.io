import { google, youtube_v3 } from 'googleapis';
import pLimit from 'p-limit';
import { getVideoId } from './videoDataUtils';

const youtube = google.youtube('v3');

export type IInitOptions = {
  authApiKey: string; // Api Key для Youtube Data API v3
  concurrencyLimit?: number; // ограничение сверху на количество элементов в получаемых списках
  maxResults?: number; // ограничение сверху на количество одновременных запросов к Api
};

export type IVideoIdCommentsMap = {
  [x: string]: youtube_v3.Schema$CommentThread[];
};

export type IPlaylistItem = youtube_v3.Schema$PlaylistItem;

export class VideoDataDownloader {
  authApiKey: string;
  maxResults: number;
  concurrencyLimit: number;

  constructor({
    authApiKey,
    concurrencyLimit = 50,
    maxResults = 50,
  }: IInitOptions) {
    this.authApiKey = authApiKey;
    this.concurrencyLimit = concurrencyLimit;
    this.maxResults = maxResults;

    this.auth(authApiKey);
  }

  async fetchPlaylistItems(playlistId: string): Promise<IPlaylistItem[]> {
    let items: IPlaylistItem[] = [];

    const pageIterator = this.playlistItemsListByPage({
      part: ['id', 'snippet'],
      playlistId: playlistId,
      maxResults: this.maxResults,
    });

    for await (const response of pageIterator) {
      items = items.concat(response.items || []);
    }

    return items;
  }

  async fetchCommentsForPlaylistItems(
    playlistItems: IPlaylistItem[],
    params: youtube_v3.Params$Resource$Commentthreads$List = {}
  ): Promise<IVideoIdCommentsMap> {
    const resultMap: IVideoIdCommentsMap = {};

    const videoIds = playlistItems.map((playlistItem) =>
      getVideoId(playlistItem)
    );
    const runLimited = pLimit(this.concurrencyLimit);

    const downloadPromises = videoIds.map((videoId) =>
      runLimited(async () => {
        const comments = await this.fetchCommentsForVideo(videoId, params);
        resultMap[videoId] = comments;
      })
    );

    await Promise.all(downloadPromises);

    return resultMap;
  }

  private auth(authApiKey: string): void {
    google.options({ auth: authApiKey });
  }

  private async *playlistItemsListByPage(
    params: youtube_v3.Params$Resource$Playlistitems$List
  ): AsyncGenerator<youtube_v3.Schema$PlaylistItemListResponse, void, void> {
    let res = await youtube.playlistItems.list(params);
    yield res.data;

    while (res.data.nextPageToken) {
      res = await youtube.playlistItems.list({
        ...params,
        pageToken: res.data.nextPageToken,
      });
      yield res.data;
    }
  }

  private async fetchCommentsForVideo(
    videoId: string,
    options: youtube_v3.Params$Resource$Commentthreads$List = {}
  ): Promise<youtube_v3.Schema$CommentThread[]> {
    const response = await youtube.commentThreads.list({
      part: ['id', 'snippet'],
      videoId: videoId,
      maxResults: this.maxResults,
      ...options,
    });

    return response.data.items;
  }
}

import { youtube_v3 } from 'googleapis';

export function getVideoId(
  playlistItem: youtube_v3.Schema$PlaylistItem
): string {
  return playlistItem.snippet.resourceId.videoId;
}

export function getCommentText(
  comment: youtube_v3.Schema$CommentThread
): string {
  return comment.snippet.topLevelComment.snippet.textOriginal;
}

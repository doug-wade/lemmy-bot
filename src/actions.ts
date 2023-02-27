import { CommentSortType, SortType } from 'lemmy-js-client';
import { LemmyWebsocket } from 'lemmy-js-client';
import { connection as Connection } from 'websocket';
import { useDatabaseFunctions } from './db';
import { futureDaysToUnixTime, Vote } from './helpers';

const lemmyWSClient = new LemmyWebsocket();

export const logIn = ({
  connection,
  username,
  password
}: {
  connection: Connection;
  username: string;
  password: string;
}) => {
  const request = lemmyWSClient.login({
    username_or_email: username,
    password
  });

  connection.send(request);
};

export const enableBotAccount = ({
  connection,
  auth
}: {
  connection: Connection;
  auth: string;
}) => {
  const request = lemmyWSClient.saveUserSettings({
    auth,
    bot_account: true
  });

  connection.send(request);
};

export const voteDBPost = async ({
  connection,
  id,
  auth,
  vote
}: {
  connection: Connection;
  id: number;
  auth: string;
  vote: Vote;
}) => {
  await useDatabaseFunctions(async ({ setPostVote }) => {
    const request = lemmyWSClient.likePost({
      auth,
      post_id: id,
      score: vote
    });

    setPostVote(id, vote);

    connection.send(request);
  });
};

export const voteDBComment = async ({
  connection,
  id,
  auth,
  vote
}: {
  connection: Connection;
  id: number;
  auth: string;
  vote: Vote;
}) => {
  await useDatabaseFunctions(async ({ setCommentVote }) => {
    const request = lemmyWSClient.likeComment({
      auth,
      comment_id: id,
      score: vote
    });

    setCommentVote(id, vote);

    connection.send(request);
  });
};

export const getPosts = (connection: Connection) => {
  const request = lemmyWSClient.getPosts({
    sort: SortType.New,
    limit: 10
  });

  connection.send(request);
};

export const createPostReport = async ({
  connection,
  auth,
  id,
  reason
}: {
  connection: Connection;
  auth: string;
  id: number;
  reason: string;
}) => {
  await useDatabaseFunctions(async ({ addPostReport }) => {
    const request = lemmyWSClient.createPostReport({
      auth,
      post_id: id,
      reason
    });

    await addPostReport(id);

    connection.send(request);
  });
};

export const getComments = (connection: Connection) => {
  const request = lemmyWSClient.getComments({
    sort: CommentSortType.New,
    limit: 10
  });

  connection.send(request);
};

export const createComment = async ({
  connection,
  auth,
  postId,
  parentId,
  content
}: {
  connection: Connection;
  auth: string;
  postId: number;
  parentId?: number;
  content: string;
}) => {
  await useDatabaseFunctions(
    async ({ addCommentResponse, addPostResponse }) => {
      const request = lemmyWSClient.createComment({
        auth,
        content,
        post_id: postId,
        parent_id: parentId
      });

      if (parentId) {
        await addCommentResponse(parentId);
      } else {
        await addPostResponse(postId);
      }

      connection.send(request);
    }
  );
};

export const createCommentReport = async ({
  auth,
  id,
  reason,
  connection
}: {
  auth: string;
  id: number;
  reason: string;
  connection: Connection;
}) => {
  await useDatabaseFunctions(async ({ addCommentReport }) => {
    const request = lemmyWSClient.createCommentReport({
      auth,
      comment_id: id,
      reason
    });

    await addCommentReport(id);

    connection.send(request);
  });
};

export const createBanFromCommunity = ({
  communityId,
  auth,
  connection,
  personId,
  daysUntilExpires,
  reason,
  removeData
}: {
  connection: Connection;
  auth: string;
  communityId: number;
  personId: number;
  daysUntilExpires?: number;
  reason?: string;
  removeData?: boolean;
}) => {
  const request = lemmyWSClient.banFromCommunity({
    auth,
    ban: true,
    community_id: communityId,
    person_id: personId,
    expires: futureDaysToUnixTime(daysUntilExpires),
    reason,
    remove_data: removeData
  });

  connection.send(request);
};

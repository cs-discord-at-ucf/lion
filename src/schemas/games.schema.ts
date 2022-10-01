import mongoose from 'mongoose';
import { ICountingEntry } from '../common/types';
import { GameLeaderBoardDocument } from '../services/gameleaderboard.service';
const { Schema } = mongoose;

const gameUserSchema = new Schema({
  opponent: String,
  result: Number,
});

const gameLeaderboardSchema = new Schema({
  userId: String,
  guildId: String,
  games: [gameUserSchema],
});

const countingLeaderboardSchema = new Schema({
  userId: String,
  count: Number,
});

export const TTTLeaderboardModel = mongoose.model<GameLeaderBoardDocument>(
  'tttLeaderboard',
  gameLeaderboardSchema,
  'tttLeaderboard'
);
export const C4LeaderboardModel = mongoose.model<GameLeaderBoardDocument>(
  'connectFourLeaderboard',
  gameLeaderboardSchema,
  'connectFourLeaderboard'
);
export const CountingLeaderboardModel = mongoose.model<CountingDocument>(
  'countingLeaderboard',
  countingLeaderboardSchema
);

export type CountingDocument = ICountingEntry & Document;

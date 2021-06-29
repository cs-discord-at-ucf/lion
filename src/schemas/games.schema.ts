import mongoose from 'mongoose';
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

export const TTTLeaderboardModel = mongoose.model<GameLeaderBoardDocument>('tttLeaderboard', gameLeaderboardSchema, 'tttLeaderboard');
export const C4LeaderboardModel = mongoose.model<GameLeaderBoardDocument>('connectFourLeaderboard', gameLeaderboardSchema, 'connectFourLeaderboard');

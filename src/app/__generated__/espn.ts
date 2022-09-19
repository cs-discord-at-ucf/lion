/* eslint-disable @typescript-eslint/no-explicit-any */
export interface ISample {
  leagues: ILeague[];
  events: IEvent[];
}

export interface IEvent {
  id: string;
  uid: string;
  date: string;
  name: string;
  shortName: string;
  competitions: ICompetition[];
  links: IEventLink[];
  weather: IWeather;
  status: IStatus;
}

export interface ICompetition {
  id: string;
  uid: string;
  date: string;
  attendance: number;
  timeValid: boolean;
  neutralSite: boolean;
  conferenceCompetition: boolean;
  recent: boolean;
  competitors: ICompetitor[];
  notes: any[];
  situation?: ISituation;
  status: IStatus;
  leaders?: ICompetitorLeader[];
  startDate: string;
}
export interface ICompetitor {
  id: string;
  uid: string;
  order: number;
  team: ITeam;
  score: string;
  curatedRank: ICuratedRank;
  statistics: any[];
  records: IRecord[];
  leaders?: ICompetitorLeader[];
}

export interface ICuratedRank {
  current: number;
}

export interface ICompetitorLeader {
  displayName: DisplayName;
  leaders: ILeaderLeader[];
}

export enum DisplayName {
  PassingLeader = 'Passing Leader',
  ReceivingLeader = 'Receiving Leader',
  RushingLeader = 'Rushing Leader',
}

export interface ILeaderLeader {
  displayValue: string;
  value: number;
  athlete: IAthlete;
}

export interface IAthlete {
  id: string;
  fullName: string;
  displayName: string;
  shortName: string;
  headshot: string;
  jersey: string;
  active: boolean;
}

export interface IRecord {
  summary: string;
}

export interface ITeam {
  id: string;
  uid: string;
  location: string;
  name: string;
  abbreviation: string;
  displayName: string;
  shortDisplayName: string;
  color: string;
  alternateColor: string;
  isActive: boolean;
  logo: string;
  conferenceId: string;
}

export interface ISituation {
  $ref: string;
  lastPlay: ILastPlay;
  down: number;
  yardLine: number;
  distance: number;
  downDistanceText: string;
  shortDownDistanceText: string;
  possessionText: string;
  isRedZone: boolean;
  homeTimeouts: number;
  awayTimeouts: number;
  possession: string;
}

export interface ILastPlay {
  probability: IProbability;
}

export interface IProbability {
  tiePercentage: number;
  homeWinPercentage: number;
  awayWinPercentage: number;
  secondsLeft: number;
}
export interface IStatus {
  clock: number;
  displayClock: DisplayClock;
  period: number;
  type: IStatusType;
}

export enum DisplayClock {
  The000 = '0:00',
}

export interface IStatusType {
  id: string;
  state: State;
  completed: boolean;
  detail: string;
  shortDetail: string;
}

export enum State {
  Post = 'post',
  Pre = 'pre',
}

export interface IEventLink {
  href: string;
  isExternal: boolean;
  isPremium: boolean;
}

export interface IWeather {
  displayValue: string;
  highTemperature: number;
  temperature: number;
  conditionId: string;
}

export interface ILeague {
  id: string;
  uid: string;
  name: string;
  abbreviation: string;
  midsizeName: string;
  slug: string;
  calendarType: string;
  calendarIsWhitelist: boolean;
  calendarStartDate: string;
  calendarEndDate: string;
}

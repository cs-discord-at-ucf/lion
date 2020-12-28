export interface Sample {
  leagues: League[];
  events: Event[];
}

export interface Event {
  id: string;
  uid: string;
  date: string;
  name: string;
  shortName: string;
  competitions: Competition[];
  links: EventLink[];
  weather: Weather;
  status: Status;
}

export interface Competition {
  id: string;
  uid: string;
  date: string;
  attendance: number;
  timeValid: boolean;
  neutralSite: boolean;
  conferenceCompetition: boolean;
  recent: boolean;
  competitors: Competitor[];
  notes: any[];
  situation?: Situation;
  status: Status;
  leaders?: CompetitorLeader[];
  startDate: string;
}
export interface Competitor {
  id: string;
  uid: string;
  order: number;
  team: Team;
  score: string;
  curatedRank: CuratedRank;
  statistics: any[];
  records: Record[];
  leaders?: CompetitorLeader[];
}

export interface CuratedRank {
  current: number;
}

export interface CompetitorLeader {
  displayName: DisplayName;
  leaders: LeaderLeader[];
}

export enum DisplayName {
  PassingLeader = 'Passing Leader',
  ReceivingLeader = 'Receiving Leader',
  RushingLeader = 'Rushing Leader',
}

export interface LeaderLeader {
  displayValue: string;
  value: number;
  athlete: Athlete;
}

export interface Athlete {
  id: string;
  fullName: string;
  displayName: string;
  shortName: string;
  headshot: string;
  jersey: string;
  active: boolean;
}

export interface Record {
  summary: string;
}

export interface Team {
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

export interface Situation {
  $ref: string;
  lastPlay: LastPlay;
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

export interface LastPlay {
  probability: Probability;
}

export interface Probability {
  tiePercentage: number;
  homeWinPercentage: number;
  awayWinPercentage: number;
  secondsLeft: number;
}
export interface Status {
  clock: number;
  displayClock: DisplayClock;
  period: number;
  type: StatusType;
}

export enum DisplayClock {
  The000 = '0:00',
}

export interface StatusType {
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

export interface EventLink {
  href: string;
  isExternal: boolean;
  isPremium: boolean;
}

export interface Weather {
  displayValue: string;
  highTemperature: number;
  temperature: number;
  conditionId: string;
}

export interface League {
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

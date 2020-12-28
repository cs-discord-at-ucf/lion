export interface Sample {
  leagues: League[];
  season: EventSeason;
  week: Week;
  events: Event[];
}

export interface Event {
  id: string;
  uid: string;
  date: string;
  name: string;
  shortName: string;
  season: EventSeason;
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
  type: CompetitionType;
  timeValid: boolean;
  neutralSite: boolean;
  conferenceCompetition: boolean;
  recent: boolean;
  venue: CompetitionVenue;
  competitors: Competitor[];
  notes: any[];
  situation?: Situation;
  status: Status;
  broadcasts: Broadcast[];
  leaders?: CompetitorLeader[];
  groups?: Groups;
  tickets?: Ticket[];
  startDate: string;
  geoBroadcasts: GeoBroadcast[];
  odds?: Odd[];
}

export interface Broadcast {
  market: MarketEnum;
  names: string[];
}

export enum MarketEnum {
  National = 'national',
}

export interface Competitor {
  id: string;
  uid: string;
  type: TypeElement;
  order: number;
  homeAway: HomeAway;
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

export enum HomeAway {
  Away = 'away',
  Home = 'home',
}

export interface CompetitorLeader {
  name: LeaderName;
  displayName: DisplayName;
  shortDisplayName: ShortDisplayName;
  abbreviation: LeaderAbbreviation;
  leaders: LeaderLeader[];
}

export enum LeaderAbbreviation {
  Pyds = 'PYDS',
  Recyds = 'RECYDS',
  Ryds = 'RYDS',
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
  team: TeamClass;
}

export interface Athlete {
  id: string;
  fullName: string;
  displayName: string;
  shortName: string;
  links: AthleteLink[];
  headshot: string;
  jersey: string;
  position: Position;
  team: TeamClass;
  active: boolean;
}

export interface AthleteLink {
  rel: PurpleRel[];
  href: string;
}

export enum PurpleRel {
  Athlete = 'athlete',
  Bio = 'bio',
  Desktop = 'desktop',
  Gamelog = 'gamelog',
  News = 'news',
  Overview = 'overview',
  Playercard = 'playercard',
  Splits = 'splits',
  Stats = 'stats',
}

export interface Position {
  abbreviation: PositionAbbreviation;
}

export enum PositionAbbreviation {
  Qb = 'QB',
  Rb = 'RB',
  Te = 'TE',
  Wr = 'WR',
}

export interface TeamClass {
  id: string;
}

export enum LeaderName {
  PassingLeader = 'passingLeader',
  PassingYards = 'passingYards',
  ReceivingLeader = 'receivingLeader',
  ReceivingYards = 'receivingYards',
  RushingLeader = 'rushingLeader',
  RushingYards = 'rushingYards',
}

export enum ShortDisplayName {
  Pass = 'PASS',
  Rec = 'REC',
  Rush = 'RUSH',
}

export interface Record {
  name: NameEnum;
  abbreviation: NameEnum;
  type: RecordType;
  summary: string;
}

export enum NameEnum {
  Away = 'Away',
  Conf = 'CONF',
  Home = 'Home',
  Overall = 'overall',
  VsConf = 'vsConf',
}

export enum RecordType {
  Awayrecord = 'awayrecord',
  Homerecord = 'homerecord',
  Total = 'total',
  Vsconf = 'vsconf',
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
  venue: TeamClass;
  links: TeamLink[];
  logo: string;
  conferenceId: string;
}

export interface TeamLink {
  rel: TypeElement[];
  href: string;
  text: PurpleText;
  isExternal: boolean;
  isPremium: boolean;
}

export enum TypeElement {
  App = 'app',
  Awards = 'awards',
  Clubhouse = 'clubhouse',
  Desktop = 'desktop',
  Mobile = 'mobile',
  Photos = 'photos',
  Roster = 'roster',
  Schedule = 'schedule',
  Scores = 'scores',
  Sportscenter = 'sportscenter',
  Stats = 'stats',
  Team = 'team',
}

export enum PurpleText {
  Awards = 'Awards',
  Clubhouse = 'Clubhouse',
  Photos = 'photos',
  Roster = 'Roster',
  Schedule = 'Schedule',
  Scores = 'Scores',
  Statistics = 'Statistics',
}

export interface GeoBroadcast {
  type: GeoBroadcastType;
  market: MarketClass;
  media: Media;
  lang: Lang;
  region: Region;
}

export enum Lang {
  En = 'en',
}

export interface MarketClass {
  id: string;
  type: MarketType;
}

export enum MarketType {
  National = 'National',
}

export interface Media {
  shortName: string;
}

export enum Region {
  Us = 'us',
}

export interface GeoBroadcastType {
  id: string;
  shortName: ShortName;
}

export enum ShortName {
  Radio = 'Radio',
  Tv = 'TV',
  Web = 'Web',
}

export interface Groups {
  id: string;
  name: string;
  shortName: string;
  isConference: boolean;
}

export interface Odd {
  provider: Provider;
  details: string;
  overUnder: number;
}

export interface Provider {
  id: string;
  name: ProviderName;
  priority: number;
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

export enum ProviderName {
  WilliamHillNewJersey = 'William Hill (New Jersey)',
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
  name: TypeName;
  state: State;
  completed: boolean;
  description: Description;
  detail: string;
  shortDetail: string;
}

export enum Description {
  Canceled = 'Canceled',
  Postponed = 'Postponed',
  Scheduled = 'Scheduled',
}

export enum TypeName {
  StatusCanceled = 'STATUS_CANCELED',
  StatusPostponed = 'STATUS_POSTPONED',
  StatusScheduled = 'STATUS_SCHEDULED',
}

export enum State {
  Post = 'post',
  Pre = 'pre',
}

export interface Ticket {
  summary: string;
  numberAvailable: number;
  links: TicketLink[];
}

export interface TicketLink {
  href: string;
}

export interface CompetitionType {
  id: string;
  abbreviation: TypeAbbreviation;
}

export enum TypeAbbreviation {
  Std = 'STD',
}

export interface CompetitionVenue {
  id: string;
  fullName: string;
  address: Address;
  capacity: number;
  indoor: boolean;
}

export interface Address {
  city: string;
  state: string;
}

export interface EventLink {
  language: Language;
  rel: FluffyRel[];
  href: string;
  text: ShortTextEnum;
  shortText: ShortTextEnum;
  isExternal: boolean;
  isPremium: boolean;
}

export enum Language {
  EnUS = 'en-US',
}

export enum FluffyRel {
  Desktop = 'desktop',
  Event = 'event',
  Summary = 'summary',
}

export enum ShortTextEnum {
  Gamecast = 'Gamecast',
}

export interface EventSeason {
  type: number;
  year: number;
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
  season: LeagueSeason;
  calendarType: string;
  calendarIsWhitelist: boolean;
  calendarStartDate: string;
  calendarEndDate: string;
  calendar: Calendar[];
}

export interface Calendar {
  label: string;
  value: string;
  startDate: string;
  endDate: string;
  entries: Entry[];
}

export interface Entry {
  label: string;
  alternateLabel: string;
  detail: string;
  value: string;
  startDate: string;
  endDate: string;
}

export interface LeagueSeason {
  year: number;
  startDate: string;
  endDate: string;
  type: SeasonType;
}

export interface SeasonType {
  id: string;
  type: number;
  name: string;
  abbreviation: string;
}

export interface Week {
  number: number;
}

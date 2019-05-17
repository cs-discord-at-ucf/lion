export interface IConfig {
  token: string;
  mode: Mode;
}

export interface IBot {
  run(): void;
}

export interface IPlugin {
  name: string;
  description: string;
  usage: string;
  validate(): boolean;
  hasPermission(): boolean;
  execute(): void;
}

export enum Mode {
  Development,
  Production,
}

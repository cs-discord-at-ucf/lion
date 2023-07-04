import { Client, GatewayIntentBits, Partials } from 'discord.js';

export class ClientService extends Client {
  private _startDate: Date;

  constructor() {
    super({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildVoiceStates,
      ],
      partials: [
        Partials.GuildMember,
        Partials.Channel,
        Partials.Message,
        Partials.Reaction,
        Partials.GuildScheduledEvent,
        Partials.ThreadMember,
        Partials.User,
      ],
    });
    this.login(process.env.DISCORD_TOKEN).catch((e) => console.log(e));
    this._startDate = new Date();
  }

  public getStartDate() {
    return this._startDate;
  }
}

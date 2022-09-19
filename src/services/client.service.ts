import { SlashCommandBuilder } from '@discordjs/builders';
import { Client, Intents } from 'discord.js';
import { Routes } from 'discord-api-types/v10';
import { REST } from '@discordjs/rest';

export class ClientService extends Client {
  private _startDate: Date;

  constructor() {
    super({
      intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MEMBERS,
        Intents.FLAGS.DIRECT_MESSAGES,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
        Intents.FLAGS.GUILD_VOICE_STATES,
      ],
    });
    this.login(process.env.DISCORD_TOKEN).catch((e) => console.log(e));
    this._startDate = new Date();
  }

  public getStartDate() {
    return this._startDate;
  }

  public registerSlashCommands(commands: SlashCommandBuilder[]) {
    if (this.token === null) {
      return;
    }

    const rest = new REST({ version: '10' }).setToken(this.token);

    for (const guild of Object.values(this.guilds)) {
      const guildId = guild.id;
      const clientId = guild.me.id;
      rest
        .put(Routes.applicationGuildCommands(clientId, guildId), {
          body: commands,
        })
        .then((e) => {
          console.log('registered slash commands! ' + e);
        })
        .catch((e) => {
          console.error('failed to register slash commands: ' + e);
        });
    }
  }
}

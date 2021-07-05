import { Client, Intents, TextChannel } from 'discord.js';
import { IMessage } from '../common/types';
import { CASES } from './bootstrap/tester.loader';
import { IPluginTester } from './common/pluginTester';
import ms from 'ms';

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });
client.login(process.env.TESTER_TOKEN);

client.on('ready', async () => {
  console.log('Tester online.');
  const guild = client.guilds.cache.first();

  if (!guild) {
    console.error('No guild found');
    return;
  }

  if (!CASES.length) {
    client.destroy();
    return;
  }

  const promises = CASES.map(async (testCase: IPluginTester) => {
    console.log(`Running test case in ${testCase.channelName}`);

    const targetChannel = guild.channels.cache
      .filter(
        (chan) => chan.isText() && chan.name.toLowerCase() === testCase.channelName.toLowerCase()
      )
      .first() as TextChannel;

    if (!targetChannel) {
      console.error(`Channel ${testCase.channelName} not found`);
      return;
    }

    await targetChannel.send(`${testCase.args}`);

    const filter = (m: IMessage) => m.author.bot;
    const response = (
      await targetChannel
        .awaitMessages({
          filter,
          max: 1,
          time: ms('10s'),
          errors: ['time'],
        })
        .catch((e) => console.error(e))
    )?.first();

    if (!testCase.onResponse) {
      return;
    }

    if (!response) {
      console.error(`Expected a response but did not receive one in ${testCase.channelName}`);
      return;
    }

    testCase.onResponse(response);
  });

  await Promise.all(promises);
  client.destroy();
});

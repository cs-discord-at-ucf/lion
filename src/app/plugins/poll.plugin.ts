import { Plugin } from '../../common/plugin';
import { IContainer, IMessage, ChannelType } from '../../common/types';
import { MessageEmbed } from 'discord.js';

export class PollPlugin extends Plugin {
  public name: string = 'Poll';
  public description: string = 'creates a poll';
  public usage: string = 'poll <question> \\n <answer1> \\n <answer2>...';
  public pluginAlias = [];
  public permission: ChannelType = ChannelType.Public;

  private _NUM_TO_EMOJI: string[] = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣'];
  private _THUMBNAIL_URL =
    'https://lh3.googleusercontent.com/proxy/a7m7g6DdgSlyKKP_BtFMnq0BCahQG1j2F-fKIOYihwJNHrGIwQ' +
    'STRYpdPXEkWBFIRiMAeNPMkcgwrbMSE75SILjaHHfdcavPazVrBT1-ldBOrQsJytpK7nhhk1QrXw';

  constructor(public container: IContainer) {
    super();
  }

  public validate(message: IMessage, args: string[]) {
    return args.length > 0 && args.join(' ').includes('\n'); //Make sure there is atleast one answer
  }

  public async execute(message: IMessage, args: string[]) {
    const [question, ...answers] = args.join(' ').split('\n');
    if (answers.length > 9) {
      await message.reply('Sorry, I only support up to **9** answers.');
      return;
    }

    const embed = new MessageEmbed();
    embed.setTitle(question);
    embed.setColor('#fcb103');
    embed.setThumbnail(this._THUMBNAIL_URL);
    embed.setDescription(answers.map((a: string, i: number) => `${this._NUM_TO_EMOJI[i]} ${a}\n`));

    await message.channel.send(embed).then(async (sentMsg) => {
      const promises = answers.map((a, i) => sentMsg.react(this._NUM_TO_EMOJI[i]));
      await Promise.all(promises);
    });
  }
}

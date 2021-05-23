import * as Canvas from 'canvas';
import { MessageAttachment } from 'discord.js';
import { Plugin } from '../../common/plugin';
import { IContainer, IMessage, ChannelType } from '../../common/types';

export class ColorPickerPlugin extends Plugin {
  public name: string = 'Color Picker';
  public description: string = 'Sends an image of the desired color';
  public usage: string = 'colorpicker #<hex color>';
  public pluginAlias = ['cp'];
  public permission: ChannelType = ChannelType.Public;
  public commandPattern: RegExp = /#[0-9a-f]{6}/;

  constructor(public container: IContainer) {
    super();
  }

  public async execute(message: IMessage, args: string[]) {
    const [color] = args;

    const canvas = Canvas.createCanvas(300, 150);
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const attachment = new MessageAttachment(canvas.toBuffer(), 'colorPickerImage.png');
    await message.channel.send(attachment);
  }
}

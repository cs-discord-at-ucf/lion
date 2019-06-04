import { IMessage, IContainer } from '../../common/types';
import Constants from '../../common/constants';

export class CommandHandler {
    constructor(public container: IContainer) {}

    public async execute(message: IMessage): Promise<void> {
        const command = this.build(message.content);
        const plugins = this.container.pluginService.plugins;
        if (!command) {
            return;
        }

        if (!!plugins[command.name]) {
            const plugin = plugins[command.name];
            
            if (!plugin.hasPermission(message) || !plugin.validate(message)) {
                // TODO (joey-colon): Let the user know that something went wrong through a DM. 
                return;
            }
            
            plugin.execute(command.args);
        }
    }

    build(content: string) {
        if (content.charAt(0) !== Constants.Prefix) {
            return undefined;
        }
        
        const messageArr = content.slice(1).split(' ');
        const name = messageArr[0];
        const args = messageArr.slice(1);
        return { name, args };
    }
}
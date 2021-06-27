import EightBallPlugin from '../app/plugins/8ball.plugin';
import { getContainerMock, getMessageMock } from '../__mocks__';

describe('8Ball Plugin Tests', () => {
  test('Replies with message embed', () => {
    const plugin = new EightBallPlugin(getContainerMock());
    const message = getMessageMock();
    
    // Send message through plugin.
    plugin.execute(message);
    
    // Expect to send a message.
    expect(message.reply).toBeCalled();
  });
});

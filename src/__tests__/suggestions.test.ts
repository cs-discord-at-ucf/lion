import SuggestionPlugin from '../app/plugins/suggestions.plugin';
import { getContainerMock, getMessageMock } from '../__mocks__';

describe('Suggestion Plugin Tests', () => {
  test('Replies with message embed', () => {
    const plugin = new SuggestionPlugin(getContainerMock());
    const message = getMessageMock();
    message.author.id = "ID"
    
    // Send message through plugin.
    plugin.execute(message, ['test', 'for', 'suggestions', 'plugin']);
    
    // Expect to send a message.
    expect(message.reply).toBeCalled();
  });
});

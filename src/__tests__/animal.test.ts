import { DogPlugin } from '../app/plugins/dog.plugin';
import { getContainerMock, getMessageMock } from '../__mocks__';

describe('Animal Plugin Tests', () => {
  test('Fetches Dog Images', async () => {
    const plugin = new DogPlugin(getContainerMock());
    const message = getMessageMock();
    const spy = jest.spyOn(message, 'reply');
    
    await plugin.execute(message);

    // Fetch what the send method was called with.
    const arg = spy.mock.calls[0][1];

    expect(arg).toHaveProperty('files');
  });
});
import AltPlugin from '../app/plugins/alt.plugin';
import { getContainerMock, getMessageMock } from '../__mocks__';

describe('Alt Tracker List Tests', () => {
  // Truthy List
  it.each([['list\nTanndlin#4450', 'list\nTanndlin Test#6270', 'list\n465026352777789441']])(
    'List Tests: Should be true when arg is: %s',
    (input) => {
      expect(
        new AltPlugin(getContainerMock()).validate(getMessageMock(), input.split(' '))
      ).toBeTruthy();
    }
  );

  // Falsy List
  it.each([['list 465026352777789441', 'list\n465026352777789441\n465026352777789441']])(
    'List Tests: Should be false when arg is: %s',
    (input) => {
      expect(
        new AltPlugin(getContainerMock()).validate(getMessageMock(), input.split(' '))
      ).toBeFalsy();
    }
  );

  // Truthy Add
  it.each([
    [
      'add\nTanndlin#4450\nTanndlin Test#6270',
      'add\n465026352777789441\nTanndlin Test#6270',
      'add\nTanndlin#4450\n465026352777789441',
      'add\n465026352777789441\n465026352777789441',
    ],
  ])('Add Tests: Should be true when arg is: %s', (input) => {
    expect(
      new AltPlugin(getContainerMock()).validate(getMessageMock(), input.split(' '))
    ).toBeTruthy();
  });

  // Falsy Add
  it.each([
    [
      'add 465026352777789441 465026352777789441',
      'add\n465026352777789441 465026352777789441',
      'add\nTanndlin#4450 465026352777789441',
      'add 465026352777789441\n465026352777789441',
      'add\n465026352777789441\n465026352777789441\nn465026352777789441',
      'add\n465026352777789441',
      'add\n465026352777789441\n',
    ],
  ])('Add Tests: Should be false when arg is: %s', (input) => {
    expect(
      new AltPlugin(getContainerMock()).validate(getMessageMock(), input.split(' '))
    ).toBeFalsy();
  });
});

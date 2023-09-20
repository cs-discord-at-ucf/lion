export const getRandom = <T>(array: T[]): T => array[Math.floor(Math.random() * array.length)];

export const getConfirmCancelRow = () => {
  return {
    type: 1,
    components: [
      {
        type: 2,
        style: 3,
        custom_id: 'confirm',
        label: 'Confirm',
      },
      {
        type: 2,
        style: 4,
        custom_id: 'cancel',
        label: 'Cancel',
      },
    ],
  };
};

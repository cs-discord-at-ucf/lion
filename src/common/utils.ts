export const getRandom = <T>(array: T[]): T => array[Math.floor(Math.random() * array.length)];

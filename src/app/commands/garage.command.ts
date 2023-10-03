import { load } from 'cheerio';
import { Command } from '../../common/slash';
import { IContainer, IHttpResponse } from '../../common/types';

interface IGarage {
  name: string;
  available: number;
  saturation: number;
  capacity: number;
  percentFull: number;
  percentAvail: number;
}

const API_URL: string = 'http://secure.parking.ucf.edu/GarageCount/iframe.aspx';
const TITLE_MSG: string = '**Current UCF Garage Saturation**';

const GARAGE_UPD_THRESH: number = 1000 * 60 * 2; // in ms, two minutes.
let LAST_UPD_TIME: number = -GARAGE_UPD_THRESH - 1;
let GARAGES: IGarage[] = [];

const command = {
  commandName: 'garage',
  name: 'Garage Plugin',
  description: 'Gets garage status.',
  async execute({ interaction, container }) {
    const garages: IGarage[] = await getGarages(container);

    const response = garages
      .map(
        (elem: IGarage) =>
          `${elem.name.replace('Garage ', '')}:`.padStart(6, ' ') +
          `${elem.saturation} / ${elem.capacity}`.padStart(12, ' ') +
          `(${`${Math.round(elem.percentFull)}`.padStart(2, ' ')}% full)`.padStart(12, ' ')
      )
      .join('\n');

    await interaction.reply(`\n${TITLE_MSG}\`\`\`${response}\`\`\``);
  },
} satisfies Command;

const processResponse = (text: string): IGarage[] => {
  const $ = load(text);
  const garages = $('.dxgv');

  let last = '';
  const processed_garages: IGarage[] = [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  garages.map((idx: number, elem: any) => {
    if (idx % 3 === 0) {
      last = $(elem).text().replace('\n', '');
    } else if (idx % 3 === 1) {
      const token = $(elem).text().trim().split('/');
      const garage: IGarage = {
        name: last,
        available: +token[0],
        saturation: 0,
        capacity: +token[1],
        percentFull: 0.0,
        percentAvail: 0.0,
      };

      garage.percentAvail = (100.0 * garage.available) / garage.capacity;
      garage.saturation = Math.max(0, garage.capacity - garage.available);

      garage.percentFull = (100.0 * garage.saturation) / garage.capacity;
      processed_garages.push(garage);
    }
  });

  return processed_garages;
};

const getGarages = async (container: IContainer): Promise<IGarage[]> => {
  const time_since_last: number = Date.now() - LAST_UPD_TIME;
  if (time_since_last < GARAGE_UPD_THRESH) {
    return GARAGES;
  }

  LAST_UPD_TIME = Date.now();

  await container.httpService
    .get(`${API_URL}`)
    .then((response: IHttpResponse) => {
      return (GARAGES = processResponse(response.data));
    })
    .catch((err) => {
      container.loggerService.warn(err);
      return (GARAGES = []);
    });

  return GARAGES;
};

export default command;

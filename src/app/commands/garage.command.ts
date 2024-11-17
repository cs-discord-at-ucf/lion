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

type IApiResponse = {
  // omitting properties we aren't using
  location: {
    counts?: { available: number, occupied: number, total: number },
    name: string
  }
}[];

const API_URL: string = 'https://secure.parking.ucf.edu/GarageCounter/GetOccupancy';
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

const processResponse = (data: IApiResponse): IGarage[] => {
  const garage_names = ['Garage A', 'Garage B', 'Garage C', 'Garage D', 'Garage H', 'Garage I'];
  const processed_garages: IGarage[] = [];

  data.forEach((elem) => {
    const { name, counts } = elem.location;
    if (!counts || !garage_names.includes(name)) {
      return;
    }

    const { available, occupied, total } = counts;
    let percentFull;
    if (total === 0 || occupied >= total) {
      percentFull = 100;
    } else {
      percentFull = (100.0 * occupied) / total;
    }

    const garage: IGarage = {
      name,
      available,
      saturation: occupied,
      capacity: total,
      percentFull,
      percentAvail: 100 - percentFull,
    };

    processed_garages.push(garage);
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

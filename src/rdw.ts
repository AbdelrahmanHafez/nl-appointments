import got from 'got';
import moment from 'moment';
import notifier from 'node-notifier';


const EARLIEST_ACCEPTABLE_DATE = '2022-04-20';
const LATEST_ACCEPTABLE_DATE = '2022-05-01';

tryToGetAppointment().catch(console.error);

async function tryToGetAppointment() {
  const { appointmentDate } = await getEarliestAvailableDate();
  if (moment(appointmentDate).isBetween(EARLIEST_ACCEPTABLE_DATE, LATEST_ACCEPTABLE_DATE)) {
    notifier.notify(`Found the earliest appointment at: ${appointmentDate}`);
    log(appointmentDate);
  } else {
    log(`Current best date is ${appointmentDate}`);
    await retryAppointment();
  }
}

async function retryAppointment() {
  await sleep(10_000);
  await tryToGetAppointment();
}


async function getEarliestAvailableDate() {
  const res = await got({
    method: 'post',
    url: 'https://keuringsafspraakmaken.rdw.nl/api/v1/Timeslot',
    json: {
      voertuigen: [
        {
          isNlGekentekend: false,
          voertuigcategorie: 'Bromfiets (fase 2)',
          displayName: 'Bromfiets/Snorfiets',
          keuringsproducten: [
            {
              productId: 'PAS2-INV-BR',
              mrsProductCode: '1400',
              naam: 'Invoer voertuig vanuit EU/EVA-land met datum 1e toelating vanaf 1-1-1978 (NIET VOOR ERKENNINGHOUDERS, TENZIJ OP VERZOEK RDW)',
              isHoofdproduct: true,
              tarief: 102.55,
              normtijd: 25
            }
          ],
          kenteken: '',
          voertuigidentificatienummer: 'R3MM10000M1008581',
          merk: 'CityCoco',
          validatieHashAfspraak: '43d914bc86c0ba3e7cda4f6be34981e89391a0a41621c13adc4fec28f1f80753',
          ekbEnabled: false
        }
      ],
      afspraak: {
        datumVanaf: '2022-04-20',
        werkdag: 5
      },
      keuringsStation: {
        x: 161,
        y: 192,
        locationId: '2210',
        postcode: '1046 AK',
        naam: 'Amsterdam',
        adres: 'Tijnmuiden 1',
        woonplaats: 'Amsterdam',
        beschikbaar: true
      }
    },
    responseType: 'json'
  });

  const availableAppointments = res.body as IRWDResponse;

  return { appointmentDate: availableAppointments.tijdsloten[0].datum };
}

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

function log(message: string) {
  console.log(`[${formattedCurrentTime()}]: ${message}`);
}
function formattedCurrentTime() {
  return moment().format('YYYY-MM-DD hh:mm:ss A');
}


interface IRWDResponse{
  tijdsloten: Tijdsloten[]
}

interface Tijdsloten {
  beginDatumTijd: string;
  eindDatumTijd: string;
  baan: string;
  validatieHash: string;
  datum: string;
  begintijd: string;
  eindtijd: string;
}
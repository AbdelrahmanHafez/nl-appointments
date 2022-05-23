import got from 'got';
import moment from 'moment';
import notifier from 'node-notifier';


const EARLIEST_ACCEPTABLE_DATE = '2022-06-01';
const LATEST_ACCEPTABLE_DATE = '2022-06-15';

tryToGetAppointment().catch(console.error);

async function tryToGetAppointment() {
  const { appointmentDate } = await getEarliestAvailableDate();

  if (moment(appointmentDate).isBetween(EARLIEST_ACCEPTABLE_DATE, LATEST_ACCEPTABLE_DATE)) {

    notifier.notify(`Found the earliest appointment at: ${appointmentDate}`);
    log(appointmentDate);

    await retryAppointment();
  } else {
    log(`Current best date is ${appointmentDate}`);
    await retryAppointment();
  }
}

async function retryAppointment() {
  await sleep(5000);
  await tryToGetAppointment();
}


async function getEarliestAvailableDate() {
  const res = await got({
    method: 'get',
    url: 'https://oap.ind.nl/oap/api/desks/ZW/slots/?productKey=BIO&persons=1'
  });

  const availableAppointments: IAppointment[] = JSON.parse(res.body.split('\n')[1]).data;
  const [{ startTime, endTime, date: appointmentDate, key: appointmentKey }] = availableAppointments
    .filter(appointment => moment(appointment.date).isAfter(EARLIEST_ACCEPTABLE_DATE));

  return { appointmentKey, appointmentDate, startTime, endTime };
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

interface IAppointment {
  date: string;
  startTime: string;
  endTime: string;
  key: string;
}
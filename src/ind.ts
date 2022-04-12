import got from 'got';
import moment from 'moment';
import notifier from 'node-notifier';

const FIRST_NAME = 'John';
const LAST_NAME = 'Doe';
const PHONE_NUMBER = '+31111111';
const EMAIL = 'some-email@gmail.com';
const V_NUMBER = '29292929';
const EARLIEST_ACCEPTABLE_DATE = '2022-04-25';
const LATEST_ACCEPTABLE_DATE = '2022-05-01';

tryToGetAppointment().catch(console.error);

async function tryToGetAppointment() {
  const { appointmentDate, appointmentKey, startTime, endTime } = await getEarliestAvailableDate();

  if (moment(appointmentDate).isBetween(EARLIEST_ACCEPTABLE_DATE, LATEST_ACCEPTABLE_DATE)) {

    notifier.notify(`Found the earliest appointment at: ${appointmentDate}`);
    log(appointmentDate);

    const appointmentMakingResult = await makeAppointmentOnDate({
      appointmentKey,
      appointmentDate,
      startTime,
      endTime
    });

    if (appointmentMakingResult.statusCode < 400) {
      notifier.notify(`Appointment made at: ${appointmentDate}`);
      log(`Appointment made at: ${appointmentDate}`);
    } else {
      await retryAppointment();
    }
  } else {
    log(`Current best date is ${appointmentDate}`);
    await retryAppointment();
  }
}

async function retryAppointment() {
  await sleep(10_000);
  await tryToGetAppointment();
}

async function makeAppointmentOnDate({ appointmentKey, appointmentDate, startTime, endTime }: IMakeAppointmentOnDateParams) {
  const res = await got({
    method: 'POST',
    url: 'https://oap.ind.nl/oap/api/desks/AM/appointments/',
    json: {
      bookableSlot: {
        key: appointmentKey,
        date: appointmentDate,
        startTime,
        endTime,
        parts: 1,
        booked: false
      },
      appointment: {
        productKey: 'DOC',
        date: appointmentDate,
        startTime,
        endTime,
        email: EMAIL,
        phone: PHONE_NUMBER,
        language: 'en',
        customers: [{ vNumber: V_NUMBER, firstName: FIRST_NAME, lastName: LAST_NAME }]
      }
    },
    throwHttpErrors: false
  });

  return res;
}

async function getEarliestAvailableDate() {
  const res = await got({
    method: 'get',
    url: 'https://oap.ind.nl/oap/api/desks/AM/slots/?productKey=DOC&persons=1'
  });

  const availableAppointments: IAppointment[] = JSON.parse(res.body.split('\n')[1]).data;
  const [{ startTime, endTime, date: appointmentDate, key: appointmentKey }] = availableAppointments;

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
interface IMakeAppointmentOnDateParams{
  appointmentKey: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
}
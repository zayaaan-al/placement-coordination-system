const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
dayjs.extend(utc);

const evaluationTypes = {
  aptitude: { frequency: 'weekly', defaultMax: 25 },
  logical: { frequency: 'weekly', defaultMax: 25 },
  machine: { frequency: 'weekly', defaultMax: 25 },
  spring_meet: { frequency: 'monthly', defaultMax: 100 }
};

const evaluationTypeOptions = Object.keys(evaluationTypes);

const getWeekRange = (date) => {
  const day = dayjs(date).utc().startOf('day');
  const weekday = day.day();
  const start = day.subtract(weekday === 0 ? 6 : weekday - 1, 'day'); // Monday start
  const end = start.add(6, 'day').endOf('day');
  return {
    periodStart: start.toDate(),
    periodEnd: end.toDate(),
    periodLabel: `Week of ${start.format('MMM D, YYYY')}`
  };
};

const getMonthRange = (date) => {
  const day = dayjs(date).utc().startOf('month');
  return {
    periodStart: day.toDate(),
    periodEnd: day.endOf('month').endOf('day').toDate(),
    periodLabel: day.format('MMMM YYYY')
  };
};

const getPeriodMetadata = (type, recordedDate) => {
  const { frequency } = evaluationTypes[type];
  return frequency === 'monthly' ? getMonthRange(recordedDate) : getWeekRange(recordedDate);
};

const getTypeConfig = (type) => evaluationTypes[type];

module.exports = {
  evaluationTypeOptions,
  evaluationTypes,
  getPeriodMetadata,
  getTypeConfig
};

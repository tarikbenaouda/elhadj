/* eslint-disable import/no-extraneous-dependencies */
const cron = require('cron');
const ProgressBar = require('../models/progressBarModel');
const User = require('../models/userModel'); // Assuming you have a User model
const sendEmail = require('./email'); // Import the sendEmail function
const Winner = require('../models/winnersModel');
//const RegistrationHistory
// Schedule a task to run every day at midnight in Algeria
const job = new cron.CronJob(
  '27 15 * * *',
  async () => {
    let currentDate;
    if (process.env.NODE_ENV === 'development') {
      const getCurrentDate = () =>
        process.env.TEST_CURRENT_DATE
          ? new Date(process.env.TEST_CURRENT_DATE)
          : new Date();
      currentDate = getCurrentDate();
    } else {
      currentDate = new Date();
    }
    console.log('Running job at: ', currentDate);
    const currentDay = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      currentDate.getDate(),
    );

    // Find all phases that have ended and update their status;
    const endedPhases = await ProgressBar.find({
      endDate: { $lt: currentDay },
      status: 'current',
    });

    endedPhases.forEach(async (phase) => {
      phase.status = 'completed';
      await phase.save();
      const user = {
        firstName: 'test',
        lastName: 'test',
        email: 'tayebkahia009@gmail.com',
      };
      if (user && user.email) {
        if (user && user.email) {
          try {
            const emailResult = await sendEmail({
              email: user.email,
              subject: 'Phase completed',
              text: `The phase ${phase.phaseName} has been completed.`,
            });
          } catch (error) {
            console.error('Failed to send email: ', error);
          }
        }
      }
    });
    /// handle registratooions case
    ////
    // handle handle
    let winners = await Winner.getWinnersByCommuneOrWilaya();
    if (phase.phaseName === 'Visite Médicale') {
    }
    console.log('winners', winners);
    const currentPhase = await ProgressBar.findOne({
      endDate: { $gte: currentDay },
      status: 'current',
    });
    if (!currentPhase) {
      console.log('No current phase found');
      const upcomingPhase = await ProgressBar.findOne({
        startDate: { $gte: currentDay },
        status: 'upcoming',
      }).sort('startDate');
      if (upcomingPhase) {
        await ProgressBar.updateOne(
          { _id: upcomingPhase._id },
          { status: 'current' },
        );
        const user = {
          firstName: 'test',
          lastName: 'test',
          email: 't.kahia@esi-sba.dz',
        };
        if (user && user.email) {
          await sendEmail({
            email: user.email,
            subject: 'Phase started',
            text: `The phase ${upcomingPhase.phaseName} has started.`,
          });
        }
      }
    }
  },
  null,
  true,
  'Europe/London',
);

job.start();

module.exports = { job };

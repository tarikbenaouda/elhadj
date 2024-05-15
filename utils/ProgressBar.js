/* eslint-disable import/no-extraneous-dependencies */
const cron = require('cron');
const ProgressBar = require('../models/progressBarModel');
const User = require('../models/userModel'); // Assuming you have a User model
const sendEmail = require('./email'); // Import the sendEmail function

// Schedule a task to run every day at midnight in Algeria
const job = new cron.CronJob(
  '54 22 * * *',
  async () => {
    const currentDate = new Date();
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
      // Find the user associated with this phase and send them an email
      //const user = await User.findById(phase.userId);
      const user = {
        firstName: 'test',
        lastName: 'test',
        email: 't.kahia@esi-sba.dz',
      }; // Assuming there's a userId field in phase
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

    // Find the first upcoming phase and update its status
    const upcomingPhase = await ProgressBar.findOne({
      startDate: { $gte: currentDay },
      status: 'upcoming',
    }).sort('startDate');
    if (upcomingPhase) {
      await ProgressBar.updateOne(
        { _id: upcomingPhase._id },
        { status: 'current' },
      );

      // Find the user associated with this phase and send them an email
      //const user = await User.findById(upcomingPhase.userId); // Assuming there's a userId field in phase
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
  },
  null,
  true,
  'Europe/London',
);

job.start();

module.exports = { job };

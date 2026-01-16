const express = require('express');
const router = express.Router();

console.log('✅ events routes file loaded');

const Event = require('../models/event'); // Import Event model
const Registration = require('../models/registration'); // Import Registration model
const DeletedEvent = require('../models/deletedEvent');

router.post('/create-event', async (req, res) => {
  try {
    console.log('Incoming event:', req.body);

    const event = new Event({
      title: req.body.title,
      description: req.body.description,
      date: req.body.date,
      location: req.body.location,
      branch: req.body.branch,
      createdBy: req.body.createdBy
    });

    await event.save();

    res.json({ message: 'Event created successfully' });
  } catch (err) {
    console.error('Error saving event:', err);
    res.status(500).json({ message: 'Failed to create event' });
  }
});

router.post('/register-event', async (req, res) => {
  try {
    const { eventId, studentName, roll, branch, year, section } = req.body;

    // 🔒 CHECK: already registered?
    const alreadyRegistered = await Registration.findOne({
      eventId,
      roll
    });

    if (alreadyRegistered) {
      return res.json({
        message: 'You have already registered for this event'
      });
    }

    const registration = new Registration({
      eventId,
      studentName,
      roll,
      branch,
      year,
      section
    });

    await registration.save();

    res.json({ message: 'Registered successfully' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Registration failed' });
  }
});


router.get('/events', async (req, res) => {
  const events = await Event.find();
  res.json(events);
});

router.get('/events/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    res.json(event);
  } catch (err) {
    res.status(400).json({ message: 'Invalid event ID' });
  }
});

router.get('/my-registrations/:roll', async (req, res) => {
  try {
    console.log('Fetching registrations for roll:', req.params.roll);

    const registrations = await Registration.find({
      roll: req.params.roll
    }).populate('eventId');

    console.log('Found registrations:', registrations);

    res.json(registrations);
  } catch (err) {
    console.error('Registration fetch error:', err);
    res.status(500).json({ message: 'Failed to fetch registrations' });
  }
});

router.get('/event-registrations/:eventId', async (req, res) => {
  try {
    const regs = await Registration.find({
      eventId: req.params.eventId
    });

    res.json(regs);
  } catch (err) {
    res.status(500).json({ message: 'Failed to load registrations' });
  }
});

router.delete('/delete-event/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Save to deleted_events collection
    const deleted = new DeletedEvent({
      originalEventId: event._id,
      title: event.title,
      description: event.description,
      date: event.date,
      location: event.location,
      branch: event.branch,
      createdBy: event.createdBy
    });

    await deleted.save();

    // Remove registrations related to this event
    await Registration.deleteMany({ eventId: event._id });

    // Delete from active events
    await Event.findByIdAndDelete(event._id);

    res.json({ message: 'Event deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to delete event' });
  }
});

router.get('/deleted-events', async (req, res) => {
  try {
    const deletedEvents = await DeletedEvent.find().sort({ deletedAt: -1 });
    res.json(deletedEvents);
  } catch (err) {
    res.status(500).json({ message: 'Failed to load deleted events' });
  }
});

router.post('/archive-expired-events', async (req, res) => {
  try {
    const events = await Event.find();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let archivedCount = 0;

    for (let event of events) {
      const eventDate = new Date(event.date);
      eventDate.setHours(0, 0, 0, 0);

      const diffDays = (today - eventDate) / (1000 * 60 * 60 * 24);

      if (diffDays > 7) {
        // Move to deleted events
        const deleted = new DeletedEvent({
          originalEventId: event._id,
          title: event.title,
          description: event.description,
          date: event.date,
          location: event.location,
          branch: event.branch,
          createdBy: event.createdBy
        });

        await deleted.save();
        await Registration.deleteMany({ eventId: event._id });
        await Event.findByIdAndDelete(event._id);

        archivedCount++;
      }
    }

    res.json({ message: `Archived ${archivedCount} expired events` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to archive expired events' });
  }
});

module.exports = router;

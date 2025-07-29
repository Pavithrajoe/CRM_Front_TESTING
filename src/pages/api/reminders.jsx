

export default function handler(req, res) {
  if (req.method === 'GET') {
    // Respond with the dummyReminders data
    res.status(200).json(Reminders);
  } else if (req.method === 'POST') {
    const newEvent = {
      id: Date.now(),
      ...req.body,
    };
    // If needed, you can push new events to the dummyEvents array, but it's not relevant for reminders
    res.status(201).json(newEvent);
  } else {
    res.status(405).json({ message: 'Method Not Allowed' });
  }
}

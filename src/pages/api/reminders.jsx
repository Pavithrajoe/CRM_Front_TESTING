export const Reminders = [
  {
    title: 'Project Kickoff',
    user: 'Shivakumar',
    description: 'Initial meeting to align the team on project goals and deadlines.',
    time: '12:30 PM',
  },
  {
    title: 'Design Review',
    user: 'Shivakumar',
    description: 'Review design mockups with the UI/UX team and finalize feedback.',
    time: '3:00 PM',
  },
  {
    title: 'Client Follow-up',
    user: 'Shivakumar',
    description: 'Discuss client feedback and confirm next steps for delivery.',
    time: '5:15 PM',
  }
];

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

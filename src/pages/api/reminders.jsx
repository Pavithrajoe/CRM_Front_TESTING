export default function handler(req, res) {
  if (req.method === 'GET') {
    res.status(200).json(Reminders);
  } else if (req.method === 'POST') {
    const newEvent = {
      id: Date.now(),
      ...req.body,
    };
    res.status(201).json(newEvent);
  } else {
    res.status(405).json({ message: 'Method Not Allowed' });
  }
}

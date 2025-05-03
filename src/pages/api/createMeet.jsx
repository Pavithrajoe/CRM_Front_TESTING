import { getCalendarClient } from '@/utils/googleClient';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { title, description, startTime, endTime } = req.body;

  try {
    const calendar = getCalendarClient({
      access_token: process.env.GOOGLE_ACCESS_TOKEN,
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN
    });

    const event = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: {
        summary: title,
        description,
        start: { dateTime: startTime },
        end: { dateTime: endTime },
        conferenceData: {
          createRequest: {
            requestId: Math.random().toString(36).substring(2),
            conferenceSolutionKey: { type: 'hangoutsMeet' }
          }
        }
      },
      conferenceDataVersion: 1
    });

    res.status(200).json({ meetLink: event.data.hangoutLink });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

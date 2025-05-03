import { google } from 'googleapis';

const SCOPES = ['https://www.googleapis.com/auth/calendar'];

export const getOAuth2Client = () => {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
};

export const getCalendarClient = (tokens) => {
  const auth = getOAuth2Client();
  auth.setCredentials(tokens);
  return google.calendar({ version: 'v3', auth });
};

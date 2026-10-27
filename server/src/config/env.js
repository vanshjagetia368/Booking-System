import 'dotenv/config';

const port = Number(process.env.PORT || 5000);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT must be an integer between 1 and 65535');
}

const mongodbUri = process.env.MONGODB_URI;
if (!mongodbUri) {
  throw new Error('MONGODB_URI must be set in the server environment');
}

export const env = {
  port,
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  mongodbUri,
};

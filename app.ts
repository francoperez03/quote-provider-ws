import 'reflect-metadata';
import WebSocket, { Server } from 'ws';
import { Container } from 'typedi';
import { QuoteService } from './services/quotes.service';
import setupProviders from './providers';

const SUBSCRIBE_ACTION = 'subscribe';
const UNSUBSCRIBE_ACTION = 'unsubscribe';
const PORT = 443

async function startServer() {
  const wsServer = new Server({ port: PORT });
  await setupProviders();

  wsServer.on('connection', (wsConnection: WebSocket) => {
    console.log('[app.ts] New client connected');

    wsConnection.on('message', async (message: string) => {
      try {
        const { action, exchange, base, quote } = JSON.parse(message);
        const quoteService: QuoteService = Container.get(QuoteService);

        switch (action) {
          case SUBSCRIBE_ACTION:
            const subscribeResult = await quoteService.subscribe(exchange, base, quote, wsConnection);
            if (subscribeResult === 'Subscription failed') {
              wsConnection.send(JSON.stringify({ error: 'Subscription failed' }));
            } else {
              console.log(`[app.ts] Client subscribed to ${subscribeResult}`);
              wsConnection.send(JSON.stringify({ message: `Client subscribed to ${exchange}-${base}-${quote}` }));

            }
            break;

          case UNSUBSCRIBE_ACTION:
            const result = await quoteService.unsubscribe(exchange, base, quote, wsConnection);
            if(result){
              console.log(`[app.ts] Client unsubscribed from ${exchange}-${base}-${quote}`);
              wsConnection.send(JSON.stringify({ message: `Client unsubscribed to ${exchange}-${base}-${quote}` }));
            } else {
              console.log(`[app.ts] This client has not previously subscribed to ${exchange}-${base}-${quote}`);
              wsConnection.send(JSON.stringify({ message: `Client not previously subscribed to ${exchange}-${base}-${quote}` }));
            }
            break;

          default:
            console.warn(`[app.ts] Unknown action received: ${action}`);
            wsConnection.send(JSON.stringify({ message: 'Unknown action' }));
            break;
        }
      } catch (error) {
        console.error(`[app.ts] Error processing message: ${(error as Error).message}`);
        wsConnection.send(JSON.stringify({ message: 'Invalid message format or internal error' }));
      }
    });

    wsConnection.on('close', () => {
      console.log("[app.ts] Client disconnected!");
    });
  });

  console.log(`[app.ts] WebSocket server started on ws://localhost:${PORT}`);
}

startServer();

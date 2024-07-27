import 'reflect-metadata';
import WebSocket, { Server } from 'ws';
import { Container } from 'typedi';
import { QuoteService } from './services/quote.service';
import setupProviders from './providers';

const SUBSCRIBE_ACTION = 'subscribe';
const UNSUBSCRIBE_ACTION = 'unsubscribe';

async function startServer() {
  const wsServer = new Server({ port: 81 });
  await setupProviders();

  wsServer.on('connection', (wsConnection: WebSocket) => {
    console.log('New client connected');

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
            }
            break;

          case UNSUBSCRIBE_ACTION:
            await quoteService.unsubscribe(exchange, base, quote, wsConnection);
            console.log(`[app.ts] Client unsubscribed from ${exchange}-${base}-${quote}`);
            break;

          default:
            console.warn(`[app.ts] Unknown action received: ${action}`);
            wsConnection.send(JSON.stringify({ error: 'Unknown action' }));
            break;
        }
      } catch (error) {
        console.error(`[app.ts] Error processing message: ${(error as Error).message}`);
        wsConnection.send(JSON.stringify({ error: 'Invalid message format or internal error' }));
      }
    });

    wsConnection.on('close', () => {
      console.log("Client disconnected!");
    });
  });

  console.log('WebSocket server started on ws://localhost:81');
}

startServer();

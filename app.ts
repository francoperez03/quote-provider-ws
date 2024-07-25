import 'reflect-metadata';
import WebSocket from 'ws';
import { Container } from "typedi";
import { QuoteService } from "./services/quotes.service";
import setupProviders from "./providers";

const SUBSCRIBE_ACTION = 'subscribe'

async function startServer() {
  const wsServer = new WebSocket.Server({ port: 81 });
  await setupProviders();

  wsServer.on('connection', (wsConnection: WebSocket) => {
    console.log('New client connected');

    wsConnection.on('message', async (message: string) => {
      const { action, exchange, base, quote } = JSON.parse(message);

      if (action === SUBSCRIBE_ACTION) {
        const quoteService: QuoteService = Container.get(QuoteService);
        const result = await quoteService.subscribe(exchange, base, quote, wsConnection);
        
        if (result) {
          console.log(`[app.ts] Client subscribed to ${result}`);
        } else {
          wsConnection.send(JSON.stringify({ error: 'Subscription failed' }));
        }
      }
    });

    wsConnection.on('close', () => {
      console.log("Client disconnected!");
    });
  });

  console.log('WebSocket server started on ws://localhost:81');
}

startServer();

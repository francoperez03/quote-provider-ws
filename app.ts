import 'reflect-metadata';
import WebSocket from 'ws';
import { Container } from "typedi";
import { QuoteService } from "./services/quotes.service";
import setupProviders from "./providers";

const SUBSCRIBE_ACTION = 'subscribe'
const UNSUBSCRIBE_ACTION = 'unsubscribe'

async function startServer() {
  const wsServer = new WebSocket.Server({ port: 81 });
  await setupProviders();

  wsServer.on('connection', (wsConnection: WebSocket) => {
    console.log('New client connected');

    wsConnection.on('message', async (message: string) => {
      const { action, exchange, base, quote } = JSON.parse(message);
      const quoteService: QuoteService = Container.get(QuoteService);

      if (action === SUBSCRIBE_ACTION) {
        const result = await quoteService.subscribe(exchange, base, quote, wsConnection);
        console.log(`[app.ts] Client subscribed to ${result}`);
        wsConnection.send(JSON.stringify({ error: 'Subscription failed' }));
      }else if(action === UNSUBSCRIBE_ACTION){
        const result = await quoteService.unsubscribe(exchange, base, quote, wsConnection);
      }
    });

    wsConnection.on('close', () => {
      console.log("Client disconnected!");
    });
  });

  console.log('WebSocket server started on ws://localhost:81');
}

startServer();

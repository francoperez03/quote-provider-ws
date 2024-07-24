import 'reflect-metadata';
import WebSocket from 'ws';
import { Container } from "typedi";
import { QuoteService } from "./services/quotes.service";
import setupProviders from "./providers";

async function startServer() {
  const wsServer = new WebSocket.Server({ port: 81 });
  await setupProviders();

  wsServer.on('connection', (ws: WebSocket) => {
    console.log('New client connected');

    ws.on('message', async (message: string) => {
      const { action, exchange, base, quote } = JSON.parse(message);
      console.log('message received: ', message.toString())
      console.log({ action, exchange, base, quote })
      if (action === 'subscribe') {
        const quoteService: QuoteService = await Container.get(QuoteService);
        const result = await quoteService.subscribe(exchange, base, quote);
        
        ws.on('close', () => {
          console.log("Disconnected!")
        });
        return result
      }
    });
  });

  console.log('WebSocket server started on ws://localhost:81');
}

startServer();
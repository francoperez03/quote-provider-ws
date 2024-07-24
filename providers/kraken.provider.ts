import { IQuoteProvider } from '../interfaces/quotes.interface';
import WebSocket from 'ws';

export class KrakenProvider implements IQuoteProvider {

  subscribe(base: string, quote: string,): any {
    console.log('Subscribed to Kraken', base, quote)
    const krakenWs = new WebSocket('wss://ws.kraken.com');

    krakenWs.on('open', () => {
      const symbol = `${base}/${quote}`;
      console.log('open')
      krakenWs.send(JSON.stringify({
        event: 'subscribe',
        pair: [symbol],
        subscription: { name: 'book', depth: 10 }
      }));
    });
  
    krakenWs.on('message', (data: string) => {
      const message = JSON.parse(data.toString());
      if (Array.isArray(message) && message[1] && message[1].as) {
        const update = {
          exchange: 'KRAKEN',
          pair: `${base}/${quote}`,
          bids: message[1].bs,
          asks: message[1].as,
          timestamp: new Date().toISOString()
        };
        console.log(update)
      }
    });
  
    krakenWs.on('error', (error) => {
      console.log(`error`, error);
    });

    krakenWs.on('close', () => {
      console.log(`Disconnected from Kraken ${base}/${quote}`);
    });
  }
}
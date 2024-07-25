import { IQuoteProvider } from '../interfaces/quotes.interface';
import WebSocket from 'ws';

const SUBSCRIBE_FUNCTION = 'subscribe';
const KRAKEN_NAME = 'KRAKEN';
const INTERVAL_MS = 5000;
const MARKET_DEPTH = 10;
export class KrakenProvider implements IQuoteProvider {

  private krakenWs: WebSocket | null = null;
  private intervalId: NodeJS.Timeout | null = null;
  private cleanup() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.krakenWs) {
      this.krakenWs.close();
      this.krakenWs = null;
    }
  }

  subscribe(base: string, quote: string, callback: (update: any) => void): any {
    console.log('Subscribed to Kraken', base, quote);
    this.krakenWs = new WebSocket('wss://ws.kraken.com');

    this.krakenWs.on('open', () => {
      const symbol = `${base}/${quote}`;
      this.intervalId = setInterval(() => {
        if (this.krakenWs!.readyState === WebSocket.OPEN) {
          this.krakenWs!.send(JSON.stringify({
            event: SUBSCRIBE_FUNCTION,
            pair: [symbol],
            subscription: { name: 'book', depth: MARKET_DEPTH }
          }));
        }
      }, INTERVAL_MS);
    });

    this.krakenWs.on('message', (data: string) => {
      const message = JSON.parse(data.toString());
      if (Array.isArray(message) && message[1] && message[1].as) {
        const update = {
          exchange: KRAKEN_NAME,
          pair: `${base}/${quote}`,
          bids: message[1].bs,
          asks: message[1].as,
          timestamp: new Date().toISOString()
        };
        callback(update);
      }
    });

    this.krakenWs.on('error', (error) => {
      console.log('error', error);
      this.cleanup();
    });

    this.krakenWs.on('close', () => {
      console.log(`Disconnected from Kraken ${base}/${quote}`);
      this.cleanup();
    });
  }
}

import { Inject, Service } from "typedi";
import { IQuoteProvider } from "../interfaces/quotes.interface";
import { Subscriptions } from "../interfaces/subscriptions.interface";
import WebSocket from 'ws';
import { getSubscriptionKey } from "../utils/subscription";

const INTERVAL_MS = 5000
@Service()
export class QuoteService {
  quoteProviders: { [key:string]: IQuoteProvider };
  subscriptions: Subscriptions;

  constructor(
    @Inject("KrakenProvider")
    private krakenProvider: IQuoteProvider,
    @Inject("BitgetProvider")
    private bitgetProvider: IQuoteProvider,
  ) {
    this.quoteProviders = {
      "kraken": krakenProvider,
      "bitget": bitgetProvider
    };
    this.subscriptions = {};
  }


  async subscribe(exchange: string, base: string, quote: string, client: WebSocket): Promise<string | boolean> {
    try {
      const subscriptionKey = getSubscriptionKey(exchange, base, quote);
      const providerSelected: IQuoteProvider = this.quoteProviders[exchange];

      if (!this.subscriptions[subscriptionKey]) {
        this.subscriptions[subscriptionKey] = {
          clients: new Set(),
          intervalId: null,
        };

        const sendUpdates = async () => {
          const responseWriter = (response: any) => {
            this.subscriptions[subscriptionKey].clients.forEach(ws => {
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify(response));
              }
            });
          }
          providerSelected.getQuote(base, quote, responseWriter);
        };
        this.subscriptions[subscriptionKey].intervalId = setInterval(sendUpdates, INTERVAL_MS);
      }
      this.subscriptions[subscriptionKey].clients.add(client);
      providerSelected.subscribe(base, quote)
      client.on('close', () => {
        this.unsubscribe(subscriptionKey, client);
      });

      return subscriptionKey;
    } catch (e) {
      console.error((e as Error).message);
      return false;
    }
  }

  unsubscribe(subscriptionKey: string, client: WebSocket): void {
    if (this.subscriptions[subscriptionKey]) {
      this.subscriptions[subscriptionKey].clients.delete(client);

      if (this.subscriptions[subscriptionKey].clients.size === 0) {
        clearInterval(this.subscriptions[subscriptionKey].intervalId!);
        delete this.subscriptions[subscriptionKey];
      }
    }
  }
}

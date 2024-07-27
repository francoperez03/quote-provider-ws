import { Inject, Service } from "typedi";
import WebSocket from 'ws';
import { IQuoteProvider } from "../interfaces/quotes.interface";
import { Subscriptions } from "../interfaces/subscriptions.interface";
import { getSubscriptionKey } from "../utils/subscription";

const INTERVAL_MS = 5000;

@Service()
export class QuoteService {
  quoteProviders: { [key: string]: IQuoteProvider };
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

  async subscribe(exchange: string, base: string, quote: string, client: WebSocket): Promise<string> {
    try {
      const subscriptionKey = getSubscriptionKey(exchange, base, quote);
      const providerSelected: IQuoteProvider = this.quoteProviders[exchange];

      if (!this.subscriptions[subscriptionKey]) {
        this.subscriptions[subscriptionKey] = {
          clients: new Set(),
          intervalId: null,
        };

        const sendUpdates = async () => {
          try {
            const responseWriter = (response: any) => {
              this.subscriptions[subscriptionKey].clients.forEach(ws => {
                if (ws.readyState === WebSocket.OPEN) {
                  ws.send(JSON.stringify(response));
                }
              });
            }
            providerSelected.getQuote(base, quote, responseWriter);
          } catch (error) {
            console.error(`[quote.service.ts] Error sending updates: ${(error as Error).message}`);
          }
        };
        this.subscriptions[subscriptionKey].intervalId = setInterval(sendUpdates, INTERVAL_MS);
      }
      this.subscriptions[subscriptionKey].clients.add(client);
      providerSelected.subscribe(base, quote);
      client.on('close', () => {
        this.unsubscribe(exchange, base, quote, client);
      });

      return subscriptionKey;
    } catch (e) {
      const errorMessage = (e as Error).message;
      console.error({ errorMessage });
      return 'Subscription failed';
    }
  }

  unsubscribe(exchange: string, base: string, quote: string, client: WebSocket): void {
    const subscriptionKey = getSubscriptionKey(exchange, base, quote);
    if (this.subscriptions[subscriptionKey]) {
      this.subscriptions[subscriptionKey].clients.delete(client);

      if (this.subscriptions[subscriptionKey].clients.size === 0) {
        clearInterval(this.subscriptions[subscriptionKey].intervalId!);
        delete this.subscriptions[subscriptionKey];
      }
    }
  }
}

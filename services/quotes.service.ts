import { Inject, Service } from "typedi";
import { IQuoteProvider } from "../interfaces/quotes.interface";

@Service()
export class QuoteService {
  quoteProviders: { [key:string]: IQuoteProvider };

  constructor(
    @Inject("KrakenProvider")
    private krakenProvider: IQuoteProvider,
  ) {
    this.quoteProviders = {
      "kraken": krakenProvider
    }
  }

  async subscribe(exchange: string, base: string, quote: string ) {
    try {
      const symbol = `${base}/${quote}`;
      const clientId = `${exchange}-${symbol}`;
      const providerSelected: IQuoteProvider = this.quoteProviders[exchange];
      providerSelected.subscribe(base, quote)
      console.log("Client Subscribed")
      return clientId;
    } catch (e) {
      console.error((e as Error).message);
      return false;
    }
  }
}
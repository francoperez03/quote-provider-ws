import { IQuoteProvider } from '../interfaces/quotes.interface';

export class KrakenProvider implements IQuoteProvider {

  subscribe(base: string, quote: string,): any {
    console.log('Subscribed to Kraken', base, quote)
  }
}



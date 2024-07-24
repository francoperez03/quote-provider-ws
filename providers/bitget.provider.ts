import { IQuoteProvider } from '../interfaces/quotes.interface';

export class BitgetProvider implements IQuoteProvider {

  subscribe(base: string, quote: string,): any {
    console.log("bitget")
  }
}
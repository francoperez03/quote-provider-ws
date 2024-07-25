export interface IQuoteProvider {
  subscribe(base: string, quote: string): unknown;
  getQuote(base: string, quote: string, callback: (response: any) => void): any;
}

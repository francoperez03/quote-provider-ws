export interface IQuoteProvider {
  subscribe(base: string, quote: string): any;
}

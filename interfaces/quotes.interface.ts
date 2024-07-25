export interface IQuoteProvider {
  subscribe(base: string, quote: string, callback: (update: any) => void): any;
}

export const getSubscriptionKey = (exchange: string, base: string, quote: string) : string => (`${exchange}-${base}-${quote}`)
export const getPairKey = (base: string, quote: string) : string => (`${base}-${quote}`)
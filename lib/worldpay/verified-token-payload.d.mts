export function oneTimeVerifiedTokenPayload(input: {cardSessionHref: string; holderName: string; merchantEntity: string}): {
  paymentInstrument: {type: string; cardHolderName: string; sessionHref: string};
  merchant: {entity: string}; verificationCurrency: string;
};

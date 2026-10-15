export type AtomAuthSuccess = {
  atomTokenId: string;
  merchTxnId: string;
  txnStatusCode: string;
};

export type AtomPaymentInstrument = {
  merchDetails?: {
    merchId?: string | number;
    merchTxnId?: string;
    merchTxnDate?: string;
    password?: string;
  };
  payDetails?: {
    atomTxnId?: string | number;
    totalAmount?: number | string;
    amount?: number | string;
    txnCurrency?: string;
    product?: string;
    signature?: string;
  };
  responseDetails?: {
    statusCode?: string;
    txnStatusCode?: string;
    message?: string;
    description?: string;
  };
  custDetails?: {
    custEmail?: string;
    custMobile?: string;
  };
  payModeSpecificData?: {
    subChannel?: string[] | string;
    bankDetails?: {
      bankTxnId?: string;
    };
  };
  extras?: Record<string, string>;
};

export type AtomCallbackPayload = {
  /** Callback uses an object; Status/Requery PDF sample uses an array. */
  payInstrument?: AtomPaymentInstrument | AtomPaymentInstrument[];
  atomTokenId?: string | number;
  responseDetails?: {
    statusCode?: string;
    txnStatusCode?: string;
    message?: string;
  };
};

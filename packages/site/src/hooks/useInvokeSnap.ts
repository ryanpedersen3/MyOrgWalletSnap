import { useRequest } from './useRequest';
import { defaultSnapOrigin } from '../config';

export type InvokeSnapParams = {
  method: string;
  params?: Record<string, unknown>;
};

/**
 * Utility hook to wrap the `wallet_invokeSnap` method.
 *
 * @param snapId - The Snap ID to invoke. Defaults to the snap ID specified in the
 * config.
 * @returns The invokeSnap wrapper method.
 */
export const useInvokeSnap = (snapId = defaultSnapOrigin) => {
  const request = useRequest();

  interface StoreStringResponse {
    success: boolean;
    message: string;
  }
  
  interface GetStringResponse {
    success: boolean;
    storedString: string | null;
  }

  /**
   * Invoke the requested Snap method.
   *
   * @param params - The invoke params.
   * @param params.method - The method name.
   * @param params.params - The method params.
   * @returns The Snap response.
   */
  const invokeSnap = async ({ method, params }: InvokeSnapParams) => {

    console.info("add to storage")
    const snapVC = { id: "insurance", storage: "7777"}
    request({
      method: 'wallet_invokeSnap',
      params: {
        snapId,
        request: { method: "storeVC", params: { snapVC } }
      },
    }).then((resp) => {
      console.info("snap call successful, ", resp)
    })


    console.info("retrieve from storage ")
    
    request({
      method: 'wallet_invokeSnap',
      params: {
        snapId,
        request: { method: "getVC", params: { id: "shopify" }},
      },
    }).then((response) => {
      console.info("response  aaaa: ", response)
    });
  

    console.info("retrieve from storage ")
    
    request({
      method: 'wallet_invokeSnap',
      params: {
        snapId,
        request: { method: "getVCs", params: { }},
      },
    }).then((response) => {
      console.info("response  bbb: ", response)
    });

/*
    
    console.info("send store string: ", snapId)
    request({
      method: 'wallet_invokeSnap',
      params: {
        snapId,
        request: { method: "storeString", params: {string: "life is good"}, } 
      },
    });

    
    request({
      method: 'wallet_invokeSnap',
      params: {
        snapId,
        request: { method: "getString" },
      },
    }).then((response) => {
      console.info("response: ", response)
    });
    */
    
  }


  return { invokeSnap }
};

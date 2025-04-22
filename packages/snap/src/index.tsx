import type { OnRpcRequestHandler, OnSignatureHandler, OnTransactionHandler } from '@metamask/snaps-sdk';
import { Box, Text, Heading, Bold } from '@metamask/snaps-sdk/jsx';

interface StoreStringParams {
  string: string;
}

interface SnapRequestParams {
  method: string;
  params?: StoreStringParams | unknown;
}

interface VCState {
  credentials: Record<string, any>; // VC ID -> VC object
}

/**
 * Handle incoming JSON-RPC requests, sent through `wallet_invokeSnap`.
 *
 * @param args - The request handler args as object.
 * @param args.origin - The origin of the request, e.g., the website that
 * invoked the snap.
 * @param args.request - A validated JSON-RPC request object.
 * @returns The result of `snap_dialog`.
 * @throws If the request method is not valid for this snap.
 */
export const onRpcRequest: OnRpcRequestHandler = async ({
  origin,
  request,
}) => {
  switch (request.method) {
    case 'storeVC':
      const vc = JSON.parse(JSON.stringify(request.params?.snapVC));
      if (!vc || !vc.id) throw new Error('Invalid VC: ' + JSON.stringify(request.params));
      
      const st = (await snap.request({
        method: 'snap_manageState',
        params: { operation: 'get' },
      })) as VCState | null;
      
      const currentCredentials = st?.credentials || {};
      const newState = {
        credentials: {
          ...currentCredentials,
          [vc.id]: vc,
        },
      };
      
      await snap.request({
        method: 'snap_manageState',
        params: { operation: 'update', newState },
      });

      return `VC ${vc.id} stored successfully`;

    case 'getVCs':

      const currentStateAll = (await snap.request({
        method: 'snap_manageState',
        params: { operation: 'get' },
      })) as VCState | null;

      if (!currentStateAll) {
        throw new Error('VCs not found: ' );
      }
      return currentStateAll.credentials;

    case 'getVC':
      const id = request.params?.id;
      if (!id) throw new Error('VC ID required: ' + JSON.stringify(request.params));

      const currentState = (await snap.request({
        method: 'snap_manageState',
        params: { operation: 'get' },
      })) as VCState | null;

      if (!currentState || !currentState.credentials[id]) {
        throw new Error('VC not found: ' + id + ", credentials: " +  JSON.stringify(currentState));
      }
      return currentState.credentials[id];

    case 'signatureMessage':
      const storeParams = request.params as StoreStringParams | undefined;
      const stringToStore = storeParams?.string;

      if (!stringToStore) {
        throw new Error('No string provided. Please provide a string parameter');
      }

      await snap.request({
        method: 'snap_manageState',
        params: {
          operation: 'update',
          newState: { signatureMessage: stringToStore },
        },
      });

      return {
        success: true,
        message: `String "${stringToStore}" stored successfully`,
      };

    case 'getSignatureMessage':
      const state = await snap.request({
        method: 'snap_manageState',
        params: { operation: 'get' },
      });

      return {
        success: true,
        signatureMessage: (state as { signatureMessage?: string } | null)?.signatureMessage || null,
      };

    case 'hello':
      return snap.request({
        method: 'snap_dialog',
        params: {
          type: 'confirmation',
          content: (
            <Box>
              <Text>
                Hello, <Bold>{origin}</Bold>!
              </Text>
              <Text>
                This custom confirmation is just for display purposes.
              </Text>
              <Text>
                But you can edit the snap source code to make it do something,
                if you want to!
              </Text>
            </Box>
          ),
        },
      });
    default:
      throw new Error('Method not found.');
  }
};

export const onSignature: OnSignatureHandler = async ({ signature, signatureOrigin }) => {
  // Extract signature details
  const { signatureMethod, data } = signature;

  // Example logic: Check the signature method and provide insights
  let insightMessage = "Signature request detected.";
  if (signatureMethod === "personal_sign") {
    insightMessage = `Personal sign request from ${signatureOrigin || "unknown origin"}: ${data}`;
  } else if (signatureMethod === "eth_signTypedData_v4") {
    insightMessage = `Typed data sign request from ${signatureOrigin || "unknown origin"}`;
  }

  const st1 = await snap.request({
    method: 'snap_manageState',
    params: { operation: 'get' },
  });
  const st2 = (st1 as { signatureMessage?: string } | null)?.signatureMessage || null

  // Return insights to display in MetaMask UI
  return {
    content: (
      <Box>
        <Heading>{st2}</Heading>
      </Box>
    ),
    severity: "critical" // Optional: Highlights the insight if critical
  };
};

export const onTransaction: OnTransactionHandler = async ({ transaction }) => {
  const { to, value, data, extraInfo } = transaction;

  // Custom message based on transaction details
  const customMessage = `Transaction to ${to} with value ${value || "0"} wei`;

  return {
    content: (
      <Box>
        <Heading>Transaction Preview</Heading>
        <Text>{customMessage}</Text>
        <Text>Data: {data || "No data"}</Text>
        <Text>ExtraInfo: {extraInfo || "No extra info"}</Text>
      </Box>
    )
  };
};

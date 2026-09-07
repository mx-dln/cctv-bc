import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

import grpc from '@grpc/grpc-js';
import { connect, hash, signers } from '@hyperledger/fabric-gateway';
import express from 'express';

const env = process.env;

const config = {
  port: Number(env.PORT || 8787),
  peerEndpoint: env.FABRIC_PEER_ENDPOINT || 'localhost:7051',
  peerHostAlias: env.FABRIC_PEER_HOST_ALIAS || 'peer0.org1.example.com',
  mspId: env.FABRIC_MSP_ID || 'Org1MSP',
  channelName: env.FABRIC_CHANNEL || 'mychannel',
  chaincodeName: env.FABRIC_CHAINCODE || 'cctv-custody',
  tlsCertPath: env.FABRIC_TLS_CERT_PATH,
  certDirectory: env.FABRIC_CERT_DIRECTORY,
  keyDirectory: env.FABRIC_KEY_DIRECTORY,
};

function requiredPath(value, name) {
  if (!value) {
    throw new Error(`${name} is required`);
  }

  return value;
}

async function firstFile(directory) {
  const files = await fs.readdir(directory);
  const file = files.find((name) => !name.startsWith('.'));
  if (!file) {
    throw new Error(`No identity file found in ${directory}`);
  }

  return path.join(directory, file);
}

async function newGrpcConnection() {
  const tlsRootCert = await fs.readFile(requiredPath(config.tlsCertPath, 'FABRIC_TLS_CERT_PATH'));
  const credentials = grpc.credentials.createSsl(tlsRootCert);

  return new grpc.Client(config.peerEndpoint, credentials, {
    'grpc.ssl_target_name_override': config.peerHostAlias,
  });
}

async function newIdentity() {
  const certPath = await firstFile(requiredPath(config.certDirectory, 'FABRIC_CERT_DIRECTORY'));
  const credentials = await fs.readFile(certPath);

  return { mspId: config.mspId, credentials };
}

async function newSigner() {
  const keyPath = await firstFile(requiredPath(config.keyDirectory, 'FABRIC_KEY_DIRECTORY'));
  const privateKeyPem = await fs.readFile(keyPath);
  const privateKey = crypto.createPrivateKey(privateKeyPem);

  return signers.newPrivateKeySigner(privateKey);
}

async function withContract(work) {
  const client = await newGrpcConnection();
  const gateway = connect({
    client,
    identity: await newIdentity(),
    signer: await newSigner(),
    hash: hash.sha256,
    evaluateOptions: () => ({ deadline: Date.now() + 5000 }),
    endorseOptions: () => ({ deadline: Date.now() + 15000 }),
    submitOptions: () => ({ deadline: Date.now() + 5000 }),
    commitStatusOptions: () => ({ deadline: Date.now() + 60000 }),
  });

  try {
    const network = gateway.getNetwork(config.channelName);
    const contract = network.getContract(config.chaincodeName);

    return await work(contract);
  } finally {
    gateway.close();
    client.close();
  }
}

function parseResult(bytes) {
  const text = Buffer.from(bytes).toString('utf8');
  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    return { result: text };
  }
}

function payloadArgument(args) {
  const first = Array.isArray(args) ? args[0] : args;

  return JSON.stringify(first ?? {});
}

function errorPayload(error) {
  return {
    error: error.message,
    code: error.code,
    details: error.details,
    cause: error.cause?.message,
  };
}

const app = express();
app.use(express.json({ limit: '2mb' }));

app.get('/health', async (_request, response) => {
  try {
    await withContract((contract) => contract.evaluateTransaction('QueryCCTVCustodyLog', JSON.stringify({ record_id: '__healthcheck__' })))
      .catch(() => null);

    response.json({
      available: true,
      gateway: 'Hyperledger Fabric',
      channel: config.channelName,
      chaincode: config.chaincodeName,
    });
  } catch (error) {
    response.status(503).json({ available: false, ...errorPayload(error) });
  }
});

app.post('/chaincode/invoke', async (request, response) => {
  const fn = request.body?.function;
  if (!fn) {
    return response.status(422).json({ error: 'function is required' });
  }

  try {
    const result = await withContract(async (contract) => {
      const proposal = contract.newProposal(fn, { arguments: [payloadArgument(request.body?.args)] });
      const transaction = await proposal.endorse();
      const submitted = await transaction.submit();
      const status = await submitted.getStatus();
      const payload = parseResult(transaction.getResult());

      return {
        ...payload,
        transaction_id: submitted.getTransactionId(),
        status: status.successful ? 'committed' : 'failed',
        code: status.code,
        block_number: status.blockNumber?.toString(),
      };
    });

    response.json(result);
  } catch (error) {
    response.status(500).json(errorPayload(error));
  }
});

app.post('/chaincode/query', async (request, response) => {
  const fn = request.body?.function;
  if (!fn) {
    return response.status(422).json({ error: 'function is required' });
  }

  try {
    const result = await withContract(async (contract) => {
      const bytes = await contract.evaluateTransaction(fn, payloadArgument(request.body?.args));

      return parseResult(bytes);
    });

    response.json(result);
  } catch (error) {
    response.status(404).json(errorPayload(error));
  }
});

app.listen(config.port, () => {
  console.log(`CCTV Fabric gateway listening on http://127.0.0.1:${config.port}`);
});

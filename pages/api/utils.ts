import { ethers } from 'ethers';
import { NextApiRequest, NextApiResponse } from 'next';
import { Session, withIronSession } from 'next-iron-session';
import contract from '../../public/contracts/NFTMarket.json';
import { NftMarketContract } from '@_types/nftMarketContract';
import * as util from 'ethereumjs-util';

const NETWORKS = {
  '1337': 'Ganache',
  '3': 'Ropsten',
};

type NETWORKS = typeof NETWORKS;

const abi = contract.abi;

const targetNetwork = process.env.NEXT_PUBLIC_NETWORK_ID as keyof NETWORKS;
export const contractAddress = contract['networks'][targetNetwork]['address'];

// pinata api key
export const pinataApiKey = process.env.PINATA_API_KEY as string;
export const pinataSecretKey = process.env.PINATA_SECRET_API_KEY as string;

export function withSession(handler: any) {
  return withIronSession(handler, {
    // 至少要32charaters
    password: process.env.NEXT_PUBLIC_COOKIE_PASSWORD as string,
    cookieName: 'NFT-auth-session',
    cookieOptions: {
      secure: process.env.NODE_ENV === 'production' ? true : false,
    },
  });
}

const url =
  process.env.NODE_ENV === 'production'
    ? process.env.INFURA_API_URL
    : 'http://127.0.0.1:7545';

export const addressCheckMiddleware = async (
  req: NextApiRequest & { session: Session },
  res: NextApiResponse
) => {
  return new Promise(async (resolve, reject) => {
    // get the message of message-session
    const message = req.session.get('message-session');

    // 這邊很重要
    const provider = new ethers.providers.JsonRpcProvider(url);

    const contract = new ethers.Contract(
      contractAddress,
      abi,
      provider
    ) as unknown as NftMarketContract;

    let nonce: string | Buffer =
      '\x19Ethereum Signed Message:\n' +
      JSON.stringify(message).length +
      JSON.stringify(message);

    nonce = util.keccak(Buffer.from(nonce, 'utf-8'));
    const { v, r, s } = util.fromRpcSig(req.body.signature);
    const pubKey = util.ecrecover(util.toBuffer(nonce), v, r, s);
    const addressBuffer = util.pubToAddress(pubKey);
    const address = util.bufferToHex(addressBuffer);

    if (address === req.body.address) {
      resolve('Correct Address');
    } else {
      reject('Wrong Address');
    }
  });
};

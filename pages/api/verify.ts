import { v4 as uuidv4 } from 'uuid';
import { Session } from 'next-iron-session';
import { NextApiRequest, NextApiResponse } from 'next';
import {
  withSession,
  contractAddress,
  addressCheckMiddleware,
  pinataApiKey,
  pinataSecretKey,
} from './utils';
import { NFTmeta } from '@_types/nft';
import axios from 'axios';

export default withSession(
  async (req: NextApiRequest & { session: Session }, res: NextApiResponse) => {
    if (req.method === 'POST') {
      try {
        const { body } = req;
        const NFT = body.NFT as NFTmeta;

        if (!NFT.name || !NFT.description || !NFT.attributes) {
          return res.status(422).send('Some form is empty');
        }

        await addressCheckMiddleware(req, res);

        // axios.post(url, JSONbody, headers)
        const jsonResponse = await axios.post(
          'https://api.pinata.cloud/pinning/pinJSONToIPFS',
          {
            pinataMetadata: {
              name: uuidv4(),
            },
            pinataContent: NFT,
          },
          {
            headers: {
              pinata_api_key: pinataApiKey,
              pinata_secret_api_key: pinataSecretKey,
            },
          }
        );

        return res.status(200).send(jsonResponse.data);
      } catch (error) {
        return res.status(422).send({ message: 'Cannot create JSON Data' });
      }
    } else if (req.method === 'GET') {
      try {
        const message = { contractAddress, id: uuidv4() };
        req.session.set('message-session', message);
        await req.session.save();
        res.json(message);
      } catch (error) {
        return res.status(422).send({ message: 'Cannot generate a message' });
      }
    } else {
      return res.status(200).json({ message: 'Invalid api route' });
    }
  }
);

import { NextApiResponse, NextApiRequest } from 'next';
import { Session } from 'next-iron-session';
import {
  withSession,
  addressCheckMiddleware,
  pinataApiKey,
  pinataSecretKey,
} from './utils';
import { File } from '@_types/nft';
import FormData from 'form-data';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

export default withSession(
  async (req: NextApiRequest & { session: Session }, res: NextApiResponse) => {
    if (req.method === 'POST') {
      const { bytes, fileName, contentType } = req.body as File;

      if (!bytes || !fileName || !contentType) {
        return res.status(422).send({ message: 'Image data are missing' });
      }

      await addressCheckMiddleware(req, res);

      const buffer = Buffer.from(Object.values(bytes));

      const formData = new FormData();
      // append(name, value, filename)
      // 從buffer把資料抓出來轉成Form-data
      formData.append('file', buffer, {
        contentType,
        filename: fileName + '-' + uuidv4(),
      });

      const fileResponse = await axios.post(
        'https://api.pinata.cloud/pinning/pinFileToIPFS',
        formData,
        {
          maxBodyLength: Infinity,
          headers: {
            'Content-Type': `multipart/form-data; boundary=${formData.getBoundary()}`,
            pinata_api_key: pinataApiKey,
            pinata_secret_api_key: pinataSecretKey,
          },
        }
      );

      return res.status(200).send(fileResponse.data);
    } else {
      return res.status(422).send({ message: 'Invalid endpoint' });
    }
  }
);

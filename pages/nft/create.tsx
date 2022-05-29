/* eslint-disable @next/next/no-img-element */
import axios from 'axios';
import type { NextPage } from 'next';
import { useState, ChangeEvent } from 'react';
import { BaseLayout } from '@ui';
import { Switch } from '@headlessui/react';
import Link from 'next/link';
import { NFTmeta, PinataResponse } from '@_types/nft';
import { useWeb3 } from '@provider/web3';
import { ethers } from 'ethers';
import { toast } from 'react-toastify';
import { useNetwork } from '@hooks/web3';
import { ExclamationIcon } from '@heroicons/react/solid';

const ALLOWED_FIELDS = ['name', 'description', 'image', 'attributes'];

const NFTCreate: NextPage = () => {
  const { network } = useNetwork();
  // ethereum = window.ethereum
  const { ethereum, contract } = useWeb3();
  const [NFTURI, setNFTURI] = useState('');
  const [hasURI, setHasURI] = useState(false);
  const [price, setPrice] = useState('');
  const [NFTMeta, setNFTMeta] = useState<NFTmeta>({
    name: '',
    description: '',
    image: '',
    attributes: [
      { trait_type: '生命', value: '0' },
      { trait_type: '力量', value: '0' },
      { trait_type: '敏捷', value: '0' },
    ],
  });

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setNFTMeta({ ...NFTMeta, [name]: value });
  };

  const handleAttributesChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const index = NFTMeta.attributes.findIndex(
      attr => attr.trait_type === name
    );
    NFTMeta.attributes[index].value = value;

    setNFTMeta({ ...NFTMeta, attributes: NFTMeta.attributes });
  };

  const handleImage = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      console.error('請上傳檔案');
      return;
    }

    const file = e.target.files[0];
    // get the bytes in buffer
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);

    try {
      const { signedData, account } = await getSignedData();
      const promise = axios.post('/api/verify-image', {
        address: account,
        signature: signedData,
        bytes,
        contentType: file.type,
        fileName: file.name.replace(/\.[^/.]+$/, ''),
      });

      const res = await toast.promise(promise, {
        pending: '圖片上傳中...',
        success: '上傳完成，請等待預覽圖',
        error: '上傳失敗',
      });

      const data = res.data as PinataResponse;

      setNFTMeta({
        ...NFTMeta,
        image: `${process.env.NEXT_PUBLIC_PINATA_DOMAIN}/ipfs/${data.IpfsHash}`,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const getSignedData = async () => {
    const messageToSign = await axios.get('/api/verify');
    const accounts = (await ethereum?.request({
      method: 'eth_requestAccounts',
    })) as string[];
    const account = accounts[0];

    const signedData = await ethereum?.request({
      method: 'personal_sign',
      params: [
        JSON.stringify(messageToSign.data),
        account,
        messageToSign.data.id,
      ],
    });

    return { signedData, account };
  };

  const uploadMetaData = async () => {
    try {
      const { signedData, account } = await getSignedData();

      const promise = axios.post('/api/verify', {
        address: account,
        signature: signedData,
        NFT: NFTMeta,
      });

      const res = await toast.promise(promise, {
        pending: '創建中...',
        success: '創建完成',
        error: '創建失敗',
      });

      const data = res.data as PinataResponse;
      setNFTURI(
        `${process.env.NEXT_PUBLIC_PINATA_DOMAIN}/ipfs/${data.IpfsHash}`
      );
    } catch (error: any) {
      console.error(error.message);
    }
  };

  const createNFT = async () => {
    try {
      const NFTResponse = await axios.get(NFTURI);
      const content = NFTResponse.data;

      Object.keys(content).forEach(key => {
        if (!ALLOWED_FIELDS.includes(key)) {
          throw new Error('Invalid JSON structure');
        }
      });

      const tx = await contract?.mintToken(
        NFTURI,
        ethers.utils.parseEther(price),
        {
          value: ethers.utils.parseEther((0.02).toString()),
        }
      );

      await toast.promise(tx!.wait(), {
        pending: 'Minting NFT中，請耐心等候...',
        success: 'NFT創建完成',
        error: 'Minting NFT失敗',
      });

      window.location.replace('/');
    } catch (error: any) {
      console.error(error.message);
    }
  };

  if (!network.isConnectedToNetwork) {
    return (
      <BaseLayout>
        <div className="rounded-md bg-yellow-50 p-4 mt-10">
          <div className="flex">
            <div className="flex-shrink-0">
              <ExclamationIcon
                className="h-5 w-5 text-yellow-400"
                aria-hidden="true"
              />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">注意</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  {network.isLoading
                    ? 'Loading...'
                    : `請連接到 ${network.targetNetwork}`}
                </p>
              </div>
            </div>
          </div>
        </div>
      </BaseLayout>
    );
  }

  return (
    <BaseLayout>
      <div>
        {/* <div className="py-4">
          {!NFTURI && (
            <div className="flex">
              <div className="mr-4  font-bold underline">你要上傳數據嗎?</div>
              <Switch
                checked={hasURI}
                onChange={() => setHasURI(!hasURI)}
                className={`${hasURI ? 'bg-indigo-900' : 'bg-indigo-100'}
                  relative inline-flex flex-shrink-0 h-[28px] w-[64px] border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus-visible:ring-2  focus-visible:ring-white focus-visible:ring-opacity-75`}
              >
                <span className="sr-only">Use setting</span>
                <span
                  aria-hidden="true"
                  className={`${hasURI ? 'translate-x-9' : 'translate-x-0'}
                    pointer-events-none inline-block h-[24px] w-[24px] rounded-full bg-white shadow-lg transform ring-0 transition ease-in-out duration-200`}
                />
              </Switch>
            </div>
          )}
        </div> */}
        {NFTURI || hasURI ? (
          <div className="md:grid md:grid-cols-3 md:gap-6">
            <div className="md:col-span-1">
              <div className="px-4 sm:px-0">
                <h3 className="text-lg font-medium leading-6 text-gray-900">
                  上傳你的NFT
                </h3>
              </div>
            </div>
            <div className="mt-5 md:mt-0 md:col-span-2">
              <form>
                <div className="shadow sm:rounded-md sm:overflow-hidden">
                  {hasURI && (
                    <div className="px-4 py-5 bg-white space-y-6 sm:p-6">
                      <div>
                        <label
                          htmlFor="uri"
                          className="block text-sm font-medium text-gray-700"
                        >
                          URI Link
                        </label>
                        <div className="mt-1 flex rounded-md shadow-sm">
                          <input
                            onChange={e => setNFTURI(e.target.value)}
                            type="text"
                            name="uri"
                            id="uri"
                            className="focus:ring-indigo-500 focus:border-indigo-500 flex-1 block w-full rounded-none rounded-r-md sm:text-sm border-gray-300"
                            placeholder="http://link.com/data.json"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  {NFTURI && (
                    <div className="mb-4 p-4">
                      <div className="font-bold">Your URI Link: </div>
                      <div>
                        <Link href={NFTURI}>
                          <a className="underline text-indigo-600">{NFTURI}</a>
                        </Link>
                      </div>
                    </div>
                  )}
                  <div className="px-4 py-5 bg-white space-y-6 sm:p-6">
                    <div>
                      <label
                        htmlFor="price"
                        className="block text-sm font-medium text-gray-700"
                      >
                        價格 (ETH)
                      </label>
                      <div className="mt-1 flex rounded-md shadow-sm">
                        <input
                          onChange={e => {
                            setPrice(e.target.value);
                          }}
                          value={price}
                          type="number"
                          name="price"
                          id="price"
                          className="focus:ring-indigo-500 focus:border-indigo-500 flex-1 block w-full rounded-none rounded-r-md sm:text-sm border-gray-300"
                          placeholder="0.8"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
                    <button
                      type="button"
                      onClick={createNFT}
                      className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      創建
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        ) : (
          <div className="md:grid md:grid-cols-3 md:gap-6">
            <div className="md:col-span-1">
              <div className="px-4 sm:px-0">
                <h3 className="text-lg font-medium leading-6 text-gray-900">
                  創建你的NFT
                </h3>
                {/* <p className="mt-1 text-sm text-gray-600">
                  This information will be displayed publicly so be careful what
                  you share.
                </p> */}
              </div>
            </div>
            <div className="mt-5 md:mt-0 md:col-span-2">
              <form>
                <div className="shadow sm:rounded-md sm:overflow-hidden">
                  <div className="px-4 py-5 bg-white space-y-6 sm:p-6">
                    <div>
                      <label
                        htmlFor="name"
                        className="block text-sm font-medium text-gray-700"
                      >
                        名稱
                      </label>
                      <div className="mt-1 flex rounded-md shadow-sm">
                        <input
                          value={NFTMeta.name}
                          onChange={handleChange}
                          type="text"
                          name="name"
                          id="name"
                          className="focus:ring-indigo-500 focus:border-indigo-500 flex-1 block w-full rounded-none rounded-r-md sm:text-sm border-gray-300"
                          placeholder="我的NFT"
                        />
                      </div>
                    </div>
                    <div>
                      <label
                        htmlFor="description"
                        className="block text-sm font-medium text-gray-700"
                      >
                        生物描述
                      </label>
                      <div className="mt-1">
                        <textarea
                          value={NFTMeta.description}
                          onChange={handleChange}
                          id="description"
                          name="description"
                          rows={3}
                          className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 mt-1 block w-full sm:text-sm border border-gray-300 rounded-md"
                          placeholder="攻擊型? 坦克型? 刺客型?"
                        />
                      </div>
                      {/* <p className="mt-2 text-sm text-gray-500">
                        Brief description of NFT
                      </p> */}
                    </div>
                    {/* Has Image? */}
                    {NFTMeta.image ? (
                      <img src={NFTMeta.image} alt="" className="h-40" />
                    ) : (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          圖像
                        </label>
                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                          <div className="space-y-1 text-center">
                            <svg
                              className="mx-auto h-12 w-12 text-gray-400"
                              stroke="currentColor"
                              fill="none"
                              viewBox="0 0 48 48"
                              aria-hidden="true"
                            >
                              <path
                                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                                strokeWidth={2}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                            <div className="flex text-sm text-gray-600">
                              <label
                                htmlFor="file-upload"
                                className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                              >
                                <span>Upload a file</span>
                                <input
                                  onChange={handleImage}
                                  id="file-upload"
                                  name="file-upload"
                                  type="file"
                                  className="sr-only"
                                />
                              </label>
                              <p className="pl-1">or drag and drop</p>
                            </div>
                            <p className="text-xs text-gray-500">
                              PNG, JPG, GIF up to 10MB
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="grid grid-cols-6 gap-6">
                      {NFTMeta.attributes.map(attribute => (
                        <div
                          key={attribute.trait_type}
                          className="col-span-6 sm:col-span-6 lg:col-span-2"
                        >
                          <label
                            htmlFor={attribute.trait_type}
                            className="block text-sm font-medium text-gray-700"
                          >
                            {attribute.trait_type}
                          </label>
                          <input
                            value={attribute.value}
                            onChange={handleAttributesChange}
                            type="text"
                            name={attribute.trait_type}
                            id={attribute.trait_type}
                            className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                          />
                        </div>
                      ))}
                    </div>
                    <p className="text-sm !mt-2 text-gray-500">
                      能力值為0到100
                    </p>
                  </div>
                  <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
                    <button
                      onClick={uploadMetaData}
                      type="button"
                      className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      創建
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </BaseLayout>
  );
};

export default NFTCreate;

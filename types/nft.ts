export type Trait = '力量' | '生命' | '敏捷';

export type NFTAttributes = {
  trait_type: Trait;
  value: string;
};

export type NFTmeta = {
  name: string;
  description: string;
  image: string;
  attributes: NFTAttributes[];
};

export type NFTCore = {
  tokenId: number;
  price: number;
  creator: string;
  isListed: boolean;
};

export type NFT = {
  metaData: NFTmeta;
} & NFTCore;

export type File = {
  bytes: Uint8Array;
  contentType: string;
  fileName: string;
};

export type PinataResponse = {
  IpfsHash: string;
  PinSize: number;
  TimeStamp: string;
  isDuplicate: boolean;
};

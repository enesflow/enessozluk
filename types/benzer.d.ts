export type BenzerResponse = {
  isUnsuccessful: false;
  words: string[];
  moreWords: { [key: string]: string[] };
};
export type BenzerResponseError = {
  isUnsuccessful: true;
  serverDefinedErrorText?: string;
  words?: string[];
};

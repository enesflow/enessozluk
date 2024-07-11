type Word = {
  definitions: string[];
  name: string;
};

export type LuggatResponse = {
  isUnsuccessful: false;
  words: Word[];
};
export type LuggatResponseError = {
  isUnsuccessful: true;
  serverDefinedErrorText?: string;
};

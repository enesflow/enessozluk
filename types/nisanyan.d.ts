type Language = {
  _id: string;
  name: string;
  description: string;
  description2: string;
  timeCreated: string;
  timeUpdated: string;
  abbreviation: string;
  id_depr: number;
};

type Relation = {
  _id: string;
  name: string;
  abbreviation: string;
  text: string;
};

type GrammarCase = {
  _id: string;
  order: number;
  name: string;
  description: string;
  tooltip: string;
};

type SemiticForm = {
  _id: string;
  id_depr: number;
  name: string;
  description: string;
  language: Language;
  timeCreated: string;
  timeUpdated: string;
};

type Grammar = {
  grammaticalCase?: string;
  case?: GrammarCase[];
  semiticRoot?: string;
  semiticForm?: SemiticForm;
};

type WordClass = {
  _id: string;
  name: string;
  description: string;
  abbreviation: string;
};

type Affix = {
  _id: string;
  name: string;
  description: string;
  language: Language;
  timeCreated: string;
  timeUpdated: string;
  id_depr: number;
};

type Affixes = {
  prefix?: Affix;
  suffix?: Affix;
};

type Etymology = {
  serverDefinedMoreIndentation?: boolean;
  _id: string;
  id_depr: number;
  paranthesis: string;
  relation: Relation;
  languages: Language[];
  originalText: string;
  romanizedText: string;
  grammar: Grammar;
  definition: string;
  neologism: string;
  wordClass: WordClass;
  timeCreated: string;
  timeUpdated: string;
  affixes?: Affixes;
};

type Source = {
  _id: string;
  name: string;
  book: string;
  editor: string;
  datePublished: string;
  timeCreated: string;
  timeUpdated: string;
  id_depr: number;
  abbreviation: string;
  date: string;
};

type History = {
  _id: string;
  id_depr: number;
  excerpt: string;
  definition: string;
  source?: Source;
  date: string;
  dateSortable: number;
  quote: string;
  timeCreated: string;
  timeUpdated: string;
  language?: Language;
};

type Reference = {
  _id: string;
  id_depr: number;
  name: string;
  note: string;
  timeCreated: string;
  timeUpdated: string;
  queries: string[];
  similarWords: string[];
  references: { _id: string }[];
  etymologies: { _id: string }[];
  histories: { _id: string }[];
  referenceOf: WordReference[];
  alternateSpellings?: string[];
  misspellings?: string[];
};

type WordReference = {
  _id: string;
  id_depr: number;
  name: string;
  note: string;
  timeCreated: string;
  timeUpdated: string;
  queries: string[];
  similarWords: string[];
  references: { _id: string }[];
  etymologies: { _id: string }[];
  histories: { _id: string }[];
  referenceOf: WordReference[];
};

type Word = {
  serverDefinedTitleDescription?: string;
  _id: string;
  etymologies: Etymology[];
  histories?: History[];
  id_depr: number;
  misspellings?: string[] | null;
  name: string;
  note: string;
  queries: string[];
  references: Reference[];
  referenceOf?: WordReference[];
  similarWords?: string[] | null;
  timeCreated: string;
  timeUpdated: string;
  actualTimeUpdated: string;
};

type RelatedWord = {
  _id: string;
  name: string;
};

type RandomWord = {
  _id: string;
  name: string;
};

type NisanyanGeneralResponse = {
  isUnsuccessful: boolean;
  fiveBefore: RelatedWord[];
  fiveAfter: RelatedWord[];
  randomWord: RandomWord;
};

export type NisanyanResponse = NisanyanGeneralResponse & {
  isUnsuccessful: false;
  words?: Word[];
};

export type NisanyanResponseError = {
  isUnsuccessful: true;
  error?: {};
  words?: RelatedWord[];
  fiveBefore?: RelatedWord[];
  fiveAfter?: RelatedWord[];
  randomWord?: RandomWord;
  serverDefinedErrorText?: string;
};

// export Relation as NisanyanRelation;
export type { Word as NisanyanWord };
export type { Etymology as NisanyanEtymology };

type Language = {
  _id: string;
  name: string;
  description: string;
  description2: string;
  timeCreated: string;
  timeUpdated: string;
  abbreviation: string;
  id_depr: number;
};

type Affix = {
  _id: string;
  name: string;
  language: Language;
  description: string;
  timeCreated: string;
  timeUpdated: string;
};

type Word = {
  _id: string;
  name: string;
};

export type NisanyanAffixResponse = {
  affix: Affix;
  words: Word[];
};

export type NisanyanAffixResponseError = {
  error: {};
};

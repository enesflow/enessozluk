import { z } from "zod";

export const NisanyanLanguageSchema = z.object({
  _id: z.string().optional(),
  name: z.string().optional(),
  description: z.string().optional(),
  description2: z.string().optional(),
  timeCreated: z.string().optional(),
  timeUpdated: z.string().optional(),
  abbreviation: z.string().optional(),
  id_depr: z.number().optional(),
});

export const NisanyanRelationSchema = z.object({
  _id: z.string().optional(),
  name: z.string().optional(),
  abbreviation: z.string().optional(),
  text: z.string(),
});

export const NisanyanGrammarCaseSchema = z.object({
  _id: z.string().optional(),
  order: z.number().optional(),
  name: z.string().optional(),
  description: z.string().optional(),
  tooltip: z.string().optional(),
});

export const NisanyanSemiticFormSchema = z.object({
  _id: z.string(),
  id_depr: z.number().optional(),
  name: z.string(),
  description: z.string(),
  language: NisanyanLanguageSchema,
  timeCreated: z.string().optional(),
  timeUpdated: z.string().optional(),
});

export const NisanyanGrammarSchema = z.object({
  grammaticalCase: z.string().optional(),
  case: z.array(NisanyanGrammarCaseSchema).optional(),
  semiticRoot: z.string().optional(),
  semiticForm: NisanyanSemiticFormSchema.optional(),
});

export const NisanyanWordClassSchema = z.object({
  _id: z.string(),
  name: z.string(),
  description: z.string(),
  abbreviation: z.string(),
});

export const NisanyanAffixSchema = z.object({
  _id: z.string(),
  name: z.string(),
  description: z.string(),
  language: NisanyanLanguageSchema,
  timeCreated: z.string().optional(),
  timeUpdated: z.string().optional(),
  nisaid_depr: z.number().optional(),
});

export const NisanyanAffixesSchema = z.object({
  prefix: NisanyanAffixSchema.optional(),
  suffix: NisanyanAffixSchema.optional(),
});

export const NisanyanEtymologySchema = z.object({
  serverDefinedMoreIndentation: z.boolean().optional(),
  serverDefinedEndOfJoin: z.boolean().optional(),
  _id: z.string(),
  nisaid_depr: z.number().optional(),
  paranthesis: z.string(),
  relation: NisanyanRelationSchema,
  languages: z.array(NisanyanLanguageSchema),
  originalText: z.string(),
  romanizedText: z.string(),
  grammar: NisanyanGrammarSchema,
  definition: z.string(),
  neologism: z.string(),
  wordClass: NisanyanWordClassSchema,
  timeCreated: z.string().optional(),
  timeUpdated: z.string().optional(),
  affixes: NisanyanAffixesSchema.optional(),
});

export const NisanyanSourceSchema = z.object({
  _id: z.string(),
  name: z.string(),
  book: z.string(),
  editor: z.string(),
  datePublished: z.string(),
  timeCreated: z.string().optional(),
  timeUpdated: z.string().optional(),
  nisaid_depr: z.number().optional(),
  abbreviation: z.string(),
  date: z.string(),
});

export const NisanyanHistorySchema = z.object({
  _id: z.string(),
  nisaid_depr: z.number().optional(),
  excerpt: z.string(),
  definition: z.string(),
  source: NisanyanSourceSchema.optional(),
  date: z.string(),
  dateSortable: z.number(),
  quote: z.string(),
  timeCreated: z.string().optional(),
  timeUpdated: z.string().optional(),
  language: NisanyanLanguageSchema.optional(),
});

export const NisanyanWordReferenceSchema = z.object({
  _id: z.string(),
  nisaid_depr: z.number().optional(),
  name: z.string(),
  note: z.string(),
  timeCreated: z.string().optional(),
  timeUpdated: z.string().optional(),
  queries: z.array(z.string()),
  similarWords: z.array(z.string()).optional(),
  references: z.array(z.object({ _id: z.string() })),
  etymologies: z.array(z.object({ _id: z.string() })).optional(),
  histories: z.array(z.object({ _id: z.string() })),
  referenceOf: z.array(z.object({ _id: z.string(), name: z.string() })),
});

export const NisanyanReferenceSchema = z.object({
  _id: z.string(),
  nisaid_depr: z.number().optional(),
  name: z.string(),
  note: z.string(),
  timeCreated: z.string().optional(),
  timeUpdated: z.string().optional(),
  queries: z.array(z.string()),
  similarWords: z.array(z.string()).optional(),
  references: z.array(z.object({ _id: z.string() })),
  etymologies: z.array(z.object({ _id: z.string() })).optional(),
  histories: z.array(z.object({ _id: z.string() })),
  referenceOf: z.array(NisanyanWordReferenceSchema).optional(),
  alternateSpellings: z.array(z.string()).optional(),
  misspellings: z.array(z.string()).optional(),
});

export const NisanyanWordSchema = z.object({
  serverDefinedLastJoinedIndex: z.number().optional(),
  serverDefinedTitleDescription: z.string().optional(),
  serverDefinedIsMisspelling: z.boolean().optional(),
  _id: z.string(),
  etymologies: z.array(NisanyanEtymologySchema).optional(),
  histories: z.array(NisanyanHistorySchema).optional(),
  nisaid_depr: z.number().optional(),
  misspellings: z.array(z.string()).nullable().optional(),
  name: z.string(),
  note: z.string().optional(),
  queries: z.array(z.string()).optional(),
  references: z.array(NisanyanReferenceSchema).optional(),
  referenceOf: z.array(NisanyanWordReferenceSchema).optional(),
  similarWords: z.array(z.string()).nullable().optional(),
  timeCreated: z.string().optional(),
  timeUpdated: z.string().optional(),
  actualTimeUpdated: z.string().optional(),
});

export const NisanyanRelatedWordSchema = z.object({
  _id: z.string(),
  name: z.string(),
});

export const NisanyanRandomWordSchema = z.object({
  _id: z.string(),
  name: z.string(),
});

export const NisanyanGeneralResponseSchema = z.object({
  isUnsuccessful: z.boolean(),
  fiveBefore: z.array(NisanyanRelatedWordSchema),
  fiveAfter: z.array(NisanyanRelatedWordSchema),
  randomWord: NisanyanRandomWordSchema.nullable(),
});

export const NisanyanResponseSchema = NisanyanGeneralResponseSchema.extend({
  isUnsuccessful: z.literal(false),
  words: z.array(NisanyanWordSchema).optional(),
});

export const NisanyanResponseErrorSchema = z.object({
  isUnsuccessful: z.literal(true),
  error: z.unknown().optional(),
  words: z.array(NisanyanRelatedWordSchema).optional(),
  fiveBefore: z.array(NisanyanRelatedWordSchema).optional(),
  fiveAfter: z.array(NisanyanRelatedWordSchema).optional(),
  randomWord: NisanyanRandomWordSchema.optional(),
  serverDefinedErrorText: z.string().optional(),
});

export const NisanyanAffixResponseSchema = z.object({
  isUnsuccessful: z.literal(false).optional(),
  affix: NisanyanAffixSchema,
  /* words: z.array(
    NisanyanRelatedWordSchema.extend({
      serverDefinedIsMisspelling: z.boolean().optional(),
      etymologies: z.array(NisanyanEtymologySchema).optional(),
      references: z.array(NisanyanReferenceSchema),
      note: z.string().optional(),
      serverDefinedTitleDescription: z.string().optional(),
      referenceOf: z
        .array(z.object({ _id: z.string(), name: z.string() }))
        .optional(),
    }),
  ), */
  words: z.array(NisanyanWordSchema).optional(),
});

export const NisanyanAffixResponseErrorSchema = z.object({
  isUnsuccessful: z.literal(true),
  serverDefinedErrorText: z.string().optional(),
  error: z.unknown(),
  words: z.array(NisanyanRelatedWordSchema).optional(),
  fiveBefore: z.array(NisanyanRelatedWordSchema).optional(),
  fiveAfter: z.array(NisanyanRelatedWordSchema).optional(),
  randomWord: NisanyanRandomWordSchema.optional(),
});

export const NisanyanWordPackageSchema = NisanyanResponseSchema.or(
  NisanyanResponseErrorSchema,
);

export const NisanyanAffixPackageSchema = NisanyanAffixResponseSchema.or(
  NisanyanAffixResponseErrorSchema,
);

export const NisanyanPackageSchema = NisanyanWordPackageSchema.or(
  NisanyanAffixPackageSchema,
);

export type NisanyanLanguage = z.infer<typeof NisanyanLanguageSchema>;
export type NisanyanRelation = z.infer<typeof NisanyanRelationSchema>;
export type NisanyanGrammarCase = z.infer<typeof NisanyanGrammarCaseSchema>;
export type NisanyanSemiticForm = z.infer<typeof NisanyanSemiticFormSchema>;
export type NisanyanGrammar = z.infer<typeof NisanyanGrammarSchema>;
export type NisanyanWordClass = z.infer<typeof NisanyanWordClassSchema>;
export type NisanyanAffix = z.infer<typeof NisanyanAffixSchema>;
export type NisanyanAffixes = z.infer<typeof NisanyanAffixesSchema>;
export type NisanyanEtymology = z.infer<typeof NisanyanEtymologySchema>;
export type NisanyanSource = z.infer<typeof NisanyanSourceSchema>;
export type NisanyanHistory = z.infer<typeof NisanyanHistorySchema>;
export type NisanyanReference = z.infer<typeof NisanyanReferenceSchema>;
export type NisanyanWordReference = z.infer<typeof NisanyanWordReferenceSchema>;
export type NisanyanWord = z.infer<typeof NisanyanWordSchema>;
export type NisanyanRelatedWord = z.infer<typeof NisanyanRelatedWordSchema>;
export type NisanyanRandomWord = z.infer<typeof NisanyanRandomWordSchema>;
export type NisanyanGeneralResponse = z.infer<
  typeof NisanyanGeneralResponseSchema
>;
export type NisanyanResponse = z.infer<typeof NisanyanResponseSchema>;
export type NisanyanResponseError = z.infer<typeof NisanyanResponseErrorSchema>;
export type NisanyanAffixResponse = z.infer<typeof NisanyanAffixResponseSchema>;
export type NisanyanAffixResponseError = z.infer<
  typeof NisanyanAffixResponseErrorSchema
>;
export type NisanyanWordPackage = z.infer<typeof NisanyanWordPackageSchema>;
export type NisanyanAffixPackage = z.infer<typeof NisanyanAffixPackageSchema>;
export type NisanyanPackage = z.infer<typeof NisanyanPackageSchema>;

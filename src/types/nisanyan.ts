import { z } from "zod";

export const NisanyanLanguageSchema = z.object({
  _id: z.string(),
  name: z.string().optional(),
  description: z.string().optional(),
  description2: z.string().optional(),
  timeCreated: z.string().optional(),
  timeUpdated: z.string().optional(),
  abbreviation: z.string().optional(),
  id_depr: z.number().optional(),
});

export const NisanyanRelationSchema = z.object({
  _id: z.string(),
  name: z.string(),
  abbreviation: z.string(),
  text: z.string(),
});

export const NisanyanGrammarCaseSchema = z.object({
  _id: z.string(),
  order: z.number(),
  name: z.string(),
  description: z.string(),
  tooltip: z.string(),
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
  id_depr: z.number().optional(),
});

export const NisanyanAffixesSchema = z.object({
  prefix: NisanyanAffixSchema.optional(),
  suffix: NisanyanAffixSchema.optional(),
});

export const NisanyanEtymologySchema = z.object({
  serverDefinedMoreIndentation: z.boolean().optional(),
  serverDefinedEndOfJoin: z.boolean().optional(),
  _id: z.string(),
  id_depr: z.number().optional(),
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
  id_depr: z.number().optional(),
  abbreviation: z.string(),
  date: z.string(),
});

export const NisanyanHistorySchema = z.object({
  _id: z.string(),
  id_depr: z.number().optional(),
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

export const NisanyanelatedWordSchema = z.object({
  _id: z.string(),
  name: z.string(),
});

export const NisanyanWordReferenceSchema = z.object({
  _id: z.string(),
  id_depr: z.number().optional(),
  name: z.string(),
  note: z.string().optional(),
  timeCreated: z.string().optional(),
  timeUpdated: z.string().optional(),
  queries: z.array(z.string()).optional(),
  similarWords: z.array(z.string()).optional(),
  references: z
    .array(
      z.object({
        _id: z.string(),
      }),
    )
    .optional(),
  etymologies: z
    .array(
      z.object({
        _id: z.string(),
      }),
    )
    .optional(),
  histories: z.array(
    z.object({
      _id: z.string(),
    }),
  ),
  referenceOf: z.array(NisanyanelatedWordSchema).optional(),
});

export const NisanyanGeneralResponseSchema = z.object({
  serverDefinedIsGeneratedFromAffix: z.boolean().optional(),
  isUnsuccessful: z.boolean(),
  fiveBefore: z.array(NisanyanelatedWordSchema).optional(),
  fiveAfter: z.array(NisanyanelatedWordSchema).optional(),
  randomWord: NisanyanelatedWordSchema.optional(),
});

export const NisanyanResponseErrorSchema = z.object({
  isUnsuccessful: z.literal(true),
  error: z.object({}).optional(),
  words: z.array(NisanyanelatedWordSchema).optional(),
  fiveBefore: z.array(NisanyanelatedWordSchema).optional(),
  fiveAfter: z.array(NisanyanelatedWordSchema).optional(),
  randomWord: NisanyanelatedWordSchema.optional(),
  serverDefinedErrorText: z.string().optional(),
});

export const NisanyanAffixResponseErrorSchema = z.object({
  error: z.object({}),
});

export const NisanyanReferenceSchema = z.object({
  _id: z.string(),
  id_depr: z.number().optional(),
  name: z.string(),
  note: z.string().optional(),
  timeCreated: z.string().optional(),
  timeUpdated: z.string().optional(),
  queries: z.array(z.string()).optional(),
  similarWords: z.array(z.string()).optional(),
  references: z
    .array(
      z.object({
        _id: z.string(),
      }),
    )
    .optional(),
  etymologies: z
    .array(
      z.object({
        _id: z.string(),
      }),
    )
    .optional(),
  histories: z.array(
    z.object({
      _id: z.string(),
    }),
  ),
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
  id_depr: z.number().optional(),
  misspellings: z.array(z.string()).optional().nullable(),
  name: z.string(),
  note: z.string().optional(),
  queries: z.array(z.string()).optional(),
  references: z.array(NisanyanReferenceSchema).optional(),
  referenceOf: z.array(NisanyanWordReferenceSchema).optional(),
  similarWords: z.array(z.string()).optional().nullable(),
  timeCreated: z.string().optional(),
  timeUpdated: z.string().optional(),
  actualTimeUpdated: z.string().optional(),
});

export const NisanyanResponseSchema = NisanyanGeneralResponseSchema.and(
  z.object({
    isUnsuccessful: z.literal(false),
    words: z.array(NisanyanWordSchema).optional(),
  }),
);

export const NisanyanAffixResponseSchema = z.object({
  affix: NisanyanAffixSchema,
  words: z.array(NisanyanWordSchema),
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
export type NisanyanelatedWord = z.infer<typeof NisanyanelatedWordSchema>;
export type NisanyanWordReference = z.infer<typeof NisanyanWordReferenceSchema>;
export type NisanyanGeneralResponse = z.infer<
  typeof NisanyanGeneralResponseSchema
>;
export type NisanyanResponseError = z.infer<typeof NisanyanResponseErrorSchema>;
export type NisanyanAffixResponseError = z.infer<
  typeof NisanyanAffixResponseErrorSchema
>;
export type NisanyanReference = z.infer<typeof NisanyanReferenceSchema>;
export type NisanyanWord = z.infer<typeof NisanyanWordSchema>;
export type NisanyanResponse = z.infer<typeof NisanyanResponseSchema>;
export type NisanyanAffixResponse = z.infer<typeof NisanyanAffixResponseSchema>;
export type NisanyanWordPackage = z.infer<typeof NisanyanWordPackageSchema>;
export type NisanyanAffixPackage = z.infer<typeof NisanyanAffixPackageSchema>;
export type NisanyanPackage = z.infer<typeof NisanyanPackageSchema>;
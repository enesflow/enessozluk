import { z } from "zod";
import { PerformanceSchema, weakString } from "./shared";

export const NISANYAN_VERSION = "1.0.7" as const;

export const NisanyanLanguageSchema = z.object({
  // _id: z.string(),
  name: weakString(),
  // description: weakString(),
  // description2: weakString(),
  // timeCreated: weakString(),
  // timeUpdated: weakString(),
  abbreviation: weakString(),
  // id_depr: z.number().optional().nullable(),
});

export const NisanyanRelationSchema = z.object({
  // _id: z.string(),
  // name: z.string(),
  abbreviation: z.string(),
  text: z.string(),
});

export const NisanyanGrammarCaseSchema = z.object({
  // _id: z.string(),
  // order: z.number().optional().nullable(),
  // name: z.string(),
  // description: weakString(),
  // tooltip: weakString(),
});

export const NisanyanSemiticFormSchema = z.object({
  // _id: z.string(),
  // id_depr: z.number().optional().nullable(),
  // name: weakString(),
  // description: weakString(),
  // language: NisanyanLanguageSchema.optional().nullable(),
  // timeCreated: weakString(),
  // timeUpdated: weakString(),
});

export const NisanyanGrammarSchema = z.object({
  // grammaticalCase: weakString(),
  // case: z.array(NisanyanGrammarCaseSchema).optional().nullable(),
  // semiticRoot: weakString(),
  // semiticForm: NisanyanSemiticFormSchema.optional().nullable(),
});

export const NisanyanWordClassSchema = z.object({
  // _id: z.string(),
  name: z.string(),
  // description: weakString(),
  abbreviation: z.string(),
});

export const NisanyanAffixSchema = z.object({
  _id: z.string(),
  name: z.string(),
  description: weakString(),
  language: NisanyanLanguageSchema.optional().nullable(),
  timeCreated: weakString(),
  timeUpdated: weakString(),
  id_depr: z.number().optional().nullable(),
});

export const NisanyanAffixesSchema = z.object({
  prefix: NisanyanAffixSchema.optional().nullable(),
  suffix: NisanyanAffixSchema.optional().nullable(),
});

export const NisanyanEtymologySchema = z.object({
  serverDefinedMoreIndentation: z.boolean().optional().nullable(),
  serverDefinedEndOfJoin: z.boolean().optional().nullable(),
  // _id: z.string(),
  // id_depr: z.number().optional().nullable(),
  paranthesis: weakString(),
  relation: NisanyanRelationSchema,
  languages: z.array(NisanyanLanguageSchema),
  originalText: z.string(),
  romanizedText: z.string(),
  // grammar: NisanyanGrammarSchema,
  definition: z.string(),
  // neologism: weakString(),
  wordClass: NisanyanWordClassSchema,
  // timeCreated: weakString(),
  // timeUpdated: weakString(),
  affixes: NisanyanAffixesSchema.optional().nullable(),
});

export const NisanyanSourceSchema = z.object({
  // _id: z.string(),
  name: weakString(),
  book: weakString(),
  // editor: weakString(),
  // datePublished: weakString(),
  // timeCreated: weakString(),
  // timeUpdated: weakString(),
  // id_depr: z.number().optional().nullable(),
  // abbreviation: weakString(),
  // date: weakString(),
});

export const NisanyanHistorySchema = z.object({
  // _id: z.string(),
  // id_depr: z.number().optional().nullable(),
  // excerpt: weakString(),
  // definition: weakString(),
  source: NisanyanSourceSchema.optional().nullable(),
  date: z.string(),
  dateSortable: z.number().optional().nullable(),
  quote: z.string(),
  // timeCreated: weakString(),
  // timeUpdated: weakString(),
  language: NisanyanLanguageSchema.optional().nullable(),
});

export const NisanyanelatedWordSchema = z.object({
  _id: z.string(),
  name: z.string(),
});

export const NisanyanWordReferenceSchema = z.object({
  // _id: z.string(),
  // id_depr: z.number().optional().nullable(),
  name: z.string(),
  // note: weakString(),
  // timeCreated: weakString(),
  // timeUpdated: weakString(),
  // queries: z.array(z.string()).optional().nullable(),
  // similarWords: z.array(z.string()).optional().nullable(),
  // references: z
  //   .array(
  //     z.object({
  //       _id: z.string(),
  //     }),
  //   )
  //   .optional().nullable(),
  // etymologies: z
  //   .array(
  //     z.object({
  //       _id: z.string(),
  //     }),
  //   )
  //   .optional().nullable(),
  // histories: z.array(
  //   z.object({
  //     _id: z.string(),
  //   }),
  // ),
  referenceOf: z.array(NisanyanelatedWordSchema).optional().nullable(),
});

export const NisanyanGeneralResponseSchema = z.object({
  serverDefinedIsGeneratedFromAffix: z.boolean().optional().nullable(),
  isUnsuccessful: z.boolean(),
  fiveBefore: z.array(NisanyanelatedWordSchema).optional().nullable(),
  fiveAfter: z.array(NisanyanelatedWordSchema).optional().nullable(),
  randomWord: NisanyanelatedWordSchema.optional().nullable(),
  version: z.literal(NISANYAN_VERSION).default(NISANYAN_VERSION),
  perf: PerformanceSchema,
});

export const NisanyanResponseErrorSchema = z.object({
  url: z.string(),
  isUnsuccessful: z.literal(true),
  error: z.object({}).optional().nullable(),
  words: z.array(NisanyanelatedWordSchema).optional().nullable(),
  fiveBefore: z.array(NisanyanelatedWordSchema).optional().nullable(),
  fiveAfter: z.array(NisanyanelatedWordSchema).optional().nullable(),
  randomWord: NisanyanelatedWordSchema.optional().nullable(),
  serverDefinedErrorText: weakString(),
  version: z.literal(NISANYAN_VERSION).default(NISANYAN_VERSION),
  perf: PerformanceSchema,
});

export const NisanyanAffixResponseErrorSchema = z.object({
  error: z.object({}),
  version: z.literal(NISANYAN_VERSION).default(NISANYAN_VERSION),
  perf: PerformanceSchema,
});

export const NisanyanReferenceSchema = z.object({
  // _id: z.string(),
  // id_depr: z.number().optional().nullable(),
  name: z.string(),
  // note: weakString(),
  // timeCreated: weakString(),
  // timeUpdated: weakString(),
  // queries: z.array(z.string()).optional().nullable(),
  // similarWords: z.array(z.string()).optional().nullable(),
  // references: z
  //   .array(
  //     z.object({
  //       _id: z.string(),
  //     }),
  //   )
  //   .optional().nullable(),
  // etymologies: z
  //   .array(
  //     z.object({
  //       _id: z.string(),
  //     }),
  //   )
  //   .optional().nullable(),
  // histories: z.array(
  //   z.object({
  //     _id: z.string(),
  //   }),
  // ),
  // referenceOf: z.array(NisanyanWordReferenceSchema).optional().nullable(),
  // alternateSpellings: z.array(z.string()).optional().nullable(),
  // misspellings: z.array(z.string()).optional().nullable(),
});

export const NisanyanWordSchema = z.object({
  serverDefinedLastJoinedIndex: z.number().optional().nullable(),
  serverDefinedTitleDescription: weakString(),
  serverDefinedIsMisspelling: z.boolean().optional().nullable(),
  serverDefinedAffixLanguage: NisanyanLanguageSchema.optional().nullable(),
  _id: z.string(),
  etymologies: z.array(NisanyanEtymologySchema).optional().nullable(),
  histories: z.array(NisanyanHistorySchema).optional().nullable(),
  id_depr: z.number().optional().nullable(),
  misspellings: z.array(z.string()).optional().nullable(),
  name: z.string(),
  note: weakString(),
  queries: z.array(z.string()).optional().nullable(),
  references: z.array(NisanyanReferenceSchema).optional().nullable(),
  referenceOf: z.array(NisanyanWordReferenceSchema).optional().nullable(),
  similarWords: z.array(z.string()).optional().nullable(),
  timeCreated: weakString(),
  timeUpdated: weakString(),
  actualTimeUpdated: weakString(),
});

export const NisanyanResponseSchema = NisanyanGeneralResponseSchema.and(
  z.object({
    url: z.string(),
    isUnsuccessful: z.literal(false),
    words: z.array(NisanyanWordSchema).optional().nullable(),
    version: z.literal(NISANYAN_VERSION).default(NISANYAN_VERSION),
    perf: PerformanceSchema,
  }),
);

export const NisanyanAffixResponseSchema = z
  .object({
    affix: NisanyanAffixSchema,
    words: z.array(NisanyanWordSchema).optional().nullable(),
    version: z.literal(NISANYAN_VERSION).default(NISANYAN_VERSION),
    perf: PerformanceSchema,
  })
  .catchall(z.unknown());

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

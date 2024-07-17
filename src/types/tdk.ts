import { z } from "zod";

export const TDKAuthorSchema = z.object({
  yazar_id: z.string(),
  tam_adi: z.string(),
  kisa_adi: z.string(),
  ekno: z.string(),
});

export const TDKAttributeSchema = z.object({
  ozellik_id: z.string(),
  tur: z.string(),
  tam_adi: z.string(),
  kisa_adi: z.string(),
  ekno: z.string(),
});

export const TDKExampleSchema = z.object({
  ornek_id: z.string(),
  anlam_id: z.string(),
  ornek_sira: z.string(),
  ornek: z.string(),
  kac: z.string(),
  yazar_id: z.string(),
  yazar_vd: z.string(),
  yazar: TDKAuthorSchema.array().optional(),
});

export const TDKMeaningSchema = z.object({
  serverDefinedPreText: z.string().optional(),
  anlam_id: z.string(),
  madde_id: z.string(),
  anlam_sira: z.string(),
  fiil: z.string(),
  tipkes: z.string(),
  anlam: z.string(),
  anlam_html: z.string().nullable().optional(),
  gos: z.string(),
  gos_kelime: z.string(),
  gos_kultur: z.string(),
  orneklerListe: TDKExampleSchema.array().optional(),
  ozelliklerListe: TDKAttributeSchema.array().optional(),
});

export const TDKProverbSchema = z.object({
  madde_id: z.string(),
  madde: z.string(),
  on_taki: z.string().nullable().optional(),
});

export const TDKResultSchema = z.object({
  madde_id: z.string(),
  kac: z.string(),
  kelime_no: z.string(),
  cesit: z.string(),
  anlam_gor: z.string(),
  on_taki: z.string().nullable().optional(),
  on_taki_html: z.string().nullable().optional(),
  madde: z.string(),
  madde_html: z.string().nullable().optional(),
  cesit_say: z.string(),
  anlam_say: z.string(),
  taki: z.string().nullable().optional(),
  cogul_mu: z.string().nullable().optional(),
  ozel_mi: z.string().nullable().optional(),
  egik_mi: z.string().nullable().optional(),
  lisan_kodu: z.string().nullable().optional(),
  lisan: z.string().nullable().optional(),
  telaffuz_html: z.string().nullable().optional(),
  lisan_html: z.string().nullable(),
  telaffuz: z.string().nullable().optional(),
  birlesikler: z.string().nullable(),
  font: z.string().nullable().optional(),
  madde_duz: z.string(),
  gosterim_tarihi: z.string().nullable().optional(),
  anlamlarListe: TDKMeaningSchema.array().optional(),
  atasozu: TDKProverbSchema.array().optional(),
});

export const TDKRecommendationSchema = z.array(
  z.object({
    madde: z.string(),
  }),
);

export const TDKResponseErrorSchema = z.object({
  error: z.string(),
  recommendations: TDKRecommendationSchema,
});

export const TDKResponseSchema = TDKResultSchema.array();

export const TDKPackageSchema = TDKResponseSchema.or(TDKResponseErrorSchema);

export type TDKAuthor = z.infer<typeof TDKAuthorSchema>;
export type TDKAttribute = z.infer<typeof TDKAttributeSchema>;
export type TDKExample = z.infer<typeof TDKExampleSchema>;
export type TDKMeaning = z.infer<typeof TDKMeaningSchema>;
export type TDKProverb = z.infer<typeof TDKProverbSchema>;
export type TDKResult = z.infer<typeof TDKResultSchema>;
export type TDKResponse = z.infer<typeof TDKResponseSchema>;
export type TDKRecommendation = z.infer<typeof TDKRecommendationSchema>;
export type TDKResponseError = z.infer<typeof TDKResponseErrorSchema>;
export type TDKPackage = z.infer<typeof TDKPackageSchema>;

import { z } from "zod";
import { weakString } from "./shared";

export const TDKAuthorSchema = z.object({
  yazar_id: weakString(),
  tam_adi: z.string(),
  kisa_adi: weakString(),
  ekno: weakString(),
});

export const TDKAttributeSchema = z.object({
  ozellik_id: weakString(),
  tur: weakString(),
  tam_adi: weakString(),
  kisa_adi: weakString(),
  ekno: weakString(),
});

export const TDKExampleSchema = z.object({
  ornek_id: weakString(),
  anlam_id: weakString(),
  ornek_sira: weakString(),
  ornek: weakString(),
  kac: weakString(),
  yazar_id: weakString(),
  yazar_vd: weakString(),
  yazar: TDKAuthorSchema.array().optional(),
});

export const TDKMeaningSchema = z.object({
  serverDefinedPreText: z.string().optional(),
  anlam_id: weakString(),
  madde_id: weakString(),
  anlam_sira: weakString(),
  fiil: weakString(),
  tipkes: weakString(),
  anlam: z.string(),
  anlam_html: weakString(),
  gos: weakString(),
  gos_kelime: weakString(),
  gos_kultur: weakString(),
  orneklerListe: TDKExampleSchema.array().optional(),
  ozelliklerListe: TDKAttributeSchema.array().optional(),
});

export const TDKProverbSchema = z.object({
  madde_id: weakString(),
  madde: weakString(),
  on_taki: weakString(),
});

export const TDKResultSchema = z.object({
  madde_id: weakString(),
  kac: weakString(),
  kelime_no: weakString(),
  cesit: weakString(),
  anlam_gor: weakString(),
  on_taki: weakString(),
  on_taki_html: weakString(),
  madde: weakString(),
  madde_html: weakString(),
  cesit_say: weakString(),
  anlam_say: weakString(),
  taki: weakString(),
  cogul_mu: weakString(),
  ozel_mi: weakString(),
  egik_mi: weakString(),
  lisan_kodu: weakString(),
  lisan: weakString(),
  telaffuz_html: weakString(),
  lisan_html: weakString(),
  telaffuz: weakString(),
  birlesikler: weakString(),
  font: weakString(),
  madde_duz: weakString(),
  gosterim_tarihi: weakString(),
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
  url: weakString(),
});

export const TDKResponseSchema = z.object({
  meanings: TDKResultSchema.array(),
  url: weakString(),
});

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

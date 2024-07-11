type Example = {
  ornek_id: string;
  anlam_id: string;
  ornek_sira: string;
  ornek: string;
  kac: string;
  yazar_id: string;
  yazar_vd: string;
  yazar?: Author[];
};

type Author = {
  yazar_id: string;
  tam_adi: string;
  kisa_adi: string;
  ekno: string;
};

type Feature = {
  ozellik_id: string;
  tur: string;
  tam_adi: string;
  kisa_adi: string;
  ekno: string;
};

type Meaning = {
  anlam_id: string;
  madde_id: string;
  anlam_sira: string;
  fiil: string;
  tipkes: string;
  anlam: string;
  anlam_html: string;
  gos: string;
  gos_kelime: string;
  gos_kultur: string;
  orneklerListe?: Example[];
  ozelliklerListe?: Feature[];
};

type Proverb = {
  madde_id: string;
  madde: string;
  on_taki?: string | null;
};

type Result = {
  madde_id: string;
  kac: string;
  kelime_no: string;
  cesit: string;
  anlam_gor: string;
  on_taki?: string | null;
  on_taki_html?: string | null;
  madde: string;
  madde_html: string;
  cesit_say: string;
  anlam_say: string;
  taki: string;
  cogul_mu: string;
  ozel_mi: string;
  egik_mi: string;
  lisan_kodu: string;
  lisan: string;
  telaffuz_html?: string | null;
  lisan_html: string;
  telaffuz: string;
  birlesikler: string;
  font?: string | null;
  madde_duz: string;
  gosterim_tarihi?: string | null;
  anlamlarListe?: Meaning[];
  atasozu?: Proverb[];
};

export type TDKResponse = Result[];
export type TDKResponseError = {
  error: string;
  recommendations: { madde: string }[];
};

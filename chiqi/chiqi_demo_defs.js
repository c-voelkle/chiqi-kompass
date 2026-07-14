// Automatisch generiert von extract_chiqi_v55.py. Nicht von Hand editieren.
// Quelle: BAG, CH-IQI Spezifikationen Version 5.5 - 2024 (QIP24, Stand 14.04.2026, 18. Ausgabe)
window.CHIQI_DEMO = {
 "meta": {
  "quelle": "BAG, CH-IQI Spezifikationen Version 5.5 - 2024 (QIP24, Stand 14.04.2026, 18. Ausgabe)",
  "chiqiVersion": "5.5",
  "datenjahr": 2024,
  "anzahlSql": 1139,
  "anzahlFilter": 1182,
  "aufloesungsfehler": 0,
  "hinweis": "sCHIQI: SQL-Dialekt wie v5.2 (LEFT, InStr, IN, BETWEEN, IS NULL, =,<>,AND,OR,NOT). fCHIQI: R-Dialekt (str_detect, %between%, %in%, is.na); Listen-Namen via \"lists\" binden. sCHIQI wird vom BAG nicht mehr gepflegt, ab Folgeversion nur noch fCHIQI."
 },
 "indicators": [
  {
   "id": "A1_01",
   "label": "HD Herzinfarkt (Alter >19), Mortalität",
   "sqlF": "LEFT(HD,3) IN ('I21','I22') AND AltE>19",
   "sqlM": "(LEFT(HD,3) IN ('I21','I22') AND AltE>19) AND EAus=5",
   "richtung": "tiefer_besser",
   "typ": "Mortalität",
   "refJahr": 2024,
   "refStrata": [
    {
     "jahr": 2024,
     "altEGrp": 5,
     "sex": 1,
     "pCH": 0.0
    },
    {
     "jahr": 2024,
     "altEGrp": 5,
     "sex": 2,
     "pCH": 0.0
    },
    {
     "jahr": 2024,
     "altEGrp": 6,
     "sex": 1,
     "pCH": 0.0
    },
    {
     "jahr": 2024,
     "altEGrp": 6,
     "sex": 2,
     "pCH": 0.0
    },
    {
     "jahr": 2024,
     "altEGrp": 7,
     "sex": 1,
     "pCH": 0.0212766
    },
    {
     "jahr": 2024,
     "altEGrp": 7,
     "sex": 2,
     "pCH": 0.0
    },
    {
     "jahr": 2024,
     "altEGrp": 8,
     "sex": 1,
     "pCH": 0.007352941
    },
    {
     "jahr": 2024,
     "altEGrp": 8,
     "sex": 2,
     "pCH": 0.0
    },
    {
     "jahr": 2024,
     "altEGrp": 9,
     "sex": 1,
     "pCH": 0.005602241
    },
    {
     "jahr": 2024,
     "altEGrp": 9,
     "sex": 2,
     "pCH": 0.0
    },
    {
     "jahr": 2024,
     "altEGrp": 10,
     "sex": 1,
     "pCH": 0.01267829
    },
    {
     "jahr": 2024,
     "altEGrp": 10,
     "sex": 2,
     "pCH": 0.0
    },
    {
     "jahr": 2024,
     "altEGrp": 11,
     "sex": 1,
     "pCH": 0.01088032
    },
    {
     "jahr": 2024,
     "altEGrp": 11,
     "sex": 2,
     "pCH": 0.01
    },
    {
     "jahr": 2024,
     "altEGrp": 12,
     "sex": 1,
     "pCH": 0.01251647
    },
    {
     "jahr": 2024,
     "altEGrp": 12,
     "sex": 2,
     "pCH": 0.01875
    },
    {
     "jahr": 2024,
     "altEGrp": 13,
     "sex": 1,
     "pCH": 0.01542857
    },
    {
     "jahr": 2024,
     "altEGrp": 13,
     "sex": 2,
     "pCH": 0.01782178
    },
    {
     "jahr": 2024,
     "altEGrp": 14,
     "sex": 1,
     "pCH": 0.02654232
    },
    {
     "jahr": 2024,
     "altEGrp": 14,
     "sex": 2,
     "pCH": 0.0341556
    },
    {
     "jahr": 2024,
     "altEGrp": 15,
     "sex": 1,
     "pCH": 0.02440725
    },
    {
     "jahr": 2024,
     "altEGrp": 15,
     "sex": 2,
     "pCH": 0.02903226
    },
    {
     "jahr": 2024,
     "altEGrp": 16,
     "sex": 1,
     "pCH": 0.04787593
    },
    {
     "jahr": 2024,
     "altEGrp": 16,
     "sex": 2,
     "pCH": 0.04380476
    },
    {
     "jahr": 2024,
     "altEGrp": 17,
     "sex": 1,
     "pCH": 0.06109614
    },
    {
     "jahr": 2024,
     "altEGrp": 17,
     "sex": 2,
     "pCH": 0.06504065
    },
    {
     "jahr": 2024,
     "altEGrp": 18,
     "sex": 1,
     "pCH": 0.1145511
    },
    {
     "jahr": 2024,
     "altEGrp": 18,
     "sex": 2,
     "pCH": 0.09745127
    },
    {
     "jahr": 2024,
     "altEGrp": 19,
     "sex": 1,
     "pCH": 0.1368821
    },
    {
     "jahr": 2024,
     "altEGrp": 19,
     "sex": 2,
     "pCH": 0.1569231
    },
    {
     "jahr": 2024,
     "altEGrp": 20,
     "sex": 1,
     "pCH": 0.1428571
    },
    {
     "jahr": 2024,
     "altEGrp": 20,
     "sex": 2,
     "pCH": 0.1851852
    }
   ],
   "glm": {
    "2022": [
     {
      "term": "(Intercept)",
      "text": "",
      "spec": "",
      "estimate": -9.67809637695411
     },
     {
      "term": "rG_alte",
      "text": "Alter in Jahren",
      "spec": "AltE %in% s_alte",
      "estimate": 0.081663501356558
     },
     {
      "term": "rG_sex",
      "text": "Weibliches Geschlecht",
      "spec": "Sex %in% s_sex",
      "estimate": 0.103266723282751
     },
     {
      "term": "rG_avor",
      "text": "Zuverlegung aus anderem Krankenhaus",
      "spec": "AVor %in% s_avor",
      "estimate": -0.222914438492214
     },
     {
      "term": "rG_stemi",
      "text": "HD STEMI",
      "spec": "str_detect(HD,'I210|I211|I212|I213')",
      "estimate": 0.686121098089642
     },
     {
      "term": "rG_rez",
      "text": "HD rezidivierender AMI",
      "spec": "str_detect(HD,'I22')",
      "estimate": 1.11806375695726
     },
     {
      "term": "rG_ksch",
      "text": "ND kardiogener Schock",
      "spec": "str_detect(NebDia,'R570')",
      "estimate": 3.29958085721243
     },
     {
      "term": "rG_hypt",
      "text": "Hypertonie (ohne Herz- oder Niereninsuffizienz)",
      "spec": "str_detect(NebDia,'I10|I119|I129|I139|I15')",
      "estimate": -0.743672607717409
     },
     {
      "term": "rG_diab",
      "text": "Diabetes mellitus",
      "spec": "str_detect(NebDia,'E10|E11|E12|E13|E14')",
      "estimate": 0.0170959799957788
     },
     {
      "term": "rG_ca",
      "text": "Bösartige Neubildung",
      "spec": "str_detect(AllDia,'C')",
      "estimate": 0.689946559525968
     },
     {
      "term": "rG_vit",
      "text": "Aorten-/Mitralklappenvitien",
      "spec": "str_detect(NebDia,'I050|I051|I052|I060|I061|I062|I340|I342|I350|I351|I352|Q230|Q231|Q232|Q233')",
      "estimate": -0.081517576597163
     },
     {
      "term": "rG_lung",
      "text": "Chronische Lungenerkrankung",
      "spec": "str_detect(NebDia,'J41|J42|J44|J45|J47')",
      "estimate": 0.110779018839024
     },
     {
      "term": "rG_leb",
      "text": "Chronische Lebererkrankung",
      "spec": "str_detect(NebDia,'B18|I864|I982|K70|K73|K74|K760|K761|K765|K766|K767|Q446|Q447')",
      "estimate": 0.927268705821583
     },
     {
      "term": "rG_nins",
      "text": "Chronische Niereninsuffizienz",
      "spec": "str_detect(NebDia,'I120|I131|I132|N18|N19|Z992')",
      "estimate": 0.0618925005046206
     }
    ],
    "2023": [
     {
      "term": "(Intercept)",
      "text": "",
      "spec": "",
      "estimate": -9.54453317634469
     },
     {
      "term": "rG_alte",
      "text": "Alter in Jahren",
      "spec": "AltE %in% s_alte",
      "estimate": 0.0788513480797645
     },
     {
      "term": "rG_sex",
      "text": "Weibliches Geschlecht",
      "spec": "Sex %in% s_sex",
      "estimate": 0.0809268652796084
     },
     {
      "term": "rG_avor",
      "text": "Zuverlegung aus anderem Krankenhaus",
      "spec": "AVor %in% s_avor",
      "estimate": -0.211089951827553
     },
     {
      "term": "rG_stemi",
      "text": "HD STEMI",
      "spec": "str_detect(HD,'I210|I211|I212|I213')",
      "estimate": 0.744513158147679
     },
     {
      "term": "rG_rez",
      "text": "HD rezidivierender AMI",
      "spec": "str_detect(HD,'I22')",
      "estimate": -0.675019758389128
     },
     {
      "term": "rG_ksch",
      "text": "ND kardiogener Schock",
      "spec": "str_detect(NebDia,'R570')",
      "estimate": 3.00325850635602
     },
     {
      "term": "rG_hypt",
      "text": "Hypertonie (ohne Herz- oder Niereninsuffizienz)",
      "spec": "str_detect(NebDia,'I10|I119|I129|I139|I15')",
      "estimate": -0.715131155860523
     },
     {
      "term": "rG_diab",
      "text": "Diabetes mellitus",
      "spec": "str_detect(NebDia,'E10|E11|E12|E13|E14')",
      "estimate": 0.0936583565424086
     },
     {
      "term": "rG_ca",
      "text": "Bösartige Neubildung",
      "spec": "str_detect(AllDia,'C')",
      "estimate": 0.668769454619922
     },
     {
      "term": "rG_vit",
      "text": "Aorten-/Mitralklappenvitien",
      "spec": "str_detect(NebDia,'I050|I051|I052|I060|I061|I062|I340|I342|I350|I351|I352|Q230|Q231|Q232|Q233')",
      "estimate": 0.312161945285243
     },
     {
      "term": "rG_lung",
      "text": "Chronische Lungenerkrankung",
      "spec": "str_detect(NebDia,'J41|J42|J44|J45|J47')",
      "estimate": 0.0680464464975256
     },
     {
      "term": "rG_leb",
      "text": "Chronische Lebererkrankung",
      "spec": "str_detect(NebDia,'B18|I864|I982|K70|K73|K74|K760|K761|K765|K766|K767|Q446|Q447')",
      "estimate": -0.334799766493318
     },
     {
      "term": "rG_nins",
      "text": "Chronische Niereninsuffizienz",
      "spec": "str_detect(NebDia,'I120|I131|I132|N18|N19|Z992')",
      "estimate": 0.00611981542032745
     }
    ],
    "2024": [
     {
      "term": "(Intercept)",
      "text": "",
      "spec": "",
      "estimate": -9.61785090795541
     },
     {
      "term": "rG_alte",
      "text": "Alter in Jahren",
      "spec": "AltE %in% s_alte",
      "estimate": 0.0789074209266212
     },
     {
      "term": "rG_sex",
      "text": "Weibliches Geschlecht",
      "spec": "Sex %in% s_sex",
      "estimate": 0.0981391670556333
     },
     {
      "term": "rG_avor",
      "text": "Zuverlegung aus anderem Krankenhaus",
      "spec": "AVor %in% s_avor",
      "estimate": -0.331539090028944
     },
     {
      "term": "rG_stemi",
      "text": "HD STEMI",
      "spec": "str_detect(HD,'I210|I211|I212|I213')",
      "estimate": 0.981109070790734
     },
     {
      "term": "rG_rez",
      "text": "HD rezidivierender AMI",
      "spec": "str_detect(HD,'I22')",
      "estimate": 0.890203015262526
     },
     {
      "term": "rG_ksch",
      "text": "ND kardiogener Schock",
      "spec": "str_detect(NebDia,'R570')",
      "estimate": 2.94830274849789
     },
     {
      "term": "rG_hypt",
      "text": "Hypertonie (ohne Herz- oder Niereninsuffizienz)",
      "spec": "str_detect(NebDia,'I10|I119|I129|I139|I15')",
      "estimate": -0.809996123555458
     },
     {
      "term": "rG_diab",
      "text": "Diabetes mellitus",
      "spec": "str_detect(NebDia,'E10|E11|E12|E13|E14')",
      "estimate": -0.238697865761364
     },
     {
      "term": "rG_ca",
      "text": "Bösartige Neubildung",
      "spec": "str_detect(AllDia,'C')",
      "estimate": 0.485582653244384
     },
     {
      "term": "rG_vit",
      "text": "Aorten-/Mitralklappenvitien",
      "spec": "str_detect(NebDia,'I050|I051|I052|I060|I061|I062|I340|I342|I350|I351|I352|Q230|Q231|Q232|Q233')",
      "estimate": 0.262545850996548
     },
     {
      "term": "rG_lung",
      "text": "Chronische Lungenerkrankung",
      "spec": "str_detect(NebDia,'J41|J42|J44|J45|J47')",
      "estimate": -0.120201013534032
     },
     {
      "term": "rG_leb",
      "text": "Chronische Lebererkrankung",
      "spec": "str_detect(NebDia,'B18|I864|I982|K70|K73|K74|K760|K761|K765|K766|K767|Q446|Q447')",
      "estimate": 0.185373578129212
     },
     {
      "term": "rG_nins",
      "text": "Chronische Niereninsuffizienz",
      "spec": "str_detect(NebDia,'I120|I131|I132|N18|N19|Z992')",
      "estimate": 0.202428221141935
     }
    ]
   }
  },
  {
   "id": "B1_01",
   "label": "HD Schlaganfall ohne Tumor oder Kopfverletzung (Alter >19), Mortalität",
   "sqlF": "(LEFT(HD,3) IN ('I60','I61','I63','I64')) AND AltE>19 AND NOT ((InStr(NebDia,'C700')>0 OR InStr(NebDia,'C709')>0 OR InStr(NebDia,'C71')>0 OR InStr(NebDia,'C728')>0 OR InStr(NebDia,'C729')>0 OR InStr(NebDia,'C793')>0 OR InStr(NebDia,'D320')>0 OR InStr(NebDia,'D329')>0 OR InStr(NebDia,'D330')>0 OR InStr(NebDia,'D331')>0 OR InStr(NebDia,'D332')>0 OR InStr(NebDia,'D337')>0 OR InStr(NebDia,'D339')>0 OR InStr(NebDia,'S06')>0 OR InStr(NebDia,'S07')>0 OR InStr(NebDia,'S08')>0 OR InStr(NebDia,'S09')>0))",
   "sqlM": "((LEFT(HD,3) IN ('I60','I61','I63','I64')) AND AltE>19 AND NOT ((InStr(NebDia,'C700')>0 OR InStr(NebDia,'C709')>0 OR InStr(NebDia,'C71')>0 OR InStr(NebDia,'C728')>0 OR InStr(NebDia,'C729')>0 OR InStr(NebDia,'C793')>0 OR InStr(NebDia,'D320')>0 OR InStr(NebDia,'D329')>0 OR InStr(NebDia,'D330')>0 OR InStr(NebDia,'D331')>0 OR InStr(NebDia,'D332')>0 OR InStr(NebDia,'D337')>0 OR InStr(NebDia,'D339')>0 OR InStr(NebDia,'S06')>0 OR InStr(NebDia,'S07')>0 OR InStr(NebDia,'S08')>0 OR InStr(NebDia,'S09')>0))) AND EAus=5",
   "richtung": "tiefer_besser",
   "typ": "Mortalität",
   "refJahr": 2024,
   "refStrata": [
    {
     "jahr": 2024,
     "altEGrp": 5,
     "sex": 1,
     "pCH": 0.05263158
    },
    {
     "jahr": 2024,
     "altEGrp": 5,
     "sex": 2,
     "pCH": 0.0
    },
    {
     "jahr": 2024,
     "altEGrp": 6,
     "sex": 1,
     "pCH": 0.0
    },
    {
     "jahr": 2024,
     "altEGrp": 6,
     "sex": 2,
     "pCH": 0.02272727
    },
    {
     "jahr": 2024,
     "altEGrp": 7,
     "sex": 1,
     "pCH": 0.08333333
    },
    {
     "jahr": 2024,
     "altEGrp": 7,
     "sex": 2,
     "pCH": 0.0
    },
    {
     "jahr": 2024,
     "altEGrp": 8,
     "sex": 1,
     "pCH": 0.007407407
    },
    {
     "jahr": 2024,
     "altEGrp": 8,
     "sex": 2,
     "pCH": 0.0
    },
    {
     "jahr": 2024,
     "altEGrp": 9,
     "sex": 1,
     "pCH": 0.0257732
    },
    {
     "jahr": 2024,
     "altEGrp": 9,
     "sex": 2,
     "pCH": 0.05217391
    },
    {
     "jahr": 2024,
     "altEGrp": 10,
     "sex": 1,
     "pCH": 0.01461988
    },
    {
     "jahr": 2024,
     "altEGrp": 10,
     "sex": 2,
     "pCH": 0.03056769
    },
    {
     "jahr": 2024,
     "altEGrp": 11,
     "sex": 1,
     "pCH": 0.01518027
    },
    {
     "jahr": 2024,
     "altEGrp": 11,
     "sex": 2,
     "pCH": 0.03146853
    },
    {
     "jahr": 2024,
     "altEGrp": 12,
     "sex": 1,
     "pCH": 0.02209302
    },
    {
     "jahr": 2024,
     "altEGrp": 12,
     "sex": 2,
     "pCH": 0.03517588
    },
    {
     "jahr": 2024,
     "altEGrp": 13,
     "sex": 1,
     "pCH": 0.03161698
    },
    {
     "jahr": 2024,
     "altEGrp": 13,
     "sex": 2,
     "pCH": 0.03185841
    },
    {
     "jahr": 2024,
     "altEGrp": 14,
     "sex": 1,
     "pCH": 0.03037975
    },
    {
     "jahr": 2024,
     "altEGrp": 14,
     "sex": 2,
     "pCH": 0.05271318
    },
    {
     "jahr": 2024,
     "altEGrp": 15,
     "sex": 1,
     "pCH": 0.04600142
    },
    {
     "jahr": 2024,
     "altEGrp": 15,
     "sex": 2,
     "pCH": 0.06640238
    },
    {
     "jahr": 2024,
     "altEGrp": 16,
     "sex": 1,
     "pCH": 0.07466063
    },
    {
     "jahr": 2024,
     "altEGrp": 16,
     "sex": 2,
     "pCH": 0.08055152
    },
    {
     "jahr": 2024,
     "altEGrp": 17,
     "sex": 1,
     "pCH": 0.07216495
    },
    {
     "jahr": 2024,
     "altEGrp": 17,
     "sex": 2,
     "pCH": 0.1065623
    },
    {
     "jahr": 2024,
     "altEGrp": 18,
     "sex": 1,
     "pCH": 0.1159154
    },
    {
     "jahr": 2024,
     "altEGrp": 18,
     "sex": 2,
     "pCH": 0.1239726
    },
    {
     "jahr": 2024,
     "altEGrp": 19,
     "sex": 1,
     "pCH": 0.129979
    },
    {
     "jahr": 2024,
     "altEGrp": 19,
     "sex": 2,
     "pCH": 0.1388889
    },
    {
     "jahr": 2024,
     "altEGrp": 20,
     "sex": 1,
     "pCH": 0.2375
    },
    {
     "jahr": 2024,
     "altEGrp": 20,
     "sex": 2,
     "pCH": 0.1796117
    }
   ]
  },
  {
   "id": "D1_01",
   "label": "HD Pneumonie, Mortalität",
   "sqlF": "(LEFT(HD,4) IN ('A481','J100','J110') OR LEFT(HD,3) IN ('J12','J13','J14','J15','J16','J17','J18','J69'))",
   "sqlM": "((LEFT(HD,4) IN ('A481','J100','J110') OR LEFT(HD,3) IN ('J12','J13','J14','J15','J16','J17','J18','J69'))) AND EAus=5",
   "richtung": "tiefer_besser",
   "typ": "Mortalität",
   "refJahr": 2024,
   "refStrata": [
    {
     "jahr": 2024,
     "altEGrp": 1,
     "sex": 1,
     "pCH": 0.0
    },
    {
     "jahr": 2024,
     "altEGrp": 1,
     "sex": 2,
     "pCH": 0.0
    },
    {
     "jahr": 2024,
     "altEGrp": 2,
     "sex": 1,
     "pCH": 0.00166113
    },
    {
     "jahr": 2024,
     "altEGrp": 2,
     "sex": 2,
     "pCH": 0.0
    },
    {
     "jahr": 2024,
     "altEGrp": 3,
     "sex": 1,
     "pCH": 0.0
    },
    {
     "jahr": 2024,
     "altEGrp": 3,
     "sex": 2,
     "pCH": 0.0
    },
    {
     "jahr": 2024,
     "altEGrp": 4,
     "sex": 1,
     "pCH": 0.01754386
    },
    {
     "jahr": 2024,
     "altEGrp": 4,
     "sex": 2,
     "pCH": 0.0
    },
    {
     "jahr": 2024,
     "altEGrp": 5,
     "sex": 1,
     "pCH": 0.00896861
    },
    {
     "jahr": 2024,
     "altEGrp": 5,
     "sex": 2,
     "pCH": 0.005208333
    },
    {
     "jahr": 2024,
     "altEGrp": 6,
     "sex": 1,
     "pCH": 0.003968254
    },
    {
     "jahr": 2024,
     "altEGrp": 6,
     "sex": 2,
     "pCH": 0.0
    },
    {
     "jahr": 2024,
     "altEGrp": 7,
     "sex": 1,
     "pCH": 0.00619195
    },
    {
     "jahr": 2024,
     "altEGrp": 7,
     "sex": 2,
     "pCH": 0.01294498
    },
    {
     "jahr": 2024,
     "altEGrp": 8,
     "sex": 1,
     "pCH": 0.0136612
    },
    {
     "jahr": 2024,
     "altEGrp": 8,
     "sex": 2,
     "pCH": 0.0
    },
    {
     "jahr": 2024,
     "altEGrp": 9,
     "sex": 1,
     "pCH": 0.004545455
    },
    {
     "jahr": 2024,
     "altEGrp": 9,
     "sex": 2,
     "pCH": 0.006224066
    },
    {
     "jahr": 2024,
     "altEGrp": 10,
     "sex": 1,
     "pCH": 0.01318681
    },
    {
     "jahr": 2024,
     "altEGrp": 10,
     "sex": 2,
     "pCH": 0.006651885
    },
    {
     "jahr": 2024,
     "altEGrp": 11,
     "sex": 1,
     "pCH": 0.01584507
    },
    {
     "jahr": 2024,
     "altEGrp": 11,
     "sex": 2,
     "pCH": 0.0158371
    },
    {
     "jahr": 2024,
     "altEGrp": 12,
     "sex": 1,
     "pCH": 0.01152074
    },
    {
     "jahr": 2024,
     "altEGrp": 12,
     "sex": 2,
     "pCH": 0.01649175
    },
    {
     "jahr": 2024,
     "altEGrp": 13,
     "sex": 1,
     "pCH": 0.02447869
    },
    {
     "jahr": 2024,
     "altEGrp": 13,
     "sex": 2,
     "pCH": 0.01623377
    },
    {
     "jahr": 2024,
     "altEGrp": 14,
     "sex": 1,
     "pCH": 0.03485255
    },
    {
     "jahr": 2024,
     "altEGrp": 14,
     "sex": 2,
     "pCH": 0.02192639
    },
    {
     "jahr": 2024,
     "altEGrp": 15,
     "sex": 1,
     "pCH": 0.0331825
    },
    {
     "jahr": 2024,
     "altEGrp": 15,
     "sex": 2,
     "pCH": 0.03573883
    },
    {
     "jahr": 2024,
     "altEGrp": 16,
     "sex": 1,
     "pCH": 0.05267265
    },
    {
     "jahr": 2024,
     "altEGrp": 16,
     "sex": 2,
     "pCH": 0.04155708
    },
    {
     "jahr": 2024,
     "altEGrp": 17,
     "sex": 1,
     "pCH": 0.06591815
    },
    {
     "jahr": 2024,
     "altEGrp": 17,
     "sex": 2,
     "pCH": 0.04930192
    },
    {
     "jahr": 2024,
     "altEGrp": 18,
     "sex": 1,
     "pCH": 0.08437906
    },
    {
     "jahr": 2024,
     "altEGrp": 18,
     "sex": 2,
     "pCH": 0.06692161
    },
    {
     "jahr": 2024,
     "altEGrp": 19,
     "sex": 1,
     "pCH": 0.1145997
    },
    {
     "jahr": 2024,
     "altEGrp": 19,
     "sex": 2,
     "pCH": 0.09885057
    },
    {
     "jahr": 2024,
     "altEGrp": 20,
     "sex": 1,
     "pCH": 0.1369863
    },
    {
     "jahr": 2024,
     "altEGrp": 20,
     "sex": 2,
     "pCH": 0.1323829
    }
   ]
  }
 ]
};

// Automatisch generiert von extract_chiqi_sql.py — nicht von Hand editieren.
// Quelle: BAG, SQL Strings CH-IQI Version 5.2 - 2020 (QIP20, Stand 30.03.2022)
window.CHIQI_DEMO = {
 "meta": {
  "quelle": "BAG, SQL Strings CH-IQI Version 5.2 - 2020 (QIP20, Stand 30.03.2022)",
  "chiqiVersion": "5.2",
  "datenjahr": 2020,
  "anzahlDefinitionen": 891,
  "aufloesungsfehler": 0,
  "hinweis": "Automatisch extrahiert; SQL-Dialekt: LEFT, InStr, IN, BETWEEN, IS NULL, =,<>,<,>,AND,OR,NOT"
 },
 "indicators": [
  {
   "id": "A1_01",
   "label": "HD Herzinfarkt (Alter >19), Mortalität",
   "sqlF": "LEFT(HD,3) IN ('I21','I22') AND AltE>19",
   "sqlM": "( LEFT(HD,3) IN ('I21','I22') AND AltE>19 ) AND EAus=5",
   "richtung": "tiefer_besser",
   "typ": "Mortalität",
   "refJahr": 2020,
   "refStrata": [
    {
     "jahr": 2020,
     "altEGrp": 5,
     "sex": 1,
     "pCH": 0.0
    },
    {
     "jahr": 2020,
     "altEGrp": 6,
     "sex": 1,
     "pCH": 0.0
    },
    {
     "jahr": 2020,
     "altEGrp": 6,
     "sex": 2,
     "pCH": 0.0
    },
    {
     "jahr": 2020,
     "altEGrp": 7,
     "sex": 1,
     "pCH": 0.0
    },
    {
     "jahr": 2020,
     "altEGrp": 7,
     "sex": 2,
     "pCH": 0.0
    },
    {
     "jahr": 2020,
     "altEGrp": 8,
     "sex": 1,
     "pCH": 0.01503759
    },
    {
     "jahr": 2020,
     "altEGrp": 8,
     "sex": 2,
     "pCH": 0.04255319
    },
    {
     "jahr": 2020,
     "altEGrp": 9,
     "sex": 1,
     "pCH": 0.01016949
    },
    {
     "jahr": 2020,
     "altEGrp": 9,
     "sex": 2,
     "pCH": 0.0
    },
    {
     "jahr": 2020,
     "altEGrp": 10,
     "sex": 1,
     "pCH": 0.01587302
    },
    {
     "jahr": 2020,
     "altEGrp": 10,
     "sex": 2,
     "pCH": 0.01694915
    },
    {
     "jahr": 2020,
     "altEGrp": 11,
     "sex": 1,
     "pCH": 0.01782683
    },
    {
     "jahr": 2020,
     "altEGrp": 11,
     "sex": 2,
     "pCH": 0.004329004
    },
    {
     "jahr": 2020,
     "altEGrp": 12,
     "sex": 1,
     "pCH": 0.01564537
    },
    {
     "jahr": 2020,
     "altEGrp": 12,
     "sex": 2,
     "pCH": 0.01142857
    },
    {
     "jahr": 2020,
     "altEGrp": 13,
     "sex": 1,
     "pCH": 0.02416357
    },
    {
     "jahr": 2020,
     "altEGrp": 13,
     "sex": 2,
     "pCH": 0.0175
    },
    {
     "jahr": 2020,
     "altEGrp": 14,
     "sex": 1,
     "pCH": 0.02792553
    },
    {
     "jahr": 2020,
     "altEGrp": 14,
     "sex": 2,
     "pCH": 0.01935484
    },
    {
     "jahr": 2020,
     "altEGrp": 15,
     "sex": 1,
     "pCH": 0.04005168
    },
    {
     "jahr": 2020,
     "altEGrp": 15,
     "sex": 2,
     "pCH": 0.02761628
    },
    {
     "jahr": 2020,
     "altEGrp": 16,
     "sex": 1,
     "pCH": 0.05539773
    },
    {
     "jahr": 2020,
     "altEGrp": 16,
     "sex": 2,
     "pCH": 0.05630355
    },
    {
     "jahr": 2020,
     "altEGrp": 17,
     "sex": 1,
     "pCH": 0.0802583
    },
    {
     "jahr": 2020,
     "altEGrp": 17,
     "sex": 2,
     "pCH": 0.0777512
    },
    {
     "jahr": 2020,
     "altEGrp": 18,
     "sex": 1,
     "pCH": 0.09602195
    },
    {
     "jahr": 2020,
     "altEGrp": 18,
     "sex": 2,
     "pCH": 0.1266568
    },
    {
     "jahr": 2020,
     "altEGrp": 19,
     "sex": 1,
     "pCH": 0.1642512
    },
    {
     "jahr": 2020,
     "altEGrp": 19,
     "sex": 2,
     "pCH": 0.1861314
    },
    {
     "jahr": 2020,
     "altEGrp": 20,
     "sex": 1,
     "pCH": 0.1891892
    },
    {
     "jahr": 2020,
     "altEGrp": 20,
     "sex": 2,
     "pCH": 0.2168675
    }
   ]
  },
  {
   "id": "B1_01",
   "label": "HD Schlaganfall alle Formen (Alter >19), Mortalität",
   "sqlF": "LEFT(HD,3) IN ('I60','I61','I63','I64') AND AltE>19",
   "sqlM": "( LEFT(HD,3) IN ('I60','I61','I63','I64') AND AltE>19 ) AND EAus=5",
   "richtung": "tiefer_besser",
   "typ": "Mortalität",
   "refJahr": 2020,
   "refStrata": [
    {
     "jahr": 2020,
     "altEGrp": 5,
     "sex": 1,
     "pCH": 0.025
    },
    {
     "jahr": 2020,
     "altEGrp": 5,
     "sex": 2,
     "pCH": 0.0
    },
    {
     "jahr": 2020,
     "altEGrp": 6,
     "sex": 1,
     "pCH": 0.03846154
    },
    {
     "jahr": 2020,
     "altEGrp": 6,
     "sex": 2,
     "pCH": 0.025
    },
    {
     "jahr": 2020,
     "altEGrp": 7,
     "sex": 1,
     "pCH": 0.03174603
    },
    {
     "jahr": 2020,
     "altEGrp": 7,
     "sex": 2,
     "pCH": 0.02666667
    },
    {
     "jahr": 2020,
     "altEGrp": 8,
     "sex": 1,
     "pCH": 0.01818182
    },
    {
     "jahr": 2020,
     "altEGrp": 8,
     "sex": 2,
     "pCH": 0.04878049
    },
    {
     "jahr": 2020,
     "altEGrp": 9,
     "sex": 1,
     "pCH": 0.03846154
    },
    {
     "jahr": 2020,
     "altEGrp": 9,
     "sex": 2,
     "pCH": 0.0
    },
    {
     "jahr": 2020,
     "altEGrp": 10,
     "sex": 1,
     "pCH": 0.01445087
    },
    {
     "jahr": 2020,
     "altEGrp": 10,
     "sex": 2,
     "pCH": 0.03888889
    },
    {
     "jahr": 2020,
     "altEGrp": 11,
     "sex": 1,
     "pCH": 0.01386482
    },
    {
     "jahr": 2020,
     "altEGrp": 11,
     "sex": 2,
     "pCH": 0.05782313
    },
    {
     "jahr": 2020,
     "altEGrp": 12,
     "sex": 1,
     "pCH": 0.02983294
    },
    {
     "jahr": 2020,
     "altEGrp": 12,
     "sex": 2,
     "pCH": 0.04273504
    },
    {
     "jahr": 2020,
     "altEGrp": 13,
     "sex": 1,
     "pCH": 0.03256705
    },
    {
     "jahr": 2020,
     "altEGrp": 13,
     "sex": 2,
     "pCH": 0.05531915
    },
    {
     "jahr": 2020,
     "altEGrp": 14,
     "sex": 1,
     "pCH": 0.03525046
    },
    {
     "jahr": 2020,
     "altEGrp": 14,
     "sex": 2,
     "pCH": 0.0658083
    },
    {
     "jahr": 2020,
     "altEGrp": 15,
     "sex": 1,
     "pCH": 0.03954802
    },
    {
     "jahr": 2020,
     "altEGrp": 15,
     "sex": 2,
     "pCH": 0.07322176
    },
    {
     "jahr": 2020,
     "altEGrp": 16,
     "sex": 1,
     "pCH": 0.0617207
    },
    {
     "jahr": 2020,
     "altEGrp": 16,
     "sex": 2,
     "pCH": 0.08667152
    },
    {
     "jahr": 2020,
     "altEGrp": 17,
     "sex": 1,
     "pCH": 0.09733894
    },
    {
     "jahr": 2020,
     "altEGrp": 17,
     "sex": 2,
     "pCH": 0.09108159
    },
    {
     "jahr": 2020,
     "altEGrp": 18,
     "sex": 1,
     "pCH": 0.1221441
    },
    {
     "jahr": 2020,
     "altEGrp": 18,
     "sex": 2,
     "pCH": 0.1114754
    },
    {
     "jahr": 2020,
     "altEGrp": 19,
     "sex": 1,
     "pCH": 0.1736842
    },
    {
     "jahr": 2020,
     "altEGrp": 19,
     "sex": 2,
     "pCH": 0.1778351
    },
    {
     "jahr": 2020,
     "altEGrp": 20,
     "sex": 1,
     "pCH": 0.2054795
    },
    {
     "jahr": 2020,
     "altEGrp": 20,
     "sex": 2,
     "pCH": 0.1897436
    }
   ]
  },
  {
   "id": "D1_01",
   "label": "HD Pneumonie, Mortalität",
   "sqlF": "(LEFT(HD,4) IN ('A481','J100','J110') OR LEFT(HD,3) IN ('J12','J13','J14','J15','J16','J17','J18','J69'))",
   "sqlM": "( (LEFT(HD,4) IN ('A481','J100','J110') OR LEFT(HD,3) IN ('J12','J13','J14','J15','J16','J17','J18','J69')) ) AND EAus=5",
   "richtung": "tiefer_besser",
   "typ": "Mortalität",
   "refJahr": 2020,
   "refStrata": [
    {
     "jahr": 2020,
     "altEGrp": 1,
     "sex": 1,
     "pCH": 0.002352941
    },
    {
     "jahr": 2020,
     "altEGrp": 1,
     "sex": 2,
     "pCH": 0.005208333
    },
    {
     "jahr": 2020,
     "altEGrp": 2,
     "sex": 1,
     "pCH": 0.0
    },
    {
     "jahr": 2020,
     "altEGrp": 2,
     "sex": 2,
     "pCH": 0.008695652
    },
    {
     "jahr": 2020,
     "altEGrp": 3,
     "sex": 1,
     "pCH": 0.01639344
    },
    {
     "jahr": 2020,
     "altEGrp": 3,
     "sex": 2,
     "pCH": 0.0
    },
    {
     "jahr": 2020,
     "altEGrp": 4,
     "sex": 1,
     "pCH": 0.01388889
    },
    {
     "jahr": 2020,
     "altEGrp": 4,
     "sex": 2,
     "pCH": 0.0
    },
    {
     "jahr": 2020,
     "altEGrp": 5,
     "sex": 1,
     "pCH": 0.03361345
    },
    {
     "jahr": 2020,
     "altEGrp": 5,
     "sex": 2,
     "pCH": 0.01470588
    },
    {
     "jahr": 2020,
     "altEGrp": 6,
     "sex": 1,
     "pCH": 0.00617284
    },
    {
     "jahr": 2020,
     "altEGrp": 6,
     "sex": 2,
     "pCH": 0.01680672
    },
    {
     "jahr": 2020,
     "altEGrp": 7,
     "sex": 1,
     "pCH": 0.01271186
    },
    {
     "jahr": 2020,
     "altEGrp": 7,
     "sex": 2,
     "pCH": 0.0
    },
    {
     "jahr": 2020,
     "altEGrp": 8,
     "sex": 1,
     "pCH": 0.005649718
    },
    {
     "jahr": 2020,
     "altEGrp": 8,
     "sex": 2,
     "pCH": 0.01271186
    },
    {
     "jahr": 2020,
     "altEGrp": 9,
     "sex": 1,
     "pCH": 0.006036217
    },
    {
     "jahr": 2020,
     "altEGrp": 9,
     "sex": 2,
     "pCH": 0.00308642
    },
    {
     "jahr": 2020,
     "altEGrp": 10,
     "sex": 1,
     "pCH": 0.01155327
    },
    {
     "jahr": 2020,
     "altEGrp": 10,
     "sex": 2,
     "pCH": 0.006072874
    },
    {
     "jahr": 2020,
     "altEGrp": 11,
     "sex": 1,
     "pCH": 0.01162791
    },
    {
     "jahr": 2020,
     "altEGrp": 11,
     "sex": 2,
     "pCH": 0.01345895
    },
    {
     "jahr": 2020,
     "altEGrp": 12,
     "sex": 1,
     "pCH": 0.02462772
    },
    {
     "jahr": 2020,
     "altEGrp": 12,
     "sex": 2,
     "pCH": 0.0122825
    },
    {
     "jahr": 2020,
     "altEGrp": 13,
     "sex": 1,
     "pCH": 0.0387931
    },
    {
     "jahr": 2020,
     "altEGrp": 13,
     "sex": 2,
     "pCH": 0.03200692
    },
    {
     "jahr": 2020,
     "altEGrp": 14,
     "sex": 1,
     "pCH": 0.05986079
    },
    {
     "jahr": 2020,
     "altEGrp": 14,
     "sex": 2,
     "pCH": 0.04678826
    },
    {
     "jahr": 2020,
     "altEGrp": 15,
     "sex": 1,
     "pCH": 0.09948718
    },
    {
     "jahr": 2020,
     "altEGrp": 15,
     "sex": 2,
     "pCH": 0.07518337
    },
    {
     "jahr": 2020,
     "altEGrp": 16,
     "sex": 1,
     "pCH": 0.136173
    },
    {
     "jahr": 2020,
     "altEGrp": 16,
     "sex": 2,
     "pCH": 0.08823529
    },
    {
     "jahr": 2020,
     "altEGrp": 17,
     "sex": 1,
     "pCH": 0.1819967
    },
    {
     "jahr": 2020,
     "altEGrp": 17,
     "sex": 2,
     "pCH": 0.1237067
    },
    {
     "jahr": 2020,
     "altEGrp": 18,
     "sex": 1,
     "pCH": 0.2205822
    },
    {
     "jahr": 2020,
     "altEGrp": 18,
     "sex": 2,
     "pCH": 0.1650268
    },
    {
     "jahr": 2020,
     "altEGrp": 19,
     "sex": 1,
     "pCH": 0.2633279
    },
    {
     "jahr": 2020,
     "altEGrp": 19,
     "sex": 2,
     "pCH": 0.1540362
    },
    {
     "jahr": 2020,
     "altEGrp": 20,
     "sex": 1,
     "pCH": 0.2600733
    },
    {
     "jahr": 2020,
     "altEGrp": 20,
     "sex": 2,
     "pCH": 0.1794195
    }
   ]
  }
 ]
};

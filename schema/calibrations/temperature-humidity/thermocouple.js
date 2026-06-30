import { z } from 'zod';

import { calibrationReferenceInstrumentsSchema, calibrationSummarySchema } from '../common-schema';
import { traceabilityTypeEnum } from '../common-enums';

//* Temperature & Humidity Thermocouple Variant's Constants, Schemas and Enums
export const REFERENCE_METHOD = [
  { label: 'ASTM E220-02 and BS 1041-4:1992', value: 'CP-A' },
  { label: 'ASTM E220-02', value: 'CP-B' },
  { label: 'ASTM E644-02 and BS 1041-3:1989', value: 'CP-C' },
  { label: 'ASTM E77-98(2003) and BS 1041-2.1:1985', value: 'CP-D' },
  { label: 'ASTM E220-02 and ASTM E644-02', value: 'CP-E' },
  { label: 'CEI IEC 584-1:1995 and CEI IEC 751 Amend.2:1995', value: 'CP-F' },
];

export const COMMON_REF_THER = [
  { label: 'ST-S1', value: 'no' },
  { label: 'ST-S2', value: 'no' },
  { label: 'ST-S3', value: 'no' },
  { label: 'ST-S4', value: 'yes' },
  { label: 'ST-S5', value: 'yes' },
  { label: 'ST-S6', value: 'yes' },
  { label: 'ST-S7', value: 'no' },
  { label: 'ST-S8', value: 'no' },
];

export const RES_U_CAN_READ = [
  '0.005',
  '0.01',
  '0.02',
  '0.05',
  '0.1',
  '0.2',
  '0.5',
  '0',
  '1',
  '1.5',
  '2',
  '2.5',
  '5',
  '10',
  '15',
  '20',
  '25',
];

export const REF_TYPE = [
  'J',
  'K',
  'N',
  'R',
  'S',
  'B',
  'E',
  'T',
  'RTD(2W)',
  'RTD(3W)',
  'RTD(4W)',
  'Pt 1000',
  '500ohm',
  '600ohm(2W)',
  '600ohm(3W)',
  '600ohm(4W)',
  '50mV',
  '60mV',
  'K',
  '600ohm',
];

export const REF_THER_UOM = ['°C', 'mV', 'ohm'];
export const REF_IND_UOM = ['I', 'A', 'B'];
export const IMMER = ['130 mm', '160 mm', '140 mm', '200 mm', '76 mm', 'TTL', '0'];

export const MAXIMUM_DECIMAL_COUNT = 4;
export const MAXIMUM_RANGE_OF_CALIBRATION = 18;
export const MAXIMUM_REF_TEST_LENGTH = 6;

export const BY_PASS_AUTO_CORR = ['yes', 'no'];

export const REF_TYPE_COEFFICIENTS_RANGE = [
  {
    id: 'CR000001',
    type: 'E',
    ranges: [
      {
        low: '-270',
        high: '0',
        c0: '0',
        c1: '58.665508708',
        c2: '0.090821954248',
        c3: '-0.00233994146058',
        c4: '-0.000103200643372',
        c5: '-0.00000297262915285',
        c6: '-0.0000000559284352002',
        c7: '-7.2013238738E-10',
        c8: '-6.42960988968E-12',
        c9: '-3.95815476519E-14',
        c10: '-1.6414776355E-16',
        c11: '-4.36409814676E-19',
        c12: '-6.69927944652E-22',
        c13: '-4.50551946169E-25',
        c14: '0',
        a0: null,
        a1: null,
      },
      {
        low: '0',
        high: '1000',
        c0: '0',
        c1: '58.66550871',
        c2: '0.090064551164',
        c3: '0.000086725221636',
        c4: '-0.00000132227586608',
        c5: '0.0000000032512201635',
        c6: '-1.15184973024E-12',
        c7: '-8.7756203479E-15',
        c8: '1.71913740552E-17',
        c9: '-1.29492376038E-20',
        c10: '3.5960899481E-24',
        c11: '0',
        c12: '0',
        c13: '0',
        c14: '0',
        a0: null,
        a1: null,
      },
    ],
  },
  {
    id: 'CR000002',
    type: 'J',
    ranges: [
      {
        low: '-210',
        high: '0',
        c0: '0',
        c1: '50.381187815',
        c2: '0.06095167386',
        c3: '-0.00025704319716',
        c4: '0.0000005291278118',
        c5: '-8.5264791685E-10',
        c6: '1.25688544182E-12',
        c7: '-8.7768767352E-16',
        c8: '1.25053805576E-19',
        c9: '0',
        c10: '0',
        c11: '0',
        c12: '0',
        c13: '0',
        c14: '0',
        a0: null,
        a1: null,
      },
      {
        low: '760',
        high: '1200',
        c0: '0',
        c1: '-1497.6127786',
        c2: '6.3574207848',
        c3: '-0.0095543060103',
        c4: '0.0000062883276016',
        c5: '-0.0000000015345684528',
        c6: '0',
        c7: '0',
        c8: '0',
        c9: '0',
        c10: '0',
        c11: '0',
        c12: '0',
        c13: '0',
        c14: '0',
        a0: null,
        a1: null,
      },
    ],
  },
  {
    id: 'CR000003',
    type: 'K',
    ranges: [
      {
        low: '-270',
        high: '0',
        c0: '0',
        c1: '39.450128025',
        c2: '0.047244747196',
        c3: '-0.00098576720352',
        c4: '-0.0000199619315108',
        c5: '-0.000000337545295865',
        c6: '-3.44461964568E-09',
        c7: '-2.17622110258E-11',
        c8: '-8.361287492E-14',
        c9: '-1.79003401902E-16',
        c10: '-1.6322697486E-19',
        c11: '0',
        c12: '0',
        c13: '0',
        c14: '0',
        a0: null,
        a1: null,
      },
      {
        low: '0',
        high: '1372',
        c0: '0',
        c1: '38.921204975',
        c2: '0.037117540064',
        c3: '-0.000298372778622',
        c4: '0.00000127363782876',
        c5: '-2.80364224445E-09',
        c6: '3.36450354354E-12',
        c7: '-2.24145040021E-15',
        c8: '7.77209177216E-19',
        c9: '-1.08942491475E-22',
        c10: '0',
        c11: '0',
        c12: '0',
        c13: '0',
        c14: '0',
        a0: '118.5976',
        a1: '-0.0001183432',
      },
    ],
  },
  {
    id: 'CR000004',
    type: 'N',
    ranges: [
      {
        low: '-270',
        high: '0',
        c0: '0',
        c1: '26.159105962',
        c2: '0.021914968456',
        c3: '-0.000281523334662',
        c4: '-0.000000185648159036',
        c5: '-0.000000013151678858',
        c6: '-1.35920628018E-10',
        c7: '-5.32625105537E-13',
        c8: '-7.4735734268E-16',
        c9: '0',
        c10: '0',
        c11: '0',
        c12: '0',
        c13: '0',
        c14: '0',
        a0: null,
        a1: null,
      },
      {
        low: '0',
        high: '1300',
        c0: '0',
        c1: '25.929394601',
        c2: '0.03142028376',
        c3: '0.000131476881711',
        c4: '-0.00000101044679176',
        c5: '3.21559096695E-09',
        c6: '-6.0380829114E-12',
        c7: '6.98217372944E-15',
        c8: '-4.86905964856E-18',
        c9: '1.87643064051E-21',
        c10: '-3.0682196151E-25',
        c11: '0',
        c12: '0',
        c13: '0',
        c14: '0',
        a0: null,
        a1: null,
      },
    ],
  },
  {
    id: 'CR000005',
    type: 'T',
    ranges: [
      {
        low: '-270',
        high: '0',
        c0: '0',
        c1: '38.748106364',
        c2: '0.088388868694',
        c3: '0.00035532969315',
        c4: '0.000080131894216',
        c5: '0.00000450690097795',
        c6: '0.000000135906939558',
        c7: '2.52498079435E-09',
        c8: '3.07951519064E-11',
        c9: '2.53921697325E-13',
        c10: '1.4251594779E-15',
        c11: '5.36455285146E-18',
        c12: '1.2954647124E-20',
        c13: '1.81285351806E-23',
        c14: '1.117132154978E-26',
        a0: null,
        a1: null,
      },
      {
        low: '0',
        high: '400',
        c0: '0',
        c1: '38.748106364',
        c2: '0.06658445576',
        c3: '0.00061854730212',
        c4: '-0.0000087529027384',
        c5: '0.00000005498440464',
        c6: '-1.84894552632E-10',
        c7: '3.1835394703E-13',
        c8: '-2.20103213384E-16',
        c9: '0',
        c10: '0',
        c11: '0',
        c12: '0',
        c13: '0',
        c14: '0',
        a0: null,
        a1: null,
      },
    ],
  },
  {
    id: 'CR000006',
    type: 'B',
    ranges: [
      {
        low: '0',
        high: '630.615',
        c0: '0',
        c1: '-0.24650818346',
        c2: '0.0118080842342',
        c3: '-0.0000039773794908',
        c4: '0.0000000062673167604',
        c5: '-8.47226462E-12',
        c6: '3.77942082564E-15',
        c7: '0',
        c8: '0',
        c9: '0',
        c10: '0',
        c11: '0',
        c12: '0',
        c13: '0',
        c14: '0',
        a0: null,
        a1: null,
      },
      {
        low: '630.615',
        high: '1820',
        c0: '0',
        c1: '28.57174747',
        c2: '-0.16977020957',
        c3: '0.00047355840492',
        c4: '-0.00000067341379456',
        c5: '5.5548970065E-10',
        c6: '-2.67092586198E-13',
        c7: '6.92829485747E-17',
        c8: '-7.50330642312E-21',
        c9: '0',
        c10: '0',
        c11: '0',
        c12: '0',
        c13: '0',
        c14: '0',
        a0: null,
        a01: null,
      },
    ],
  },
  {
    id: 'CR000007',
    type: 'R',
    ranges: [
      {
        low: '-50',
        high: '1064.18',
        c0: '0',
        c1: '5.28961729765',
        c2: '0.0278333179564',
        c3: '-0.0000716567079051',
        c4: '0.0000001427664004252',
        c5: '-2.31173833149E-10',
        c6: '3.004664646204E-13',
        c7: '-2.611741203337E-16',
        c8: '1.261731858936E-19',
        c9: '-2.529347627259E-23',
        c10: '0',
        c11: '0',
        c12: '0',
        c13: '0',
        c14: '0',
        a0: null,
        a1: null,
      },
      {
        low: '1064.18',
        high: '1664.5',
        c0: '0',
        c1: '-2.52061251332',
        c2: '0.031912900373',
        c3: '-0.00002292257842728',
        c4: '8.21221164096E-09',
        c5: '-1.466798340865E-12',
        c6: '0',
        c7: '0',
        c8: '0',
        c9: '0',
        c10: '0',
        c11: '0',
        c12: '0',
        c13: '0',
        c14: '0',
        a0: null,
        a1: null,
      },
      {
        low: '1664.5',
        high: '1768.1',
        c0: '0',
        c1: '-268.819888545',
        c2: '0.342560560942',
        c3: '-0.0001037687119359',
        c4: '-3.738535884184E-11',
        c5: '0',
        c6: '0',
        c7: '0',
        c8: '0',
        c9: '0',
        c10: '0',
        c11: '0',
        c12: '0',
        c13: '0',
        c14: '0',
        a0: null,
        a1: null,
      },
    ],
  },
  {
    id: 'CR000008',
    type: 'S',
    ranges: [
      {
        low: '-50',
        high: '1064.18',
        c0: '0',
        c1: '5.40313308631',
        c2: '0.025186857948',
        c3: '-0.0000697433906067',
        c4: '0.0000001288115292144',
        c5: '-1.657325981945E-10',
        c6: '1.534465510716E-13',
        c7: '-8.75482099751E-17',
        c8: '2.17154540916E-20',
        c9: '0',
        c10: '0',
        c11: '0',
        c12: '0',
        c13: '0',
        c14: '0',
        a0: null,
        a1: null,
      },
      {
        low: '1064.18',
        high: '1664.5',
        c0: '0',
        c1: '3.34509311344',
        c2: '0.01309610385636',
        c3: '-0.00000494568777627',
        c4: '5.19958420696E-11',
        c5: '0',
        c6: '0',
        c7: '0',
        c8: '0',
        c9: '0',
        c10: '0',
        c11: '0',
        c12: '0',
        c13: '0',
        c14: '0',
        a0: null,
        a01: null,
      },
      {
        low: '1664.5',
        high: '1768.1',
        c0: '0',
        c1: '-258.430516752',
        c2: '0.327387149282',
        c3: '-0.0000991317140961',
        c4: '-3.772894762448E-11',
        c5: '0',
        c6: '0',
        c7: '0',
        c8: '0',
        c9: '0',
        c10: '0',
        c11: '0',
        c12: '0',
        c13: '0',
        c14: '0',
        a0: null,
        a01: null,
      },
    ],
  },
];

export const RTD_COEFFICIENTS_RANGE = [
  {
    id: 'CR000001',
    type: 'RTD',
    ranges: [
      {
        low: '-200',
        high: '0',
        c0: '0',
        c1: '3.9083E-03',
        c2: '-1.1550E-06',
        c3: '1.2549E-09',
        c4: '-1.6732E-11',
      },
      {
        low: '0',
        high: '850',
        c0: '0',
        c1: '3.9083E-03',
        c2: '-1.1550E-06',
        c3: '0.0000E+00',
        c4: '0.0000E+00',
      },
    ],
  },
];

//? Note: CMC Description must not changed easily it should be based on the preuploaded description of initial data
//? Because CMC description is used to lookup which data to use for calibration result (uncertainty)
//? isByType if true, it will also lookup based on type e.g. J, K, N, S
export const CMC_LOOKUP_MAP = [
  {
    type: 'J',
    isByType: true,
    location: {
      lab: 'CP - A THERMOCOUPLE',
      site: 'CP - A THERMOCOUPLE',
    },
  },
  {
    type: 'K',
    isByType: true,
    location: {
      lab: 'CP - A THERMOCOUPLE',
      site: 'CP - A THERMOCOUPLE',
    },
  },
  {
    type: 'N',
    isByType: true,
    location: {
      lab: 'CP - A THERMOCOUPLE',
      site: 'CP - A THERMOCOUPLE',
    },
  },
  {
    type: 'R',
    isByType: true,
    location: {
      lab: 'CP - A THERMOCOUPLE',
      site: 'CP - A THERMOCOUPLE',
    },
  },
  {
    type: 'S',
    isByType: true,
    location: {
      lab: 'CP - A THERMOCOUPLE',
      site: 'CP - A THERMOCOUPLE',
    },
  },
  {
    type: 'B',
    isByType: true,
    location: {
      lab: 'CP - A THERMOCOUPLE',
      site: 'CP - A THERMOCOUPLE',
    },
  },
  {
    type: 'E',
    isByType: true,
    location: {
      lab: 'CP - A THERMOCOUPLE',
      site: 'CP - A THERMOCOUPLE',
    },
  },
  {
    type: 'T',
    isByType: true,
    location: {
      lab: 'CP - A THERMOCOUPLE',
      site: 'CP - A THERMOCOUPLE',
    },
  },
  {
    type: 'RTD(4W)',
    isByType: true,
    location: {
      lab: 'CP-C - RTD',
      site: 'CP-C - RTD',
    },
  },
];

export const refMethodEnum = z.enum(REFERENCE_METHOD, {
  message: 'Please select a ref method',
});

export const refTypeEnum = z.enum(REF_TYPE, {
  message: 'Please select a ref type',
});

export const refTherUomEnum = z.enum(REF_THER_UOM, {
  message: 'Please select a ref ther. unit of measure',
});

export const refIndUomEnum = z.enum(REF_IND_UOM, {
  message: 'Please select a ref ind. unit of measure',
});

export const immerEnum = z.enum(IMMER, {
  message: 'Please select an immer.',
});

//* Calibration Measurements Form Schema
export const calibrationMeasurementSchema = z.object({
  rangeOfCalibration: z.coerce
    .number()
    .min(1, { message: 'Please enter range of calibration. ' })
    .max(18, {
      message: 'Range of calibration should be less than or equal to 18',
    })
    .default(0),
  refMethod: z.union([refMethodEnum, z.record(z.string(), z.any())]).transform((formData) => {
    if (typeof formData === 'object') return formData.value;
    return formData;
  }),
  refDecimal: z
    .union([
      z.coerce.number().min(0, { message: 'Please enter ref. decimal' }),
      z.record(z.string(), z.any()),
    ])
    .transform((formData) => {
      if (typeof formData === 'object') return formData.value;
      return formData;
    }),
  minTemperature: z.coerce.number().default(0),
  maxTemperature: z.coerce.number().default(0),
  minRHumidity: z.coerce.number().default(0),
  maxRHumidity: z.coerce.number().default(0),
  isByPassAutoCorr: z
    .union([z.boolean().default(false), z.record(z.string(), z.any())])
    .transform((value) => (value === 'yes' ? true : false))
    .default(false),
  refType: z.union([refTypeEnum, z.record(z.string(), z.any())]).transform((formData) => {
    if (typeof formData === 'object') return formData.value;
    return formData;
  }),
  refTher: z
    .union([z.string({ message: 'Please select ref ther.' }), z.record(z.string(), z.any())])
    .transform((formData) => {
      if (typeof formData === 'object') return formData.value;
      return formData;
    }),
  refTherUom: z.union([refTherUomEnum, z.record(z.string(), z.any())]).transform((formData) => {
    if (typeof formData === 'object') return formData.value;
    return formData;
  }),
  refInd: z
    .union([z.string({ message: 'Please select ref ind.' }), z.record(z.string(), z.any())])
    .transform((formData) => {
      if (typeof formData === 'object') return formData.value;
      return formData;
    }),
  refIndUom: z.union([refIndUomEnum, z.record(z.string(), z.any())]).transform((formData) => {
    if (typeof formData === 'object') return formData.value;
    return formData;
  }),
  refWire: z
    .union([z.string({ message: 'Please select ref wire' }), z.record(z.string(), z.any())])
    .nullish()
    .transform((formData) => {
      if (typeof formData === 'object' && formData !== null) return formData.value;
      return formData || null;
    }),
  testInd: z
    .union([z.string({ message: 'Please select test ind.' }), z.record(z.string(), z.any())])
    .transform((formData) => {
      if (typeof formData === 'object') return formData.value;
      return formData;
    }),
  testWire: z
    .union([z.string({ message: 'Please select test wire' }), z.record(z.string(), z.any())])
    .nullish()
    .transform((formData) => {
      if (typeof formData === 'object' && formData !== null) return formData.value;
      return formData || null;
    }),
  bath: z
    .union([z.string({ message: 'Please select bath' }), z.record(z.string(), z.any())])
    .transform((formData) => {
      if (typeof formData === 'object') return formData.value;
      return formData;
    }),
  immer: z.union([immerEnum, z.record(z.string(), z.any())]).transform((formData) => {
    if (typeof formData === 'object') return formData.value;
    return formData;
  }),
  resolution: z.coerce.number().default(0),
  traceabilityType: z
    .union([traceabilityTypeEnum, z.record(z.string(), z.any())])
    .transform((formData) => {
      if (typeof formData === 'object') return formData.value;
      return formData;
    }),
  traceabilityCountry: z
    .union([z.string().min(1, { message: 'Please select country' }), z.record(z.string(), z.any())])
    .nullish()
    .transform((formData) => {
      if (typeof formData === 'object' && formData !== null) return formData.value;
      return formData;
    }),
  traceabilityCalibrationLab: z
    .array(z.union([z.string(), z.record(z.string(), z.any())]))
    .min(1, { message: 'Please select at least one calibration lab' })
    .nullish()
    .transform((formData) => {
      if (typeof formData === 'object') {
        if (formData !== null && formData.length < 1) return null;
        if (formData === null) return null;

        return formData.map((el) => {
          if (typeof el === 'object') return el.value;
          return el;
        });
      }
      return null;
    }),
  traceabilityAccreditationBody: z
    .union([
      z.string().min(1, { message: 'Please select accreditation body' }),
      z.record(z.string(), z.any()),
    ])
    .nullish()
    .transform((formData) => {
      if (typeof formData === 'object' && formData !== null) return formData.value;
      return formData;
    }),
  calibrationLocation: z.string().default(''),
});

export const calibrationTemperatureHumiditySchema = z.object({
  data: z.array(
    z.object({
      setting: z.coerce.number().default(0),
      refTher: z
        .union([z.string({ message: 'Please select ref ther.' }), z.record(z.string(), z.any())])
        .transform((formData) => {
          if (typeof formData === 'object') return formData.value;
          return formData;
        }),
      refTherUom: z.union([refTherUomEnum, z.record(z.string(), z.any())]).transform((formData) => {
        if (typeof formData === 'object') return formData.value;
        return formData;
      }),
      refInd: z
        .union([z.string({ message: 'Please select ref ind.' }), z.record(z.string(), z.any())])
        .transform((formData) => {
          if (typeof formData === 'object') return formData.value;
          return formData;
        }),
      refIndUom: z.union([refIndUomEnum, z.record(z.string(), z.any())]).transform((formData) => {
        if (typeof formData === 'object') return formData.value;
        return formData;
      }),
      refWire: z
        .union([z.string({ message: 'Please select ref wire' }), z.record(z.string(), z.any())])
        .nullish()
        .transform((formData) => {
          if (typeof formData === 'object' && formData !== null) return formData.value;
          return formData || null;
        }),
      testInd: z
        .union([z.string({ message: 'Please select test ind.' }), z.record(z.string(), z.any())])
        .transform((formData) => {
          if (typeof formData === 'object') return formData.value;
          return formData;
        }),
      testWire: z
        .union([z.string({ message: 'Please select test wire' }), z.record(z.string(), z.any())])
        .nullish()
        .transform((formData) => {
          if (typeof formData === 'object' && formData !== null) return formData.value;
          return formData || null;
        }),
      bath: z
        .union([z.string({ message: 'Please select bath' }), z.record(z.string(), z.any())])
        .transform((formData) => {
          if (typeof formData === 'object') return formData.value;
          return formData;
        }),
      immer: z
        .union([z.string({ message: 'Please select immer.' }), z.record(z.string(), z.any())])
        .transform((formData) => {
          if (typeof formData === 'object') return formData.value;
          return formData;
        }),
      resolution: z.coerce.number().default(0),
      refTestData: z.array(z.array(z.coerce.number().default(0))).default([]),
    })
  ),
});

const readingSummaries = z.object({
  min: z.coerce.number().default(0),
  max: z.coerce.number().default(0),
  mean: z.coerce.number().default(0),
  std: z.coerce.number().default(0),
});

export const calibrationResultSchema = z.object({
  corrections: z.array(z.coerce.number()).default([]),
  resultCorrections: z.array(z.coerce.number()).default([]),
  coverageFactors: z.array(z.coerce.number()).default([]),
  expandedUncertainties: z.array(z.coerce.number()).default([]),
  resultEsts: z.array(z.coerce.number()).default([]),
  resultInfoEst: z.coerce.number().default(0),
  resultInfoK: z.coerce.number().default(0),
  resultExpandedUncertainties: z.array(z.coerce.number()).default([]),
  resultCorrections: z.array(z.coerce.number()).default([]),
  refReadingSummaries: z.array(readingSummaries).default([]),
  testBefAdjReadingSummaries: z.array(readingSummaries).default([]),
});

export const CalibrationThermocoupleSchema = z
  .object({})
  .merge(calibrationSummarySchema._def.schema._def.schema._def.schema)
  .merge(calibrationMeasurementSchema)
  .merge(calibrationReferenceInstrumentsSchema)
  .merge(calibrationTemperatureHumiditySchema)
  .merge(calibrationResultSchema);

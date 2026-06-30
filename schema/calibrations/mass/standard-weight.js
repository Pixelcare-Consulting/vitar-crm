import { z } from 'zod';
import { traceabilityTypeEnum } from '../common-enums';
import {
  calibrationReferenceInstrumentsSchema,
  calibrationSummarySchema,
} from '../common-schema';

//* Mass Standard Weight Variant's Constants, Schemas and Enums
export const ACCURACY_CLASS = ['F2', 'M1', 'M2', 'M3', 'N/A'];

export const UNIT_USED_FOR_COC = ['milligram', 'gram', 'kilogram'];
export const UNIT_USED_FOR_COC_ABBREVIATION_MAP = {
  gram: 'g',
  kilogram: 'kg',
  milligram: 'mg',
};

export const NOMINAL_VALUE = [
  '0.001',
  '0.002',
  '0.005',
  '0.01',
  '0.02',
  '0.05',
  '0.1',
  '0.2',
  '0.5',
  '1',
  '2',
  '5',
  '10',
  '20',
  '50',
  '100',
  '200',
  '500',
  '1000',
  '2000',
  '5000',
  '10000',
  '20000',
];

export const TAG_ID = ['1', '1E', '1F', '1G', '1A', '1C']; //* removed ST-MW prefix
export const MAXIMUM_INSPECTION_POINT = 5;

export const accuracyClassEnum = z.enum(ACCURACY_CLASS, {
  message: 'Please select an accuracy class',
});

const unitUsedForCOCEnum = z.enum(UNIT_USED_FOR_COC, {
  message: 'Please select a unit used for COC',
});

const nominalValueEnum = z.enum(NOMINAL_VALUE, {
  message: 'Please select a nominal value',
});

const tagIdEnum = z.enum(TAG_ID, {
  message: 'Please select a tag id',
});

//* Calibration Measurements Form Schema
export const calibrationMeasurementSchema = z.object({
  accuracyClass: z
    .union([accuracyClassEnum, z.record(z.string(), z.any())])
    .transform((formData) => {
      if (typeof formData === 'object') return formData.value;
      return formData;
    }),
  testWeightNo: z.coerce
    .number()
    .min(1, { message: 'Please enter a no. of test weight' })
    .max(30, {
      message: 'No. of test weight should be less than or equal to 30',
    })
    .default(0),
  minTemperature: z.coerce.number().default(0),
  maxTemperature: z.coerce.number().default(0),
  minRHumidity: z.coerce.number().default(0),
  maxRHumidity: z.coerce.number().default(0),
  minAPressure: z.coerce.number().default(0),
  maxAPressure: z.coerce.number().default(0),
  unitUsedForCOC: z
    .union([unitUsedForCOCEnum, z.record(z.string(), z.any())])
    .transform((formData) => {
      if (typeof formData === 'object') return formData.value;
      return formData;
    }),
  material: z
    .union([
      z.string({ message: 'Please select material' }),
      z.record(z.string(), z.any()),
    ])
    .transform((formData) => {
      if (typeof formData === 'object') return formData.value;
      return formData;
    }),
  envUP: z
    .union([
      z.string({ message: 'Please environmental value' }),
      z.record(z.string(), z.any()),
    ])
    .transform((formData) => {
      if (typeof formData === 'object') return formData.value;
      return formData;
    }),
  envUT: z
    .union([
      z.string({ message: 'Please environmental value' }),
      z.record(z.string(), z.any()),
    ])
    .transform((formData) => {
      if (typeof formData === 'object') return formData.value;
      return formData;
    }),
  envUHr: z
    .union([
      z.string({ message: 'Please environmental value' }),
      z.record(z.string(), z.any()),
    ])
    .transform((formData) => {
      if (typeof formData === 'object') return formData.value;
      return formData;
    }),
  ptKgMn3: z.coerce.number().default(0),
  uPtKgMn3: z.coerce.number().default(0),
  traceabilityType: z
    .union([traceabilityTypeEnum, z.record(z.string(), z.any())])
    .transform((formData) => {
      if (typeof formData === 'object') return formData.value;
      return formData;
    }),
  traceabilityCountry: z
    .union([
      z.string().min(1, { message: 'Please select country' }),
      z.record(z.string(), z.any()),
    ])
    .nullish()
    .transform((formData) => {
      if (typeof formData === 'object' && formData !== null)
        return formData.value;
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
      if (typeof formData === 'object' && formData !== null)
        return formData.value;
      return formData;
    }),
  calibrationLocation: z.string().default(''),
});

//** nominalValues
//* isNominalValueWithAsterisks
//* resultExpandedUncertainties
//* conventionalValues
//* mpes
export const calibrationMassSchema = z.object({
  data: z.array(
    z.object({
      unitUsedForCOC: z
        .union([unitUsedForCOCEnum, z.record(z.string(), z.any())])
        .transform((formData) => {
          if (typeof formData === 'object') return formData.value;
          return formData;
        }),
      material: z
        .union([
          z.string().min(1, { message: 'Please select material' }),
          z.record(z.string(), z.any()),
        ])
        .transform((formData) => {
          if (typeof formData === 'object') return formData.value;
          return formData;
        }),
      ptKgMn3: z.coerce.number().default(0),
      uPtKgMn3: z.coerce.number().default(0),
      nominalValue: z
        .union([nominalValueEnum, z.record(z.string(), z.any())])
        .transform((formData) => {
          if (typeof formData === 'object') return formData.value;
          return formData;
        })
        .default([]),
      isNominalValueWithAsterisk: z.boolean().default(false),
      massComparatorRefEquipmentId: z
        .union([
          z.string().min(1, { message: 'Please select mass comparator' }),
          z.record(z.string(), z.any()),
        ])
        .transform((formData) => {
          if (typeof formData === 'object') return formData.value;
          return formData;
        })
        .default([]),
      tagId: z
        .union([tagIdEnum, z.record(z.string(), z.any())])
        .transform((formData) => {
          if (typeof formData === 'object') return formData.value;
          return formData;
        })
        .default([]),
      weights: z.array(z.string().min(1, 'Please enter a value')).default([]),
      testWeightData: z
        .array(z.array(z.coerce.number().default(0)))
        .default([]),
    })
  ),
});

const calibrationResultSchema = z.object({
  nominalValues: z.array(z.coerce.number()).default([]),
  isNominalValueWithAsterisks: z.array(z.boolean()).default([]),
  resultExpandedUncertainties: z.array(z.coerce.number()).default([]),
  conventionalValues: z.array(z.coerce.number()).default([]),
  mpes: z.array(z.coerce.number()).default([]),
  unitsUsedForCOC: z.array(z.string()).default([]),
  coverageFactors: z.array(z.coerce.number()).default([]),
  massComparatorRefEquipment: z
    .array(z.record(z.string(), z.any()))
    .default([]),
});

export const CalibrationStandardWeightSchema = z
  .object({})
  .merge(calibrationSummarySchema._def.schema._def.schema._def.schema)
  .merge(calibrationMeasurementSchema)
  .merge(calibrationReferenceInstrumentsSchema)
  .merge(calibrationMassSchema)
  .merge(calibrationResultSchema);

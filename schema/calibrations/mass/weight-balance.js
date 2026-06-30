import { z } from 'zod';

import { traceabilityTypeEnum } from '../common-enums';
import { calibrationReferenceInstrumentsSchema, calibrationSummarySchema } from '../common-schema';

//* Mass Weight Balance Variant's Constants, Schemas and Enums
export const RANGE_TYPE = ['single', 'multi'];
export const RANGE_COUNT = ['1', '2', '3'];

export const RESOLUTION = [
  '0.000001',
  '0.00001',
  '0.0001',
  '0.0002',
  '0.0005',
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
  '25',
  '50',
  '100',
  '200',
  '250',
  '500',
  '1000',
  '2000',
  '2500',
  '5000',
  '10000',
];

export const UNIT_USED_FOR_COC = ['gram', 'kilogram'];
export const CALIBRATION_POINT_NO = ['6', '7', '8', '9', '10', '11', '12'];
export const TEST_LOADS = ['C1', 'E1', 'E2', 'E3', 'E4', 'C2'];

export const TAG_ID_BY_CLASS_MAP = {
  e2: ['1J'],
  '1f1': ['1B', '1F', '1G', '1H', '1K', '1L'],
  '2f1': ['1', '1C', '1D', '1E'],
};

export const NOMINAL_VALUE = [
  10000, 20000, 30000, 60000, 90000, 120000, 150000, 180000, 210000, 240000, 270000, 300000,
];

export const NOMINAL_VALUE_MULTIPLIER = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1, 0];

export const EXPANDED_UNCERTAINTY = [
  '± 8.25387',
  '± 8.27607',
  '± 8.55097',
  '± 9.11629',
  '± 10.48890',
  '± 11.50768',
  '± 13.40877',
  '± 14.65014',
  '± 16.80634',
  '± 18.15783',
  '± 20.44483',
  '± 21.85559',
];

const rangeTypeEnum = z.enum(RANGE_TYPE, {
  message: 'Please select a range type',
});

const rangeCountEnum = z.enum(RANGE_COUNT, {
  message: 'Please select a range count',
});

const resolutionEnum = z.enum(RESOLUTION, {
  message: 'Please select a resolution',
});

const unitUsedForCOCEnum = z.enum(UNIT_USED_FOR_COC, {
  message: 'Please select a unit used for COC',
});

const calibrationPointNoEnum = z.enum(CALIBRATION_POINT_NO, {
  message: 'Please select a calibration point no.',
});

const rangeDetailsSchema = z.object({
  rangeMaxCalibration: z.coerce.number({
    message: 'Maximum Range Calibration is required',
  }),
  rangeMinCalibration: z.coerce.number({
    message: ' Minimum Range Calibration is required',
  }),
  resolution: z.union([resolutionEnum, z.record(z.string(), z.any())]).transform((formData) => {
    if (typeof formData === 'object') return formData.value;
    return formData;
  }),
  unitUsedForCOC: z
    .union([unitUsedForCOCEnum, z.record(z.string(), z.any())])
    .transform((formData) => {
      if (typeof formData === 'object') return formData.value;
      return formData;
    }),
  calibrationPointNo: z
    .union([calibrationPointNoEnum, z.record(z.string(), z.any())])
    .transform((formData) => {
      if (typeof formData === 'object') return formData.value;
      return formData;
    }),
});

//* Calibration Measurements Form Schema
export const calibrationMeasurementSchema = z.object({
  rangeType: z.union([rangeTypeEnum, z.record(z.string(), z.any())]).transform((formData) => {
    if (typeof formData === 'object') return formData.value;
    return formData;
  }),
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
  rangeCount: z.union([rangeCountEnum, z.record(z.string(), z.any())]).transform((formData) => {
    if (typeof formData === 'object') return formData.value;
    return formData;
  }),
  rangeDetails: z
    .array(rangeDetailsSchema)
    .min(1, { message: 'At least one range detail is required' })
    .max(3, { message: 'Maximum of 3 range details allowed' }),
});

//* Other Measurements Form Schema
const otherMeasurementsSchema = z.object({
  minTemperature: z.coerce.number().default(0),
  maxTemperature: z.coerce.number().default(0),
  minRHumidity: z.coerce.number().default(0),
  maxRHumidity: z.coerce.number().default(0),
  typeOfBalance: z.string().default(''),
});

//* Departure From Nominal Value (DFNV) - Calibration Point Data Schema
export const dfnvCalibrationPointSchema = z.object({
  data: z.array(z.array(z.string().min(1, 'Please enter a value')).default([])).default([]),
});

//* Departure From Nominal Value (DFNV) Form Schema
export const dfnvSchema = z.object({
  calibrationPoints: z.array(dfnvCalibrationPointSchema),
  ids: z.array(z.array(z.string())),
});

//* Repeatability (R) Test Form Schema
export const rTestSchema = z.object({
  half: z.array(z.coerce.number()).default([]),
  max: z.array(z.coerce.number()).default([]),
  maxError: z.coerce.number().default(0),
  std: z.array(z.coerce.number()).default([]),
  maxDiffBetweenReadings: z.array(z.coerce.number()).default([]),
});

//* Eccentricity (E) Test Form Schema
export const eTestSchema = z.object({
  testLoad: z.coerce.number().default(0),
  values: z.array(z.coerce.number()).default([]),
  maxError: z.coerce.number().default(0),
});

export const calibrationMassSchema = z
  .object({
    data: z.array(
      z.object({
        nominalValues: z.array(z.coerce.number()).default([]),
        measuredValuesM: z.array(z.coerce.number()).default([]),
        corrections: z.array(z.coerce.number()).default([]),
        expandedUncertainties: z.array(z.coerce.number()).default([]),
        measuredValues: z.array(z.array(z.coerce.number())).default([]),
        coverageFactors: z.array(z.coerce.number()).default([]),
        dfnv: z.array(dfnvSchema).default([]),
        rtest: rTestSchema,
        etest: eTestSchema,
        d1: z.coerce.number().default(0),
        d2: z.coerce.number().default(0),
        typeOfBalance: z.string().default(''),
      })
    ),
  })
  .merge(otherMeasurementsSchema);

export const CalibrationWeightBalanceSchema = z
  .object({})
  .merge(calibrationSummarySchema._def.schema._def.schema._def.schema)
  .merge(calibrationMeasurementSchema)
  .merge(calibrationReferenceInstrumentsSchema)
  .merge(calibrationMassSchema);

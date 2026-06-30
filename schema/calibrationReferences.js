import { z } from 'zod';

export const CLASS_TYPE = ['E2', 'M1', 'F1'];

export const classTypeEnum = z.enum(CLASS_TYPE, {
  message: 'Please select a class',
});

export const cuswdSchema = z.object({
  refId: z.string().min(1, 'Reference ID is required'),
  tagId: z.string().min(1, 'Tag ID is required'),
  class: z.union([classTypeEnum, z.record(z.string(), z.any())]).transform((formData) => {
    if (typeof formData === 'object') return formData.value;
    return formData;
  }),
  nominalValue: z.string().min(1, 'Nominal Value (g) is required'),
  currentYearError: z.string().default(''),
  currentYearActualValue: z.string().default(''),
  eUncertainty: z.string().default(''),
  uCertg: z.string().default(''),
  uCert2g2: z.string().default(''),
  uCert4vG4: z.string().default(''),
  uInstg: z.string().default(''),
  uInst2g2: z.string().default(''),
  uInst4vG4: z.string().default(''),
  prKgMn3: z.string().default(''),
  uPrKgMn3: z.string().default(''),
  lastYearError: z.string().default(''),
  lastYearActualValue: z.string().default(''),
  driftg: z.string().default(''),
});

export const mpeSchema = z.object({
  refId: z.string().min(1, 'Reference ID is required'),
  code: z.union([classTypeEnum, z.record(z.string(), z.any())]).transform((formData) => {
    if (typeof formData === 'object') return formData.value;
    return formData;
  }),
  weight: z.string().min(1, 'Weight (g) is required'),
  mpe: z.string().min(1, 'MPE is required'),
  uncertainty: z.string().default(''),
});

export const ckSchema = z.object({
  refId: z.string().min(1, 'Reference ID is required'),
  dof: z.string().min(1, 'DOF is required'),
  value: z.string().min(1, '95.45% is required'),
});

export const acrSchema = z.object({
  refId: z.string().min(1, 'Reference ID is required'),
  code: z.string().min(1, 'Code is required'),
  e1: z.string().default(''),
  e2: z.string().default(''),
  f1: z.string().default(''),
  f2: z.string().default(''),
  m1: z.string().default(''),
  m2: z.string().default(''),
  m3: z.string().default(''),
});

export const materialSchema = z.object({
  refId: z.string().min(1, 'Reference ID is required'),
  code: z.string().min(1, 'Code is required'),
  material: z.string().min(1, 'Material is required'),
  ptKgMn3: z.string().default(''),
  uPtKgMn3: z.string().default(''),
});

export const rscmcSchema = z.object({
  refId: z.string().min(1, 'Reference ID is required'),
  nominalValue: z.string().min(1, 'Nominal Value (g) is required'),
  value: z.string().min(1, 'Value is required'),
});

//** a key which the default environmental will be assigned to
//* only one default per key
export const ENVIRONMENTAL_DEFAULT_FIELD_OPTIONS = [
  {
    label: 'Up',
    value: 'envUP',
    html: (
      <span>
        U<sub>p</sub>
      </span>
    ),
  },
  {
    label: 'Ut',
    value: 'envUT',
    html: (
      <span>
        U<sub>t</sub>
      </span>
    ),
  },
  {
    label: 'Uhr',
    value: 'envUHr',
    html: (
      <span>
        U<sub>hr</sub>
      </span>
    ),
  },
];

export const environmentalSchema = z
  .object({
    refId: z.string().min(1, 'Reference ID is required'),
    code: z.string().min(1, 'Code is required'),
    description: z.string().default(''),
    u: z.string().min(1, 'U is required'),
    unit: z.string().default(''),
    dueDate: z.string().default(''),
    isDefault: z.boolean().default(false),
    field: z.union([z.string(), z.record(z.string(), z.any())]).transform((formData) => {
      if (typeof formData === 'object') return formData.value;
      return formData;
    }),
  })
  .refine(
    (formObj) => {
      const { isDefault, field } = formObj;
      if (isDefault && !field) return false;
      return true;
    },
    { message: 'Please select a field', path: ['field'] }
  );

export const therSchema = z.object({
  refId: z.string().min(1, 'Reference ID is required'),
  idCode: z.string().min(1, 'ID Code is required'),
  type: z.string().min(1, 'Type is required'),
  serialNumber: z.string().default(''),
  traceable: z.string().min(1, 'Traceable is required'),
  cocNo: z.string().default(''),
  kFactor: z.string().default(''),
  dueDate: z.string().default(''),
});

export const wiresSchema = z.object({
  refId: z.string().min(1, 'Reference ID is required'),
  idCode: z.string().min(1, 'ID Code is required'),
  code: z.string().min(1, 'Code is required'),
  type: z.string().default(''),
});

export const tempRefSchema = z.object({
  tempRefId: z.string().min(1, 'Temperature Reference ID is required'),
  reference: z.string().min(1, 'Reference is required'),
  test: z.string().min(1, 'Test is required'),
  correction: z.string().default(''),
  uncer: z.string().min(1, 'Uncer is required'),
  drift: z.string().min(1, 'Drift is required'),
});

export const auxSchema = z.object({
  refId: z.string().min(1, 'Reference ID is required'),
  idCode: z.string().min(1, 'ID Code is required'),
  type: z.string().min(1, 'Type is required'),
  serialNumber: z.string().default(''),
  traceable: z.string().min(1, 'Traceable is required'),
  cocNo: z.string().default(''),
  kFactor: z.string().default(''),
  dueDate: z.string().default(''),
});

export const extensionsSchema = z.object({
  refId: z.string().min(1, 'Reference ID is required'),
  idCode: z.string().min(1, 'ID Code is required'),
  uncerDCelsius: z.string().min(1, 'Uncer (°C)'),
  uncerPercentRHumidity: z.string().default(''),
  kFactor: z.string().default(''),
  dueDate: z.string().default(''),
});

export const bathSchema = z.object({
  refId: z.string().min(1, 'Reference ID is required'),
  idCode: z.string().min(1, 'ID Code is required'),
  no: z.string().default(''),
  minDCelsius: z.string().default(''),
  maxDCelsius: z.string().default(''),
  minPercentRHumidity: z.string().default(''),
  maxPercentRHumidity: z.string().default(''),
  stabilityDCelsius: z.string().default(''),
  stabilityPercentRHumidity: z.string().default(''),
  uniformityDCelsius: z.string().default(''),
  uniformityPercentRHumidity: z.string().default(''),
  radialDCelsius: z.string().default(''),
  axialDCelsius: z.string().default(''),
  dueDate: z.string().default(''),
});

export const bathStabilityUniformitySchema = z.object({
  refId: z.string().min(1, 'Reference ID is required'),
  code: z.string().min(1, 'Code is required'),
  stabilityDCelsius: z.string().default(''),
  stabilityPercentRHumidity: z.string().default(''),
  uniformityDCelsius: z.string().default(''),
});

export const bathStability = z.object({
  refId: z.string().min(1, 'Reference ID is required'),
  loc: z.string().min(1, 'Loc. is required'),
  value1: z.string().default(''),
  value2: z.string().default(''),
  value3: z.string().default(''),
});

export const bathUniformitySchema = z.object({
  refId: z.string().min(1, 'Reference ID is required'),
  loc: z.string().min(1, 'Loc. is required'),
  value1: z.string().default(''),
  value2: z.string().default(''),
  value3: z.string().default(''),
});

export const meterSchema = z.object({
  refId: z.string().min(1, 'Reference ID is required'),
  idCode: z.string().default(''),
  code: z.string().min(1, 'Code is required'),
  type: z.string().default(''),
  kFactor: z.string().default(''),
});

export const temperatureInstrumentSchema = z.object({
  refId: z.string().min(1, 'Reference ID is required'),
  code: z.string().min(1, 'Code is required'),
  description: z.string().default(''),
  range: z.string().default(''),
});

export const cmcSchema = z.object({
  refId: z.string().min(1, 'Reference ID is required'),
  description: z.string().min(1, 'Description is required'),
  type: z.string().default(''),
  no: z.string().default(''),
  location: z
    .union([z.string({ message: 'Please select location' }), z.record(z.string(), z.any())])
    .transform((formData) => {
      if (typeof formData === 'object') return formData.value;
      return formData;
    }),
  min: z.string().default(''),
  max: z.string().default(''),
  uncer: z.string().default(''),
});

export const specialRangeSchema = z.object({
  min: z.string().min(1, 'Min is required'),
  max: z.string().min(1, 'Max is required'),
  r0: z.string().default(''),
  a: z.string().default(''),
  b: z.string().default(''),
  c: z.string().default(''),
});

export const specialSchema = z.object({
  refId: z.string().min(1, 'Reference ID is required'),
  idCode: z.string().min(1, 'ID Code is required'),
  serialNo: z.string().default(''),
  cocNo: z.string().default(''),
  traceable: z.string().default(''),
  uncer: z.string().default(''),
  ranges: z
    .array(specialRangeSchema)
    .min(2, 'At least 2 range is required')
    .max(2, 'Maximum 2 ranges are allowed'),
});

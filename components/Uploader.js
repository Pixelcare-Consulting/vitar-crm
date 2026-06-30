import {
  processExcelUploadLocations,
  processExcelUploadEquipment,
  processExcelUploadCustomerEquipments,
  processExcelUploadCalibrationCUSWD,
  processExcelUploadCalibrationMPE,
  processExcelUploadCalibrationCKMass,
  processExcelUploadCalibrationACR,
  processExcelUploadCalibrationMaterials,
  processExcelUploadCalibrationRSCMC,
  processExcelUploadCalibrationEnvironmental,
  processExcelUploadCalibrationTher,
  processExcelUploadCalibrationTempRefs,
  processExcelUploadCalibrationWires,
  processExcelUploadCalibrationAux,
  processExcelUploadCalibrationExtensions,
  processExcelUploadCalibrationBath,
  processExcelUploadCalibrationBathStabilityUniformity,
  processExcelUploadCalibrationBathStability,
  processExcelUploadCalibrationBathUniformity,
  processExcelUploadCalibrationMeter,
  processExcelUploadCalibrationTempInstruments,
  processExcelUploadCalibrationCKTempHumid,
  processExcelUploadCalibrationCMC,
} from '@/services/excelUploadService';
import { parseExcelFile } from '@/utils/excelParser';

const LOCATIONS_HEADERS = [
  'Site_ID',
  'Site_name',
  'Customer_ID',
  'Customer_name',
  'Street_1',
  'Street_2',
  'Street_3',
  'Postcode',
  'City',
  'Province',
  'Country',
];

const EQUIPMENT_HEADER = [
  'Inventory_ID',
  'Category',
  'Description',
  'Tag_ID',
  'Make',
  'Model',
  'Serial_Number',
  'Type',
  'Range_(Min)',
  'Range_(Max)',
  'Range_(Min%)',
  'Range_(Max%)',
  'Certificate_No',
  'Traceability',
];

const CUSTOMER_EQUIPMENT_HEADER = [
  'ID',
  'Customer_Name',
  'Equipment_Name',
  'Make',
  'Model',
  'Serial_Number',
  'Range_Min',
  'Range_Max',
  'UOM',
  'Notes',
];

//* calibration Correction, Uncertainty of the Standard Weight & Draft
const CALIBRATION_CUSWD_HEADER = [
  'Guid',
  'TagId',
  'Class',
  'Nominal_Value_G',
  'Current_Year_Error_MG',
  'Current_Year_Actual_Value_G',
  'E_Uncertainty_MG',
  'U_Cert_G',
  'U_Cert2_G2',
  'U_Cert4V_G4',
  'U_Inst_G',
  'U_Inst2_G2',
  'U_Inst4V_G4',
  'Pr_KG_MN3',
  'U_Pr_KG_MN3',
  'Last_Year_Error_MG',
  'Last_Year_Actual_Value_G',
  'Drift_G',
];

const CALIBRATION_MPE = ['Guid', 'Code', 'Weight', 'MPE', 'Uncertainty'];
const CALIBRATION_CK_MASS = ['Guid', 'DOF', 'Value'];
const CALIBRATION_ACR = ['Guid', 'Code', 'E1', 'E2', 'F1', 'F2', 'M1', 'M2', 'M3'];
const CALIBRATION_MATERIAL = ['Guid', 'Code', 'Material', 'Pt_KG_MN3', 'U_Pt_KG_MN3'];
const CALIBRATION_RSCMC = ['Guid', 'Nominal_Value', 'Value'];
const CALIBRATION_ENVIRONMENTAL = ['Guid', 'Code', 'Description', 'U', 'Unit', 'Due_Date'];
const CALIBRATION_THER = [
  'Guid',
  'ID_Code',
  'Type',
  'Serial_No',
  'Traceable',
  'COC_No',
  'K_Factor',
  'Due_Date',
];
const CALIBRATION_TEMPERATURE_REFS = ['Guid', 'Reference', 'Test', 'Correction', 'Uncer', 'Drift'];
const CALIBRATION_WIRES = ['Guid', 'ID_Code', 'Code', 'Type'];
const CALIBRATION_AUX = [
  'Guid',
  'ID_Code',
  'Type',
  'Serial_No',
  'Traceable',
  'COC_No',
  'K_Factor',
  'Due_Date',
];
const CALIBRATION_EXTENSIONS = [
  'Guid',
  'ID_Code',
  'Uncer_Degree_Celsius',
  'Uncer_Percent_R_Humidity',
  'K_Factor',
  'Due_Date',
];

const CALIBRATION_BATH = [
  'Guid',
  'ID_Code',
  'No',
  'Min_D_Celsius',
  'Max_D_Celsius',
  'Min_Percent_R_Humidity',
  'Max_Percent_R_Humidity',
  'Stability_D_Celsius',
  'Stability_Percent_R_Humidity',
  'Uniformity_D_Celsius',
  'Uniformity_Percent_R_Humidity',
  'Radial_D_Celsius',
  'Axial_D_Celsius',
  'Due_Date',
];

const CALIBRATION_BATH_SETTING = [
  'Guid',
  'Code',
  'Stability_D_Celsius',
  'Stability_Percent_R_Humidity',
  'Uniformity_D_Celsius',
];
const CALIBRATION_BATH_STABILITY = ['Guid', 'Loc', 'Value1', 'Value2', 'Value3'];
const CALIBRATION_BATH_UNIFORMITY = ['Guid', 'Loc', 'Value1', 'Value2', 'Value3'];
const CALIBRATION_METER = ['Guid', 'ID_Code', 'Code', 'Type', 'K_Factor'];
const CALIBRATION_TEMPERATURE_INSTRUMENTS = ['Guid', 'Code', 'Description', 'Range'];
const CALIBRATION_CK_TEMP_HUMID = ['Guid', 'DOF', 'Value'];
const CALIBRATION_CMC = [
  'Guid',
  'Description',
  'Type',
  'No',
  'Location',
  'Min',
  'Max',
  'Uncertainty',
];

export const dataExcelParser = {
  locations: (file) => parseExcelFile(file, LOCATIONS_HEADERS),
  equipments: (file) => parseExcelFile(file, EQUIPMENT_HEADER),
  customerEquipments: (file) => parseExcelFile(file, CUSTOMER_EQUIPMENT_HEADER),

  jobCalibrationReferences_CR000001_data: (file) => {
    return parseExcelFile(file, CALIBRATION_CUSWD_HEADER, false);
  },
  jobCalibrationReferences_CR000002_data: (file) => {
    return parseExcelFile(file, CALIBRATION_MPE);
  },
  jobCalibrationReferences_CR000003_data: (file) => {
    return parseExcelFile(file, CALIBRATION_CK_MASS);
  },
  jobCalibrationReferences_CR000004_data: (file) => {
    return parseExcelFile(file, CALIBRATION_ACR);
  },
  jobCalibrationReferences_CR000005_data: (file) => {
    return parseExcelFile(file, CALIBRATION_MATERIAL);
  },
  jobCalibrationReferences_CR000006_data: (file) => {
    return parseExcelFile(file, CALIBRATION_RSCMC);
  },
  jobCalibrationReferences_CR000007_data: (file) => {
    return parseExcelFile(file, CALIBRATION_ENVIRONMENTAL);
  },
  jobCalibrationReferences_CR000008_data: (file) => {
    return parseExcelFile(file, CALIBRATION_THER);
  },
  'jobCalibrationReferences_CR000008_data_temperatureRefs_<idCode>': (file) => {
    return parseExcelFile(file, CALIBRATION_TEMPERATURE_REFS);
  },
  jobCalibrationReferences_CR000009_data: (file) => {
    return parseExcelFile(file, CALIBRATION_WIRES);
  },
  'jobCalibrationReferences_CR000009_data_temperatureRefs_<code>': (file) => {
    return parseExcelFile(file, CALIBRATION_TEMPERATURE_REFS);
  },
  'jobCalibrationReferences_CR000009_data_temperatureRefs_<code>_<type>': (file) => {
    return parseExcelFile(file, CALIBRATION_TEMPERATURE_REFS);
  },
  jobCalibrationReferences_CR000010_data: (file) => {
    return parseExcelFile(file, CALIBRATION_AUX);
  },
  'jobCalibrationReferences_CR000010_data_temperatureRefs_<idCode>': (file) => {
    return parseExcelFile(file, CALIBRATION_TEMPERATURE_REFS);
  },
  jobCalibrationReferences_CR000011_data: (file) => {
    return parseExcelFile(file, CALIBRATION_EXTENSIONS);
  },
  jobCalibrationReferences_CR000012_data: (file) => {
    return parseExcelFile(file, CALIBRATION_BATH);
  },
  jobCalibrationReferences_CR000013_data: (file) => {
    return parseExcelFile(file, CALIBRATION_BATH_SETTING);
  },
  jobCalibrationReferences_CR000014_data: (file) => {
    return parseExcelFile(file, CALIBRATION_BATH_STABILITY);
  },
  jobCalibrationReferences_CR000015_data: (file) => {
    return parseExcelFile(file, CALIBRATION_BATH_UNIFORMITY);
  },
  jobCalibrationReferences_CR000016_data: (file) => {
    return parseExcelFile(file, CALIBRATION_METER);
  },
  'jobCalibrationReferences_CR000016_data_temperatureRefs_<code>': (file) => {
    return parseExcelFile(file, CALIBRATION_TEMPERATURE_REFS);
  },
  jobCalibrationReferences_CR000017_data: (file) => {
    return parseExcelFile(file, CALIBRATION_TEMPERATURE_INSTRUMENTS);
  },
  jobCalibrationReferences_CR000018_data: (file) => {
    return parseExcelFile(file, CALIBRATION_CK_TEMP_HUMID);
  },
  jobCalibrationReferences_CR000019_data: (file) => {
    return parseExcelFile(file, CALIBRATION_CMC);
  },
};

export const dataProcessExcelUploader = {
  // locations: (data) => processExcelUploadLocations(data),
  // equipments: (prefix, dataKey, data, onProgress, onStat, startFromLastData) => {
  //   processExcelUploadEquipment(prefix, dataKey, data, onProgress, onStat, startFromLastData);
  // },

  //* correct implementation, above flacky need imporvement
  customerEquipments: (param) => processExcelUploadCustomerEquipments(param),
  jobCalibrationReferences_CR000001_data: (param) => processExcelUploadCalibrationCUSWD(param),
  jobCalibrationReferences_CR000002_data: (param) => processExcelUploadCalibrationMPE(param),
  jobCalibrationReferences_CR000003_data: (param) => processExcelUploadCalibrationCKMass(param),
  jobCalibrationReferences_CR000004_data: (param) => processExcelUploadCalibrationACR(param),
  jobCalibrationReferences_CR000005_data: (param) => processExcelUploadCalibrationMaterials(param),
  jobCalibrationReferences_CR000006_data: (param) => processExcelUploadCalibrationRSCMC(param),
  jobCalibrationReferences_CR000007_data: (param) => processExcelUploadCalibrationEnvironmental(param), // prettier-ignore
  jobCalibrationReferences_CR000008_data: (param) => processExcelUploadCalibrationTher(param), // prettier-ignore
  'jobCalibrationReferences_CR000008_data_temperatureRefs_<idCode>': (param) => processExcelUploadCalibrationTempRefs(param), // prettier-ignore
  jobCalibrationReferences_CR000009_data: (param) => processExcelUploadCalibrationWires(param), // prettier-ignore
  'jobCalibrationReferences_CR000009_data_temperatureRefs_<code>': (param) => processExcelUploadCalibrationTempRefs(param), // prettier-ignore
  'jobCalibrationReferences_CR000009_data_temperatureRefs_<code>_<type>': (param) => processExcelUploadCalibrationTempRefs(param), // prettier-ignore
  jobCalibrationReferences_CR000010_data: (param) => processExcelUploadCalibrationAux(param), // prettier-ignore
  'jobCalibrationReferences_CR000010_data_temperatureRefs_<idCode>': (param) => processExcelUploadCalibrationTempRefs(param), // prettier-ignore
  jobCalibrationReferences_CR000011_data: (param) => processExcelUploadCalibrationExtensions(param), // prettier-ignore
  jobCalibrationReferences_CR000012_data: (param) => processExcelUploadCalibrationBath(param), // prettier-ignore
  jobCalibrationReferences_CR000013_data: (param) => processExcelUploadCalibrationBathStabilityUniformity(param), // prettier-ignore
  jobCalibrationReferences_CR000014_data: (param) => processExcelUploadCalibrationBathStability(param), // prettier-ignore
  jobCalibrationReferences_CR000015_data: (param) => processExcelUploadCalibrationBathUniformity(param), // prettier-ignore
  jobCalibrationReferences_CR000016_data: (param) => processExcelUploadCalibrationMeter(param), // prettier-ignore
  'jobCalibrationReferences_CR000016_data_temperatureRefs_<code>': (param) => processExcelUploadCalibrationTempRefs(param), // prettier-ignore
  jobCalibrationReferences_CR000017_data: (param) => processExcelUploadCalibrationTempInstruments(param), // prettier-ignore
  jobCalibrationReferences_CR000018_data: (param) => processExcelUploadCalibrationCKTempHumid(param), // prettier-ignore
  jobCalibrationReferences_CR000019_data: (param) => processExcelUploadCalibrationCMC(param), // prettier-ignore
};

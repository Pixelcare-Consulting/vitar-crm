import { db } from '../firebase';
import {
  collection,
  writeBatch,
  doc,
  getDocs,
  serverTimestamp,
  arrayUnion,
  documentId,
  getDoc,
  query,
  where,
  limit,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { dataProcessExcelUploader } from '@/components/Uploader';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const processExcelUploadLocations = async (
  data,
  onProgress,
  onStats,
  startFromCustomer = ''
) => {
  const auth = getAuth();
  const currentUser = auth.currentUser;

  if (!currentUser) return;

  try {
    let stats = {
      total: data.length,
      processed: 0,
      customersSuccess: 0,
      locationsSuccess: 0,
      errors: 0,
      currentItem: '',
      status: 'processing',
    };

    onStats(stats);
    let batch = writeBatch(db);

    // Find starting index
    let startIndex = 0;
    if (startFromCustomer) {
      startIndex = data.findIndex((row) => row.Customer_name === startFromCustomer);
      if (startIndex === -1) startIndex = 0;
    }

    // Get existing records
    const existingCustomers = new Map();
    const existingLocations = new Map();

    const customersSnapshot = await getDocs(collection(db, 'customers'));
    customersSnapshot.forEach((doc) => {
      const data = doc.data();
      existingCustomers.set(data.customerName, data.customerId);
    });

    const locationsSnapshot = await getDocs(collection(db, 'locations'));
    locationsSnapshot.forEach((doc) => {
      const data = doc.data();
      existingLocations.set(data.siteName, data.siteId);
    });

    const BATCH_SIZE = 20; // Reduced batch size
    const DELAY_BETWEEN_BATCHES = 3000; // 3 seconds delay

    // Process each row
    for (let i = startIndex; i < data.length; i++) {
      const row = data[i];
      try {
        if (!row.Customer_name || !row.Site_name) {
          console.log('Skipping row due to missing required data:', row);
          stats.errors++;
          continue;
        }

        let operationsInBatch = 0;

        // Create or get customer
        let customerId = existingCustomers.get(row.Customer_name);
        if (!customerId) {
          customerId = `C${String(existingCustomers.size + 1).padStart(6, '0')}`;

          // Simplified customer data structure
          const customerData = {
            customerId: customerId,
            customerName: row.Customer_name || '',
            status: 'active',
            locations: [], // Only store references to locations
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };

          batch.set(doc(db, 'customers', customerId), customerData);
          existingCustomers.set(row.Customer_name, customerId);
          stats.customersSuccess++;
          operationsInBatch++;
        }

        // Create location if doesn't exist
        let siteId = existingLocations.get(row.Site_name);
        if (!siteId) {
          siteId = `S${String(existingLocations.size + 1).padStart(6, '0')}`;

          // Simplified location data structure
          const locationData = {
            siteId: siteId,
            siteName: row.Site_name || '',
            customerId: customerId,
            customerName: row.Customer_name || '',
            address: {
              street1: row.Street_1 || '',
              street2: row.Street_2 || '',
              street3: row.Street_3 || '',
              city: row.City || '',
              postcode: row.Postcode || '',
              province: row.Province || '',
              country: row.Country || '',
            },
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };

          // Update customer's locations array with minimal data
          if (operationsInBatch < BATCH_SIZE) {
            const customerRef = doc(db, 'customers', customerId);
            batch.update(customerRef, {
              locations: arrayUnion({
                siteId: siteId,
                siteName: row.Site_name,
              }),
            });
            operationsInBatch++;
          }

          if (operationsInBatch < BATCH_SIZE) {
            batch.set(doc(db, 'locations', siteId), locationData);
            existingLocations.set(row.Site_name, siteId);
            stats.locationsSuccess++;
            operationsInBatch++;
          }
        }

        stats.processed++;

        // Update progress
        onProgress(Math.round(((i + 1 - startIndex) / (data.length - startIndex)) * 100));
        onStats({
          ...stats,
          currentItem: `Processing ${row.Customer_name} - ${row.Site_name}`,
        });

        // Commit batch when limit reached
        if (operationsInBatch >= BATCH_SIZE) {
          await batch.commit();
          console.log(`Batch committed at row ${i + 1}. Waiting...`);
          await delay(DELAY_BETWEEN_BATCHES);
          batch = writeBatch(db);
          operationsInBatch = 0;
        }
      } catch (error) {
        console.error(`Error processing row ${i + 1}:`, error);
        stats.errors++;
        localStorage.setItem('lastProcessedCustomer', row.Customer_name);
        await delay(DELAY_BETWEEN_BATCHES * 2);
      }
    }

    // Commit final batch
    if (stats.processed > 0) {
      await batch.commit();
    }

    localStorage.removeItem('lastProcessedCustomer');
    stats.status = 'completed';
    onStats(stats);
    return stats;
  } catch (error) {
    console.error('Fatal error in processExcelUpload:', error);
    throw error;
  }
};

//* dataKey - firebase collection name
//* prefix - character to prefix equipment ID
//* data - excel data
//* onProgress - callback to update progress
//* onStats - callback to update stats
//* startFromLastData - start from last data

export const processExcelUploadEquipment = async (
  prefix,
  dataKey,
  data,
  onProgress,
  onStats,
  startFromTemperature = ''
) => {
  const auth = getAuth();
  const currentUser = auth.currentUser;

  let stats = {
    total: data.length,
    processed: 0,
    [`${dataKey}Success`]: 0,
    errors: 0,
    currentItem: '',
    status: 'processing',
  };

  if (!currentUser) return;

  try {
    onStats(stats);
    let batch = writeBatch(db);

    // Find starting index
    let startIndex = 0;
    if (startFromTemperature) {
      startIndex = data.findIndex((row) => `${row.Tag_ID}` === startFromTemperature);
      if (startIndex === -1) startIndex = 0;
    }

    // Get existing records
    const existingEquipments = new Map();

    const temperaturesSnapshot = await getDocs(collection(db, dataKey));
    temperaturesSnapshot.forEach((doc) => {
      const data = doc.data();
      existingEquipments.set(data.inventoryId, data);
    });

    const BATCH_SIZE = 20; // Reduced batch size
    const DELAY_BETWEEN_BATCHES = 3000; // 3 seconds delay

    for (let i = startIndex; i < data.length; i++) {
      const row = data[i];

      try {
        if (!row.Category || !row.Description || !row.Tag_ID) {
          console.log('Skipping row due to missing required data:', row);
          stats.errors++;
          continue;
        }

        let operationsInBatch = 0;

        // Create or get temperature
        let tempHumidId = existingEquipments.get(`${row.Category}-${row.Tag_ID}`);
        if (!tempHumidId) {
          tempHumidId = `${prefix}${String(existingEquipments.size + 1).padStart(6, '0')}`;

          // Simplified temperature data structure
          const temperatureData = {
            inventoryId: tempHumidId,
            category: row.Category || '',
            description: row.Description || '',
            tagId: row.Tag_ID || '',
            make: row.Make || '',
            model: row.Model || '',
            serialNumber: row.Serial_Number || '',
            type: row.Type || '',
            rangeMin: row['Range_(Min)'] || '',
            rangeMax: row['Range_(Max)'] || '',
            rangeMinPercent: row['Range_(Min%)'] || '',
            rangeMaxPercent: row['Range_(Max%)'] || '',
            certificateNo: row.Certificate_No || '',
            traceability: row.Traceability || '',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };

          batch.set(doc(db, dataKey, tempHumidId), temperatureData);
          existingEquipments.set(`${row.Category}-${row.Tag_ID}`, tempHumidId);
          stats[`${dataKey}Success`]++;
          operationsInBatch++;
        }

        stats.processed++;

        // Update progress
        onProgress(Math.round(((i + 1 - startIndex) / (data.length - startIndex)) * 100));
        onStats({
          ...stats,
          currentItem: `Processing ${row.Description}-${row.Tag_ID}-${row.Category}`,
        });

        // Commit batch when limit reached
        if (operationsInBatch >= BATCH_SIZE) {
          await batch.commit();
          console.log(`Batch committed at row ${i + 1}. Waiting...`);
          await delay(DELAY_BETWEEN_BATCHES);
          batch = writeBatch(db);
          operationsInBatch = 0;
        }
      } catch (error) {
        console.error(`Error processing row ${i + 1}:`, error);
        stats.errors++;
        localStorage.setItem(`lastProcessed${dataKey}`, row.Tag_ID);
        await delay(DELAY_BETWEEN_BATCHES * 2);
      }
    }

    // Commit final batch
    if (stats.processed > 0) {
      await batch.commit();
    }

    localStorage.removeItem(`lastProcessed${dataKey}`);
    stats.status = 'completed';
    onStats(stats);
    return stats;
  } catch (error) {
    console.error('Fatal error in processExcelUpload:', error);
    throw error;
  }
};

export const processExcelUploadCustomerEquipments = async ({
  prefix,
  dataKey,
  data,
  onProgress,
  onStats,
  lastDataId,
}) => {
  const auth = getAuth();
  const currentUser = auth.currentUser;

  let stats = {
    total: data.length,
    [`${dataKey}Success`]: 0,
    processed: 0,
    errors: 0,
    currentItem: '',
    status: 'processing',
  };

  if (!currentUser) return;

  try {
    onStats(stats);

    const BATCH_SIZE = 20; //* Reduced batch size
    const DELAY_BETWEEN_BATCHES = 3000; //* 3 seconds delay

    let batch = writeBatch(db);
    let operationsInBatch = 0; //* Tracks number of operations in batch

    //* Find starting index
    let startIndex = 0;
    if (lastDataId) {
      startIndex = data.findIndex((row) => `${row.ID}-${row.Equipment_Name}` === lastDataId);
      if (startIndex === -1) startIndex = 0;
    }

    //* Get existing records
    const existingCustomerEquipments = new Map();

    const customerEquipmentsSnapshot = await getDocs(collection(db, dataKey));
    if (!customerEquipmentsSnapshot.empty) {
      customerEquipmentsSnapshot.forEach((doc) => {
        const data = doc.data();
        existingCustomerEquipments.set(`${data.customerId}-${data.description}`, data);
      });
    }

    for (let i = startIndex; i < data.length; i++) {
      const row = data[i];

      try {
        if (!row.ID || !row.Customer_Name || !row.Equipment_Name || !row.Make || !row.Model) {
          console.log('Skipping row due to missing required data:', row);
          stats.errors++;
          continue;
        }

        //* if id exist dont add otherwise add
        let customerEquipmentId = existingCustomerEquipments.get(`${row.ID}-${row.Equipment_Name}`);
        if (!customerEquipmentId) {
          customerEquipmentId = `${prefix}${String(existingCustomerEquipments.size + 1).padStart(
            6,
            '0'
          )}`;

          const customerEquipmentData = {
            equipmentId: customerEquipmentId,
            customerId: row.ID,
            customerName: row.Customer_Name || '',
            description: row.Equipment_Name || '',
            make: row.Make || '',
            model: row.Model || '',
            serialNumber: row.Serial_Number || '',
            rangeMin: row.Range_Min || '',
            rangeMax: row.Range_Max || '',
            uom: row.UOM || '',
            notes: row.Notes || '',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };

          batch.set(doc(db, dataKey, customerEquipmentId), customerEquipmentData);
          existingCustomerEquipments.set(`${row.ID}-${row.Equipment_Name}`, customerEquipmentId);
          stats[`${dataKey}Success`]++;
          operationsInBatch++;
        }

        stats.processed++;

        //* Update progress
        onProgress(Math.round(((i + 1 - startIndex) / (data.length - startIndex)) * 100));
        onStats({
          ...stats,
          currentItem: `Processing ${row.ID}-${row.Equipment_Name}`,
        });

        //* Commit batch when limit reached
        if (operationsInBatch === BATCH_SIZE) {
          await batch.commit();

          //* log
          console.log(`Batch committed at row ${i + 1}. Waiting...`);

          //* Delay
          await delay(DELAY_BETWEEN_BATCHES);

          //* Reset batch
          batch = writeBatch(db);
          operationsInBatch = 0;
        }
      } catch (error) {
        console.error(`Error processing row ${i + 1}:`, error);
        localStorage.setItem(`lastProcessed${dataKey}`, `${row.ID}-${row.Equipment_Name}`);
        stats.errors++;
        await delay(DELAY_BETWEEN_BATCHES * 2);
      }
    }

    //* Commit final batch
    if (stats.processed > 0) {
      console.log(`Committing final batch with No of operation: ${operationsInBatch}`);
      await batch.commit();
    }

    localStorage.removeItem(`lastProcessed${dataKey}`);
    stats.status = 'completed';
    onStats(stats);
    return stats;
  } catch (error) {
    console.error('FATAL ERROR  IN PROCESS_EXCEL_UPLOADER_CUSTOMER_EQUIPMENTS:', error);
    throw error;
  }
};

export const processExcelUploadCalibrationCUSWD = async ({
  prefix,
  dataKey,
  data,
  onProgress,
  onStats,
  lastDataId,
}) => {
  const auth = getAuth();
  const currentUser = auth.currentUser;

  let stats = {
    total: data.length,
    [`${dataKey}Success`]: 0,
    processed: 0,
    errors: 0,
    currentItem: '',
    status: 'processing',
  };

  // if (!currentUser) return;

  try {
    onStats(stats);

    const BATCH_SIZE = 20; //* Reduced batch size
    const DELAY_BETWEEN_BATCHES = 3000; //* 3 seconds delay

    let batch = writeBatch(db);
    let operationsInBatch = 0; //* Tracks number of operations in batch

    //* Find starting index
    let startIndex = 0;
    if (lastDataId) {
      startIndex = data.findIndex((row) => row.Guid === lastDataId);
      if (startIndex === -1) startIndex = 0;
    }

    const existingCK = new Map();

    const [dataKeyA, dataKeyB, dataKeyC] = dataKey.split('_');

    if ((!dataKeyA || !dataKeyB, !dataKeyC)) return;

    //* Get existing records
    const calibrationCUSWDSnapshot = await getDocs(collection(db, dataKeyA, dataKeyB, dataKeyC));

    if (!calibrationCUSWDSnapshot.empty) {
      calibrationCUSWDSnapshot.forEach((doc) => {
        const data = doc.data();
        existingCK.set(data.refId, data);
      });
    }

    for (let i = startIndex; i < data.length; i++) {
      const row = data[i];

      try {
        //* if row is empty then continue otherwise store in db
        if (
          !row.TagId &&
          !row.Class &&
          !row.Nominal_Value_G &&
          !row.Current_Year_Error_MG &&
          !row.Current_Year_Actual_Value_G &&
          !row.E_Uncertainty_MG &&
          !row.U_Cert_G &&
          !row.U_Cert2_G2 &&
          !row.U_Cert4V_G4 &&
          !row.U_Inst_G &&
          !row.U_Inst2_G2 &&
          !row.U_Inst4V_G4 &&
          !row.Pr_KG_MN3 &&
          !row.U_Pr_KG_MN3 &&
          !row.Last_Year_Error_MG &&
          !row.Last_Year_Actual_Value_G &&
          !row.Drift_G
        ) {
          console.log('Skipping row due to being empty:', row);
          stats.errors++;
          continue;
        }

        let cuswdId = existingCUSWD.get(row?.Guid);
        if (!cuswdId) {
          cuswdId = `${prefix}${String(existingCUSWD.size + 1).padStart(6, '0')}`;

          const cuswdData = {
            refId: cuswdId,
            tagId: row?.TagId || '',
            class: row?.Class || '',
            nominalValue: row?.Nominal_Value_G || '',
            currentYearError: row?.Current_Year_Error_MG || '',
            currentYearActualValue: row?.Current_Year_Actual_Value_G || '',
            eUncertainty: row?.E_Uncertainty_MG || '',
            uCertg: row?.U_Cert_G || '',
            uCert2g2: row?.U_Cert2_G2 || '',
            uCert4vG4: row?.U_Cert4V_G4 || '',
            uInstg: row?.U_Inst_G || '',
            uInst2g2: row?.U_Inst2_G2 || '',
            uInst4vG4: row?.U_Inst4V_G4 || '',
            prKgMn3: row?.Pr_KG_MN3 || '',
            uPrKgMn3: row?.U_Pr_KG_MN3 || '',
            lastYearError: row?.Last_Year_Error_MG || '',
            lastYearActualValue: row?.Last_Year_Actual_Value_G || '',
            driftg: row?.Drift_G || '',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };

          batch.set(doc(db, dataKeyA, dataKeyB, dataKeyC, cuswdId), cuswdData);
          existingCUSWD.set(row?.Guid, cuswdId);
          stats[`${dataKey}Success`]++;
          operationsInBatch++;
        }

        stats.processed++;

        //* Update progress
        onProgress(Math.round(((i + 1 - startIndex) / (data.length - startIndex)) * 100));
        onStats({
          ...stats,
          currentItem: `Processing ${row.Guid}`,
        });

        //* Commit batch when limit reached
        if (operationsInBatch === BATCH_SIZE) {
          await batch.commit();

          //* log
          console.log(`Batch committed at row ${i + 1}. Waiting...`);

          //* Delay
          await delay(DELAY_BETWEEN_BATCHES);

          //* Reset batch
          batch = writeBatch(db);
          operationsInBatch = 0;
        }
      } catch (error) {
        console.error(`Error processing row ${i + 1}:`, error);
        localStorage.setItem(`lastProcessed${dataKey}`, row.Guid);
        stats.errors++;
        await delay(DELAY_BETWEEN_BATCHES * 2);
      }
    }

    //* Commit final batch
    if (stats.processed > 0) {
      console.log(`Committing final batch with No of operation: ${operationsInBatch}`);
      await batch.commit();
    }

    localStorage.removeItem(`lastProcessed${dataKey}`);
    stats.status = 'completed';
    onStats(stats);
    return stats;
  } catch (error) {
    console.error('FATAL ERROR  IN PROCESS_EXCEL_UPLOADER_CALIBRATION_CUSWD:', error);
    throw error;
  }
};

export const processExcelUploadCalibrationMPE = async ({
  prefix,
  dataKey,
  data,
  onProgress,
  onStats,
  lastDataId,
}) => {
  const auth = getAuth();
  const currentUser = auth.currentUser;

  let stats = {
    total: data.length,
    [`${dataKey}Success`]: 0,
    processed: 0,
    errors: 0,
    currentItem: '',
    status: 'processing',
  };

  // if (!currentUser) return;

  try {
    onStats(stats);

    const BATCH_SIZE = 20; //* Reduced batch size
    const DELAY_BETWEEN_BATCHES = 3000; //* 3 seconds delay

    let batch = writeBatch(db);
    let operationsInBatch = 0; //* Tracks number of operations in batch

    //* Find starting index
    let startIndex = 0;
    if (lastDataId) {
      startIndex = data.findIndex((row) => row.Guid === lastDataId);
      if (startIndex === -1) startIndex = 0;
    }

    const [dataKeyA, dataKeyB, dataKeyC] = dataKey.split('_');

    if ((!dataKeyA || !dataKeyB, !dataKeyC)) return;

    const existingMPE = new Map();

    //* Get existing records
    const calibrationMPEsnapshot = await getDocs(collection(db, dataKeyA, dataKeyB, dataKeyC));

    if (!calibrationMPEsnapshot.empty) {
      calibrationMPEsnapshot.forEach((doc) => {
        const data = doc.data();
        existingMPE.set(data.refId, data);
      });
    }

    for (let i = startIndex; i < data.length; i++) {
      const row = data[i];

      try {
        //* check if row has the required fields or not, if not skip
        if (!row.Code || !row.Weight || !row.MPE) {
          console.log('Skipping row due to missing required data:', row);
          stats.errors++;
          continue;
        }

        let refId = existingMPE.get(row.Guid);
        if (!refId) {
          refId = `${prefix}${String(existingMPE.size + 1).padStart(6, '0')}`;

          const mpeData = {
            refId,
            code: row?.Code || '',
            weight: row?.Weight || '',
            mpe: row?.MPE || '',
            uncertainty: row?.Uncertainty || '',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };

          batch.set(doc(db, dataKeyA, dataKeyB, dataKeyC, refId), mpeData);
          existingMPE.set(row?.Guid, refId);
          stats[`${dataKey}Success`]++;
          operationsInBatch++;
        }

        stats.processed++;

        //* Update progress
        onProgress(Math.round(((i + 1 - startIndex) / (data.length - startIndex)) * 100));
        onStats({
          ...stats,
          currentItem: `Processing ${row.Guid}`,
        });

        //* Commit batch when limit reached
        if (operationsInBatch === BATCH_SIZE) {
          await batch.commit();

          //* log
          console.log(`Batch committed at row ${i + 1}. Waiting...`);

          //* Delay
          await delay(DELAY_BETWEEN_BATCHES);

          //* Reset batch
          batch = writeBatch(db);
          operationsInBatch = 0;
        }
      } catch (error) {
        console.error(`Error processing row ${i + 1}:`, error);
        localStorage.setItem(`lastProcessed${dataKey}`, row.Guid);
        stats.errors++;
        await delay(DELAY_BETWEEN_BATCHES * 2);
      }
    }

    //* Commit final batch
    if (stats.processed > 0) {
      console.log(`Committing final batch with No of operation: ${operationsInBatch}`);
      await batch.commit();
    }

    localStorage.removeItem(`lastProcessed${dataKey}`);
    stats.status = 'completed';
    onStats(stats);
    return stats;
  } catch (error) {
    console.error('FATAL ERROR  IN PROCESS_EXCEL_UPLOADER_CALIBRATION_MPE:', error);
    throw error;
  }
};

export const processExcelUploadCalibrationCKMass = async ({
  prefix,
  dataKey,
  data,
  onProgress,
  onStats,
  lastDataId,
}) => {
  const auth = getAuth();
  const currentUser = auth.currentUser;

  let stats = {
    total: data.length,
    [`${dataKey}Success`]: 0,
    processed: 0,
    errors: 0,
    currentItem: '',
    status: 'processing',
  };

  // if (!currentUser) return;

  try {
    onStats(stats);

    const BATCH_SIZE = 20; //* Reduced batch size
    const DELAY_BETWEEN_BATCHES = 3000; //* 3 seconds delay

    let batch = writeBatch(db);
    let operationsInBatch = 0; //* Tracks number of operations in batch

    //* Find starting index
    let startIndex = 0;
    if (lastDataId) {
      startIndex = data.findIndex((row) => row.Guid === lastDataId);
      if (startIndex === -1) startIndex = 0;
    }

    const [dataKeyA, dataKeyB, dataKeyC] = dataKey.split('_');

    if ((!dataKeyA || !dataKeyB, !dataKeyC)) return;

    const existingCK = new Map();

    //* Get existing records
    const calibrationCKsnapshot = await getDocs(collection(db, dataKeyA, dataKeyB, dataKeyC));

    if (!calibrationCKsnapshot.empty) {
      calibrationCKsnapshot.forEach((doc) => {
        const data = doc.data();
        existingCK.set(data.refId, data);
      });
    }

    for (let i = startIndex; i < data.length; i++) {
      const row = data[i];

      try {
        //* check if row has the required fields or not, if not skip
        if (!row.DOF || !row.Value) {
          console.log('Skipping row due to missing required data:', row);
          stats.errors++;
          continue;
        }

        let refId = existingCK.get(row.Guid);
        if (!refId) {
          refId = `${prefix}${String(existingCK.size + 1).padStart(6, '0')}`;

          const ckData = {
            refId,
            dof: row?.DOF || '-1',
            value: row?.Value || '-1',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };

          batch.set(doc(db, dataKeyA, dataKeyB, dataKeyC, refId), ckData);
          existingCK.set(row?.Guid, refId);
          stats[`${dataKey}Success`]++;
          operationsInBatch++;
        }

        stats.processed++;

        //* Update progress
        onProgress(Math.round(((i + 1 - startIndex) / (data.length - startIndex)) * 100));
        onStats({
          ...stats,
          currentItem: `Processing ${row.Guid}`,
        });

        //* Commit batch when limit reached
        if (operationsInBatch === BATCH_SIZE) {
          await batch.commit();

          //* log
          console.log(`Batch committed at row ${i + 1}. Waiting...`);

          //* Delay
          await delay(DELAY_BETWEEN_BATCHES);

          //* Reset batch
          batch = writeBatch(db);
          operationsInBatch = 0;
        }
      } catch (error) {
        console.error(`Error processing row ${i + 1}:`, error);
        localStorage.setItem(`lastProcessed${dataKey}`, row.Guid);
        stats.errors++;
        await delay(DELAY_BETWEEN_BATCHES * 2);
      }
    }

    //* Commit final batch
    if (stats.processed > 0) {
      console.log(`Committing final batch with No of operation: ${operationsInBatch}`);
      await batch.commit();
    }

    localStorage.removeItem(`lastProcessed${dataKey}`);
    stats.status = 'completed';
    onStats(stats);
    return stats;
  } catch (error) {
    console.error('FATAL ERROR  IN PROCESS_EXCEL_UPLOADER_CALIBRATION_CK_MASS:', error);
    throw error;
  }
};

export const processExcelUploadCalibrationACR = async ({
  prefix,
  dataKey,
  data,
  onProgress,
  onStats,
  lastDataId,
}) => {
  const auth = getAuth();
  const currentUser = auth.currentUser;

  let stats = {
    total: data.length,
    [`${dataKey}Success`]: 0,
    processed: 0,
    errors: 0,
    currentItem: '',
    status: 'processing',
  };

  // if (!currentUser) return;

  try {
    onStats(stats);

    const BATCH_SIZE = 20; //* Reduced batch size
    const DELAY_BETWEEN_BATCHES = 3000; //* 3 seconds delay

    let batch = writeBatch(db);
    let operationsInBatch = 0; //* Tracks number of operations in batch

    //* Find starting index
    let startIndex = 0;
    if (lastDataId) {
      startIndex = data.findIndex((row) => row.Guid === lastDataId);
      if (startIndex === -1) startIndex = 0;
    }

    const [dataKeyA, dataKeyB, dataKeyC] = dataKey.split('_');

    if ((!dataKeyA || !dataKeyB, !dataKeyC)) return;

    const existingACR = new Map();

    //* Get existing records
    const calibrationACRsnapshot = await getDocs(collection(db, dataKeyA, dataKeyB, dataKeyC));

    if (!calibrationACRsnapshot.empty) {
      calibrationACRsnapshot.forEach((doc) => {
        const data = doc.data();
        existingACR.set(data.refId, data);
      });
    }

    for (let i = startIndex; i < data.length; i++) {
      const row = data[i];

      try {
        //* check if row has the required fields or not, if not skip
        if (!row.Code) {
          console.log('Skipping row due to missing required data:', row);
          stats.errors++;
          continue;
        }

        let refId = existingACR.get(row.Guid);
        if (!refId) {
          refId = `${prefix}${String(existingACR.size + 1).padStart(6, '0')}`;

          const acrData = {
            refId,
            code: row?.Code || '',
            e1: row?.E1 || '',
            e2: row?.E2 || '',
            f1: row?.F1 || '',
            f2: row?.F2 || '',
            m1: row?.M1 || '',
            m2: row?.M2 || '',
            m3: row?.M3 || '',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };

          batch.set(doc(db, dataKeyA, dataKeyB, dataKeyC, refId), acrData);
          existingACR.set(row?.Guid, refId);
          stats[`${dataKey}Success`]++;
          operationsInBatch++;
        }

        stats.processed++;

        //* Update progress
        onProgress(Math.round(((i + 1 - startIndex) / (data.length - startIndex)) * 100));
        onStats({
          ...stats,
          currentItem: `Processing ${row.Guid}`,
        });

        //* Commit batch when limit reached
        if (operationsInBatch === BATCH_SIZE) {
          await batch.commit();

          //* log
          console.log(`Batch committed at row ${i + 1}. Waiting...`);

          //* Delay
          await delay(DELAY_BETWEEN_BATCHES);

          //* Reset batch
          batch = writeBatch(db);
          operationsInBatch = 0;
        }
      } catch (error) {
        console.error(`Error processing row ${i + 1}:`, error);
        localStorage.setItem(`lastProcessed${dataKey}`, row.Guid);
        stats.errors++;
        await delay(DELAY_BETWEEN_BATCHES * 2);
      }
    }

    //* Commit final batch
    if (stats.processed > 0) {
      console.log(`Committing final batch with No of operation: ${operationsInBatch}`);
      await batch.commit();
    }

    localStorage.removeItem(`lastProcessed${dataKey}`);
    stats.status = 'completed';
    onStats(stats);
    return stats;
  } catch (error) {
    console.error('FATAL ERROR  IN PROCESS_EXCEL_UPLOADER_CALIBRATION_ACR:', error);
    throw error;
  }
};

export const processExcelUploadCalibrationMaterials = async ({
  prefix,
  dataKey,
  data,
  onProgress,
  onStats,
  lastDataId,
}) => {
  const auth = getAuth();
  const currentUser = auth.currentUser;

  let stats = {
    total: data.length,
    [`${dataKey}Success`]: 0,
    processed: 0,
    errors: 0,
    currentItem: '',
    status: 'processing',
  };

  // if (!currentUser) return;

  try {
    onStats(stats);

    const BATCH_SIZE = 20; //* Reduced batch size
    const DELAY_BETWEEN_BATCHES = 3000; //* 3 seconds delay

    let batch = writeBatch(db);
    let operationsInBatch = 0; //* Tracks number of operations in batch

    //* Find starting index
    let startIndex = 0;
    if (lastDataId) {
      startIndex = data.findIndex((row) => row.Guid === lastDataId);
      if (startIndex === -1) startIndex = 0;
    }

    const [dataKeyA, dataKeyB, dataKeyC] = dataKey.split('_');

    if ((!dataKeyA || !dataKeyB, !dataKeyC)) return;

    const existingMaterials = new Map();

    //* Get existing records
    const calibrationMaterialsSnapshot = await getDocs(
      collection(db, dataKeyA, dataKeyB, dataKeyC)
    );

    if (!calibrationMaterialsSnapshot.empty) {
      calibrationMaterialsSnapshot.forEach((doc) => {
        const data = doc.data();
        existingMaterials.set(data.refId, data);
      });
    }

    for (let i = startIndex; i < data.length; i++) {
      const row = data[i];

      try {
        //* check if row has the required fields or not, if not skip
        if (!row.Code || !row.Material) {
          console.log('Skipping row due to missing required data:', row);
          stats.errors++;
          continue;
        }

        let refId = existingMaterials.get(row.Guid);
        if (!refId) {
          refId = `${prefix}${String(existingMaterials.size + 1).padStart(6, '0')}`;

          const materialData = {
            refId,
            code: row?.Code || '',
            material: row?.Material || '',
            ptKgMn3: row?.Pt_KG_MN3 || '',
            uPtKgMn3: row?.U_Pt_KG_MN3 || '',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };

          batch.set(doc(db, dataKeyA, dataKeyB, dataKeyC, refId), materialData);
          existingMaterials.set(row?.Guid, refId);
          stats[`${dataKey}Success`]++;
          operationsInBatch++;
        }

        stats.processed++;

        //* Update progress
        onProgress(Math.round(((i + 1 - startIndex) / (data.length - startIndex)) * 100));
        onStats({
          ...stats,
          currentItem: `Processing ${row.Guid}`,
        });

        //* Commit batch when limit reached
        if (operationsInBatch === BATCH_SIZE) {
          await batch.commit();

          //* log
          console.log(`Batch committed at row ${i + 1}. Waiting...`);

          //* Delay
          await delay(DELAY_BETWEEN_BATCHES);

          //* Reset batch
          batch = writeBatch(db);
          operationsInBatch = 0;
        }
      } catch (error) {
        console.error(`Error processing row ${i + 1}:`, error);
        localStorage.setItem(`lastProcessed${dataKey}`, row.Guid);
        stats.errors++;
        await delay(DELAY_BETWEEN_BATCHES * 2);
      }
    }

    //* Commit final batch
    if (stats.processed > 0) {
      console.log(`Committing final batch with No of operation: ${operationsInBatch}`);
      await batch.commit();
    }

    localStorage.removeItem(`lastProcessed${dataKey}`);
    stats.status = 'completed';
    onStats(stats);
    return stats;
  } catch (error) {
    console.error('FATAL ERROR  IN PROCESS_EXCEL_UPLOADER_CALIBRATION_MATERIALS:', error);
    throw error;
  }
};

export const processExcelUploadCalibrationRSCMC = async ({
  prefix,
  dataKey,
  data,
  onProgress,
  onStats,
  lastDataId,
}) => {
  const auth = getAuth();
  const currentUser = auth.currentUser;

  let stats = {
    total: data.length,
    [`${dataKey}Success`]: 0,
    processed: 0,
    errors: 0,
    currentItem: '',
    status: 'processing',
  };

  // if (!currentUser) return;

  try {
    onStats(stats);

    const BATCH_SIZE = 20; //* Reduced batch size
    const DELAY_BETWEEN_BATCHES = 3000; //* 3 seconds delay

    let batch = writeBatch(db);
    let operationsInBatch = 0; //* Tracks number of operations in batch

    //* Find starting index
    let startIndex = 0;
    if (lastDataId) {
      startIndex = data.findIndex((row) => row.Guid === lastDataId);
      if (startIndex === -1) startIndex = 0;
    }

    const [dataKeyA, dataKeyB, dataKeyC] = dataKey.split('_');

    if ((!dataKeyA || !dataKeyB, !dataKeyC)) return;

    const existingRSCMC = new Map();

    //* Get existing records
    const calibrationRSCMCsnapshot = await getDocs(collection(db, dataKeyA, dataKeyB, dataKeyC));

    if (!calibrationRSCMCsnapshot.empty) {
      calibrationRSCMCsnapshot.forEach((doc) => {
        const data = doc.data();
        existingRSCMC.set(data.refId, data);
      });
    }

    for (let i = startIndex; i < data.length; i++) {
      const row = data[i];

      try {
        //* check if row has the required fields or not, if not skip
        if (!row.Nominal_Value || !row.Value) {
          console.log('Skipping row due to missing required data:', row);
          stats.errors++;
          continue;
        }

        let refId = existingRSCMC.get(row.Guid);
        if (!refId) {
          refId = `${prefix}${String(existingRSCMC.size + 1).padStart(6, '0')}`;

          const rscmcData = {
            refId,
            nominalValue: row?.Nominal_Value || '',
            value: row?.Value || '',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };

          batch.set(doc(db, dataKeyA, dataKeyB, dataKeyC, refId), rscmcData);
          existingRSCMC.set(row?.Guid, refId);
          stats[`${dataKey}Success`]++;
          operationsInBatch++;
        }

        stats.processed++;

        //* Update progress
        onProgress(Math.round(((i + 1 - startIndex) / (data.length - startIndex)) * 100));
        onStats({
          ...stats,
          currentItem: `Processing ${row.Guid}`,
        });

        //* Commit batch when limit reached
        if (operationsInBatch === BATCH_SIZE) {
          await batch.commit();

          //* log
          console.log(`Batch committed at row ${i + 1}. Waiting...`);

          //* Delay
          await delay(DELAY_BETWEEN_BATCHES);

          //* Reset batch
          batch = writeBatch(db);
          operationsInBatch = 0;
        }
      } catch (error) {
        console.error(`Error processing row ${i + 1}:`, error);
        localStorage.setItem(`lastProcessed${dataKey}`, row.Guid);
        stats.errors++;
        await delay(DELAY_BETWEEN_BATCHES * 2);
      }
    }

    //* Commit final batch
    if (stats.processed > 0) {
      console.log(`Committing final batch with No of operation: ${operationsInBatch}`);
      await batch.commit();
    }

    localStorage.removeItem(`lastProcessed${dataKey}`);
    stats.status = 'completed';
    onStats(stats);
    return stats;
  } catch (error) {
    console.error('FATAL ERROR  IN PROCESS_EXCEL_UPLOADER_CALIBRATION_RSCMC:', error);
    throw error;
  }
};

export const processExcelUploadCalibrationEnvironmental = async ({
  prefix,
  dataKey,
  data,
  onProgress,
  onStats,
  lastDataId,
}) => {
  const auth = getAuth();
  const currentUser = auth.currentUser;

  let stats = {
    total: data.length,
    [`${dataKey}Success`]: 0,
    processed: 0,
    errors: 0,
    currentItem: '',
    status: 'processing',
  };

  // if (!currentUser) return;

  try {
    onStats(stats);

    const BATCH_SIZE = 20; //* Reduced batch size
    const DELAY_BETWEEN_BATCHES = 3000; //* 3 seconds delay

    let batch = writeBatch(db);
    let operationsInBatch = 0; //* Tracks number of operations in batch

    //* Find starting index
    let startIndex = 0;
    if (lastDataId) {
      startIndex = data.findIndex((row) => row.Guid === lastDataId);
      if (startIndex === -1) startIndex = 0;
    }

    const [dataKeyA, dataKeyB, dataKeyC] = dataKey.split('_');

    if ((!dataKeyA || !dataKeyB, !dataKeyC)) return;

    const existingEnvironmental = new Map();

    //* Get existing records
    const calibrationEnvironmentalSnapshot = await getDocs(
      collection(db, dataKeyA, dataKeyB, dataKeyC)
    );

    if (!calibrationEnvironmentalSnapshot.empty) {
      calibrationEnvironmentalSnapshot.forEach((doc) => {
        const data = doc.data();
        existingEnvironmental.set(data.refId, data);
      });
    }

    for (let i = startIndex; i < data.length; i++) {
      const row = data[i];

      try {
        //* check if row has the required fields or not, if not skip
        if (!row.Code || !row.U) {
          console.log('Skipping row due to missing required data:', row);
          stats.errors++;
          continue;
        }

        let refId = existingEnvironmental.get(row.Guid);
        if (!refId) {
          refId = `${prefix}${String(existingEnvironmental.size + 1).padStart(6, '0')}`;

          const environmentalData = {
            refId,
            code: row?.Code || '',
            description: row?.Description || '',
            u: row?.U || '',
            unit: row?.Unit || '',
            dueDate: row?.Due_Date || '',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };

          batch.set(doc(db, dataKeyA, dataKeyB, dataKeyC, refId), environmentalData);
          existingEnvironmental.set(row?.Guid, refId);
          stats[`${dataKey}Success`]++;
          operationsInBatch++;
        }

        stats.processed++;

        //* Update progress
        onProgress(Math.round(((i + 1 - startIndex) / (data.length - startIndex)) * 100));
        onStats({
          ...stats,
          currentItem: `Processing ${row.Guid}`,
        });

        //* Commit batch when limit reached
        if (operationsInBatch === BATCH_SIZE) {
          await batch.commit();

          //* log
          console.log(`Batch committed at row ${i + 1}. Waiting...`);

          //* Delay
          await delay(DELAY_BETWEEN_BATCHES);

          //* Reset batch
          batch = writeBatch(db);
          operationsInBatch = 0;
        }
      } catch (error) {
        console.error(`Error processing row ${i + 1}:`, error);
        localStorage.setItem(`lastProcessed${dataKey}`, row.Guid);
        stats.errors++;
        await delay(DELAY_BETWEEN_BATCHES * 2);
      }
    }

    //* Commit final batch
    if (stats.processed > 0) {
      console.log(`Committing final batch with No of operation: ${operationsInBatch}`);
      await batch.commit();
    }

    localStorage.removeItem(`lastProcessed${dataKey}`);
    stats.status = 'completed';
    onStats(stats);
    return stats;
  } catch (error) {
    console.error('FATAL ERROR  IN PROCESS_EXCEL_UPLOADER_CALIBRATION_ENVIRONMENTAL:', error);
    throw error;
  }
};

export const processExcelUploadCalibrationTher = async ({
  prefix,
  dataKey,
  data,
  onProgress,
  onStats,
  lastDataId,
}) => {
  const auth = getAuth();
  const currentUser = auth.currentUser;

  let stats = {
    total: data.length,
    [`${dataKey}Success`]: 0,
    processed: 0,
    errors: 0,
    currentItem: '',
    status: 'processing',
  };

  // if (!currentUser) return;

  try {
    onStats(stats);

    const BATCH_SIZE = 20; //* Reduced batch size
    const DELAY_BETWEEN_BATCHES = 3000; //* 3 seconds delay

    let batch = writeBatch(db);
    let operationsInBatch = 0; //* Tracks number of operations in batch

    //* Find starting index
    let startIndex = 0;
    if (lastDataId) {
      startIndex = data.findIndex((row) => row.Guid === lastDataId);
      if (startIndex === -1) startIndex = 0;
    }

    const [dataKeyA, dataKeyB, dataKeyC] = dataKey.split('_');

    if ((!dataKeyA || !dataKeyB, !dataKeyC)) return;

    const existingTher = new Map();

    //* Get existing records
    const calibrationTherSnapshot = await getDocs(collection(db, dataKeyA, dataKeyB, dataKeyC));

    if (!calibrationTherSnapshot.empty) {
      calibrationTherSnapshot.forEach((doc) => {
        const data = doc.data();
        existingTher.set(data.refId, data);
      });
    }

    for (let i = startIndex; i < data.length; i++) {
      const row = data[i];

      try {
        //* check if row has the required fields or not, if not skip
        if (!row?.ID_Code || !row?.Type || !row?.Traceable) {
          console.log('Skipping row due to missing required data:', row);
          stats.errors++;
          continue;
        }

        let refId = existingTher.get(row.Guid);
        if (!refId) {
          refId = `${prefix}${String(existingTher.size + 1).padStart(6, '0')}`;

          const therData = {
            refId,
            idCode: row?.ID_Code || '',
            type: row?.Type || '',
            serialNumber: row?.Serial_No || '',
            traceable: row?.Traceable || '',
            cocNo: row?.COC_No || '',
            kFactor: row?.K_Factor || '',
            dueDate: (row?.Due_Date !== 'Q' && row?.Due_Date) || '',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };

          batch.set(doc(db, dataKeyA, dataKeyB, dataKeyC, refId), therData);
          existingTher.set(row?.Guid, refId);
          stats[`${dataKey}Success`]++;
          operationsInBatch++;
        }

        stats.processed++;

        //* Update progress
        onProgress(Math.round(((i + 1 - startIndex) / (data.length - startIndex)) * 100));
        onStats({
          ...stats,
          currentItem: `Processing ${row.Guid}`,
        });

        //* Commit batch when limit reached
        if (operationsInBatch === BATCH_SIZE) {
          await batch.commit();

          //* log
          console.log(`Batch committed at row ${i + 1}. Waiting...`);

          //* Delay
          await delay(DELAY_BETWEEN_BATCHES);

          //* Reset batch
          batch = writeBatch(db);
          operationsInBatch = 0;
        }
      } catch (error) {
        console.error(`Error processing row ${i + 1}:`, error);
        localStorage.setItem(`lastProcessed${dataKey}`, row.Guid);
        stats.errors++;
        await delay(DELAY_BETWEEN_BATCHES * 2);
      }
    }

    //* Commit final batch
    if (stats.processed > 0) {
      console.log(`Committing final batch with No of operation: ${operationsInBatch}`);
      await batch.commit();
    }

    localStorage.removeItem(`lastProcessed${dataKey}`);
    stats.status = 'completed';
    onStats(stats);
    return stats;
  } catch (error) {
    console.error('FATAL ERROR  IN PROCESS_EXCEL_UPLOADER_CALIBRATION_THER:', error);
    throw error;
  }
};

export const processExcelUploadCalibrationWires = async ({
  prefix,
  dataKey,
  data,
  onProgress,
  onStats,
  lastDataId,
}) => {
  const auth = getAuth();
  const currentUser = auth.currentUser;

  let stats = {
    total: data.length,
    [`${dataKey}Success`]: 0,
    processed: 0,
    errors: 0,
    currentItem: '',
    status: 'processing',
  };

  // if (!currentUser) return;

  try {
    onStats(stats);

    const BATCH_SIZE = 20; //* Reduced batch size
    const DELAY_BETWEEN_BATCHES = 3000; //* 3 seconds delay

    let batch = writeBatch(db);
    let operationsInBatch = 0; //* Tracks number of operations in batch

    //* Find starting index
    let startIndex = 0;
    if (lastDataId) {
      startIndex = data.findIndex((row) => row.Guid === lastDataId);
      if (startIndex === -1) startIndex = 0;
    }

    const [dataKeyA, dataKeyB, dataKeyC] = dataKey.split('_');

    if ((!dataKeyA || !dataKeyB, !dataKeyC)) return;

    const existingWires = new Map();

    //* Get existing records
    const calibrationWiresSnapshot = await getDocs(collection(db, dataKeyA, dataKeyB, dataKeyC));

    if (!calibrationWiresSnapshot.empty) {
      calibrationWiresSnapshot.forEach((doc) => {
        const data = doc.data();
        existingWires.set(data.refId, data);
      });
    }

    for (let i = startIndex; i < data.length; i++) {
      const row = data[i];

      try {
        //* check if row has the required fields or not, if not skip
        if (!row?.ID_Code || !row?.Code) {
          console.log('Skipping row due to missing required data:', row);
          stats.errors++;
          continue;
        }

        let refId = existingWires.get(row.Guid);
        if (!refId) {
          refId = `${prefix}${String(existingWires.size + 1).padStart(6, '0')}`;

          const wiresData = {
            refId,
            idCode: row?.ID_Code || '',
            code: row?.Code || '',
            type: row?.Type || '',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };

          batch.set(doc(db, dataKeyA, dataKeyB, dataKeyC, refId), wiresData);
          existingWires.set(row?.Guid, refId);
          stats[`${dataKey}Success`]++;
          operationsInBatch++;
        }

        stats.processed++;

        //* Update progress
        onProgress(Math.round(((i + 1 - startIndex) / (data.length - startIndex)) * 100));
        onStats({
          ...stats,
          currentItem: `Processing ${row.Guid}`,
        });

        //* Commit batch when limit reached
        if (operationsInBatch === BATCH_SIZE) {
          await batch.commit();

          //* log
          console.log(`Batch committed at row ${i + 1}. Waiting...`);

          //* Delay
          await delay(DELAY_BETWEEN_BATCHES);

          //* Reset batch
          batch = writeBatch(db);
          operationsInBatch = 0;
        }
      } catch (error) {
        console.error(`Error processing row ${i + 1}:`, error);
        localStorage.setItem(`lastProcessed${dataKey}`, row.Guid);
        stats.errors++;
        await delay(DELAY_BETWEEN_BATCHES * 2);
      }
    }

    //* Commit final batch
    if (stats.processed > 0) {
      console.log(`Committing final batch with No of operation: ${operationsInBatch}`);
      await batch.commit();
    }

    localStorage.removeItem(`lastProcessed${dataKey}`);
    stats.status = 'completed';
    onStats(stats);
    return stats;
  } catch (error) {
    console.error('FATAL ERROR  IN PROCESS_EXCEL_UPLOADER_CALIBRATION_WIRES:', error);
    throw error;
  }
};

export const processExcelUploadCalibrationAux = async ({
  prefix,
  dataKey,
  data,
  onProgress,
  onStats,
  lastDataId,
}) => {
  const auth = getAuth();
  const currentUser = auth.currentUser;

  let stats = {
    total: data.length,
    [`${dataKey}Success`]: 0,
    processed: 0,
    errors: 0,
    currentItem: '',
    status: 'processing',
  };

  // if (!currentUser) return;

  try {
    onStats(stats);

    const BATCH_SIZE = 20; //* Reduced batch size
    const DELAY_BETWEEN_BATCHES = 3000; //* 3 seconds delay

    let batch = writeBatch(db);
    let operationsInBatch = 0; //* Tracks number of operations in batch

    //* Find starting index
    let startIndex = 0;
    if (lastDataId) {
      startIndex = data.findIndex((row) => row.Guid === lastDataId);
      if (startIndex === -1) startIndex = 0;
    }

    const [dataKeyA, dataKeyB, dataKeyC] = dataKey.split('_');

    if ((!dataKeyA || !dataKeyB, !dataKeyC)) return;

    const existingAux = new Map();

    //* Get existing records
    const calibrationAuxSnapshot = await getDocs(collection(db, dataKeyA, dataKeyB, dataKeyC));

    if (!calibrationAuxSnapshot.empty) {
      calibrationAuxSnapshot.forEach((doc) => {
        const data = doc.data();
        existingAux.set(data.refId, data);
      });
    }

    for (let i = startIndex; i < data.length; i++) {
      const row = data[i];

      try {
        //* check if row has the required fields or not, if not skip
        if (
          !row?.ID_Code ||
          !row?.Type ||
          !row?.Traceable ||
          !row?.COC_No ||
          !row?.K_Factor ||
          !row?.Due_Date
        ) {
          console.log('Skipping row due to missing required data:', row);
          stats.errors++;
          continue;
        }

        let refId = existingAux.get(row.Guid);
        if (!refId) {
          refId = `${prefix}${String(existingAux.size + 1).padStart(6, '0')}`;

          const auxData = {
            refId,
            idCode: row?.ID_Code || '',
            type: row?.Type || '',
            serialNumber: row?.Serial_No || '',
            traceable: row?.Traceable || '',
            cocNo: row?.COC_No || '',
            kFactor: row?.K_Factor || '',
            dueDate: (row?.Due_Date !== 'Q' && row?.Due_Date) || '',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };

          batch.set(doc(db, dataKeyA, dataKeyB, dataKeyC, refId), auxData);
          existingAux.set(row?.Guid, refId);
          stats[`${dataKey}Success`]++;
          operationsInBatch++;
        }

        stats.processed++;

        //* Update progress
        onProgress(Math.round(((i + 1 - startIndex) / (data.length - startIndex)) * 100));
        onStats({
          ...stats,
          currentItem: `Processing ${row.Guid}`,
        });

        //* Commit batch when limit reached
        if (operationsInBatch === BATCH_SIZE) {
          await batch.commit();

          //* log
          console.log(`Batch committed at row ${i + 1}. Waiting...`);

          //* Delay
          await delay(DELAY_BETWEEN_BATCHES);

          //* Reset batch
          batch = writeBatch(db);
          operationsInBatch = 0;
        }
      } catch (error) {
        console.error(`Error processing row ${i + 1}:`, error);
        localStorage.setItem(`lastProcessed${dataKey}`, row.Guid);
        stats.errors++;
        await delay(DELAY_BETWEEN_BATCHES * 2);
      }
    }

    //* Commit final batch
    if (stats.processed > 0) {
      console.log(`Committing final batch with No of operation: ${operationsInBatch}`);
      await batch.commit();
    }

    localStorage.removeItem(`lastProcessed${dataKey}`);
    stats.status = 'completed';
    onStats(stats);
    return stats;
  } catch (error) {
    console.error('FATAL ERROR  IN PROCESS_EXCEL_UPLOADER_CALIBRATION_AUX:', error);
    throw error;
  }
};

export const processExcelUploadCalibrationExtensions = async ({
  prefix,
  dataKey,
  data,
  onProgress,
  onStats,
  lastDataId,
}) => {
  const auth = getAuth();
  const currentUser = auth.currentUser;

  let stats = {
    total: data.length,
    [`${dataKey}Success`]: 0,
    processed: 0,
    errors: 0,
    currentItem: '',
    status: 'processing',
  };

  // if (!currentUser) return;

  try {
    onStats(stats);

    const BATCH_SIZE = 20; //* Reduced batch size
    const DELAY_BETWEEN_BATCHES = 3000; //* 3 seconds delay

    let batch = writeBatch(db);
    let operationsInBatch = 0; //* Tracks number of operations in batch

    //* Find starting index
    let startIndex = 0;
    if (lastDataId) {
      startIndex = data.findIndex((row) => row.Guid === lastDataId);
      if (startIndex === -1) startIndex = 0;
    }

    const [dataKeyA, dataKeyB, dataKeyC] = dataKey.split('_');

    if ((!dataKeyA || !dataKeyB, !dataKeyC)) return;

    const existingExtensions = new Map();

    //* Get existing records
    const calibrationExtensionsSnapshot = await getDocs(
      collection(db, dataKeyA, dataKeyB, dataKeyC)
    );

    if (!calibrationExtensionsSnapshot.empty) {
      calibrationExtensionsSnapshot.forEach((doc) => {
        const data = doc.data();
        existingExtensions.set(data.refId, data);
      });
    }

    for (let i = startIndex; i < data.length; i++) {
      const row = data[i];

      try {
        //* check if row has the required fields or not, if not skip
        if (!row?.ID_Code || row?.uncerDCelsius) {
          console.log('Skipping row due to missing required data:', row);
          stats.errors++;
          continue;
        }

        let refId = existingExtensions.get(row.Guid);
        if (!refId) {
          refId = `${prefix}${String(existingExtensions.size + 1).padStart(6, '0')}`;

          const extensionsData = {
            refId,
            idCode: row?.ID_Code || '',
            uncerDCelsius: row?.Uncer_Degree_Celsius || '',
            uncerPercentRHumidity: row?.Uncer_Percent_R_Humidity || '',
            kFactor: row?.K_Factor || '',
            dueDate: (row?.Due_Date !== 'Q' && row?.Due_Date) || '',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };

          batch.set(doc(db, dataKeyA, dataKeyB, dataKeyC, refId), extensionsData);
          existingExtensions.set(row?.Guid, refId);
          stats[`${dataKey}Success`]++;
          operationsInBatch++;
        }

        stats.processed++;

        //* Update progress
        onProgress(Math.round(((i + 1 - startIndex) / (data.length - startIndex)) * 100));
        onStats({
          ...stats,
          currentItem: `Processing ${row.Guid}`,
        });

        //* Commit batch when limit reached
        if (operationsInBatch === BATCH_SIZE) {
          await batch.commit();

          //* log
          console.log(`Batch committed at row ${i + 1}. Waiting...`);

          //* Delay
          await delay(DELAY_BETWEEN_BATCHES);

          //* Reset batch
          batch = writeBatch(db);
          operationsInBatch = 0;
        }
      } catch (error) {
        console.error(`Error processing row ${i + 1}:`, error);
        localStorage.setItem(`lastProcessed${dataKey}`, row.Guid);
        stats.errors++;
        await delay(DELAY_BETWEEN_BATCHES * 2);
      }
    }

    //* Commit final batch
    if (stats.processed > 0) {
      console.log(`Committing final batch with No of operation: ${operationsInBatch}`);
      await batch.commit();
    }

    localStorage.removeItem(`lastProcessed${dataKey}`);
    stats.status = 'completed';
    onStats(stats);
    return stats;
  } catch (error) {
    console.error('FATAL ERROR  IN PROCESS_EXCEL_UPLOADER_CALIBRATION_EXTENSIONS:', error);
    throw error;
  }
};

export const processExcelUploadCalibrationBath = async ({
  prefix,
  dataKey,
  data,
  onProgress,
  onStats,
  lastDataId,
}) => {
  const auth = getAuth();
  const currentUser = auth.currentUser;

  let stats = {
    total: data.length,
    [`${dataKey}Success`]: 0,
    processed: 0,
    errors: 0,
    currentItem: '',
    status: 'processing',
  };

  // if (!currentUser) return;

  try {
    onStats(stats);

    const BATCH_SIZE = 20; //* Reduced batch size
    const DELAY_BETWEEN_BATCHES = 3000; //* 3 seconds delay

    let batch = writeBatch(db);
    let operationsInBatch = 0; //* Tracks number of operations in batch

    //* Find starting index
    let startIndex = 0;
    if (lastDataId) {
      startIndex = data.findIndex((row) => row.Guid === lastDataId);
      if (startIndex === -1) startIndex = 0;
    }

    const [dataKeyA, dataKeyB, dataKeyC] = dataKey.split('_');

    if ((!dataKeyA || !dataKeyB, !dataKeyC)) return;

    const existingBath = new Map();

    //* Get existing records
    const calibrationExtensionsSnapshot = await getDocs(
      collection(db, dataKeyA, dataKeyB, dataKeyC)
    );

    if (!calibrationExtensionsSnapshot.empty) {
      calibrationExtensionsSnapshot.forEach((doc) => {
        const data = doc.data();
        existingBath.set(data.refId, data);
      });
    }

    for (let i = startIndex; i < data.length; i++) {
      const row = data[i];

      try {
        //* check if row has the required fields or not, if not skip
        if (!row?.ID_Code) {
          console.log('Skipping row due to missing required data:', row);
          stats.errors++;
          continue;
        }

        let refId = existingBath.get(row.Guid);
        if (!refId) {
          refId = `${prefix}${String(existingBath.size + 1).padStart(6, '0')}`;

          const extensionsData = {
            refId,
            idCode: row?.ID_Code || '',
            no: row?.No || '',
            minDCelsius: row?.Min_D_Celsius || '',
            maxDCelsius: row?.Max_D_Celsius || '',
            minPercentRHumidity: row?.Min_Percent_R_Humidity || '',
            maxPercentRHumidity: row?.Max_Percent_R_Humidity || '',
            stabilityDCelsius: row?.Stability_D_Celsius || '',
            stabilityPercentRHumidity: row?.Stability_Percent_R_Humidity || '',
            uniformityDCelsius: row?.Uniformity_D_Celsius || '',
            uniformityPercentRHumidity: row?.Uniformity_Percent_R_Humidity || '',
            radialDCelsius: row?.Radial_D_Celsius || '',
            axialDCelsius: row?.Axial_D_Celsius || '',
            dueDate: (row?.Due_Date !== 'Q' && row?.Due_Date) || '',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };

          batch.set(doc(db, dataKeyA, dataKeyB, dataKeyC, refId), extensionsData);
          existingBath.set(row?.Guid, refId);
          stats[`${dataKey}Success`]++;
          operationsInBatch++;
        }

        stats.processed++;

        //* Update progress
        onProgress(Math.round(((i + 1 - startIndex) / (data.length - startIndex)) * 100));
        onStats({
          ...stats,
          currentItem: `Processing ${row.Guid}`,
        });

        //* Commit batch when limit reached
        if (operationsInBatch === BATCH_SIZE) {
          await batch.commit();

          //* log
          console.log(`Batch committed at row ${i + 1}. Waiting...`);

          //* Delay
          await delay(DELAY_BETWEEN_BATCHES);

          //* Reset batch
          batch = writeBatch(db);
          operationsInBatch = 0;
        }
      } catch (error) {
        console.error(`Error processing row ${i + 1}:`, error);
        localStorage.setItem(`lastProcessed${dataKey}`, row.Guid);
        stats.errors++;
        await delay(DELAY_BETWEEN_BATCHES * 2);
      }
    }

    //* Commit final batch
    if (stats.processed > 0) {
      console.log(`Committing final batch with No of operation: ${operationsInBatch}`);
      await batch.commit();
    }

    localStorage.removeItem(`lastProcessed${dataKey}`);
    stats.status = 'completed';
    onStats(stats);
    return stats;
  } catch (error) {
    console.error('FATAL ERROR  IN PROCESS_EXCEL_UPLOADER_CALIBRATION_BATH:', error);
    throw error;
  }
};

export const processExcelUploadCalibrationBathStabilityUniformity = async ({
  prefix,
  dataKey,
  data,
  onProgress,
  onStats,
  lastDataId,
}) => {
  const auth = getAuth();
  const currentUser = auth.currentUser;

  let stats = {
    total: data.length,
    [`${dataKey}Success`]: 0,
    processed: 0,
    errors: 0,
    currentItem: '',
    status: 'processing',
  };

  // if (!currentUser) return;

  try {
    onStats(stats);

    const BATCH_SIZE = 20; //* Reduced batch size
    const DELAY_BETWEEN_BATCHES = 3000; //* 3 seconds delay

    let batch = writeBatch(db);
    let operationsInBatch = 0; //* Tracks number of operations in batch

    //* Find starting index
    let startIndex = 0;
    if (lastDataId) {
      startIndex = data.findIndex((row) => row.Guid === lastDataId);
      if (startIndex === -1) startIndex = 0;
    }

    const [dataKeyA, dataKeyB, dataKeyC] = dataKey.split('_');

    if ((!dataKeyA || !dataKeyB, !dataKeyC)) return;

    const existingBathSetting = new Map();

    //* Get existing records
    const calibrationExtensionsSnapshot = await getDocs(
      collection(db, dataKeyA, dataKeyB, dataKeyC)
    );

    if (!calibrationExtensionsSnapshot.empty) {
      calibrationExtensionsSnapshot.forEach((doc) => {
        const data = doc.data();
        existingBathSetting.set(data.refId, data);
      });
    }

    for (let i = startIndex; i < data.length; i++) {
      const row = data[i];

      try {
        //* check if row has the required fields or not, if not skip
        if (!row?.Code) {
          console.log('Skipping row due to missing required data:', row);
          stats.errors++;
          continue;
        }

        let refId = existingBathSetting.get(row.Guid);
        if (!refId) {
          refId = `${prefix}${String(existingBathSetting.size + 1).padStart(6, '0')}`;

          const extensionsData = {
            refId,
            code: row?.Code || '',
            stabilityDCelsius: row?.Stability_D_Celsius || '',
            stabilityPercentRHumidity: row?.Stability_Percent_R_Humidity || '',
            uniformityDCelsius: row?.Uniformity_D_Celsius || '',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };

          batch.set(doc(db, dataKeyA, dataKeyB, dataKeyC, refId), extensionsData);
          existingBathSetting.set(row?.Guid, refId);
          stats[`${dataKey}Success`]++;
          operationsInBatch++;
        }

        stats.processed++;

        //* Update progress
        onProgress(Math.round(((i + 1 - startIndex) / (data.length - startIndex)) * 100));
        onStats({
          ...stats,
          currentItem: `Processing ${row.Guid}`,
        });

        //* Commit batch when limit reached
        if (operationsInBatch === BATCH_SIZE) {
          await batch.commit();

          //* log
          console.log(`Batch committed at row ${i + 1}. Waiting...`);

          //* Delay
          await delay(DELAY_BETWEEN_BATCHES);

          //* Reset batch
          batch = writeBatch(db);
          operationsInBatch = 0;
        }
      } catch (error) {
        console.error(`Error processing row ${i + 1}:`, error);
        localStorage.setItem(`lastProcessed${dataKey}`, row.Guid);
        stats.errors++;
        await delay(DELAY_BETWEEN_BATCHES * 2);
      }
    }

    //* Commit final batch
    if (stats.processed > 0) {
      console.log(`Committing final batch with No of operation: ${operationsInBatch}`);
      await batch.commit();
    }

    localStorage.removeItem(`lastProcessed${dataKey}`);
    stats.status = 'completed';
    onStats(stats);
    return stats;
  } catch (error) {
    console.error('FATAL ERROR  IN PROCESS_EXCEL_UPLOADER_CALIBRATION_BATH_SETTING:', error);
    throw error;
  }
};

export const processExcelUploadCalibrationBathStability = async ({
  prefix,
  dataKey,
  data,
  onProgress,
  onStats,
  lastDataId,
}) => {
  const auth = getAuth();
  const currentUser = auth.currentUser;

  let stats = {
    total: data.length,
    [`${dataKey}Success`]: 0,
    processed: 0,
    errors: 0,
    currentItem: '',
    status: 'processing',
  };

  // if (!currentUser) return;

  try {
    onStats(stats);

    const BATCH_SIZE = 20; //* Reduced batch size
    const DELAY_BETWEEN_BATCHES = 3000; //* 3 seconds delay

    let batch = writeBatch(db);
    let operationsInBatch = 0; //* Tracks number of operations in batch

    //* Find starting index
    let startIndex = 0;
    if (lastDataId) {
      startIndex = data.findIndex((row) => row.Guid === lastDataId);
      if (startIndex === -1) startIndex = 0;
    }

    const [dataKeyA, dataKeyB, dataKeyC] = dataKey.split('_');

    if ((!dataKeyA || !dataKeyB, !dataKeyC)) return;

    const existingBathStability = new Map();

    //* Get existing records
    const calibrationExtensionsSnapshot = await getDocs(
      collection(db, dataKeyA, dataKeyB, dataKeyC)
    );

    if (!calibrationExtensionsSnapshot.empty) {
      calibrationExtensionsSnapshot.forEach((doc) => {
        const data = doc.data();
        existingBathStability.set(data.refId, data);
      });
    }

    for (let i = startIndex; i < data.length; i++) {
      const row = data[i];

      try {
        //* check if row has the required fields or not, if not skip
        if (!row?.Loc) {
          console.log('Skipping row due to missing required data:', row);
          stats.errors++;
          continue;
        }

        let refId = existingBathStability.get(row.Guid);
        if (!refId) {
          refId = `${prefix}${String(existingBathStability.size + 1).padStart(6, '0')}`;

          const bathStabilityData = {
            refId,
            loc: row?.Loc || '',
            value1: row?.Value1 || '',
            value2: row?.Value2 || '',
            value3: row?.Value3 || '',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };

          batch.set(doc(db, dataKeyA, dataKeyB, dataKeyC, refId), bathStabilityData);
          existingBathStability.set(row?.Guid, refId);
          stats[`${dataKey}Success`]++;
          operationsInBatch++;
        }

        stats.processed++;

        //* Update progress
        onProgress(Math.round(((i + 1 - startIndex) / (data.length - startIndex)) * 100));
        onStats({
          ...stats,
          currentItem: `Processing ${row.Guid}`,
        });

        //* Commit batch when limit reached
        if (operationsInBatch === BATCH_SIZE) {
          await batch.commit();

          //* log
          console.log(`Batch committed at row ${i + 1}. Waiting...`);

          //* Delay
          await delay(DELAY_BETWEEN_BATCHES);

          //* Reset batch
          batch = writeBatch(db);
          operationsInBatch = 0;
        }
      } catch (error) {
        console.error(`Error processing row ${i + 1}:`, error);
        localStorage.setItem(`lastProcessed${dataKey}`, row.Guid);
        stats.errors++;
        await delay(DELAY_BETWEEN_BATCHES * 2);
      }
    }

    //* Commit final batch
    if (stats.processed > 0) {
      console.log(`Committing final batch with No of operation: ${operationsInBatch}`);
      await batch.commit();
    }

    localStorage.removeItem(`lastProcessed${dataKey}`);
    stats.status = 'completed';
    onStats(stats);
    return stats;
  } catch (error) {
    console.error('FATAL ERROR  IN PROCESS_EXCEL_UPLOADER_CALIBRATION_BATH_STABILITY:', error);
    throw error;
  }
};

export const processExcelUploadCalibrationBathUniformity = async ({
  prefix,
  dataKey,
  data,
  onProgress,
  onStats,
  lastDataId,
}) => {
  const auth = getAuth();
  const currentUser = auth.currentUser;

  let stats = {
    total: data.length,
    [`${dataKey}Success`]: 0,
    processed: 0,
    errors: 0,
    currentItem: '',
    status: 'processing',
  };

  // if (!currentUser) return;

  try {
    onStats(stats);

    const BATCH_SIZE = 20; //* Reduced batch size
    const DELAY_BETWEEN_BATCHES = 3000; //* 3 seconds delay

    let batch = writeBatch(db);
    let operationsInBatch = 0; //* Tracks number of operations in batch

    //* Find starting index
    let startIndex = 0;
    if (lastDataId) {
      startIndex = data.findIndex((row) => row.Guid === lastDataId);
      if (startIndex === -1) startIndex = 0;
    }

    const [dataKeyA, dataKeyB, dataKeyC] = dataKey.split('_');

    if ((!dataKeyA || !dataKeyB, !dataKeyC)) return;

    const existingBathUniformity = new Map();

    //* Get existing records
    const calibrationExtensionsSnapshot = await getDocs(
      collection(db, dataKeyA, dataKeyB, dataKeyC)
    );

    if (!calibrationExtensionsSnapshot.empty) {
      calibrationExtensionsSnapshot.forEach((doc) => {
        const data = doc.data();
        existingBathUniformity.set(data.refId, data);
      });
    }

    for (let i = startIndex; i < data.length; i++) {
      const row = data[i];

      try {
        //* check if row has the required fields or not, if not skip
        if (!row?.Loc) {
          console.log('Skipping row due to missing required data:', row);
          stats.errors++;
          continue;
        }

        let refId = existingBathUniformity.get(row.Guid);
        if (!refId) {
          refId = `${prefix}${String(existingBathUniformity.size + 1).padStart(6, '0')}`;

          const extensionsData = {
            refId,
            loc: row?.Loc || '',
            value1: row?.Value1 || '',
            value2: row?.Value2 || '',
            value3: row?.Value3 || '',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };

          batch.set(doc(db, dataKeyA, dataKeyB, dataKeyC, refId), extensionsData);
          existingBathUniformity.set(row?.Guid, refId);
          stats[`${dataKey}Success`]++;
          operationsInBatch++;
        }

        stats.processed++;

        //* Update progress
        onProgress(Math.round(((i + 1 - startIndex) / (data.length - startIndex)) * 100));
        onStats({
          ...stats,
          currentItem: `Processing ${row.Guid}`,
        });

        //* Commit batch when limit reached
        if (operationsInBatch === BATCH_SIZE) {
          await batch.commit();

          //* log
          console.log(`Batch committed at row ${i + 1}. Waiting...`);

          //* Delay
          await delay(DELAY_BETWEEN_BATCHES);

          //* Reset batch
          batch = writeBatch(db);
          operationsInBatch = 0;
        }
      } catch (error) {
        console.error(`Error processing row ${i + 1}:`, error);
        localStorage.setItem(`lastProcessed${dataKey}`, row.Guid);
        stats.errors++;
        await delay(DELAY_BETWEEN_BATCHES * 2);
      }
    }

    //* Commit final batch
    if (stats.processed > 0) {
      console.log(`Committing final batch with No of operation: ${operationsInBatch}`);
      await batch.commit();
    }

    localStorage.removeItem(`lastProcessed${dataKey}`);
    stats.status = 'completed';
    onStats(stats);
    return stats;
  } catch (error) {
    console.error('FATAL ERROR  IN PROCESS_EXCEL_UPLOADER_CALIBRATION_BATH_UNIFORMITY:', error);
    throw error;
  }
};

export const processExcelUploadCalibrationMeter = async ({
  prefix,
  dataKey,
  data,
  onProgress,
  onStats,
  lastDataId,
}) => {
  const auth = getAuth();
  const currentUser = auth.currentUser;

  let stats = {
    total: data.length,
    [`${dataKey}Success`]: 0,
    processed: 0,
    errors: 0,
    currentItem: '',
    status: 'processing',
  };

  // if (!currentUser) return;

  try {
    onStats(stats);

    const BATCH_SIZE = 20; //* Reduced batch size
    const DELAY_BETWEEN_BATCHES = 3000; //* 3 seconds delay

    let batch = writeBatch(db);
    let operationsInBatch = 0; //* Tracks number of operations in batch

    //* Find starting index
    let startIndex = 0;
    if (lastDataId) {
      startIndex = data.findIndex((row) => row.Guid === lastDataId);
      if (startIndex === -1) startIndex = 0;
    }

    const [dataKeyA, dataKeyB, dataKeyC] = dataKey.split('_');

    if ((!dataKeyA || !dataKeyB, !dataKeyC)) return;

    const existingMeter = new Map();
    const existingMeterCode = new Map();

    //* Get existing records
    const calibrationMetersSnapshot = await getDocs(collection(db, dataKeyA, dataKeyB, dataKeyC));

    if (!calibrationMetersSnapshot.empty) {
      calibrationMetersSnapshot.forEach((doc) => {
        const data = doc.data();
        existingMeter.set(data.refId, data?.refId);
        existingMeterCode.set(data.code, data?.code);
      });
    }

    for (let i = startIndex; i < data.length; i++) {
      const row = data[i];

      try {
        //* check if row has the required fields or not, if not skip
        if (!row?.Code) {
          console.log('Skipping row due to missing required data:', row);
          stats.errors++;
          continue;
        }

        let refId = existingMeter.get(row.Guid);
        const isCodeExist = existingMeterCode.get(row?.Code);

        if (!isCodeExist) {
          refId = `${prefix}${String(existingMeter.size + 1).padStart(6, '0')}`;

          const meterData = {
            refId,
            idCode: row?.ID_Code || '',
            code: row?.Code || '',
            type: row?.Type || '',
            kFactor: row?.K_Factor || '',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };

          batch.set(doc(db, dataKeyA, dataKeyB, dataKeyC, refId), meterData);
          existingMeter.set(row?.Guid, refId);
          existingMeterCode.set(row?.Code, row?.Code);
          stats[`${dataKey}Success`]++;
          operationsInBatch++;
        } else {
          console.log('Skipping row due to existing record:', row);
          stats.errors++;
          continue;
        }

        stats.processed++;

        //* Update progress
        onProgress(Math.round(((i + 1 - startIndex) / (data.length - startIndex)) * 100));
        onStats({
          ...stats,
          currentItem: `Processing ${row.Guid}`,
        });

        //* Commit batch when limit reached
        if (operationsInBatch === BATCH_SIZE) {
          await batch.commit();

          //* log
          console.log(`Batch committed at row ${i + 1}. Waiting...`);

          //* Delay
          await delay(DELAY_BETWEEN_BATCHES);

          //* Reset batch
          batch = writeBatch(db);
          operationsInBatch = 0;
        }
      } catch (error) {
        console.error(`Error processing row ${i + 1}:`, error);
        localStorage.setItem(`lastProcessed${dataKey}`, row.Guid);
        stats.errors++;
        await delay(DELAY_BETWEEN_BATCHES * 2);
      }
    }

    //* Commit final batch
    if (stats.processed > 0) {
      console.log(`Committing final batch with No of operation: ${operationsInBatch}`);
      await batch.commit();
    }

    localStorage.removeItem(`lastProcessed${dataKey}`);
    stats.status = 'completed';
    onStats(stats);
    return stats;
  } catch (error) {
    console.error('FATAL ERROR  IN PROCESS_EXCEL_UPLOADER_CALIBRATION_METER:', error);
    throw error;
  }
};

export const processExcelUploadCalibrationTempInstruments = async ({
  prefix,
  dataKey,
  data,
  onProgress,
  onStats,
  lastDataId,
}) => {
  const auth = getAuth();
  const currentUser = auth.currentUser;

  let stats = {
    total: data.length,
    [`${dataKey}Success`]: 0,
    processed: 0,
    errors: 0,
    currentItem: '',
    status: 'processing',
  };

  // if (!currentUser) return;

  try {
    onStats(stats);

    const BATCH_SIZE = 20; //* Reduced batch size
    const DELAY_BETWEEN_BATCHES = 3000; //* 3 seconds delay

    let batch = writeBatch(db);
    let operationsInBatch = 0; //* Tracks number of operations in batch

    //* Find starting index
    let startIndex = 0;
    if (lastDataId) {
      startIndex = data.findIndex((row) => row.Guid === lastDataId);
      if (startIndex === -1) startIndex = 0;
    }

    const [dataKeyA, dataKeyB, dataKeyC] = dataKey.split('_');

    if ((!dataKeyA || !dataKeyB, !dataKeyC)) return;

    const existingTempInstruments = new Map();

    //* Get existing records
    const calibrationExtensionsSnapshot = await getDocs(
      collection(db, dataKeyA, dataKeyB, dataKeyC)
    );

    if (!calibrationExtensionsSnapshot.empty) {
      calibrationExtensionsSnapshot.forEach((doc) => {
        const data = doc.data();
        existingTempInstruments.set(data.refId, data);
      });
    }

    for (let i = startIndex; i < data.length; i++) {
      const row = data[i];

      try {
        //* check if row has the required fields or not, if not skip
        if (!row?.Code) {
          console.log('Skipping row due to missing required data:', row);
          stats.errors++;
          continue;
        }

        let refId = existingTempInstruments.get(row.Guid);
        if (!refId) {
          refId = `${prefix}${String(existingTempInstruments.size + 1).padStart(6, '0')}`;

          const tempInstrumentData = {
            refId,
            code: row?.Code || '',
            description: row?.Description || '',
            range: row?.Range || '',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };

          batch.set(doc(db, dataKeyA, dataKeyB, dataKeyC, refId), tempInstrumentData);
          existingTempInstruments.set(row?.Guid, refId);
          stats[`${dataKey}Success`]++;
          operationsInBatch++;
        }

        stats.processed++;

        //* Update progress
        onProgress(Math.round(((i + 1 - startIndex) / (data.length - startIndex)) * 100));
        onStats({
          ...stats,
          currentItem: `Processing ${row.Guid}`,
        });

        //* Commit batch when limit reached
        if (operationsInBatch === BATCH_SIZE) {
          await batch.commit();

          //* log
          console.log(`Batch committed at row ${i + 1}. Waiting...`);

          //* Delay
          await delay(DELAY_BETWEEN_BATCHES);

          //* Reset batch
          batch = writeBatch(db);
          operationsInBatch = 0;
        }
      } catch (error) {
        console.error(`Error processing row ${i + 1}:`, error);
        localStorage.setItem(`lastProcessed${dataKey}`, row.Guid);
        stats.errors++;
        await delay(DELAY_BETWEEN_BATCHES * 2);
      }
    }

    //* Commit final batch
    if (stats.processed > 0) {
      console.log(`Committing final batch with No of operation: ${operationsInBatch}`);
      await batch.commit();
    }

    localStorage.removeItem(`lastProcessed${dataKey}`);
    stats.status = 'completed';
    onStats(stats);
    return stats;
  } catch (error) {
    console.error(
      'FATAL ERROR  IN PROCESS_EXCEL_UPLOADER_CALIBRATION_TEMPERATURE_INSTRUMENTS:',
      error
    );
    throw error;
  }
};

export const processExcelUploadCalibrationTempRefs = async ({
  prefix,
  dataKey,
  data,
  onProgress,
  onStats,
  lastDataId,
  searchParams,
}) => {
  const auth = getAuth();
  const currentUser = auth.currentUser;

  let stats = {
    total: data.length,
    [`${dataKey}Success`]: 0,
    processed: 0,
    errors: 0,
    currentItem: '',
    status: 'processing',
  };

  try {
    onStats(stats);

    const BATCH_SIZE = 20; //* Reduced batch size
    const DELAY_BETWEEN_BATCHES = 3000; //* 3 seconds delay

    let batch = writeBatch(db);
    let operationsInBatch = 0; //* Tracks number of operations in batch

    //* Find starting index
    let startIndex = 0;
    if (lastDataId) {
      startIndex = data.findIndex((row) => row.Guid === lastDataId);
      if (startIndex === -1) startIndex = 0;
    }

    const [dataKeyA, dataKeyB, dataKeyC, dataKeyD, dataKeyE, dataKeyF] = dataKey.split('_');

    const filterKey1 = dataKeyE ? dataKeyE.replace(/[<>]/g, '') : '';
    const filterValue1 = searchParams.get(filterKey1);

    const filterKey2 = dataKeyF ? dataKeyF.replace(/[<>]/g, '') : '';
    const filterValue2 = searchParams.get(filterKey2);

    if ((!dataKeyA || !dataKeyB, !dataKeyC, !dataKeyD || !dataKeyE || !filterKey1)) return;

    const existingTherTemperatureRefs = new Map();

    const whereConstraints = [where(filterKey1, '==', filterValue1)];

    //* filterKey2 and filterValues2 exist append to whereConstraints
    if (filterKey2 && filterValue2) whereConstraints.push(where(filterKey2, '==', filterValue2));

    let refData = null;

    //* get ref data by filterValue - e.g ID_Code
    const q = query(collection(db, dataKeyA, dataKeyB, dataKeyC), ...whereConstraints, limit(1));
    const refDataSnapshot = await getDocs(q);

    if (!refDataSnapshot.empty) refData = refDataSnapshot.docs.pop() || null;

    if (refData && refData.exists()) {
      const refDataData = refData.data();
      const refTemperatureRefsSnapshot = await getDocs(collection(db, dataKeyA, dataKeyB, dataKeyC, refDataData.refId, dataKeyD)); // prettier-ignore

      if (!refTemperatureRefsSnapshot.empty) {
        refTemperatureRefsSnapshot.forEach((doc) => {
          const data = doc.data();
          existingTherTemperatureRefs.set(data.tempRefId, data);
        });
      }
    } else {
      throw new Error('Reference data not found!');
    }

    for (let i = startIndex; i < data.length; i++) {
      const row = data[i];
      const refDataData = refData.data();
      const refId = refDataData.refId;

      try {
        //* check if row has the required fields or not, if not skip
        if (!row?.Reference || !row?.Test || !row?.Uncer || !row?.Drift || !refId) {
          console.log('Skipping row due to missing required data:', row);
          stats.errors++;
          continue;
        }

        let tempRefId = existingTherTemperatureRefs.get(row.Guid);
        if (!tempRefId) {
          tempRefId = `${prefix}${String(existingTherTemperatureRefs.size + 1).padStart(6, '0')}`;

          const therTemperatureRefsData = {
            tempRefId,
            reference: row?.Reference || '',
            test: row?.Test || '',
            correction: row?.Correction || '',
            uncer: row?.Uncer || '',
            drift: row?.Drift || '',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };

          batch.set(doc(db, dataKeyA, dataKeyB, dataKeyC, refId, dataKeyD,tempRefId), therTemperatureRefsData); // prettier-ignore
          existingTherTemperatureRefs.set(row?.Guid, tempRefId);
          stats[`${dataKey}Success`]++;
          operationsInBatch++;
        }

        stats.processed++;

        //* Update progress
        onProgress(Math.round(((i + 1 - startIndex) / (data.length - startIndex)) * 100));
        onStats({
          ...stats,
          currentItem: `Processing ${row.Guid}`,
        });

        //* Commit batch when limit reached
        if (operationsInBatch === BATCH_SIZE) {
          await batch.commit();

          //* log
          console.log(`Batch committed at row ${i + 1}. Waiting...`);

          //* Delay
          await delay(DELAY_BETWEEN_BATCHES);

          //* Reset batch
          batch = writeBatch(db);
          operationsInBatch = 0;
        }
      } catch (error) {
        console.error(`Error processing row ${i + 1}:`, error);
        localStorage.setItem(`lastProcessed${dataKey}`, row.Guid);
        stats.errors++;
        await delay(DELAY_BETWEEN_BATCHES * 2);
      }
    }

    //* Commit final batch
    if (stats.processed > 0) {
      console.log(`Committing final batch with No of operation: ${operationsInBatch}`);
      await batch.commit();
    }

    localStorage.removeItem(`lastProcessed${dataKey}`);
    stats.status = 'completed';
    onStats(stats);
    return stats;
  } catch (error) {
    console.error(
      'FATAL ERROR  IN PROCESS_EXCEL_UPLOADER_CALIBRATION_THER_TEMPERATURE_REFS:',
      error
    );
    throw error;
  }
};

export const processExcelUploadCalibrationCKTempHumid = async ({
  prefix,
  dataKey,
  data,
  onProgress,
  onStats,
  lastDataId,
}) => {
  const auth = getAuth();
  const currentUser = auth.currentUser;

  let stats = {
    total: data.length,
    [`${dataKey}Success`]: 0,
    processed: 0,
    errors: 0,
    currentItem: '',
    status: 'processing',
  };

  // if (!currentUser) return;

  try {
    onStats(stats);

    const BATCH_SIZE = 20; //* Reduced batch size
    const DELAY_BETWEEN_BATCHES = 3000; //* 3 seconds delay

    let batch = writeBatch(db);
    let operationsInBatch = 0; //* Tracks number of operations in batch

    //* Find starting index
    let startIndex = 0;
    if (lastDataId) {
      startIndex = data.findIndex((row) => row.Guid === lastDataId);
      if (startIndex === -1) startIndex = 0;
    }

    const [dataKeyA, dataKeyB, dataKeyC] = dataKey.split('_');

    if ((!dataKeyA || !dataKeyB, !dataKeyC)) return;

    const existingCK = new Map();

    //* Get existing records
    const calibrationCKsnapshot = await getDocs(collection(db, dataKeyA, dataKeyB, dataKeyC));

    if (!calibrationCKsnapshot.empty) {
      calibrationCKsnapshot.forEach((doc) => {
        const data = doc.data();
        existingCK.set(data.refId, data);
      });
    }

    for (let i = startIndex; i < data.length; i++) {
      const row = data[i];

      try {
        //* check if row has the required fields or not, if not skip
        if (!row.DOF || !row.Value) {
          console.log('Skipping row due to missing required data:', row);
          stats.errors++;
          continue;
        }

        let refId = existingCK.get(row.Guid);
        if (!refId) {
          refId = `${prefix}${String(existingCK.size + 1).padStart(6, '0')}`;

          const ckData = {
            refId,
            dof: row?.DOF || '-1',
            value: row?.Value || '-1',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };

          batch.set(doc(db, dataKeyA, dataKeyB, dataKeyC, refId), ckData);
          existingCK.set(row?.Guid, refId);
          stats[`${dataKey}Success`]++;
          operationsInBatch++;
        }

        stats.processed++;

        //* Update progress
        onProgress(Math.round(((i + 1 - startIndex) / (data.length - startIndex)) * 100));
        onStats({
          ...stats,
          currentItem: `Processing ${row.Guid}`,
        });

        //* Commit batch when limit reached
        if (operationsInBatch === BATCH_SIZE) {
          await batch.commit();

          //* log
          console.log(`Batch committed at row ${i + 1}. Waiting...`);

          //* Delay
          await delay(DELAY_BETWEEN_BATCHES);

          //* Reset batch
          batch = writeBatch(db);
          operationsInBatch = 0;
        }
      } catch (error) {
        console.error(`Error processing row ${i + 1}:`, error);
        localStorage.setItem(`lastProcessed${dataKey}`, row.Guid);
        stats.errors++;
        await delay(DELAY_BETWEEN_BATCHES * 2);
      }
    }

    //* Commit final batch
    if (stats.processed > 0) {
      console.log(`Committing final batch with No of operation: ${operationsInBatch}`);
      await batch.commit();
    }

    localStorage.removeItem(`lastProcessed${dataKey}`);
    stats.status = 'completed';
    onStats(stats);
    return stats;
  } catch (error) {
    console.error('FATAL ERROR  IN PROCESS_EXCEL_UPLOADER_CALIBRATION_CK_TEMP_HUMID:', error);
    throw error;
  }
};

export const processExcelUploadCalibrationCMC = async ({
  prefix,
  dataKey,
  data,
  onProgress,
  onStats,
  lastDataId,
}) => {
  const auth = getAuth();
  const currentUser = auth.currentUser;

  let stats = {
    total: data.length,
    [`${dataKey}Success`]: 0,
    processed: 0,
    errors: 0,
    currentItem: '',
    status: 'processing',
  };

  // if (!currentUser) return;

  try {
    onStats(stats);

    const BATCH_SIZE = 20; //* Reduced batch size
    const DELAY_BETWEEN_BATCHES = 3000; //* 3 seconds delay

    let batch = writeBatch(db);
    let operationsInBatch = 0; //* Tracks number of operations in batch

    //* Find starting index
    let startIndex = 0;
    if (lastDataId) {
      startIndex = data.findIndex((row) => row.Guid === lastDataId);
      if (startIndex === -1) startIndex = 0;
    }

    const [dataKeyA, dataKeyB, dataKeyC] = dataKey.split('_');

    if ((!dataKeyA || !dataKeyB, !dataKeyC)) return;

    const existingCMC = new Map();

    //* Get existing records
    const calibrationExtensionsSnapshot = await getDocs(
      collection(db, dataKeyA, dataKeyB, dataKeyC)
    );

    if (!calibrationExtensionsSnapshot.empty) {
      calibrationExtensionsSnapshot.forEach((doc) => {
        const data = doc.data();
        existingCMC.set(data.refId, data);
      });
    }

    for (let i = startIndex; i < data.length; i++) {
      const row = data[i];

      try {
        //* check if row has the required fields or not, if not skip
        if (!row?.Description || !row?.Location) {
          console.log('Skipping row due to missing required data:', row);
          stats.errors++;
          continue;
        }

        let refId = existingCMC.get(row.Guid);
        if (!refId) {
          refId = `${prefix}${String(existingCMC.size + 1).padStart(6, '0')}`;

          const extensionsData = {
            refId,
            description: row?.Description || '',
            type: row?.Type || '',
            no: row?.No || '',
            location: row?.Location || '',
            min: row?.Min || '',
            max: row?.Max || '',
            uncer: row?.Uncertainty || '',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };

          batch.set(doc(db, dataKeyA, dataKeyB, dataKeyC, refId), extensionsData);
          existingCMC.set(row?.Guid, refId);
          stats[`${dataKey}Success`]++;
          operationsInBatch++;
        }

        stats.processed++;

        //* Update progress
        onProgress(Math.round(((i + 1 - startIndex) / (data.length - startIndex)) * 100));
        onStats({
          ...stats,
          currentItem: `Processing ${row.Guid}`,
        });

        //* Commit batch when limit reached
        if (operationsInBatch === BATCH_SIZE) {
          await batch.commit();

          //* log
          console.log(`Batch committed at row ${i + 1}. Waiting...`);

          //* Delay
          await delay(DELAY_BETWEEN_BATCHES);

          //* Reset batch
          batch = writeBatch(db);
          operationsInBatch = 0;
        }
      } catch (error) {
        console.error(`Error processing row ${i + 1}:`, error);
        localStorage.setItem(`lastProcessed${dataKey}`, row.Guid);
        stats.errors++;
        await delay(DELAY_BETWEEN_BATCHES * 2);
      }
    }

    //* Commit final batch
    if (stats.processed > 0) {
      console.log(`Committing final batch with No of operation: ${operationsInBatch}`);
      await batch.commit();
    }

    localStorage.removeItem(`lastProcessed${dataKey}`);
    stats.status = 'completed';
    onStats(stats);
    return stats;
  } catch (error) {
    console.error('FATAL ERROR  IN PROCESS_EXCEL_UPLOADER_CALIBRATION_CMC:', error);
    throw error;
  }
};

// Add resume function

export const resumeUpload = async (prefix, dataKey, data, onProgress, onStats) => {
  const lastData = localStorage.getItem(`lastProcessed${dataKey}`);
  if (!lastData) {
    throw new Error('No upload data available to resume');
  }
  return dataProcessExcelUploader[dataKey](prefix, dataKey, data, onProgress, onStats, lastData);
};

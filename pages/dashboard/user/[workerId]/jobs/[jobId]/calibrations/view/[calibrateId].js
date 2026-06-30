import { db } from '@/firebase';
import CalibrationSummary from '@/sub-components/dashboard/jobs/calibrations/view/CalibrationSummary';
import CalibrationRefInstrument from '@/sub-components/dashboard/jobs/calibrations/view/CalibrationRefInstrument';
import { GeeksSEO } from '@/widgets';
import { collection, doc, getDoc, getDocs, query } from 'firebase/firestore';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Button, Card, Spinner, Tab, Tabs } from 'react-bootstrap';
import { ArrowLeftShort, PencilSquare } from 'react-bootstrap-icons';
import PageHeader from '@/components/common/PageHeader';
import _ from 'lodash';
import { STATUS_COLOR } from '@/schema/calibrations/common-constant';
import WBCalibrationMeasurements from '@/sub-components/dashboard/jobs/calibrations/view/mass/weight-balance/WBMeasurements';
import WBCalibrationTemplate from '@/sub-components/dashboard/jobs/calibrations/view/mass/weight-balance/WBCalibrationTemplate';
import WBCalibrationResult from '@/sub-components/dashboard/jobs/calibrations/view/mass/weight-balance/WBCalibrationResult';
import WBCertificateOfCalibration from '@/sub-components/dashboard/jobs/calibrations/view/mass/weight-balance/WBCertificateOfCalibration';
import SWCalibrationMeasurements from '@/sub-components/dashboard/jobs/calibrations/view/mass/standard-weight/SWCalibrationMeasurements';
import SWCalibrationTemplate from '@/sub-components/dashboard/jobs/calibrations/view/mass/standard-weight/SWCalibrationTemplate';
import SWCalibrationResult from '@/sub-components/dashboard/jobs/calibrations/view/mass/standard-weight/SWCalibrationResult';
import SWCertificateOfCalibration from '@/sub-components/dashboard/jobs/calibrations/view/mass/standard-weight/SWCertificateOfCalibration';
import THRCalibrationMeasurements from '@/sub-components/dashboard/jobs/calibrations/view/temperature-humidity/thermocouple/THRCalibrationMeasurements';
import THRCalibrationTemplate from '@/sub-components/dashboard/jobs/calibrations/view/temperature-humidity/thermocouple/THRCalibrationTemplate';
import THRCalibrationResult from '@/sub-components/dashboard/jobs/calibrations/view/temperature-humidity/thermocouple/THRCalibrationResult';
import THRCertificateOfCalibration from '@/sub-components/dashboard/jobs/calibrations/view/temperature-humidity/thermocouple/THRCertificateOfCalibration';

const CalibrationDetails = () => {
  const router = useRouter();
  const { calibrateId, jobId, workerId } = router.query;

  const [calibration, setCalibration] = useState();
  const [instruments, setInstruments] = useState({ data: [], isLoading: true, isError: false });
  const [materials, setMaterials] = useState({ data: [], isLoading: true, isError: false });
  const [environmental, setEnvironmental] = useState({ data: [], isLoading: true, isError: false });

  const [refTher, setRefTher] = useState({ data: [], isLoading: true, isError: false });
  const [refInd, setRefInd] = useState({ data: [], isLoading: true, isError: false });
  const [refWire, setRefWire] = useState({ data: [], isLoading: true, isError: false });
  const [bath, setBath] = useState({ data: [], isLoading: true, isError: false });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeTab, setActiveTab] = useState('0');

  const renderTabs = (props) => {
    const categoryValue = calibration?.category;
    const variantValue = calibration?.variant;

    if (!categoryValue || !variantValue) return null;

    switch (categoryValue) {
      case 'TEMPERATURE & HUMIDITY': {
        if (variantValue === 'thermocouple') {
          return [
            <Tab eventKey='1' title='Measurements'>
              <THRCalibrationMeasurements {...props} />
            </Tab>,

            <Tab eventKey='2' title='Reference Instruments'>
              <CalibrationRefInstrument {...props} />
            </Tab>,

            <Tab eventKey='3' title='Calibration'>
              <THRCalibrationTemplate {...props} />
            </Tab>,

            <Tab eventKey='4' title='Result'>
              <THRCalibrationResult {...props} />
            </Tab>,

            <Tab eventKey='6' title='COC'>
              <THRCertificateOfCalibration {...props} />
            </Tab>,
          ];
        }
      }

      case 'MASS': {
        if (variantValue === 'weight-balance') {
          return [
            <Tab eventKey='1' title='Measurements'>
              <WBCalibrationMeasurements {...props} />
            </Tab>,

            <Tab eventKey='2' title='Reference Instruments'>
              <CalibrationRefInstrument {...props} />
            </Tab>,

            <Tab eventKey='3' title='Calibration'>
              <WBCalibrationTemplate {...props} />
            </Tab>,

            <Tab eventKey='4' title='Result'>
              <WBCalibrationResult {...props} />
            </Tab>,

            <Tab eventKey='6' title='COC'>
              <WBCertificateOfCalibration {...props} />
            </Tab>,
          ];
        }

        if (variantValue === 'standard-weight') {
          return [
            <Tab eventKey='1' title='Measurements'>
              <SWCalibrationMeasurements {...props} />
            </Tab>,

            <Tab eventKey='2' title='Reference Instruments'>
              <CalibrationRefInstrument {...props} />
            </Tab>,

            <Tab eventKey='3' title='Calibration'>
              <SWCalibrationTemplate {...props} />
            </Tab>,

            <Tab eventKey='4' title='Result'>
              <SWCalibrationResult {...props} />
            </Tab>,

            <Tab eventKey='5' title='COC'>
              <SWCertificateOfCalibration {...props} />
            </Tab>,
          ];
        }
      }

      default:
        return null;
    }
  };

  //* query calibration & job header
  useEffect(() => {
    if (calibrateId) {
      const jobHeaderRef = doc(db, 'jobHeaders', jobId);
      const calibrationRef = doc(db, 'jobCalibrations', calibrateId);
      const certificateRef = doc(db, 'jobCertificates', calibrateId);

      Promise.all([getDoc(calibrationRef), getDoc(certificateRef), getDoc(jobHeaderRef)])
        .then(async ([calibrationSnapshot, certificateSnapshot, jobHeaderSnapshot]) => {
          if (
            calibrationSnapshot.exists() &&
            certificateSnapshot.exists() &&
            jobHeaderSnapshot.exists()
          ) {
            const calibrationData = calibrationSnapshot.data();
            const certificateData = certificateSnapshot.data();
            const jobHeaderData = { jobId: jobHeaderSnapshot.id, ...jobHeaderSnapshot.data() };

            const locationSnapshot = jobHeaderData.location.id
              ? await getDoc(doc(db, 'locations', jobHeaderData.location.id))
              : undefined;

            const customerEquipmentSnapshot = calibrationData.description.id
              ? await getDoc(doc(db, 'customerEquipments', calibrationData.description.id))
              : undefined;

            const resolvedData = calibrationData?.data ? JSON.parse(calibrationData.data) : null;

            setCalibration({
              id: calibrationSnapshot.id,
              ...calibrationData,
              data: resolvedData,
              ...certificateData,
              location: locationSnapshot?.exists() ? {id: locationSnapshot.id, ...locationSnapshot.data()} : undefined, //prettier-ignore
              description: customerEquipmentSnapshot?.exists() ? { id: customerEquipmentSnapshot.id, ...customerEquipmentSnapshot.data()} : undefined, //prettier-ignore
              job: { id: jobHeaderSnapshot.id, ...jobHeaderData }, //prettier-ignore
            });
            setIsLoading(false);
          } else {
            setError('Calibration not found');
            setIsLoading(false);
          }
        })
        .catch((err) => {
          console.log(err);
          setError(err.message || 'Error fetching calibration');
          setIsLoading(false);
        });
    }
  }, [calibrateId]);

  //* query equipments
  useEffect(() => {
    if (calibration) {
      getDocs(collection(db, 'equipments'))
        .then((snapshot) => {
          if (!snapshot.empty) {
            const instruments = snapshot.docs
              .filter((instrument) => calibration.instruments?.includes(instrument.id))
              .map((doc) => {
                const data = doc.data();

                return {
                  id: doc.id,
                  tagId: data.tagId,
                  description: data.description,
                  category: data.category?.toLowerCase() || '',
                  make: data.make,
                  model: data.model,
                  serialNumber: data.serialNumber,
                  traceability: data.traceability,
                  certificateNo: data.certificateNo,
                  dueDate: undefined, //TODO: due date not yet available in the equipment's property
                };
              });

            setInstruments({ data: instruments, isLoading: false, isError: false });
          } else setInstruments({ data: [], isLoading: false, isError: false });
        })
        .catch((err) => {
          console.error(err.message);
          setInstruments({ data: [], isLoading: false, isError: true });
        });
    }
  }, [calibration]);

  //* query materials
  useEffect(() => {
    const q = query(collection(db, 'jobCalibrationReferences', 'CR000005', 'data'));

    getDocs(q)
      .then((snapshot) => {
        if (!snapshot.empty) {
          const materialDocs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

          setMaterials({
            data: materialDocs,
            isLoading: false,
            isError: false,
          });

          return;
        }

        setMaterials({ data: [], isLoading: false, isError: false });
      })
      .catch((err) => {
        console.error(err.message);
        setMaterials({ data: [], isLoading: false, isError: true });
      });
  }, []);

  //* query environmental
  useEffect(() => {
    const q = query(collection(db, 'jobCalibrationReferences', 'CR000007', 'data'));

    getDocs(q)
      .then((snapshot) => {
        if (!snapshot.empty) {
          const environmentalDocs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

          setEnvironmental({
            data: environmentalDocs,
            isLoading: false,
            isError: false,
          });

          return;
        }

        setEnvironmental({ data: [], isLoading: false, isError: false });
      })
      .catch((err) => {
        console.error(err.message);
        setEnvironmental({ data: [], isLoading: false, isError: true });
      });
  }, []);

  //* query refTher
  useEffect(() => {
    if (!calibration?.category || calibration?.category !== 'TEMPERATURE & HUMIDITY') return;

    const q = query(collection(db, 'jobCalibrationReferences', 'CR000008', 'data'));

    getDocs(q)
      .then((snapshot) => {
        if (!snapshot.empty) {
          const refTherDocs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

          setRefTher({
            data: refTherDocs,
            isLoading: false,
            isError: false,
          });

          return;
        }

        setRefTher({ data: [], isLoading: false, isError: false });
      })
      .catch((err) => {
        console.error(err.message);
        setRefTher({ data: [], isLoading: false, isError: true });
      });
  }, [calibration?.category]);

  //* query refInd
  useEffect(() => {
    if (!calibration?.category || calibration?.category !== 'TEMPERATURE & HUMIDITY') return;

    const q = query(collection(db, 'jobCalibrationReferences', 'CR000016', 'data'));

    getDocs(q)
      .then((snapshot) => {
        if (!snapshot.empty) {
          const refIndDocs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

          setRefInd({
            data: refIndDocs,
            isLoading: false,
            isError: false,
          });

          return;
        }

        setRefInd({ data: [], isLoading: false, isError: false });
      })
      .catch((err) => {
        console.error(err.message);
        setRefInd({ data: [], isLoading: false, isError: true });
      });
  }, [calibration?.category]);

  //* query refWire (extensions)
  useEffect(() => {
    if (!calibration?.category || calibration?.category !== 'TEMPERATURE & HUMIDITY') return;

    const q = query(collection(db, 'jobCalibrationReferences', 'CR000011', 'data'));

    getDocs(q)
      .then((snapshot) => {
        if (!snapshot.empty) {
          const refWireDocs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

          setRefWire({
            data: refWireDocs,
            isLoading: false,
            isError: false,
          });

          return;
        }

        setRefWire({ data: [], isLoading: false, isError: false });
      })
      .catch((err) => {
        console.error(err.message);
        setRefWire({ data: [], isLoading: false, isError: true });
      });
  }, [calibration?.category]);

  //* query bath
  useEffect(() => {
    if (!calibration?.category || calibration?.category !== 'TEMPERATURE & HUMIDITY') return;

    const q = query(collection(db, 'jobCalibrationReferences', 'CR000012', 'data'));

    getDocs(q)
      .then((snapshot) => {
        if (!snapshot.empty) {
          const refBathDocs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

          setBath({
            data: refBathDocs,
            isLoading: false,
            isError: false,
          });

          return;
        }

        setBath({ data: [], isLoading: false, isError: false });
      })
      .catch((err) => {
        console.error(err.message);
        setBath({ data: [], isLoading: false, isError: true });
      });
  }, [calibration?.category]);

  if (isLoading) {
    return (
      <div className='d-flex justify-content-center align-items-center' style={{ height: '100vh' }}>
        <Spinner animation='border' variant='primary' />
        <span className='ms-3'>Loading Calibration...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className='d-flex justify-content-center align-items-center text-center py-5'
        style={{ height: '63vh' }}
      >
        <div>
          <h3 className='text-danger'>Error</h3>
          <p className='text-muted'>{error}</p>
          <Button
            className='btn btn-primary'
            onClick={() => router.push(`/user/${workerId}/jobs/${jobId}/calibrations`)}
          >
            Back to Job Calibration List
          </Button>
        </div>
      </div>
    );
  }

  if (!calibration) {
    return (
      <div
        className='d-flex justify-content-center align-items-center text-center py-5'
        style={{ height: '63vh' }}
      >
        <div>
          <h3>calibration not found</h3>
          <Link href={`/user/${workerId}/jobs/${jobId}/calibrations`}>
            <Button variant='primary' className='mt-3'>
              Back to Job Calibration List
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  console.log({ calibration });

  return (
    <>
      <GeeksSEO
        title={`View Calibration #${calibrateId} for Job #${jobId} | VITAR Group | Portal`}
      />

      <div className='d-flex flex-column row-gap-4'>
        <PageHeader
          title={`View Calibration #${calibrateId} for Job #${jobId}`}
          subtitle='View calibration details'
          customBadges={[
            {
              label: _.startCase(calibration?.status),
              color: STATUS_COLOR[calibration?.status] || 'secondary',
            },
          ]}
          actionButtons={[
            {
              text: 'Back',
              icon: <ArrowLeftShort size={20} />,
              variant: 'outline-primary',
              onClick: () => router.push(`/user/${workerId}/jobs/${jobId}/calibrations`),
            },
          ]}
          dropdownItems={[
            ...(calibration?.job?.status !== 'job-complete'
              ? [
                  {
                    label: 'Edit Calibration',
                    icon: PencilSquare,
                    onClick: () =>
                      router.push(
                        `/user/${workerId}/jobs/${jobId}/calibrations/edit-calibrations/${calibrateId}`
                      ),
                  },
                ]
              : []),
          ]}
        />

        <Card className='shadow-sm'>
          <Card.Body>
            <Tabs activeKey={activeTab} onSelect={setActiveTab}>
              <Tab eventKey='0' title='Summary'>
                <CalibrationSummary calibration={calibration} />
              </Tab>

              {renderTabs({
                calibration,
                instruments,
                materials,
                environmental,
                refTher,
                refInd,
                refWire,
                bath,
              })}
            </Tabs>
          </Card.Body>
        </Card>
      </div>
    </>
  );
};

export default CalibrationDetails;

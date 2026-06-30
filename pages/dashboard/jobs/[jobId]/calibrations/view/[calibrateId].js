import ContentHeader from '@/components/dashboard/ContentHeader';
import { db } from '@/firebase';
import CalibrationSummary from '@/sub-components/dashboard/jobs/calibrations/view/CalibrationSummary';
import CalibrationRefInstrument from '@/sub-components/dashboard/jobs/calibrations/view/CalibrationRefInstrument';
import { GeeksSEO } from '@/widgets';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Button, Card, Form, Spinner, Tab, Tabs } from 'react-bootstrap';
import {
  ArrowLeftShort,
  BriefcaseFill,
  HandThumbsDown,
  HouseDoorFill,
  InfoSquareFill,
  PencilSquare,
  ShieldCheck,
  Speedometer,
} from 'react-bootstrap-icons';
import { PRINT_STATUS_COLOR, STATUS_COLOR } from '@/schema/calibrations/common-constant';
import _ from 'lodash';
import { useNotifications } from '@/hooks/useNotifications';
import withReactContent from 'sweetalert2-react-content';
import Swal from 'sweetalert2';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import WBCalibrationMeasurements from '@/sub-components/dashboard/jobs/calibrations/view/mass/weight-balance/WBMeasurements';
import WBCalibrationTemplate from '@/sub-components/dashboard/jobs/calibrations/view/mass/weight-balance/WBCalibrationTemplate';
import WBCalibrationResult from '@/sub-components/dashboard/jobs/calibrations/view/mass/weight-balance/WBCalibrationResult';
import WBCertificateOfCalibration from '@/sub-components/dashboard/jobs/calibrations/view/mass/weight-balance/WBCertificateOfCalibration';
import SWCalibrationMeasurements from '@/sub-components/dashboard/jobs/calibrations/view/mass/standard-weight/SWCalibrationMeasurements';
import SWCalibrationResult from '@/sub-components/dashboard/jobs/calibrations/view/mass/standard-weight/SWCalibrationResult';
import SWCalibrationTemplate from '@/sub-components/dashboard/jobs/calibrations/view/mass/standard-weight/SWCalibrationTemplate';
import SWCertificateOfCalibration from '@/sub-components/dashboard/jobs/calibrations/view/mass/standard-weight/SWCertificateOfCalibration';
import THRCalibrationMeasurements from '@/sub-components/dashboard/jobs/calibrations/view/temperature-humidity/thermocouple/THRCalibrationMeasurements';
import THRCalibrationTemplate from '@/sub-components/dashboard/jobs/calibrations/view/temperature-humidity/thermocouple/THRCalibrationTemplate';
import THRCalibrationResult from '@/sub-components/dashboard/jobs/calibrations/view/temperature-humidity/thermocouple/THRCalibrationResult';
import THRCertificateOfCalibration from '@/sub-components/dashboard/jobs/calibrations/view/temperature-humidity/thermocouple/THRCertificateOfCalibration';

const CalibrationDetails = () => {
  const router = useRouter();
  const auth = useAuth();
  const { calibrateId, jobId } = router.query;

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

  const notifications = useNotifications();

  const notifyCalibratedBy = async (status, calibration) => {
    if (!calibration) return;

    try {
      const workerId = calibration?.calibratedBy?.id || '';
      const snapshots = await getDocs(
        query(collection(db, 'users'), where('workerId', '==', workerId))
      );

      if (!snapshots.empty) {
        const snapshot = snapshots.docs[0];
        const user = { id: snapshot.id, ...snapshot.data() };

        if (user && user.id) {
          await notifications.create({
            module: 'calibration',
            target: [user.id],
            title: 'Calibration status updated',
            message: `Calibration (#${calibrateId}) status was updated by ${auth.currentUser.displayName} to "${_.startCase(status)}".`, //prettier-ignore
            data: {
              redirectUrl: `/jobs/${jobId}/calibrations/view/${calibrateId}`,
            },
          });

          //* reload page after 2 seconds
          setTimeout(() => {
            router.reload();
          }, 2000);
        }
      }
    } catch (error) {
      console.error('Failed to notify technician:', error);
    }
  };

  const handleUpdateCalibrationStatus = (id, status, setIsLoading) => {
    if (status === 'data-rejected') {
      withReactContent(Swal)
        .fire({
          title: `Calibration Status Update - Calibration #${id}`,
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Confirm',
          cancelButtonText: 'Cancel',
          customClass: {
            confirmButton: 'btn btn-primary rounded',
            cancelButton: 'btn btn-secondary rounded',
          },
          html: (
            <div className='d-flex flex-column gap-4'>
              <div
                style={{ color: '#545454' }}
              >{`Are you sure you want to update the calibration status to "${_.startCase(
                status
              )}"?`}</div>

              <div>
                <Form.Control
                  id={`calibration-status-update-${id}`}
                  type='text'
                  as='textarea'
                  rows={4}
                  placeholder='Enter a message/reason'
                />
              </div>
            </div>
          ),
          preConfirm: () => {
            return document.getElementById(`calibration-status-update-${id}`).value;
          },
        })
        .then(async (data) => {
          const { value, isConfirmed } = data;
          if (isConfirmed) {
            try {
              setIsLoading(true);

              const calibrationRef = doc(db, 'jobCalibrations', id);

              await Promise.all([
                updateDoc(calibrationRef, {
                  status,
                  reasonMessage: value,
                  updatedAt: serverTimestamp(),
                  updatedBy: auth.currentUser,
                }),
                //* create notification for admin and supervisor when updated a calibration status
                notifications.create({
                  module: 'calibration',
                  target: ['admin', 'supervisor'],
                  title: 'Calibration status updated',
                  message: `Calibration (#${id}) status was updated by ${auth.currentUser.displayName} to "${_.startCase(status)}".`, //prettier-ignore
                  data: {
                    redirectUrl: `/jobs/${jobId}/calibrations/view/${id}`,
                  },
                }),

                notifyCalibratedBy(status, calibration),
              ]);

              toast.success('Job request status updated successfully', {
                position: 'top-right',
              });
              setIsLoading(false);
            } catch (error) {
              console.error('Error updating job request status:', error);
              toast.error('Error updating job request status: ' + error.message, { position: 'top-right' }); //prettier-ignore
              setIsLoading(false);
            }
          }
        });
      return;
    }

    Swal.fire({
      title: `Calibration Status Update - Calibration #${id}`,
      text: `Are you sure you want to update the calibration status to "${_.startCase(status)}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Confirm',
      cancelButtonText: 'Cancel',
      customClass: {
        confirmButton: 'btn btn-primary rounded',
        cancelButton: 'btn btn-secondary rounded',
      },
    }).then(async (data) => {
      if (data.isConfirmed) {
        try {
          setIsLoading(true);

          const jobCalibrationRef = doc(db, 'jobCalibrations', id);

          await Promise.all([
            updateDoc(jobCalibrationRef, {
              status,
              reasonMessage: null,
              updatedAt: serverTimestamp(),
              updatedBy: auth.currentUser,
            }),

            //* create notification for admin and supervisor when updated a calibration status
            notifications.create({
              module: 'calibration',
              target: ['admin', 'supervisor'],
              title: 'Calibration status updated',
              message: `Calibration (#${id}) status was updated by ${auth.currentUser.displayName} to "${_.startCase(status)}".`, //prettier-ignore
              data: {
                redirectUrl: `/jobs/${jobId}/calibrations/view/${id}`,
              },
            }),

            notifyCalibratedBy(status, calibration),
          ]);

          toast.success('Calibration status updated successfully', {
            position: 'top-right',
          });
          setIsLoading(false);
        } catch (error) {
          console.error('Error updating calibration status:', error);
          toast.error('Error updating calibration status: ' + error.message, { position: 'top-right' }); //prettier-ignore
          setIsLoading(false);
        }
      }
    });
  };

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

      case 'MASS':
        {
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

            console.log({ certificateData });

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
                  uncertainty: data?.uncertainty,
                  uncertaintyUnit: data?.uncertaintyUnit,
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
    if (!calibration?.category || calibration?.category !== 'MASS') return;

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
  }, [calibration?.category]);

  //* query environmental
  useEffect(() => {
    if (!calibration?.category || calibration?.category !== 'MASS') return;

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
  }, [calibration?.category]);

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
          <Button className='btn btn-primary' onClick={() => router.push('/jobs')}>
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
          <Link href='/jobs'>
            <Button variant='primary' className='mt-3'>
              Back to Job Calibration List
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <GeeksSEO title={`View Job #${jobId} Calibration | VITAR Group`} />

      <ContentHeader
        title={`View Details for Job #${jobId} Calibration #${calibrateId}`}
        description='View comprehensive job calibration details including calibration info, measurements, reference instruments & calibration test & data'
        badgeText='Calibration Management'
        badgeText2='View Calibration'
        breadcrumbItems={[
          {
            icon: <HouseDoorFill className='me-2' size={14} />,
            text: 'Dashboard',
            link: '/dashboard',
          },
          {
            text: 'Jobs',
            link: '/jobs',
            icon: <BriefcaseFill className='me-2' size={14} />,
          },
          {
            text: `Job #${jobId} Calibrations`,
            link: `/jobs/${jobId}/calibrations`,
            icon: <Speedometer className='me-2' size={14} />,
          },
          {
            icon: <InfoSquareFill className='me-2' size={14} />,
            text: calibrateId,
          },
        ]}
        customBadges={[
          {
            label: _.startCase(calibration?.status),
            color: STATUS_COLOR[calibration?.status] || 'secondary',
          },
          ...(calibration?.printStatus
            ? [
                {
                  label: _.startCase(calibration?.printStatus),
                  color: PRINT_STATUS_COLOR[calibration?.printStatus] || 'secondary',
                },
              ]
            : []),
        ]}
        actionButtons={[
          {
            text: `Back to Job #${jobId} Calibrations`,
            icon: <ArrowLeftShort size={20} />,
            variant: 'outline-primary',
            onClick: () => router.push(`/jobs/${jobId}/calibrations`),
          },
        ]}
        dropdownItems={[
          {
            label: 'Edit Calibration',
            icon: PencilSquare,
            onClick: () =>
              router.push(`/jobs/${jobId}/calibrations/edit-calibrations/${calibrateId}`),
          },
          // prettier-ignore
          ...((auth.role === 'admin' || auth.role === 'supervisor') && calibration && calibration?.status !== 'data-rejected'
            ? [
                {
                  label: 'Data Rejected',
                  icon: HandThumbsDown,
                  onClick: (args) => handleUpdateCalibrationStatus(calibrateId, 'data-rejected', args.setIsLoading),
                },
              ]
            : []),
          // prettier-ignore
          ...((auth.role === 'admin' || auth.role === 'supervisor') && calibration && calibration?.status !== 'cert-complete'
          ? [
              {
                label: 'Cert Complete',
                icon: ShieldCheck,
                onClick: (args) => handleUpdateCalibrationStatus(calibrateId, 'cert-complete', args.setIsLoading),
              },
            ]
          : []),
        ]}
      />

      <Card>
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
    </>
  );
};

export default CalibrationDetails;

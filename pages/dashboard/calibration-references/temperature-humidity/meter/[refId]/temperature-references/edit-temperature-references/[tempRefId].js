import ContentHeader from '@/components/dashboard/ContentHeader';
import { db } from '@/firebase';
import TempRefForm from '@/sub-components/dashboard/calibration-references/TempRefForm';
import { GeeksSEO } from '@/widgets';
import { doc, getDoc } from 'firebase/firestore';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Button, Card, Spinner } from 'react-bootstrap';
import {
  ArrowLeftShort,
  Eye,
  Hash,
  HouseDoorFill,
  ListColumns,
  Table,
  Thermometer,
} from 'react-bootstrap-icons';

function EditMeterTemperatureReference() {
  const router = useRouter();
  const { refId, tempRefId } = router.query;

  const [meterTempRef, setMeterTempRef] = useState();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  //* query meter
  useEffect(() => {
    if (refId && tempRefId) {
      const meterTempRefDocRef = doc(
        db,
        'jobCalibrationReferences',
        'CR000016',
        'data',
        refId,
        'temperatureRefs',
        tempRefId
      );

      getDoc(meterTempRefDocRef)
        .then((doc) => {
          if (doc.exists()) {
            setMeterTempRef({ id: doc.id, ...doc.data() });
            setIsLoading(false);
          } else {
            setError('Reference Data not found');
            setIsLoading(false);
          }
        })
        .catch((err) => {
          setError(err.message || 'Error fetching reference data');
          setIsLoading(false);
        });
    }
  }, [refId, tempRefId]);

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
            onClick={() =>
              router.push(
                `/calibration-references/temperature-humidity/meter/${refId}/temperature-references`
              )
            }
          >
            Back to Meter List
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className='d-flex justify-content-center align-items-center' style={{ height: '100vh' }}>
        <Spinner animation='border' variant='primary' />
        <span className='ms-3'>Loading Reference Data...</span>
      </div>
    );
  }

  if (!meterTempRef) {
    return (
      <div
        className='d-flex justify-content-center align-items-center text-center py-5'
        style={{ height: '63vh' }}
      >
        <div>
          <h3>Reference Data not found</h3>
          <Link
            href={`/calibration-references/temperature-humidity/meter/${refId}/temperature-references`}
          >
            <Button variant='primary' className='mt-3'>
              Back to Meter List
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <GeeksSEO title="Edit Meter's Temperature References VITAR Group | Portal" />

      <ContentHeader
        title="Edit Meter's Temperature References"
        description='Edit meter information'
        badgeText='Calibration References Data Management'
        badgeText2='Edit Temperature Reference Data'
        breadcrumbItems={[
          {
            text: 'Dashboard',
            link: '/',
            icon: <HouseDoorFill className='me-2' style={{ fontSize: '14px' }} />,
          },
          {
            text: 'Calibration References',
            link: '/calibration-references/temperature-humidity/meter',
            icon: <ListColumns className='me-2' size={14} />,
          },
          {
            text: 'Temperature & Humidity',
            link: '/calibration-references/temperature-humidity/meter',
            icon: <Thermometer className='me-2' size={14} />,
          },
          {
            text: 'Meter',
            link: '/calibration-references/temperature-humidity/meter',
            icon: <Table className='me-2' size={14} />,
          },
          ,
          {
            text: refId,
            link: `/calibration-references/temperature-humidity/meter/${refId}/temperature-references`,
            icon: <Hash className='me-2' size={14} />,
          },
          {
            text: 'Temperature References',
            link: `/calibration-references/temperature-humidity/meter/${refId}/temperature-references`,
            icon: <Table className='me-2' size={14} />,
          },
          {
            text: meterTempRef?.tempRefId ? meterTempRef?.tempRefId : 'Create',
            link: `/calibration-references/temperature-humidity/meter/${refId}/temperature-references/edit-temperature-references/${meterTempRef?.tempRefId}`,
            icon: <Hash className='me-2' size={14} />,
          },
        ]}
        actionButtons={[
          {
            text: `Back`,
            icon: <ArrowLeftShort size={20} />,
            variant: 'outline-primary',
            onClick: () =>
              router.push(
                `/calibration-references/temperature-humidity/meter/${refId}/temperature-references`
              ),
          },
        ]}
        dropdownItems={[
          {
            label: 'View Temperature Ref',
            icon: Eye,
            onClick: () =>
              router.push(
                `/calibration-references/temperature-humidity/meter/${refId}/temperature-references/view/${meterTempRef.tempRefId}`
              ),
          },
        ]}
      />

      <Card className='shadow-sm'>
        <Card.Body>
          <TempRefForm data={meterTempRef} jobCalibrationRefId='CR000016' path='meter' />
        </Card.Body>
      </Card>
    </>
  );
}

export default EditMeterTemperatureReference;

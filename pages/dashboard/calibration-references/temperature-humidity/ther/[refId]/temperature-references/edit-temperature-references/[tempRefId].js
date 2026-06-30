import ContentHeader from '@/components/dashboard/ContentHeader';
import { db } from '@/firebase';
import TempRefForm from '@/sub-components/dashboard/calibration-references/TempRefForm';
import TherForm from '@/sub-components/dashboard/calibration-references/TherForm';
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
  PencilFill,
  Table,
  Thermometer,
} from 'react-bootstrap-icons';

function EditTherTemperatureReference() {
  const router = useRouter();
  const { refId, tempRefId } = router.query;

  const [therTempRef, setTherTempRef] = useState();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  //* query ther
  useEffect(() => {
    if (refId && tempRefId) {
      const therTempRefDocRef = doc(
        db,
        'jobCalibrationReferences',
        'CR000008',
        'data',
        refId,
        'temperatureRefs',
        tempRefId
      );

      getDoc(therTempRefDocRef)
        .then((doc) => {
          if (doc.exists()) {
            setTherTempRef({ id: doc.id, ...doc.data() });
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
                `/calibration-references/temperature-humidity/ther/${refId}/temperature-references`
              )
            }
          >
            Back to Ther List
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

  if (!therTempRef) {
    return (
      <div
        className='d-flex justify-content-center align-items-center text-center py-5'
        style={{ height: '63vh' }}
      >
        <div>
          <h3>Reference Data not found</h3>
          <Link
            href={`/calibration-references/temperature-humidity/ther/${refId}/temperature-references`}
          >
            <Button variant='primary' className='mt-3'>
              Back to Ther List
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <GeeksSEO title="Edit Ther's Temperature References VITAR Group | Portal" />

      <ContentHeader
        title="Edit Ther's Temperature References"
        description='Edit ther information'
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
            link: '/calibration-references/temperature-humidity/ther',
            icon: <ListColumns className='me-2' size={14} />,
          },
          {
            text: 'Temperature & Humidity',
            link: '/calibration-references/temperature-humidity/ther',
            icon: <Thermometer className='me-2' size={14} />,
          },
          {
            text: 'Ther',
            link: '/calibration-references/temperature-humidity/ther',
            icon: <Table className='me-2' size={14} />,
          },
          ,
          {
            text: refId,
            link: `/calibration-references/temperature-humidity/ther/${refId}/temperature-references`,
            icon: <Hash className='me-2' size={14} />,
          },
          {
            text: 'Temperature References',
            link: `/calibration-references/temperature-humidity/ther/${refId}/temperature-references`,
            icon: <Table className='me-2' size={14} />,
          },
          {
            text: therTempRef?.tempRefId ? therTempRef?.tempRefId : 'Create',
            link: `/calibration-references/temperature-humidity/ther/${refId}/temperature-references/edit-temperature-references/${therTempRef?.tempRefId}`,
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
                `/calibration-references/temperature-humidity/ther/${refId}/temperature-references`
              ),
          },
        ]}
        dropdownItems={[
          {
            label: 'View Temperature Ref',
            icon: Eye,
            onClick: () =>
              router.push(
                `/calibration-references/temperature-humidity/ther/${refId}/temperature-references/view/${therTempRef.tempRefId}`
              ),
          },
        ]}
      />

      <Card className='shadow-sm'>
        <Card.Body>
          <TempRefForm data={therTempRef} jobCalibrationRefId='CR000008' path='ther' />
        </Card.Body>
      </Card>
    </>
  );
}

export default EditTherTemperatureReference;

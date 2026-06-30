import ContentHeader from '@/components/dashboard/ContentHeader';
import { db } from '@/firebase';
import BathStabilityForm from '@/sub-components/dashboard/calibration-references/BathStabilityForm';
import { GeeksSEO } from '@/widgets';
import { doc, getDoc } from 'firebase/firestore';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Button, Card, Spinner } from 'react-bootstrap';
import {
  ArrowLeftShort,
  Eye,
  HouseDoorFill,
  ListColumns,
  PencilFill,
  Table,
  Thermometer,
} from 'react-bootstrap-icons';

function EditBathStability() {
  const router = useRouter();
  const { refId } = router.query;

  const [bathStability, setBathStability] = useState();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  //* query bath meausured value
  useEffect(() => {
    if (refId) {
      const bathStabilityDocRef = doc(db, 'jobCalibrationReferences', 'CR000014', 'data', refId);

      getDoc(bathStabilityDocRef)
        .then((doc) => {
          if (doc.exists()) {
            setBathStability({ id: doc.id, ...doc.data() });
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
  }, [refId]);

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
              router.push('/calibration-references/temperature-humidity/bath/stability')
            }
          >
            Back to Bath Stability List
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

  if (!bathStability) {
    return (
      <div
        className='d-flex justify-content-center align-items-center text-center py-5'
        style={{ height: '63vh' }}
      >
        <div>
          <h3>Reference Data not found</h3>
          <Link href='/calibration-references/temperature-humidity/bath/stability'>
            <Button variant='primary' className='mt-3'>
              Back to Bath Stability List
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <GeeksSEO title='Edit Bath Stability - VITAR Group | Portal' />

      <ContentHeader
        title='Edit Bath Stability'
        description='Edit bath stability information'
        badgeText='Calibration References Data Management'
        badgeText2='Edit Reference Data'
        breadcrumbItems={[
          {
            text: 'Dashboard',
            link: '/',
            icon: <HouseDoorFill className='me-2' style={{ fontSize: '14px' }} />,
          },
          {
            text: 'Calibration References',
            link: '/calibration-references/temperature-humidity/bath/stability',
            icon: <ListColumns className='me-2' size={14} />,
          },
          {
            text: 'Temperature & Humidity',
            link: '/calibration-references/temperature-humidity/bath/stability',
            icon: <Thermometer className='me-2' size={14} />,
          },
          {
            text: 'Bath Stability',
            link: '/calibration-references/temperature-humidity/bath/stability',
            icon: <Table className='me-2' size={14} />,
          },
          ,
          {
            text: bathStability ? bathStability.id : 'Create',
            link: `/calibration-references/temperature-humidity/bath/stability/edit-stability/${refId}`,
            icon: <PencilFill className='me-2' size={14} />,
          },
        ]}
        actionButtons={[
          {
            text: `Back`,
            icon: <ArrowLeftShort size={20} />,
            variant: 'outline-primary',
            onClick: () =>
              router.push('/calibration-references/temperature-humidity/bath/stability'),
          },
        ]}
        dropdownItems={[
          {
            label: 'View Bath Stability',
            icon: Eye,
            onClick: () =>
              router.push(
                `/calibration-references/temperature-humidity/bath/stability/view/${refId}`
              ),
          },
        ]}
      />

      <Card className='shadow-sm'>
        <Card.Body>
          <BathStabilityForm data={bathStability} />
        </Card.Body>
      </Card>
    </>
  );
}

export default EditBathStability;

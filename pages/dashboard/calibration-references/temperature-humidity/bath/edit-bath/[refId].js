import ContentHeader from '@/components/dashboard/ContentHeader';
import { db } from '@/firebase';
import BathForm from '@/sub-components/dashboard/calibration-references/BathForm';
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

function EditBath() {
  const router = useRouter();
  const { refId } = router.query;

  const [bath, setBath] = useState();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  //* query bath
  useEffect(() => {
    if (refId) {
      const bathDocRef = doc(db, 'jobCalibrationReferences', 'CR000012', 'data', refId);

      getDoc(bathDocRef)
        .then((doc) => {
          if (doc.exists()) {
            setBath({ id: doc.id, ...doc.data() });
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
          <Button onClick={() => router.push('/calibration-references/temperature-humidity/bath')}>
            Back to Bath List
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

  if (!bath) {
    return (
      <div
        className='d-flex justify-content-center align-items-center text-center py-5'
        style={{ height: '63vh' }}
      >
        <div>
          <h3>Reference Data not found</h3>
          <Link href='/calibration-references/temperature-humidity/bath'>
            <Button variant='primary' className='mt-3'>
              Back to Bath List
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <GeeksSEO title='Edit Bath - VITAR Group | Portal' />

      <ContentHeader
        title='Edit Bath'
        description='Edit bath information'
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
            link: '/calibration-references/temperature-humidity/bath',
            icon: <ListColumns className='me-2' size={14} />,
          },
          {
            text: 'Temperature & Humidity',
            link: '/calibration-references/temperature-humidity/bath',
            icon: <Thermometer className='me-2' size={14} />,
          },
          {
            text: 'Bath',
            link: '/calibration-references/temperature-humidity/bath',
            icon: <Table className='me-2' size={14} />,
          },
          ,
          {
            text: bath ? bath.id : 'Create',
            link: `/calibration-references/temperature-humidity/bath/edit-bath/${refId}`,
            icon: <PencilFill className='me-2' size={14} />,
          },
        ]}
        actionButtons={[
          {
            text: `Back`,
            icon: <ArrowLeftShort size={20} />,
            variant: 'outline-primary',
            onClick: () => router.push('/calibration-references/temperature-humidity/bath'),
          },
        ]}
        dropdownItems={[
          {
            label: 'View Bath',
            icon: Eye,
            onClick: () =>
              router.push(`/calibration-references/temperature-humidity/bath/view/${refId}`),
          },
        ]}
      />

      <Card className='shadow-sm'>
        <Card.Body>
          <BathForm data={bath} />
        </Card.Body>
      </Card>
    </>
  );
}

export default EditBath;

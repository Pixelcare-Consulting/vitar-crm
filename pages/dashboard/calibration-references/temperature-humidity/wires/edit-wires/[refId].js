import ContentHeader from '@/components/dashboard/ContentHeader';
import { db } from '@/firebase';
import WiresForm from '@/sub-components/dashboard/calibration-references/WiresForm';
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

function EditWires() {
  const router = useRouter();
  const { refId } = router.query;

  const [wires, setWires] = useState();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  //* query wires
  useEffect(() => {
    if (refId) {
      const wiresDocRef = doc(db, 'jobCalibrationReferences', 'CR000009', 'data', refId);

      getDoc(wiresDocRef)
        .then((doc) => {
          if (doc.exists()) {
            setWires({ id: doc.id, ...doc.data() });
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
          <Button onClick={() => router.push('/calibration-references/temperature-humidity/wires')}>
            Back to Wires List
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

  if (!wires) {
    return (
      <div
        className='d-flex justify-content-center align-items-center text-center py-5'
        style={{ height: '63vh' }}
      >
        <div>
          <h3>Reference Data not found</h3>
          <Link href='/calibration-references/temperature-humidity/wires'>
            <Button variant='primary' className='mt-3'>
              Back to Wires List
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <GeeksSEO title='Edit Wires - VITAR Group | Portal' />

      <ContentHeader
        title='Edit Wires'
        description='Edit wires information'
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
            link: '/calibration-references/temperature-humidity/wires',
            icon: <ListColumns className='me-2' size={14} />,
          },
          {
            text: 'Temperature & Humidity',
            link: '/calibration-references/temperature-humidity/wires',
            icon: <Thermometer className='me-2' size={14} />,
          },
          {
            text: 'Wires',
            link: '/calibration-references/temperature-humidity/wires',
            icon: <Table className='me-2' size={14} />,
          },
          ,
          {
            text: wires ? wires.id : 'Create',
            link: `/calibration-references/temperature-humidity/wires/edit-wires/${refId}`,
            icon: <PencilFill className='me-2' size={14} />,
          },
        ]}
        actionButtons={[
          {
            text: `Back`,
            icon: <ArrowLeftShort size={20} />,
            variant: 'outline-primary',
            onClick: () => router.push('/calibration-references/temperature-humidity/wires'),
          },
        ]}
        dropdownItems={[
          {
            label: 'View Wires',
            icon: Eye,
            onClick: () =>
              router.push(`/calibration-references/temperature-humidity/wires/view/${refId}`),
          },
        ]}
      />

      <Card className='shadow-sm'>
        <Card.Body>
          <WiresForm data={wires} />
        </Card.Body>
      </Card>
    </>
  );
}

export default EditWires;

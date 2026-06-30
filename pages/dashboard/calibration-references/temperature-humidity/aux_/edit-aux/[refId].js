import ContentHeader from '@/components/dashboard/ContentHeader';
import { db } from '@/firebase';
import AuxForm from '@/sub-components/dashboard/calibration-references/AuxForm';
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

function EditAux() {
  const router = useRouter();
  const { refId } = router.query;

  const [aux, setAux] = useState();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  //* query aux
  useEffect(() => {
    if (refId) {
      const auxDocRef = doc(db, 'jobCalibrationReferences', 'CR000010', 'data', refId);

      getDoc(auxDocRef)
        .then((doc) => {
          if (doc.exists()) {
            setAux({ id: doc.id, ...doc.data() });
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
          <Button onClick={() => router.push('/calibration-references/temperature-humidity/aux')}>
            Back to Aux List
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

  if (!aux) {
    return (
      <div
        className='d-flex justify-content-center align-items-center text-center py-5'
        style={{ height: '63vh' }}
      >
        <div>
          <h3>Reference Data not found</h3>
          <Link href='/calibration-references/temperature-humidity/aux'>
            <Button variant='primary' className='mt-3'>
              Back to Aux List
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <GeeksSEO title='Edit Aux - VITAR Group | Portal' />

      <ContentHeader
        title='Edit Aux'
        description='Edit aux information'
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
            link: '/calibration-references/temperature-humidity/aux',
            icon: <ListColumns className='me-2' size={14} />,
          },
          {
            text: 'Temperature & Humidity',
            link: '/calibration-references/temperature-humidity/aux',
            icon: <Thermometer className='me-2' size={14} />,
          },
          {
            text: 'Aux',
            link: '/calibration-references/temperature-humidity/aux',
            icon: <Table className='me-2' size={14} />,
          },
          ,
          {
            text: aux ? aux.id : 'Create',
            link: `/calibration-references/temperature-humidity/aux/edit-aux/${refId}`,
            icon: <PencilFill className='me-2' size={14} />,
          },
        ]}
        actionButtons={[
          {
            text: `Back`,
            icon: <ArrowLeftShort size={20} />,
            variant: 'outline-primary',
            onClick: () => router.push('/calibration-references/temperature-humidity/aux'),
          },
        ]}
        dropdownItems={[
          {
            label: 'View Aux',
            icon: Eye,
            onClick: () =>
              router.push(`/calibration-references/temperature-humidity/aux/view/${refId}`),
          },
        ]}
      />

      <Card className='shadow-sm'>
        <Card.Body>
          <AuxForm data={aux} />
        </Card.Body>
      </Card>
    </>
  );
}

export default EditAux;

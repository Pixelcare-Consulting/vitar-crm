import ContentHeader from '@/components/dashboard/ContentHeader';
import { db } from '@/firebase';
import { GeeksSEO } from '@/widgets';
import { format, isValid } from 'date-fns';
import { doc, getDoc } from 'firebase/firestore';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Button, Card, Spinner, Table } from 'react-bootstrap';
import {
  ArrowLeftShort,
  EyeFill,
  HouseDoorFill,
  ListColumns,
  PencilSquare,
  Table as TableIcon,
  Thermometer,
} from 'react-bootstrap-icons';

const CmcDetails = () => {
  const router = useRouter();
  const { refId } = router.query;

  const [cmc, setCmc] = useState();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  //* query cmc
  useEffect(() => {
    if (refId) {
      const cmcDocRef = doc(db, 'jobCalibrationReferences', 'CR000019', 'data', refId);

      getDoc(cmcDocRef)
        .then((doc) => {
          if (doc.exists()) {
            setCmc({ id: doc.id, ...doc.data() });
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
          <Button onClick={() => router.push('/calibration-references/temperature-humidity/cmc')}>
            Back to CMC List
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

  if (!cmc) {
    return (
      <div
        className='d-flex justify-content-center align-items-center text-center py-5'
        style={{ height: '63vh' }}
      >
        <div>
          <h3>Reference Data not found</h3>
          <Link href='/calibration-references/temperature-humidity/cmc'>
            <Button variant='primary' className='mt-3'>
              Back to CMC List
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <GeeksSEO title={`View Details for CMC #${cmc.id} - VITAR Group | Portal`} />

      <ContentHeader
        title={`View Details for CMC #${cmc.id}`}
        description='View comprehensive details of reference data'
        badgeText='Calibration References Data Management'
        badgeText2='View Reference Data'
        breadcrumbItems={[
          {
            text: 'Dashboard',
            link: '/',
            icon: <HouseDoorFill className='me-2' style={{ fontSize: '14px' }} />,
          },
          {
            text: 'Calibration References',
            link: '/calibration-references/temperature-humidity/cmc',
            icon: <ListColumns className='me-2' size={14} />,
          },
          {
            text: 'Temperature & Humidity',
            link: '/calibration-references/temperature-humidity/cmc',
            icon: <Thermometer className='me-2' size={14} />,
          },
          {
            text: 'CMC',
            link: '/calibration-references/temperature-humidity/cmc',
            icon: <TableIcon className='me-2' size={14} />,
          },
          ,
          {
            text: refId,
            icon: <EyeFill className='me-2' size={14} />,
          },
        ]}
        actionButtons={[
          {
            text: `Back`,
            icon: <ArrowLeftShort size={20} />,
            variant: 'outline-primary',
            onClick: () => router.push('/calibration-references/temperature-humidity/cmc'),
          },
        ]}
        dropdownItems={[
          {
            label: 'Edit CMC',
            icon: PencilSquare,
            onClick: () =>
              router.push(`/calibration-references/temperature-humidity/cmc/edit-cmc/${refId}`),
          },
        ]}
      />

      <Card>
        <Card.Body>
          <Card.Header className='bg-transparent border-0 pb-0'>
            <div className='d-flex justify-content-between align-items-center'>
              <div>
                <h4 className='mb-0'>CMC</h4>
                <p className='text-muted fs-6 mb-0'>Details about the reference data.</p>
              </div>
            </div>
          </Card.Header>

          <Card.Body>
            <Table
              className='w-75 mx-auto text-center fs-6 align-middle mt-3 mb-5'
              bordered
              responsive
            >
              <tbody>
                <tr>
                  <th>Reference ID</th>
                  <td colSpan={5}>{cmc?.refId || ''}</td>
                </tr>
                <tr>
                  <th>Description</th>
                  <td colSpan={5}>{cmc?.description || ''}</td>
                </tr>
                <tr>
                  <th>Type</th>
                  <td colSpan={5}>{cmc?.type || ''}</td>
                </tr>
                <tr>
                  <th>No.</th>
                  <td colSpan={5}>{cmc?.no || ''}</td>
                </tr>
                <tr>
                  <th>Location</th>
                  <td className='text-capitalize' colSpan={5}>
                    {cmc?.location || ''}
                  </td>
                </tr>
                <tr>
                  <th>Min</th>
                  <td colSpan={5}>{cmc?.min || ''}</td>
                </tr>
                <tr>
                  <th>Max</th>
                  <td colSpan={5}>{cmc?.max || ''}</td>
                </tr>
                <tr>
                  <th>Uncertainty</th>
                  <td colSpan={5}>{cmc?.uncer || ''}</td>
                </tr>

                <tr>
                  <th>Date</th>
                  <td colSpan={5}>
                    {cmc?.createdAt ? format(cmc?.createdAt.toDate(), 'dd-MM-yyyy') : 'N/A'}
                  </td>
                </tr>

                <tr>
                  <th>Created By</th>
                  <td colSpan={5}>{cmc?.createdBy?.displayName || 'N/A'}</td>
                </tr>

                <tr>
                  <th>Last Updated</th>
                  <td colSpan={5}>
                    {cmc?.updatedAt ? format(cmc?.updatedAt.toDate(), 'dd-MM-yyyy') : 'N/A'}
                  </td>
                </tr>

                <tr>
                  <th>Updated By</th>
                  <td colSpan={5}>{cmc?.updatedBy?.displayName || 'N/A'}</td>
                </tr>
              </tbody>
            </Table>
          </Card.Body>
        </Card.Body>
      </Card>
    </>
  );
};

export default CmcDetails;

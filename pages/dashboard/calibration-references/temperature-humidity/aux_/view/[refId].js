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
  BoxSeamFill,
  Eye,
  EyeFill,
  HouseDoorFill,
  ListColumns,
  PencilSquare,
  Table as TableIcon,
  Thermometer,
} from 'react-bootstrap-icons';

const AuxDetails = () => {
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
      <GeeksSEO title={`View Details for Aux #${aux.id} - VITAR Group | Portal`} />

      <ContentHeader
        title={`View Details for Aux #${aux.id}`}
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
            onClick: () => router.push('/calibration-references/temperature-humidity/aux'),
          },
        ]}
        dropdownItems={[
          {
            label: 'Edit Aux',
            icon: PencilSquare,
            onClick: () =>
              router.push(`/calibration-references/temperature-humidity/aux/edit-aux/${refId}`),
          },
        ]}
      />

      <Card>
        <Card.Body>
          <Card.Header className='bg-transparent border-0 pb-0'>
            <div className='d-flex justify-content-between align-items-center'>
              <div>
                <h4 className='mb-0'>Aux</h4>
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
                  <td colSpan={5}>{aux?.refId || ''}</td>
                </tr>
                <tr>
                  <th>ID Code</th>
                  <td colSpan={5}>{aux?.idCode || ''}</td>
                </tr>
                <tr>
                  <th>Type</th>
                  <td colSpan={5}>{aux?.type || ''}</td>
                </tr>
                <tr>
                  <th>Serial No.</th>
                  <td colSpan={5}>{aux?.serialNumber || ''}</td>
                </tr>
                <tr>
                  <th>Traceable</th>
                  <td colSpan={5}>{aux?.traceable || ''}</td>
                </tr>
                <tr>
                  <th>COC No.</th>
                  <td colSpan={5}>{aux?.cocNo || ''}</td>
                </tr>
                <tr>
                  <th>K Factor</th>
                  <td colSpan={5}>{aux?.kFactor || ''}</td>
                </tr>
                <tr>
                  <th>Due Date</th>
                  <td colSpan={5}>
                    {aux?.dueDate && isValid(new Date(aux?.dueDate))
                      ? format(aux?.dueDate, 'dd-MM-yyyy')
                      : 'N/A'}
                  </td>
                </tr>

                <tr>
                  <th>Date</th>
                  <td colSpan={5}>
                    {aux?.createdAt ? format(aux?.createdAt.toDate(), 'dd-MM-yyyy') : 'N/A'}
                  </td>
                </tr>

                <tr>
                  <th>Created By</th>
                  <td colSpan={5}>{aux?.createdBy?.displayName || 'N/A'}</td>
                </tr>

                <tr>
                  <th>Last Updated</th>
                  <td colSpan={5}>
                    {aux?.updatedAt ? format(aux?.updatedAt.toDate(), 'dd-MM-yyyy') : 'N/A'}
                  </td>
                </tr>

                <tr>
                  <th>Updated By</th>
                  <td colSpan={5}>{aux?.updatedBy?.displayName || 'N/A'}</td>
                </tr>
              </tbody>
            </Table>
          </Card.Body>
        </Card.Body>
      </Card>
    </>
  );
};

export default AuxDetails;

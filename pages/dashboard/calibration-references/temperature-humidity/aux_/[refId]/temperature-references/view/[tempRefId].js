import ContentHeader from '@/components/dashboard/ContentHeader';
import { db } from '@/firebase';
import { GeeksSEO } from '@/widgets';
import { format } from 'date-fns';
import { doc, getDoc } from 'firebase/firestore';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Button, Card, Spinner, Table } from 'react-bootstrap';
import {
  ArrowLeftShort,
  EyeFill,
  Hash,
  HouseDoorFill,
  ListColumns,
  PencilSquare,
  Table as TableIcon,
  Thermometer,
} from 'react-bootstrap-icons';

const AuxTemperatureRefDetails = () => {
  const router = useRouter();
  const { refId, tempRefId } = router.query;

  const [auxTempRef, setAuxTempRef] = useState();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  //* query aux
  useEffect(() => {
    if (refId && tempRefId) {
      const auxTempRefDocRef = doc(
        db,
        'jobCalibrationReferences',
        'CR000010',
        'data',
        refId,
        'temperatureRefs',
        tempRefId
      );

      getDoc(auxTempRefDocRef)
        .then((doc) => {
          if (doc.exists()) {
            setAuxTempRef({ id: doc.id, ...doc.data() });
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
                `/calibration-references/temperature-humidity/aux/${refId}/temperature-references`
              )
            }
          >
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

  if (!auxTempRef) {
    return (
      <div
        className='d-flex justify-content-center align-items-center text-center py-5'
        style={{ height: '63vh' }}
      >
        <div>
          <h3>Reference Data not found</h3>
          <Link
            href={`/calibration-references/temperature-humidity/aux/${refId}/temperature-references`}
          >
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
      <GeeksSEO title={`View Details for Aux #${auxTempRef.id} - VITAR Group | Portal`} />

      <ContentHeader
        title={`View Details for Aux #${auxTempRef.id}`}
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
            link: `/calibration-references/temperature-humidity/aux/${refId}/temperature-references`,
            icon: <Hash className='me-2' size={14} />,
          },
          {
            text: 'Temperature References',
            link: `/calibration-references/temperature-humidity/aux/${refId}/temperature-references`,
            icon: <TableIcon className='me-2' size={14} />,
          },
          {
            text: tempRefId,
            icon: <EyeFill className='me-2' size={14} />,
          },
        ]}
        actionButtons={[
          {
            text: `Back`,
            icon: <ArrowLeftShort size={20} />,
            variant: 'outline-primary',
            onClick: () =>
              router.push(
                `/calibration-references/temperature-humidity/aux/${refId}/temperature-references`
              ),
          },
        ]}
        dropdownItems={[
          {
            label: 'Edit Temperature Ref',
            icon: PencilSquare,
            onClick: () =>
              router.push(
                `/calibration-references/temperature-humidity/aux/${refId}/temperature-references/edit-temperature-references/${tempRefId}`
              ),
          },
        ]}
      />

      <Card>
        <Card.Body>
          <Card.Header className='bg-transparent border-0 pb-0'>
            <div className='d-flex justify-content-between align-items-center'>
              <div>
                <h4 className='mb-0'>Aux's Temperature Reference</h4>
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
                  <th>Temperature Reference ID</th>
                  <td colSpan={5}>{auxTempRef?.tempRefId || ''}</td>
                </tr>
                <tr>
                  <th>Reference</th>
                  <td colSpan={5}>{auxTempRef?.reference || ''}</td>
                </tr>
                <tr>
                  <th>Test</th>
                  <td colSpan={5}>{auxTempRef?.test || ''}</td>
                </tr>
                <tr>
                  <th>Correction</th>
                  <td colSpan={5}>{auxTempRef?.correction || ''}</td>
                </tr>
                <tr>
                  <th>Uncer</th>
                  <td colSpan={5}>{auxTempRef?.uncer || ''}</td>
                </tr>
                <tr>
                  <th>Drift</th>
                  <td colSpan={5}>{auxTempRef?.drift || ''}</td>
                </tr>

                <tr>
                  <th>Date</th>
                  <td colSpan={5}>
                    {auxTempRef?.createdAt
                      ? format(auxTempRef?.createdAt.toDate(), 'dd-MM-yyyy')
                      : 'N/A'}
                  </td>
                </tr>

                <tr>
                  <th>Created By</th>
                  <td colSpan={5}>{auxTempRef?.createdBy?.displayName || 'N/A'}</td>
                </tr>

                <tr>
                  <th>Last Updated</th>
                  <td colSpan={5}>
                    {auxTempRef?.updatedAt
                      ? format(auxTempRef?.updatedAt.toDate(), 'dd-MM-yyyy')
                      : 'N/A'}
                  </td>
                </tr>

                <tr>
                  <th>Updated By</th>
                  <td colSpan={5}>{auxTempRef?.updatedBy?.displayName || 'N/A'}</td>
                </tr>
              </tbody>
            </Table>
          </Card.Body>
        </Card.Body>
      </Card>
    </>
  );
};

export default AuxTemperatureRefDetails;

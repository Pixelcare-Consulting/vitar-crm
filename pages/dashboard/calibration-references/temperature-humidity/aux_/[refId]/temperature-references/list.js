import DataTable from '@/components/common/DataTable';
import DataTableColumnHeader from '@/components/common/DataTableColumnHeader';
import DataTableFilter from '@/components/common/DataTableFilter';
import DataTableSearch from '@/components/common/DataTableSearch';
import DataTableViewOptions from '@/components/common/DataTableViewOptions';
import ContentHeader from '@/components/dashboard/ContentHeader';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/firebase';
import { globalSearchFilter } from '@/utils/datatable';
import { GeeksSEO } from '@/widgets';
import {
  createColumnHelper,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { collection, deleteDoc, doc, getDoc, onSnapshot, query } from 'firebase/firestore';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import { Button, Card, Dropdown, OverlayTrigger, Spinner } from 'react-bootstrap';
import {
  Eye,
  HouseDoorFill,
  ListColumns,
  PencilSquare,
  Plus,
  ThreeDotsVertical,
  Trash,
  Table,
  Thermometer,
  Hash,
} from 'react-bootstrap-icons';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

const AuxTemperatureReferencesList = () => {
  const router = useRouter();
  const auth = useAuth();
  const { refId } = router.query;

  const [aux, setAux] = useState({ data: [], isLoading: true, isError: false });
  const [auxTempRefs, setAuxTempRefs] = useState({ data: [], isLoading: true, isError: false });

  const columnHelper = createColumnHelper();

  const columns = useMemo(() => {
    return [
      columnHelper.accessor('index', {
        id: 'index',
        header: ({ column }) => <DataTableColumnHeader column={column} title='#' />,
        enableSorting: false,
        size: 50,
        cell: ({ row, table }) => (
          <div>
            {(table.getSortedRowModel()?.flatRows?.findIndex((flatRow) => flatRow.id === row.id) ||
              0) + 1}
          </div>
        ),
      }),
      columnHelper.accessor('reference', {
        header: ({ column }) => <DataTableColumnHeader column={column} title='Reference' />,
      }),
      columnHelper.accessor('test', {
        header: ({ column }) => <DataTableColumnHeader column={column} title='Test' />,
      }),
      columnHelper.accessor('correction', {
        header: ({ column }) => <DataTableColumnHeader column={column} title='Correction' />,
      }),
      columnHelper.accessor('uncer', {
        header: ({ column }) => <DataTableColumnHeader column={column} title='Uncer' />,
      }),
      columnHelper.accessor('drift', {
        header: ({ column }) => <DataTableColumnHeader column={column} title='Drift' />,
      }),
      columnHelper.accessor('actions', {
        id: 'actions',
        size: 50,
        header: ({ column }) => <DataTableColumnHeader column={column} title='Actions' />,
        cell: ({ row }) => {
          const [isLoading, setIsLoading] = useState(false);

          const { id } = row.original;

          const handleViewData = (id) => {
            router.push(`/calibration-references/temperature-humidity/aux/${refId}/temperature-references/view/${id}`); // prettier-ignore
          };

          const handleEditData = (id) => {
            router.push(`/calibration-references/temperature-humidity/aux/${refId}/temperature-references/edit-temperature-references/${id}`); // prettier-ignore
          };

          const handleDeleteData = (id) => {
            Swal.fire({
              title: 'Are you sure?',
              text: 'This action cannot be undone.',
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

                  const auxTemperatureRefDocRef = doc(
                    db,
                    'jobCalibrationReferences',
                    'CR000010',
                    'data',
                    refId,
                    'temperatureRefs',
                    id
                  );

                  await deleteDoc(auxTemperatureRefDocRef);

                  toast.success('Refence data removed successfully', { position: 'top-right' });
                  setIsLoading(false);
                } catch (error) {
                  console.error('Error removing refence data:', error);
                  toast.error('Error removing refence data: ' + error.message, {
                    position: 'top-right',
                  });
                  setIsLoading(false);
                }
              }
            });
          };

          return (
            <OverlayTrigger
              rootClose
              trigger='click'
              placement='left'
              offset={[0, 20]}
              overlay={
                <Dropdown.Menu show style={{ zIndex: 999 }}>
                  <Dropdown.Item onClick={() => handleViewData(id)}>
                    <Eye className='me-2' size={16} />
                    View Data
                  </Dropdown.Item>
                  <Dropdown.Item onClick={() => handleEditData(id)}>
                    <PencilSquare className='me-2' size={16} />
                    Edit Data
                  </Dropdown.Item>
                  <Dropdown.Item onClick={() => handleDeleteData(id)}>
                    <Trash className='me-2' size={16} />
                    Delete Data
                  </Dropdown.Item>
                </Dropdown.Menu>
              }
            >
              <Button variant='light' className='p-2' size='sm'>
                {isLoading ? (
                  <Spinner animation='border' size='sm' />
                ) : (
                  <ThreeDotsVertical size={16} />
                )}
              </Button>
            </OverlayTrigger>
          );
        },
      }),
    ];
  }, []);

  const filterFields = useMemo(() => {
    return [
      {
        label: 'Reference',
        columnId: 'reference',
        type: 'text',
        placeholder: 'Search by reference...',
      },
      {
        label: 'Test',
        columnId: 'test',
        type: 'text',
        placeholder: 'Search by test...',
      },
      {
        label: 'Correction',
        columnId: 'correction',
        type: 'text',
        placeholder: 'Search by correction...',
      },
      {
        label: 'Uncer',
        columnId: 'uncer',
        type: 'text',
        placeholder: 'Search by uncer..',
      },
      {
        label: 'Drift',
        columnId: 'drift',
        type: 'text',
        placeholder: 'Search by drift...',
      },
    ];
  }, []);

  const table = useReactTable({
    data: auxTempRefs.data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    filterFns: { globalSearch: globalSearchFilter },
    globalFilterFn: 'globalSearch',
    initialState: {
      columnPinning: { right: ['actions'] },
    },
  });

  useEffect(() => {
    if (!refId) return;

    const q = query(
      collection(db, 'jobCalibrationReferences', 'CR000010', 'data', refId, 'temperatureRefs')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          setAuxTempRefs({
            data: snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            })),
            isLoading: false,
            isError: false,
          });

          return;
        }

        setAuxTempRefs({ data: [], isLoading: false, isError: false });
      },
      (err) => {
        console.error(err.message);
        setAuxTempRefs({ data: [], isLoading: false, isError: true });
      }
    );

    return () => unsubscribe();
  }, [refId]);

  //* query aux record
  useEffect(() => {
    if (!refId) return;

    if (refId) {
      const auxDocRef = doc(db, 'jobCalibrationReferences', 'CR000010', 'data', refId);

      getDoc(auxDocRef)
        .then((doc) => {
          if (doc.exists()) {
            setAux({ data: { id: doc.id, ...doc.data() }, isLoading: false, isError: false });
          } else {
            console.error('Aux Data not found');
            setAux({ data: null, isLoading: false, isError: true });
          }
        })
        .catch((err) => {
          console.error(err.message);
          setAux({ data: null, isLoading: false, isError: true });
        });
    }
  }, [refId]);

  return (
    <>
      <GeeksSEO
        title={`Aux's${
          aux?.data?.idCode ? ` (${aux.data?.idCode})` : ''
        } Temperature References - VITAR Group | Portal`}
      />

      <ContentHeader
        title={`Aux's ${aux?.data?.idCode ? ` (${aux.data?.idCode})` : ''} Temperature References`}
        description='Create, manage all your calibration references in one centralize dashboard'
        badgeText='Calibration References Data Management'
        badgeText2='Listing'
        breadcrumbItems={[
          {
            text: 'Dashboard',
            link: '/',
            icon: <HouseDoorFill className='me-2' style={{ fontSize: '14px' }} />,
          },

          {
            text: 'Calibration References',
            link: '/#',
            icon: <ListColumns className='me-2' size={14} />,
          },
          {
            text: 'Temperature & Humidity',
            link: '/#',
            icon: <Thermometer className='me-2' size={14} />,
          },
          {
            text: 'Aux',
            link: '/calibration-references/temperature-humidity/aux',
            icon: <Table className='me-2' size={14} />,
          },
          {
            text: refId,
            link: `/calibration-references/temperature-humidity/aux/${refId}/temperature-references`,
            icon: <Hash className='me-2' size={14} />,
          },
          {
            text: 'Temperature References',
            link: `/calibration-references/temperature-humidity/aux/${refId}/temperature-references`,
            icon: <Table className='me-2' size={14} />,
          },
        ]}
        actionButtons={[
          {
            text: 'Back',
            icon: <Plus size={20} />,
            variant: 'outline-primary',
            onClick: () => router.push(`/calibration-references/temperature-humidity/aux`),
          },
          {
            text: 'Add Temperature Ref',
            icon: <Plus size={20} />,
            variant: 'light',
            onClick: () =>
              router.push(
                `/calibration-references/temperature-humidity/aux/${refId}/temperature-references/create`
              ),
          },
        ]}
      />

      <Card className='border-0 shadow-none'>
        <Card.Body className='p-4'>
          <DataTable table={table} isLoading={auxTempRefs.isLoading} isError={auxTempRefs.isError}>
            <div className='d-flex flex-column row-gap-3 flex-lg-row justify-content-lg-between'>
              <DataTableSearch table={table} />

              <div className='d-flex align-items-center gap-2'>
                <DataTableFilter table={table} filterFields={filterFields} />
                <DataTableViewOptions table={table} />
              </div>
            </div>
          </DataTable>
        </Card.Body>
      </Card>
    </>
  );
};

export default AuxTemperatureReferencesList;

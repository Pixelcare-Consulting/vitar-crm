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
import { collection, deleteDoc, doc, onSnapshot, query } from 'firebase/firestore';
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
  ListUl,
} from 'react-bootstrap-icons';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

const BathStabilityUniformityList = () => {
  const router = useRouter();
  const auth = useAuth();

  const [bathStabilityUniformity, setBathStabilityUniformity] = useState({
    data: [],
    isLoading: true,
    isError: false,
  });

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
      columnHelper.accessor('code', {
        header: ({ column }) => <DataTableColumnHeader column={column} title='Code' />,
      }),
      columnHelper.accessor('stabilityDCelsius', {
        header: ({ column }) => <DataTableColumnHeader column={column} title='Stability (°C)' />,
      }),
      columnHelper.accessor('stabilityPercentRHumidity', {
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='Stability (% r.h.)' />
        ),
      }),
      columnHelper.accessor('uniformityDCelsius', {
        header: ({ column }) => <DataTableColumnHeader column={column} title='Uniformity (°C)' />,
      }),
      columnHelper.accessor('dueDate', {
        header: ({ column }) => <DataTableColumnHeader column={column} title='Due Date' />,
      }),
      columnHelper.accessor('actions', {
        id: 'actions',
        size: 50,
        header: ({ column }) => <DataTableColumnHeader column={column} title='Actions' />,
        cell: ({ row }) => {
          const [isLoading, setIsLoading] = useState(false);

          const { id } = row.original;

          const handleViewData = (id) => {
            router.push(
              `/calibration-references/temperature-humidity/bath/stability-uniformity/view/${id}`
            );
          };

          const handleEditData = (id) => {
            router.push(
              `/calibration-references/temperature-humidity/bath/stability-uniformity/edit-stability-uniformity/${id}`
            );
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

                  const bathStabilityUniformityDocRef = doc(
                    db,
                    'jobCalibrationReferences',
                    'CR000013',
                    'data',
                    id
                  );

                  await deleteDoc(bathStabilityUniformityDocRef);

                  toast.success('Refence data removed successfully', {
                    position: 'top-right',
                  });
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
        label: 'Code',
        columnId: 'code',
        type: 'text',
        placeholder: 'Search by code...',
      },
      {
        label: 'Stability (°C)',
        columnId: 'stabilityDCelsius',
        type: 'text',
        placeholder: 'Search by stability (°c)...',
      },
      {
        label: 'Stability (% r.h.)',
        columnId: 'stabilityPercentRHumidity',
        placeholder: 'Search by stability (% r.h.)...',
      },
      {
        label: 'Uniformity (°C)',
        columnId: 'uniformityDCelsius',
        type: 'text',
        placeholder: 'Search by uniformity (°c)...',
      },
    ];
  }, []);

  const table = useReactTable({
    data: bathStabilityUniformity.data,
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
    const q = query(collection(db, 'jobCalibrationReferences', 'CR000013', 'data'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          setBathStabilityUniformity({
            data: snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            })),
            isLoading: false,
            isError: false,
          });

          return;
        }

        setBathStabilityUniformity({ data: [], isLoading: false, isError: false });
      },
      (err) => {
        console.error(err.message);
        setBathStabilityUniformity({ data: [], isLoading: false, isError: true });
      }
    );

    return () => unsubscribe();
  }, []);

  return (
    <>
      <GeeksSEO title='Bath Stability/Uniformity - VITAR Group | Portal' />

      <ContentHeader
        title='Bath Stability/Uniformity'
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
            text: 'Bath Stability/Uniformity',
            link: '/calibration-references/temperature-humidity/bath/stability-uniformity',
            icon: <Table className='me-2' size={14} />,
          },
        ]}
        actionButtons={[
          {
            text: 'Add Data',
            icon: <Plus size={20} />,
            variant: 'light',
            onClick: () =>
              router.push(
                '/calibration-references/temperature-humidity/bath/stability-uniformity/create'
              ),
          },
        ]}
      />

      <Card className='border-0 shadow-none'>
        <Card.Body className='p-4'>
          <DataTable
            table={table}
            isLoading={bathStabilityUniformity.isLoading}
            isError={bathStabilityUniformity.isError}
          >
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

export default BathStabilityUniformityList;

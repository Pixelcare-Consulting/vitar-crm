import DataTable from '@/components/common/DataTable';
import DataTableColumnHeader from '@/components/common/DataTableColumnHeader';
import DataTableFilter from '@/components/common/DataTableFilter';
import DataTableSearch from '@/components/common/DataTableSearch';
import DataTableViewOptions from '@/components/common/DataTableViewOptions';
import ContentHeader from '@/components/dashboard/ContentHeader';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/firebase';
import { SCOPE_TYPE } from '@/schema/job';
import { titleCase } from '@/utils/common';
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
import { Badge, Button, Card, Dropdown, OverlayTrigger, Spinner } from 'react-bootstrap';
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

const SpecialList = () => {
  const router = useRouter();
  const auth = useAuth();

  const [special, setSpecial] = useState({
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
      columnHelper.accessor('idCode', {
        header: ({ column }) => <DataTableColumnHeader column={column} title='ID Code' />,
      }),
      columnHelper.accessor('serialNo', {
        header: ({ column }) => <DataTableColumnHeader column={column} title='Serial No.' />,
      }),
      columnHelper.accessor('cocNo', {
        header: ({ column }) => <DataTableColumnHeader column={column} title='COC No.' />,
      }),
      columnHelper.accessor('traceable', {
        header: ({ column }) => <DataTableColumnHeader column={column} title='Traceable' />,
      }),
      columnHelper.accessor('uncer', {
        header: ({ column }) => <DataTableColumnHeader column={column} title='Uncertainty' />,
      }),
      columnHelper.accessor((row) => row?.ranges?.length ?? 0, {
        id: 'ranges',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Ranges' />,
        cell: ({ row }) => {
          const { ranges } = row.original;

          return (
            <Badge className='me-2' bg='primary'>
              {ranges?.length ?? 0}
            </Badge>
          );
        },
      }),

      columnHelper.accessor('actions', {
        id: 'actions',
        size: 50,
        header: ({ column }) => <DataTableColumnHeader column={column} title='Actions' />,
        cell: ({ row }) => {
          const [isLoading, setIsLoading] = useState(false);

          const { id } = row.original;

          const handleViewData = (id) => {
            router.push(`/calibration-references/temperature-humidity/special/view/${id}`);
          };

          const handleEditData = (id) => {
            router.push(`/calibration-references/temperature-humidity/special/edit-special/${id}`);
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

                  const specialDocRef = doc(db, 'jobCalibrationReferences', 'CR000020', 'data', id);

                  await deleteDoc(specialDocRef);

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
        label: 'ID Code',
        columnId: 'uncer',
        type: 'text',
        placeholder: 'Search by id code...',
      },
      {
        label: 'Serial No.',
        columnId: 'serialNo',
        type: 'text',
        placeholder: 'Search by serial no...',
      },
      {
        label: 'COC No.',
        columnId: 'cocNo',
        type: 'text',
        placeholder: 'Search by coc no...',
      },
      {
        label: 'Traceable',
        columnId: 'traceable',
        type: 'text',
        placeholder: 'Search by traceable...',
      },
      {
        label: 'uncertainty',
        columnId: 'uncer',
        type: 'text',
        placeholder: 'Search by uncertainty...',
      },
    ];
  }, []);

  const table = useReactTable({
    data: special.data,
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
    const q = query(collection(db, 'jobCalibrationReferences', 'CR000020', 'data'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          setSpecial({
            data: snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            })),
            isLoading: false,
            isError: false,
          });

          return;
        }

        setSpecial({ data: [], isLoading: false, isError: false });
      },
      (err) => {
        console.error(err.message);
        setSpecial({ data: [], isLoading: false, isError: true });
      }
    );

    return () => unsubscribe();
  }, []);

  return (
    <>
      <GeeksSEO title='Special - VITAR Group | Portal' />

      <ContentHeader
        title='Special'
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
            text: 'Special',
            link: '/calibration-references/temperature-humidity/special',
            icon: <Table className='me-2' size={14} />,
          },
        ]}
        actionButtons={[
          {
            text: 'Add Data',
            icon: <Plus size={20} />,
            variant: 'light',
            onClick: () =>
              router.push('/calibration-references/temperature-humidity/special/create'),
          },
        ]}
      />

      <Card className='border-0 shadow-none'>
        <Card.Body className='p-4'>
          <DataTable table={table} isLoading={special.isLoading} isError={special.isError}>
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

export default SpecialList;

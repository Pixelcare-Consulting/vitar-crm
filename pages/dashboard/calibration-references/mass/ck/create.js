import ContentHeader from '@/components/dashboard/ContentHeader';
import CkForm from '@/sub-components/dashboard/calibration-references/CkForm';
import { GeeksSEO } from '@/widgets';
import { useRouter } from 'next/router';
import { Card } from 'react-bootstrap';
import {
  ArrowLeftShort,
  BoxSeam,
  BoxSeamFill,
  HouseDoorFill,
  ListColumns,
  Plus,
  PlusCircleFill,
  Table,
} from 'react-bootstrap-icons';

const CreateCk = () => {
  const router = useRouter();

  return (
    <>
      <GeeksSEO title='Create CK - VITAR Group | Portal' />

      <ContentHeader
        title='Create CK'
        description='Create CK reference data for your calibration'
        badgeText='Calibration References Data Management'
        badgeText2='New Reference Data'
        breadcrumbItems={[
          {
            text: 'Dashboard',
            link: '/',
            icon: <HouseDoorFill className='me-2' style={{ fontSize: '14px' }} />,
          },
          {
            text: 'Calibration References',
            link: '/calibration-references/mass/ck',
            icon: <ListColumns className='me-2' size={14} />,
          },
          {
            text: 'Mass',
            link: '/calibration-references/mass/ck',
            icon: <BoxSeamFill className='me-2' size={14} />,
          },
          {
            text: 'CK',
            link: '/calibration-references/mass/ck',
            icon: <Table className='me-2' size={14} />,
          },
          ,
          {
            text: 'Create CK',
            link: '/calibration-references/mass/ck/create',
            icon: <PlusCircleFill className='me-2' size={14} />,
          },
        ]}
        actionButtons={[
          {
            text: `Back`,
            icon: <ArrowLeftShort size={20} />,
            variant: 'outline-primary',
            onClick: () => router.push('/calibration-references/mass/ck'),
          },
        ]}
      />

      <Card className='shadow-sm'>
        <Card.Body>
          <CkForm jobCalibrationRefId='CR000003' path='mass' />
        </Card.Body>
      </Card>
    </>
  );
};

export default CreateCk;

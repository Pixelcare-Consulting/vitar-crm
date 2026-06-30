import ContentHeader from '@/components/dashboard/ContentHeader';
import BathStabilityForm from '@/sub-components/dashboard/calibration-references/BathStabilityForm';
import { GeeksSEO } from '@/widgets';
import { useRouter } from 'next/router';
import { Card } from 'react-bootstrap';
import {
  ArrowLeftShort,
  HouseDoorFill,
  ListColumns,
  PlusCircleFill,
  Table,
  Thermometer,
} from 'react-bootstrap-icons';

const CreateBathStability = () => {
  const router = useRouter();

  return (
    <>
      <GeeksSEO title='Create Bath Stability - VITAR Group | Portal' />

      <ContentHeader
        title='Create Bath Stability'
        description='Create bath stability data for your calibration'
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
            link: '/calibration-references/temperature-humidity/bath/stability',
            icon: <ListColumns className='me-2' size={14} />,
          },
          {
            text: 'Temperature & Humidity',
            link: '/calibration-references/temperature-humidity/bath/stability',
            icon: <Thermometer className='me-2' size={14} />,
          },
          {
            text: 'Bath Stability',
            link: '/calibration-references/temperature-humidity/bath/stability',
            icon: <Table className='me-2' size={14} />,
          },
          ,
          {
            text: 'Create Bath Stability',
            link: '/calibration-references/temperature-humidity/bath/stability/create',
            icon: <PlusCircleFill className='me-2' size={14} />,
          },
        ]}
        actionButtons={[
          {
            text: `Back`,
            icon: <ArrowLeftShort size={20} />,
            variant: 'outline-primary',
            onClick: () =>
              router.push('/calibration-references/temperature-humidity/bath/stability'),
          },
        ]}
      />

      <Card className='shadow-sm'>
        <Card.Body>
          <BathStabilityForm />
        </Card.Body>
      </Card>
    </>
  );
};

export default CreateBathStability;

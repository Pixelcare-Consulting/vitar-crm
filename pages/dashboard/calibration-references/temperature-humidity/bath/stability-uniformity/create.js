import ContentHeader from '@/components/dashboard/ContentHeader';
import BathStabilityUniformityForm from '@/sub-components/dashboard/calibration-references/BathStablityUniformityForm';
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

const CreateBathStabilityUniformity = () => {
  const router = useRouter();

  return (
    <>
      <GeeksSEO title='Create Bath Stability/Uniformity - VITAR Group | Portal' />

      <ContentHeader
        title='Create Bath Stability/niformity'
        description='Create bath stability/uniformity data for your calibration'
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
            link: '/calibration-references/temperature-humidity/bath/stability-uniformity',
            icon: <ListColumns className='me-2' size={14} />,
          },
          {
            text: 'Temperature & Humidity',
            link: '/calibration-references/temperature-humidity/bath/stability-uniformity',
            icon: <Thermometer className='me-2' size={14} />,
          },
          {
            text: 'Bath Stability/Uniformity',
            link: '/calibration-references/temperature-humidity/bath/stability-uniformity',
            icon: <Table className='me-2' size={14} />,
          },
          ,
          {
            text: 'Create Bath Stability/Uniformity',
            link: '/calibration-references/temperature-humidity/bath/stability-uniformity/create',
            icon: <PlusCircleFill className='me-2' size={14} />,
          },
        ]}
        actionButtons={[
          {
            text: `Back`,
            icon: <ArrowLeftShort size={20} />,
            variant: 'outline-primary',
            onClick: () =>
              router.push('/calibration-references/temperature-humidity/bath/stability-uniformity'),
          },
        ]}
      />

      <Card className='shadow-sm'>
        <Card.Body>
          <BathStabilityUniformityForm />
        </Card.Body>
      </Card>
    </>
  );
};

export default CreateBathStabilityUniformity;

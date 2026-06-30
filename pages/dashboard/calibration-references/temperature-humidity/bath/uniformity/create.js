import ContentHeader from '@/components/dashboard/ContentHeader';
import BathUniformityForm from '@/sub-components/dashboard/calibration-references/BathUniformityForm';
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

const CreateUniformity = () => {
  const router = useRouter();

  return (
    <>
      <GeeksSEO title='Create Bath Uniformity - VITAR Group | Portal' />

      <ContentHeader
        title='Create Bath Uniformity'
        description='Create bath uniformity data for your calibration'
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
            link: '/calibration-references/temperature-humidity/bath/uniformity',
            icon: <ListColumns className='me-2' size={14} />,
          },
          {
            text: 'Temperature & Humidity',
            link: '/calibration-references/temperature-humidity/bath/uniformity',
            icon: <Thermometer className='me-2' size={14} />,
          },
          {
            text: 'Bath Uniformity',
            link: '/calibration-references/temperature-humidity/bath/uniformity',
            icon: <Table className='me-2' size={14} />,
          },
          ,
          {
            text: 'Create Bath Uniformity',
            link: '/calibration-references/temperature-humidity/bath/uniformity/create',
            icon: <PlusCircleFill className='me-2' size={14} />,
          },
        ]}
        actionButtons={[
          {
            text: `Back`,
            icon: <ArrowLeftShort size={20} />,
            variant: 'outline-primary',
            onClick: () =>
              router.push('/calibration-references/temperature-humidity/bath/uniformity'),
          },
        ]}
      />

      <Card className='shadow-sm'>
        <Card.Body>
          <BathUniformityForm />
        </Card.Body>
      </Card>
    </>
  );
};

export default CreateUniformity;

import ContentHeader from '@/components/dashboard/ContentHeader';
import SpecialForm from '@/sub-components/dashboard/calibration-references/SpecialForm';
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

const CreateSpecial = () => {
  const router = useRouter();

  return (
    <>
      <GeeksSEO title='Create Extension - VITAR Group | Portal' />

      <ContentHeader
        title='Create Special'
        description='Create extension data for your calibration'
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
            link: '/calibration-references/temperature-humidity/special',
            icon: <ListColumns className='me-2' size={14} />,
          },
          {
            text: 'Temperature & Humidity',
            link: '/calibration-references/temperature-humidity/special',
            icon: <Thermometer className='me-2' size={14} />,
          },
          {
            text: 'Special',
            link: '/calibration-references/temperature-humidity/special',
            icon: <Table className='me-2' size={14} />,
          },
          ,
          {
            text: 'Create Special',
            link: '/calibration-references/temperature-humidity/special/create',
            icon: <PlusCircleFill className='me-2' size={14} />,
          },
        ]}
        actionButtons={[
          {
            text: `Back`,
            icon: <ArrowLeftShort size={20} />,
            variant: 'outline-primary',
            onClick: () => router.push('/calibration-references/temperature-humidity/special'),
          },
        ]}
      />

      <Card className='shadow-sm'>
        <Card.Body>
          <SpecialForm />
        </Card.Body>
      </Card>
    </>
  );
};

export default CreateSpecial;

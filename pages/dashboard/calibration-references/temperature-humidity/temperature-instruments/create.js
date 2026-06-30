import ContentHeader from '@/components/dashboard/ContentHeader';
import TempInstrumentForm from '@/sub-components/dashboard/calibration-references/TempInstrumentForm';
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

const CreateTempInstrument = () => {
  const router = useRouter();

  return (
    <>
      <GeeksSEO title='Create Temperature Instrument - VITAR Group | Portal' />

      <ContentHeader
        title='Create Temperature Instrument'
        description='Create temperature instrument data for your calibration'
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
            link: '/calibration-references/temperature-humidity/temperature-instruments',
            icon: <ListColumns className='me-2' size={14} />,
          },
          {
            text: 'Temperature & Humidity',
            link: '/calibration-references/temperature-humidity/temperature-instruments',
            icon: <Thermometer className='me-2' size={14} />,
          },
          {
            text: 'Temperature Instruments',
            link: '/calibration-references/temperature-humidity/temperature-instruments',
            icon: <Table className='me-2' size={14} />,
          },
          ,
          {
            text: 'Create Temperature Instrument',
            link: '/calibration-references/temperature-humidity/temperature-instruments/create',
            icon: <PlusCircleFill className='me-2' size={14} />,
          },
        ]}
        actionButtons={[
          {
            text: `Back`,
            icon: <ArrowLeftShort size={20} />,
            variant: 'outline-primary',
            onClick: () =>
              router.push('/calibration-references/temperature-humidity/temperature-instruments'),
          },
        ]}
      />

      <Card className='shadow-sm'>
        <Card.Body>
          <TempInstrumentForm />
        </Card.Body>
      </Card>
    </>
  );
};

export default CreateTempInstrument;

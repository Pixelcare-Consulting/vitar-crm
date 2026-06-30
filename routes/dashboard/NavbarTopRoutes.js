import { v4 as uuid } from 'uuid';

export const getNavbarItems = (role) => {
  if (!role) return [];

  const roleBaseMenu = {
    admin: [
      {
        id: uuid(),
        menuitem: 'Dashboard',
        link: '/dashboard',
        icon: 'HouseDoorFill',
        children: [
          { id: uuid(), menuitem: 'Overview', link: '/dashboard', icon: 'HouseDoorFill' },
          // {
          //   id: uuid(),
          //   menuitem: 'Certificate Editor',
          //   icon: 'FileEarmarkBarGraphFill',
          //   link: '/reports',
          // },
        ],
        isAuthenticated: true,
      },
      {
        id: uuid(),
        menuitem: 'Customer Management',
        link: '/dashboard/master',
        icon: 'PersonFill',
        hasSubmenu: true,
        children: [
          {
            id: uuid(),
            header: true,
            header_text: 'CRM Management Menu',
          },
          {
            id: uuid(),
            menuitem: 'Customers',
            icon: 'PersonFill',
            link: '/customers',
            hasSubmenu: false,
          },
          {
            id: uuid(),
            menuitem: 'Sites',
            link: '/sites',
            icon: 'BuildingFill',
            hasSubmenu: true,
          },
        ],
      },
      {
        id: uuid(),
        menuitem: 'Vitar-Segatec',
        icon: 'GearFill',
        children: [
          {
            id: uuid(),
            header: true,
            header_text: 'Vitar-Segatec Management Menu',
          },
          {
            id: uuid(),
            menuitem: 'Technicians',
            link: '#',
            icon: 'PersonLinesFill',
            hasSubmenu: true,
            children: [
              {
                id: uuid(),
                menuitem: 'Technicians List',
                link: '/workers',
                icon: 'PersonLinesFill',
              },
              {
                id: uuid(),
                menuitem: 'Schedule',
                link: '/schedule',
                icon: 'CalendarWeekFill',
              },
            ],
          },

          {
            id: uuid(),
            menuitem: 'Calendar',
            link: '/jobs/calendar',
            icon: 'CalendarWeekFill',
          },
          {
            id: uuid(),
            menuitem: 'Job Request',
            link: '/job-requests',
            icon: 'EnvelopePaperFill',
          },
          {
            id: uuid(),
            menuitem: 'Jobs',
            link: '/jobs',
            icon: 'BriefcaseFill',
          },
          {
            id: uuid(),
            menuitem: 'Job CN',
            link: '/job-cns',
            icon: 'ChatDotsFill',
          },
          {
            id: uuid(),
            menuitem: 'Reference Equipment',
            icon: 'Tools',
            hasSubmenu: true,
            children: [
              {
                id: uuid(),
                header: true,
                header_text: 'Calibration Menu',
              },
              {
                id: uuid(),
                menuitem: 'Temperature & Humidity',
                link: '/reference-equipment/temperature & humidity',
                icon: 'Thermometer',
              },
              {
                id: uuid(),
                menuitem: 'Pressure',
                link: '/reference-equipment/pressure',
                icon: 'Speedometer',
              },
              {
                id: uuid(),
                menuitem: 'Electrical',
                link: '/reference-equipment/electrical',
                icon: 'Lightning',
              },
              {
                id: uuid(),
                menuitem: 'Dimensional',
                link: '/reference-equipment/dimensional',
                icon: 'Rulers',
              },
              {
                id: uuid(),
                menuitem: 'Volumetric',
                link: '/reference-equipment/volumetric',
                icon: 'Droplet',
              },
              {
                id: uuid(),
                menuitem: 'Mass',
                link: '/reference-equipment/mass',
                icon: 'BoxSeam',
              },
            ],
          },
          {
            id: uuid(),
            menuitem: 'Calibration Data',
            link: '/#',
            icon: 'ListColumns',
            children: [
              {
                id: uuid(),
                menuitem: 'Temperature & Humidity',
                icon: 'Thermometer',
                children: [
                  {
                    id: uuid(),
                    menuitem: 'Temperature Instruments',
                    link: '/calibration-references/temperature-humidity/temperature-instruments',
                    icon: 'Table',
                  },
                  {
                    id: uuid(),
                    menuitem: 'Extensions',
                    link: '/calibration-references/temperature-humidity/extensions',
                    icon: 'Table',
                  },
                  {
                    id: uuid(),
                    menuitem: 'Bath',
                    link: '/calibration-references/temperature-humidity/bath',
                    icon: 'Table',
                  },
                  {
                    id: uuid(),
                    menuitem: 'Bath Stability/Uniformity',
                    link: '/calibration-references/temperature-humidity/bath/stability-uniformity',
                    icon: 'Table',
                  },
                  {
                    id: uuid(),
                    menuitem: 'Bath Stability',
                    link: '/calibration-references/temperature-humidity/bath/stability',
                    icon: 'Table',
                  },
                  {
                    id: uuid(),
                    menuitem: 'Bath Uniformity',
                    link: '/calibration-references/temperature-humidity/bath/uniformity',
                    icon: 'Table',
                  },
                  {
                    id: uuid(),
                    menuitem: 'Aux',
                    link: '/calibration-references/temperature-humidity/aux',
                    icon: 'Table',
                  },
                  {
                    id: uuid(),
                    menuitem: 'Ther',
                    link: '/calibration-references/temperature-humidity/ther',
                    icon: 'Table',
                  },
                  {
                    id: uuid(),
                    menuitem: 'Wires',
                    link: '/calibration-references/temperature-humidity/wires',
                    icon: 'Table',
                  },
                  {
                    id: uuid(),
                    menuitem: 'Meter',
                    link: '/calibration-references/temperature-humidity/Meter',
                    icon: 'Table',
                  },
                  {
                    id: uuid(),
                    menuitem: 'CK',
                    link: '/calibration-references/temperature-humidity/ck',
                    icon: 'Table',
                  },
                  {
                    id: uuid(),
                    menuitem: 'CMC',
                    link: '/calibration-references/temperature-humidity/cmc',
                    icon: 'Table',
                  },
                  {
                    id: uuid(),
                    menuitem: 'Special',
                    link: '/calibration-references/temperature-humidity/special',
                    icon: 'Table',
                  },
                ],
              },

              {
                id: uuid(),
                menuitem: 'Mass',
                link: '/#',
                icon: 'BoxSeam',
                children: [
                  {
                    id: uuid(),
                    menuitem: 'Correction, Uncertainty of the Standard Weight & Drift',
                    link: '/calibration-references/mass/cuswd',
                    icon: 'Table',
                  },
                  {
                    id: uuid(),
                    menuitem: 'MPE',
                    link: '/calibration-references/mass/mpe',
                    icon: 'Table',
                  },
                  {
                    id: uuid(),
                    menuitem: 'CK',
                    link: '/calibration-references/mass/ck',
                    icon: 'Table',
                  },
                  {
                    id: uuid(),
                    menuitem: 'Accuracy Class Reference',
                    link: '/calibration-references/mass/acr',
                    icon: 'Table',
                  },
                  {
                    id: uuid(),
                    menuitem: 'Materials',
                    link: '/calibration-references/mass/materials',
                    icon: 'Table',
                  },
                  {
                    id: uuid(),
                    menuitem: 'Reported Scope CMC (g)',
                    link: '/calibration-references/mass/rscmc',
                    icon: 'Table',
                  },
                  {
                    id: uuid(),
                    menuitem: 'Environmental',
                    link: '/calibration-references/mass/environmental',
                    icon: 'Table',
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
    supervisor: [
      {
        id: uuid(),
        menuitem: 'Dashboard',
        link: '/dashboard',
        icon: 'HouseDoorFill',
        children: [
          { id: uuid(), menuitem: 'Overview', link: '/dashboard', icon: 'HouseDoorFill' },
          // {
          //   id: uuid(),
          //   menuitem: 'Certificate Editor',
          //   icon: 'FileEarmarkBarGraphFill',
          //   link: '/reports',
          // },
        ],
        isAuthenticated: true,
      },
      {
        id: uuid(),
        menuitem: 'Customer Management',
        link: '/dashboard/master',
        icon: 'PersonFill',
        hasSubmenu: true,
        children: [
          {
            id: uuid(),
            header: true,
            header_text: 'CRM Management Menu',
          },
          {
            id: uuid(),
            menuitem: 'Customers',
            icon: 'PersonFill',
            link: '/customers',
            hasSubmenu: false,
          },
          {
            id: uuid(),
            menuitem: 'Sites',
            link: '/sites',
            icon: 'BuildingFill',
            hasSubmenu: true,
          },
        ],
      },
      {
        id: uuid(),
        menuitem: 'Vitar-Segatec',
        icon: 'GearFill',
        children: [
          {
            id: uuid(),
            header: true,
            header_text: 'Vitar-Segatec Management Menu',
          },
          {
            id: uuid(),
            menuitem: 'Technicians',
            link: '#',
            icon: 'PersonLinesFill',
            hasSubmenu: true,
            children: [
              {
                id: uuid(),
                menuitem: 'Technicians List',
                link: '/workers',
                icon: 'PersonLinesFill',
              },
              {
                id: uuid(),
                menuitem: 'Schedule',
                link: '/schedule',
                icon: 'CalendarWeekFill',
              },
            ],
          },

          {
            id: uuid(),
            menuitem: 'Calendar',
            link: '/jobs/calendar',
            icon: 'CalendarWeekFill',
          },
          {
            id: uuid(),
            menuitem: 'Job Request',
            link: '/job-requests',
            icon: 'EnvelopePaperFill',
          },
          {
            id: uuid(),
            menuitem: 'Jobs',
            link: '/jobs',
            icon: 'BriefcaseFill',
          },
          {
            id: uuid(),
            menuitem: 'Job CN',
            link: '/jobs-cns',
            icon: 'ChatDotsFill',
          },
          {
            id: uuid(),
            menuitem: 'Reference Equipment',
            icon: 'Tools',
            hasSubmenu: true,
            children: [
              {
                id: uuid(),
                header: true,
                header_text: 'Calibration Menu',
              },
              {
                id: uuid(),
                menuitem: 'Temperature & Humidity',
                link: '/reference-equipment/temperature & humidity',
                icon: 'Thermometer',
              },
              {
                id: uuid(),
                menuitem: 'Pressure',
                link: '/reference-equipment/pressure',
                icon: 'Speedometer',
              },
              {
                id: uuid(),
                menuitem: 'Electrical',
                link: '/reference-equipment/electrical',
                icon: 'Lightning',
              },
              {
                id: uuid(),
                menuitem: 'Dimensional',
                link: '/reference-equipment/dimensional',
                icon: 'Rulers',
              },
              {
                id: uuid(),
                menuitem: 'Volumetric',
                link: '/reference-equipment/volumetric',
                icon: 'Droplet',
              },
              {
                id: uuid(),
                menuitem: 'Mass',
                link: '/reference-equipment/mass',
                icon: 'BoxSeam',
              },
            ],
          },
          {
            id: uuid(),
            menuitem: 'Calibration Data',
            link: '/#',
            icon: 'ListColumns',
            children: [
              {
                id: uuid(),
                menuitem: 'Mass',
                link: '/#',
                icon: 'BoxSeam',
                children: [
                  {
                    id: uuid(),
                    menuitem: 'Correction, Uncertainty of the Standard Weight & Drift',
                    link: '/calibration-references/mass/cuswd',
                    icon: 'Table',
                  },
                  {
                    id: uuid(),
                    menuitem: 'MPE',
                    link: '/calibration-references/mass/mpe',
                    icon: 'Table',
                  },
                  {
                    id: uuid(),
                    menuitem: 'CK',
                    link: '/calibration-references/mass/ck',
                    icon: 'Table',
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
    sales: [
      {
        id: uuid(),
        menuitem: 'Dashboard',
        link: '/dashboard',
        icon: 'HouseDoorFill',
        children: [{ id: uuid(), menuitem: 'Overview', link: '/dashboard', icon: 'HouseDoorFill' }],
        isAuthenticated: true,
      },
      {
        id: uuid(),
        menuitem: 'Customer Management',
        link: '/dashboard/master',
        icon: 'PersonFill',
        hasSubmenu: true,
        children: [
          {
            id: uuid(),
            header: true,
            header_text: 'CRM Management Menu',
          },
          {
            id: uuid(),
            menuitem: 'Customers',
            icon: 'PersonFill',
            link: '/customers',
            hasSubmenu: false,
          },
          {
            id: uuid(),
            menuitem: 'Sites',
            link: '/sites',
            icon: 'BuildingFill',
            hasSubmenu: true,
          },
        ],
      },
      {
        id: uuid(),
        menuitem: 'Vitar-Segatec',
        icon: 'GearFill',
        children: [
          {
            id: uuid(),
            header: true,
            header_text: 'Vitar-Segatec Management Menu',
          },
          {
            id: uuid(),
            menuitem: 'Technicians',
            link: '#',
            icon: 'PersonLinesFill',
            hasSubmenu: true,
            children: [
              {
                id: uuid(),
                menuitem: 'Schedule',
                link: '/schedule',
                icon: 'CalendarWeekFill',
              },
            ],
          },
          {
            id: uuid(),
            menuitem: 'Calendar',
            link: '/jobs/calendar',
            icon: 'CalendarWeekFill',
          },
          {
            id: uuid(),
            menuitem: 'Job Request',
            link: '/job-requests',
            icon: 'EnvelopePaperFill',
          },
          {
            id: uuid(),
            menuitem: 'Jobs',
            link: '/jobs',
            icon: 'BriefcaseFill',
          },
        ],
      },
    ],
  };

  return roleBaseMenu?.[role] || [];
};

import { INavData } from '@coreui/angular';

export const navItems: INavData[] = [
  {
    name: 'Dashboard',
    url: '/dashboard',
    iconComponent: { name: 'cil-speedometer' },
    badge: {
      color: 'info',
      text: 'NEW'
    }
  },
  // Place this after the 'Base' or 'Buttons' entry, under 'Components'
  {
    name: 'Users',
    url: '/users',
    iconComponent: { name: 'cil-user' },
    children: [
      {
        name: 'List of Users',
        url: '/users/list'
      },
      {
        name: 'User Tracking',
        url: '/widgets/user-tracking'
      }
    ]
  },
  {
    name: 'Events', // Added for admin
    url: '/events',
    iconComponent: {name: 'cil-calendar'}
  },

  {
    name: 'Courses',
    url: '/courses',
    iconComponent: { name: 'cilLayers' }
  },
  {
    name: 'Quizzes',
    url: '/quizzes',
    iconComponent: { name: 'cilFile' }
  },
  {
    name: 'Marks',
    url: '/marks',
    linkProps: { fragment: 'headings' },
    iconComponent: { name: 'cilPencil' }
  },
  {
    name: 'Blogs',
    url: '/blogs',
    iconComponent: { name: 'cilLayers' }
  },


];

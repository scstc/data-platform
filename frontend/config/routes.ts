export default [
  {
    path: '/user',
    layout: false,
    routes: [
      {
        name: '登录',
        path: '/user/login',
        component: './user/login',
      },
    ],
  },
  {
    path: '/',
    redirect: '/ingest/datasources',
  },
  {
    path: '/ingest',
    name: 'ingest',
    icon: 'api',
    routes: [
      {
        path: '/ingest',
        redirect: '/ingest/datasources',
      },
      {
        path: '/ingest/datasources',
        name: 'datasources',
        component: './ingest/datasources',
      },
      {
        path: '/ingest/tasks',
        name: 'tasks',
        component: './ingest/tasks',
      },
      {
        path: '/ingest/upload',
        name: 'upload',
        component: './ingest/upload',
      },
      {
        path: '/ingest/assistant',
        name: 'assistant',
        component: './ingest/assistant',
      },
    ],
  },
  {
    path: '/datasets',
    name: 'datasets',
    icon: 'database',
    routes: [
      {
        path: '/datasets',
        redirect: '/datasets/list',
      },
      {
        path: '/datasets/list',
        name: 'list',
        component: './datasets/list',
      },
      {
        path: '/datasets/presets',
        name: 'presets',
        component: './datasets/presets',
      },
    ],
  },
  {
    path: '/processing',
    name: 'processing',
    icon: 'deploymentUnit',
    component: './processing',
  },
  {
    path: '/quality',
    name: 'quality',
    icon: 'fundProjectionScreen',
    component: './quality',
  },
  {
    path: '/security',
    name: 'security',
    icon: 'safetyCertificate',
    component: './security',
  },
  {
    path: '/data-tasks',
    name: 'dataTasks',
    icon: 'schedule',
    component: './data-tasks',
  },
  {
    path: '/lineage',
    name: 'lineage',
    icon: 'nodeIndex',
    component: './lineage',
  },
  {
    path: '/annotation',
    name: 'annotation',
    icon: 'tags',
    component: './annotation',
  },
  {
    component: './exception/404',
    layout: false,
    path: './*',
  },
];

import { runApp, IAppConfig } from 'ice';

import 'windi.css';

const appConfig: IAppConfig = {
  app: {
    rootId: 'ice-container',
  },
};

runApp(appConfig);

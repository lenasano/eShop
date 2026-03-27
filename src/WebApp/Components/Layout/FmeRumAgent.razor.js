/**
 * Statically import '@splitsoftware/browser-rum-agent' from NPM.
 * Tools like Webpack trim unused imports from the final bundle: https://webpack.js.org/guides/tree-shaking/
 */

import { SplitRumAgent, tti } from '/web_modules/@splitsoftware/browser-rum-agent.js';

export function registerFmeRumAgent(sdkKey, userId, anonymousCookie) { 

  if( !userId && anonymousCookie ) userId = getCookieValue(anonymousCookie);

  // Setup the Split RUM agent whenever identity information is available.
  // Once the setup is done, the agent will start sending tracked events to Split services.
  SplitRumAgent.setup(sdkKey,
    // Set the `url` config param if you are using a proxy or an SDK Key from stage
    // { url: 'https://events.split-stage.io/api' }
    { debug: false }
  ).addIdentities([
    { key: userId, trafficType: 'user' }
  ]);

  SplitRumAgent.register(tti());
}

const getCookieValue = (name) => (
  document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)')?.pop() || ''
)

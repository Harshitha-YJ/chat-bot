import React from 'react';
import { NhostProvider } from '@nhost/react';
import { ApolloProvider } from '@apollo/client';
import { nhost } from './lib/nhost';
import { apolloClient } from './lib/apollo';
import ChatApp from './components/ChatApp';

function App() {
  console.log('App rendering, nhost client:', nhost);
  
  return (
    <NhostProvider nhost={nhost}>
      <ApolloProvider client={apolloClient}>
        <ChatApp />
      </ApolloProvider>
    </NhostProvider>
  );
}

export default App;
    import { useEffect, useRef, useState } from 'react';
    import { Client } from '@stomp/stompjs';
import type { IMessage } from '@stomp/stompjs';
    import SockJS from 'sockjs-client';
    export function useStomp(endpoint: string, subscriptions: string[], headers?: Record<string,string>) {
      const clientRef = useRef<Client|null>(null);
      const [connected,setConnected] = useState(false);
      useEffect(()=>{
        const token = localStorage.getItem('accessToken');
        const client = new Client({
          webSocketFactory: () => new SockJS(endpoint),
          reconnectDelay: 3000,
          connectHeaders: { ...(headers||{}), Authorization: token ? `Bearer ${token}` : '' }
        });
        client.onConnect = () => {
          setConnected(true);
          subscriptions.forEach((sub)=>{
            client.subscribe(sub, (msg:IMessage)=>{
              const ev = new CustomEvent('stomp-message',{ detail:{ destination: sub, body: msg.body }});
              window.dispatchEvent(ev);
            });
          });
        };
        client.onStompError = () => setConnected(false);
        client.activate();
        clientRef.current = client;
        return () => { client.deactivate(); clientRef.current=null; };
      }, [endpoint, JSON.stringify(subscriptions)]);
      return { connected };
    }
    
import * as React from 'react';
import { IService, log } from 'rpc1';
import { createSocket } from 'rpc1-socket';

const context = React.createContext<IService | undefined>(undefined);
const Provider = context.Provider;

export function useSubscription<T>(
  service: string,
  method: string,
  ...args: any[]
): [T | undefined, boolean, any] {
  const [state, setState] = React.useState<{
    res?: number;
    loading: boolean;
    err?: any;
  }>({
    loading: true,
    err: undefined,
    res: undefined
  });
  const client = React.useContext(context);

  React.useEffect(() => {
    if (!client) {
      return;
    }
    const proxy = client.use(service);

    return proxy.subscription(
      method,
      ...args,
      (err: any, res: T | undefined) => {
        setState({ res: (res || undefined) as any, loading: false, err });
      }
    );
  }, [client, method, JSON.stringify(args)]);
  return [state.res as any, state.loading, state.err];
}

export function useMethod<T>(
  service: string,
  method: string,
  ...args: any[]
): [T | undefined, boolean, any] {
  const [state, setState] = React.useState<{
    res?: number;
    loading: boolean;
    err?: any;
  }>({
    loading: true,
    err: undefined,
    res: undefined
  });
  const client = React.useContext(context);

  React.useEffect(() => {
    if (!client) {
      return;
    }
    const proxy = client.use(service);
    proxy
      .method(method, ...args)
      .then((res: any) =>
        setState({
          res: (res || undefined) as any,
          loading: false,
          err: undefined
        })
      )
      .catch((err: any) => setState({ res: undefined, loading: false, err }));
  }, [client, method, JSON.stringify(args)]);
  return [state.res as any, state.loading, state.err];
}

export function useServiceTunnel<T = any>(service: string): T | undefined {
  const client = React.useContext(context);
  return client ? client.use(service) : undefined;
}

export function ServiceProxyProvider({
  render,
  children,
  url,
  authKey,
  logging
}: {
  render: () => React.ReactNode;
  authError: () => React.ReactNode;
  loading: () => React.ReactNode;
  children: React.ReactNode;
  url: string | string[];
  authKey?: string;
  logging?: boolean;
}) {
  if (logging) {
    log.enable();
  }
  const [state, setState] = React.useState<any>(undefined);
  if (!Array.isArray(url)) {
    url = url ? [url].filter(x => x) : [];
  }
  React.useEffect(() => {
    const destroy = createSocket(url[0], client => {
      setState(client);
    });
    return () => {
      setState(undefined);
      destroy();
    };
  }, [url.join(','), authKey]);
  /*let child = null;
  if (state.unauthorized && authError) {
    child = authError();
  } else if (state.loading && loading) {
    child = loading();
  } else if (state.value && render) {
    child = render();
  } else {
    child = children;
  }*/
  return <Provider value={state}>{render ? render() : children}</Provider>;
}

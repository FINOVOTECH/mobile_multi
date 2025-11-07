import type { NavigationContainerRef, StackActions, CommonActions } from '@react-navigation/native';
import type { RefObject } from 'react';

type NavigationRefType = RefObject<NavigationContainerRef<any>>;

type Route = {
  name: string;
  key?: string;
  params?: Record<string, any>;
};

export const createRouter = (navigationRef: NavigationRefType) => {
  const navigate = (name: string, params?: Record<string, any>) => {
    if (navigationRef?.current?.navigate) {
      navigationRef.current.navigate(name as never, params as never);
    }
  };

  const goBack = () => {
    if (navigationRef?.current?.canGoBack?.()) {
      navigationRef.current.goBack();
    }
  };

  const reset = (index: number, routes: Route[]) => {
    if (navigationRef?.current?.reset) {
      navigationRef.current.reset({
        index,
        routes: routes.map((route) => ({
          name: route.name,
          key: route.key || `${route.name}-${Date.now()}`,
          params: route.params,
        })),
      });
    }
  };

  return {
    navigate,
    goBack,
    reset,
  };
};

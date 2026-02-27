export type RouteChangeFunction = (route: string) => void;
export type AnyObject = Record<string, string>;

export let mockRouteChangeComplete: RouteChangeFunction;
export let mockRouteChangeStart: RouteChangeFunction;

/**
 * Helper to set window.location.pathname in jsdom 26+ (Jest 30+).
 * Direct assignment (`window.location.pathname = "..."`) triggers
 * "not implemented: navigation" in jsdom 26. Using history.pushState
 * updates the URL without triggering navigation.
 */
export function setLocationPathname(pathname: string): void {
  window.history.pushState({}, "", pathname);
}

jest.mock("next/router", () => {
  const query = {} as AnyObject;
  return {
    events: {
      emit: (_event: string, route: string) => {
        if (/\?/.exec(route) !== null) {
          const search = route.split("?")[1];
          if (search.indexOf("=") > -1) {
            const values = JSON.parse(
              `{"${decodeURI(search)
                .replace(/"/g, '\\"')
                .replace(/&/g, '","')
                .replace(/=/g, '":"')}"}`,
            ) as AnyObject;
            Object.keys(values).forEach((key) => {
              query[key] = decodeURIComponent(values[key]);
            });
          }
        }
        if (_event === "routeChangeStart") {
          mockRouteChangeStart(route);
        } else {
          mockRouteChangeComplete(route);
        }
        jest.fn();
      },
      on: (_event: string, cb: RouteChangeFunction) => {
        if (_event === "routeChangeStart") {
          mockRouteChangeStart = cb;
        } else {
          mockRouteChangeComplete = cb;
        }
      },
    },
    query,
  };
});

// jsdom 26+ (Jest 30+) starts at "http://localhost/" with pathname "/"
// No need to redefine window.location — it's already correct.

// Setup before each test
beforeEach(() => {
  // Add a fake script node so init can insert matomo tracker code before it
  if (!document.head.querySelector("script")) {
    document.head.appendChild(document.createElement("script"));
  }
});

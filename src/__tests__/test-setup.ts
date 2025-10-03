import { default as Router } from "next/router";

export type RouteChangeFunction = (route: string) => void;
export type AnyObject = Record<string, string>;

// eslint-disable-next-line @typescript-eslint/init-declarations
export let mockRouteChangeComplete: RouteChangeFunction;
// eslint-disable-next-line @typescript-eslint/init-declarations
export let mockRouteChangeStart: RouteChangeFunction;

jest.mock("next/router", () => {
  const query = {} as AnyObject;
  return {
    events: {
      emit: (_event: string, route: string) => {
        if (/\?/.exec(route) !== null) {
          const search = route.split("?")[1];
          // eslint-disable-next-line @typescript-eslint/prefer-includes
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

// default window.location.pathname
Object.defineProperty(window, "location", {
  value: {
    pathname: "/",
  },
});

// Setup before each test
beforeEach(() => {
  // Add a fake script node so init can insert matomo tracker code before it
  if (!document.head.querySelector("script")) {
    document.head.appendChild(document.createElement("script"));
  }
});

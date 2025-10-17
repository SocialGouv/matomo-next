import { push } from "./tracker";

enum MatomoBaseEvent {
  TRACK_EVENT = "trackEvent",
}

type BaseProps = {
  category: string;
  action: string;
};

type PropsWithBaseElement = BaseProps & {
  name?: never;
  value?: never;
};

type PropsWithName = BaseProps & {
  name: string;
  value?: never;
};

type PropsWithValue = BaseProps & {
  name: string;
  value: string;
};

type Props = PropsWithBaseElement | PropsWithName | PropsWithValue;

function isPropsWithName(props: Props): props is PropsWithName {
  return (props as PropsWithName).name !== undefined;
}

function isPropsWithValue(props: Props): props is PropsWithValue {
  return (props as PropsWithValue).value !== undefined;
}

/**
 * Send a custom event to Matomo tracker
 *
 * @param props - Event properties with category, action, and optional name and value
 *
 * @example
 * // Basic event
 * sendEvent({ category: "contact", action: "click phone" });
 *
 * @example
 * // Event with name
 * sendEvent({ category: "video", action: "play", name: "intro-video" });
 *
 * @example
 * // Event with name and value
 * sendEvent({ category: "purchase", action: "buy", name: "product-123", value: "99.99" });
 */
export function sendEvent(props: Props) {
  if (isPropsWithValue(props)) {
    push([
      MatomoBaseEvent.TRACK_EVENT,
      props.category,
      props.action,
      props.name,
      props.value,
    ]);
  } else if (isPropsWithName(props)) {
    push([
      MatomoBaseEvent.TRACK_EVENT,
      props.category,
      props.action,
      props.name,
    ]);
  } else {
    push([MatomoBaseEvent.TRACK_EVENT, props.category, props.action]);
  }
}

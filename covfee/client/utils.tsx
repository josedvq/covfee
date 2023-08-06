import * as React from "react";
import log from "loglevel";
import { message, Result } from "antd";

import Constants from "Constants";
if (Constants.env == "development") {
  log.setLevel("debug");
} else {
  log.setLevel("error");
}
export { log };

// read a cookie in the browser
export function getCookieValue(a: string) {
  var b = document.cookie.match("(^|;)\\s*" + a + "\\s*=\\s*([^;]+)");
  return b ? b.pop() : null;
}

export function getUrlQueryParam(name: string) {
  // querystring is after the hash
  let search;
  if (window.location.hash.indexOf("?") !== -1) {
    search = "?" + window.location.hash.split("?")[1];
  } else {
    search = window.location.search;
  }
  const params = new URLSearchParams(search);
  return params.get(name);
}

// error method that
//   prints an message to screen in production environment
//   prints and logs a detailed error in dev mode
export function myerror(msg: string, error?: any) {
  if (Constants.env == "production") {
    message.error(msg + " Please try again later or contact the organizer(s).");
  } else {
    if (error) {
      log.error(error);
      message.error(msg + error.stack, 0);
    }
  }
}

export function myinfo(msg: string) {
  message.info(msg);
}

export function urlReplacer(url: string) {
  return url.replace(/\$\$www\$\$/g, Constants.www_url);
}

// fetch wrapper that appends the csrf_access_token cookie for authentication
export function fetcher(input: RequestInfo, options?: RequestInit) {
  if (typeof input == "string") input = urlReplacer(input);
  const cookie = getCookieValue("csrf_access_token");
  const newOptions = { ...options };
  if (cookie != null) {
    newOptions.headers = {
      ...newOptions.headers,
      "X-CSRF-TOKEN": cookie,
    };
  }
  return fetch(input, newOptions);
}

// fetch then function that throws an error for error status codes
export const throwBadResponse = async (response: any) => {
  if (!response.ok) {
    const data = await response.json();
    if (data.hasOwnProperty("msg")) {
      throw Error(data.msg);
    }
    throw Error(response.statusText);
  }
  return await response.json();
};

// returns a cancellable promise for use in react components
export type CancelablePromise<T> = {
  promise: Promise<T>;
  cancel: () => void;
};
export const makeCancelablePromise = (promise: Promise<any>) => {
  let hasCanceled_ = false;

  const wrappedPromise = new Promise((resolve, reject) => {
    promise.then(
      (val) => (hasCanceled_ ? reject({ isCanceled: true }) : resolve(val)),
      (error) => (hasCanceled_ ? reject({ isCanceled: true }) : reject(error))
    );
  });

  return {
    promise: wrappedPromise,
    cancel() {
      hasCanceled_ = true;
    },
  } as CancelablePromise<any>;
};

export function getFullscreen(element: any) {
  if (element.requestFullscreen) {
    return element.requestFullscreen();
  } else if (element.mozRequestFullScreen) {
    return element.mozRequestFullScreen();
  } else if (element.webkitRequestFullscreen) {
    return element.webkitRequestFullscreen();
  } else if (element.msRequestFullscreen) {
    return element.msRequestFullscreen();
  }
}

export function closeFullscreen() {
  const doc = document as any;
  if (doc.exitFullscreen) {
    return doc.exitFullscreen();
  } else if (doc.mozCancelFullScreen) {
    /* Firefox */
    return doc.mozCancelFullScreen();
  } else if (doc.webkitExitFullscreen) {
    /* Chrome, Safari and Opera */
    return doc.webkitExitFullscreen();
  } else if (doc.msExitFullscreen) {
    /* IE/Edge */
    return doc.msExitFullscreen();
  }
}

// Renders a date in the local timezone, including day of the week.
// e.g. "Fri, 22 May 2020"
const dateFormatter = new Intl.DateTimeFormat([], {
  year: "numeric",
  month: "long",
  day: "numeric",
  weekday: "short",
});

// Renders an HH:MM time in the local timezone, including timezone info.
// e.g. "12:17 BST"
const timeFormatter = new Intl.DateTimeFormat([], {
  hour: "numeric",
  minute: "numeric",
});

// Given an ISO 8601 date string, render it as a more friendly date
// in the user's timezone.
//
// Examples:
// - "today @ 12:00 BST"
// - "yesterday @ 11:00 CST"
// - "Fri, 22 May 2020 @ 10:00 PST"
//
export function getHumanFriendlyDateString(iso8601_date_string: string) {
  const date = new Date(Date.parse(iso8601_date_string));

  // When are today and yesterday?
  const today = new Date();
  const yesterday = new Date().setDate(today.getDate() - 1);

  // We have to compare the *formatted* dates rather than the actual dates --
  // for example, if the UTC date and the localised date fall on either side
  // of midnight.
  if (dateFormatter.format(date) == dateFormatter.format(today)) {
    return "today @ " + timeFormatter.format(date);
  } else if (dateFormatter.format(date) == dateFormatter.format(yesterday)) {
    return "yesterday @ " + timeFormatter.format(date);
  } else {
    return dateFormatter.format(date) + " @ " + timeFormatter.format(date);
  }
}

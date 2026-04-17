const API_LOADING_EVENT = "mrs-api-loading";

const dispatchApiLoading = (active: boolean) => {
  window.dispatchEvent(
    new CustomEvent(API_LOADING_EVENT, {
      detail: { active },
    })
  );
};

export const startApiLoading = () => {
  dispatchApiLoading(true);
};

export const stopApiLoading = () => {
  dispatchApiLoading(false);
};

export const withApiLoading = async <T>(work: Promise<T> | (() => Promise<T>)) => {
  startApiLoading();
  try {
    const task = typeof work === "function" ? work() : work;
    return await task;
  } finally {
    stopApiLoading();
  }
};

export const API_LOADING_EVENT_NAME = API_LOADING_EVENT;

import nock from "nock";
import { afterEach, beforeAll } from "vitest";

beforeAll(() => {
  nock.disableNetConnect();
  nock.enableNetConnect((host) => host.includes("127.0.0.1") || host.includes("localhost"));
});

afterEach(() => {
  if (!nock.isDone()) {
    nock.cleanAll();
  }
});

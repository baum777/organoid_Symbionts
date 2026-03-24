import "dotenv/config";
import { invokeXApiRequest } from "../src/clients/xApi.js";

async function run() {
  const me = await invokeXApiRequest<{ data: { username?: string; id: string } }>({
    method: "GET",
    uri: "https://api.x.com/2/users/me",
  });
  console.log("OK user:", me.data?.username, me.data?.id);
}

run().catch((error: unknown) => {
  console.error("SMOKE FAIL:", error instanceof Error ? error.message : error);
  process.exit(1);
});

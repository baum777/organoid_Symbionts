import { invokeXApiRequest } from "../clients/xApi.js";

export async function targetTweetExists(tweetId: string): Promise<boolean> {
  try {
    await invokeXApiRequest({
      method: "GET",
      uri: `https://api.x.com/2/tweets/${tweetId}`,
    });
    return true;
  } catch {
    return false;
  }
}

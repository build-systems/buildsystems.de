import type { APIRoute } from "astro";
import { getAllPosts } from "../../lib/notion/client";
import type { Post } from "../../lib/interfaces";

export const GET: APIRoute = async (context) => {
  // console.log("Context", context);
  const posts = await getAllPosts();
  return new Response(JSON.stringify(posts));
};

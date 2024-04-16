export function formatDate(date: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
  };
  // const options: Intl.DateTimeFormatOptions = {year: 'numeric', month: 'long', day: 'numeric'};

  return new Date(date).toLocaleDateString(undefined, options);
}

export async function fetchPostsEndpoint() {
  console.log("\n===== Endpoint function =====");
  let DATA;
  if (!DATA) {
    try {
      // console.log(Astro.site + "api/notionPosts.json");
      const res = await fetch(Astro.site + "api/notionPosts.json");
      console.dir(res);
      if (!res.ok) {
        throw new Error("Response from posts endpoint not ok 03");
      }
      const data = await res.json();
      DATA = data;
      return data;
    } catch (e) {
      console.log("Error getting data from posts endpoint 03");
      console.error(e);
    }
  }
}

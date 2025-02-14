import fs, { createWriteStream } from "node:fs";
import { pipeline } from "node:stream/promises";
import axios, { type AxiosResponse } from "axios";
import sharp from "sharp";
import retry from "async-retry";
import ExifTransformer from "exif-be-gone";
import {
  NOTION_API_SECRET,
  DATABASE_ID,
  NUMBER_OF_POSTS_PER_PAGE,
  REQUEST_TIMEOUT_MS,
  PEOPLE_DB_ID,
  ORGANIZATIONS_DB_ID,
  PARTNERS_DB_ID,
} from "../../server-constants";
import type * as responses from "./responses";
import type * as requestParams from "./request-params";
import type {
  Database,
  Post,
  Block,
  Paragraph,
  Heading1,
  Heading2,
  Heading3,
  BulletedListItem,
  NumberedListItem,
  ToDo,
  Image,
  Code,
  Quote,
  Equation,
  Callout,
  Embed,
  Video,
  File,
  Bookmark,
  LinkPreview,
  SyncedBlock,
  SyncedFrom,
  Table,
  TableRow,
  TableCell,
  Toggle,
  ColumnList,
  Column,
  TableOfContents,
  RichText,
  Text,
  Annotation,
  SelectProperty,
  Emoji,
  FileObject,
  LinkToPage,
  Mention,
  Reference,
  PersonCard,
  OrganizationCard,
  PartnerCard,
} from "../notion-interfaces";
// eslint-disable-next-line @typescript-eslint/no-var-requires
import { Client, APIResponseError } from "@notionhq/client";
import { addSlugToName, returnImageNameAsJpg } from "../blog-helpers";

const client = new Client({
  auth: NOTION_API_SECRET,
});

let postsCache: Post[] | null = null;
let dbCache: Database | null = null;

const numberOfRetry = 2;

export async function getAllPosts(): Promise<Post[]> {
  if (postsCache !== null) {
    return Promise.resolve(postsCache);
  }

  console.log("\n===== Getting all posts =====");
  const params: requestParams.QueryDatabase = {
    database_id: DATABASE_ID,
    filter: {
      and: [
        {
          property: "Status",
          status: {
            equals: "Live",
          },
        },
        {
          property: "PublishDate",
          date: {
            on_or_before: new Date().toISOString(),
          },
        },
      ],
    },
    sorts: [
      {
        property: "PublishDate",
        direction: "descending",
      },
    ],
    page_size: 100,
  };

  let results: responses.PageObject[] = [];
  while (true) {
    const res = await retry(
      async (bail) => {
        try {
          return (await client.databases.query(
            params as any, // eslint-disable-line @typescript-eslint/no-explicit-any
          )) as responses.QueryDatabaseResponse;
        } catch (error: unknown) {
          if (error instanceof APIResponseError) {
            if (error.status && error.status >= 400 && error.status < 500) {
              bail(error);
            }
          }
          throw error;
        }
      },
      {
        retries: numberOfRetry,
      },
    );
    results = results.concat(res.results);
    // console.dir(results);

    if (!res.has_more) {
      break;
    }

    params["start_cursor"] = res.next_cursor as string;
  }

  postsCache = results
    .filter((pageObject) => _validPageObject(pageObject))
    .map((pageObject) => _buildPost(pageObject));
  return postsCache;
}

let peopleCache: PersonCard[] | null = null;

export async function getAllPeople(): Promise<PersonCard[]> {
  if (peopleCache !== null) {
    return Promise.resolve(peopleCache);
  }

  // console.log("\n===== Getting all people =====");
  const params: requestParams.QueryDatabase = {
    database_id: PEOPLE_DB_ID,
    page_size: 100,
    sorts: [
      {
        property: "Order",
        direction: "ascending",
      },
    ],
    filter: {
      property: "Visible",
      checkbox: {
        equals: true,
      },
    },
  };

  let results: responses.PageObject[] = [];
  while (true) {
    const res = await retry(
      async (bail) => {
        try {
          return (await client.databases.query(
            params as any, // eslint-disable-line @typescript-eslint/no-explicit-any
          )) as responses.QueryDatabaseResponse;
        } catch (error: unknown) {
          if (error instanceof APIResponseError) {
            if (error.status && error.status >= 400 && error.status < 500) {
              bail(error);
            }
          }
          throw error;
        }
      },
      {
        retries: numberOfRetry,
      },
    );
    results = results.concat(res.results);

    if (!res.has_more) {
      break;
    }

    params["start_cursor"] = res.next_cursor as string;
  }

  peopleCache = results
    .filter((pageObject) => _validPersonObject(pageObject))
    .map((pageObject) => _buildPerson(pageObject));
  return peopleCache;
}

let partnersCache: PartnerCard[] | null = null;

export async function getAllPartners(): Promise<PartnerCard[]> {
  if (partnersCache !== null) {
    return Promise.resolve(partnersCache);
  }

  // console.log("\n===== Getting all people =====");
  const params: requestParams.QueryDatabase = {
    database_id: PARTNERS_DB_ID,
    page_size: 100,
    sorts: [
      {
        property: "Order",
        direction: "ascending",
      },
    ],
    filter: {
      property: "Visible",
      checkbox: {
        equals: true,
      },
    },
  };

  let results: responses.PageObject[] = [];
  while (true) {
    const res = await retry(
      async (bail) => {
        try {
          return (await client.databases.query(
            params as any, // eslint-disable-line @typescript-eslint/no-explicit-any
          )) as responses.QueryDatabaseResponse;
        } catch (error: unknown) {
          if (error instanceof APIResponseError) {
            if (error.status && error.status >= 400 && error.status < 500) {
              bail(error);
            }
          }
          throw error;
        }
      },
      {
        retries: numberOfRetry,
      },
    );
    results = results.concat(res.results);
    // console.dir(results);

    if (!res.has_more) {
      break;
    }

    params["start_cursor"] = res.next_cursor as string;
  }

  partnersCache = results
    .filter((pageObject) => _validPartnerObject(pageObject))
    .map((pageObject) => _buildPartner(pageObject));
  return partnersCache;
}

let organizationsCache: OrganizationCard[] | null = null;

export async function getAllOrganizations(): Promise<OrganizationCard[]> {
  if (organizationsCache !== null) {
    return Promise.resolve(organizationsCache);
  }

  // console.log("\n===== Getting all people =====");
  const params: requestParams.QueryDatabase = {
    database_id: ORGANIZATIONS_DB_ID,
    page_size: 100,
    sorts: [
      {
        property: "Order",
        direction: "ascending",
      },
    ],
    filter: {
      property: "Visible",
      checkbox: {
        equals: true,
      },
    },
  };

  let results: responses.PageObject[] = [];
  while (true) {
    const res = await retry(
      async (bail) => {
        try {
          return (await client.databases.query(
            params as any, // eslint-disable-line @typescript-eslint/no-explicit-any
          )) as responses.QueryDatabaseResponse;
        } catch (error: unknown) {
          if (error instanceof APIResponseError) {
            if (error.status && error.status >= 400 && error.status < 500) {
              bail(error);
            }
          }
          throw error;
        }
      },
      {
        retries: numberOfRetry,
      },
    );
    results = results.concat(res.results);
    // console.dir(results);

    if (!res.has_more) {
      break;
    }

    params["start_cursor"] = res.next_cursor as string;
  }

  organizationsCache = results
    .filter((pageObject) => _validOrganizationObject(pageObject))
    .map((pageObject) => _buildOrganization(pageObject));
  return organizationsCache;
}

export async function getPosts(pageSize = 10): Promise<Post[]> {
  const allPosts = await getAllPosts();
  return allPosts.slice(0, pageSize);
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const allPosts = await getAllPosts();
  return allPosts.find((post) => post.Slug === slug) || null;
}

export async function getPostByPageId(pageId: string): Promise<Post | null> {
  const allPosts = await getAllPosts();
  return allPosts.find((post) => post.PageId === pageId) || null;
}

export async function getPostsByTag(
  tagName: string,
  pageSize = 10,
): Promise<Post[]> {
  if (!tagName) return [];

  const allPosts = await getAllPosts();
  return allPosts
    .filter((post) => post.Tags.find((tag) => tag.name === tagName))
    .slice(0, pageSize);
}

// page starts from 1 not 0
export async function getPostsByPage(page: number): Promise<Post[]> {
  if (page < 1) {
    return [];
  }

  const allPosts = await getAllPosts();

  const startIndex = (page - 1) * NUMBER_OF_POSTS_PER_PAGE;
  const endIndex = startIndex + NUMBER_OF_POSTS_PER_PAGE;

  return allPosts.slice(startIndex, endIndex);
}

// page starts from 1 not 0
export async function getPostsByTagAndPage(
  tagName: string,
  page: number,
): Promise<Post[]> {
  if (page < 1) {
    return [];
  }

  const allPosts = await getAllPosts();
  const posts = allPosts.filter((post) =>
    post.Tags.find((tag) => tag.name === tagName),
  );

  const startIndex = (page - 1) * NUMBER_OF_POSTS_PER_PAGE;
  const endIndex = startIndex + NUMBER_OF_POSTS_PER_PAGE;

  return posts.slice(startIndex, endIndex);
}

export async function getNumberOfPages(): Promise<number> {
  const allPosts = await getAllPosts();
  return (
    Math.floor(allPosts.length / NUMBER_OF_POSTS_PER_PAGE) +
    (allPosts.length % NUMBER_OF_POSTS_PER_PAGE > 0 ? 1 : 0)
  );
}

export async function getNumberOfPagesByTag(tagName: string): Promise<number> {
  const allPosts = await getAllPosts();
  const posts = allPosts.filter((post) =>
    post.Tags.find((tag) => tag.name === tagName),
  );
  return (
    Math.floor(posts.length / NUMBER_OF_POSTS_PER_PAGE) +
    (posts.length % NUMBER_OF_POSTS_PER_PAGE > 0 ? 1 : 0)
  );
}

export async function getAllBlocksByBlockId(blockId: string): Promise<Block[]> {
  let results: responses.BlockObject[] = [];

  if (fs.existsSync(`tmp/${blockId}.json`)) {
    results = JSON.parse(fs.readFileSync(`tmp/${blockId}.json`, "utf-8"));
  } else {
    const params: requestParams.RetrieveBlockChildren = {
      block_id: blockId,
    };

    while (true) {
      const res = await retry(
        async (bail) => {
          try {
            return (await client.blocks.children.list(
              params as any, // eslint-disable-line @typescript-eslint/no-explicit-any
            )) as responses.RetrieveBlockChildrenResponse;
          } catch (error: unknown) {
            if (error instanceof APIResponseError) {
              if (error.status && error.status >= 400 && error.status < 500) {
                bail(error);
              }
            }
            throw error;
          }
        },
        {
          retries: numberOfRetry,
        },
      );

      results = results.concat(res.results);

      if (!res.has_more) {
        break;
      }

      params["start_cursor"] = res.next_cursor as string;
    }
  }

  const allBlocks = results.map((blockObject) => _buildBlock(blockObject));

  for (let i = 0; i < allBlocks.length; i++) {
    const block = allBlocks[i];

    if (block.Type === "table" && block.Table) {
      block.Table.Rows = await _getTableRows(block.Id);
    } else if (block.Type === "column_list" && block.ColumnList) {
      block.ColumnList.Columns = await _getColumns(block.Id);
    } else if (
      block.Type === "bulleted_list_item" &&
      block.BulletedListItem &&
      block.HasChildren
    ) {
      block.BulletedListItem.Children = await getAllBlocksByBlockId(block.Id);
    } else if (
      block.Type === "numbered_list_item" &&
      block.NumberedListItem &&
      block.HasChildren
    ) {
      block.NumberedListItem.Children = await getAllBlocksByBlockId(block.Id);
    } else if (block.Type === "to_do" && block.ToDo && block.HasChildren) {
      block.ToDo.Children = await getAllBlocksByBlockId(block.Id);
    } else if (block.Type === "synced_block" && block.SyncedBlock) {
      block.SyncedBlock.Children = await _getSyncedBlockChildren(block);
    } else if (block.Type === "toggle" && block.Toggle) {
      block.Toggle.Children = await getAllBlocksByBlockId(block.Id);
    } else if (
      block.Type === "paragraph" &&
      block.Paragraph &&
      block.HasChildren
    ) {
      block.Paragraph.Children = await getAllBlocksByBlockId(block.Id);
    } else if (
      block.Type === "heading_1" &&
      block.Heading1 &&
      block.HasChildren
    ) {
      block.Heading1.Children = await getAllBlocksByBlockId(block.Id);
    } else if (
      block.Type === "heading_2" &&
      block.Heading2 &&
      block.HasChildren
    ) {
      block.Heading2.Children = await getAllBlocksByBlockId(block.Id);
    } else if (
      block.Type === "heading_3" &&
      block.Heading3 &&
      block.HasChildren
    ) {
      block.Heading3.Children = await getAllBlocksByBlockId(block.Id);
    } else if (block.Type === "quote" && block.Quote && block.HasChildren) {
      block.Quote.Children = await getAllBlocksByBlockId(block.Id);
    } else if (block.Type === "callout" && block.Callout && block.HasChildren) {
      block.Callout.Children = await getAllBlocksByBlockId(block.Id);
    }
  }

  return allBlocks;
}

export async function getBlock(blockId: string): Promise<Block> {
  const params: requestParams.RetrieveBlock = {
    block_id: blockId,
  };

  const res = await retry(
    async (bail) => {
      try {
        return (await client.blocks.retrieve(
          params as any, // eslint-disable-line @typescript-eslint/no-explicit-any
        )) as responses.RetrieveBlockResponse;
      } catch (error: unknown) {
        if (error instanceof APIResponseError) {
          if (error.status && error.status >= 400 && error.status < 500) {
            bail(error);
          }
        }
        throw error;
      }
    },
    {
      retries: numberOfRetry,
    },
  );

  return _buildBlock(res);
}

export async function getAllTags(): Promise<SelectProperty[]> {
  const allPosts = await getAllPosts();

  const tagNames: string[] = [];
  return allPosts
    .flatMap((post) => post.Tags)
    .reduce((acc, tag) => {
      if (!tagNames.includes(tag.name)) {
        acc.push(tag);
        tagNames.push(tag.name);
      }
      return acc;
    }, [] as SelectProperty[])
    .sort((a: SelectProperty, b: SelectProperty) =>
      a.name.localeCompare(b.name),
    );
}

async function checkFileExists(file: fs.PathLike) {
  try {
    await fs.promises.access(file, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

export async function downloadImage(url: URL, slug: string) {
  let res!: AxiosResponse;
  try {
    res = await axios({
      method: "get",
      url: url.toString(),
      timeout: REQUEST_TIMEOUT_MS,
      responseType: "stream",
    });
  } catch (error) {
    console.log("\nError requesting image\n" + error);
    return Promise.resolve();
  }
  console.log("\n===== Starting File Download =====");

  if (!res || res.status != 200) {
    console.log(res);
    return Promise.resolve();
  }

  console.log("1 - Getting folder path...");
  const dir = "./src/assets/notion/" + url.pathname.split("/").slice(-2)[0];
  console.log("2 - Folder path is: " + dir);
  console.log("3 - Checking if folder exists...");
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
    console.log("4 - It did not exists, folder was created.");
  } else {
    console.log("4 - Folder already exists.");
  }

  console.log("5 - Getting file name");
  const fileName = decodeURIComponent(url.pathname.split("/").slice(-1)[0]);
  console.log("5 - File name is: " + fileName);
  const fileNameWithSlug = addSlugToName(fileName, slug);
  console.log("6 - File name with slug is: " + fileNameWithSlug);

  const filepath = `${dir}/${fileNameWithSlug}`;
  console.log("7 - Full file path is: " + filepath);

  if (fs.existsSync(filepath)) {
    console.log(`File already exists:\n${filepath}`);
    return;
  }

  const writeStream = createWriteStream(filepath);
  const rotate = sharp().rotate();

  let stream = res.data;

  if (res.headers["content-type"] === "image/jpeg") {
    stream = stream.pipe(rotate);
  }
  try {
    console.log(`Downloading file:\n${filepath}`);
    return pipeline(stream, new ExifTransformer(), writeStream);
  } catch (error) {
    console.log("\nError while downloading file\n" + error);
    writeStream.end();
    return Promise.resolve();
  }
}

export async function downloadPublicImage(url: URL, slug: string) {
  let res!: AxiosResponse;
  try {
    res = await axios({
      method: "get",
      url: url.toString(),
      timeout: REQUEST_TIMEOUT_MS,
      responseType: "stream",
    });
  } catch (error) {
    console.log("\nError requesting image\n" + error);
    return Promise.resolve();
  }
  // console.log("\n===== Starting Public Image Download =====");

  if (!res || res.status != 200) {
    console.log(res);
    return Promise.resolve();
  }

  const dir = "./public/notion/" + url.pathname.split("/").slice(-2)[0];
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  } else {
  }

  // Changing file extension
  const fileNameConverted = returnImageNameAsJpg(url);

  // One of the places I add the slug to the image name
  const fileNameWithSlug = addSlugToName(fileNameConverted, slug);

  const filepath = `${dir}/${fileNameWithSlug}`;

  if (fs.existsSync(filepath)) {
    // console.log(`File already exists:\n${filepath}`);
    return;
  }

  const writeStream = createWriteStream(filepath);

  let stream = res.data;

  if (res.headers["content-type"] === "image/jpeg") {
    stream = stream.pipe(sharp().resize({ width: 1200 }).rotate());
  } else {
    stream = stream.pipe(
      sharp().resize({ width: 1200 }).jpeg().flatten({ background: "#222222" }),
    );
  }
  try {
    // console.log(`Downloading file:\n${filepath}`);
    // console.log("9 - Downloading file");
    return pipeline(stream, new ExifTransformer(), writeStream);
  } catch (error) {
    console.log("\nError while downloading file\n" + error);
    writeStream.end();
    return Promise.resolve();
  }
}

export async function getDatabase(): Promise<Database> {
  if (dbCache !== null) {
    return Promise.resolve(dbCache);
  }

  const params: requestParams.RetrieveDatabase = {
    database_id: DATABASE_ID,
  };

  const res = await retry(
    async (bail) => {
      try {
        return (await client.databases.retrieve(
          params as any, // eslint-disable-line @typescript-eslint/no-explicit-any
        )) as responses.RetrieveDatabaseResponse;
      } catch (error: unknown) {
        if (error instanceof APIResponseError) {
          if (error.status && error.status >= 400 && error.status < 500) {
            bail(error);
          }
        }
        throw error;
      }
    },
    {
      retries: numberOfRetry,
    },
  );

  let icon: FileObject | Emoji | null = null;
  if (res.icon) {
    if (res.icon.type === "emoji" && "emoji" in res.icon) {
      icon = {
        Type: res.icon.type,
        Emoji: res.icon.emoji,
      };
    } else if (res.icon.type === "external" && "external" in res.icon) {
      icon = {
        Type: res.icon.type,
        Url: res.icon.external?.url || "",
      };
    } else if (res.icon.type === "file" && "file" in res.icon) {
      icon = {
        Type: res.icon.type,
        Url: res.icon.file?.url || "",
      };
    }
  }

  let cover: FileObject | null = null;
  if (res.cover) {
    cover = {
      Type: res.cover.type,
      Url: res.cover.external?.url || res.cover.file?.url || "",
    };
  }

  const database: Database = {
    Title: res.title.map((richText) => richText.plain_text).join(""),
    Description: res.description
      .map((richText) => richText.plain_text)
      .join(""),
    Icon: icon,
    Cover: cover,
  };

  dbCache = database;
  return database;
}

function _buildBlock(blockObject: responses.BlockObject): Block {
  const block: Block = {
    Id: blockObject.id,
    Type: blockObject.type,
    HasChildren: blockObject.has_children,
    ParentId: blockObject.parent.page_id,
  };

  switch (blockObject.type) {
    case "paragraph":
      if (blockObject.paragraph) {
        const paragraph: Paragraph = {
          RichTexts: blockObject.paragraph.rich_text.map(_buildRichText),
          Color: blockObject.paragraph.color,
        };
        block.Paragraph = paragraph;
      }
      break;
    case "heading_1":
      if (blockObject.heading_1) {
        const heading1: Heading1 = {
          RichTexts: blockObject.heading_1.rich_text.map(_buildRichText),
          Color: blockObject.heading_1.color,
          IsToggleable: blockObject.heading_1.is_toggleable,
        };
        block.Heading1 = heading1;
      }
      break;
    case "heading_2":
      if (blockObject.heading_2) {
        const heading2: Heading2 = {
          RichTexts: blockObject.heading_2.rich_text.map(_buildRichText),
          Color: blockObject.heading_2.color,
          IsToggleable: blockObject.heading_2.is_toggleable,
        };
        block.Heading2 = heading2;
      }
      break;
    case "heading_3":
      if (blockObject.heading_3) {
        const heading3: Heading3 = {
          RichTexts: blockObject.heading_3.rich_text.map(_buildRichText),
          Color: blockObject.heading_3.color,
          IsToggleable: blockObject.heading_3.is_toggleable,
        };
        block.Heading3 = heading3;
      }
      break;
    case "bulleted_list_item":
      if (blockObject.bulleted_list_item) {
        const bulletedListItem: BulletedListItem = {
          RichTexts:
            blockObject.bulleted_list_item.rich_text.map(_buildRichText),
          Color: blockObject.bulleted_list_item.color,
        };
        block.BulletedListItem = bulletedListItem;
      }
      break;
    case "numbered_list_item":
      if (blockObject.numbered_list_item) {
        const numberedListItem: NumberedListItem = {
          RichTexts:
            blockObject.numbered_list_item.rich_text.map(_buildRichText),
          Color: blockObject.numbered_list_item.color,
        };
        block.NumberedListItem = numberedListItem;
      }
      break;
    case "to_do":
      if (blockObject.to_do) {
        const toDo: ToDo = {
          RichTexts: blockObject.to_do.rich_text.map(_buildRichText),
          Checked: blockObject.to_do.checked,
          Color: blockObject.to_do.color,
        };
        block.ToDo = toDo;
      }
      break;
    case "video":
      if (blockObject.video) {
        const video: Video = {
          Caption: blockObject.video.caption?.map(_buildRichText) || [],
          Type: blockObject.video.type,
        };
        if (
          blockObject.video.type === "external" &&
          blockObject.video.external
        ) {
          video.External = { Url: blockObject.video.external.url };
        }
        block.Video = video;
      }
      break;
    case "image":
      // console.log("\n===== Image In =====");
      // console.dir(blockObject);
      if (blockObject.image) {
        const image: Image = {
          Caption: blockObject.image.caption?.map(_buildRichText) || [],
          Type: blockObject.image.type,
        };
        if (
          blockObject.image.type === "external" &&
          blockObject.image.external
        ) {
          image.External = { Url: blockObject.image.external.url };
        } else if (
          blockObject.image.type === "file" &&
          blockObject.image.file
        ) {
          image.File = {
            Type: blockObject.image.type,
            Url: blockObject.image.file.url,
            ExpiryTime: blockObject.image.file.expiry_time,
          };
        }
        block.Image = image;
        // console.log("\n===== Image Out =====");
        // console.dir(block.Image.Caption);
      }
      break;
    case "file":
      // console.log("\n===== File In =====");
      // console.dir(blockObject);
      if (blockObject.file) {
        const file: File = {
          Caption: blockObject.file.caption?.map(_buildRichText) || [],
          Type: blockObject.file.type,
        };
        if (blockObject.file.type === "external" && blockObject.file.external) {
          file.External = { Url: blockObject.file.external.url };
        } else if (blockObject.file.type === "file" && blockObject.file.file) {
          file.File = {
            Type: blockObject.file.type,
            Url: blockObject.file.file.url,
            ExpiryTime: blockObject.file.file.expiry_time,
          };
        }
        block.File = file;
        // console.log("\n===== File Out =====");
        // console.dir(block.File);
      }
      break;
    case "code":
      if (blockObject.code) {
        const code: Code = {
          Caption: blockObject.code.caption?.map(_buildRichText) || [],
          RichTexts: blockObject.code.rich_text.map(_buildRichText),
          Language: blockObject.code.language,
        };
        block.Code = code;
      }
      break;
    case "quote":
      if (blockObject.quote) {
        const quote: Quote = {
          RichTexts: blockObject.quote.rich_text.map(_buildRichText),
          Color: blockObject.quote.color,
        };
        block.Quote = quote;
      }
      break;
    case "equation":
      if (blockObject.equation) {
        const equation: Equation = {
          Expression: blockObject.equation.expression,
        };
        block.Equation = equation;
      }
      break;
    case "callout":
      if (blockObject.callout) {
        let icon: FileObject | Emoji | null = null;
        if (blockObject.callout.icon) {
          if (
            blockObject.callout.icon.type === "emoji" &&
            "emoji" in blockObject.callout.icon
          ) {
            icon = {
              Type: blockObject.callout.icon.type,
              Emoji: blockObject.callout.icon.emoji,
            };
          } else if (
            blockObject.callout.icon.type === "external" &&
            "external" in blockObject.callout.icon
          ) {
            icon = {
              Type: blockObject.callout.icon.type,
              Url: blockObject.callout.icon.external?.url || "",
            };
          }
        }

        const callout: Callout = {
          RichTexts: blockObject.callout.rich_text.map(_buildRichText),
          Icon: icon,
          Color: blockObject.callout.color,
        };
        block.Callout = callout;
      }
      break;
    case "synced_block":
      if (blockObject.synced_block) {
        let syncedFrom: SyncedFrom | null = null;
        if (
          blockObject.synced_block.synced_from &&
          blockObject.synced_block.synced_from.block_id
        ) {
          syncedFrom = {
            BlockId: blockObject.synced_block.synced_from.block_id,
          };
        }

        const syncedBlock: SyncedBlock = {
          SyncedFrom: syncedFrom,
        };
        block.SyncedBlock = syncedBlock;
      }
      break;
    case "toggle":
      if (blockObject.toggle) {
        const toggle: Toggle = {
          RichTexts: blockObject.toggle.rich_text.map(_buildRichText),
          Color: blockObject.toggle.color,
          Children: [],
        };
        block.Toggle = toggle;
      }
      break;
    case "embed":
      if (blockObject.embed) {
        const embed: Embed = {
          Url: blockObject.embed.url,
        };
        block.Embed = embed;
      }
      break;
    case "bookmark":
      if (blockObject.bookmark) {
        const bookmark: Bookmark = {
          Url: blockObject.bookmark.url,
        };
        block.Bookmark = bookmark;
      }
      break;
    case "link_preview":
      if (blockObject.link_preview) {
        const linkPreview: LinkPreview = {
          Url: blockObject.link_preview.url,
        };
        block.LinkPreview = linkPreview;
      }
      break;
    case "table":
      if (blockObject.table) {
        const table: Table = {
          TableWidth: blockObject.table.table_width,
          HasColumnHeader: blockObject.table.has_column_header,
          HasRowHeader: blockObject.table.has_row_header,
          Rows: [],
        };
        block.Table = table;
      }
      break;
    case "column_list":
      const columnList: ColumnList = {
        Columns: [],
      };
      block.ColumnList = columnList;
      break;
    case "table_of_contents":
      if (blockObject.table_of_contents) {
        const tableOfContents: TableOfContents = {
          Color: blockObject.table_of_contents.color,
        };
        block.TableOfContents = tableOfContents;
      }
      break;
    case "link_to_page":
      if (blockObject.link_to_page && blockObject.link_to_page.page_id) {
        const linkToPage: LinkToPage = {
          Type: blockObject.link_to_page.type,
          PageId: blockObject.link_to_page.page_id,
        };
        block.LinkToPage = linkToPage;
      }
      break;
    case "pdf":
      // console.dir(blockObject);
      // To do... copy from file
      // Download pdf to public folder in posts-files-downloader.ts

      // console.log("\n===== File In =====");
      // console.dir(blockObject);
      if (blockObject.pdf) {
        const file: File = {
          Caption: blockObject.pdf.caption?.map(_buildRichText) || [],
          Type: blockObject.pdf.type,
        };
        if (blockObject.pdf.type === "external" && blockObject.pdf.external) {
          file.External = { Url: blockObject.pdf.external.url };
        } else if (blockObject.pdf.type === "file" && blockObject.pdf.file) {
          file.File = {
            Type: blockObject.pdf.type,
            Url: blockObject.pdf.file.url,
            ExpiryTime: blockObject.pdf.file.expiry_time,
          };
        }
        block.File = file;
        // console.log("\n===== File Out =====");
        // console.dir(block);
      }
      break;
  }
  return block;
}

async function _getTableRows(blockId: string): Promise<TableRow[]> {
  let results: responses.BlockObject[] = [];

  if (fs.existsSync(`tmp/${blockId}.json`)) {
    results = JSON.parse(fs.readFileSync(`tmp/${blockId}.json`, "utf-8"));
  } else {
    const params: requestParams.RetrieveBlockChildren = {
      block_id: blockId,
    };

    while (true) {
      const res = await retry(
        async (bail) => {
          try {
            return (await client.blocks.children.list(
              params as any, // eslint-disable-line @typescript-eslint/no-explicit-any
            )) as responses.RetrieveBlockChildrenResponse;
          } catch (error: unknown) {
            if (error instanceof APIResponseError) {
              if (error.status && error.status >= 400 && error.status < 500) {
                bail(error);
              }
            }
            throw error;
          }
        },
        {
          retries: numberOfRetry,
        },
      );

      results = results.concat(res.results);

      if (!res.has_more) {
        break;
      }

      params["start_cursor"] = res.next_cursor as string;
    }
  }

  return results.map((blockObject) => {
    const tableRow: TableRow = {
      Id: blockObject.id,
      Type: blockObject.type,
      HasChildren: blockObject.has_children,
      Cells: [],
    };

    if (blockObject.type === "table_row" && blockObject.table_row) {
      const cells: TableCell[] = blockObject.table_row.cells.map((cell) => {
        const tableCell: TableCell = {
          RichTexts: cell.map(_buildRichText),
        };

        return tableCell;
      });

      tableRow.Cells = cells;
    }

    return tableRow;
  });
}

async function _getColumns(blockId: string): Promise<Column[]> {
  let results: responses.BlockObject[] = [];

  if (fs.existsSync(`tmp/${blockId}.json`)) {
    results = JSON.parse(fs.readFileSync(`tmp/${blockId}.json`, "utf-8"));
  } else {
    const params: requestParams.RetrieveBlockChildren = {
      block_id: blockId,
    };

    while (true) {
      const res = await retry(
        async (bail) => {
          try {
            return (await client.blocks.children.list(
              params as any, // eslint-disable-line @typescript-eslint/no-explicit-any
            )) as responses.RetrieveBlockChildrenResponse;
          } catch (error: unknown) {
            if (error instanceof APIResponseError) {
              if (error.status && error.status >= 400 && error.status < 500) {
                bail(error);
              }
            }
            throw error;
          }
        },
        {
          retries: numberOfRetry,
        },
      );

      results = results.concat(res.results);

      if (!res.has_more) {
        break;
      }

      params["start_cursor"] = res.next_cursor as string;
    }
  }

  return await Promise.all(
    results.map(async (blockObject) => {
      const children = await getAllBlocksByBlockId(blockObject.id);

      const column: Column = {
        Id: blockObject.id,
        Type: blockObject.type,
        HasChildren: blockObject.has_children,
        Children: children,
      };

      return column;
    }),
  );
}

async function _getSyncedBlockChildren(block: Block): Promise<Block[]> {
  let originalBlock: Block = block;
  if (
    block.SyncedBlock &&
    block.SyncedBlock.SyncedFrom &&
    block.SyncedBlock.SyncedFrom.BlockId
  ) {
    try {
      originalBlock = await getBlock(block.SyncedBlock.SyncedFrom.BlockId);
    } catch (err) {
      console.log(
        `Could not retrieve the original synced_block. error: ${err}`,
      );
      return [];
    }
  }

  const children = await getAllBlocksByBlockId(originalBlock.Id);
  return children;
}

function _validPageObject(pageObject: responses.PageObject): boolean {
  const prop = pageObject.properties;
  return (
    !!prop.Title.title &&
    prop.Title.title.length > 0 &&
    !!prop.Slug.rich_text &&
    prop.Slug.rich_text.length > 0 &&
    !!prop.PublishDate.date
  );
}

function _validPersonObject(pageObject: responses.PageObject): boolean {
  const prop = pageObject.properties;
  return (
    !!prop.Name.title &&
    prop.Name.title.length > 0 &&
    !!prop.Title.rich_text &&
    prop.Title.rich_text.length > 0
  );
}

function _validPartnerObject(pageObject: responses.PageObject): boolean {
  const prop = pageObject.properties;
  return !!prop.Name.title && prop.Name.title.length > 0;
}

function _validOrganizationObject(pageObject: responses.PageObject): boolean {
  const prop = pageObject.properties;
  return !!prop.Name.title && prop.Name.title.length > 0;
}

function _buildPost(pageObject: responses.PageObject): Post {
  const prop = pageObject.properties;

  let icon: FileObject | Emoji | null = null;
  if (pageObject.icon) {
    if (pageObject.icon.type === "emoji" && "emoji" in pageObject.icon) {
      icon = {
        Type: pageObject.icon.type,
        Emoji: pageObject.icon.emoji,
      };
    } else if (
      pageObject.icon.type === "external" &&
      "external" in pageObject.icon
    ) {
      icon = {
        Type: pageObject.icon.type,
        Url: pageObject.icon.external?.url || "",
      };
    }
  }

  let cover: FileObject | null = null;
  if (pageObject.cover) {
    cover = {
      Type: pageObject.cover.type,
      Url: pageObject.cover.external?.url || pageObject.cover.file?.url || "",
    };
  }

  const post: Post = {
    PageId: pageObject.id,
    Title: prop.Title.title
      ? prop.Title.title.map((richText) => richText.plain_text).join("")
      : "",
    Authors: prop.Authors.multi_select ? prop.Authors.multi_select : [],
    Category: prop.Category.select ? prop.Category.select.name : "",
    Icon: icon,
    Cover: cover,
    CoverAlt: prop.CoverAlt.rich_text
      ? prop.CoverAlt.rich_text.map((richText) => richText.plain_text).join("")
      : "",
    Slug: prop.Slug.rich_text
      ? prop.Slug.rich_text.map((richText) => richText.plain_text).join("")
      : "",
    PublishDate: prop.PublishDate.date ? prop.PublishDate.date.start : "",
    Tags: prop.Tags.multi_select ? prop.Tags.multi_select : [],
    Description:
      prop.Description.rich_text && prop.Description.rich_text.length > 0
        ? prop.Description.rich_text
            .map((richText) => richText.plain_text)
            .join("")
        : "",
  };

  return post;
}

function _buildPerson(pageObject: responses.PageObject): PersonCard {
  const prop = pageObject.properties;

  let icon: FileObject | Emoji | null = null;
  if (pageObject.icon) {
    if (pageObject.icon.type === "emoji" && "emoji" in pageObject.icon) {
      icon = {
        Type: pageObject.icon.type,
        Emoji: pageObject.icon.emoji,
      };
    } else if (
      pageObject.icon.type === "external" &&
      "external" in pageObject.icon
    ) {
      icon = {
        Type: pageObject.icon.type,
        Url: pageObject.icon.external?.url || "",
      };
    }
  }

  let cover: FileObject | null = null;
  if (pageObject.cover) {
    cover = {
      Type: pageObject.cover.type,
      Url: pageObject.cover.external?.url || pageObject.cover.file?.url || "",
    };
  }

  let photo: FileObject | null = null;
  try {
    if (prop.Photo.files && prop.Photo.files.length > 0) {
      if (prop.Photo.files[0].external) {
        photo = {
          Type: prop.Photo.type,
          Url: prop.Photo.files[0].external.url,
        };
      } else if (prop.Photo.files[0].file) {
        photo = {
          Type: prop.Photo.files[0].type,
          Url: prop.Photo.files[0].file.url,
          ExpiryTime: prop.Photo.files[0].file.expiry_time,
        };
      }
    }
  } catch (error) {
    console.log("\nError while getting a person's photo\n" + error);
  }

  const person: PersonCard = {
    PageId: pageObject.id,
    Icon: icon,
    Name: prop.Name.title // Name of person, Title of page
      ? prop.Name.title.map((richText) => richText.plain_text).join("")
      : "",
    Title: prop.Title.rich_text // Title of person (example: Prof., M.Sc., etc.)
      ? prop.Title.rich_text.map((richText) => richText.plain_text).join("")
      : "",
    Description:
      prop.Description.rich_text && prop.Description.rich_text.length > 0
        ? prop.Description.rich_text
            .map((richText) => richText.plain_text)
            .join("")
        : "",
    LinkedIn:
      prop.LinkedIn.url && prop.LinkedIn.url.length > 0
        ? new URL(prop.LinkedIn.url)
        : null,
    Email:
      prop.Email.email && prop.Email.email.length > 0 ? prop.Email.email : "",
    Photo: photo,
    Visible: prop.Visible.checkbox ? prop.Visible.checkbox : false,
    Cover: cover,
    CoverAlt: prop.CoverAlt.rich_text
      ? prop.CoverAlt.rich_text.map((richText) => richText.plain_text).join("")
      : "",
  };

  return person;
}

function _buildPartner(pageObject: responses.PageObject): PartnerCard {
  const prop = pageObject.properties;

  let icon: FileObject | Emoji | null = null;
  if (pageObject.icon) {
    if (pageObject.icon.type === "emoji" && "emoji" in pageObject.icon) {
      icon = {
        Type: pageObject.icon.type,
        Emoji: pageObject.icon.emoji,
      };
    } else if (
      pageObject.icon.type === "external" &&
      "external" in pageObject.icon
    ) {
      icon = {
        Type: pageObject.icon.type,
        Url: pageObject.icon.external?.url || "",
      };
    }
  }

  let cover: FileObject | null = null;
  if (pageObject.cover) {
    cover = {
      Type: pageObject.cover.type,
      Url: pageObject.cover.external?.url || pageObject.cover.file?.url || "",
    };
  }

  let photo: FileObject | null = null;
  try {
    if (prop.Photo.files && prop.Photo.files.length > 0) {
      if (prop.Photo.files[0].external) {
        photo = {
          Type: prop.Photo.type,
          Url: prop.Photo.files[0].external.url,
        };
      } else if (prop.Photo.files[0].file) {
        photo = {
          Type: prop.Photo.files[0].type,
          Url: prop.Photo.files[0].file.url,
          ExpiryTime: prop.Photo.files[0].file.expiry_time,
        };
      }
    }
  } catch (error) {
    console.log("\nError while getting a person's photo\n" + error);
  }

  // console.log(prop.LinkedIn.url);
  const partner: OrganizationCard = {
    PageId: pageObject.id,
    Icon: icon,
    Name: prop.Name.title // Name of person, Title of page
      ? prop.Name.title.map((richText) => richText.plain_text).join("")
      : "",
    Description:
      prop.Description.rich_text && prop.Description.rich_text.length > 0
        ? prop.Description.rich_text
            .map((richText) => richText.plain_text)
            .join("")
        : "",
    LinkedIn:
      prop.LinkedIn.url && prop.LinkedIn.url.length > 0
        ? new URL(prop.LinkedIn.url)
        : null,
    Website:
      prop.Website.url && prop.Website.url.length > 0
        ? new URL(prop.Website.url)
        : null,
    Photo: photo,
    Visible: prop.Visible.checkbox ? prop.Visible.checkbox : false,
    Cover: cover,
    CoverAlt: prop.CoverAlt.rich_text
      ? prop.CoverAlt.rich_text.map((richText) => richText.plain_text).join("")
      : "",
  };

  return partner;
}

function _buildOrganization(
  pageObject: responses.PageObject,
): OrganizationCard {
  const prop = pageObject.properties;

  let icon: FileObject | Emoji | null = null;
  if (pageObject.icon) {
    if (pageObject.icon.type === "emoji" && "emoji" in pageObject.icon) {
      icon = {
        Type: pageObject.icon.type,
        Emoji: pageObject.icon.emoji,
      };
    } else if (
      pageObject.icon.type === "external" &&
      "external" in pageObject.icon
    ) {
      icon = {
        Type: pageObject.icon.type,
        Url: pageObject.icon.external?.url || "",
      };
    }
  }

  let cover: FileObject | null = null;
  if (pageObject.cover) {
    cover = {
      Type: pageObject.cover.type,
      Url: pageObject.cover.external?.url || pageObject.cover.file?.url || "",
    };
  }

  let photo: FileObject | null = null;
  try {
    if (prop.Photo.files && prop.Photo.files.length > 0) {
      if (prop.Photo.files[0].external) {
        photo = {
          Type: prop.Photo.type,
          Url: prop.Photo.files[0].external.url,
        };
      } else if (prop.Photo.files[0].file) {
        photo = {
          Type: prop.Photo.files[0].type,
          Url: prop.Photo.files[0].file.url,
          ExpiryTime: prop.Photo.files[0].file.expiry_time,
        };
      }
    }
  } catch (error) {
    console.log("\nError while getting a person's photo\n" + error);
  }

  // console.log(prop.LinkedIn.url);
  const organization: OrganizationCard = {
    PageId: pageObject.id,
    Icon: icon,
    Name: prop.Name.title // Name of person, Title of page
      ? prop.Name.title.map((richText) => richText.plain_text).join("")
      : "",
    Description:
      prop.Description.rich_text && prop.Description.rich_text.length > 0
        ? prop.Description.rich_text
            .map((richText) => richText.plain_text)
            .join("")
        : "",
    LinkedIn:
      prop.LinkedIn.url && prop.LinkedIn.url.length > 0
        ? new URL(prop.LinkedIn.url)
        : null,
    Website:
      prop.Website.url && prop.Website.url.length > 0
        ? new URL(prop.Website.url)
        : null,
    Photo: photo,
    Visible: prop.Visible.checkbox ? prop.Visible.checkbox : false,
    Cover: cover,
    CoverAlt: prop.CoverAlt.rich_text
      ? prop.CoverAlt.rich_text.map((richText) => richText.plain_text).join("")
      : "",
  };

  return organization;
}

function _buildRichText(richTextObject: responses.RichTextObject): RichText {
  const annotation: Annotation = {
    Bold: richTextObject.annotations.bold,
    Italic: richTextObject.annotations.italic,
    Strikethrough: richTextObject.annotations.strikethrough,
    Underline: richTextObject.annotations.underline,
    Code: richTextObject.annotations.code,
    Color: richTextObject.annotations.color,
  };

  const richText: RichText = {
    Annotation: annotation,
    PlainText: richTextObject.plain_text,
    Href: richTextObject.href,
  };

  if (richTextObject.type === "text" && richTextObject.text) {
    const text: Text = {
      Content: richTextObject.text.content,
    };

    if (richTextObject.text.link) {
      text.Link = {
        Url: richTextObject.text.link.url,
      };
    }

    richText.Text = text;
  } else if (richTextObject.type === "equation" && richTextObject.equation) {
    const equation: Equation = {
      Expression: richTextObject.equation.expression,
    };
    richText.Equation = equation;
  } else if (richTextObject.type === "mention" && richTextObject.mention) {
    const mention: Mention = {
      Type: richTextObject.mention.type,
    };

    if (richTextObject.mention.type === "page" && richTextObject.mention.page) {
      const reference: Reference = {
        Id: richTextObject.mention.page.id,
      };
      mention.Page = reference;
    }

    richText.Mention = mention;
  }

  return richText;
}

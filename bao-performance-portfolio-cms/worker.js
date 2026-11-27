
const DEFAULT_CONTENT = {
  name: "Bảo Lê",
  heroKicker: "Performance Marketing · Creative Production",
  heroLead: "Digital Marketing Specialist tại DONG TAY LAND, tập trung vào Performance Marketing trong lĩnh vực bất động sản. Công việc bao gồm triển khai và tối ưu quảng cáo đa kênh, theo dõi chất lượng lead, phân tích hiệu quả chiến dịch và phối hợp sản xuất nội dung quảng cáo.",
  jobTitle: "Digital Marketing Specialist",
  experienceMeta: "DONG TAY LAND · 06/2024 — Present",
  locationMeta: "Vietnam · Real Estate",
  projects: [
    {
      title: "Performance Marketing",
      description: "Triển khai và theo dõi chiến dịch quảng cáo bất động sản trên Meta Ads, Google Ads, TikTok Ads, Microsoft Ads và các nền tảng phù hợp. Case study và số liệu sẽ được bổ sung khi có dữ liệu được phép công khai."
    },
    {
      title: "Campaign Optimization",
      description: "Theo dõi CPM, CPC, CTR, chi phí lead và chất lượng lead; phân tích tín hiệu theo dự án, nhóm quảng cáo và nội dung để đề xuất hướng tối ưu. Không công bố số liệu nội bộ khi chưa được phép."
    },
    {
      title: "Creative Production",
      description: "Hỗ trợ sản xuất nội dung quảng cáo, bao gồm quay và dựng video ngắn, biên tập nội dung và điều chỉnh định dạng cho các nền tảng digital."
    },
    {
      title: "Advertising Design",
      description: "Thiết kế và điều chỉnh banner, poster và ấn phẩm quảng cáo bằng Photoshop, Illustrator, After Effects và Canva."
    }
  ]
};


const CMS_V2_DEFAULTS = {
  schemaVersion: 2,

  heroHeadline: "Performance first. Creative by instinct.",
  heroPrimaryCTA: "Explore selected work",
  heroSecondaryCTA: "A little about me",

  avatar: "",
  cvUrl: "",

  contact: {
    email: "",
    phone: "",
    linkedin: "",
    website: "",
    headline: "Let's work together.",
    description: ""
  },

  workExperience: [],
  competencies: [],
  tools: [],
  education: [],
  certifications: []
};

function normalizeContent(saved = {}) {
  return {
    ...DEFAULT_CONTENT,
    ...CMS_V2_DEFAULTS,
    ...saved,

    schemaVersion: 2,

    contact: {
      ...CMS_V2_DEFAULTS.contact,
      ...(saved.contact || {})
    },

        projects: (
      Array.isArray(saved.projects)
        ? saved.projects
        : DEFAULT_CONTENT.projects
    ).map((project, index) => ({
      id: `project-${index + 1}`,
      title: "",
      description: "",
      image: "",
      meta: "",
      category: "",
      role: "",
      results: "",
      link: "",
      ...project,
      gallery: Array.isArray(project.gallery)
        ? project.gallery
        : []
    })),

    workExperience: Array.isArray(saved.workExperience)
      ? saved.workExperience : [],

    competencies: Array.isArray(saved.competencies)
      ? saved.competencies : [],

    tools: Array.isArray(saved.tools)
      ? saved.tools : [],

    education: Array.isArray(saved.education)
      ? saved.education : [],

    certifications: Array.isArray(saved.certifications)
      ? saved.certifications : []
  };
}

const enc = new TextEncoder();

function b64url(bytes) {
  return btoa(String.fromCharCode(...new Uint8Array(bytes)))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

async function sign(value, secret) {
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  return b64url(
    await crypto.subtle.sign("HMAC", key, enc.encode(value))
  );
}

async function validSession(req, env) {
  const cookie = req.headers.get("Cookie") || "";
  const match = cookie.match(
    /(?:^|; )bao_portfolio_session_v2=([^;]+)/
  );

  if (!match || !env.SESSION_SECRET) return false;

  const [exp, sig] = match[1].split(".");

  if (
    !exp ||
    !sig ||
    !Number.isFinite(Number(exp)) ||
    Number(exp) < Date.now()
  ) {
    return false;
  }

  return (await sign(exp, env.SESSION_SECRET)) === sig;
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff"
    }
  });
}

async function getContent(env) {
  if (!env.DB) {
    throw new Error("D1 binding DB is unavailable.");
  }

  const row = await env.DB.prepare(
    "SELECT content FROM bao_portfolio_content_v2 WHERE id=1"
  ).first();

  if (row?.content) {
    return normalizeContent(JSON.parse(row.content));
  }

  return normalizeContent(DEFAULT_CONTENT);
}


// R2 MEDIA CONFIGURATION

const MEDIA_PATTERN =
  /^\/api\/media\/([a-zA-Z0-9_-]+\.(?:jpg|png|webp|gif|pdf))$/;

const MEDIA_TYPES = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "application/pdf": "pdf"
};

function mediaKey(path) {
  const match = MEDIA_PATTERN.exec(path);
  return match ? match[1] : null;
}


function cleanText(value, max = 1000) {
  return typeof value === "string"
    ? value.trim().slice(0, max)
    : "";
}

function cleanLink(value) {
  const link = cleanText(value, 2000);

  if (!link) return "";

  try {
    const url = new URL(link);

    return ["https:", "http:"].includes(url.protocol)
      ? url.href
      : "";
  } catch {
    return "";
  }
}

function cleanList(value, max = 50) {
  if (!Array.isArray(value)) return [];

  return value
    .slice(0, max)
    .map(item => cleanText(item, 500))
    .filter(Boolean);
}

function cleanRecords(value, fields, max = 50) {
  if (!Array.isArray(value)) return [];

  return value
    .slice(0, max)
    .filter(item =>
      item &&
      typeof item === "object" &&
      !Array.isArray(item)
    )
    .map(item => {
      const record = {
        id: cleanText(item.id, 100) || crypto.randomUUID()
      };

      for (const [key, limit] of Object.entries(fields)) {
        record[key] = cleanText(item[key], limit);
      }

      return record;
    });
}


async function validateMedia(value, env, kind = "image") {
  if (value === "") return "";

  const key = mediaKey(value);

  if (!key) {
    throw new Error("Đường dẫn file không hợp lệ.");
  }

  const isPDF = key.endsWith(".pdf");

  if (kind === "image" && isPDF) {
    throw new Error("Trường này chỉ chấp nhận hình ảnh.");
  }

  if (kind === "pdf" && !isPDF) {
    throw new Error("CV phải có định dạng PDF.");
  }

  if (!env.MEDIA) {
    throw new Error("R2 chưa được cấu hình.");
  }

  const object = await env.MEDIA.head(key);

  if (!object) {
    throw new Error("File không tồn tại trong R2.");
  }

  const contentType = object.httpMetadata?.contentType;

  if (kind === "pdf" && contentType !== "application/pdf") {
    throw new Error("File CV không hợp lệ.");
  }

  if (
    kind === "image" &&
    !["image/jpeg", "image/png", "image/webp", "image/gif"]
      .includes(contentType)
  ) {
    throw new Error("Định dạng hình ảnh không hợp lệ.");
  }

  return value;
}

// ==================================================
// PORTFOLIO V2.2 - PROJECT GALLERY
// ==================================================

const MAX_PROJECT_GALLERY = 20;

async function sanitizeProjectGallery(
  value,
  env,
  previous = []
) {

  if (!Array.isArray(value)) {
    throw new Error("Dữ liệu Gallery không hợp lệ.");
  }

  if (value.length > MAX_PROJECT_GALLERY) {
    throw new Error(
      "Mỗi dự án chỉ hỗ trợ tối đa 20 ảnh."
    );
  }

  const gallery = [];
  const ids = new Set();

  const previousItems = new Map(
    previous.map(item => [item.id, item])
  );

  for (const item of value) {

    if (
      !item ||
      typeof item !== "object" ||
      Array.isArray(item)
    ) {
      throw new Error("Dữ liệu ảnh không hợp lệ.");
    }

    const id =
      cleanText(item.id, 100) ||
      crypto.randomUUID();

    if (ids.has(id)) {
      throw new Error("ID ảnh Gallery bị trùng.");
    }

    ids.add(id);

    const oldItem = previousItems.get(id);

    const image = cleanText(
      item.image,
      500
    );

    if (!image) {
      throw new Error("Ảnh Gallery không được để trống.");
    }

    const key = mediaKey(image);

    if (!key || key.endsWith(".pdf")) {
      throw new Error("Đường dẫn ảnh Gallery không hợp lệ.");
    }

    const validatedImage =
      oldItem?.image === image
        ? image
        : await validateMedia(image, env, "image");

    gallery.push({
      id,
      image: validatedImage,
      title: cleanText(item.title, 180),
      description: cleanText(item.description, 1000)
    });

  }

  return gallery;

}

// END PROJECT GALLERY
// ==================================================

// ==================================================
// PORTFOLIO V2.1 - MULTILINGUAL CONTENT
// ==================================================

function cleanTranslationFields(value, fields) {
  const result = {};

  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return result;
  }

  for (const [key, limit] of Object.entries(fields)) {
    if (Object.hasOwn(value, key)) {
      result[key] = cleanText(value[key], limit);
    }
  }

  return result;
}

function cleanTranslationRecords(
  value,
  originals,
  fields,
  allowItems = false
) {
  if (!Array.isArray(value)) return [];

  const records = [];
  const ids = new Set(
    originals.map(item => item.id)
  );

  const used = new Set();

  for (const item of value) {
    if (
      !item ||
      typeof item !== "object" ||
      Array.isArray(item)
    ) {
      continue;
    }

    const id = cleanText(item.id, 100);

    if (
      !id ||
      !ids.has(id) ||
      used.has(id)
    ) {
      continue;
    }

    used.add(id);

    const record = {
      id,
      ...cleanTranslationFields(item, fields)
    };

    if (
      allowItems &&
      Array.isArray(item.items)
    ) {
      record.items = cleanList(item.items);
    }

    records.push(record);
  }

  return records;
}

function sanitizeVietnameseContent(value, base) {
  const vi = cleanTranslationFields(value, {
    heroKicker: 180,
    heroHeadline: 300,
    heroLead: 2000,
    heroPrimaryCTA: 100,
    heroSecondaryCTA: 100,
    jobTitle: 120,
    experienceMeta: 180,
    locationMeta: 180
  });

  vi.contact = cleanTranslationFields(
    value.contact,
    {
      headline: 300,
      description: 2000
    }
  );

  vi.projects = cleanTranslationRecords(
    value.projects,
    base.projects,
    {
      title: 180,
      description: 5000,
      meta: 200,
      category: 150,
      role: 300,
      results: 3000
    }
  );

  // Project Gallery translations - V2.2

const originalProjects = new Map(
  base.projects.map(project => [
    project.id,
    project
  ])
);

const translatedProjects = new Map(
  vi.projects.map(project => [
    project.id,
    project
  ])
);

const sourceProjects = Array.isArray(value.projects)
  ? value.projects
  : [];

for (const source of sourceProjects) {

  if (
    !source ||
    typeof source !== "object" ||
    Array.isArray(source)
  ) {
    continue;
  }

  const projectId = cleanText(source.id, 100);

  const original = originalProjects.get(projectId);

  if (!original) continue;

  if (!Array.isArray(source.gallery)) continue;

  let translated = translatedProjects.get(projectId);

  if (!translated) {

    translated = {
      id: projectId
    };

    vi.projects.push(translated);

    translatedProjects.set(
      projectId,
      translated
    );

  }

  translated.gallery = cleanTranslationRecords(
    source.gallery,
    Array.isArray(original.gallery)
      ? original.gallery
      : [],
    {
      title: 180,
      description: 1000
    }
  );

}

  vi.workExperience = cleanTranslationRecords(
    value.workExperience,
    base.workExperience,
    {
      position: 200,
      period: 150,
      location: 150,
      description: 5000
    }
  );

  vi.competencies = cleanTranslationRecords(
    value.competencies,
    base.competencies,
    {
      title: 200
    },
    true
  );

  vi.tools = cleanTranslationRecords(
    value.tools,
    base.tools,
    {
      title: 200
    }
  );

  vi.education = cleanTranslationRecords(
    value.education,
    base.education,
    {
      school: 200,
      degree: 200,
      major: 200,
      period: 150,
      description: 2000
    }
  );

  vi.certifications = cleanTranslationRecords(
    value.certifications,
    base.certifications,
    {
      title: 250,
      date: 100,
      description: 2000
    }
  );

  return vi;
}

// END MULTILINGUAL CONTENT
// ==================================================


async function api(req, env, url) {

  // GET PORTFOLIO CONTENT
  if (
    url.pathname === "/api/content" &&
    req.method === "GET"
  ) {
try {
  return json(await getContent(env));
} catch (error) {
  console.error("CMS database:", error.message);

  return json({
    error: "Không thể đọc dữ liệu từ D1."
  }, 503);
}  }

  // ADMIN LOGIN
  if (
    url.pathname === "/api/login" &&
    req.method === "POST"
  ) {
    if (!env.ADMIN_PASSWORD || !env.SESSION_SECRET) {
      return json({
        error: "Admin secrets chưa được cấu hình trên Cloudflare."
      }, 503);
    }

    let body = {};

    try {
      body = await req.json();
    } catch (e) {}

    if (
      typeof body.password !== "string" ||
      body.password !== env.ADMIN_PASSWORD
    ) {
      return json({ error: "Mật khẩu không chính xác." }, 401);
    }

    const exp = String(Date.now() + 8 * 60 * 60 * 1000);
    const sig = await sign(exp, env.SESSION_SECRET);

    return new Response(JSON.stringify({ ok: true }), {
      headers: {
        "content-type": "application/json",
        "cache-control": "no-store",
        "set-cookie":
          `bao_portfolio_session_v2=${exp}.${sig}; ` +
          "HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=28800"
      }
    });
  }

  // CHECK ADMIN SESSION
  if (
    url.pathname === "/api/session" &&
    req.method === "GET"
  ) {
    return json({
      authenticated: await validSession(req, env)
    });
  }

  // ADMIN LOGOUT
  if (
    url.pathname === "/api/logout" &&
    req.method === "POST"
  ) {
    return new Response(null, {
      status: 204,
      headers: {
        "set-cookie":
          "bao_portfolio_session_v2=; HttpOnly; Secure; " +
          "SameSite=Strict; Path=/; Max-Age=0"
      }
    });
  }


  // GET MEDIA FROM R2

  if (
    url.pathname.startsWith("/api/media/") &&
    req.method === "GET"
  ) {
    const key = mediaKey(url.pathname);

    if (!key) {
      return json({
        error: "Đường dẫn file không hợp lệ."
      }, 404);
    }

    if (!env.MEDIA) {
      return json({
        error: "R2 chưa được cấu hình."
      }, 503);
    }

    const object = await env.MEDIA.get(key);

    if (!object) {
      return json({
        error: "Không tìm thấy file."
      }, 404);
    }

    const type =
      object.httpMetadata?.contentType ||
      "application/octet-stream";

    const headers = new Headers({
      "content-type": type,
      "cache-control": "public, max-age=3600",
      "x-content-type-options": "nosniff"
    });

    if (key.endsWith(".pdf")) {
      headers.set("content-type", "application/pdf");

      headers.set(
        "content-disposition",
        'attachment; filename="Le-Ngoc-Thien-Bao-CV.pdf"'
      );
    }

    return new Response(object.body, {
      headers
    });
  }

 
  // UPLOAD MEDIA TO R2

  if (
    url.pathname === "/api/media/upload" &&
    req.method === "POST"
  ) {

    // Authentication

    if (!(await validSession(req, env))) {
      return json({
        error: "Phiên đăng nhập đã hết hạn."
      }, 401);
    }

    const origin = req.headers.get("Origin");

    if (origin && origin !== url.origin) {
      return json({
        error: "Origin không hợp lệ."
      }, 403);
    }

    if (!env.MEDIA) {
      return json({
        error: "R2 binding MEDIA chưa được cấu hình."
      }, 503);
    }

    // File size configuration

    const MAX_IMAGE = 5 * 1024 * 1024;
    const MAX_PDF = 10 * 1024 * 1024;

    const len = Number(
      req.headers.get("content-length") || 0
    );

    if (len > MAX_PDF + 65536) {
      return json({
        error: "File không được vượt quá 10 MB."
      }, 413);
    }

    // Read uploaded file

    let form;

    try {
      form = await req.formData();

    } catch {
      return json({
        error: "Dữ liệu upload không hợp lệ."
      }, 400);
    }

    const file = form.get("file");

    if (!(file instanceof File)) {
      return json({
        error: "Chưa chọn file."
      }, 400);
    }

    const ext = MEDIA_TYPES[file.type];

    if (!ext) {
      return json({
        error: "Chỉ hỗ trợ JPG, PNG, WebP, GIF và PDF."
      }, 415);
    }

    const isPDF = ext === "pdf";

    const maxSize = isPDF
      ? MAX_PDF
      : MAX_IMAGE;

    if (
      file.size === 0 ||
      file.size > maxSize
    ) {
      return json({
        error: isPDF
          ? "CV PDF phải nhỏ hơn hoặc bằng 10 MB."
          : "Hình ảnh phải nhỏ hơn hoặc bằng 5 MB."
      }, 413);
    }

    // Validate actual file format

    const bytes = new Uint8Array(
      await file.arrayBuffer()
    );

    const isJpg =
      bytes[0] === 255 &&
      bytes[1] === 216 &&
      bytes[2] === 255;

    const isPng =
      bytes[0] === 137 &&
      bytes[1] === 80 &&
      bytes[2] === 78 &&
      bytes[3] === 71 &&
      bytes[4] === 13 &&
      bytes[5] === 10 &&
      bytes[6] === 26 &&
      bytes[7] === 10;

    const isWebp =
      String.fromCharCode(
        ...bytes.slice(0, 4)
      ) === "RIFF" &&
      String.fromCharCode(
        ...bytes.slice(8, 12)
      ) === "WEBP";

    const gifHeader = String.fromCharCode(
      ...bytes.slice(0, 6)
    );

    const isGif =
      gifHeader === "GIF87a" ||
      gifHeader === "GIF89a";

    const isValidPDF =
      String.fromCharCode(
        ...bytes.slice(0, 5)
      ) === "%PDF-";

    const validFormats = {
      jpg: isJpg,
      png: isPng,
      webp: isWebp,
      gif: isGif,
      pdf: isValidPDF
    };

    if (!validFormats[ext]) {
      return json({
        error: "Định dạng thực tế không khớp loại file."
      }, 415);
    }

    // Generate unique storage key

    const key = `${crypto.randomUUID()}.${ext}`;

    // Save file to R2

    try {

      await env.MEDIA.put(key, bytes, {
        httpMetadata: {
          contentType: file.type
        }
      });

      return json({
        ok: true,
        url: `/api/media/${key}`,
        type: isPDF ? "pdf" : "image",
        size: file.size
      });

    } catch (error) {

      console.error(
        "R2 upload:",
        error.message
      );

      return json({
        error: "Không thể lưu file vào R2."
      }, 503);
    }
  }

  // SAVE CONTENT TO D1 - CMS V2

  if (
    url.pathname === "/api/content" &&
    req.method === "PUT"
  ) {

    // Authentication

    if (!(await validSession(req, env))) {
      return json({
        error: "Phiên đăng nhập đã hết hạn."
      }, 401);
    }

    const origin = req.headers.get("Origin");

    if (origin && origin !== url.origin) {
      return json({
        error: "Origin không hợp lệ."
      }, 403);
    }

    // Read request data

    let data;

    try {
      const raw = await req.text();

      if (raw.length > 500000) {
        return json({
          error: "Dữ liệu vượt quá giới hạn."
        }, 413);
      }

      data = JSON.parse(raw);

    } catch {
      return json({
        error: "Dữ liệu JSON không hợp lệ."
      }, 400);
    }

    if (
      !data ||
      typeof data !== "object" ||
      Array.isArray(data)
    ) {
      return json({
        error: "Dữ liệu không hợp lệ."
      }, 400);
    }

    // Preserve existing content

    let existing;

    try {
      existing = await getContent(env);

    } catch (error) {
      console.error("CMS read:", error.message);

      return json({
        error: "Không thể đọc dữ liệu hiện tại."
      }, 503);
    }

    const has = key =>
      Object.prototype.hasOwnProperty.call(data, key);

    const clean = {
      ...existing,
      schemaVersion: 2
    };

    // Personal information and hero

    const textFields = {
      name: 100,
      heroKicker: 180,
      heroHeadline: 300,
      heroLead: 2000,
      heroPrimaryCTA: 100,
      heroSecondaryCTA: 100,
      jobTitle: 120,
      experienceMeta: 180,
      locationMeta: 180
    };

    for (const [key, limit] of Object.entries(textFields)) {
      if (has(key)) {
        clean[key] = cleanText(data[key], limit);
      }
    }

    if (!clean.name) {
      return json({
        error: "Tên hiển thị không được để trống."
      }, 400);
    }

    // Profile image

    try {
      if (has("avatar")) {
        clean.avatar = await validateMedia(
          cleanText(data.avatar, 500),
          env
        );
      }
    } catch (error) {
      return json({
        error: error.message
      }, 400);
    }

// CV document

    try {
      if (has("cvUrl")) {
        clean.cvUrl = await validateMedia(
          cleanText(data.cvUrl, 500),
          env,
          "pdf"
        );
      }

    } catch (error) {
      return json({
        error: error.message
      }, 400);
    }

    
    // Contact information

    if (
      has("contact") &&
      data.contact &&
      typeof data.contact === "object" &&
      !Array.isArray(data.contact)
    ) {
      const contact = {
        ...existing.contact
      };

      const fields = {
        email: 200,
        phone: 50,
        headline: 300,
        description: 2000
      };

      for (const [key, limit] of Object.entries(fields)) {
        if (Object.hasOwn(data.contact, key)) {
          contact[key] = cleanText(
            data.contact[key],
            limit
          );
        }
      }

      for (const key of [
        "linkedin",
        "website",
        "facebook",
        "instagram",
        "github",
        "behance",
        "tiktok",
        "youtube"
      ]) {
        if (Object.hasOwn(data.contact, key)) {
          contact[key] = cleanLink(
            data.contact[key]
          );
        }
      }

      clean.contact = contact;
    }

    // Selected work

    if (has("projects")) {

      if (
        !Array.isArray(data.projects) ||
        data.projects.length > 30
      ) {
        return json({
          error: "Chỉ hỗ trợ tối đa 30 dự án."
        }, 400);
      }

      const projects = [];
      const ids = new Set();

      try {

        for (
          let index = 0;
          index < data.projects.length;
          index++
        ) {

          const p = data.projects[index];

          if (
            !p ||
            typeof p !== "object" ||
            Array.isArray(p)
          ) {
            throw new Error("Dữ liệu dự án không hợp lệ.");
          }

          const previous = p.id
            ? existing.projects.find(
                item => item.id === p.id
              )
            : existing.projects[index];

          let id =
            cleanText(p.id, 100) ||
            previous?.id ||
            crypto.randomUUID();

          if (ids.has(id)) {
            id = crypto.randomUUID();
          }

          ids.add(id);

          const project = {
            id,
            title: "",
            description: "",
            image: "",
            meta: "",
            category: "",
            role: "",
            results: "",
            link: "",
            ...previous,
            id
          };

          const fields = {
            title: 180,
            description: 5000,
            meta: 200,
            category: 150,
            role: 300,
            results: 3000
          };

          for (const [key, limit] of Object.entries(fields)) {
            if (Object.hasOwn(p, key)) {
              project[key] = cleanText(
                p[key],
                limit
              );
            }
          }

          if (Object.hasOwn(p, "link")) {
            project.link = cleanLink(p.link);
          }

          if (Object.hasOwn(p, "image")) {
  project.image = await validateMedia(
    cleanText(p.image, 500),
    env
  );
}

// Project Gallery - V2.2

if (Object.hasOwn(p, "gallery")) {

  project.gallery = await sanitizeProjectGallery(
    p.gallery,
    env,
    Array.isArray(previous?.gallery)
      ? previous.gallery
      : []
  );

} else {

  project.gallery = Array.isArray(previous?.gallery)
    ? previous.gallery
    : [];

}

projects.push(project);
        }

      } catch (error) {
        return json({
          error: error.message
        }, 400);
      }

      clean.projects = projects;
    }

    // Work experience

    if (has("workExperience")) {
      clean.workExperience = cleanRecords(
        data.workExperience,
        {
          company: 200,
          position: 200,
          period: 150,
          location: 150,
          description: 5000
        },
        30
      );
    }

    // Core competencies

    if (has("competencies")) {
      clean.competencies = Array.isArray(data.competencies)
        ? data.competencies
            .slice(0, 20)
            .filter(group =>
              group && typeof group === "object"
            )
            .map(group => ({
              id: cleanText(group.id, 100)
                || crypto.randomUUID(),
              title: cleanText(group.title, 200),
              items: cleanList(group.items)
            }))
        : [];
    }

    // Tools and platforms

    if (has("tools")) {
      clean.tools = Array.isArray(data.tools)
        ? data.tools
            .slice(0, 20)
            .filter(group =>
              group && typeof group === "object"
            )
            .map(group => ({
              id: cleanText(group.id, 100)
                || crypto.randomUUID(),
              title: cleanText(group.title, 200),
              items: cleanList(group.items)
            }))
        : [];
    }

    // Education

    if (has("education")) {
      clean.education = cleanRecords(
        data.education,
        {
          school: 200,
          degree: 200,
          major: 200,
          period: 150,
          description: 2000
        },
        20
      );
    }

    // Certifications

    if (has("certifications")) {
      clean.certifications = cleanRecords(
        data.certifications,
        {
          title: 250,
          issuer: 200,
          date: 100,
          description: 2000
        },
        50
      );
    }


    // MULTILINGUAL CONTENT - V2.1

    const existingVI =
      existing.translations?.vi || {};

    let vietnameseContent = existingVI;

    if (has("translations")) {

      const translations = data.translations;

      if (
        !translations ||
        typeof translations !== "object" ||
        Array.isArray(translations)
      ) {
        return json({
          error: "Dữ liệu ngôn ngữ không hợp lệ."
        }, 400);
      }

      if (Object.hasOwn(translations, "vi")) {

        const vi = translations.vi;

        if (
          !vi ||
          typeof vi !== "object" ||
          Array.isArray(vi)
        ) {
          return json({
            error: "Bản dịch tiếng Việt không hợp lệ."
          }, 400);
        }

        vietnameseContent = {
          ...existingVI,
          ...vi
        };

        if (Array.isArray(vi.projects)) {

  const previousTranslations = new Map(
    (existingVI.projects || []).map(project => [
      project.id,
      project
    ])
  );

  vietnameseContent.projects = vi.projects.map(project => {

    const previous = previousTranslations.get(project.id);

    return {
      ...previous,
      ...project,
      gallery: Object.hasOwn(project, "gallery")
        ? project.gallery
        : previous?.gallery || []
    };

  });

}

        if (Object.hasOwn(vi, "contact")) {
          vietnameseContent.contact = {
            ...existingVI.contact,
            ...vi.contact
          };
        }

      }

    }

    clean.translations = {
      vi: sanitizeVietnameseContent(
        vietnameseContent,
        clean
      )
    };

    // END MULTILINGUAL CONTENT


    // Save content to D1

    try {

      await env.DB.prepare(
        "INSERT INTO bao_portfolio_content_v2 " +
        "(id,content,updated_at) " +
        "VALUES (1,?,CURRENT_TIMESTAMP) " +
        "ON CONFLICT(id) DO UPDATE SET " +
        "content=excluded.content," +
        "updated_at=CURRENT_TIMESTAMP"
      )
        .bind(JSON.stringify(clean))
        .run();

      return json({
        ok: true
      });

    } catch (error) {

      console.error("CMS save:", error.message);

      return json({
        error: "Không thể lưu dữ liệu vào D1."
      }, 503);
    }
  }


  return json({
    error: "Not found"
  }, 404);
}

// WORKER ROUTING
export default {
  async fetch(req, env) {
    const url = new URL(req.url);

    if (url.pathname.startsWith("/api/")) {
      return api(req, env, url);
    }

    if (
      url.pathname === "/admin" ||
      url.pathname === "/admin/"
    ) {
      const assetResponse = await env.ASSETS.fetch(
        new Request(
          new URL("/admin-page.txt", req.url)
        )
      );

      if (!assetResponse.ok) {
        return new Response(
          "Admin asset unavailable",
          { status: 502 }
        );
      }

      return new Response(assetResponse.body, {
        status: 200,
        headers: {
          "content-type": "text/html; charset=utf-8",
          "cache-control": "no-store",
          "x-content-type-options": "nosniff"
        }
      });
    }

    return env.ASSETS.fetch(req);
  }
};


/* =========================================
   BAO PORTFOLIO — ADMIN CMS V2
   Content Management Application
========================================= */

"use strict";

(() => {

/* =========================================
   01. CONFIGURATION
========================================= */

const API = {
  content: "/api/content",
  login: "/api/login",
  logout: "/api/logout",
  session: "/api/session",
  upload: "/api/media/upload"
};

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_PDF_SIZE = 10 * 1024 * 1024;
const MAX_PROJECT_GALLERY = 20;


const VIDEO_PLATFORMS = {
  tiktok: "TikTok",
  youtube: "YouTube",
  facebook: "Facebook",
  instagram: "Instagram",
  vimeo: "Vimeo",
  mp4: "Direct MP4"
};


const IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif"
];

const SECTIONS = {
  overview: "Overview",
  personal: "Personal Information",
  hero: "Hero Section",
  projects: "Selected Work",
  experience: "Work Experience",
  competencies: "Core Competencies",
  tools: "Tools & Platforms",
  education: "Education",
  certifications: "Certifications",
  contact: "Contact & Social",
  cv: "CV Management"
};

const LIMITS = {
  projects: 30,
  workExperience: 30,
  competencies: 20,
  tools: 20,
  education: 20,
  certifications: 50
};


/* =========================================
   02. APPLICATION STATE
========================================= */

const state = {
  language: "en",
  content: null,
  original: null,
  section: "overview",
  dirty: false,
  saving: false,
  activeUploads: 0,
  authenticated: false,
  loading: false,
  loggingOut: false
};

const $ = selector =>
  document.querySelector(selector);

const $$ = selector =>
  [...document.querySelectorAll(selector)];

const clone = value =>
  JSON.parse(JSON.stringify(value));

const uid = () =>
  crypto.randomUUID();

function isBusy() {
  return (
    state.saving ||
    state.loading ||
    state.loggingOut ||
    state.activeUploads > 0
  );
}


/* =========================================
   03. DOM UTILITIES
========================================= */

function el(tag, className = "", text = "") {
  const node = document.createElement(tag);

  if (className) {
    node.className = className;
  }

  if (text !== "") {
    node.textContent = text;
  }

  return node;
}

function button(text, className, handler) {
  const node = el(
    "button",
    className || "btn btn-outline",
    text
  );

  node.type = "button";

  if (handler) {
    node.addEventListener("click", handler);
  }

  return node;
}

function link(text, href, className = "") {
  const node = el(
    "a",
    className || "btn btn-outline",
    text
  );

  node.href = href;
  node.target = "_blank";
  node.rel = "noopener noreferrer";

  return node;
}

function show(node) {
  if (node) {
    node.classList.remove("hidden");
  }
}

function hide(node) {
  if (node) {
    node.classList.add("hidden");
  }
}

function setText(selector, value) {
  const node = $(selector);

  if (node) {
    node.textContent = value;
  }
}

function setStatus(node, message, type = "") {
  if (!node) return;

  node.textContent = message;
  node.className = "status";

  if (type) {
    node.classList.add(type);
  }

  if (!message) {
    hide(node);
  }
}


/* =========================================
   04. API CLIENT
========================================= */

async function request(path, options = {}) {
  const response = await fetch(path, {
    credentials: "same-origin",
    cache: "no-store",
    ...options
  });

  if (response.status === 204) {
    return { ok: true };
  }

  let data;

  try {
    data = await response.json();

  } catch {
    throw new Error(
      "Máy chủ trả về dữ liệu không hợp lệ."
    );
  }

  if (!response.ok) {
    const error = new Error(
      data.error ||
      `Yêu cầu thất bại (${response.status}).`
    );

    error.status = response.status;

    throw error;
  }

  return data;
}

function jsonOptions(method, data) {
  return {
    method,
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify(data)
  };
}


/* =========================================
   05. DATA NORMALIZATION
========================================= */

function normalizeContent(data = {}) {
  const result = {
    ...data,

    schemaVersion: 2,

    name: data.name || "",
    jobTitle: data.jobTitle || "",
    experienceMeta: data.experienceMeta || "",
    locationMeta: data.locationMeta || "",

    heroKicker: data.heroKicker || "",
    heroHeadline: data.heroHeadline || "",
    heroLead: data.heroLead || "",
    heroPrimaryCTA: data.heroPrimaryCTA || "",
    heroSecondaryCTA: data.heroSecondaryCTA || "",

    avatar: data.avatar || "",
    cvUrl: data.cvUrl || "",

    contact: {
      email: "",
      phone: "",
      headline: "",
      description: "",
      linkedin: "",
      website: "",
      facebook: "",
      instagram: "",
      github: "",
      behance: "",
      tiktok: "",
      youtube: "",
      ...(data.contact || {})
    }
  };

  for (const key of Object.keys(LIMITS)) {
    const ids = new Set();

    result[key] = Array.isArray(data[key])
      ? data[key].map(item => {
          let id = item.id || uid();

          if (ids.has(id)) {
            id = uid();
          }

          ids.add(id);

          return {
            ...item,
            id
          };
        })
      : [];
  }

    
// Project Gallery - V2.3

result.projects = result.projects.map(project => {

  const ids = new Set();

  const gallery = Array.isArray(project.gallery)
    ? project.gallery
    : [];

  return {
    ...project,

    gallery: gallery
      .filter(item =>
        item &&
        typeof item === "object" &&
        !Array.isArray(item)
      )
      .map(item => {

        let id = item.id || uid();

        if (ids.has(id)) {
          id = uid();
        }

        ids.add(id);

        const type = item.type === "video"
          ? "video"
          : "image";

        const record = {
          id,
          type,
          image: item.image || "",
          title: item.title || "",
          description: item.description || ""
        };

        if (type === "video") {

          record.platform =
            item.platform || "tiktok";

          record.videoUrl =
            item.videoUrl || "";

        }

        return record;

      })
  };

});

  for (const key of ["competencies", "tools"]) {
    result[key] = result[key].map(group => ({
      ...group,

      items: Array.isArray(group.items)
        ? group.items.filter(
            item => typeof item === "string"
          )
        : []
    }));
  }

  return result;
}


/* =========================================
   06. TOAST NOTIFICATIONS
========================================= */

function toast(message, type = "success") {
  const container = $("#toastContainer");

  if (!container) return;

  const node = el(
    "div",
    `toast ${type}`
  );

  node.setAttribute("role", "status");

  const symbol = {
    success: "✓",
    error: "!",
    warning: "!"
  };

  const icon = el(
    "strong",
    "",
    symbol[type] || "•"
  );

  const content = el(
    "div",
    "",
    message
  );

  const close = button(
    "×",
    "toast-close",
    () => node.remove()
  );

  close.setAttribute(
    "aria-label",
    "Đóng thông báo"
  );

  node.append(icon, content, close);

  container.append(node);

  setTimeout(() => {
    node.remove();
  }, type === "error" ? 9000 : 4500);
}


/* =========================================
   07. UNSAVED CHANGES
========================================= */

function markDirty() {
  state.dirty = true;

  syncUI();
}

function syncUI() {
  const save = $("#save");
  const logout = $("#logout");
  const indicator = $("#saveIndicator");

  if (save) {
    save.disabled =
      !state.authenticated ||
      !state.content ||
      !state.dirty ||
      isBusy();

    save.textContent = state.saving
      ? "Đang lưu..."
      : "Save changes";
  }

  if (logout) {
    logout.disabled = isBusy();
  }

  if (indicator) {
    indicator.classList.toggle(
      "dirty",
      state.dirty
    );

    indicator.classList.toggle(
      "saving",
      state.saving
    );

    indicator.textContent = state.saving
      ? "Saving..."
      : state.activeUploads > 0
        ? "Uploading..."
        : state.dirty
          ? "Unsaved changes"
          : "All changes saved";
  }
}

function lockEditor() {
  const controls = $$(
    "#sectionContent input, " +
    "#sectionContent textarea, " +
    "#sectionContent select, " +
    "#sectionContent button"
  );

  const previous = controls.map(
    control => control.disabled
  );

  controls.forEach(control => {
    control.disabled = true;
  });

  return () => {
    controls.forEach((control, index) => {
      control.disabled = previous[index];
    });
  };
}


/* =========================================
   08. AUTHENTICATION
========================================= */

async function loadContent() {
  state.loading = true;

  syncUI();

  try {
    const data = await request(API.content);

    state.content = normalizeContent(data);

    state.original = clone(state.content);

    state.dirty = false;

  } finally {
    state.loading = false;

    syncUI();
  }
}

function showDashboard() {
  state.authenticated = true;

  hide($("#loginPanel"));
  show($("#editor"));

  navigate("overview");

  syncUI();
}

async function checkSession() {
  state.loading = true;

  $("#loginButton").disabled = true;

  try {
    const data = await request(API.session);

    if (data.authenticated) {
      await loadContent();

      showDashboard();
    }

  } catch (error) {
    setStatus(
      $("#loginStatus"),
      error.message,
      "error"
    );

  } finally {
    state.loading = false;

    $("#loginButton").disabled = false;

    syncUI();
  }
}

async function login(event) {
  event.preventDefault();

  if (isBusy()) return;

  const password = $("#password");

  if (!password.value) {
    setStatus(
      $("#loginStatus"),
      "Vui lòng nhập mật khẩu.",
      "error"
    );

    return;
  }

  $("#loginButton").disabled = true;

  state.loading = true;

  setStatus(
    $("#loginStatus"),
    "Đang xác thực..."
  );

  try {
    await request(
      API.login,
      jsonOptions("POST", {
        password: password.value
      })
    );

    password.value = "";

    await loadContent();

    setStatus($("#loginStatus"), "");

    showDashboard();

    toast("Đăng nhập thành công.");

  } catch (error) {
    setStatus(
      $("#loginStatus"),
      error.message,
      "error"
    );

  } finally {
    state.loading = false;

    $("#loginButton").disabled = false;

    syncUI();
  }
}

async function logout() {
  if (isBusy()) return;

  if (
    state.dirty &&
    !confirm(
      "Bạn có thay đổi chưa lưu. " +
      "Vẫn muốn đăng xuất?"
    )
  ) {
    return;
  }

  state.loggingOut = true;

  const unlock = lockEditor();

  syncUI();

  try {
    await request(API.logout, {
      method: "POST"
    });

    state.dirty = false;
    state.authenticated = false;

    location.reload();

  } catch (error) {
    toast(error.message, "error");

  } finally {
    state.loggingOut = false;

    unlock();

    syncUI();
  }
}


/* =========================================
   09. SIDEBAR NAVIGATION
========================================= */

function toggleSidebar(open) {
  const sidebar = $("#sidebar");
  const overlay = $("#sidebarOverlay");
  const toggle = $("#menuToggle");

  if (sidebar) {
    sidebar.classList.toggle("open", open);
  }

  if (overlay) {
    overlay.classList.toggle("active", open);
  }

  if (toggle) {
    toggle.setAttribute(
      "aria-expanded",
      String(open)
    );
  }
}

function navigate(section) {
  if (!state.content) return;

  if (isBusy()) {
    toast(
      "Vui lòng chờ thao tác hiện tại hoàn tất.",
      "warning"
    );

    return;
  }

  if (!Object.hasOwn(SECTIONS, section)) {
    section = "overview";
  }

  state.section = section;

  $$(".nav-item[data-section]").forEach(node => {
    const active =
      node.dataset.section === section;

    node.classList.toggle("active", active);

    if (active) {
      node.setAttribute(
        "aria-current",
        "page"
      );

    } else {
      node.removeAttribute("aria-current");
    }
  });

  setText(
    "#currentSection",
    SECTIONS[section]
  );

  toggleSidebar(false);

  renderSection();

  window.scrollTo({
    top: 0,
    behavior: "auto"
  });
}


/* =========================================
   10. FORM COMPONENTS
========================================= */

function field(
  label,
  value,
  onChange,
  options = {}
) {
  const wrap = el(
    "div",
    "field" +
    (options.full ? " full-width" : "")
  );

  const id = `field-${uid()}`;

  const labelNode = el(
    "label",
    "",
    label
  );

  labelNode.htmlFor = id;

  const input = options.multiline
    ? el("textarea")
    : el("input");

  input.id = id;

  if (!options.multiline) {
    input.type = options.type || "text";
  }

  if (options.max) {
    input.maxLength = options.max;
  }

  if (options.placeholder) {
    input.placeholder = options.placeholder;
  }

  if (options.large) {
    input.classList.add("large");
  }

  input.value = value ?? "";

  input.addEventListener("input", () => {
    onChange(input.value);

    markDirty();
  });

  wrap.append(labelNode, input);

  if (options.hint) {
    wrap.append(
      el(
        "div",
        "field-hint",
        options.hint
      )
    );
  }

  return wrap;
}

// =========================================
// MULTILINGUAL CMS ENGINE — V2.1
// =========================================

const TRANSLATABLE_FIELDS = {

  personal: [
    "jobTitle",
    "experienceMeta",
    "locationMeta"
  ],

  hero: [
    "heroKicker",
    "heroHeadline",
    "heroLead",
    "heroPrimaryCTA",
    "heroSecondaryCTA"
  ],

  projects: [
    "title",
    "category",
    "meta",
    "role",
    "description",
    "results"
  ],

  workExperience: [
    "position",
    "period",
    "location",
    "description"
  ],

  competencies: [
    "title"
  ],

  tools: [
    "title"
  ],

  education: [
    "school",
    "degree",
    "major",
    "period",
    "description"
  ],

  certifications: [
    "title",
    "date",
    "description"
  ],

  contact: [
    "headline",
    "description"
  ]

};


function getVietnameseContent() {

  const data = state.content;

  if (!data.translations) {
    data.translations = {};
  }

  if (!data.translations.vi) {
    data.translations.vi = {};
  }

  return data.translations.vi;

}


function getTranslationTarget(
  object,
  key,
  create = false
) {

  const data = state.content;

  let group = "";

  if (object === data) {

    const allowed = [
      ...TRANSLATABLE_FIELDS.personal,
      ...TRANSLATABLE_FIELDS.hero
    ];

    if (!allowed.includes(key)) {
      return null;
    }

    return create
      ? getVietnameseContent()
      : data.translations?.vi || {};

  }

  if (object === data.contact) {

    if (
      !TRANSLATABLE_FIELDS.contact.includes(key)
    ) {
      return null;
    }

    if (!create) {
      return data.translations?.vi?.contact || {};
    }

    const vi = getVietnameseContent();

    vi.contact ||= {};

    return vi.contact;

  }

  for (const name of Object.keys(LIMITS)) {

    if (data[name].includes(object)) {

      group = name;

      break;

    }

  }

  if (
    !group ||
    !TRANSLATABLE_FIELDS[group]?.includes(key)
  ) {
    return null;
  }

  if (!create) {

    const records =
      data.translations?.vi?.[group];

    return Array.isArray(records)
      ? records.find(
          record => record.id === object.id
        ) || {}
      : {};

  }

  const vi = getVietnameseContent();

  if (!Array.isArray(vi[group])) {
    vi[group] = [];
  }

  let translated = vi[group].find(
    record => record.id === object.id
  );

  if (!translated) {

    translated = {
      id: object.id
    };

    vi[group].push(translated);

  }

  return translated;

}


function renderLanguageSwitcher() {

  const panel = el(
    "div",
    "admin-language-panel"
  );

  const heading = el(
    "div",
    "admin-language-heading"
  );

  heading.append(
    el(
      "strong",
      "",
      "Content language"
    ),
    el(
      "p",
      "admin-language-description",
      "Manage English and Vietnamese content independently."
    )
  );

  const controls = el(
    "div",
    "admin-language-switcher"
  );

  controls.setAttribute("role", "group");

  controls.setAttribute(
    "aria-label",
    "Content language"
  );

  for (const [language, label] of [
    ["en", "English (EN)"],
    ["vi", "Tiếng Việt (VI)"]
  ]) {

    const active =
      state.language === language;

    const control = button(
      label,
      "admin-language-button" +
      (active ? " is-active" : ""),
      () => {

        if (isBusy()) return;

        if (state.language === language) {
          return;
        }

        state.language = language;

        renderSection();

      }
    );

    control.setAttribute(
      "aria-pressed",
      String(active)
    );


    controls.append(control);

  }

  panel.append(heading, controls);

  if (state.language === "vi") {

    panel.append(
      el(
        "div",
        "admin-language-note",
        "Blank Vietnamese fields use English content. Shared fields and record actions affect both languages."
      )
    );

  }

  return panel;

}


function translatedField(
  object,
  key,
  label,
  options = {}
) {

  const target = getTranslationTarget(
    object,
    key
  );

  // Shared content

  if (target === null) {

    return field(
      `${label} · Shared`,
      object[key],
      value => {
        object[key] = value;
      },
      options
    );

  }

  // English content

  if (state.language === "en") {

    return field(
      `${label} · EN`,
      object[key],
      value => {
        object[key] = value;
      },
      options
    );

  }

  // Vietnamese content

  return field(
    `${label} · VI`,
    target[key] || "",
    value => {

      const translated =
        getTranslationTarget(
          object,
          key,
          true
        );

      translated[key] = value;

    },
    {
      ...options,

      placeholder:
        object[key] ||
        options.placeholder ||
        "Enter Vietnamese content",

      hint:
        "Leave blank to use English content."
    }
  );

}


function removeRecordTranslation(
  key,
  id
) {

  const vi =
    state.content.translations?.vi;

  if (!Array.isArray(vi?.[key])) {
    return;
  }

  vi[key] = vi[key].filter(
    record => record.id !== id
  );

}


function renderTranslatedSkills(group) {

  const records =
    state.content.translations?.vi?.competencies;

  const translated = Array.isArray(records)
    ? records.find(
        record => record.id === group.id
      )
    : null;

  const items = Array.isArray(translated?.items)
    ? translated.items
    : [];

  return field(
    "Skills · VI (one item per line)",
    items.join("\n"),
    value => {

      const target = getTranslationTarget(
        group,
        "title",
        true
      );

      target.items = value
        .split("\n")
        .map(item => item.trim())
        .filter(Boolean)
        .slice(0, 50)
        .map(item => item.slice(0, 500));

    },
    {
      multiline: true,
      large: true,
      placeholder: group.items.join("\n"),
      hint: "Enter one translated skill per line. Leave blank to use the English skill list."
    }
  );

}

// =========================================
// END MULTILINGUAL CMS ENGINE
// =========================================


function boundField(
  object,
  key,
  label,
  options = {}
) {
  return translatedField(
    object,
    key,
    label,
    options
  );
}

function pageHeading(title, description) {
  const heading = el(
    "div",
    "page-heading"
  );

  const content = el("div");

  content.append(
    el("h1", "", title),
    el("p", "page-description", description)
  );

  heading.append(content);

  return heading;
}

function card(title, description = "") {
  const node = el("div", "card");

  if (title) {
    const header = el(
      "div",
      "card-header"
    );

    const content = el("div");

    content.append(
      el("h2", "", title)
    );

    if (description) {
      content.append(
        el(
          "p",
          "card-description",
          description
        )
      );
    }

    header.append(content);

    node.append(header);
  }

  return node;
}

function emptyState(title, description) {
  const node = el(
    "div",
    "empty-state"
  );

  node.append(
    el("div", "empty-icon", "＋"),
    el("h3", "", title),
    el("p", "", description)
  );

  return node;
}


/* =========================================
   11. MEDIA VALIDATION & UPLOAD
========================================= */

function validMediaUrl(url, kind = "image") {
  if (typeof url !== "string") {
    return false;
  }

  if (kind === "pdf") {
    return /^\/api\/media\/[a-zA-Z0-9_-]+\.pdf$/
      .test(url);
  }

  return /^\/api\/media\/[a-zA-Z0-9_-]+\.(jpg|png|webp|gif)$/
    .test(url);
}

async function uploadMedia(file, kind) {
  if (!file) {
    throw new Error("Bạn chưa chọn file.");
  }

  const isPDF = kind === "pdf";

  const maxSize = isPDF
    ? MAX_PDF_SIZE
    : MAX_IMAGE_SIZE;

  const validType = isPDF
    ? file.type === "application/pdf"
    : IMAGE_TYPES.includes(file.type);

  if (!validType) {
    throw new Error(
      isPDF
        ? "Chỉ hỗ trợ file PDF."
        : "Chỉ hỗ trợ JPG, PNG, WebP và GIF."
    );
  }

  if (
    file.size === 0 ||
    file.size > maxSize
  ) {
    throw new Error(
      isPDF
        ? "CV PDF tối đa 10 MB."
        : "Hình ảnh tối đa 5 MB."
    );
  }

  const form = new FormData();

  form.append("file", file);

  const result = await request(
    API.upload,
    {
      method: "POST",
      body: form
    }
  );

  if (!validMediaUrl(result.url, kind)) {
    throw new Error(
      "Đường dẫn file trả về không hợp lệ."
    );
  }

  return result.url;
}


/* =========================================
   12. MEDIA EDITOR COMPONENT
========================================= */

function mediaEditor(
  object,
  key,
  options = {}
) {
  const kind = options.kind || "image";

  const isPDF = kind === "pdf";

  const panel = el(
    "div",
    "media-panel"
  );

  const title = el(
    "div",
    "media-title",
    options.title || "Hình ảnh"
  );

  const preview = el(
    "div",
    isPDF
      ? "cv-card"
      : "image-preview" +
        (options.avatar
          ? " avatar-preview"
          : "")
  );

  const input = el("input", "hidden");

  input.type = "file";

  input.accept = isPDF
    ? "application/pdf,.pdf"
    : IMAGE_TYPES.join(",");

  const actions = el(
    "div",
    "media-actions"
  );

  const uploadButton = button(
    "Upload",
    "btn btn-primary btn-sm",
    () => {
      if (!isBusy()) {
        input.click();
      }
    }
  );

  const removeButton = button(
    "Gỡ file",
    "btn btn-danger btn-sm",
    () => {
      if (isBusy()) return;

      if (!confirm(
        "Bạn muốn gỡ file hiện tại?"
      )) {
        return;
      }

      object[key] = "";

      markDirty();

      renderPreview();

      setStatus(
        mediaStatus,
        "Đã gỡ liên kết. Nhấn Save changes để xác nhận.",
        "warning"
      );
    }
  );

  const mediaStatus = el(
    "div",
    "status hidden"
  );

  const progress = el(
    "div",
    "progress-track hidden"
  );

  progress.append(
    el(
      "div",
      "progress-bar indeterminate"
    )
  );

  function renderPreview() {
    preview.replaceChildren();

    const url = object[key];

    const hasFile = validMediaUrl(
      url,
      kind
    );

    if (hasFile && isPDF) {
      const icon = el(
        "div",
        "pdf-icon",
        "PDF"
      );

      const info = el(
        "div",
        "cv-info"
      );

      info.append(
        el(
          "h3",
          "",
          "Portfolio CV.pdf"
        ),
        el(
          "p",
          "",
          "Tài liệu PDF"
        ),
        link(
          "Tải xuống ↗",
          url,
          "btn btn-outline btn-sm"
        )
      );

      preview.append(icon, info);

    } else if (hasFile) {
      const image = el("img");

      image.alt =
        options.title || "Ảnh xem trước";

      image.addEventListener(
        "error",
        () => {
          setStatus(
            mediaStatus,
            "Không tải được ảnh xem trước.",
            "error"
          );
        }
      );

      image.src = url;

      preview.append(image);

    } else {
      preview.append(
        el(
          "div",
          "placeholder",
          isPDF
            ? "Chưa có CV PDF"
            : "Chưa có hình ảnh"
        )
      );
    }

    uploadButton.textContent = hasFile
      ? isPDF
        ? "Thay CV"
        : "Thay ảnh"
      : isPDF
        ? "Upload CV"
        : "Upload ảnh";

    removeButton.textContent = isPDF
      ? "Gỡ CV"
      : "Gỡ ảnh";

    removeButton.classList.toggle(
      "hidden",
      !hasFile
    );
  }

  input.addEventListener(
    "change",
    async () => {
      const file = input.files[0];

      if (!file || isBusy()) {
        input.value = "";

        return;
      }

      state.activeUploads++;

      uploadButton.disabled = true;
      removeButton.disabled = true;

      show(progress);

      syncUI();

      setStatus(
        mediaStatus,
        "Đang upload lên Cloudflare R2..."
      );

      try {
        const url = await uploadMedia(
          file,
          kind
        );

        object[key] = url;

        markDirty();

        renderPreview();

        setStatus(
          mediaStatus,
          "Upload thành công. " +
          "Nhấn Save changes để lưu.",
          "success"
        );

        toast("Upload thành công.");

      } catch (error) {
        setStatus(
          mediaStatus,
          error.message,
          "error"
        );

        toast(error.message, "error");

      } finally {
        state.activeUploads--;

        uploadButton.disabled = false;
        removeButton.disabled = false;

        input.value = "";

        hide(progress);

        syncUI();
      }
    }
  );

  actions.append(
    uploadButton,
    removeButton
  );

  panel.append(
    title,
    preview,
    input,
    actions,
    el(
      "p",
      "media-note",
      isPDF
        ? "PDF · Tối đa 10 MB."
        : "JPG, PNG, WebP, GIF · Tối đa 5 MB."
    ),
    progress,
    mediaStatus
  );

  renderPreview();

  return panel;
}


/* =========================================
   13. OVERVIEW DASHBOARD
========================================= */

function statCard(label, value, caption) {
  const node = el(
    "div",
    "stat-card"
  );

  const top = el(
    "div",
    "stat-top"
  );

  top.append(
    el("div", "stat-label", label)
  );

  node.append(
    top,
    el(
      "div",
      "stat-value",
      String(value).padStart(2, "0")
    ),
    el(
      "div",
      "stat-caption",
      caption
    )
  );

  return node;
}

function renderOverview(root) {
  const data = state.content;

  root.append(
    pageHeading(
      "Portfolio Dashboard",
      "Manage your professional profile, " +
      "projects and portfolio content."
    )
  );

  const stats = el(
    "div",
    "stats-grid"
  );

  stats.append(
    statCard(
      "Selected Work",
      data.projects.length,
      "Portfolio projects"
    ),
    statCard(
      "Work Experience",
      data.workExperience.length,
      "Career records"
    ),
    statCard(
      "Core Competencies",
      data.competencies.reduce(
        (sum, group) =>
          sum + group.items.length,
        0
      ),
      "Professional skills"
    ),
    statCard(
      "Certifications",
      data.certifications.length,
      "Professional credentials"
    )
  );

  root.append(stats);

  const grid = el(
    "div",
    "dashboard-grid"
  );

  const profile = card(
    "Professional Profile"
  );

  const summary = el(
    "div",
    "profile-summary"
  );

  const avatar = el(
    "div",
    "profile-avatar"
  );

  if (validMediaUrl(data.avatar)) {
    const image = el("img");

    image.src = data.avatar;
    image.alt = "Profile avatar";

    avatar.append(image);

  } else {
    avatar.textContent = data.name
      ? data.name.trim().charAt(0).toUpperCase()
      : "B";
  }

  const info = el(
    "div",
    "profile-info"
  );

  info.append(
    el("h3", "", data.name || "Your name"),
    el("p", "", data.jobTitle || ""),
    el("p", "", data.locationMeta || "")
  );

  summary.append(
    avatar,
    info
  );

  profile.append(
    summary,
    el("div", "divider"),
    button(
      "Edit profile",
      "btn btn-outline",
      () => navigate("personal")
    )
  );

  const quick = card(
    "Quick Actions"
  );

  const actions = el(
    "div",
    "quick-actions"
  );

  for (const [label, section] of [
    ["Manage projects", "projects"],
    ["Update work experience", "experience"],
    ["Manage CV document", "cv"],
    ["Update contact information", "contact"]
  ]) {
    actions.append(
      button(
        `${label} →`,
        "quick-action",
        () => navigate(section)
      )
    );
  }

  quick.append(actions);

  grid.append(profile, quick);

  root.append(grid);

  const system = card(
    "CMS Information"
  );

  const status = el(
    "div",
    "system-status"
  );

  const detail = el("div");

  detail.append(
    el(
      "strong",
      "",
      "Content loaded successfully"
    ),
    el(
      "p",
      "",
      "Cloudflare Worker · D1 Database · R2 Storage"
    ),
    el(
      "p",
      "",
      validMediaUrl(data.cvUrl, "pdf")
        ? "CV document: Available"
        : "CV document: Not uploaded"
    )
  );

  status.append(
    el("span", "status-dot"),
    detail
  );

  system.append(status);

  root.append(system);
}


/* =========================================
   14. PERSONAL INFORMATION
========================================= */

function renderPersonal(root) {
  const data = state.content;

  root.append(
    pageHeading(
      "Personal Information",
      "Manage your professional identity."
    )
  );

  const panel = card(
    "Profile Details"
  );

  const grid = el(
    "div",
    "project-grid"
  );

  const fields = el("div");

  fields.append(
    boundField(
      data,
      "name",
      "Display name",
      { max: 100 }
    ),
    boundField(
      data,
      "jobTitle",
      "Professional title",
      { max: 120 }
    ),
    boundField(
      data,
      "experienceMeta",
      "Current experience",
      { max: 180 }
    ),
    boundField(
      data,
      "locationMeta",
      "Location",
      { max: 180 }
    )
  );

  grid.append(
    fields,
    mediaEditor(
      data,
      "avatar",
      {
        title: "Profile Avatar",
        avatar: true
      }
    )
  );

  panel.append(grid);

  root.append(panel);
}


/* =========================================
   15. HERO SECTION
========================================= */

function renderHero(root) {
  const data = state.content;

  root.append(
    pageHeading(
      "Hero Section",
      "Manage the first impression of your portfolio."
    )
  );

  const panel = card(
    "Hero Content"
  );

  panel.append(
    boundField(
      data,
      "heroKicker",
      "Hero kicker",
      { max: 180 }
    ),
    boundField(
      data,
      "heroHeadline",
      "Main headline",
      {
        max: 300,
        multiline: true
      }
    ),
    boundField(
      data,
      "heroLead",
      "Professional summary",
      {
        max: 2000,
        multiline: true,
        large: true
      }
    )
  );

  const grid = el(
    "div",
    "form-grid"
  );

  grid.append(
    boundField(
      data,
      "heroPrimaryCTA",
      "Primary CTA",
      { max: 100 }
    ),
    boundField(
      data,
      "heroSecondaryCTA",
      "Secondary CTA",
      { max: 100 }
    )
  );

  panel.append(grid);

  root.append(panel);
}


/* =========================================
   16. REPEATABLE RECORD UTILITIES
========================================= */

function addRecord(key, record) {
  if (isBusy()) return;

  const list = state.content[key];

  if (list.length >= LIMITS[key]) {
    toast(
      `Chỉ hỗ trợ tối đa ${LIMITS[key]} mục.`,
      "warning"
    );

    return;
  }

  list.push({
  id: uid(),
  ...record
});

state.language = "en";

markDirty();

renderSection();

  const cards = $$(".record-card");

  cards.at(-1)?.scrollIntoView({
    behavior: "smooth",
    block: "nearest"
  });
}

function removeRecord(key, index) {
  if (isBusy()) return;

  if (!confirm(
    "Bạn có chắc muốn xóa mục này? " +
    "Thay đổi chỉ có hiệu lực sau khi lưu."
  )) {
    return;
  }

  const removedRecord =
  state.content[key][index];

if (removedRecord) {

  removeRecordTranslation(
    key,
    removedRecord.id
  );

}

state.content[key].splice(index, 1);

  markDirty();

  renderSection();
}

function moveRecord(key, index, direction) {
  if (isBusy()) return;

  const list = state.content[key];

  const target = index + direction;

  if (
    target < 0 ||
    target >= list.length
  ) {
    return;
  }

  [list[index], list[target]] = [
    list[target],
    list[index]
  ];

  markDirty();

  renderSection();
}

function recordHeader(
  key,
  index,
  title
) {
  const header = el(
    "div",
    "record-header"
  );

  const heading = el(
    "div",
    "record-heading"
  );

  heading.append(
    el(
      "span",
      "record-number",
      String(index + 1).padStart(2, "0")
    ),
    el(
      "h3",
      "record-title",
      title
    )
  );

  const actions = el(
    "div",
    "record-actions"
  );

  const up = button(
    "↑",
    "icon-button",
    () => moveRecord(key, index, -1)
  );

  up.title = "Move up";

  up.setAttribute(
    "aria-label",
    "Di chuyển lên"
  );

  up.disabled = index === 0;

  const down = button(
    "↓",
    "icon-button",
    () => moveRecord(key, index, 1)
  );

  down.title = "Move down";

  down.setAttribute(
    "aria-label",
    "Di chuyển xuống"
  );

  down.disabled =
    index === state.content[key].length - 1;

  const remove = button(
    "Delete",
    "btn btn-danger btn-sm",
    () => removeRecord(key, index)
  );

  actions.append(
    up,
    down,
    remove
  );

  header.append(
    heading,
    actions
  );

  return header;
}

function addButton(label, handler) {
  return button(
    `＋ ${label}`,
    "add-item",
    handler
  );
}


/* =========================================
   16A. PROJECT GALLERY EDITOR — V2.3
========================================= */

function getGalleryTranslation(
  project,
  item,
  create = false
) {

  const target = getTranslationTarget(
    project,
    "title",
    create
  );

  if (!target) return {};

  if (!Array.isArray(target.gallery)) {

    if (!create) return {};

    target.gallery = [];

  }

  let translated = target.gallery.find(
    record => record.id === item.id
  );

  if (!translated && create) {

    translated = {
      id: item.id,
      title: "",
      description: ""
    };

    target.gallery.push(translated);

  }

  return translated || {};

}


function galleryField(
  project,
  item,
  key,
  label,
  options = {}
) {

  if (state.language === "en") {

    return field(
      `${label} · EN`,
      item[key] || "",
      value => {
        item[key] = value;
      },
      options
    );

  }

  const translated = getGalleryTranslation(
    project,
    item
  );

  return field(
    `${label} · VI`,
    translated[key] || "",
    value => {

      const target = getGalleryTranslation(
        project,
        item,
        true
      );

      target[key] = value;

    },
    {
      ...options,
      placeholder:
        item[key] || "Enter Vietnamese content",
      hint:
        "Leave blank to use English content."
    }
  );

}


function renderProjectGallery(project) {

  if (!Array.isArray(project.gallery)) {
    project.gallery = [];
  }

  const gallery = project.gallery;

  const panel = el(
    "div",
    "project-gallery-editor"
  );

  const header = el(
    "div",
    "gallery-editor-header"
  );

  const heading = el(
    "div",
    "gallery-editor-heading"
  );

  heading.append(
    el("h3", "", "Project Gallery"),
    el(
      "p",
      "gallery-editor-description",
      "Manage project images, videos and evidence."
    )
  );

  const count = el(
    "span",
    "gallery-editor-count"
  );

  header.append(heading, count);

  const input = el("input", "hidden");

  input.type = "file";
  input.multiple = true;
  input.accept = IMAGE_TYPES.join(",");

  const uploadButton = button(
    "＋ Upload images",
    "gallery-upload-button",
    () => {

      if (isBusy()) return;

      if (gallery.length >= MAX_PROJECT_GALLERY) {
        toast(
          "Gallery đã đạt giới hạn 20 media.",
          "warning"
        );
        return;
      }

      input.click();

    }
  );

  const addVideoButton = button(
    "＋ Add video",
    "gallery-upload-button gallery-add-video-button",
    () => {

      if (isBusy()) return;

      if (gallery.length >= MAX_PROJECT_GALLERY) {
        toast(
          "Gallery đã đạt giới hạn 20 media.",
          "warning"
        );
        return;
      }

      gallery.push({
        id: uid(),
        type: "video",
        platform: "tiktok",
        videoUrl: "",
        image: "",
        title: "",
        description: ""
      });

      markDirty();

      renderGalleryItems();

      list.lastElementChild?.scrollIntoView({
        behavior: "smooth",
        block: "nearest"
      });

    }
  );

  const uploadActions = el(
    "div",
    "gallery-upload-actions"
  );

  uploadActions.append(
    uploadButton,
    addVideoButton
  );

  const uploadNote = el(
    "p",
    "gallery-upload-note",
    "Images: JPG, PNG, WebP, GIF · Max 5 MB/image. " +
    "Videos: External URL + uploaded thumbnail."
  );

  const status = el(
    "div",
    "status hidden"
  );

  const progress = el(
    "div",
    "progress-track hidden"
  );

  progress.append(
    el("div", "progress-bar indeterminate")
  );

  const list = el(
    "div",
    "gallery-editor-list"
  );

  function moveMedia(index, direction) {

    if (isBusy()) return;

    const target = index + direction;

    if (target < 0 || target >= gallery.length) {
      return;
    }

    [gallery[index], gallery[target]] = [
      gallery[target],
      gallery[index]
    ];

    markDirty();

    renderGalleryItems();

  }

  function removeMedia(index) {

    if (isBusy()) return;

    if (!confirm(
      "Bạn muốn gỡ media này khỏi Gallery?"
    )) {
      return;
    }

    const item = gallery[index];

    if (!item) return;

    const translated = getTranslationTarget(
      project,
      "title"
    );

    if (Array.isArray(translated?.gallery)) {

      translated.gallery =
        translated.gallery.filter(
          record => record.id !== item.id
        );

    }

    gallery.splice(index, 1);

    markDirty();

    renderGalleryItems();

    toast(
      "Đã gỡ media. Nhấn Save changes để lưu."
    );

  }

  function renderPlatformField(item) {

    const wrap = el(
      "div",
      "field gallery-platform-field"
    );

    const id = `platform-${uid()}`;

    const label = el(
      "label",
      "",
      "Video platform · Shared"
    );

    label.htmlFor = id;

    const select = el("select");

    select.id = id;

    for (const [value, name] of
      Object.entries(VIDEO_PLATFORMS)) {

      const option = el(
        "option",
        "",
        name
      );

      option.value = value;

      select.append(option);

    }

    select.value = item.platform || "tiktok";

    select.addEventListener("change", () => {

  if (isBusy()) {
    select.value = item.platform || "tiktok";
    return;
  }

  item.platform = select.value;

  markDirty();

});

    wrap.append(label, select);

    return wrap;

  }

  function renderGalleryItems() {

    count.textContent =
      `${gallery.length}/${MAX_PROJECT_GALLERY} media`;

    const isFull =
      gallery.length >= MAX_PROJECT_GALLERY;

    uploadButton.disabled = isFull;
    addVideoButton.disabled = isFull;

    list.replaceChildren();

    if (!gallery.length) {

      list.append(
        el(
          "div",
          "gallery-empty",
          "No gallery media yet."
        )
      );

      return;

    }

    gallery.forEach((item, index) => {

      const isVideo = item.type === "video";

      const node = el(
        "div",
        "gallery-editor-item" +
        (isVideo ? " is-video" : " is-image")
      );

      const itemHeader = el(
        "div",
        "gallery-item-header"
      );

      const itemTitle = el(
        "strong",
        "gallery-item-title",
        `${isVideo ? "Video" : "Image"} ` +
        String(index + 1).padStart(2, "0")
      );

      const actions = el(
        "div",
        "gallery-item-actions"
      );

      const up = button(
        "↑",
        "icon-button",
        () => moveMedia(index, -1)
      );

      up.disabled = index === 0;
      up.title = "Move media up";

      up.setAttribute(
        "aria-label",
        "Move media up"
      );

      const down = button(
        "↓",
        "icon-button",
        () => moveMedia(index, 1)
      );

      down.disabled =
        index === gallery.length - 1;

      down.title = "Move media down";

      down.setAttribute(
        "aria-label",
        "Move media down"
      );

      const remove = button(
        "Remove",
        "btn btn-danger btn-sm",
        () => removeMedia(index)
      );

      actions.append(up, down, remove);

      itemHeader.append(itemTitle, actions);

      const body = el(
        "div",
        "gallery-item-body"
      );

      const media = mediaEditor(
        item,
        "image",
        {
          title: isVideo
            ? "Video Thumbnail · Shared"
            : "Gallery Image · Shared"
        }
      );

      const removeFile =
        media.querySelector(".btn-danger");

      if (removeFile) {
        removeFile.remove();
      }

      const fields = el(
        "div",
        "gallery-item-fields"
      );

      if (isVideo) {

        fields.append(

          renderPlatformField(item),

          field(
            "Video URL · Shared",
            item.videoUrl || "",
            value => {
              item.videoUrl = value;
            },
            {
              type: "url",
              max: 2000,
              placeholder: "https://",
              hint:
                "Use a public video URL matching " +
                "the selected platform."
            }
          )

        );

        fields.append(
          el(
            "div",
            "gallery-video-note",
            "Upload a thumbnail for this video. " +
            "The video itself is hosted externally."
          )
        );

      }

      fields.append(

        galleryField(
          project,
          item,
          "title",
          isVideo
            ? "Video title"
            : "Image title",
          {
            max: 180
          }
        ),

        galleryField(
          project,
          item,
          "description",
          isVideo
            ? "Video description"
            : "Image description",
          {
            max: 1000,
            multiline: true
          }
        )

      );

      body.append(media, fields);

      node.append(itemHeader, body);

      list.append(node);

    });

  }

  input.addEventListener(
    "change",
    async () => {

      const files = Array.from(input.files || []);

      input.value = "";

      if (!files.length || isBusy()) return;

      const available =
        MAX_PROJECT_GALLERY - gallery.length;

      if (files.length > available) {

        toast(
          `Bạn chỉ có thể thêm ${available} ảnh.`,
          "warning"
        );

        return;

      }

      state.activeUploads++;

      const unlock = lockEditor();

      syncUI();

      show(progress);

      let uploaded = 0;

      const failed = [];

      try {

        for (let i = 0; i < files.length; i++) {

          const file = files[i];

          setStatus(
            status,
            `Uploading ${i + 1}/${files.length}: ${file.name}`
          );

          try {

            const url = await uploadMedia(
              file,
              "image"
            );

            gallery.push({
              id: uid(),
              type: "image",
              image: url,
              title: "",
              description: ""
            });

            uploaded++;

            markDirty();

          } catch (error) {

            failed.push(
              `${file.name}: ${error.message}`
            );

          }

        }

      } finally {

        state.activeUploads--;

        unlock();

        hide(progress);

        renderGalleryItems();

        syncUI();

      }

      if (failed.length) {

        setStatus(
          status,
          `Uploaded ${uploaded}/${files.length}. ` +
          failed.join(" | "),
          "warning"
        );

        toast(
          `${failed.length} ảnh upload thất bại.`,
          "warning"
        );

      } else {

        setStatus(
          status,
          `Uploaded ${uploaded} images. ` +
          "Nhấn Save changes để lưu.",
          "success"
        );

        toast(
          `Upload thành công ${uploaded} ảnh.`
        );

      }

    }
  );

  panel.append(
    header,
    input,
    uploadActions,
    uploadNote,
    progress,
    status,
    list
  );

  renderGalleryItems();

  return panel;

}



/* =========================================
   END PROJECT GALLERY EDITOR
========================================= */

   
/* =========================================
   17. SELECTED WORK
========================================= */

function renderProjects(root) {
  const key = "projects";

  const projects = state.content[key];

  root.append(
    pageHeading(
      "Selected Work",
      "Manage your projects, case studies " +
      "and portfolio visuals."
    )
  );

  root.append(
    el(
      "div",
      "notice",
      `${projects.length}/${LIMITS[key]} projects. ` +
      "Chỉ công bố hình ảnh và số liệu " +
      "được phép sử dụng."
    )
  );

  const list = el(
    "div",
    "record-list"
  );

  if (!projects.length) {
    list.append(
      emptyState(
        "No projects yet",
        "Add your first portfolio project."
      )
    );
  }

  projects.forEach((project, index) => {
    const node = el(
      "div",
      "record-card project-card"
    );

    node.append(
      recordHeader(
        key,
        index,
        project.title || "Untitled Project"
      )
    );

    const grid = el(
      "div",
      "project-grid"
    );

    const fields = el("div");

    fields.append(
      boundField(
        project,
        "title",
        "Project title",
        { max: 180 }
      ),
      boundField(
        project,
        "category",
        "Category",
        { max: 150 }
      ),
      boundField(
        project,
        "meta",
        "Project metadata",
        { max: 200 }
      ),
      boundField(
        project,
        "role",
        "Your role",
        { max: 300 }
      ),
      boundField(
        project,
        "description",
        "Project description",
        {
          max: 5000,
          multiline: true,
          large: true
        }
      ),
      boundField(
        project,
        "results",
        "Results & achievements",
        {
          max: 3000,
          multiline: true
        }
      ),
      boundField(
        project,
        "link",
        "Project URL",
        {
          max: 2000,
          type: "url",
          placeholder: "https://"
        }
      )
    );

    grid.append(
      fields,
      mediaEditor(
        project,
        "image",
        {
          title: "Project Cover Image"
        }
      )
    );

        node.append(
      grid,
      renderProjectGallery(project)
    );

    list.append(node);
  });

  list.append(
    addButton(
      "Add new project",
            () => addRecord(key, {
        title: "",
        category: "",
        meta: "",
        role: "",
        description: "",
        results: "",
        link: "",
        image: "",
        gallery: []
      })
    )
  );

  root.append(list);
}


/* =========================================
   18. WORK EXPERIENCE
========================================= */

function renderExperience(root) {
  const key = "workExperience";

  root.append(
    pageHeading(
      "Work Experience",
      "Manage your professional career journey."
    )
  );

  const list = el(
    "div",
    "record-list"
  );

  const records = state.content[key];

  if (!records.length) {
    list.append(
      emptyState(
        "No work experience",
        "Add your employment history."
      )
    );
  }

  records.forEach((record, index) => {
    const node = el(
      "div",
      "record-card"
    );

    node.append(
      recordHeader(
        key,
        index,
        record.company || "New Experience"
      )
    );

    const grid = el(
      "div",
      "form-grid"
    );

    grid.append(
      boundField(
        record,
        "company",
        "Company",
        { max: 200 }
      ),
      boundField(
        record,
        "position",
        "Position",
        { max: 200 }
      ),
      boundField(
        record,
        "period",
        "Employment period",
        {
          max: 150,
          placeholder: "June 2024 — Present"
        }
      ),
      boundField(
        record,
        "location",
        "Location",
        { max: 150 }
      ),
      boundField(
        record,
        "description",
        "Responsibilities & achievements",
        {
          max: 5000,
          multiline: true,
          large: true,
          full: true
        }
      )
    );

    node.append(grid);

    list.append(node);
  });

  list.append(
    addButton(
      "Add work experience",
      () => addRecord(key, {
        company: "",
        position: "",
        period: "",
        location: "",
        description: ""
      })
    )
  );

  root.append(list);
}


/* =========================================
   19. SKILLS & TOOLS GROUPS
========================================= */

function renderGroups(
  root,
  key,
  title,
  description
) {
  root.append(
    pageHeading(title, description)
  );

  const list = el(
    "div",
    "record-list"
  );

  const groups = state.content[key];

  if (!groups.length) {
    list.append(
      emptyState(
        "No groups yet",
        "Create a group to organize your items."
      )
    );
  }

  groups.forEach((group, index) => {
    const node = el(
      "div",
      "record-card"
    );

    node.append(
      recordHeader(
        key,
        index,
        group.title || "New Group"
      )
    );

    node.append(
      boundField(
        group,
        "title",
        "Group name",
        { max: 200 }
      )
    );
if (
  key === "competencies" &&
  state.language === "vi"
) {

  node.append(
    renderTranslatedSkills(group)
  );

  list.append(node);

  return;

}
    const tags = el(
      "div",
      "tag-list"
    );

    function renderTags() {
      tags.replaceChildren();

      group.items.forEach((item, i) => {
        const tag = el(
          "span",
          "tag"
        );

        const remove = button(
          "×",
          "tag-remove",
          () => {
            if (isBusy()) return;

            group.items.splice(i, 1);

            markDirty();

            renderTags();
          }
        );

        remove.setAttribute(
          "aria-label",
          `Remove ${item}`
        );

        tag.append(
          el("span", "", item),
          remove
        );

        tags.append(tag);
      });
    }

    const inputRow = el(
      "div",
      "tag-input-row"
    );

    const input = el("input");

    input.type = "text";
    input.maxLength = 500;

    input.placeholder =
      "Enter a skill or tool";

    input.setAttribute(
      "aria-label",
      "New item"
    );

    function addItem() {
      if (isBusy()) return;

      const value = input.value.trim();

      if (!value) return;

      if (group.items.length >= 50) {
        toast(
          "Tối đa 50 mục trong mỗi nhóm.",
          "warning"
        );

        return;
      }

      const exists = group.items.some(
        item =>
          item.toLowerCase() ===
          value.toLowerCase()
      );

      if (exists) {
        toast(
          "Mục này đã tồn tại.",
          "warning"
        );

        return;
      }

      group.items.push(value);

      input.value = "";

      markDirty();

      renderTags();

      input.focus();
    }

    input.addEventListener(
      "keydown",
      event => {
        if (event.key === "Enter") {
          event.preventDefault();

          addItem();
        }
      }
    );

    inputRow.append(
      input,
      button(
        "Add",
        "btn btn-primary",
        addItem
      )
    );

    renderTags();

    node.append(
      tags,
      inputRow,
      el(
        "p",
        "media-note",
        "Nhấn Enter hoặc Add để thêm mục."
      )
    );

    list.append(node);
  });

  list.append(
    addButton(
      "Add new group",
      () => addRecord(key, {
        title: "",
        items: []
      })
    )
  );

  root.append(list);
}


/* =========================================
   20. EDUCATION
========================================= */

function renderEducation(root) {
  const key = "education";

  root.append(
    pageHeading(
      "Education",
      "Manage your academic background."
    )
  );

  const list = el(
    "div",
    "record-list"
  );

  const records = state.content[key];

  if (!records.length) {
    list.append(
      emptyState(
        "No education records",
        "Add your academic qualifications."
      )
    );
  }

  records.forEach((record, index) => {
    const node = el(
      "div",
      "record-card"
    );

    node.append(
      recordHeader(
        key,
        index,
        record.school || "New Education"
      )
    );

    const grid = el(
      "div",
      "form-grid"
    );

    grid.append(
      boundField(
        record,
        "school",
        "School / University",
        { max: 200 }
      ),
      boundField(
        record,
        "degree",
        "Degree",
        { max: 200 }
      ),
      boundField(
        record,
        "major",
        "Major",
        { max: 200 }
      ),
      boundField(
        record,
        "period",
        "Study period",
        { max: 150 }
      ),
      boundField(
        record,
        "description",
        "Additional information",
        {
          max: 2000,
          multiline: true,
          full: true
        }
      )
    );

    node.append(grid);

    list.append(node);
  });

  list.append(
    addButton(
      "Add education",
      () => addRecord(key, {
        school: "",
        degree: "",
        major: "",
        period: "",
        description: ""
      })
    )
  );

  root.append(list);
}


/* =========================================
   21. CERTIFICATIONS
========================================= */

function renderCertifications(root) {
  const key = "certifications";

  root.append(
    pageHeading(
      "Certifications",
      "Manage professional certificates " +
      "and training credentials."
    )
  );

  const list = el(
    "div",
    "record-list"
  );

  const records = state.content[key];

  if (!records.length) {
    list.append(
      emptyState(
        "No certifications",
        "Add your professional credentials."
      )
    );
  }

  records.forEach((record, index) => {
    const node = el(
      "div",
      "record-card"
    );

    node.append(
      recordHeader(
        key,
        index,
        record.title || "New Certification"
      )
    );

    const grid = el(
      "div",
      "form-grid"
    );

    grid.append(
      boundField(
        record,
        "title",
        "Certification title",
        { max: 250 }
      ),
      boundField(
        record,
        "issuer",
        "Issuing organization",
        { max: 200 }
      ),
      boundField(
        record,
        "date",
        "Issue date",
        { max: 100 }
      ),
      boundField(
        record,
        "description",
        "Additional information",
        {
          max: 2000,
          multiline: true,
          full: true
        }
      )
    );

    node.append(grid);

    list.append(node);
  });

  list.append(
    addButton(
      "Add certification",
      () => addRecord(key, {
        title: "",
        issuer: "",
        date: "",
        description: ""
      })
    )
  );

  root.append(list);
}


/* =========================================
   22. CONTACT & SOCIAL LINKS
========================================= */

function renderContact(root) {
  const contact = state.content.contact;

  root.append(
    pageHeading(
      "Contact & Social",
      "Manage public contact information " +
      "and social profiles."
    )
  );

  root.append(
    el(
      "div",
      "notice warning",
      "Thông tin liên hệ được lưu trong CMS " +
      "có thể truy cập công khai qua API. " +
      "Chỉ nhập thông tin bạn muốn công bố."
    )
  );

  const details = card(
    "Contact Information"
  );

  const grid = el(
    "div",
    "form-grid"
  );

  grid.append(
    boundField(
      contact,
      "email",
      "Email address",
      {
        max: 200,
        type: "email"
      }
    ),
    boundField(
      contact,
      "phone",
      "Phone number",
      {
        max: 50,
        type: "tel"
      }
    ),
    boundField(
      contact,
      "headline",
      "Contact headline",
      {
        max: 300,
        full: true
      }
    ),
    boundField(
      contact,
      "description",
      "Contact description",
      {
        max: 2000,
        multiline: true,
        full: true
      }
    )
  );

  details.append(grid);

  const social = card(
    "Social Profiles"
  );

  const socialGrid = el(
    "div",
    "form-grid"
  );

  for (const [key, label] of [
    ["linkedin", "LinkedIn"],
    ["website", "Personal website"],
    ["facebook", "Facebook"],
    ["instagram", "Instagram"],
    ["github", "GitHub"],
    ["behance", "Behance"],
    ["tiktok", "TikTok"],
    ["youtube", "YouTube"]
  ]) {
    socialGrid.append(
      boundField(
        contact,
        key,
        label,
        {
          max: 2000,
          type: "url",
          placeholder: "https://"
        }
      )
    );
  }

  social.append(socialGrid);

  root.append(details, social);
}


/* =========================================
   23. CV MANAGEMENT
========================================= */

function renderCV(root) {
  root.append(
    pageHeading(
      "CV Management",
      "Upload and manage your downloadable CV."
    )
  );

  root.append(
    el(
      "div",
      "notice warning",
      "CV được lưu trên Cloudflare R2 và " +
      "có đường dẫn truy cập công khai. " +
      "Chỉ upload phiên bản CV dành cho công chúng."
    )
  );

  const panel = card(
    "CV Document",
    "PDF format · Maximum 10 MB"
  );

  panel.append(
    mediaEditor(
      state.content,
      "cvUrl",
      {
        kind: "pdf",
        title: "Current CV"
      }
    ),
    el(
      "p",
      "media-note",
      "Upload CV mới sẽ thay thế liên kết " +
      "CV sau khi lưu. File cũ vẫn tồn tại " +
      "trong R2."
    )
  );

  root.append(panel);
}


/* =========================================
   24. SECTION RENDERER
========================================= */

function renderSection() {
  const root = $("#sectionContent");

  if (!root || !state.content) return;

  root.replaceChildren();

if (
  !["overview", "cv"].includes(state.section)
) {
  root.append(
    renderLanguageSwitcher()
  );
}

const section = el(
  "div",
  "page-section"
);

  switch (state.section) {
    case "personal":
      renderPersonal(section);
      break;

    case "hero":
      renderHero(section);
      break;

    case "projects":
      renderProjects(section);
      break;

    case "experience":
      renderExperience(section);
      break;

    case "competencies":
      renderGroups(
        section,
        "competencies",
        "Core Competencies",
        "Organize your professional expertise " +
        "into skill groups."
      );
      break;

    case "tools":
      renderGroups(
        section,
        "tools",
        "Tools & Platforms",
        "Manage the platforms and technologies " +
        "you work with."
      );
      break;

    case "education":
      renderEducation(section);
      break;

    case "certifications":
      renderCertifications(section);
      break;

    case "contact":
      renderContact(section);
      break;

    case "cv":
      renderCV(section);
      break;

    default:
      renderOverview(section);
  }

  root.append(section);

  syncUI();
}


/* =========================================
   25. CONTENT VALIDATION
========================================= */

function validateURL(value, label) {
  if (!value || !value.trim()) return;

  try {
    const url = new URL(value.trim());

    if (
      url.protocol !== "https:" &&
      url.protocol !== "http:"
    ) {
      throw new Error();
    }

  } catch {
    throw new Error(
      `${label}: Đường dẫn phải bắt đầu ` +
      "bằng https:// hoặc http://."
    );
  }
}

   
function validateVideoURL(value, platform, label) {

  let url;

  try {

    url = new URL((value || "").trim());

  } catch {

    throw new Error(
      `${label}: URL video không hợp lệ.`
    );

  }

  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.port
  ) {

    throw new Error(
      `${label}: URL video phải sử dụng HTTPS hợp lệ.`
    );

  }

  const host = url.hostname.toLowerCase();
  const path = url.pathname;

  let valid = false;

  switch (platform) {

    case "tiktok":

      valid =
        ["www.tiktok.com", "tiktok.com"]
          .includes(host) &&
        /^\/@[^/]+\/video\/\d+\/?$/.test(path);

      break;

    case "youtube":

      valid =
        (
          [
            "www.youtube.com",
            "youtube.com",
            "m.youtube.com"
          ].includes(host) &&
          (
            (
              path === "/watch" &&
              /^[a-zA-Z0-9_-]{11}$/.test(
                url.searchParams.get("v") || ""
              )
            ) ||
            /^\/shorts\/[a-zA-Z0-9_-]{11}\/?$/
              .test(path)
          )
        ) ||
        (
          host === "youtu.be" &&
          /^\/[a-zA-Z0-9_-]{11}\/?$/.test(path)
        );

      break;

    case "facebook":

      valid = [
        "facebook.com",
        "www.facebook.com",
        "m.facebook.com",
        "fb.watch"
      ].includes(host) && path !== "/";

      break;

    case "instagram":

      valid =
        ["instagram.com", "www.instagram.com"]
          .includes(host) &&
        /^\/(reel|p|tv)\/[a-zA-Z0-9_-]+\/?$/
          .test(path);

      break;

    case "vimeo":

      valid =
        ["vimeo.com", "www.vimeo.com"]
          .includes(host) &&
        /^\/\d+\/?$/.test(path);

      break;

    case "mp4":

      valid = /\.mp4$/i.test(path);

      break;

  }

  if (!valid) {

    throw new Error(
      `${label}: URL không phù hợp với nền tảng video.`
    );

  }

}


function validateContent(data) {
  if (!data.name.trim()) {
    throw new Error(
      "Tên hiển thị không được để trống."
    );
  }

  for (const key of Object.keys(LIMITS)) {
    if (!Array.isArray(data[key])) {
      throw new Error(
        `Dữ liệu ${key} không hợp lệ.`
      );
    }

    if (data[key].length > LIMITS[key]) {
      throw new Error(
        `${key} vượt quá giới hạn cho phép.`
      );
    }
  }

  if (
    data.avatar &&
    !validMediaUrl(data.avatar)
  ) {
    throw new Error(
      "Đường dẫn avatar không hợp lệ."
    );
  }

  if (
    data.cvUrl &&
    !validMediaUrl(data.cvUrl, "pdf")
  ) {
    throw new Error(
      "Đường dẫn CV không hợp lệ."
    );
  }

  data.projects.forEach((project, index) => {
    if (!(project.title || "").trim()) {
      throw new Error(
        `Project ${index + 1} chưa có tiêu đề.`
      );
    }

    if (
      project.image &&
      !validMediaUrl(project.image)
    ) {
      throw new Error(
        `Project ${index + 1} có ảnh không hợp lệ.`
      );
    }


// Project Gallery validation - V2.3

if (
  !Array.isArray(project.gallery) ||
  project.gallery.length > MAX_PROJECT_GALLERY
) {

  throw new Error(
    `Project ${index + 1}: Gallery không hợp lệ.`
  );

}

const galleryIds = new Set();

project.gallery.forEach((item, mediaIndex) => {

  const label =
    `Project ${index + 1} - Media ${mediaIndex + 1}`;

  if (!item.id || galleryIds.has(item.id)) {

    throw new Error(
      `${label}: ID media không hợp lệ.`
    );

  }

  galleryIds.add(item.id);

  const type = item.type || "image";

  if (!["image", "video"].includes(type)) {

    throw new Error(
      `${label}: Loại media không hợp lệ.`
    );

  }

  if (!validMediaUrl(item.image)) {

    throw new Error(
      type === "video"
        ? `${label}: Video chưa có thumbnail hợp lệ.`
        : `${label}: Đường dẫn ảnh không hợp lệ.`
    );

  }

  if (type === "video") {

    if (
      !Object.hasOwn(
        VIDEO_PLATFORMS,
        item.platform
      )
    ) {

      throw new Error(
        `${label}: Nền tảng video không hợp lệ.`
      );

    }

    if (
      !item.videoUrl ||
      item.videoUrl.length > 2000
    ) {

      throw new Error(
        `${label}: URL video không hợp lệ.`
      );

    }

    validateVideoURL(
      item.videoUrl,
      item.platform,
      label
    );

  }

  if ((item.title || "").length > 180) {

    throw new Error(
      `${label}: Tiêu đề vượt quá 180 ký tự.`
    );

  }

    if ((item.description || "").length > 1000) {

    throw new Error(
      `${label}: Mô tả vượt quá 1000 ký tự.`
    );

  }

});

    validateURL(
      project.link,
      `Project ${index + 1}`
    );

  });
  for (const [key, fieldName, label] of [
    ["workExperience", "company", "Company"],
    ["education", "school", "School"],
    ["certifications", "title", "Certification"],
    ["competencies", "title", "Skill group"],
    ["tools", "title", "Tool group"]
  ]) {
    data[key].forEach((record, index) => {
      if (!(record[fieldName] || "").trim()) {
        throw new Error(
          `${label} ${index + 1} chưa có tên.`
        );
      }
    });
  }

  const email = data.contact.email.trim();

  if (
    email &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    throw new Error(
      "Địa chỉ email không hợp lệ."
    );
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
    validateURL(
      data.contact[key],
      key
    );
  }

  for (const key of ["competencies", "tools"]) {
    data[key].forEach(group => {
      if (
        !Array.isArray(group.items) ||
        group.items.length > 50
      ) {
        throw new Error(
          `Nhóm ${group.title} không hợp lệ.`
        );
      }
    });
  }

  const payload = JSON.stringify(data);

  if (new TextEncoder().encode(payload).length > 500000) {
    throw new Error(
      "Nội dung vượt quá giới hạn Backend."
    );
  }
}


/* =========================================
   26. SAVE CONTENT
========================================= */

async function saveContent() {
  if (
    isBusy() ||
    !state.content ||
    !state.dirty
  ) {
    return;
  }

  const snapshot = clone(state.content);

  try {
    validateContent(snapshot);

  } catch (error) {
    toast(error.message, "error");

    return;
  }

  state.saving = true;

  const unlock = lockEditor();

  syncUI();

  try {
    await request(
      API.content,
      jsonOptions("PUT", snapshot)
    );

    state.original = clone(snapshot);

    state.dirty = false;

    toast(
      "Đã lưu nội dung Portfolio thành công."
    );

    // Reload canonical content from D1.

    try {
      const saved = await request(
        API.content
      );

      state.content = normalizeContent(saved);

      state.original = clone(state.content);

      renderSection();

    } catch {
      toast(
        "Đã lưu thành công nhưng chưa thể " +
        "tải lại dữ liệu từ D1.",
        "warning"
      );
    }

  } catch (error) {
    state.dirty = true;

    if (error.status === 401) {
      toast(
        "Phiên đăng nhập đã hết hạn. " +
        "Dữ liệu chưa lưu vẫn được giữ trên trang. " +
        "Hãy đăng nhập lại ở tab khác rồi thử lưu.",
        "error"
      );

    } else {
      toast(error.message, "error");
    }

  } finally {
    state.saving = false;

    unlock();

    syncUI();
  }
}


/* =========================================
   27. EVENT HANDLERS
========================================= */

function bindEvents() {
  $("#loginForm").addEventListener(
    "submit",
    login
  );

  $("#logout").addEventListener(
    "click",
    logout
  );

  $("#save").addEventListener(
    "click",
    saveContent
  );

  $$(".nav-item[data-section]").forEach(node => {
    node.addEventListener(
      "click",
      () => navigate(node.dataset.section)
    );
  });

  $("#menuToggle")?.addEventListener(
    "click",
    () => {
      const open = $("#sidebar")
        .classList.contains("open");

      toggleSidebar(!open);
    }
  );

  $("#sidebarOverlay")?.addEventListener(
    "click",
    () => toggleSidebar(false)
  );

  document.addEventListener(
    "keydown",
    event => {
      if (event.key === "Escape") {
        toggleSidebar(false);
      }

      if (
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === "s" &&
        state.authenticated
      ) {
        event.preventDefault();

        saveContent();
      }
    }
  );

  window.addEventListener(
    "beforeunload",
    event => {
      if (
        state.dirty ||
        state.saving ||
        state.activeUploads > 0
      ) {
        event.preventDefault();

        event.returnValue = "";
      }
    }
  );
}


/* =========================================
   28. INITIALIZATION
========================================= */

function init() {
  const required = [
    "#loginPanel",
    "#loginForm",
    "#loginButton",
    "#loginStatus",
    "#password",
    "#editor",
    "#logout",
    "#save",
    "#sectionContent"
  ];

  const missing = required.filter(
    selector => !$(selector)
  );

  if (missing.length) {
    console.error(
      "Admin CMS V2: Missing HTML elements",
      missing
    );

    return;
  }

  bindEvents();

  syncUI();

  checkSession();
}

if (document.readyState === "loading") {
  document.addEventListener(
    "DOMContentLoaded",
    init
  );

} else {
  init();
}

})();

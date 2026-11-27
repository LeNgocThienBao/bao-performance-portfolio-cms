
/* ==================================================
   BAO LE — PERFORMANCE MARKETING PORTFOLIO
   FRONTEND V2
   CMS Integration & Interaction System
================================================== */

(() => {

  "use strict";


  /* ==================================================
     01. CONFIGURATION
  ================================================== */

  const CONFIG = {
    api: "/api/content",
    imagePattern:
      /^\/api\/media\/[a-zA-Z0-9_-]+\.(jpg|jpeg|png|webp|gif)$/,
    pdfPattern:
      /^\/api\/media\/[a-zA-Z0-9_-]+\.pdf$/,
    animationThreshold: 0.08,
    mobileBreakpoint: 900
  };

  const $ = (id) => document.getElementById(id);

  const $$ = (selector, root = document) =>
    Array.from(root.querySelectorAll(selector));

  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  );

  let revealObserver = null;
  let navigationObserver = null;


  /* ==================================================
     02. GENERAL UTILITIES
  ================================================== */

  function text(value, fallback = "") {

    return typeof value === "string"
      ? value.trim() || fallback
      : fallback;

  }


  function array(value) {

    return Array.isArray(value)
      ? value.filter(
          item => item &&
          typeof item === "object"
        )
      : [];

  }


  function setText(id, value) {

    const element = $(id);

    if (!element) return;

    if (typeof value === "string") {
      element.textContent = value;
    }

  }


  function setVisible(target, visible) {

    const element =
      typeof target === "string"
        ? $(target)
        : target;

    if (!element) return;

    element.hidden = !visible;

    element.classList.toggle(
      "hidden",
      !visible
    );

  }


  function create(
    tag,
    className = "",
    content = ""
  ) {

    const element =
      document.createElement(tag);

    if (className) {
      element.className = className;
    }

    if (content !== "") {
      element.textContent = content;
    }

    return element;

  }


  function appendText(
    parent,
    tag,
    className,
    value
  ) {

    const content = text(value);

    if (!content) return null;

    const element = create(
      tag,
      className,
      content
    );

    parent.appendChild(element);

    return element;

  }


  function formatIndex(index) {

    return String(index + 1)
      .padStart(2, "0");

  }


  function validImage(value) {

    return typeof value === "string" &&
      CONFIG.imagePattern.test(value);

  }


  function validPDF(value) {

    return typeof value === "string" &&
      CONFIG.pdfPattern.test(value);

  }


  function safeLink(value) {

    if (typeof value !== "string") {
      return "";
    }

    try {

      const url = new URL(value);

      if (
        url.protocol !== "https:" &&
        url.protocol !== "http:"
      ) {
        return "";
      }

      return url.href;

    } catch {

      return "";

    }

  }


  function createExternalLink(
    label,
    url,
    className = ""
  ) {

    const href = safeLink(url);

    if (!href) return null;

    const link = create(
      "a",
      className,
      label
    );

    link.href = href;
    link.target = "_blank";
    link.rel = "noopener noreferrer";

    return link;

  }


  function createArrow(symbol = "↗") {

    const arrow = create(
      "span",
      "btn-arrow",
      symbol
    );

    arrow.setAttribute(
      "aria-hidden",
      "true"
    );

    return arrow;

  }


  function setButtonLabel(id, value) {

    const button = $(id);

    if (!button || !text(value)) return;

    const label = button.querySelector(
      "[data-label]"
    );

    if (label) {

      label.textContent = value;

    } else {

      const arrow = button.querySelector(
        ".btn-arrow, .button-arrow"
      );

      button.textContent = value;

      if (arrow) {
        button.appendChild(arrow);
      }

    }

  }


  function replaceContent(
    container,
    fragment
  ) {

    if (!container) return;

    container.replaceChildren(fragment);

  }


  /* ==================================================
     03. PERSONAL INFORMATION
  ================================================== */

  function renderPersonal(data) {

    const name = text(data.name);

    const jobTitle = text(
      data.jobTitle
    );

    const experience = text(
      data.experienceMeta
    );

    const location = text(
      data.locationMeta
    );

    if (name) {

      setText("brandName", name);
      setText("footerName", name);
      setText("profileName", name);

      document.title = jobTitle
        ? `${name} — ${jobTitle}`
        : `${name} — Portfolio`;

    }

    setText("jobTitle", jobTitle);

    setText(
      "experienceMeta",
      experience
    );

    setText(
      "locationMeta",
      location
    );

    setText(
      "footerJobTitle",
      jobTitle
    );

    setText(
      "aboutJobTitle",
      jobTitle
    );

    setText(
      "aboutLocation",
      location
    );

    setText(
      "aboutExperience",
      experience
    );

    setText(
      "footerYear",
      String(new Date().getFullYear())
    );

    const metaDescription =
      document.querySelector(
        'meta[name="description"]'
      );

    if (
      metaDescription &&
      text(data.heroLead)
    ) {

      metaDescription.setAttribute(
        "content",
        text(data.heroLead).slice(0, 160)
      );

    }

  }


  /* ==================================================
     04. HERO HEADLINE
  ================================================== */

  function renderHeadline(value) {

    const headline = $("heroHeadline");

    const content = text(value);

    if (!headline || !content) return;

    const lines = content
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(Boolean);

    const fragment =
      document.createDocumentFragment();

    lines.forEach((line) => {

      const wrapper = create(
        "span",
        "hero-line"
      );

      const inner = create(
        "span",
        "hero-line-inner"
      );

      /*
         Highlight punctuation using
         safe DOM nodes, not innerHTML.
      */

      const parts = line.split(/([.!?])/);

      parts.forEach(part => {

        if (/^[.!?]$/.test(part)) {

          inner.appendChild(
            create(
              "span",
              "accent",
              part
            )
          );

        } else {

          inner.appendChild(
            document.createTextNode(part)
          );

        }

      });

      wrapper.appendChild(inner);

      fragment.appendChild(wrapper);

    });

    headline.replaceChildren(fragment);

  }


  /* ==================================================
     05. PROFILE AVATAR
  ================================================== */

  function renderAvatar(data) {

    const image = $("heroAvatar");

    const placeholder =
      $("avatarPlaceholder");

    const photoLabel =
      $("heroPhotoLabel");

    if (!image) return;

    const name = text(
      data.name,
      "Portfolio"
    );

    const initial =
      Array.from(name)[0] || "B";

    if (placeholder) {

      placeholder.textContent =
        initial.toUpperCase();

    }

    function showPlaceholder() {

      setVisible(image, false);

      setVisible(
        placeholder,
        true
      );

      setVisible(
        photoLabel,
        false
      );

    }

    function showImage() {

      setVisible(image, true);

      setVisible(
        placeholder,
        false
      );

      setVisible(
        photoLabel,
        true
      );

    }

    image.onload = null;
    image.onerror = null;

    if (!validImage(data.avatar)) {

      image.removeAttribute("src");

      showPlaceholder();

      return;

    }

    showPlaceholder();

    image.alt = `${name} — Profile portrait`;

    image.decoding = "async";

    image.loading = "eager";

    image.onload = showImage;

    image.onerror = showPlaceholder;

    image.src = data.avatar;

    if (
      image.complete &&
      image.naturalWidth > 0
    ) {

      showImage();

    }

  }


  /* ==================================================
     06. HERO CONTENT
  ================================================== */

  function renderHero(data) {

    setText(
      "heroKicker",
      text(data.heroKicker)
    );

    setText(
      "heroLead",
      text(data.heroLead)
    );

    renderHeadline(
      data.heroHeadline
    );

    setButtonLabel(
      "heroPrimaryCTA",
      text(
        data.heroPrimaryCTA,
        "Explore selected work"
      )
    );

    setButtonLabel(
      "heroSecondaryCTA",
      text(
        data.heroSecondaryCTA,
        "A little about me"
      )
    );

    renderAvatar(data);

  }


  /* ==================================================
     07. ABOUT SECTION
  ================================================== */

  function renderAbout(data) {

    const aboutLead = $("aboutLead");

    if (
      aboutLead &&
      text(data.heroLead)
    ) {

      aboutLead.textContent =
        data.heroLead;

    }

  }
// ==================================================
// PORTFOLIO V2.3 - MULTIMEDIA GALLERY ENGINE
// ==================================================

let activeGallery = null;

function galleryLabel(key) {

  const labels = {
    viewGallery: ["View gallery", "Xem bộ ảnh"],
    close: ["Close gallery", "Đóng bộ ảnh"],
    previous: ["Previous image", "Ảnh trước"],
    next: ["Next image", "Ảnh tiếp theo"],
    image: ["Image", "Ảnh"],
    images: ["images", "ảnh"],
    thumbnails: ["Gallery thumbnails", "Danh sách ảnh"],
    loading: ["Loading image...", "Đang tải ảnh..."],
    error: ["Unable to load image.", "Không thể tải ảnh."],
    gallery: ["Project gallery", "Bộ ảnh dự án"]
  };

  return window.PORTFOLIO_TRANSLATIONS
    ?.[currentLanguage]?.gallery?.[key]
    || labels[key]?.[currentLanguage === "vi" ? 1 : 0]
    || key;

}


/* =========================================
   MULTIMEDIA UTILITIES — V2.3
========================================= */

const galleryVideoPlatforms = {
  tiktok: "TikTok",
  youtube: "YouTube",
  facebook: "Facebook",
  instagram: "Instagram",
  vimeo: "Vimeo",
  mp4: "MP4"
};

function mediaLabel(key) {

  const labels = {
    viewGallery: ["View gallery", "Xem bộ sưu tập"],
    gallery: ["Project gallery", "Bộ sưu tập dự án"],
    media: ["media", "nội dung"],
    video: ["Video", "Video"],
    play: ["Play video", "Phát video"],
    openOriginal: ["Watch original video", "Xem video gốc"],
    videoError: [
      "Unable to play video. Please open the original.",
      "Không thể phát video. Vui lòng mở video gốc."
    ],
    previous: ["Previous media", "Nội dung trước"],
    next: ["Next media", "Nội dung tiếp theo"],
    thumbnails: ["Gallery thumbnails", "Danh sách nội dung"]
  };

  return labels[key]?.[
    currentLanguage === "vi" ? 1 : 0
  ] || galleryLabel(key);

}

function getGalleryVideoSource(item) {

  if (item.type !== "video") return null;

  try {

    const url = new URL(item.videoUrl);

    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      url.port
    ) return null;

    const host = url.hostname.toLowerCase();
    const path = url.pathname;

    let match;
    let embed = "";

    switch (item.platform) {

      case "tiktok":

        if (!["tiktok.com", "www.tiktok.com"]
          .includes(host)) return null;

        match = path.match(
          /^\/@[^/]+\/video\/(\d+)\/?$/
        );

        if (!match) return null;

        embed =
          `https://www.tiktok.com/player/v1/${match[1]}`;

        break;

      case "youtube":

        let id = "";

        if (host === "youtu.be") {

          id = path.slice(1).replace(/\/$/, "");

        } else if ([
          "youtube.com",
          "www.youtube.com",
          "m.youtube.com"
        ].includes(host)) {

          id = path === "/watch"
            ? url.searchParams.get("v") || ""
            : path.match(
                /^\/shorts\/([a-zA-Z0-9_-]+)\/?$/
              )?.[1] || "";

        }

        if (!/^[a-zA-Z0-9_-]{11}$/.test(id)) {
          return null;
        }

        embed =
          `https://www.youtube-nocookie.com/embed/${id}`;

        break;

      case "facebook":

        if (![
          "facebook.com",
          "www.facebook.com",
          "m.facebook.com",
          "fb.watch"
        ].includes(host) || path === "/") {
          return null;
        }

        embed =
          "https://www.facebook.com/plugins/video.php" +
          "?href=" + encodeURIComponent(url.href) +
          "&show_text=false";

        break;

      case "instagram":

        if (![
          "instagram.com",
          "www.instagram.com"
        ].includes(host)) return null;

        match = path.match(
          /^\/(reel|p|tv)\/([a-zA-Z0-9_-]+)\/?$/
        );

        if (!match) return null;

        embed =
          `https://www.instagram.com/${match[1]}/${match[2]}/embed/`;

        break;

      case "vimeo":

        if (!["vimeo.com", "www.vimeo.com"]
          .includes(host)) return null;

        match = path.match(/^\/(\d+)\/?$/);

        if (!match) return null;

        embed =
          `https://player.vimeo.com/video/${match[1]}`;

        break;

      case "mp4":

        if (!/\.mp4$/i.test(path)) return null;

        return {
          type: "native",
          src: url.href,
          original: url.href
        };

      default:

        return null;

    }

    return {
      type: "iframe",
      src: embed,
      original: url.href
    };

  } catch {

    return null;

  }

}

function stopGalleryVideo(root) {

  root.querySelectorAll("video").forEach(video => {

    video.pause();
    video.removeAttribute("src");
    video.load();
    video.remove();

  });

  root.querySelectorAll("iframe").forEach(frame => {

    frame.src = "about:blank";
    frame.remove();

  });

}

function renderGalleryVideo(item, container) {

  const source = getGalleryVideoSource(item);

  if (!source) return;

  const wrapper = create(
    "div",
    "gallery-video-wrapper"
  );

  wrapper.dataset.platform = item.platform;

  const preview = create(
    "div",
    "gallery-video-preview"
  );

  const thumbnail = create(
    "img",
    "gallery-video-thumbnail"
  );

  thumbnail.alt = text(item.title, "Video");
  thumbnail.decoding = "async";
  thumbnail.draggable = false;
  thumbnail.src = item.image;

  const playButton = createGalleryButton(
    "▶",
    mediaLabel("play"),
    "gallery-video-play",
    startVideo
  );

  const platform = create(
    "span",
    "gallery-video-platform",
    galleryVideoPlatforms[item.platform] || "Video"
  );

  preview.append(
    thumbnail,
    playButton,
    platform
  );

  const player = create(
    "div",
    "gallery-video-player"
  );

  player.hidden = true;

  const originalLink = createExternalLink(
    mediaLabel("openOriginal") + " ↗",
    source.original,
    "gallery-video-original"
  );

  wrapper.append(preview, player);

  if (originalLink) {
    wrapper.appendChild(originalLink);
  }

  container.appendChild(wrapper);

  function startVideo() {

    if (
      activeGallery?.closing ||
      !wrapper.isConnected
    ) return;

    stopGalleryVideo(player);

    preview.hidden = true;
    player.hidden = false;

    if (source.type === "native") {

      const video = create(
        "video",
        "gallery-video-element"
      );

      video.controls = true;
      video.playsInline = true;
      video.preload = "metadata";

      video.addEventListener("error", () => {

        player.replaceChildren(
          create(
            "p",
            "gallery-video-error",
            mediaLabel("videoError")
          )
        );

      });

      video.src = source.src;

      player.appendChild(video);

      video.play().catch(() => {});

    } else {

      const iframe = create(
        "iframe",
        "gallery-video-iframe"
      );

      iframe.title = text(
        item.title,
        mediaLabel("play")
      );

      iframe.allow =
        "autoplay; encrypted-media; " +
        "fullscreen; picture-in-picture";

      iframe.allowFullscreen = true;

      iframe.referrerPolicy =
        "strict-origin-when-cross-origin";

      iframe.src = source.src;

      player.appendChild(iframe);

      iframe.focus({
        preventScroll: true
      });

    }

  }

}

   

function getProjectGallery(project) {

  return array(project.gallery)
    .filter(item => {

      if (!validImage(item.image)) {
        return false;
      }

      if (item.type === "video") {
        return Boolean(getGalleryVideoSource(item));
      }

      return !item.type || item.type === "image";

    })
    .slice(0, 20);

}


function createGalleryButton(
  symbol,
  label,
  className,
  handler
) {

  const button = create(
    "button",
    className,
    symbol
  );

  button.type = "button";
  button.setAttribute("aria-label", label);
  button.title = label;

  button.addEventListener("click", handler);

  return button;

}

function closeProjectGallery(immediate = false) {

  const gallery = activeGallery;

  if (!gallery || gallery.closing) return;

  
gallery.closing = true;

stopGalleryVideo(gallery.dialog);


  const finish = () => {

    gallery.dialog.close();
    gallery.dialog.remove();

    document.body.style.overflow =
      gallery.previousOverflow;

    activeGallery = null;

    if (gallery.trigger?.isConnected) {

      gallery.trigger.focus({
        preventScroll: true
      });

    }

  };

  gallery.dialog.classList.remove("is-open");
  gallery.dialog.classList.add("is-closing");

  if (immediate || reducedMotion.matches) {

    finish();

  } else {

    window.setTimeout(finish, 280);

  }

}

function openProjectGallery(project, trigger) {

  if (activeGallery) return;

  const items = getProjectGallery(project);

  if (!items.length) return;

  let currentIndex = 0;
  let imageRequest = 0;
  let pointerStart = null;

  const dialog = create(
    "dialog",
    "gallery-lightbox"
  );

  dialog.setAttribute(
    "aria-labelledby",
    "galleryProjectTitle"
  );

  const panel = create(
    "div",
    "gallery-panel"
  );

  // Header

  const header = create(
    "div",
    "gallery-header"
  );

  const heading = create(
    "div",
    "gallery-heading"
  );

  heading.appendChild(
    create(
      "span",
      "gallery-eyebrow",
      galleryLabel("gallery")
    )
  );

  const projectTitle = create(
    "h2",
    "gallery-project-title",
    text(project.title, galleryLabel("gallery"))
  );

  projectTitle.id = "galleryProjectTitle";

  heading.appendChild(projectTitle);

  const closeButton = createGalleryButton(
    "×",
    galleryLabel("close"),
    "gallery-close",
    () => closeProjectGallery()
  );

  header.append(heading, closeButton);

  // Main image

  const stage = create(
    "div",
    "gallery-stage"
  );

  const imageFrame = create(
    "div",
    "gallery-image-frame"
  );

  const imageStatus = create(
    "div",
    "gallery-image-status"
  );

  imageStatus.setAttribute(
    "role",
    "status"
  );

  imageFrame.appendChild(imageStatus);

  const previousButton = createGalleryButton(
    "‹",
    galleryLabel("previous"),
    "gallery-nav gallery-prev",
    () => showImage(currentIndex - 1)
  );

  const nextButton = createGalleryButton(
    "›",
    galleryLabel("next"),
    "gallery-nav gallery-next",
    () => showImage(currentIndex + 1)
  );

  stage.append(
    imageFrame,
    previousButton,
    nextButton
  );

  // Caption

  const caption = create(
    "div",
    "gallery-caption"
  );

  const captionContent = create(
    "div",
    "gallery-caption-content"
  );

  const captionTitle = create(
    "h3",
    "gallery-caption-title"
  );

  const captionDescription = create(
    "p",
    "gallery-caption-description"
  );

  captionContent.append(
    captionTitle,
    captionDescription
  );

  const counter = create(
    "span",
    "gallery-counter"
  );

  counter.setAttribute(
    "aria-live",
    "polite"
  );

  caption.append(
    captionContent,
    counter
  );

  // Thumbnail strip

  const thumbnails = create(
    "div",
    "gallery-thumbnails"
  );

  thumbnails.setAttribute("role", "group");

  thumbnails.setAttribute(
    "aria-label",
    galleryLabel("thumbnails")
  );

  
const thumbnailButtons = items.map(
  (item, index) => {

    const isVideo = item.type === "video";

    const button = createGalleryButton(
      "",
      `${mediaLabel(isVideo ? "video" : "image")} ${index + 1}`,
      "gallery-thumbnail",
      () => showImage(index)
    );

    const image = create(
      "img",
      "gallery-thumbnail-image"
    );

    image.alt = "";
    image.loading = "lazy";
    image.decoding = "async";
    image.src = item.image;

    button.appendChild(image);

    if (isVideo) {

      button.classList.add("is-video");

      const playIcon = create(
        "span",
        "gallery-thumbnail-play",
        "▶"
      );

      playIcon.setAttribute(
        "aria-hidden",
        "true"
      );

      button.appendChild(playIcon);

    }

    thumbnails.appendChild(button);

    return button;

  }
);


  // Image navigation

 
function showImage(index) {

  if (activeGallery?.closing) return;

  currentIndex =
    (index + items.length) % items.length;

  const item = items[currentIndex];

  const request = ++imageRequest;

  const isVideo = item.type === "video";

  pointerStart = null;

  // Stop previous video

  stopGalleryVideo(imageFrame);

  // Remove previous media

  imageFrame.querySelectorAll(
    ".gallery-main-image, .gallery-video-wrapper"
  ).forEach(media => media.remove());

  stage.classList.toggle(
    "is-video",
    isVideo
  );

  imageFrame.classList.toggle(
    "is-video",
    isVideo
  );

  imageStatus.hidden = true;

  // Video rendering

  if (isVideo) {

    renderGalleryVideo(item, imageFrame);

  } else {

    // Original image rendering

    imageStatus.textContent =
      galleryLabel("loading");

    imageStatus.hidden = false;

    const image = create(
      "img",
      "gallery-main-image"
    );

    image.alt = text(
      item.title,
      `${text(project.title)} — ${galleryLabel("image")} ${currentIndex + 1}`
    );

    image.decoding = "async";
    image.draggable = false;

    image.onload = () => {

      if (
        request !== imageRequest ||
        !dialog.open ||
        activeGallery?.closing
      ) return;

      imageStatus.hidden = true;

      imageFrame.appendChild(image);

      requestAnimationFrame(() => {

        image.classList.add("is-loaded");

      });

    };

    image.onerror = () => {

      if (
        request !== imageRequest ||
        !dialog.open ||
        activeGallery?.closing
      ) return;

      imageStatus.textContent =
        galleryLabel("error");

      imageStatus.hidden = false;

    };

    image.src = item.image;

  }

  // Caption

  captionTitle.textContent =
    text(item.title);

  captionDescription.textContent =
    text(item.description);

  captionTitle.hidden =
    !text(item.title);

  captionDescription.hidden =
    !text(item.description);

  counter.textContent =
    `${formatIndex(currentIndex)} / ${String(items.length).padStart(2, "0")}`;

  // Active thumbnail

  thumbnailButtons.forEach(
    (button, buttonIndex) => {

      const selected =
        buttonIndex === currentIndex;

      button.classList.toggle(
        "is-active",
        selected
      );

      button.setAttribute(
        "aria-pressed",
        String(selected)
      );

    }
  );

  // Center active thumbnail

  const selectedThumbnail =
    thumbnailButtons[currentIndex];

  if (selectedThumbnail) {

    const stripBounds =
      thumbnails.getBoundingClientRect();

    const thumbnailBounds =
      selectedThumbnail.getBoundingClientRect();

    const offset =
      thumbnails.scrollLeft +
      thumbnailBounds.left -
      stripBounds.left -
      (thumbnails.clientWidth -
        thumbnailBounds.width) / 2;

    thumbnails.scrollTo({
      left: offset,
      behavior: reducedMotion.matches
        ? "auto"
        : "smooth"
    });

  }

}


  
// Keyboard navigation

dialog.addEventListener(
  "keydown",
  event => {

    if (
      event.target.closest(
        ".gallery-video-wrapper"
      )
    ) return;

      if (event.key === "ArrowLeft") {

        event.preventDefault();
        showImage(currentIndex - 1);

      }

      if (event.key === "ArrowRight") {

        event.preventDefault();
        showImage(currentIndex + 1);

      }

    }
  );

  dialog.addEventListener(
    "cancel",
    event => {

      event.preventDefault();
      closeProjectGallery();

    }
  );

  // Close when clicking outside

  dialog.addEventListener(
    "click",
    event => {

      if (event.target === dialog) {

        closeProjectGallery();

      }

    }
  );

  // Mobile swipe

  stage.addEventListener(
    "pointerdown",
    event => {

     
if (
  event.pointerType === "mouse" ||
  event.target.closest(
    "button, a, video, iframe, .gallery-video-player"
  )
) return;


      pointerStart = {
        x: event.clientX,
        y: event.clientY
      };

    }
  );

  stage.addEventListener(
    "pointerup",
    event => {

      if (!pointerStart) return;

      const dx =
        event.clientX - pointerStart.x;

      const dy =
        event.clientY - pointerStart.y;

      pointerStart = null;

      if (
        Math.abs(dx) > 50 &&
        Math.abs(dx) > Math.abs(dy) * 1.5
      ) {

        showImage(
          currentIndex + (dx < 0 ? 1 : -1)
        );

      }

    }
  );

  stage.addEventListener(
    "pointercancel",
    () => {

      pointerStart = null;

    }
  );

  // Assemble lightbox

  if (items.length === 1) {

    previousButton.hidden = true;
    nextButton.hidden = true;
    thumbnails.hidden = true;

  }

  panel.append(
    header,
    stage,
    caption,
    thumbnails
  );

  dialog.appendChild(panel);

  document.body.appendChild(dialog);

  activeGallery = {
    dialog,
    trigger,
    closing: false,
    previousOverflow: document.body.style.overflow
  };

  document.body.style.overflow = "hidden";

  try {

    dialog.showModal();

  } catch (error) {

    closeProjectGallery(true);

    console.warn("Project gallery:", error);

    return;

  }

  showImage(0);

  requestAnimationFrame(() => {

    if (!activeGallery?.closing) {

      dialog.classList.add("is-open");

    }

  });

  closeButton.focus({
    preventScroll: true
  });

}

// Cover overlay

function attachProjectGallery(visual, project) {

  const items = getProjectGallery(project);

  if (!items.length) return;

  visual.classList.add("has-gallery");

  const overlay = create(
    "button",
    "work-gallery-overlay"
  );

  overlay.type = "button";

  overlay.setAttribute(
    "aria-label",
    `${galleryLabel("viewGallery")} — ${text(project.title)}`
  );

  overlay.setAttribute(
    "aria-haspopup",
    "dialog"
  );

  const content = create(
    "span",
    "work-gallery-content"
  );

  const icon = create(
    "span",
    "work-gallery-icon",
    "⊞"
  );

  icon.setAttribute("aria-hidden", "true");

  const label = create(
    "span",
    "work-gallery-label",
    galleryLabel("viewGallery")
  );

  const count = create(
    "span",
    "work-gallery-count",
    
`${items.length} ${items.some(
  item => item.type === "video"
) ? mediaLabel("media") : galleryLabel("images")}`

  );

  content.append(
    icon,
    label,
    count
  );

  overlay.appendChild(content);

  overlay.addEventListener(
    "click",
    () => openProjectGallery(
      project,
      overlay
    )
  );

  visual.appendChild(overlay);

}

// ==================================================
// END PROJECT GALLERY ENGINE
// ==================================================

  /* ==================================================
     08. PROJECT IMAGE COMPONENT
  ================================================== */

  function createProjectVisual(
    project,
    index
  ) {

    const visual = create(
      "div",
      "work-visual mask-reveal"
    );

    const placeholder = create(
      "div",
      "work-placeholder"
    );

    placeholder.setAttribute(
      "aria-hidden",
      "true"
    );

    placeholder.appendChild(

      create(
        "span",
        "work-placeholder-number",
        formatIndex(index)
      )

    );

    visual.appendChild(placeholder);

    const number = create(
      "span",
      "work-index",
      formatIndex(index)
    );

    number.setAttribute(
      "aria-hidden",
      "true"
    );

    visual.appendChild(number);

    if (validImage(project.image)) {

      const image = create(
        "img",
        "project-image"
      );

      image.alt = text(
        project.title,
        "Portfolio project"
      );

      image.loading = "lazy";

      image.decoding = "async";

      image.style.opacity = "0";

      function showImage() {

        image.style.opacity = "1";

        placeholder.hidden = true;

        visual.classList.add(
          "has-image"
        );

      }

      image.onload = showImage;

      image.onerror = () => {

        image.remove();

        placeholder.hidden = false;

        visual.classList.remove(
          "has-image"
        );

      };

      visual.insertBefore(
        image,
        number
      );

      image.src = project.image;

      if (
        image.complete &&
        image.naturalWidth > 0
      ) {

        showImage();

      }

    }

   attachProjectGallery(visual, project);
     
   return visual;

  }


  /* ==================================================
     09. PROJECT CARD COMPONENT
  ================================================== */

  function createProjectCard(
    project,
    index
  ) {

    const card = create(
      "article",
      "work-card reveal"
    );

    if (text(project.id)) {

      card.dataset.projectId =
        project.id;

    }

    card.appendChild(

      createProjectVisual(
        project,
        index
      )

    );

    const info = create(
      "div",
      "work-info"
    );

    const metadata = [

      text(project.category),

      text(project.meta)

    ].filter(Boolean);

    const uniqueMetadata = [
      ...new Set(metadata)
    ];

    appendText(
      info,
      "div",
      "work-meta",
      uniqueMetadata.join(" · ")
    );

    appendText(
      info,
      "h3",
      "work-title",
      text(
        project.title,
        "Untitled project"
      )
    );

    appendText(
      info,
      "p",
      "work-description",
      project.description
    );


    /* PROJECT ROLE */

    if (text(project.role)) {

      const role = create(
        "div",
        "work-role"
      );

      role.appendChild(

        create(
          "span",
          "work-role-label",
          "My role"
        )

      );

      role.appendChild(

        create(
          "span",
          "work-role-value",
          project.role
        )

      );

      info.appendChild(role);

    }


    /* RESULTS & ACHIEVEMENTS */

    if (text(project.results)) {

      const results = create(
        "div",
        "work-results"
      );

      results.appendChild(

        create(
          "span",
          "work-results-label",
          "Results & achievements"
        )

      );

      results.appendChild(

        create(
          "p",
          "",
          project.results
        )

      );

      info.appendChild(results);

    }


    /* PROJECT URL */

    const link = createExternalLink(
      "View project",
      project.link,
      "work-link"
    );

    if (link) {

      const footer = create(
        "div",
        "work-foot"
      );

      link.appendChild(
        createArrow()
      );

      footer.appendChild(link);

      info.appendChild(footer);

    }

    card.appendChild(info);

    return card;

  }


  /* ==================================================
     10. LEGACY PROJECT COMPATIBILITY

     Keep the current index.html working
     until the new frontend is deployed.
  ================================================== */

  function renderLegacyProjects(projects) {

    for (let index = 0; index < 4; index++) {

      const project = projects[index];

      const number = index + 1;

      const title = $(
        `project${number}Title`
      );

      if (!title) continue;

      const card = title.closest(
        ".work-card"
      );

      if (!card) continue;

      if (!project) {

        setVisible(card, false);

        continue;

      }

      setVisible(card, true);

      setText(
        `project${number}Title`,
        text(project.title)
      );

      setText(
        `project${number}Desc`,
        text(project.description)
      );

      if (text(project.meta)) {

        setText(
          `project${number}Meta`,
          project.meta
        );

      }

      const visual = card.querySelector(
        ".work-visual"
      );

      if (!visual) continue;

      visual.querySelectorAll(
        ".project-image"
      ).forEach(image => image.remove());

      visual.classList.remove(
        "has-image"
      );

      Array.from(
        visual.children
      ).forEach(child => {

        child.style.display = "";

      });

      if (!validImage(project.image)) {
        continue;
      }

      const image = create(
        "img",
        "project-image"
      );

      image.alt = text(
        project.title,
        "Portfolio project"
      );

      image.loading = "lazy";

      image.decoding = "async";

      image.style.opacity = "0";

      image.onload = () => {

        Array.from(
          visual.children
        ).forEach(child => {

          if (child !== image) {

            child.style.display =
              "none";

          }

        });

        image.style.opacity = "1";

        image.style.zIndex = "2";

        visual.classList.add(
          "has-image"
        );

      };

      image.onerror = () => {

        image.remove();

        visual.classList.remove(
          "has-image"
        );

        Array.from(
          visual.children
        ).forEach(child => {

          child.style.display = "";

        });

      };

      visual.prepend(image);

      image.src = project.image;

    }

  }


  /* ==================================================
     11. RENDER SELECTED WORK
  ================================================== */

  function renderProjects(data) {

    const projects = array(
      data.projects
    );

    const grid = $("projectsGrid");

    /*
       The new HTML will contain
       id="projectsGrid".

       Until then, use legacy rendering.
    */

    if (!grid) {

      renderLegacyProjects(projects);

      return;

    }

    const fragment =
      document.createDocumentFragment();

    projects.forEach(
      (project, index) => {

        fragment.appendChild(

          createProjectCard(
            project,
            index
          )

        );

      }
    );

    replaceContent(
      grid,
      fragment
    );

    setVisible(
      "work",
      projects.length > 0
    );

    setText(
      "projectCount",
      String(projects.length)
        .padStart(2, "0")
    );

  }


  /* ==================================================
     12. WORK EXPERIENCE
  ================================================== */

  function renderExperience(data) {

    const records = array(
      data.workExperience
    );

    const timeline =
      $("experienceTimeline");

    if (!timeline) return;

    const fragment =
      document.createDocumentFragment();

    records.forEach(record => {

      const item = create(
        "article",
        "timeline-item reveal"
      );

      const dot = create(
        "span",
        "timeline-dot"
      );

      dot.setAttribute(
        "aria-hidden",
        "true"
      );

      item.appendChild(dot);

      appendText(
        item,
        "div",
        "timeline-period",
        record.period
      );

      appendText(
        item,
        "h3",
        "timeline-company",
        record.company
      );

      appendText(
        item,
        "div",
        "timeline-position",
        record.position
      );

      appendText(
        item,
        "div",
        "timeline-location",
        record.location
      );

      appendText(
        item,
        "p",
        "timeline-description",
        record.description
      );

      fragment.appendChild(item);

    });

    replaceContent(
      timeline,
      fragment
    );

    setVisible(
      "experience",
      records.length > 0
    );

  }


  /* ==================================================
     13. CORE COMPETENCIES
  ================================================== */

  function renderCompetencies(data) {

    const groups = array(
      data.competencies
    );

    const grid =
      $("competenciesGrid");

    if (!grid) return;

    const fragment =
      document.createDocumentFragment();

    let count = 0;

    groups.forEach((group, index) => {

      const items = Array.isArray(
        group.items
      )
        ? group.items
            .map(item => text(item))
            .filter(Boolean)
        : [];

      if (
        !text(group.title) &&
        !items.length
      ) {
        return;
      }

      const card = create(
        "article",
        "competency-card reveal"
      );

      card.appendChild(

        create(
          "span",
          "competency-number",
          formatIndex(index)
        )

      );

      appendText(
        card,
        "h3",
        "competency-title",
        group.title
      );

      const list = create(
        "ul",
        "competency-list"
      );

      items.forEach(item => {

        list.appendChild(

          create(
            "li",
            "",
            item
          )

        );

      });

      card.appendChild(list);

      fragment.appendChild(card);

      count += 1;

    });

    replaceContent(
      grid,
      fragment
    );

    setVisible(
      "competencies",
      count > 0
    );

  }


  /* ==================================================
     14. TOOLS & PLATFORMS
  ================================================== */

  function renderTools(data) {

    const groups = array(data.tools);

    const grid = $("toolsGrid");

    if (!grid) return;

    const fragment =
      document.createDocumentFragment();

    let count = 0;

    groups.forEach(group => {

      const items = Array.isArray(
        group.items
      )
        ? group.items
            .map(item => text(item))
            .filter(Boolean)
        : [];

      if (
        !text(group.title) &&
        !items.length
      ) {
        return;
      }

      const card = create(
        "article",
        "tool-group reveal"
      );

      appendText(
        card,
        "h3",
        "tool-group-title",
        group.title
      );

      const cloud = create(
        "div",
        "tool-cloud"
      );

      items.forEach(item => {

        cloud.appendChild(

          create(
            "span",
            "tool-chip",
            item
          )

        );

      });

      card.appendChild(cloud);

      fragment.appendChild(card);

      count += 1;

    });

    replaceContent(
      grid,
      fragment
    );

    setVisible(
      "tools",
      count > 0
    );

  }


  /* ==================================================
     15. EDUCATION
  ================================================== */

  function renderEducation(data) {

    const records = array(
      data.education
    );

    const list = $("educationList");

    if (!list) return;

    const fragment =
      document.createDocumentFragment();

    records.forEach(record => {

      const item = create(
        "article",
        "credential-item"
      );

      appendText(
        item,
        "div",
        "credential-period",
        record.period
      );

      appendText(
        item,
        "h4",
        "credential-title",
        record.school
      );

      appendText(
        item,
        "div",
        "credential-subtitle",
        record.degree
      );

      appendText(
        item,
        "div",
        "credential-major",
        record.major
      );

      appendText(
        item,
        "p",
        "credential-description",
        record.description
      );

      fragment.appendChild(item);

    });

    replaceContent(
      list,
      fragment
    );

    setVisible(
      "educationPanel",
      records.length > 0
    );

  }


  /* ==================================================
     16. CERTIFICATIONS
  ================================================== */

  function renderCertifications(data) {

    const records = array(
      data.certifications
    );

    const list =
      $("certificationsList");

    if (!list) return;

    const fragment =
      document.createDocumentFragment();

    records.forEach(record => {

      const item = create(
        "article",
        "credential-item"
      );

      appendText(
        item,
        "div",
        "credential-date",
        record.date
      );

      appendText(
        item,
        "h4",
        "credential-title",
        record.title
      );

      appendText(
        item,
        "div",
        "credential-subtitle",
        record.issuer
      );

      appendText(
        item,
        "p",
        "credential-description",
        record.description
      );

      fragment.appendChild(item);

    });

    replaceContent(
      list,
      fragment
    );

    setVisible(
      "certificationsPanel",
      records.length > 0
    );

  }


  function renderCredentials(data) {

    renderEducation(data);

    renderCertifications(data);

    const hasEducation =
      array(data.education).length > 0;

    const hasCertifications =
      array(data.certifications).length > 0;

    setVisible(
      "credentials",
      hasEducation ||
      hasCertifications
    );

  }


  /* ==================================================
     17. CONTACT INFORMATION
  ================================================== */

  function createContactItem(
    label,
    value,
    href
  ) {

    const item = create(
      "div",
      "contact-item"
    );

    item.appendChild(

      create(
        "span",
        "contact-label",
        label
      )

    );

    const link = create(
      "a",
      "contact-value",
      value
    );

    link.href = href;

    item.appendChild(link);

    return item;

  }


  function renderContact(data) {

    const contact =
      data.contact &&
      typeof data.contact === "object"
        ? data.contact
        : {};

    setText(
      "contactHeadline",
      text(
        contact.headline,
        "Let's work together."
      )
    );

    setText(
      "contactDescription",
      text(contact.description)
    );

    const details =
      $("contactDetails");

    const email = text(contact.email);

    const phone = text(contact.phone);

    const validEmail =
      /^[^\s@?&#]+@[^\s@?&#]+\.[^\s@?&#]+$/
        .test(email);

    const cleanPhone = phone.replace(
      /[^\d+]/g,
      ""
    );

    const validPhone =
      /^\+?\d{5,20}$/.test(cleanPhone);

    if (details) {

      const fragment =
        document.createDocumentFragment();

      if (validEmail) {

        fragment.appendChild(

          createContactItem(
            "Email",
            email,
            `mailto:${email}`
          )

        );

      }

      if (validPhone) {

        fragment.appendChild(

          createContactItem(
            "Phone",
            phone,
            `tel:${cleanPhone}`
          )

        );

      }

      if (text(data.locationMeta)) {

        const location = create(
          "div",
          "contact-item"
        );

        location.appendChild(

          create(
            "span",
            "contact-label",
            "Location"
          )

        );

        location.appendChild(

          create(
            "span",
            "contact-value",
            data.locationMeta
          )

        );

        fragment.appendChild(location);

      }

      replaceContent(
        details,
        fragment
      );

    }

    renderSocialLinks(contact);

    const emailCTA = $("emailCTA");

    if (emailCTA) {

      if (validEmail) {

        emailCTA.href =
          `mailto:${email}`;

        setVisible(
          emailCTA,
          true
        );

      } else {

        emailCTA.removeAttribute(
          "href"
        );

        setVisible(
          emailCTA,
          false
        );

      }

    }

  }


  /* ==================================================
     18. SOCIAL LINKS
  ================================================== */

  function renderSocialLinks(contact) {

    const container =
      $("socialLinks");

    if (!container) return;

    const platforms = [

      ["linkedin", "LinkedIn"],

      ["website", "Website"],

      ["github", "GitHub"],

      ["behance", "Behance"],

      ["facebook", "Facebook"],

      ["instagram", "Instagram"],

      ["tiktok", "TikTok"],

      ["youtube", "YouTube"]

    ];

    const fragment =
      document.createDocumentFragment();

    let count = 0;

    platforms.forEach(
      ([key, label]) => {

        const link = createExternalLink(
          label,
          contact[key],
          "social-link"
        );

        if (!link) return;

        link.appendChild(
          createArrow()
        );

        fragment.appendChild(link);

        count += 1;

      }
    );

    replaceContent(
      container,
      fragment
    );

    setVisible(
      container,
      count > 0
    );

  }


  /* ==================================================
     19. CV DOWNLOAD
  ================================================== */

  function renderCV(data) {

    const available = validPDF(
      data.cvUrl
    );

    const links = $$(
      "[data-cv-download]"
    );

    links.forEach(link => {

      if (available) {

        link.href = data.cvUrl;

        link.setAttribute(
          "download",
          "Le-Ngoc-Thien-Bao-CV.pdf"
        );

        setVisible(link, true);

      } else {

        link.removeAttribute("href");

        link.removeAttribute(
          "download"
        );

        setVisible(link, false);

      }

    });

    setVisible(
      "cvBanner",
      available
    );

  }


  /* ==================================================
     20. MOBILE NAVIGATION
  ================================================== */

  function initMobileMenu() {

    const toggle = $("menuToggle");

    const menu = $("mobileMenu");

    if (!toggle || !menu) return;

    let isOpen = false;

    function setMenu(
      open,
      restoreFocus = false
    ) {

      isOpen = open;

      menu.classList.toggle(
        "open",
        open
      );

      document.body.classList.toggle(
        "menu-open",
        open
      );

      toggle.setAttribute(
        "aria-expanded",
        String(open)
      );

      menu.setAttribute(
        "aria-hidden",
        String(!open)
      );

      menu.inert = !open;

      if (open) {

        const firstLink =
          menu.querySelector(
            'a:not([hidden])'
          );

        firstLink?.focus();

      } else if (restoreFocus) {

        toggle.focus();

      }

    }

    setMenu(false);

    toggle.addEventListener(
      "click",
      () => setMenu(
        !isOpen,
        isOpen
      )
    );

    $$("a", menu).forEach(link => {

      link.addEventListener(
        "click",
        () => {

          setMenu(false);

          const href =
            link.getAttribute("href");

          if (
            href &&
            href.startsWith("#")
          ) {

            const target = $(
              href.slice(1)
            );

            if (target) {

              target.setAttribute(
                "tabindex",
                "-1"
              );

              target.focus({
                preventScroll: true
              });

            }

          }

        }
      );

    });

    document.addEventListener(
      "keydown",
      event => {

        if (
          event.key === "Escape" &&
          isOpen
        ) {

          setMenu(false, true);

        }

      }
    );

    window.addEventListener(
      "resize",
      () => {

        if (
          window.innerWidth >
            CONFIG.mobileBreakpoint &&
          isOpen
        ) {

          setMenu(false);

        }

      }
    );

  }


  /* ==================================================
     21. NAVIGATION VISIBILITY
  ================================================== */

  function updateNavigation() {

    $$("[data-nav-section]")
      .forEach(link => {

        const id =
          link.dataset.navSection;

        const section = $(id);

        if (!section) return;

        const visible =
          !section.hidden &&
          !section.classList.contains(
            "hidden"
          );

        setVisible(
          link,
          visible
        );

      });

  }


  /* ==================================================
     22. SCROLL PROGRESS
  ================================================== */

  function initScrollProgress() {

    const progress =
      $("scrollProgress");

    if (!progress) return;

    let ticking = false;

    function update() {

      const root =
        document.documentElement;

      const scrollable =
        root.scrollHeight -
        window.innerHeight;

      const percent =
        scrollable > 0
          ? (
              window.scrollY /
              scrollable
            ) * 100
          : 0;

      progress.style.width =
        `${Math.min(
          100,
          Math.max(0, percent)
        )}%`;

      ticking = false;

    }

    function requestUpdate() {

      if (ticking) return;

      ticking = true;

      requestAnimationFrame(update);

    }

    window.addEventListener(
      "scroll",
      requestUpdate,
      { passive: true }
    );

    window.addEventListener(
      "resize",
      requestUpdate
    );

    update();

  }


  /* ==================================================
     23. ACTIVE NAVIGATION
  ================================================== */

  function initActiveNavigation() {

    if (
      !("IntersectionObserver" in window)
    ) {
      return;
    }

    if (navigationObserver) {

      navigationObserver.disconnect();

    }

    const links = $$(
      "[data-nav-section]"
    );

    const sectionIds = [
      ...new Set(
        links.map(
          link =>
            link.dataset.navSection
        )
      )
    ];

    const sections = sectionIds

      .map(id => $(id))

      .filter(section =>
        section &&
        !section.hidden
      );

    if (!sections.length) return;

    navigationObserver =
      new IntersectionObserver(

        entries => {

          const visible = entries

            .filter(
              entry =>
                entry.isIntersecting
            )

            .sort(
              (a, b) =>
                b.intersectionRatio -
                a.intersectionRatio
            );

          if (!visible.length) return;

          const activeId =
            visible[0].target.id;

          links.forEach(link => {

            const active =
              link.dataset.navSection ===
              activeId;

            link.classList.toggle(
              "active",
              active
            );

            if (active) {

              link.setAttribute(
                "aria-current",
                "location"
              );

            } else {

              link.removeAttribute(
                "aria-current"
              );

            }

          });

        },

        {
          rootMargin:
            "-20% 0px -45% 0px",

          threshold: 0
        }

      );

    sections.forEach(section => {

      navigationObserver.observe(
        section
      );

    });

  }


  /* ==================================================
     24. SCROLL REVEAL ANIMATION
  ================================================== */

  function initRevealAnimations() {

    const elements = $$(

      ".reveal, " +
      ".reveal-left, " +
      ".reveal-right, " +
      ".mask-reveal"

    );

    if (revealObserver) {

      revealObserver.disconnect();

    }

    /*
       The old frontend has its own
       animation logic.

       Enable the new animation system
       only after the new HTML is deployed.
    */

    if (
      document.body.dataset.portfolioVersion
        !== "2"
    ) {

      return;

    }

    function showAll() {

      document.documentElement
        .classList.remove(
          "motion-ready"
        );

      elements.forEach(element => {

        element.classList.add(
          "is-visible"
        );

      });

    }

    if (
      reducedMotion.matches ||
      !("IntersectionObserver" in window)
    ) {

      showAll();

      return;

    }

    try {

      revealObserver =
        new IntersectionObserver(

          entries => {

            entries.forEach(entry => {

              if (
                !entry.isIntersecting
              ) {
                return;
              }

              const element =
                entry.target;

              element.classList.add(
                "is-visible"
              );

              revealObserver.unobserve(
                element
              );

            });

          },

          {
            threshold:
              CONFIG.animationThreshold,

            rootMargin:
              "0px 0px -4% 0px"
          }

        );

      elements.forEach(element => {

        const bounds =
          element.getBoundingClientRect();

        /*
           Avoid hiding content already
           visible in the viewport.
        */

        if (
          bounds.top <
            window.innerHeight &&
          bounds.bottom > 0
        ) {

          element.classList.add(
            "is-visible"
          );

        } else {

          revealObserver.observe(
            element
          );

        }

      });

      document.documentElement
        .classList.add(
          "motion-ready"
        );

    } catch (error) {

      console.warn(
        "Animation initialization:",
        error
      );

      showAll();

    }

  }


  /* ==================================================
     25. CONTENT STATUS
  ================================================== */

  function showContentStatus(
    message,
    error = false
  ) {

    const status = $("contentStatus");

    if (!status) return;

    status.textContent = message;

    status.classList.toggle(
      "error",
      error
    );

    setVisible(
      status,
      Boolean(message)
    );

  }


  /* ==================================================
     26. RENDER COMPLETE PORTFOLIO
  ================================================== */

  function renderPortfolio(data) {

    if (
      !data ||
      typeof data !== "object" ||
      Array.isArray(data)
    ) {

      throw new Error(
        "Invalid portfolio content."
      );

    }

    renderPersonal(data);

    renderHero(data);

    renderAbout(data);

    renderProjects(data);

    renderExperience(data);

    renderCompetencies(data);

    renderTools(data);

    renderCredentials(data);

    renderContact(data);

    renderCV(data);

    updateNavigation();

  }


  /* ==================================================
     27. FETCH CMS DATA
  ================================================== */

// ==================================================
// PORTFOLIO V2.1 - MULTILINGUAL ENGINE
// ==================================================

const LANGUAGE_KEY = "bao-portfolio-language";

let currentLanguage = "en";
let originalContent = null;

const staticTranslations = [

  // Navigation
  [".skip-link",
    "Skip to content",
    "Chuyển đến nội dung"],

  ['nav a[data-nav-section="about"]',
    "About", "Giới thiệu"],

  ['nav a[data-nav-section="work"]',
    "Selected work", "Dự án"],

  ['nav a[data-nav-section="experience"]',
    "Experience", "Kinh nghiệm"],

  ['nav a[data-nav-section="competencies"]',
    "Skills", "Kỹ năng"],

  ['nav a[data-nav-section="tools"]',
    "Tools", "Công cụ"],

  ['nav a[data-nav-section="credentials"]',
    "Education", "Học vấn"],

  ['nav a[data-nav-section="contact"]',
    "Contact", "Liên hệ"],

  [".nav-contact",
    "Let's connect", "Liên hệ"],

  // Hero
  [".hero-index",
    "Independent professional portfolio",
    "Hồ sơ năng lực cá nhân"],

  [".scroll-label",
    "Scroll to explore",
    "Cuộn để khám phá"],

  ["#heroPhotoLabel span:first-child",
    "Personal portfolio",
    "Portfolio cá nhân"],

  ["#heroPhotoLabel span:last-child",
    "Profile / 01",
    "Hồ sơ / 01"],

  // About
  ["#about .section-kicker",
    "01 / About me",
    "01 / Giới thiệu"],

  ["#aboutTitle",
    "Where marketing meets",
    "Nơi marketing kết hợp cùng"],

  ["#aboutTitle .accent",
    "technology.",
    "công nghệ."],

  ["#about .section-description",
    "A multidisciplinary approach to digital marketing, combining analytical thinking, creative execution and technical capabilities.",
    "Kết hợp tư duy phân tích, năng lực sáng tạo và nền tảng công nghệ trong triển khai digital marketing."],

  ["#about .about-card .eyebrow",
    "My approach",
    "Phương pháp làm việc"],

  ["#about .about-card h3",
    "Understand the goal. Read the signal. Make the next move.",
    "Hiểu mục tiêu. Phân tích dữ liệu. Đưa ra quyết định."],

  ["#about .about-card p",
    "Strategy, execution, measurement and continuous improvement.",
    "Chiến lược, thực thi, đo lường và liên tục tối ưu."],

  ["#about .work-role:nth-of-type(1) .work-role-label",
    "Professional experience",
    "Kinh nghiệm làm việc"],

  ["#about .work-role:nth-of-type(2) .work-role-label",
    "Based in",
    "Địa điểm"],

  // Selected work
  ["#work .section-kicker",
    "02 / Selected work",
    "02 / Dự án tiêu biểu"],

  ["#workTitle",
    "Campaign thinking,",
    "Từ chiến lược"],

  ["#workTitle .accent",
    "made visible.",
    "đến thực thi."],

  ["#work .section-description",
    "Selected projects across performance marketing, campaign optimization, creative production and digital experiences.",
    "Các dự án tiêu biểu về performance marketing, tối ưu chiến dịch, sản xuất nội dung và phát triển trải nghiệm số."],

  ["#work .section-number",
    "/ Selected projects",
    "/ Dự án tiêu biểu"],

  // Career journey
  ["#experience .section-kicker",
    "03 / Career journey",
    "03 / Hành trình nghề nghiệp"],

  ["#experienceTitle",
    "Experience that",
    "Kinh nghiệm"],

  ["#experienceTitle .accent",
    "connects.",
    "và phát triển."],

  ["#experience .section-description",
    "A professional journey across digital marketing, web development and creative execution.",
    "Hành trình phát triển chuyên môn trong digital marketing, phát triển website và sản xuất nội dung sáng tạo."],

  // Competencies
  ["#competencies .section-kicker",
    "04 / Core competencies",
    "04 / Năng lực chuyên môn"],

  ["#competenciesTitle",
    "What I bring",
    "Những giá trị"],

  ["#competenciesTitle .accent",
    "to the table.",
    "tôi mang lại."],

  ["#competencies .section-description",
    "A combination of marketing expertise, analytical capabilities, creative production and technical skills.",
    "Kết hợp chuyên môn marketing, năng lực phân tích, sản xuất nội dung và kỹ năng công nghệ."],

  // Tools
  ["#tools .section-kicker",
    "05 / Tools & platforms",
    "05 / Công cụ & nền tảng"],

  ["#toolsTitle",
    "The tools behind",
    "Công nghệ hỗ trợ"],

  ["#toolsTitle .accent",
    "the work.",
    "công việc."],

  ["#tools .section-description",
    "Advertising platforms, analytics, creative software and development technologies used across my work.",
    "Các nền tảng quảng cáo, công cụ phân tích, phần mềm sáng tạo và công nghệ phát triển website."],

  // Education
  ["#credentials .section-kicker",
    "06 / Education & credentials",
    "06 / Học vấn & chứng chỉ"],

  ["#credentialsTitle",
    "Built on",
    "Không ngừng"],

  ["#credentialsTitle .accent",
    "continuous learning.",
    "học hỏi."],

  ["#credentials .section-description",
    "Academic background and professional training supporting my marketing and technical capabilities.",
    "Nền tảng học vấn và đào tạo chuyên môn hỗ trợ năng lực marketing và công nghệ."],

  ["#educationPanel .credential-panel-title",
    "Education",
    "Học vấn"],

  ["#certificationsPanel .credential-panel-title",
    "Certifications & Training",
    "Chứng chỉ & đào tạo"],

  // CV
  ["#cvBanner .eyebrow",
    "Curriculum vitae",
    "Hồ sơ nghề nghiệp"],

  ["#cvTitle",
    "Beyond the portfolio.",
    "Tìm hiểu thêm về tôi."],

  ["#cvBanner .cv-banner-content p",
    "Download my CV for a complete overview of my professional experience, education and technical capabilities.",
    "Tải CV để xem đầy đủ kinh nghiệm làm việc, học vấn và năng lực chuyên môn của tôi."],

  ["[data-cv-download]",
    "Download CV",
    "Tải CV"],

  ["#experience [data-cv-download]",
    "Download full CV",
    "Tải CV đầy đủ"],

  // Contact
  ["#contact .section-kicker",
    "07 / Get in touch",
    "07 / Liên hệ"],

  ["#emailCTA",
    "Send me an email",
    "Gửi email cho tôi"],

  // Footer
  [".footer-copy",
    "· Personal portfolio",
    "· Portfolio cá nhân"],

  [".back-to-top",
    "Back to top",
    "Về đầu trang"]

];


// Preserve icons, accent spans and other HTML elements

function replaceDirectText(element, value) {

  const nodes = Array.from(element.childNodes)
    .filter(node =>
      node.nodeType === Node.TEXT_NODE &&
      node.textContent.trim()
    );

  if (!nodes.length) {

    element.prepend(
      document.createTextNode(value + " ")
    );

    return;

  }

  nodes[0].textContent = " " + value + " ";

  nodes.slice(1).forEach(node => {
    node.textContent = "";
  });

}


// Apply static interface translations

function applyStaticTranslations() {

  const isVI = currentLanguage === "vi";

  staticTranslations.forEach(
    ([selector, en, vi]) => {

      $$(selector).forEach(element => {

        replaceDirectText(
          element,
          isVI ? vi : en
        );

      });

    }
  );

  // Preserve copyright symbol and year

  const footer = document.querySelector(".footer-copy");

  if (footer && $("footerYear")) {

    const year = $("footerYear");

    footer.replaceChildren(
      document.createTextNode("© "),
      year,
      document.createTextNode(
        isVI
          ? " · Portfolio cá nhân"
          : " · Personal portfolio"
      )
    );

  }

  document.documentElement.lang =
    currentLanguage;

  const attributes = [

    [".brand", "aria-label",
      "Portfolio home",
      "Trang chủ Portfolio"],

    [".nav-links", "aria-label",
      "Main navigation",
      "Điều hướng chính"],

    ["#mobileMenu", "aria-label",
      "Mobile navigation",
      "Điều hướng di động"],

    ["#menuToggle", "aria-label",
      "Toggle navigation menu",
      "Mở hoặc đóng menu"],

    [".language-switcher", "aria-label",
      "Language selection",
      "Chọn ngôn ngữ"]

  ];

  attributes.forEach(
    ([selector, attribute, en, vi]) => {

      $$(selector).forEach(element => {

        element.setAttribute(
          attribute,
          isVI ? vi : en
        );

      });

    }
  );

}


// Merge translated fields with original content

function mergeTranslatedFields(base, translated, fields) {

  const result = { ...base };

  fields.forEach(key => {

    const value = translated?.[key];

    if (
      typeof value === "string" &&
      value.trim()
    ) {

      result[key] = value;

    }

  });

  return result;

}


// Match translated records by their original IDs

function mergeTranslatedRecords(
  originals,
  translations,
  fields,
  translateItems = false
) {

  const translatedMap = new Map(
    array(translations).map(item => [
      item.id,
      item
    ])
  );

  return array(originals).map(item => {

    const translated = translatedMap.get(item.id);

    if (!translated) return { ...item };

    const result = mergeTranslatedFields(
      item,
      translated,
      fields
    );

    if (
      translateItems &&
      Array.isArray(translated.items) &&
      translated.items.length
    ) {

      result.items = translated.items;

    }

    return result;

  });

}


// Build localized CMS content

function getLocalizedContent(data) {

  if (currentLanguage !== "vi") {

    return data;

  }

  const vi = data.translations?.vi || {};

  const localized = mergeTranslatedFields(
    data,
    vi,
    [
      "heroKicker",
      "heroHeadline",
      "heroLead",
      "heroPrimaryCTA",
      "heroSecondaryCTA",
      "jobTitle",
      "experienceMeta",
      "locationMeta"
    ]
  );

  const dictionary =
    window.PORTFOLIO_TRANSLATIONS?.vi;

  localized.heroPrimaryCTA = text(
    vi.heroPrimaryCTA,
    dictionary?.hero?.primaryCTA ||
      "Khám phá dự án"
  );

  localized.heroSecondaryCTA = text(
    vi.heroSecondaryCTA,
    dictionary?.hero?.secondaryCTA ||
      "Tìm hiểu về tôi"
  );

    localized.projects = mergeTranslatedRecords(
    data.projects,
    vi.projects,
    [
      "title",
      "description",
      "meta",
      "category",
      "role",
      "results"
    ]
  ).map(project => {

    const translatedProject = array(
      vi.projects
    ).find(
      item => item.id === project.id
    );

    return {

      ...project,

      gallery: mergeTranslatedRecords(
        project.gallery,
        translatedProject?.gallery,
        [
          "title",
          "description"
        ]
      )

    };

  });

  localized.workExperience = mergeTranslatedRecords(
    data.workExperience,
    vi.workExperience,
    [
      "position",
      "period",
      "location",
      "description"
    ]
  );

  localized.competencies = mergeTranslatedRecords(
    data.competencies,
    vi.competencies,
    ["title"],
    true
  );

  localized.tools = mergeTranslatedRecords(
    data.tools,
    vi.tools,
    ["title"]
  );

  localized.education = mergeTranslatedRecords(
    data.education,
    vi.education,
    [
      "school",
      "degree",
      "major",
      "period",
      "description"
    ]
  );

  localized.certifications = mergeTranslatedRecords(
    data.certifications,
    vi.certifications,
    [
      "title",
      "date",
      "description"
    ]
  );

  localized.contact = mergeTranslatedFields(
    data.contact || {},
    vi.contact,
    ["headline", "description"]
  );

  return localized;

}


// Translate dynamically generated interface labels

function translateDynamicLabels() {

  const dictionary =
    window.PORTFOLIO_TRANSLATIONS?.[currentLanguage];

  if (!dictionary) return;

  const labels = [

    ["#work .work-role-label",
      dictionary.work.role],

    ["#work .work-results-label",
      dictionary.work.results],

    ["#work .work-link",
      dictionary.work.viewProject]

  ];

  labels.forEach(([selector, value]) => {

    if (!value) return;

    $$(selector).forEach(element => {

      replaceDirectText(element, value);

    });

  });

  const contactLabels = {
    Email: dictionary.contact.email,
    Phone: dictionary.contact.phone,
    Location: dictionary.contact.location
  };

  $$("#contactDetails .contact-label")
    .forEach(element => {

      const label = element.textContent.trim();

      if (contactLabels[label]) {

        element.textContent = contactLabels[label];

      }

    });

  const avatar = $("heroAvatar");

  if (avatar && originalContent) {

    avatar.alt =
      originalContent.name +
      (currentLanguage === "vi"
        ? " — Ảnh chân dung"
        : " — Profile portrait");

  }

}


// Synchronize desktop and mobile buttons

function updateLanguageButtons() {

  $$("[data-language]").forEach(button => {

    const active =
      button.dataset.language === currentLanguage;

    button.classList.toggle(
      "is-active",
      active
    );

    button.setAttribute(
      "aria-pressed",
      String(active)
    );

  });

}


// Render portfolio in the selected language

function renderLocalizedPortfolio() {

  if (originalContent) {

    const localized =
      getLocalizedContent(originalContent);

    renderPortfolio(localized);

    translateDynamicLabels();

  }

  applyStaticTranslations();

  updateLanguageButtons();

}


// Change language without reloading the page

function setLanguage(language) {

  if (!["en", "vi"].includes(language)) return;

  if (language === currentLanguage) return;

  closeProjectGallery(true);

  currentLanguage = language;

  try {

    localStorage.setItem(
      LANGUAGE_KEY,
      language
    );

  } catch (error) {

    console.warn(
      "Language preference:",
      error
    );

  }

  renderLocalizedPortfolio();

  initRevealAnimations();

  initActiveNavigation();

}

// Initialize language controls

function initLanguageSwitcher() {

  try {

    const saved = localStorage.getItem(
      LANGUAGE_KEY
    );

    currentLanguage =
      saved === "vi" ? "vi" : "en";

  } catch {

    currentLanguage = "en";

  }

  $$("[data-language]").forEach(button => {

    button.addEventListener("click", () => {

      setLanguage(button.dataset.language);

    });

  });

  updateLanguageButtons();

  applyStaticTranslations();

}

// ==================================================
// END MULTILINGUAL ENGINE
// ==================================================


  async function loadPortfolio() {

    try {

      const response = await fetch(
        CONFIG.api,
        {
          method: "GET",
          cache: "no-store",
          headers: {
            Accept: "application/json"
          }
        }
      );

      if (!response.ok) {

        throw new Error(
          `CMS request failed: ${response.status}`
        );

      }

      const data =
  await response.json();

originalContent = data;

renderLocalizedPortfolio();

showContentStatus("");

    } catch (error) {

      console.warn(
        "Portfolio CMS:",
        error
      );

      showContentStatus(
        "Some portfolio content is temporarily unavailable. Please try again later.",
        true
      );

    } finally {

      initRevealAnimations();

      initActiveNavigation();

    }

  }


  /* ==================================================
     28. APPLICATION INITIALIZATION
  ================================================== */

  function init() {

  initMobileMenu();

  initScrollProgress();

  initLanguageSwitcher();

  loadPortfolio();

    if (
      typeof reducedMotion
        .addEventListener === "function"
    ) {

      reducedMotion.addEventListener(
        "change",
        initRevealAnimations
      );

    }

  }


  if (
    document.readyState === "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      init,
      { once: true }
    );

  } else {

    init();

  }

})();


/* ==================================================
   END OF PORTFOLIO V2 JAVASCRIPT
================================================== */
